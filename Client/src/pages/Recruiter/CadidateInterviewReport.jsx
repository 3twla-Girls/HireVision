import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ShieldAlert, UserCheck, MessageSquare, AlertTriangle, 
  CheckCircle2, XCircle, ArrowLeft, Brain, MonitorOff, 
  Smartphone, Loader2, FileText, BarChart3, Lightbulb, 
  ClipboardCheck, Eye, Copy, Maximize, Layout, UserPlus, UserMinus
} from "lucide-react";
import api from "../../api/axios";
import CircularScore from "../../components/shared/CircularScore";

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

const StatCard = ({ icon: Icon, label, value, color, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${isActive ? 'bg-white shadow-md border-b-4' : 'bg-gray-50/50 border-transparent opacity-70 hover:opacity-100'}`}
    style={{ borderBottomColor: isActive ? color : 'transparent' }}
  >
    <div className={`p-2.5 rounded-xl`} style={{ backgroundColor: `${color}15`, color: color }}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">{label}</p>
      <p className="text-sm font-black text-[#1B3C53]">{value}</p>
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
  const [activeTab, setActiveTab] = useState("responses"); 
  const [activeSubTab, setActiveSubTab] = useState("personality"); // personality | eye | phone | proctoring | face
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

  const techSummary = reportData.final_summary?.technical || {};
  const integrity = reportData.final_summary?.integrity || {};
  const proctoring = reportData.tab_proctoring || { counts: {} };
  const currentAnswer = reportData.answers[selectedQuestionIdx];
  const currentQuestionData = questionsWithAnswers[selectedQuestionIdx];
  const overallScore = Number(techSummary.final_score) * 20;

  return (
    <div className="min-h-screen bg-[#F7F9FB] pb-20 font-sans text-[#1B3C53]">
      
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-20 z-20 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors border border-gray-100 shadow-sm">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-black leading-tight">Interview Report</h1>
              <div className="flex items-center gap-2 mt-1">
                <Tag label={reportData.is_mock ? "Mock Session" : "Live Interview"} color={reportData.is_mock ? C.warning : C.success} />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: ...{sessionId.slice(-8)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Tech Score</p>
              <p className="text-2xl font-black text-[#1B3C53]">{techSummary.final_score}<span className="text-xs text-gray-400">/10</span></p>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* ── Tabs Navigation ── */}
        <div className="flex p-1 bg-gray-200/50 rounded-2xl w-fit mb-8 shadow-inner">
          {[
            { id: "responses", label: "Technical Detail", icon: MessageSquare },
            { id: "behavioral", label: "Behavior & Integrity", icon: ShieldAlert },
            { id: "summary", label: "Final Summary", icon: ClipboardCheck },
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

        {/* ── Tab 1: Question Details (Technical) ── */}
        {activeTab === "responses" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Interview Flow</h3>
              <div className="space-y-3">
                {reportData.answers.map((ans, idx) => (
                  <div key={idx} onClick={() => setSelectedQuestionIdx(idx)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedQuestionIdx === idx ? "bg-white border-[#1B3C53] shadow-lg" : "bg-white/50 border-transparent hover:border-gray-200"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${selectedQuestionIdx === idx ? "bg-[#1B3C53] text-white" : "bg-gray-100 text-gray-400"}`}>Q{idx + 1}</span>
                      <span className="text-[10px] font-black text-[#5BBFBA]">Score: {ans.evaluation?.score}/10</span>
                    </div>
                    <p className="text-xs font-bold text-gray-600 line-clamp-1">{questionsWithAnswers[idx]?.question || "Question Text"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <Tag label={currentQuestionData?.type || "Short"} color={C.teal} />
                <h2 className="text-lg font-black mt-3 mb-6 leading-relaxed">{currentQuestionData?.question}</h2>
                <div className="p-6 bg-[#F7F9FB] rounded-2xl border-l-4 border-[#FF914D] mb-8">
                  <p className="text-[10px] font-black text-[#FF914D] uppercase mb-2">Candidate Answer</p>
                  <p className="text-sm font-medium italic text-[#456882]">"{currentAnswer?.speech_to_text?.transcription || "No response recorded."}"</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                    <h4 className="text-[10px] font-black text-emerald-700 uppercase mb-3 flex items-center gap-1"><CheckCircle2 size={14} /> Strengths</h4>
                    <BulletList items={currentAnswer?.evaluation?.strengths} icon="•" color={C.success} />
                  </div>
                  <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
                    <h4 className="text-[10px] font-black text-red-700 uppercase mb-3 flex items-center gap-1"><XCircle size={14} /> Weaknesses</h4>
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

        {/* ── Tab 2: Behavior & Integrity (The Detailed One) ── */}
        {activeTab === "behavioral" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Clickable Sub-Tabs Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard icon={Brain} label="Personality" value="Full Analysis" color={C.cta} isActive={activeSubTab === 'personality'} onClick={() => setActiveSubTab('personality')} />
              <StatCard icon={Eye} label="Eye Gaze" value={integrity.eye_gaze?.status} color={integrity.eye_gaze?.status === "Passed" ? C.success : C.warning} isActive={activeSubTab === 'eye'} onClick={() => setActiveSubTab('eye')} />
              <StatCard icon={Smartphone} label="Phone" value={Object.values(reportData.phone_detection || {}).some(d => d.is_cheating) ? "Suspicious" : "Clean"} color={Object.values(reportData.phone_detection || {}).some(d => d.is_cheating) ? C.error : C.success} isActive={activeSubTab === 'phone'} onClick={() => setActiveSubTab('phone')} />
              <StatCard icon={Layout} label="Tab Proctoring" value={`${proctoring.counts?.TAB_SWITCH || 0} Switches`} color={proctoring.counts?.TAB_SWITCH > 0 ? C.error : C.success} isActive={activeSubTab === 'proctoring'} onClick={() => setActiveSubTab('proctoring')} />
              <StatCard icon={UserCheck} label="Face Auth" value={integrity.face_auth?.status} color={integrity.face_auth?.status === "Passed" ? C.success : C.error} isActive={activeSubTab === 'face'} onClick={() => setActiveSubTab('face')} />
            </div>

            {/* Sub-Tab Content Area */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[400px]">
              
              {/* 1. Personality Traits */}
              {activeSubTab === 'personality' && (
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
                       <Lightbulb size={16} /> Candidate Personality Insights
                    </h3>
                    <ul className="space-y-4">
                      {reportData.personality?.overall?.hr_view?.summary?.map((s, i) => (
                        <li key={i} className="text-xs flex items-start gap-3 font-medium opacity-90 leading-relaxed border-b border-white/10 pb-3 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-[#FF914D] mt-1 shrink-0 shadow-[0_0_8px_#FF914D]" /> {s}
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>
            </div>
              )}

              {/* 2. Eye Gaze Details */}
              {activeSubTab === 'eye' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-6"><Eye className="text-blue-500" size={28} /><h3 className="text-lg font-black">Visual Attention (Eye Gaze)</h3></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Status Summary</p>
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl font-black ${integrity.eye_gaze?.status === "Passed" ? "text-emerald-500" : "text-amber-500"}`}>{integrity.eye_gaze?.status}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase">Candidate gaze was <br/> {integrity.eye_gaze?.status === "Passed" ? "consistently on screen" : "frequently off screen"}</div>
                      </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100">
                      <p className="text-xs font-black text-amber-600 uppercase mb-4 tracking-widest">Gaze Alerts</p>
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold text-sm"><span>Total Duration:</span><span className="text-amber-700">{integrity.eye_gaze?.total_duration} Seconds</span></div>
                        <div className="flex justify-between font-bold text-sm"><span>Total Warnings Issued:</span><span className="text-amber-700">{integrity.eye_gaze?.total_warnings} Warnings</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Phone Detection Details */}
              {activeSubTab === 'phone' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-6"><Smartphone className="text-red-500" size={28} /><h3 className="text-lg font-black">AI Device Detection Log</h3></div>
                  <div className="overflow-hidden rounded-2xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          <th className="px-6 py-4">Question Index</th>
                          <th className="px-6 py-4">Detection Status</th>
                          <th className="px-6 py-4">Severity</th>
                          <th className="px-6 py-4">Total Duration (s)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.answers.map((ans, idx) => {
                          const phone = reportData.phone_detection[ans.question_id?.$oid || ans.question_id];
                          return (
                            <tr key={idx} className={phone?.is_cheating ? "bg-red-50/30" : ""}>
                              <td className="px-6 py-4 text-xs font-bold">Question 0{idx+1}</td>
                              <td className="px-6 py-4">
                                {phone?.is_cheating ? <Tag label="Device Detected" color={C.error} /> : <Tag label="No Device" color={C.success} />}
                              </td>
                              <td className={`px-6 py-4 text-xs font-black uppercase ${phone?.is_cheating ? "text-red-600" : "text-emerald-600"}`}>{phone?.severity || "Clean"}</td>
                              <td className="px-6 py-4 text-xs font-medium">{phone?.summary?.total_cheating_sec?.toFixed(1) || 0}s</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Tab Proctoring Details */}
              {activeSubTab === 'proctoring' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-8"><Maximize className="text-purple-600" size={28} /><h3 className="text-lg font-black">Screen & Browser Proctoring</h3></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "Tab Switches", count: proctoring.counts?.TAB_SWITCH, icon: Layout, color: "#9333ea" },
                      { label: "Window Blur", count: proctoring.counts?.WINDOW_BLUR, icon: MonitorOff, color: "#2563eb" },
                      { label: "Copy Attempts", count: proctoring.counts?.COPY_ATTEMPT, icon: Copy, color: "#dc2626" },
                      { label: "Fullscreen Exits", count: proctoring.counts?.EXIT_FULLSCREEN, icon: Maximize, color: "#ea580c" },
                    ].map((item, i) => (
                      <div key={i} className="p-5 rounded-3xl border border-gray-100 bg-gray-50/50">
                        <item.icon size={20} style={{ color: item.color }} className="mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase">{item.label}</p>
                        <p className="text-2xl font-black">{item.count || 0}</p>
                      </div>
                    ))}
                  </div>
                  {proctoring.events?.length > 0 ? (
                    <div className="space-y-3">
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Incident Timeline</p>
                       {proctoring.events.map((ev, idx) => (
                         <div key={idx} className="p-4 rounded-xl bg-red-50 border border-red-100 flex justify-between items-center">
                           <span className="text-xs font-bold text-red-700">{ev.type.replace(/_/g, ' ')}</span>
                           <span className="text-[10px] font-black text-red-400">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center bg-emerald-50 rounded-3xl border-2 border-dashed border-emerald-100">
                      <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-bold text-emerald-700">Perfect Proctoring Score! No browser violations detected.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Face Authentication Details */}
              {activeSubTab === 'face' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-8"><UserCheck className="text-emerald-600" size={28} /><h3 className="text-lg font-black">Identity Verification (Face Auth)</h3></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                     <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <UserMinus size={24} className="mx-auto mb-3 text-red-400" />
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Different Person</p>
                        <p className="text-xl font-black">{integrity.face_auth?.counts?.different_person || 0}</p>
                     </div>
                     <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <MonitorOff size={24} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">No Face Detected</p>
                        <p className="text-xl font-black">{integrity.face_auth?.counts?.no_face || 0}</p>
                     </div>
                     <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                        <UserPlus size={24} className="mx-auto mb-3 text-amber-400" />
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Multiple Faces</p>
                        <p className="text-xl font-black">{integrity.face_auth?.counts?.multiple_faces || 0}</p>
                     </div>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-[#1B3C53] text-white flex justify-between items-center">
                     <div>
                       <p className="text-xs font-black text-blue-200 uppercase tracking-widest mb-1">Final Auth Decision</p>
                       <p className="text-xl font-black text-[#FF914D]">{integrity.face_auth?.status}</p>
                     </div>
                     <Tag label={`${integrity.face_auth?.incidents_count || 0} Total Incidents`} color="#FF914D" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab 3: Executive Summary ── */}
        {activeTab === "summary" && (
          <div className="space-y-12 animate-in fade-in">
            
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-md flex flex-col items-center text-center max-w-4xl mx-auto">
              <ClipboardCheck size={40} className="text-[#10B981] mb-4" />
              <h2 className="text-2xl font-black mb-2 text-[#1B3C53]">Final Evaluation Summary</h2>
              <p className="text-[#456882] text-sm mb-8 italic font-medium">"{techSummary.summary_for_recruiter}"</p>
              
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                  <h4 className="text-[10px] font-black text-emerald-700 uppercase mb-4 tracking-widest px-2">Overall Strengths</h4>
                  <BulletList items={techSummary.overall_strengths} icon="✓" color={C.success} />
                </div>
                <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                  <h4 className="text-[10px] font-black text-red-700 uppercase mb-4 tracking-widest px-2">Overall Weaknesses</h4>
                  <BulletList items={techSummary.overall_weaknesses} icon="✗" color={C.error} />
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-100 w-full flex items-center justify-between bg-[#1B3C53] p-6 rounded-2xl text-white shadow-lg">
                <div className="text-left font-black">
                  <p className="text-[10px] text-blue-200 uppercase mb-1">HR Recommendation</p>
                  <p className="text-xl text-[#FF914D]">{reportData.personality?.overall?.hr_view?.decision || "Consider"}</p>
                </div>
                <Tag label="HireVision AI Verified" color={C.teal} />
              </div>
            </div>

            <div className="w-full">
              <div className="flex items-center gap-3 mb-6 px-2">
                <h3 className="text-lg font-black text-[#1B3C53]">Detailed Skill Assessment</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(techSummary.skill_assessment || {}).map(([skill, assessmentData]) => {
                  const level = assessmentData?.understanding || assessmentData?.rating;
                  const details = assessmentData?.evidence || assessmentData?.remarks;

                  return (
                    <div
                      key={skill}
                      className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-[#E8F6F5] rounded-lg">
                          <span className="block w-2 h-2 rounded-full bg-[#5BBFBA]" />
                        </div>
                        <h4 className="text-xs font-black text-[#1B3C53] uppercase tracking-wider">
                          {skill.replace(/_/g, " ")}
                        </h4>
                      </div>

                      <div className="flex flex-col gap-4 flex-1">
                        {level && (
                          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                            <span className="text-[10px] font-black text-[#456882] uppercase tracking-widest">Rating</span>
                            <span 
                              className={`text-xs font-black uppercase tracking-wider ${
                                level === "None" || level === "Poor" ? "text-[#EF5350]" : 
                                level === "Good" || level === "Excellent" ? "text-[#10B981]" : 
                                "text-[#F59E0B]"
                              }`}
                            >
                              {level}
                            </span>
                          </div>
                        )}

                        {details && (
                          <div className="bg-[#F7F9FB] p-5 rounded-2xl border border-gray-100 flex-1">
                            <p className="text-[10px] font-black text-[#456882] uppercase tracking-widest mb-2">Remarks</p>
                            <p className="text-sm font-semibold text-[#1B3C53] leading-relaxed">
                              {details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateInterviewReport;