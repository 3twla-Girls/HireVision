import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ShieldAlert, UserCheck, MessageSquare, AlertTriangle, 
  CheckCircle2, XCircle, ArrowLeft, Brain, MonitorOff, 
  Smartphone, Loader2, FileText, BarChart3, Lightbulb, ClipboardCheck
} from "lucide-react";
import api from "../../api/axios";
import CircularScore from "../../components/shared/CircularScore";

// ─── Styling Constants ────────────────────────────────────────────────────────
const C = {
  darkBlue: "#1B3C53",
  cta: "#FF914D",
  teal: "#5BBFBA",
  lightTeal: "#E8F6F5",
  lightGray: "#F7F9FB",
  border: "#E2E8F0",
  error: "#EF5350",
  success: "#10B981",
  warning: "#F59E0B",
  secondaryBlue: "#456882",
};

// ─── Helper Components ────────────────────────────────────────────────────────

const Tag = ({ label, color }) => (
  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border" 
        style={{ backgroundColor: `${color}10`, color: color, borderColor: `${color}30` }}>
    {label}
  </span>
);

const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15`, color: color }}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">{label}</p>
      <p className="text-md font-black text-[#1B3C53]">{value}</p>
      {subValue && <p className="text-[10px] text-gray-500 font-medium">{subValue}</p>}
    </div>
  </div>
);

const BulletList = ({ items, icon, color }) => {
  const itemsArray = Array.isArray(items) ? items : [];
  if (itemsArray.length === 0) return <p className="text-xs text-gray-400 italic px-2">None noted</p>;
  return (
    <ul className="space-y-2 mt-2">
      {itemsArray.map((item, i) => (
        <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed items-start">
          <span style={{ color }}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const CandidateInterviewReport = () => {
  const { sessionId } = useParams(); 
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState(null);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("responses"); // responses | behavioral | summary
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId || sessionId === "undefined") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [sessionRes, questionsRes] = await Promise.all([
          api.get(`/interview/session/${sessionId}`),
          api.get(`/interview/session-questions/${sessionId}`),
        ]);
        setReportData(sessionRes.data);
        setQuestionsWithAnswers(questionsRes.data.questions || []);
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FB] gap-4">
      <Loader2 size={40} className="animate-spin text-[#1B3C53]" />
      <p className="text-[#1B3C53] font-black text-sm uppercase tracking-widest">Generating HireVision Report...</p>
    </div>
  );

  if (!reportData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FB] gap-4">
      <AlertTriangle size={50} className="text-amber-500" />
      <h2 className="text-xl font-black text-[#1B3C53]">Report Not Found</h2>
      <button onClick={() => navigate(-1)} className="bg-[#1B3C53] text-white px-6 py-2 rounded-xl font-bold text-sm">Go Back</button>
    </div>
  );

  // ── Data Extraction ──
  const techSummary = reportData.final_summary?.technical || {};
  const integrity = reportData.final_summary?.integrity || {};
  const currentAnswer = reportData.answers[selectedQuestionIdx];
  
  const currentQuestionData = questionsWithAnswers.find(
    (q) => q.question_id === currentAnswer?.question_id?.$oid || q.question_id === currentAnswer?.question_id
  );

  const overallScore = Number(techSummary.final_score) * 20;
  return (
    <div className="min-h-screen bg-[#F7F9FB] pb-20 font-sans text-[#1B3C53]">
      
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors border border-gray-100 shadow-sm">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-black leading-tight">HireVision Interview Report</h1>
              <div className="flex items-center gap-2 mt-1">
                <Tag label={reportData.is_mock ? "Mock Session" : "Live Interview"} color={reportData.is_mock ? C.warning : C.success} />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: ...{sessionId.slice(-8)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Technical Score</p>
              <p className="text-2xl font-black text-[#1B3C53]">{techSummary.final_score}<span className="text-xs text-gray-400">/5</span></p>
            </div>
            <div className="h-8 w-[1px] bg-gray-200"></div>
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Match %</p>
               <CircularScore score={overallScore} size={45} strokeWidth={8} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* ── Tabs Navigation ── */}
        <div className="flex p-1 bg-gray-200/50 rounded-2xl w-fit mb-8 shadow-inner">
          {[
            { id: "responses", label: "Question Detail", icon: MessageSquare },
            { id: "behavioral", label: "Behavior & Integrity", icon: ShieldAlert },
            { id: "summary", label: "Executive Summary", icon: ClipboardCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab.id ? "bg-[#1B3C53] text-white shadow-md" : "text-gray-500 hover:text-[#1B3C53]"}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Question Details ── */}
        {activeTab === "responses" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Sidebar: Interview Flow */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <BarChart3 size={14} /> Interview Flow
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {reportData.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedQuestionIdx(idx)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedQuestionIdx === idx ? "bg-white border-[#1B3C53] shadow-lg" : "bg-white/50 border-transparent hover:border-gray-200"}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${selectedQuestionIdx === idx ? "bg-[#1B3C53] text-white" : "bg-gray-100 text-gray-400"}`}>
                        Q{idx + 1}
                      </span>
                      <span className="text-[10px] font-black text-[#5BBFBA]">Score: {ans.evaluation?.score}/5</span>
                    </div>
                    <p className="text-xs font-bold text-gray-600 line-clamp-2 leading-relaxed">
                      {questionsWithAnswers[idx]?.question || "Loading question text..."}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area: Answer Deep Dive */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <FileText size={120} />
                </div>

                {/* Question Text */}
                <div className="mb-8">
                  <div className="flex gap-2 mb-3">
                    <Tag label="Technical Question" color={C.darkBlue} />
                    <Tag label={currentQuestionData?.type || "Short Answer"} color={C.teal} />
                  </div>
                  <h2 className="text-lg font-black leading-snug">
                    {currentQuestionData?.question || "Question text not available"}
                  </h2>
                </div>

                {/* Transcription Card */}
                <div className="mb-8 p-6 bg-[#F7F9FB] rounded-2xl border-l-4 border-[#FF914D] relative">
                  <p className="text-[10px] font-black text-[#FF914D] uppercase mb-2 tracking-tighter">Candidate Transcription</p>
                  <p className="text-sm font-medium leading-relaxed italic text-[#456882]">
                    "{currentAnswer?.speech_to_text?.transcription || "No response recorded."}"
                  </p>
                </div>

                {/* AI Evaluation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                    <h4 className="text-[10px] font-black text-emerald-700 uppercase mb-3 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Strengths
                    </h4>
                    <BulletList items={currentAnswer?.evaluation?.strengths} icon="•" color={C.success} />
                  </div>
                  <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
                    <div className="text-[10px] font-black text-red-700 uppercase mb-3 flex items-center gap-1">
                      <XCircle size={14} /> Weaknesses
                    </div>
                    <BulletList items={currentAnswer?.evaluation?.weaknesses} icon="•" color={C.error} />
                  </div>
                </div>

                <div className="mt-6 p-5 bg-purple-50/50 rounded-2xl border border-purple-100">
                   <h4 className="text-[10px] font-black text-purple-700 uppercase mb-2">Technical Feedback</h4>
                   <p className="text-xs font-medium leading-relaxed text-purple-900/80">
                     {currentAnswer?.evaluation?.overall_feedback}
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Behavior & Integrity ── */}
        {activeTab === "behavioral" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Integrity Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={UserCheck} label="Identity Status" value={integrity.face_auth?.status} subValue={`${integrity.face_auth?.incidents_count} Incidents`} color={integrity.face_auth?.status === "Passed" ? C.success : C.error} />
              <StatCard icon={MonitorOff} label="Eye Gaze" value={integrity.eye_gaze?.status} subValue={`${integrity.eye_gaze?.total_warnings} Warnings`} color={integrity.eye_gaze?.status === "Passed" ? C.success : C.warning} />
              <StatCard icon={Smartphone} label="Proctoring" value={Object.values(reportData.phone_detection || {}).some(d => d.is_cheating) ? "Suspicious" : "Clean"} subValue="AI Device Check" color={Object.values(reportData.phone_detection || {}).some(d => d.is_cheating) ? C.error : C.success} />
              <StatCard icon={AlertTriangle} label="Navigation" value={reportData.tab_proctoring?.counts?.TAB_SWITCH || 0} subValue="Tab Switches" color={reportData.tab_proctoring?.counts?.TAB_SWITCH > 0 ? C.error : C.success} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Personality Profile */}
              <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                   <Brain className="text-[#FF914D]" size={28} />
                   <h3 className="text-lg font-black">AI Personality Profile (Big Five)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {Object.entries(reportData.personality?.overall?.traits || {}).map(([key, trait]) => (
                    <div key={key} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black text-[#1B3C53] uppercase">{key}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 rounded-md text-gray-500">{Math.round(trait.score * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#1B3C53] to-[#FF914D]" style={{ width: `${trait.score * 100}%` }}></div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-[#FF914D] uppercase">{trait.label}</span>
                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{trait.hr_report}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrity Incident Log */}
              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-[#1B3C53] p-8 rounded-[2.5rem] text-white shadow-xl">
                    <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-[#FF914D] flex items-center gap-2">
                       <Lightbulb size={16} /> Candidate Insights
                    </h3>
                    <ul className="space-y-4">
                      {reportData.personality?.overall?.candidate_view?.summary?.map((s, i) => (
                        <li key={i} className="text-xs flex items-start gap-3 font-medium opacity-90 leading-relaxed border-b border-white/10 pb-3 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-[#FF914D] mt-1 shrink-0 shadow-[0_0_8px_#FF914D]" /> {s}
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Executive Summary ── */}
        {activeTab === "summary" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             {/* Decision Card */}
             <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center max-w-3xl mx-auto">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                   <ClipboardCheck size={40} />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">Final Evaluation Summary</h2>
                <p className="text-gray-400 font-medium text-sm mb-8 italic">"{techSummary.summary_for_recruiter}"</p>
                
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Overall Strengths</h4>
                     <BulletList items={techSummary.overall_strengths} icon="✓" color={C.success} />
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Overall Weaknesses</h4>
                     <BulletList items={techSummary.overall_weaknesses} icon="✗" color={C.error} />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 w-full">
                   <div className="flex items-center justify-between bg-[#1B3C53] p-6 rounded-2xl text-white">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">HR Recommendation</p>
                        <p className="text-xl font-black text-[#FF914D] tracking-wide">{reportData.personality?.overall?.hr_view?.decision || "Consider"}</p>
                      </div>
                      <Tag label="HireVision Certified" color={C.teal} />
                   </div>
                </div>
             </div>

             {/* Skills Assessment Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(techSummary.skill_assessment || {}).map(([skill, comment]) => (
                  <div key={skill} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3">{skill.replace(/_/g, " ")}</p>
                    <p className="text-xs font-bold leading-relaxed text-[#1B3C53]">{comment}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateInterviewReport;