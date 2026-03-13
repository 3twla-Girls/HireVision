import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Mic, MicOff, Timer,
         ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCheatingDetection } from '../../components/JobSeeker/useCheatingDetection';

// ─────────────────────────────────────────────────────────────
//  VIDEO GLOW — shifts border colour as look-away timer grows
// ─────────────────────────────────────────────────────────────
function getVideoGlowStyle(progress) {
  if (progress <= 0) return {
    border: "4px solid white",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    transition: "box-shadow 600ms ease, border-color 600ms ease",
  };
  if (progress < 0.5) {
    const i = progress * 2;
    return {
      border: "4px solid #fbbf24",
      boxShadow: `0 20px 50px rgba(0,0,0,0.2), 0 0 ${12 + i * 16}px rgba(251,191,36,${0.3 + i * 0.35})`,
      transition: "box-shadow 300ms ease, border-color 300ms ease",
    };
  }
  if (progress < 0.8) {
    const i = (progress - 0.5) / 0.3;
    return {
      border: "4px solid #f97316",
      boxShadow: `0 20px 50px rgba(0,0,0,0.2), 0 0 ${28 + i * 14}px rgba(249,115,22,${0.55 + i * 0.2})`,
      transition: "box-shadow 200ms ease, border-color 200ms ease",
    };
  }
  return {
    border: "4px solid #ef4444",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2), 0 0 44px rgba(239,68,68,0.75), 0 0 88px rgba(239,68,68,0.3)",
    transition: "box-shadow 150ms ease, border-color 150ms ease",
  };
}

// ─────────────────────────────────────────────────────────────
//  CALIBRATION OVERLAY
//  Shown on top of the video for 3 seconds at start.
//  Driven by calibProgress (0-1) from the hook.
// ─────────────────────────────────────────────────────────────
const CALIB_SEC = 3;

