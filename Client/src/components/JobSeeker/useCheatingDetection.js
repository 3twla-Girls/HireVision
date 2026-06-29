import { useEffect, useRef, useState, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import api from "../../api/axios";
// ─────────────────────────────────────────────────────────────
//  HEAD POSE THRESHOLDS
// ─────────────────────────────────────────────────────────────
const HEAD_THRESH = {
  YAW_LEFT:   -3.4,
  YAW_RIGHT:   4.3,
  PITCH_DOWN: -4.0,  // requires deliberate dip, not a natural nod
  PITCH_UP:    6.5,
};

// ─────────────────────────────────────────────────────────────
//  GAZE CALIBRATION CONFIG
// ─────────────────────────────────────────────────────────────
const GAZE_H_MARGIN    = 0.14;  // horizontal tolerance around personal neutral
const GAZE_V_MARGIN    = 0.10;  // vertical tolerance around personal neutral
const SMOOTHING_FRAMES = 20;    // frames to average — absorbs blinks & micro-movements
const CALIB_SECONDS    = 3;     // how long the calibration phase lasts
const CALIB_MIN_FRAMES = 10;    // minimum samples needed for valid calibration
const FALLBACK_NEUTRAL = { h: 0.50, v: 0.49 };

// ─────────────────────────────────────────────────────────────
//  TIMING
// ─────────────────────────────────────────────────────────────
const BAR_START_SEC      = 3;   // amber bar appears after 3s away
const LOOK_AWAY_WARN_SEC = 5;   // warning fires after 5s away
const LOOK_AWAY_LOG_SEC  = 2;   // event logged after 2s away

// ─────────────────────────────────────────────────────────────
//  LANDMARK INDICES
// ─────────────────────────────────────────────────────────────
const LEFT_IRIS       = 468;
const RIGHT_IRIS      = 473;
const LEFT_EYE_INNER  = 133;
const LEFT_EYE_OUTER  = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const LEFT_EYE_TOP    = 159;
const LEFT_EYE_BOT    = 145;
const RIGHT_EYE_TOP   = 386;
const RIGHT_EYE_BOT   = 374;

// ─────────────────────────────────────────────────────────────
//  MATH HELPERS
// ─────────────────────────────────────────────────────────────

function getHeadDirection(landmarks) {
  const noseTip  = landmarks[1];
  const leftEye  = landmarks[33];
  const rightEye = landmarks[263];
  const chin     = landmarks[199];

  const eyeMidX    = (leftEye.x + rightEye.x) / 2;
  const eyeMidY    = (leftEye.y + rightEye.y) / 2;
  const eyeSpan    = Math.abs(rightEye.x - leftEye.x);
  const faceHeight = Math.abs(chin.y - eyeMidY);

  if (eyeSpan < 0.001 || faceHeight < 0.001)
    return { dir: "Forward", yaw: 0, pitch: 0 };

  const yaw   = ((noseTip.x - eyeMidX) / eyeSpan)     * 8;
  const pitch = ((eyeMidY   - noseTip.y) / faceHeight) * 10;

  const h = yaw   < HEAD_THRESH.YAW_LEFT   ? "Left"
          : yaw   > HEAD_THRESH.YAW_RIGHT  ? "Right" : "Forward";
  const v = pitch < HEAD_THRESH.PITCH_DOWN ? "Down"
          : pitch > HEAD_THRESH.PITCH_UP   ? "Up"    : "Forward";

  if (h === "Forward" && v === "Forward") return { dir: "Forward", yaw, pitch };
  const parts = [];
  if (v !== "Forward") parts.push(v);
  if (h !== "Forward") parts.push(h);
  return { dir: parts.join(" "), yaw, pitch };
}

function irisHRatio(lm, innerIdx, outerIdx, irisIdx) {
  const inner = lm[innerIdx].x;
  const outer = lm[outerIdx].x;
  const iris  = lm[irisIdx].x;
  const eyeW  = Math.abs(inner - outer);
  if (eyeW < 0.001) return 0.5;
  return (iris - Math.min(inner, outer)) / eyeW;
}

function irisVRatio(lm, topIdx, botIdx, irisIdx) {
  const top  = lm[topIdx].y;
  const bot  = lm[botIdx].y;
  const iris = lm[irisIdx].y;
  const eyeH = Math.abs(bot - top);
  if (eyeH < 0.001) return 0.5;
  return (iris - Math.min(top, bot)) / eyeH;
}

function getRawGaze(lm) {
  const leftH  = irisHRatio(lm, LEFT_EYE_INNER,  LEFT_EYE_OUTER,  LEFT_IRIS);
  const rightH = irisHRatio(lm, RIGHT_EYE_INNER, RIGHT_EYE_OUTER, RIGHT_IRIS);
  const leftV  = irisVRatio(lm, LEFT_EYE_TOP, LEFT_EYE_BOT, LEFT_IRIS);
  const rightV = irisVRatio(lm, RIGHT_EYE_TOP, RIGHT_EYE_BOT, RIGHT_IRIS);
  return {
    avgH: (leftH + rightH) / 2,
    avgV: (leftV + rightV) / 2,
  };
}

function ratiosToDirection(avgH, avgV, hLow, hHigh, vLow, vHigh) {
  const h = avgH < hLow  ? "Left"  : avgH > hHigh ? "Right" : "Forward";
  const v = avgV < vLow  ? "Up"    : avgV > vHigh  ? "Down"  : "Forward";
  if (h === "Forward" && v === "Forward") return "Forward";
  const parts = [];
  if (v !== "Forward") parts.push(v);
  if (h !== "Forward") parts.push(h);
  return parts.join(" ");
}

/**
 * CHEATING RULES:
 * 1. Head DOWN (any angle)         → always cheating (notes/phone/screen below)
 * 2. Head forward + gaze away      → cheating (sneaky glance)
 * 3. Head away + gaze forward      → NOT cheating (eyes compensating)
 * 4. Head away + gaze same dir     → cheating
 * 5. Head away + gaze opposite dir → NOT cheating (eyes correcting back)
 */
function isLookingAway(headDir, gazeDir) {
  if (headDir.includes("Down")) return true;

  // ── QUESTION PANEL EXCEPTION ───────────────────────────────
  // The question is displayed on the left side of the screen, so
  // any leftward gaze (eyes or head) is legitimate reading behaviour
  // and must never be flagged as cheating.
  if (gazeDir.includes("Left")) return false;
  if (headDir.includes("Left")) return false;
  // ───────────────────────────────────────────────────────────

  const headFwd = headDir === "Forward";
  const gazeFwd = gazeDir === "Forward";

  if (!headFwd && gazeFwd)  return false;
  if (headFwd  && !gazeFwd) return true;
  if (headFwd  && gazeFwd)  return false;

  const headH = headDir.includes("Right") ? "Right" : null;  // Left already excluded above
  const headV = headDir.includes("Up")    ? "Up"    : null;
  const gazeH = gazeDir.includes("Right") ? "Right" : null;
  const gazeV = gazeDir.includes("Up")    ? "Up"    : null;

  return (headH !== null && headH === gazeH) || (headV !== null && headV === gazeV);
}

function median(arr) {
  if (arr.length === 0) return 0.5;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─────────────────────────────────────────────────────────────
//  THE HOOK
// ─────────────────────────────────────────────────────────────

export function useCheatingDetection({
  videoRef,
  enabled     = true,
  sessionId   = null,
  interviewId = null,
  onWarning   = null,
}) {
  const [isReady,          setIsReady]          = useState(false);
  const [isCalibrating,    setIsCalibrating]    = useState(false);
  const [calibProgress,    setCalibProgress]    = useState(0);
  const [status,           setStatus]           = useState("loading");
  const [warningCount,     setWarningCount]      = useState(0);
  const [warningLevel,     setWarningLevel]      = useState(0);
  const [selfCorrected,    setSelfCorrected]     = useState(false);
  const [headDir,          setHeadDir]           = useState("Forward");
  const [gazeDir,          setGazeDir]           = useState("Forward");
  const [lookAwayProgress, setLookAwayProgress]  = useState(0);

  // Detection refs
  const landmarkerRef    = useRef(null);
  const rafRef           = useRef(null);
  const warningCountRef  = useRef(0);
  const lookAwayStartRef = useRef(null);
  const currentlyAwayRef = useRef(false);
  const logged2sRef      = useRef(false);
  const warnFiredRef     = useRef(false);
  const sessionStartRef  = useRef(null);
  const eventsLogRef     = useRef([]);      // accumulates all events in memory

  // Calibration refs
  const calibDoneRef  = useRef(false);
  const calibStartRef = useRef(null);
  const calibHSamples = useRef([]);
  const calibVSamples = useRef([]);
  const threshRef     = useRef(null);

  // Smoothing buffers
  const hBuf = useRef([]);
  const vBuf = useRef([]);

  //face authntication
  useEffect(() => {
    if (!enabled || !isReady || !sessionId || isCalibrating) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");

        try {
          const response = await api.post(`/proctoring/session/frame/${sessionId}`, formData);
          console.log("Face Authntication:", response)
        } catch (err) {
          console.error("[FaceAuth] Frame send failed");
        }
      }, "image/jpeg", 0.7);
    }, 10000);

    return () => clearInterval(interval);
  }, [enabled, isReady, sessionId, isCalibrating, videoRef]);

  // ── Model load ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "/face_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        if (!cancelled) {
          landmarkerRef.current   = landmarker;
          sessionStartRef.current = Date.now();
          eventsLogRef.current    = [];
          setIsReady(true);
          setIsCalibrating(true);
          setStatus("calibrating");
        }
      } catch (err) {
        console.error("[useCheatingDetection] Model load failed:", err);
        if (!cancelled) setStatus("error");
      }
    }
    loadModel();
    return () => { cancelled = true; };
  }, []);

  // ── mm:ss — time elapsed since interview started ──────────────
  const toMinSec = useCallback(() => {
    const totalSec = Math.floor((Date.now() - (sessionStartRef.current ?? Date.now())) / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  // ── Store event in memory (no live network calls) ─────────────
  const logEvent = useCallback((entry) => {
    if (onWarning) onWarning(entry);
    eventsLogRef.current.push(entry);
  }, [onWarning]);

  // ── Send full log to FastAPI at end of interview ──────────────
  const postSummary = useCallback(async () => {
    const events        = eventsLogRef.current;
    const totalWarnings = events.filter(e => e.type === "warning").length;
    const totalDuration = +events
      .reduce((sum, e) => sum + (e.duration ?? 0), 0)
      .toFixed(1);

    if (!sessionId) return;

    try {
      await api.post("/eye-gaze-cheating/cheating-log", {
        session_id:     sessionId,
        interview_id:   interviewId ?? null,
        total_warnings: totalWarnings,
        total_duration: totalDuration,
        events: events.map(e => ({
          type:           e.type,
          at:             e.at,
          duration:       e.duration,
          head_dir:       e.headDir        ?? null,
          gaze_dir:       e.gazeDir        ?? null,
          warning_number: e.warningNumber  ?? undefined,
        })),
      });

      console.log(`[useCheatingDetection] Summary sent — ${totalWarnings} warnings, ${totalDuration}s total`);
    } catch (err) {
      console.warn("[useCheatingDetection] Summary POST failed:", err.response?.data || err.message);
    }
  }, [sessionId, interviewId]);

  // ── Detection loop ────────────────────────────────────────────
  useEffect(() => {
    // ── DISABLED: stop RAF immediately and reset all transient state ──
    if (!isReady || !enabled) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Reset look-away timers so they don't carry over to the next question
      currentlyAwayRef.current = false;
      lookAwayStartRef.current = null;
      logged2sRef.current      = false;
      warnFiredRef.current     = false;
      hBuf.current             = [];
      vBuf.current             = [];
      setHeadDir("Forward");
      setGazeDir("Forward");
      setWarningLevel(0);
      setLookAwayProgress(0);
      setStatus(isReady ? "focused" : "loading");
      return;
    }

    let lastVideoTime = -1;

    function detect() {
      rafRef.current = requestAnimationFrame(detect);

      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused) return;
      if (video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;

      const now_ms  = performance.now();
      const now_sec = now_ms / 1000;
      const result  = landmarkerRef.current.detectForVideo(video, now_ms);
      const lm      = result.faceLandmarks?.[0] ?? null;

      // ── CALIBRATION PHASE ──────────────────────────────────────
      if (!calibDoneRef.current) {
        if (!calibStartRef.current) calibStartRef.current = now_sec;

        const elapsed  = now_sec - calibStartRef.current;
        const progress = Math.min(elapsed / CALIB_SECONDS, 1);
        setCalibProgress(progress);

        if (lm) {
          const { avgH, avgV } = getRawGaze(lm);
          calibHSamples.current.push(avgH);
          calibVSamples.current.push(avgV);
        }

        if (elapsed >= CALIB_SECONDS) {
          const hSamples = calibHSamples.current;
          const vSamples = calibVSamples.current;

          const neutralH = hSamples.length >= CALIB_MIN_FRAMES
            ? median(hSamples) : FALLBACK_NEUTRAL.h;
          const neutralV = vSamples.length >= CALIB_MIN_FRAMES
            ? median(vSamples) : FALLBACK_NEUTRAL.v;

          threshRef.current = {
            hLow:  neutralH - GAZE_H_MARGIN,
            hHigh: neutralH + GAZE_H_MARGIN,
            vLow:  neutralV - GAZE_V_MARGIN,
            vHigh: neutralV + GAZE_V_MARGIN,
          };

          console.log(
            `[useCheatingDetection] Calibrated — ` +
            `H:${neutralH.toFixed(3)} V:${neutralV.toFixed(3)} | ` +
            `samples: ${hSamples.length}`
          );

          calibDoneRef.current = true;
          setIsCalibrating(false);
          setStatus("focused");
        }

        return;
      }

      // ── NORMAL DETECTION ───────────────────────────────────────
      const { hLow, hHigh, vLow, vHigh } = threshRef.current;

      let hDir = "Forward";
      let gDir = "Forward";
      let away = false;

      if (lm) {
        hDir = getHeadDirection(lm).dir;

        const { avgH, avgV } = getRawGaze(lm);
        hBuf.current.push(avgH);
        vBuf.current.push(avgV);
        if (hBuf.current.length > SMOOTHING_FRAMES) hBuf.current.shift();
        if (vBuf.current.length > SMOOTHING_FRAMES) vBuf.current.shift();

        const smoothH = hBuf.current.reduce((a, b) => a + b, 0) / hBuf.current.length;
        const smoothV = vBuf.current.reduce((a, b) => a + b, 0) / vBuf.current.length;

        gDir = ratiosToDirection(smoothH, smoothV, hLow, hHigh, vLow, vHigh);
        away = isLookingAway(hDir, gDir);
      } else {
        away = true;
        hDir = "No Face";
        gDir = "No Face";
        hBuf.current = [];
        vBuf.current = [];
      }

      setHeadDir(hDir);
      setGazeDir(gDir);
      setStatus(away ? (hDir === "No Face" ? "no_face" : "away") : "focused");

      // ── Nudge-ladder timer ─────────────────────────────────────
      if (away) {
        setSelfCorrected(false);

        if (!currentlyAwayRef.current) {
          lookAwayStartRef.current = now_sec;
          currentlyAwayRef.current = true;
          logged2sRef.current      = false;
          warnFiredRef.current     = false;
          setWarningLevel(0);
        } else {
          const elapsed   = now_sec - lookAwayStartRef.current;
          const barWindow = LOOK_AWAY_WARN_SEC - BAR_START_SEC;
          const progress  = elapsed < BAR_START_SEC
                          ? 0
                          : Math.min((elapsed - BAR_START_SEC) / barWindow, 1);
          setLookAwayProgress(progress);

          if (elapsed >= BAR_START_SEC && !warnFiredRef.current) {
            setWarningLevel(1);
          }

          // Log event at 2s (stored in memory only)
          if (elapsed >= LOOK_AWAY_LOG_SEC && !logged2sRef.current) {
            logged2sRef.current = true;
            logEvent({
              type:     "log_event",
              at:       toMinSec(),
              duration: +elapsed.toFixed(1),
              headDir:  hDir,
              gazeDir:  gDir,
            });
          }

          // Warning at 5s (stored in memory only)
          if (elapsed >= LOOK_AWAY_WARN_SEC && !warnFiredRef.current) {
            warnFiredRef.current    = true;
            warningCountRef.current += 1;
            const wNum  = warningCountRef.current;
            setWarningCount(wNum);

            const level = wNum <= 2 ? 2 : 3;
            setWarningLevel(level);

            logEvent({
              type:          "warning",
              at:            toMinSec(),
              duration:      +elapsed.toFixed(1),
              headDir:       hDir,
              gazeDir:       gDir,
              warningNumber: wNum,
            });

            lookAwayStartRef.current = now_sec;
            logged2sRef.current      = false;
            warnFiredRef.current     = false;
          }
        }
      } else {
        if (currentlyAwayRef.current) {
          setSelfCorrected(true);
          Promise.resolve().then(() => setSelfCorrected(false));
        }
        currentlyAwayRef.current = false;
        lookAwayStartRef.current = null;
        logged2sRef.current      = false;
        warnFiredRef.current     = false;
        setWarningLevel(0);
        setLookAwayProgress(0);
      }
    }

    rafRef.current = requestAnimationFrame(detect);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isReady, enabled, videoRef, logEvent, toMinSec]);

  return {
    isReady,
    isCalibrating,
    calibProgress,
    status,
    warningCount,
    warningLevel,
    selfCorrected,
    headDir,
    gazeDir,
    lookAwayProgress,
    postSummary,        // ← call this when interview ends
  };
}