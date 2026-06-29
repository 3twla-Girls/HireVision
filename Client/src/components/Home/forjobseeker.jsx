import React, { useEffect, useState } from "react";
import {
  Search,
  FileText,
  Bell,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import img1 from "../../assets/img1.png";
import img2 from "../../assets/matched.png";
import img3 from "../../assets/accepted_to_interview.png";
import img4 from "../../assets/interview.png";
import img5 from "../../assets/feedback.png";

const initialSteps = [
  {
    step: "01",
    icon: <FileText className="w-5 h-5 text-orange-500" />,
    title: "Upload Your CV",
    subtitle: "Step One",
    desc: "Parse your resume instantly to extract your core skill sets and effortlessly build a polished candidate profile.",
    bg: img1,
  },
  {
    step: "02",
    icon: <Search className="w-5 h-5 text-orange-500" />,
    title: "Get Matched Jobs",
    subtitle: "Step Two",
    desc: "Skip the endless browsing. Our smart recommendation engine filters and serves verified jobs tailored directly to your profile.",
    bg: img2,
  },
  {
    step: "03",
    icon: <Bell className="w-5 h-5 text-orange-500" />,
    title: "Submit & Get Interview Invites",
    subtitle: "Step Three",
    desc: "Seamlessly drop your application tracking profile and receive rapid status acceptances straight to the live interview stage.",
    bg: img3,
  },
  {
    step: "04",
    icon: <Users className="w-5 h-5 text-orange-500" />,
    title: "Monitored Secure Interview",
    subtitle: "Step Four",
    desc: "Take your assessment via our advanced proctoring system equipped with active screen monitoring, copy-paste blocks, and plagiarism detection algorithms.",
    bg: img4,
  },
  {
    step: "05",
    icon: <Trophy className="w-5 h-5 text-orange-500" />,
    title: "Comprehensive Performance Feedback",
    subtitle: "Step Five",
    desc: "Review highly detailed post-interview breakdowns, score metrics, and automated actionable critiques to refine your style.",
    bg: img5,
  },
];

export default function JobSeeker() {
  const [items, setItems] = useState(initialSteps);

  // items[1] represents the currently active slide layout
  const activeStep = items[1];

  const next = () => {
    setItems((prev) => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const prev = () => {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, prev.length - 1);
      return [last, ...rest];
    });
  };

  const jumpToStep = (targetStep) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.step === targetStep);
      if (index === 1) return prev;
      const shifts = (index - 1 + prev.length) % prev.length;
      const result = [...prev];
      for (let i = 0; i < shifts; i++) {
        const first = result.shift();
        result.push(first);
      }
      return result;
    });
  };

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full h-screen min-h-[650px] max-h-[900px] overflow-hidden bg-dark-blue select-none flex items-center" id="section-jobseeker">
      {/* Scope-contained Floating Animations */}
      <style>{`
        @keyframes floatEffect {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-25px) scale(1.05); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
        .bubble-float-1 { animation: floatEffect 9s ease-in-out infinite; }
        .bubble-float-2 { animation: floatReverse 12s ease-in-out infinite; }
        .bubble-float-3 { animation: floatEffect 7s ease-in-out infinite; }
        .bubble-float-4 { animation: floatReverse 10s ease-in-out infinite; }
      `}</style>

      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none" />

      {/* Interactive Background Floating Bubbles */}
      <div className="absolute top-[20%] left-[8%] w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/10 backdrop-blur-[2px] pointer-events-none z-0 bubble-float-1" />
      <div className="absolute bottom-[25%] left-[40%] w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/5 to-orange-500/5 border border-white/5 backdrop-blur-[1px] pointer-events-none z-0 bubble-float-2" />
      <div className="absolute top-[15%] right-[45%] w-12 h-12 rounded-full bg-gradient-to-b from-white/5 to-transparent border border-white/10 pointer-events-none z-0 bubble-float-3" />
      <div className="absolute bottom-[15%] left-[4%] w-20 h-20 rounded-full bg-gradient-to-tl from-zinc-800/20 to-transparent border border-zinc-700/10 pointer-events-none z-0 bubble-float-4" />
      <div className="absolute top-[40%] right-[6%] w-14 h-14 rounded-full bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/5 pointer-events-none z-0 bubble-float-1" />

      {/* Workspace Wrapper with tight paddings and optimized grid gaps */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        
        {/* Left Column: Text Layout */}
        <div className="w-full lg:w-[45%] flex flex-col items-start space-y-5">
          
          {/* Step Context Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-orange animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-orange uppercase">
              {activeStep.subtitle}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400 leading-[1.15] uppercase drop-shadow-sm">
            {activeStep.title}
          </h2>

          {/* Balanced Description Body Text */}
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-lg font-medium">
            {activeStep.desc}
          </p>

          {/* CTA Trigger Button */}
          <button className="inline-flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-xl text-white text-sm font-bold px-7 py-3.5 rounded-full hover:bg-white hover:text-zinc-950 transition-all shadow-lg shadow-black/40 active:scale-98 group mt-2">
            <div className="p-1 rounded-md bg-white/5 group-hover:bg-zinc-950/5 transition-colors">
              {activeStep.icon}
            </div>
            Get Started Fast
          </button>
        </div>

        {/* Right Column: Tablet Mockup Layout */}
        <div className="w-full lg:w-[55%] flex justify-center lg:justify-end">
          {/* Hardware Frame Shell Container */}
          <div className="relative w-full max-w-[640px] aspect-[4/3]">
            
            {/* Physical Hardware Buttons */}
            <div className="absolute top-[-4px] right-16 w-12 h-1 bg-zinc-800 border-t border-white/20 rounded-t" />
            <div className="absolute right-[-4px] top-16 w-1 h-12 bg-zinc-800 border-r border-white/20 rounded-r" />
            <div className="absolute right-[-4px] top-32 w-1 h-12 bg-zinc-800 border-r border-white/20 rounded-r" />

            {/* Tablet Chassis */}
            <div className="w-full h-full border-[18px] border-light-blue bg-zinc-950 rounded-[44px] shadow-[0_35px_80px_-20px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(255,255,255,0.1)] ring-1 ring-white/10 overflow-hidden relative">
              
              {/* Front-Facing Camera Lens Assembly */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center justify-center z-40">
                <div className="w-2.5 h-2.5 rounded-full bg-black border border-zinc-800 flex items-center justify-center shadow-inner">
                  <div className="w-1 h-1 rounded-full bg-blue-950/80 shadow-[inset_0_0_1px_#00f]" />
                </div>
              </div>

              {/* Internal Screen Display Glass */}
              <div className="w-full h-full rounded-[26px] overflow-hidden relative bg-zinc-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                
                {/* Step Visual Preview Image */}
                <img
                  src={activeStep.bg}
                  className="w-full h-full object-contain object-center p-1"
                  alt={activeStep.title}
                  loading="eager"
                />

                {/* Real Ambient Screen Glare overlays */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.04] pointer-events-none z-20" />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_45%)] pointer-events-none z-20" />

                {/* Slider Control Interface Hub Dock */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 flex items-center justify-between gap-4">
                  
                  {/* Action Navigation Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prev}
                      className="w-10 h-10 rounded-full border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={next}
                      className="w-10 h-10 rounded-full border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Nav Track Points */}
                  <div className="flex items-center gap-2">
                    {initialSteps.map((s, index) => {
                      const isActive = items[1].step === s.step;
                      return (
                        <button
                          key={index}
                          onClick={() => jumpToStep(s.step)}
                          className="rounded-full"
                          style={{
                            width: isActive ? "28px" : "7px",
                            height: "7px",
                            background: isActive
                              ? "#FF6B35"
                              : "rgba(255,255,255,0.25)",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Linear Digital Index Counter */}
                  <span className="text-white/40 text-xs font-mono tracking-wider select-none bg-black/30 px-2.5 py-1 rounded-md border border-white/5 backdrop-blur-sm">
                    <span className="text-white font-bold">
                      {String(
                        initialSteps.findIndex(
                          (x) => x.step === items[1].step,
                        ) + 1,
                      ).padStart(2, "0")}
                    </span>
                    /{String(initialSteps.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}