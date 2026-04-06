import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, Mic, MicOff, Volume2, Wifi, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

// ─── Volume Meter ─────────────────────────────────────────────────────────────
const VolumeMeter = ({ level }) => (
  <div className="flex items-end gap-0.5 h-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        style={{ height: `${50 + i * 5}%`, transition: "opacity 80ms" }}
        className={`w-1.5 rounded-sm ${
          level > (i + 1) / 10
            ? i < 6 ? "bg-emerald-500" : i < 8 ? "bg-yellow-400" : "bg-red-500"
            : "bg-gray-600"
        }`}
      />
    ))}
  </div>
);

// ─── Check Row ────────────────────────────────────────────────────────────────
const STATUS = { IDLE: "idle", CHECKING: "checking", OK: "ok", ERROR: "error" };

const STATUS_STYLES = {
  idle:     { bg: "bg-gray-50 border-gray-200",     icon: null },
  checking: { bg: "bg-blue-50 border-blue-200",     icon: <Loader2 size={20} className="text-blue-500 animate-spin" /> },
  ok:       { bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 size={20} className="text-emerald-500" /> },
  error:    { bg: "bg-red-50 border-red-200",         icon: <XCircle size={20} className="text-red-500" /> },
};

const CheckRow = ({ icon: Icon, label, status, detail, onAction, actionLabel }) => {
  const { bg, icon } = STATUS_STYLES[status];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${bg}`}>
      <Icon size={18} className={status === "ok" ? "text-emerald-600" : status === "error" ? "text-red-500" : "text-gray-400"} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {detail && <p className="text-xs text-gray-500 truncate">{detail}</p>}
      </div>
      {status === "idle" ? <div className="w-5 h-5 rounded-full border-2 border-gray-300" /> : icon}
      {onAction && (
        <button onClick={onAction} className="text-xs text-blue-600 hover:underline font-medium ml-1 whitespace-nowrap">
          {actionLabel ?? "Test"}
        </button>
      )}
    </div>
  );
};

// ─── Toggle Button ────────────────────────────────────────────────────────────
const ToggleBtn = ({ onClick, active, loading, IconOn, IconOff, labelOn, labelOff }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
      active
        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
        : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
    }`}
  >
    {active ? <IconOn size={16} /> : <IconOff size={16} />}
    {loading ? "Loading…" : active ? labelOn : labelOff}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewSetupModal({ setShowSetup, isMock = false, jobInfo, existingSessionId = null, existingJobId = null }) {
  const navigate = useNavigate();
  const { type } = useParams();

  const videoRef         = useRef(null);
  const streamRef        = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef      = useRef(null);
  const animFrameRef     = useRef(null);

  const [cameraOn,    setCameraOn]   = useState(false);
  const [micOn,       setMicOn]      = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const [camStatus,     setCamStatus]     = useState(STATUS.IDLE);
  const [micStatus,     setMicStatus]     = useState(STATUS.IDLE);
  const [speakerStatus, setSpeakerStatus] = useState(STATUS.IDLE);
  const [networkStatus, setNetworkStatus] = useState(STATUS.CHECKING);

  const [camDetail,     setCamDetail]     = useState("Camera is off");
  const [micDetail,     setMicDetail]     = useState("Microphone is off");
  const [speakerDetail, setSpeakerDetail] = useState("Click Test to verify");
  const [networkDetail, setNetworkDetail] = useState("Checking connection…");

  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // ── Audio Analyser ─────────────────────────────────────────────────────────
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

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; videoRef.current.load(); }
    streamRef.current?.getVideoTracks().forEach((t) => t.stop());
    setCameraOn(false);
    setCamStatus(STATUS.IDLE);
    setCamDetail("Camera is off");
  }, []);

  const startCamera = useCallback(async () => {
    setCamStatus(STATUS.CHECKING);
    setCamDetail("Requesting camera access…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current?.getVideoTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      setCamStatus(STATUS.OK);
      setCamDetail(stream.getVideoTracks()[0]?.label || "Camera active");
    } catch {
      setCamStatus(STATUS.ERROR);
      setCamDetail("Access denied — check browser permissions");
      setCameraOn(false);
    }
  }, []);

  // ── Mic ────────────────────────────────────────────────────────────────────
  const stopMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => t.stop());
    stopAudioAnalyser();
    setMicOn(false);
    setMicStatus(STATUS.IDLE);
    setMicDetail("Microphone is off");
  }, [stopAudioAnalyser]);

  const startMic = useCallback(async () => {
    setMicStatus(STATUS.CHECKING);
    setMicDetail("Requesting microphone access…");
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
      setMicStatus(STATUS.OK);
      setMicDetail(audioStream.getAudioTracks()[0]?.label || "Microphone active");
    } catch {
      setMicStatus(STATUS.ERROR);
      setMicDetail("Access denied — check browser permissions");
      setMicOn(false);
    }
  }, [startAudioAnalyser]);

  // ── Network check ──────────────────────────────────────────────────────────
  const checkNetwork = useCallback(async () => {
    setNetworkStatus(STATUS.CHECKING);
    setNetworkDetail("Checking connection…");
    const start = Date.now();
    try {
      await fetch("https://www.google.com/generate_204", { mode: "no-cors", cache: "no-store" });
      const ms = Date.now() - start;
      setNetworkStatus(STATUS.OK);
      setNetworkDetail(ms < 150 ? `Excellent — ${ms}ms` : ms < 400 ? `Good — ${ms}ms` : `Slow — ${ms}ms`);
    } catch {
      setNetworkStatus(navigator.onLine ? STATUS.OK : STATUS.ERROR);
      setNetworkDetail(navigator.onLine ? "Connected" : "No internet connection");
    }
  }, []);

  // ── Speaker test ───────────────────────────────────────────────────────────
  // const testSpeaker = useCallback(async () => {
  //   if (speakerTesting) return;
  //   setSpeakerTesting(true);
  //   setSpeakerStatus(STATUS.CHECKING);
  //   setSpeakerDetail("Playing test tone…");
  //   try {
  //     const ctx  = new (window.AudioContext || window.webkitAudioContext)();
  //     const osc  = ctx.createOscillator();
  //     const gain = ctx.createGain();
  //     osc.connect(gain);
  //     gain.connect(ctx.destination);
  //     osc.frequency.value = 440;
  //     gain.gain.setValueAtTime(0.25, ctx.currentTime);
  //     gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  //     osc.start();
  //     osc.stop(ctx.currentTime + 0.8);
  //     await new Promise((r) => setTimeout(r, 900));
  //     await ctx.close();
  //     setSpeakerStatus(STATUS.OK);
  //     setSpeakerDetail("Speaker working — did you hear the beep?");
  //   } catch {
  //     setSpeakerStatus(STATUS.ERROR);
  //     setSpeakerDetail("Could not play audio");
  //   } finally {
  //     setSpeakerTesting(false);
  //   }
  // }, [speakerTesting]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const cleanup = () => { stopCamera(); stopMic(); };

  const handleClose   = () => { cleanup(); setShowSetup(false); };


  const { userData } = useAuth();
  const candidateId = userData?._id;


  const handleConfirm = async () => {
    setIsStarting(true);
    try {
      let sessionId;
      let generatedQuestions = [];

      if (!isMock && existingSessionId) {
        // Real interview with pre-existing session.
        // Pass sessionId only; InterviewLive will fetch questions itself via job ID (targetID).
        sessionId = existingSessionId;
      } else {
        // ── New session (mock or real without existing session) ──
        const sessionResponse = isMock
          ? await api.post(`/interview/start-mock-session/${candidateId}`, {
              job_title: jobInfo?.job_title || null
            })
          : await api.post(`/interview/start-session/${applicantId}`);

        if (sessionResponse.status !== 201) {
          toast.error('Could not start session. Please try again.');
          return;
        }

        const sessionData = sessionResponse.data;
        sessionId = sessionData.session_id;

        if (isMock) {
          const mockRequestData = {
            candidate_id: candidateId,
            job_title: jobInfo?.job_title || "Software Engineer",
            skills: jobInfo?.required_skills || [],
            experience_level: jobInfo?.experience_level || "Junior",
            num_questions: jobInfo?.num_questions || 5
          };
          const questionsResponse = await api.post('/questions/generate-mock-questions', mockRequestData);
          if (questionsResponse.status === 201) {
            generatedQuestions = questionsResponse.data.questions || [];
          }
        }
      }

      cleanup();
      setShowSetup(false);
      localStorage.setItem('sessionId', sessionId);

      setTimeout(() => {
        navigate(`/interview/${type}/live`, {
          state: { sessionId, questions: generatedQuestions, jobId: existingJobId ?? null }
        });
      }, 150);
    } catch (error) {
      console.error("Failed to setup interview:", error);
      toast.error("Something went wrong. Please try again.", { duration: 3000 });
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    checkNetwork();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); stopAudioAnalyser(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-7 pb-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ready to join?</h2>
            <p className="text-sm text-gray-500 mt-0.5">Check your devices before entering.</p>
          </div>
          <button onClick={handleClose} disabled={isStarting} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors mt-1 disabled:opacity-50">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Camera preview */}
            <div>
              <div className="bg-gray-900 aspect-video rounded-2xl overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay playsInline muted disablePictureInPicture
                  className="w-full h-full object-cover scale-x-[-1]"
                  style={{ display: cameraOn ? "block" : "none" }}
                />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
                    <Camera size={32} />
                    <p className="text-xs text-center px-6">{camStatus === STATUS.ERROR ? camDetail : "Camera is off"}</p>
                  </div>
                )}
                {cameraOn && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-medium">Preview</span>
                  </div>
                )}
                {micOn && (
                  <div className="absolute bottom-3 right-3 bg-black/50 rounded-xl px-3 py-2">
                    <VolumeMeter level={audioLevel} />
                  </div>
                )}
              </div>

              {micOn && <p className="text-xs text-gray-400 text-right mt-1.5">Speak to test your mic level</p>}

              <div className="flex gap-3 mt-4">
                <ToggleBtn
                  onClick={cameraOn ? stopCamera : startCamera}
                  active={cameraOn}
                  loading={camStatus === STATUS.CHECKING}
                  IconOn={Camera} IconOff={CameraOff}
                  labelOn="Turn off camera" labelOff="Turn on camera"
                />
                <ToggleBtn
                  onClick={micOn ? stopMic : startMic}
                  active={micOn}
                  loading={micStatus === STATUS.CHECKING}
                  IconOn={Mic} IconOff={MicOff}
                  labelOn="Mute mic" labelOff="Turn on mic"
                />
              </div>
            </div>

            {/* Check rows */}
            <div className="flex flex-col gap-3">
              <CheckRow icon={Camera}  label="Camera"         status={camStatus}     detail={camDetail} />
              <CheckRow icon={Mic}     label="Microphone" status={micStatus}     detail={micDetail} />
              {/* <CheckRow
                icon={Volume2} label="Speaker" status={speakerStatus} detail={speakerDetail}
                onAction={testSpeaker}
                actionLabel={speakerTesting ? "Testing…" : speakerStatus === STATUS.OK ? "Retest" : "Test"}
              /> */}
              <CheckRow
                icon={Wifi} label="Network" status={networkStatus} detail={networkDetail}
                onAction={networkStatus === STATUS.ERROR ? checkNetwork : undefined}
                actionLabel="Retry"
              />
              {camStatus === STATUS.ERROR && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  Click the camera icon in your browser's address bar, allow access, then try again.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleClose} 
              disabled={isStarting}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!(cameraOn && micOn) || isStarting}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                cameraOn && micOn && !isStarting
                  ? "bg-[#FF914D] text-white hover:bg-[#f07d38] active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isStarting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {isMock ? "Generating Questions..." : "Starting..."}
                </>
              ) : (
                cameraOn && micOn ? "Join Interview" : "Checking devices…"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}