function CalibrationOverlay({ isCalibrating, calibProgress }) {
  const remaining  = Math.max(CALIB_SEC * (1 - calibProgress), 0);
  const circumf    = 2 * Math.PI * 36;
  const strokeDash = circumf * (1 - calibProgress);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-3xl overflow-hidden"
      style={{
        background:     "rgba(10,15,30,0.82)",
        backdropFilter: "blur(4px)",
        opacity:        isCalibrating ? 1 : 0,
        transition:     "opacity 600ms ease",
        pointerEvents:  isCalibrating ? "auto" : "none",
      }}
    >
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90 mb-4">
        <circle cx="44" cy="44" r="36" fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
        <circle cx="44" cy="44" r="36" fill="none"
          stroke="#60a5fa" strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumf}
          strokeDashoffset={strokeDash}
          style={{ transition: "stroke-dashoffset 100ms linear" }}
        />
      </svg>
      <p className="text-white text-base font-bold mb-1 tracking-wide">
        Look straight at the camera
      </p>
      <p className="text-blue-200 text-xs">
        Calibrating… {remaining.toFixed(1)}s
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CAMERA FOCUS PILL — level 1 nudge (3s–5s away)
//  Floats just above the video, colour shifts amber→orange→red
// ─────────────────────────────────────────────────────────────
function CameraFocusPill({ progress }) {
  const visible = progress > 0;
  const bg      = progress < 0.5 ? "rgba(245,158,11,0.92)"
                : progress < 0.8 ? "rgba(249,115,22,0.92)"
                :                  "rgba(239,68,68,0.92)";
  const shadow  = progress < 0.5 ? "0 2px 12px rgba(245,158,11,0.4)"
                : progress < 0.8 ? "0 2px 12px rgba(249,115,22,0.45)"
                :                  "0 2px 12px rgba(239,68,68,0.5)";

  return (
    <div
      aria-live="polite"
      className="flex justify-center pointer-events-none"
      style={{
        opacity:      visible ? 1 : 0,
        transform:    visible ? "translateY(0)" : "translateY(6px)",
        transition:   "opacity 400ms ease, transform 400ms ease",
        marginBottom: "-2px",
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-bold tracking-wide"
        style={{ background: bg, boxShadow: shadow }}
      >
        <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse shrink-0" />
        Look at the camera
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  NUDGE TOAST — level 2 (1st and 2nd warning)
//  Small card inside the video, top-centre, auto-dismisses
// ─────────────────────────────────────────────────────────────
const AUTO_DISMISS_MS = 4000;
const MIN_SHOW_MS     = 2500;

function NudgeToast({ warningCount, selfCorrected, visible }) {
  const [shown,      setShown]  = useState(false);
  const autoTimerRef = useRef(null);
  const shownAtRef   = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setShown(true);
    shownAtRef.current = Date.now();
    clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(() => setShown(false), AUTO_DISMISS_MS);
    return () => clearTimeout(autoTimerRef.current);
  }, [visible, warningCount]);

  useEffect(() => {
    if (!selfCorrected || !shown) return;
    const elapsed = Date.now() - (shownAtRef.current ?? 0);
    if (elapsed >= MIN_SHOW_MS) {
      clearTimeout(autoTimerRef.current);
      setShown(false);
    }
  }, [selfCorrected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position:      "absolute",
        top:           "16px",
        left:          "50%",
        zIndex:        10,
        pointerEvents: "none",
        transform:     shown
          ? "translateX(-50%) translateY(0px)"
          : "translateX(-50%) translateY(-8px)",
        opacity:    shown ? 1 : 0,
        transition: "opacity 400ms ease, transform 400ms ease",
        whiteSpace: "nowrap",
      }}
    >
      <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-amber-200 shadow-lg rounded-full px-4 py-2">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
        <div>
          <p className="text-xs font-bold text-gray-800 leading-none">
            Please look at the camera
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Your gaze is being monitored
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const QUESTIONS = [
  "Tell us about your background and your role in HireVision.",
  "What are the main technical challenges you faced with the MERN stack?",
  "How do you ensure the quality of your code in a team environment?",
  "Describe your experience with AI integration in web applications.",
  "Why are you interested in becoming a Frontend Developer?",
];

const QUESTION_TIME = 120;
const GAP_TIME      = 5;
const formatTime    = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const VolumeMeter = ({ level }) => (
  <div className="flex items-end gap-0.5 h-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i}
        style={{ height: `${50 + i * 5}%`, transition: "opacity 80ms" }}
        className={`w-1.5 rounded-sm ${
          level > (i + 1) / 10
            ? i < 6 ? "bg-emerald-500" : i < 8 ? "bg-yellow-400" : "bg-red-500"
            : "bg-white/30"
        }`}
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function InterviewLive() {
  const navigate = useNavigate();

  const videoRef        = useRef(null);
  const streamRef       = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef     = useRef(null);
  const animFrameRef    = useRef(null);

  const [cameraOn,    setCameraOn]    = useState(false);
  const [micOn,       setMicOn]       = useState(false);
  const [audioLevel,  setAudioLevel]  = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(QUESTION_TIME);
  const [showGap,     setShowGap]     = useState(false);
  const [gapTime,     setGapTime]     = useState(GAP_TIME);

  // ── Cheating detection ────────────────────────────────────────
  const {
    isReady,
    isCalibrating,
    calibProgress,
    warningCount,
    warningLevel,
    selfCorrected,
    lookAwayProgress,
    postSummary,
  } = useCheatingDetection({
    videoRef,
    enabled:     cameraOn && !showGap,
    sessionId:   "demo-session",    // replace with your real session ID
    interviewId: "demo-interview",  // replace with your real interview ID
  });

  const showNudges = !isCalibrating;

  // ── Audio analyser ────────────────────────────────────────────
  const stopAudioAnalyser = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (audioContextRef.current?.state !== "closed") audioContextRef.current?.close();
    audioContextRef.current = null;
    setAudioLevel(0);
  }, []);

  const startAudioAnalyser = useCallback((stream) => {
    stopAudioAnalyser();
    const ctx      = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = ctx;
    analyserRef.current     = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      setAudioLevel(Math.min(data.slice(0, 80).reduce((a, b) => a + b, 0) / 80 / 90, 1));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [stopAudioAnalyser]);

  // ── Camera ────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
    streamRef.current?.getVideoTracks().forEach((t) => t.stop());
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current?.getVideoTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(() => {});
      }
      startAudioAnalyser(stream);
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      console.error("Camera Error:", err);
      setCameraOn(false);
    }
  }, [startAudioAnalyser]);

  // ── Mic ───────────────────────────────────────────────────────
  const stopMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => t.stop());
    stopAudioAnalyser();
    setMicOn(false);
  }, [stopAudioAnalyser]);

  const startMic = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      startAudioAnalyser(audioStream);
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((t) => t.stop());
        audioStream.getAudioTracks().forEach((t) => streamRef.current.addTrack(t));
      } else {
        streamRef.current = audioStream;
      }
      setMicOn(true);
    } catch { setMicOn(false); }
  }, [startAudioAnalyser]);

  // ── Cleanup ───────────────────────────────────────────────────
  const cleanup = useCallback(() => { stopCamera(); stopMic(); }, [stopCamera, stopMic]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cleanup();
      stopAudioAnalyser();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── handleNext — sends log to backend on last question ────────
  const handleNext = useCallback(async () => {
    if (currentStep < QUESTIONS.length - 1) {
      stopCamera(); stopMic();
      setGapTime(GAP_TIME); setShowGap(true);
    } else {
      await postSummary();          // ← sends full cheating log to FastAPI
      cleanup(); navigate("/interviews");
    }
  }, [currentStep, stopCamera, stopMic, cleanup, navigate, postSummary]);

  // ── Question timer ────────────────────────────────────────────
  useEffect(() => {
    if (showGap) return;
    if (timeLeft === 0) { handleNext(); return; }
    const id = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, showGap, handleNext]);

  // ── Gap timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!showGap) return;
    if (gapTime === 0) {
      setShowGap(false); setCurrentStep((p) => p + 1);
      setTimeLeft(QUESTION_TIME); startCamera(); startMic();
      return;
    }
    const id = setInterval(() => setGapTime((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [showGap, gapTime, startCamera, startMic]);

  const isLast      = currentStep === QUESTIONS.length - 1;
  const timerUrgent = timeLeft <= 30;

  // ── Gap screen ────────────────────────────────────────────────
  if (showGap) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-blue text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
      </div>
      <div className="relative z-10 text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
              <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray="377" strokeDashoffset={377 - (377 * (GAP_TIME - gapTime)) / GAP_TIME}
                className="text-blue-400 transition-all duration-1000 linear" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-5xl font-black font-mono">{gapTime}</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Get Ready!</h2>
          <p className="text-blue-200 text-lg font-medium">Preparing Question {currentStep + 2}…</p>
        </div>
        <div className="max-w-xs mx-auto px-6 py-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <p className="text-xs text-blue-100 italic">"Take a deep breath and stay focused."</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div className="h-full bg-blue-400 transition-all duration-1000 linear" style={{ width: `${(gapTime / GAP_TIME) * 100}%` }} />
      </div>
    </div>
  );

  // ── Interview screen ──────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 text-dark-blue">

      {/* Progress bar */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-sm font-medium uppercase tracking-wider opacity-70">
            Mock interview for: <span className="font-bold">Job Role</span>
          </h1>
          <div className="flex items-center gap-2">
            {cameraOn ? <Camera size={18} className="text-emerald-500" /> : <CameraOff size={18} className="text-red-400" />}
            {micOn    ? <Mic    size={18} className="text-emerald-500" /> : <MicOff    size={18} className="text-red-400" />}
          </div>
        </div>
        <div className="w-full h-3 bg-white rounded-full flex overflow-hidden shadow-inner border border-gray-200">
          {QUESTIONS.map((_, i) => (
            <div key={i}
              className={`h-full transition-all duration-500 ${i <= currentStep ? "bg-dark-blue" : "bg-transparent"}`}
              style={{ width: `${100 / QUESTIONS.length}%`, borderRight: "1px solid #e2e8f0" }}
            />
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left: question + tip */}
        <div className="space-y-8">
          <div>
            <p className="mt-2 text-sm font-semibold text-dark-blue/50 uppercase tracking-wider mb-2">
              Question {currentStep + 1} of {QUESTIONS.length}
            </p>
            <h2 className="mt-10 mb-28 text-2xl font-extrabold leading-snug min-h-[100px]">
              {QUESTIONS[currentStep]}
            </h2>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <p className="text-gray-500 text-sm leading-relaxed">
              Take a breath, speak clearly, and answer concisely. You have{" "}
              <span className="font-semibold text-dark-blue">{formatTime(QUESTION_TIME)}</span> per question.
            </p>
          </div>
        </div>

        {/* Right: video + controls */}
        <div className="flex flex-col gap-4">

          <div className="flex items-center justify-between">
            {/* Timer badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm transition-colors ${
              timerUrgent ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-200 text-dark-blue"
            }`}>
              <span className={`w-2 h-2 rounded-full ${timerUrgent ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
              <Timer size={15} />
              {formatTime(timeLeft)}
            </div>

            {/* Warning count badge */}
            {warningCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                ⚠ {warningCount} notice{warningCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Level-1 nudge pill — above the video */}
          <CameraFocusPill progress={showNudges ? lookAwayProgress : 0} />

          {/* Video card */}
          <div
            className="relative w-full aspect-video bg-dark-blue rounded-3xl overflow-hidden"
            style={getVideoGlowStyle(showNudges ? lookAwayProgress : 0)}
          >
            <video
              ref={videoRef}
              autoPlay playsInline muted disablePictureInPicture
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Calibration overlay */}
            <CalibrationOverlay isCalibrating={isCalibrating} calibProgress={calibProgress} />

            {/* Level-2 toast (1st and 2nd warning) */}
            <NudgeToast
              warningCount={warningCount}
              selfCorrected={selfCorrected}
              visible={showNudges && warningLevel === 2}
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
                <CameraOff size={40} />
                <p className="text-xs">Camera is off</p>
              </div>
            )}

            {micOn && (
              <div className="absolute bottom-10 right-3 bg-black/50 rounded-xl px-3 py-2">
                <VolumeMeter level={audioLevel} />
              </div>
            )}

            {/* Model loading indicator */}
            {!isReady && cameraOn && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-white text-xs font-mono">Loading focus monitor…</span>
              </div>
            )}

            {/* Question countdown bar at bottom of video */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/20">
              <div
                className={`h-full transition-all duration-1000 linear ${timerUrgent ? "bg-red-500" : "bg-blue-400"}`}
                style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
              />
            </div>
          </div>

          {/* Next / Submit */}
          <button
            onClick={handleNext}
            className="self-end px-6 py-2.5 bg-dark-blue text-white rounded-xl font-bold text-sm hover:bg-light-blue transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            {isLast ? <><CheckCircle2 size={18} /> Submit</> : <>Next <ChevronRight size={18} /></>}
          </button>

        </div>
      </div>
    </div>
  );
}
