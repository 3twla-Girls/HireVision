
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  Camera, CameraOff, Mic, MicOff, Timer,
  ChevronRight, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useCheatingDetection } from '../../components/JobSeeker/useCheatingDetection';
import { useAuth } from '../../context/AuthContext';
import useTabCheatingDetection from "../../hooks/useCheatingDetection";

// ─── Constants ────────────────────────────────────────────────────────────────
const QUESTION_TIME = 120;
const GAP_TIME = 5;
const AUTO_DISMISS_MS = 4000;
const MIN_SHOW_MS = 2500;
const CALIB_SEC = 3;

const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ─── Video glow style (shifts border colour as look-away timer grows) ─────────
function getVideoGlowStyle(progress) {
  if (progress <= 0) return {
    border: '4px solid white',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
    transition: 'box-shadow 600ms ease, border-color 600ms ease',
  };
  if (progress < 0.5) {
    const i = progress * 2;
    return {
      border: '4px solid #fbbf24',
      boxShadow: `0 20px 50px rgba(0,0,0,0.2), 0 0 ${12 + i * 16}px rgba(251,191,36,${0.3 + i * 0.35})`,
      transition: 'box-shadow 300ms ease, border-color 300ms ease',
    };
  }
  if (progress < 0.8) {
    const i = (progress - 0.5) / 0.3;
    return {
      border: '4px solid #f97316',
      boxShadow: `0 20px 50px rgba(0,0,0,0.2), 0 0 ${28 + i * 14}px rgba(249,115,22,${0.55 + i * 0.2})`,
      transition: 'box-shadow 200ms ease, border-color 200ms ease',
    };
  }
  return {
    border: '4px solid #ef4444',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2), 0 0 44px rgba(239,68,68,0.75), 0 0 88px rgba(239,68,68,0.3)',
    transition: 'box-shadow 150ms ease, border-color 150ms ease',
  };
}

// ─── CalibrationOverlay ───────────────────────────────────────────────────────
function CalibrationOverlay({ isCalibrating, calibProgress }) {
  const remaining = Math.max(CALIB_SEC * (1 - calibProgress), 0);
  const circumf = 2 * Math.PI * 36;
  const strokeDash = circumf * (1 - calibProgress);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(10,15,30,0.82)',
        backdropFilter: 'blur(4px)',
        opacity: isCalibrating ? 1 : 0,
        transition: 'opacity 600ms ease',
        pointerEvents: isCalibrating ? 'auto' : 'none',
      }}
    >
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90 mb-4">
        <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
        <circle
          cx="44" cy="44" r="36" fill="none" stroke="#60a5fa" strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumf}
          strokeDashoffset={strokeDash}
          style={{ transition: 'stroke-dashoffset 100ms linear' }}
        />
      </svg>
      <p className="text-white text-base font-bold mb-1 tracking-wide">Look straight at the camera</p>
      <p className="text-blue-200 text-xs">Calibrating… {remaining.toFixed(1)}s</p>
    </div>
  );
}

// ─── CameraFocusPill (level-1 nudge: floats above the video) ─────────────────
function CameraFocusPill({ progress }) {
  const visible = progress > 0;
  const bg = progress < 0.5 ? 'rgba(245,158,11,0.92)'
    : progress < 0.8 ? 'rgba(249,115,22,0.92)'
      : 'rgba(239,68,68,0.92)';
  const shadow = progress < 0.5 ? '0 2px 12px rgba(245,158,11,0.4)'
    : progress < 0.8 ? '0 2px 12px rgba(249,115,22,0.45)'
      : '0 2px 12px rgba(239,68,68,0.5)';

  return (
    <div
      aria-live="polite"
      className="flex justify-center pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
        marginBottom: '-2px',
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

// ─── NudgeToast (level-2 warning: shown inside the video card) ───────────────
function NudgeToast({ warningCount, selfCorrected, visible }) {
  const [shown, setShown] = useState(false);
  const autoTimerRef = useRef(null);
  const shownAtRef = useRef(null);

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
        position: 'absolute',
        top: '16px',
        left: '50%',
        zIndex: 10,
        pointerEvents: 'none',
        transform: shown ? 'translateX(-50%) translateY(0px)' : 'translateX(-50%) translateY(-8px)',
        opacity: shown ? 1 : 0,
        transition: 'opacity 400ms ease, transform 400ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-amber-200 shadow-lg rounded-full px-4 py-2">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
        <div>
          <p className="text-xs font-bold text-gray-800 leading-none">Please look at the camera</p>
          <p className="text-xs text-gray-500 mt-0.5">Your gaze is being monitored</p>
        </div>
      </div>
    </div>
  );
}

// ─── VolumeMeter ──────────────────────────────────────────────────────────────
function VolumeMeter({ level }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{ height: `${50 + i * 5}%`, transition: 'opacity 80ms' }}
          className={`w-1.5 rounded-sm ${level > (i + 1) / 10
              ? i < 6 ? 'bg-emerald-500' : i < 8 ? 'bg-yellow-400' : 'bg-red-500'
              : 'bg-white/30'
            }`}
        />
      ))}
    </div>
  );
}

// ─── GapScreen ────────────────────────────────────────────────────────────────
function GapScreen({ gapTime, currentStep }) {
  return (
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
                cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * (GAP_TIME - gapTime)) / GAP_TIME}
                className="text-blue-400 transition-all duration-1000 linear"
              />
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

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div
          className="h-full bg-blue-400 transition-all duration-1000 linear"
          style={{ width: `${(gapTime / GAP_TIME) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewLive() {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams();
  const isMock = type === 'mock';

  const jobTitle = location.state?.jobTitle || (isMock ? 'Mock Interview' : 'Interview Session');

  const { userData } = useAuth();
  const candidateId = userData?._id;

  const targetID = isMock
    ? candidateId
    : (location.state?.jobId);

  useEffect(() => {
    const enterFullscreen = async () => {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    };
    enterFullscreen();
  }, []);

  const sId = location.state?.sessionId || localStorage.getItem('sessionId');
  useTabCheatingDetection(sId);

  // ── Refs ──────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const questionsRef = useRef([]);
  const isSubmittingRef = useRef(false);     // ← NEW: double-click guard

  // ── State ─────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [showGap, setShowGap] = useState(false);
  const [gapTime, setGapTime] = useState(GAP_TIME);
  const [selectedOption, setSelectedOption] = useState(null);

  // ── Cheating detection ────────────────────────────────────────
  const passedQuestions = location.state?.questions;
  const sessionIDFromState = location.state?.sessionId;
  const {
    isReady, isCalibrating, calibProgress,
    warningCount, warningLevel, selfCorrected,
    lookAwayProgress, postSummary,
  } = useCheatingDetection({
    videoRef,
    enabled: cameraOn && !showGap,
    sessionId: sessionIDFromState || localStorage.getItem('sessionId') || location.state?.sessionId,
    interviewId: targetID,
  });

  const showNudges = !isCalibrating;

  // ── Fetch questions ───────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      setQuestions([]);
      questionsRef.current = [];

      if (passedQuestions?.length > 0) {
        console.log('✅ Using freshly generated questions from state');
        setQuestions(passedQuestions);
        questionsRef.current = passedQuestions;
        return;
      }

      console.log('🔄 Fetching questions from backend for target:', targetID);
      try {
        const { status, data } = await api.get(`/interview/questions/${targetID}?latest=true`);
        if (status === 200 && data.questions?.length > 0) {
          setQuestions(data.questions);
          questionsRef.current = data.questions;
        }
      } catch (err) {
        console.error('❌ Error fetching questions:', err);
      }
    };

    fetchQuestions();
  }, [passedQuestions, targetID, location.state?.generatedAt]);

  // ── Audio analyser ────────────────────────────────────────────
  const stopAudioAnalyser = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    audioContextRef.current = null;
    setAudioLevel(0);
  }, []);

  const startAudioAnalyser = useCallback((stream) => {
    stopAudioAnalyser();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = ctx;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      setAudioLevel(Math.min(data.slice(0, 80).reduce((a, b) => a + b, 0) / 80 / 90, 1));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [stopAudioAnalyser]);

  // ── Recording — fully decoupled from question state ───────────
  const startRecording = useCallback((stream) => {
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        videoChunksRef.current.push(e.data);
        console.log(`🎥 Chunk captured: ${e.data.size} bytes (total chunks: ${videoChunksRef.current.length})`);
      }
    };

    recorder.onerror = (e) => {
      console.error('❌ MediaRecorder error:', e.error);
    };

    // NOTE: onstop is intentionally left as a no-op here.
    // The actual upload is handled by stopRecordingAndGetBlob(),
    // which collects the blob via a Promise.
    recorder.onstop = () => {};

    // Use timeslice (1s) so ondataavailable fires continuously,
    // not just once at stop(). This ensures data is captured even if
    // stop() has issues, and gives us incremental chunks.
    recorder.start(1000);
    console.log(`🎬 MediaRecorder started (state: ${recorder.state})`);
    mediaRecorderRef.current = recorder;
  }, []);

  // ── Stop recording and return the video blob via Promise ──────
  const stopRecordingAndGetBlob = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        console.warn('⚠️ stopRecordingAndGetBlob: recorder inactive or missing');
        // Even if recorder is inactive, we might have chunks from ondataavailable
        const chunks = videoChunksRef.current;
        if (chunks.length > 0) {
          console.log(`📦 Using ${chunks.length} pre-existing chunks despite inactive recorder`);
          const blob = new Blob(chunks, { type: 'video/webm' });
          videoChunksRef.current = [];
          resolve(blob);
        } else {
          resolve(null);
        }
        return;
      }

      console.log(`⏹️ Stopping recorder (state: ${recorder.state}, chunks so far: ${videoChunksRef.current.length})`);

      // Flush any pending data before stopping
      try {
        if (recorder.state === 'recording') {
          recorder.requestData();
        }
      } catch (e) {
        console.warn('⚠️ requestData() failed (non-critical):', e.message);
      }

      recorder.onstop = () => {
        const chunks = videoChunksRef.current;
        console.log(`⏹️ Recorder stopped — collected ${chunks.length} chunks`);
        if (chunks.length === 0) {
          console.error('❌ No video chunks captured!');
          resolve(null);
          return;
        }
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log(`✅ Video blob created: ${(blob.size / 1024).toFixed(1)} KB`);
        videoChunksRef.current = [];
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  // ── Upload answer with snapshotted data (no refs/state reads) ─
  const uploadAnswer = useCallback(async (snapshot) => {
    const { videoBlob, sessionId, questionId, questionType, selectedMcqOption } = snapshot;

    if (!questionId || !sessionId) {
      console.error('❌ Missing questionId or sessionId — skipping upload');
      return;
    }

    const formData = new FormData();
    if (videoBlob) {
      formData.append('file', videoBlob, `video_${questionId}.webm`);
    }

    const requestParams = {
      session_id: sessionId,
      question_id: questionId,
    };

    // MCQ: attach the selected option from the snapshot
    if (questionType === 'mcq' && selectedMcqOption) {
      requestParams.selected_option = selectedMcqOption;
    }

    try {
      // IMPORTANT: Do NOT set Content-Type header manually for FormData!
      // The browser must set it automatically so it includes the multipart
      // boundary parameter. Setting it manually causes:
      //   "Did not find CR at end of boundary" → 400 Bad Request
      const [resAnswer, resPhone, resPersonality] = await Promise.allSettled([
        api.post('/interview/submit-answer', formData, {
          params: requestParams,
        }),
        api.post('/interview/analyze-phone-usage', formData, {
          params: { session_id: sessionId, question_id: questionId },
        }),
        api.post(`personality/predict/${sessionId}`, formData),
      ]);

      if (resAnswer.status === 'fulfilled')
        console.log(`✅ Answer & Video Uploaded for Q:${questionId}`);
      else
        console.error('❌ Answer Upload Failed:', resAnswer.reason?.response?.data || resAnswer.reason);

      if (resPhone.status === 'fulfilled')
        console.log('✅ Phone Detection Done');
      else
        console.error('❌ Phone Detection Failed:', resPhone.reason?.response?.data || resPhone.reason);

      if (resPersonality.status === 'fulfilled')
        console.log('✅ Personality traits captured');
      else
        console.error('❌ Personality Predict Failed:', resPersonality.reason?.response?.data || resPersonality.reason);

    } catch (err) {
      console.error('❌ Critical Error during submission:', err);
    }
  }, []);

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
      // Stop any existing tracks before requesting a new stream
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(() => { });
      }

      startRecording(stream);
      startAudioAnalyser(stream);
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      console.error('Camera Error:', err);
      setCameraOn(false);
    }
  }, [startRecording, startAudioAnalyser]);

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
    } catch {
      setMicOn(false);
    }
  }, [startAudioAnalyser]);

  // ── Cleanup ───────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    stopCamera();
    stopMic();
    localStorage.removeItem('sessionId');
  }, [stopCamera, stopMic]);

  // Start camera once questions are loaded; cleanup on unmount
  useEffect(() => {
    if (questions.length > 0) startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cleanup();
      stopAudioAnalyser();
    };
  }, [questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── handleNext — the core fix ─────────────────────────────────
  const handleNext = useCallback(async () => {
    // ▶ Guard: prevent double-clicks / double-invocations from timer
    if (isSubmittingRef.current) {
      console.log('⏳ handleNext blocked — already submitting');
      return;
    }
    isSubmittingRef.current = true;

    try {
      const currentQuestion = questionsRef.current[currentStep];
      const qId = currentQuestion?.question_id || currentQuestion?._id || currentQuestion?.id;
      const sessionId = location.state?.sessionId || localStorage.getItem('sessionId');

      console.log(`\n━━━ handleNext Q${currentStep + 1}/${questions.length} ━━━`);
      console.log(`  qId: ${qId}`);
      console.log(`  type: ${currentQuestion?.type}`);
      console.log(`  sessionId: ${sessionId}`);
      console.log(`  selectedOption: ${selectedOption}`);
      console.log(`  timeLeft: ${timeLeft}`);
      console.log(`  recorder state: ${mediaRecorderRef.current?.state ?? 'NO RECORDER'}`);
      console.log(`  chunks in buffer: ${videoChunksRef.current.length}`);

      // Validate MCQ (only if time hasn't run out — allow skipping on timeout)
      if (currentQuestion?.type === 'mcq' && !selectedOption && timeLeft > 0) {
        toast.error('Please select an option before proceeding.');
        isSubmittingRef.current = false;
        return;
      }

      // ▶ STEP 1: Snapshot ALL answer data RIGHT NOW, before any async work
      const answerSnapshot = {
        videoBlob: null,             // will be filled after recorder stops
        sessionId,
        questionId: qId,
        questionType: currentQuestion?.type || 'open',
        selectedMcqOption: selectedOption,   // captured from state NOW
      };

      // ▶ STEP 2: Stop recorder and collect the video blob
      toast.loading('Saving answer...', { id: 'save-answer' });

      const videoBlob = await stopRecordingAndGetBlob();
      answerSnapshot.videoBlob = videoBlob;

      if (!videoBlob) {
        console.error(`❌ Q${currentStep + 1}: No video blob captured! Upload will proceed without video.`);
      } else {
        console.log(`📦 Q${currentStep + 1}: Video blob ready (${(videoBlob.size / 1024).toFixed(1)} KB)`);
      }

      // ▶ STEP 3: Upload with the snapshotted data
      await uploadAnswer(answerSnapshot);
      toast.dismiss('save-answer');

      console.log(`✅ Q${currentStep + 1} fully uploaded\n`);

      // ▶ STEP 4: Determine what happens next
      const isLastQuestion = currentStep === questions.length - 1;

      if (!isLastQuestion) {
        // Stop camera/mic for the gap
        stopCamera();
        stopMic();

        // Reset MCQ selection AFTER upload is complete
        setSelectedOption(null);

        // Show gap screen, then transition
        setGapTime(GAP_TIME);
        setShowGap(true);
        return;
      }

      // ▶ Last question — wrap up interview
      toast.loading('Generating your interview summary...', { id: 'summary' });

      // Run post-interview tasks independently so one failure doesn't block others.
      // postSummary (eye-gaze) can run in parallel with personality.
      // final-summary MUST run last because it reads the saved answers.
      const [resSummary, resPersonality] = await Promise.allSettled([
        postSummary(),
        api.post(`/personality/process/${sessionId}`).catch(e => {
          console.warn('⚠️ personality/process failed (non-critical):', e?.response?.data || e.message);
        }),
      ]);

      if (resSummary.status === 'rejected') {
        console.error('❌ postSummary (eye-gaze) failed:', resSummary.reason);
      }

      // final-summary must run after answers are saved (they are by now)
      try {
        await api.post(`/interview/final-summary/${sessionId}`);
        console.log('✅ Final summary generated');
      } catch (e) {
        console.error('❌ final-summary failed:', e?.response?.data || e.message);
      }

      toast.success('Interview completed! Redirecting...', { id: 'summary' });
      cleanup();
      navigate('/interviews');
    } catch (err) {
      console.error('❌ handleNext failed:', err);
      toast.error('Error generating summary, but your answers are saved.', { id: 'summary' });
      // Navigate away even on error to prevent infinite timer retries
      cleanup();
      navigate('/interviews');
    } finally {
      // ALWAYS reset the guard, no matter what happened
      isSubmittingRef.current = false;
    }
  }, [currentStep, questions.length, selectedOption, timeLeft, stopCamera, stopMic, cleanup, navigate, location.state, postSummary, stopRecordingAndGetBlob, uploadAnswer]);

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

  // Reset MCQ selection when step changes (safety net — main reset is in handleNext)
  useEffect(() => {
    setSelectedOption(null);
  }, [currentStep]);

  // ── Derived values ────────────────────────────────────────────
  const isLast = currentStep === questions.length - 1;
  const timerUrgent = timeLeft <= 30;
  const canProceed = timeLeft <= QUESTION_TIME - 10;

  // ── Gap screen ────────────────────────────────────────────────
  if (showGap) return <GapScreen gapTime={gapTime} currentStep={currentStep} />;

  // ── Interview screen ──────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 text-dark-blue">

      {/* Progress bar */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-sm font-medium uppercase tracking-wider opacity-70">
            Interview for: <span className="font-bold">{jobTitle}</span>
          </h1>
          <div className="flex items-center gap-2">
            {cameraOn ? <Camera size={18} className="text-emerald-500" /> : <CameraOff size={18} className="text-red-400" />}
            {micOn ? <Mic size={18} className="text-emerald-500" /> : <MicOff size={18} className="text-red-400" />}
          </div>
        </div>
        <div className="w-full h-3 bg-white rounded-full flex overflow-hidden shadow-inner border border-gray-200">
          {questions.map((q, i) => (
            <div
              key={q.question_id}
              className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-dark-blue' : 'bg-transparent'}`}
              style={{ width: `${100 / questions.length}%`, borderRight: '1px solid #e2e8f0' }}
            />
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left: question + tip */}
        <div className="space-y-8">
          <div>
            <p className="mt-8 text-sm font-semibold text-dark-blue/50 uppercase tracking-wider mb-2">
              Question {currentStep + 1} of {questions.length}
            </p>
            <h2 className="mt-6 mb-6 text-2xl font-extrabold leading-snug min-h-[100px]">
              {questions[currentStep]?.question}
            </h2>
            {/* MCQ Options */}
            {questions[currentStep]?.type === 'mcq' && (
              <div className="mt-2 space-y-3 space-x-3">
                {questions[currentStep]?.options.map((option, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedOption(optionLetter);
                      }}
                      className={`w-fit text-left p-4 pr-6 rounded-xl border-2 transition-all ${selectedOption === optionLetter
                          ? 'border-dark-blue bg-dark-blue/5 shadow-md'
                          : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${selectedOption === optionLetter ? 'bg-dark-blue text-white' : 'text-gray-400'
                          }`}>
                          {String.fromCharCode(65 + idx)} {/* A, B, C, D */}
                        </span>
                        <span className={selectedOption === optionLetter ? 'font-bold text-dark-blue' : 'text-gray-700'}>
                          {option}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <p className="text-gray-500 text-sm leading-relaxed">
              Take a breath, speak clearly, and answer concisely. You have{' '}
              <span className="font-semibold text-dark-blue">{formatTime(QUESTION_TIME)}</span> per question.
            </p>
          </div>
        </div>

        {/* Right: video + controls */}
        <div className="flex flex-col gap-2">

          {/* Timer + warning badge */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm transition-colors ${timerUrgent ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-dark-blue'
              }`}>
              <span className={`w-2 h-2 rounded-full ${timerUrgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              <Timer size={15} />
              {formatTime(timeLeft)}
            </div>

            {warningCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                ⚠ {warningCount} notice{warningCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Level-1 nudge pill */}
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

            <CalibrationOverlay isCalibrating={isCalibrating} calibProgress={calibProgress} />

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

            {/* Model-loading indicator */}
            {!isReady && cameraOn && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-white text-xs font-mono">Loading focus monitor…</span>
              </div>
            )}

            {/* Question countdown bar */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/20">
              <div
                className={`h-full transition-all duration-1000 linear ${timerUrgent ? 'bg-red-500' : 'bg-blue-400'}`}
                style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
              />
            </div>
          </div>

          {/* Next / Submit button */}
          <button
            onClick={handleNext}
            disabled={!canProceed || isSubmittingRef.current}
            className={`self-end px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg
              ${!canProceed
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                : 'bg-dark-blue text-white hover:bg-light-blue hover:-translate-y-0.5 active:scale-95'
              }`}
          >
            {!canProceed ? (
              `Wait ${timeLeft - (QUESTION_TIME - 10)}s...`
            ) : isLast ? (
              <><CheckCircle2 size={18} /> Submit</>
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}