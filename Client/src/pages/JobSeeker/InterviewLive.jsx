import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Mic, MicOff, Timer, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            : "bg-white/30"
        }`}
      />
    ))}
  </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  "Tell us about your background and your role in HireVision.",
  "What are the main technical challenges you faced with the MERN stack?",
  "How do you ensure the quality of your code in a team environment?",
  "Describe your experience with AI integration in web applications.",
  "Why are you interested in becoming a Frontend Developer?",
];

const QUESTION_TIME = 120;
const GAP_TIME      = 5;

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewLive() {
  const navigate = useNavigate();

  const videoRef        = useRef(null);
  const streamRef       = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef     = useRef(null);
  const animFrameRef    = useRef(null);

  const [cameraOn,   setCameraOn]   = useState(false);
  const [micOn,      setMicOn]      = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(QUESTION_TIME);
  const [showGap,     setShowGap]     = useState(false);
  const [gapTime,     setGapTime]     = useState(GAP_TIME);

  //for recording answer videos and send it to the backend, we can use the MediaRecorder API on streamRef.current and handle the dataavailable event to collect the recorded chunks. Once recording is stopped, we can create a Blob from the chunks and send it to the backend using fetch or axios. This would allow us to save the candidate's answers for later review by recruiters.
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);

  const startRecording = useCallback((stream) => { // أضفنا useCallback
    videoChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // ملحوظة: currentStep هنا ممكن تكون قديمة، الأفضل نعتمد على رقم السؤال الحالي
      a.download = `Interview-Q${currentStep + 1}.webm`; 
      document.body.appendChild(a);
      a.click(); 
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
  }, [currentStep]); // تعتمد على currentStep لتسمية الملف صح

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
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
    streamRef.current?.getVideoTracks().forEach((t) => t.stop());
    setCameraOn(false);
  }, []);

  // const startCamera = useCallback(async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
  //       audio: true,
  //     });
  //     streamRef.current?.getVideoTracks().forEach((t) => t.stop());
  //     streamRef.current = stream;
  //     if (videoRef.current) {
  //       videoRef.current.srcObject = stream;
  //       videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(() => {});
  //     }
  //     startRecording(stream);
  //     setCameraOn(true);
  //   } catch {
  //     setCameraOn(false);
  //   }
  // }, [currentStep, startRecording]);
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

    // startRecording(stream);
    startAudioAnalyser(stream);
    setCameraOn(true);
    setMicOn(true);
  } catch (err) {
    console.error("Camera Error:", err);
    setCameraOn(false);
  }
}, [startRecording, startAudioAnalyser]);

  // ── Mic ────────────────────────────────────────────────────────────────────
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
    } catch {
      setMicOn(false);
    }
  }, [startAudioAnalyser]);

  // ── Full cleanup (on unmount / finish) ─────────────────────────────────────
  const cleanup = useCallback(() => {
    stopCamera();
    stopMic();
  }, [stopCamera, stopMic]);

  // ── Mount: start devices; unmount: full cleanup ────────────────────────────
  useEffect(() => {
    startCamera();
    // startMic();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cleanup()
      stopAudioAnalyser();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── handleNext: pause devices → show gap → resume devices ─────────────────
  const handleNext = useCallback(() => {
    // if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
    //   mediaRecorderRef.current.stop();
    // }
    if (currentStep < QUESTIONS.length - 1) {
      stopCamera();
      stopMic();

      setGapTime(GAP_TIME);
      setShowGap(true);
    } else {
      cleanup();
      navigate("/interviews");
    }
  }, [currentStep, stopCamera, stopMic, cleanup, navigate]);

  // ── Question timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (showGap) return;
    if (timeLeft === 0) { handleNext(); return; }
    const id = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, showGap, handleNext]);

  // ── Gap timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showGap) return;

    if (gapTime === 0) {
      setShowGap(false);
      setCurrentStep((p) => p + 1);
      setTimeLeft(QUESTION_TIME);
      startCamera();
      startMic();
      return;
    }

    const id = setInterval(() => setGapTime((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [showGap, gapTime, startCamera, startMic]);

  const isLast      = currentStep === QUESTIONS.length - 1;
  const timerUrgent = timeLeft <= 30;

  // ── Gap Screen ─────────────────────────────────────────────────────────────
  if (showGap) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-blue text-white overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 text-center space-y-8">
        {/* Countdown ring */}
        <div className="flex justify-center">
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
              <circle
                cx="64" cy="64" r="60"
                stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * (GAP_TIME - gapTime)) / GAP_TIME}
                className="text-blue-400 transition-all duration-1000 linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-5xl font-black font-mono">
              {gapTime}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Get Ready!</h2>
          <p className="text-blue-200 text-lg font-medium">
            Preparing Question {currentStep + 2}…
          </p>
        </div>

        <div className="max-w-xs mx-auto px-6 py-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <p className="text-xs text-blue-100 italic">"Take a deep breath and stay focused."</p>
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div
          className="h-full bg-blue-400 transition-all duration-1000 linear"
          style={{ width: `${(gapTime / GAP_TIME) * 100}%` }}
        />
      </div>
    </div>
  );

  // ── Interview Screen ───────────────────────────────────────────────────────
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
            <div
              key={i}
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

          {/* Timer badge */}
          <div className={`self-end flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm transition-colors ${
            timerUrgent ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-200 text-dark-blue"
          }`}>
            <span className={`w-2 h-2 rounded-full ${timerUrgent ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
            <Timer size={15} />
            {formatTime(timeLeft)}
          </div>

          {/* Video card */}
          <div className="relative w-full aspect-video bg-dark-blue rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-4 border-white">
            <video
              ref={videoRef}
              autoPlay playsInline muted disablePictureInPicture
              className="w-full h-full object-cover scale-x-[-1]"
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

            {/* Time progress bar */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-black/20">
              <div
                className={`h-full transition-all duration-1000 linear ${timerUrgent ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
              />
            </div>
          </div>

          {/* Next / Submit button */}
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