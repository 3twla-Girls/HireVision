import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useParams } from "react-router-dom";
import CircularScore from "../../components/shared/CircularScore";

// ─── Styling Constants ────────────────────────────────────────────────────────
const C = {
  darkBlue: "#1B3C53",
  logoBlue: "#063192",
  secondaryBlue: "#456882",
  teal: "#5BBFBA",
  lightTeal: "#E8F6F5",
  cta: "#FF914D",
  lightGray: "#F7F9FB",
  border: "#D3D3D3",
  primaryText: "#303030",
  secondaryText: "#5F5F5F",
  success: "#4CAF50",
  warning: "#FFA726",
  error: "#EF5350",
};

// Distinct colors for question indicators
const questionColors = [
  "#4361ee", // blue
  "#e63946", // red
  "#2a9d8f", // teal
  "#e9c46a", // gold
  "#9c27b0", // purple
  "#f4a261", // orange
  "#6c757d", // gray
  "#06d6a0", // mint
];

function scoreColor(s) {
  return s >= 80 ? C.success : s >= 60 ? C.teal : s >= 40 ? C.warning : C.error;
}

// Helper function to ensure items is always an array
const ensureArray = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "string") return [items];
  return [];
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function PersonalityTrait({ traitKey, traitData }) {
  const score = Math.round((traitData?.score || 0) * 100);
  const getCategoryColor = (category) => {
    switch (category) {
      case "high":
        return C.success;
      case "moderate":
        return C.teal;
      case "low":
        return C.warning;
      default:
        return C.secondaryBlue;
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: C.secondaryText,
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {traitKey}
      </div>
      <ScoreRing score={score} size={60} />
      <div
        style={{
          marginTop: "8px",
          fontWeight: 700,
          fontSize: "13px",
          color: getCategoryColor(traitData?.category),
        }}
      >
        {traitData?.label || traitData?.category || "N/A"}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: C.secondaryText,
          marginTop: "6px",
          lineHeight: "1.4",
        }}
      >
        {traitData?.candidate_feedback || traitData?.hr_report || "No description available"}
      </div>
    </div>
  );
}

function ScoreRing({ score, size = 80 }) {
  return (
    <CircularScore
      score={score}
      size={size}
      strokeColor={scoreColor(score)}
      textColor={scoreColor(score)}
    />
  );
}

const parseSkill = (value) => {
  if (value === null || value === undefined || value === "")
    return "No data available";
  if (typeof value === "object") {
    const parts = Object.entries(value).map(
      ([k, v]) => `${k.replace(/_/g, " ")}: ${v}`,
    );
    return parts.length ? parts.join(" · ") : "No data available";
  }
  return String(value);
};

function Tag({ label, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: 999,
        background: color + "18",
        color,
        fontWeight: 700,
        fontSize: 11,
        border: `1px solid ${color}44`,
        marginRight: 6,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}
    >
      {label}
    </span>
  );
}

function CollapsibleSection({
  title,
  icon,
  color,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        border: `1.5px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: color + "10",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: 13,
          color,
        }}
      >
        <span>{icon}</span>
        {title}
        <span
          style={{ marginLeft: "auto", color: C.secondaryText, fontSize: 12 }}
        >
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div style={{ padding: "10px 16px 14px" }}>{children}</div>}
    </div>
  );
}

function BulletList({ items, icon, iconColor }) {
  const itemsArray = ensureArray(items);

  if (itemsArray.length === 0) {
    return (
      <p
        style={{
          fontSize: 13,
          color: C.secondaryText,
          margin: 0,
          fontStyle: "italic",
        }}
      >
        None noted
      </p>
    );
  }

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {itemsArray.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              color: iconColor,
              fontSize: 14,
              marginTop: 2,
              flexShrink: 0,
              fontWeight: 900
            }}
          >
            {icon}
          </span>
          <span
            style={{ fontSize: 13, color: C.secondaryText, lineHeight: 1.5 }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CandidateReport() {
  const { sessionId } = useParams();

  const [reportData, setReportData] = useState(null);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState("detail");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!sessionId) return;
        setLoading(true);

        const [sessionRes, questionsRes] = await Promise.all([
          api.get(`/interview/session/${sessionId}`),
          api.get(`/interview/session-questions/${sessionId}`),
        ]);
        setReportData(sessionRes.data);
        setQuestionsWithAnswers(questionsRes.data.questions);
      } catch (err) {
        console.error(err);
        setError("Failed to load report. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "sans-serif",
          color: C.darkBlue
        }}
      >
        <h3>Loading Candidate Report...</h3>
      </div>
    );
  }

  if (error || !reportData || !reportData.answers) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          color: C.error,
          fontFamily: "sans-serif",
        }}
      >
        <h2>{error || "No report data found."}</h2>
      </div>
    );
  }

  // ─── Data Extraction ───
  const technicalData = reportData?.final_summary?.technical || {};
  const activeAnswer = reportData.answers[activeIdx];
  const activeQuestion =
    questionsWithAnswers.find(
      (q) => q.question_id === activeAnswer?.question_id || q._id === activeAnswer?.question_id?.$oid,
    ) || questionsWithAnswers[activeIdx];

  const score = Number(technicalData?.final_score);
  const overallScore = isNaN(score) ? 0 : score * 10;
  
  const getQuestionDotColor = (index, isActive) => {
    if (isActive) return C.logoBlue;
    return questionColors[index % questionColors.length];
  };

  const getActiveCardBackground = (isActive, index) => {
    if (!isActive) return "transparent";
    return `${questionColors[index % questionColors.length]}08`;
  };

  const getActiveCardBorder = (isActive, index) => {
    if (!isActive) return "transparent";
    return questionColors[index % questionColors.length];
  };

  const formatTips = (tips) => {
    if (!tips) return [];
    if (Array.isArray(tips)) return tips;
    if (typeof tips === "string") {
      return tips
        .split(/\d+\.\s*|\n\s*[•\-]\s*|\n+/)
        .filter((tip) => tip.trim().length > 0);
    }
    return [];
  };

  const faceStatus = reportData.final_summary?.integrity?.face_auth?.status || "N/A";
  const eyeStatus = reportData.final_summary?.integrity?.eye_gaze?.status || "N/A";
  const hasPhoneCheating = Object.values(reportData.phone_detection || {}).some(d => d.is_cheating);
  const tabSwitches = reportData.tab_proctoring?.counts?.TAB_SWITCH || 0;

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        background: C.lightGray,
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        color: C.primaryText,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: C.darkBlue,
            }}
          >
            Candidate Interview Report
          </h1>
          <p
            style={{ margin: "8px 0 0", color: C.secondaryText, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>Session: {new Date(reportData.session_date?.$date || reportData.session_date).toLocaleString()}</span>
            <span>·</span>
            <Tag
              label={reportData.is_mock ? "Mock" : "Live"}
              color={reportData.is_mock ? C.warning : C.success}
            />
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
                color: C.secondaryText,
                marginBottom: 4,
                fontWeight: 600,
                textTransform: "uppercase"
              }}
            >
              Overall Score
            </div>
            <ScoreRing score={overallScore} size={68} />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "detail", label: "📋 Question Detail" },
          { key: "summary", label: "📊 Final Summary" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 24px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === t.key ? C.darkBlue : "#fff",
              color: tab === t.key ? "#fff" : C.secondaryText,
              boxShadow:
                tab === t.key
                  ? `0 2px 8px ${C.darkBlue}44`
                  : "0 1px 3px rgba(0,0,0,0.07)",
              transition: "all 0.2s"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Detail Tab ── */}
      {tab === "detail" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "230px 1fr 240px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Interview Flow Sidebar */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "18px 14px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            }}
          >
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: C.darkBlue }}>
              Interview Flow
            </h3>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 9,
                  top: 10,
                  bottom: 10,
                  width: 2,
                  background: C.border,
                  zIndex: 0,
                }}
              />
              {reportData.answers.map((ans, i) => {
                const q =
                  questionsWithAnswers.find(
                    (qw) => qw.question_id === ans.question_id || qw._id === ans.question_id?.$oid,
                  ) || questionsWithAnswers[i];
                
                let sc = ans.evaluation?.score * 10 || 0;
                let statusText = `Score: ${sc}/100`;
                let scColor = scoreColor(sc);

                if (ans.type === "mcq" || ans.evaluation?.type === "mcq") {
                  const isCorr = ans.evaluation?.is_correct;
                  statusText = isCorr ? "✅ Correct" : "❌ Incorrect";
                  scColor = isCorr ? C.success : C.error;
                }

                const isActive = i === activeIdx;
                const dotColor = getQuestionDotColor(i, isActive);
                const cardBg = getActiveCardBackground(isActive, i);
                const cardBorderColor = getActiveCardBorder(isActive, i);

                return (
                  <div
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 18,
                      cursor: "pointer",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: dotColor,
                        border: isActive
                          ? `3px solid ${dotColor}40`
                          : "2px solid #fff",
                        boxShadow: isActive
                          ? `0 0 0 3px ${dotColor}80`
                          : "none",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        background: cardBg,
                        border: `1.5px solid ${isActive ? cardBorderColor : "transparent"}`,
                        borderRadius: 8,
                        padding: "6px 8px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: isActive ? dotColor : C.primaryText,
                          marginBottom: 2
                        }}
                      >
                        Q{i + 1}: {q?.question?.slice(0, 18)}…
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: scColor,
                          fontWeight: 700,
                        }}
                      >
                        {statusText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Question Panel */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <Tag
                    label={`Q ${activeIdx + 1}`}
                    color={questionColors[activeIdx % questionColors.length]}
                  />
                  <Tag
                    label={activeQuestion?.type?.toUpperCase() || activeAnswer?.type?.toUpperCase() || "SHORT"}
                    color={C.teal}
                  />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.darkBlue,
                    lineHeight: 1.5,
                  }}
                >
                  {activeQuestion?.question || "Question not found"}
                </h3>
              </div>
              
              {activeAnswer?.type !== "mcq" && (
                <ScoreRing
                  score={
                    activeAnswer.evaluation?.score !== undefined &&
                    activeAnswer.evaluation?.score !== null
                      ? activeAnswer.evaluation.score * 10
                      : 0
                  }
                  size={78}
                />
              )}
            </div>

            {/* Render Based on Type */}
            {activeAnswer?.type === "mcq" ? (
              // --- MCQ RENDER ---
              <div style={{ marginTop: 24 }}>
                {activeQuestion?.options && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.secondaryText, textTransform: 'uppercase', marginBottom: 12 }}>
                      Question Options
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {activeQuestion.options.map((opt, idx) => {
                        const char = String.fromCharCode(65 + idx);
                        const isSelected = char === (activeAnswer.selected_option || activeAnswer.evaluation?.selected_answer);
                        const isCorrect = char === activeAnswer.evaluation?.correct_answer;
                        
                        let bg = "#f9f9f9";
                        let border = `1px solid ${C.border}`;
                        let textColor = C.primaryText;
                        let icon = null;

                        if (isSelected && isCorrect) {
                          bg = `${C.success}15`; border = `2px solid ${C.success}`; textColor = C.success; icon = "✅";
                        } else if (isSelected && !isCorrect) {
                          bg = `${C.error}15`; border = `2px solid ${C.error}`; textColor = C.error; icon = "❌";
                        } else if (!isSelected && isCorrect) {
                          bg = `${C.success}08`; border = `2px dashed ${C.success}`; textColor = C.success; icon = "✓ (Correct)";
                        }

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: "12px 16px",
                              borderRadius: 10,
                              border,
                              background: bg,
                              fontSize: 14,
                              fontWeight: isSelected || isCorrect ? 700 : 500,
                              color: textColor,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <span>
                              <span style={{ 
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 24, height: 24, borderRadius: 6, background: '#fff', 
                                border: 'inherit', marginRight: 12, fontSize: 12, fontWeight: 900 
                              }}>{char}</span> 
                              {opt}
                            </span>
                            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div style={{ 
                  background: activeAnswer.evaluation?.is_correct ? `${C.success}10` : `${C.error}10`, 
                  borderLeft: `4px solid ${activeAnswer.evaluation?.is_correct ? C.success : C.error}`,
                  padding: "16px 20px", 
                  borderRadius: 8 
                }}>
                  <strong style={{ color: activeAnswer.evaluation?.is_correct ? C.success : C.error, fontSize: 16 }}>
                    {activeAnswer.evaluation?.is_correct ? "You answered correctly!" : "Incorrect Answer."}
                  </strong>
                </div>
              </div>
            ) : (
              // --- CONCEPTUAL/SHORT RENDER ---
              <>
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: C.secondaryBlue,
                        textTransform: 'uppercase'
                      }}
                    >
                      Your Answer
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#FFFBF5",
                      border: `1px solid ${C.cta}44`,
                      borderLeft: `4px solid ${C.cta}`,
                      borderRadius: 8,
                      padding: "16px",
                      fontSize: 14,
                      color: C.primaryText,
                      lineHeight: 1.7,
                      fontStyle: "italic"
                    }}
                  >
                    "{activeAnswer.speech_to_text?.transcription || "No transcription available"}"
                  </div>
                </div>

                <div
                  style={{
                    background: C.lightTeal,
                    border: `1px solid ${C.teal}44`,
                    borderRadius: 8,
                    padding: "14px",
                    marginBottom: 20,
                    fontSize: 14,
                    color: C.darkBlue,
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{fontWeight: 800}}>💡 Evaluator Feedback:</span>{" "}
                  {activeAnswer.evaluation?.overall_feedback || "No feedback available"}
                </div>

                <CollapsibleSection
                  title="Positive Indicators"
                  icon="✅"
                  color={C.success}
                >
                  <BulletList
                    items={activeAnswer.evaluation?.strengths}
                    icon="✓"
                    iconColor={C.success}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Growth Areas"
                  icon="⚠️"
                  color={C.warning}
                >
                  <BulletList
                    items={activeAnswer.evaluation?.weaknesses}
                    icon="⚠"
                    iconColor={C.warning}
                  />
                </CollapsibleSection>

                <CollapsibleSection
                  title="Missed Key Points"
                  icon="❌"
                  color={C.error}
                >
                  <BulletList
                    items={activeAnswer.evaluation?.missing_points}
                    icon="•"
                    iconColor={C.error}
                  />
                </CollapsibleSection>
              </>
            )}

            {/* Navigation Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 24,
                paddingTop: 16,
                borderTop: `1px solid ${C.border}`
              }}
            >
              <button
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                style={{
                  padding: "10px 24px",
                  borderRadius: 999,
                  border: `1.5px solid ${activeIdx === 0 ? C.border : C.darkBlue}`,
                  background: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: activeIdx === 0 ? "not-allowed" : "pointer",
                  color: activeIdx === 0 ? C.border : C.darkBlue,
                  transition: "all 0.2s"
                }}
              >
                ← Previous
              </button>
              <button
                onClick={() =>
                  setActiveIdx((i) =>
                    Math.min(reportData.answers.length - 1, i + 1),
                  )
                }
                disabled={activeIdx === reportData.answers.length - 1}
                style={{
                  padding: "10px 32px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    activeIdx === reportData.answers.length - 1
                      ? C.border
                      : C.cta,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor:
                    activeIdx === reportData.answers.length - 1
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.2s"
                }}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Snapshot Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: C.darkBlue }}>
              Quick Snapshot
            </h3>
            {reportData.answers.map((ans, i) => {
              let sc = ans.evaluation?.score * 10 || 0;
              let isMCQ = ans.type === "mcq" || ans.evaluation?.type === "mcq";
              
              if (isMCQ) {
                ans.evaluation?.is_correct ? (sc = 100) : (sc = 0);
              }

              const questionColor = questionColors[i % questionColors.length];
              
              return (
                <div
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  style={{
                    background: i === activeIdx ? `${questionColor}10` : "#fff",
                    border: `1.5px solid ${i === activeIdx ? questionColor : "transparent"}`,
                    borderRadius: 12,
                    padding: "14px",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: questionColor,
                      marginBottom: 8,
                      textTransform: "uppercase"
                    }}
                  >
                    Question 0{i + 1}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {isMCQ ? (
                      <span style={{ fontSize: 14, fontWeight: 800, color: sc === 100 ? C.success : C.error }}>
                        {sc === 100 ? "Correct ✅" : "Incorrect ❌"}
                      </span>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(sc), lineHeight: 1 }}>{sc}</span>
                          <span style={{ fontSize: 11, color: C.secondaryText, marginLeft: 2 }}>/100</span>
                        </div>
                        <Tag
                          label={sc >= 80 ? "Strong" : sc >= 60 ? "Good" : sc >= 40 ? "Weak" : "Poor"}
                          color={scoreColor(sc)}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Summary Tab ── */}
      {tab === "summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Integrity Dashboard */}
          <div style={{ marginBottom: 8 }}>
             <h3 style={{ fontSize: 18, fontWeight: 800, color: C.darkBlue, margin: "0 0 16px" }}>Session Integrity & Proctoring</h3>
             <div
               style={{
                 display: "grid",
                 gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                 gap: 16,
               }}
             >
               {/* Eye Gaze */}
               <div
                 style={{
                   background: "#fff", padding: "20px 24px", borderRadius: 16,
                   borderTop: `4px solid ${eyeStatus === "High Alerts" ? C.error : C.success}`,
                   boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                 }}
               >
                 <h4 style={{ margin: "0 0 8px", color: C.secondaryText, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eye Gaze</h4>
                 <div style={{ fontSize: 18, fontWeight: 900, color: eyeStatus === "High Alerts" ? C.error : C.success }}>
                   {eyeStatus}
                 </div>
                 <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: C.secondaryText }}>
                   {reportData.final_summary?.integrity?.eye_gaze?.total_warnings || 0} Warnings
                 </p>
               </div>
               
               {/* Face Auth */}
               <div
                 style={{
                   background: "#fff", padding: "20px 24px", borderRadius: 16,
                   borderTop: `4px solid ${faceStatus === "Failed" ? C.error : C.success}`,
                   boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                 }}
               >
                 <h4 style={{ margin: "0 0 8px", color: C.secondaryText, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Face Auth</h4>
                 <div style={{ fontSize: 18, fontWeight: 900, color: faceStatus === "Failed" ? C.error : C.success }}>
                   {faceStatus}
                 </div>
                 <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: C.secondaryText }}>
                   {reportData.final_summary?.integrity?.face_auth?.incidents_count || 0} Incidents
                 </p>
               </div>

               {/* Phone Detection */}
               <div
                 style={{
                   background: "#fff", padding: "20px 24px", borderRadius: 16,
                   borderTop: `4px solid ${hasPhoneCheating ? C.error : C.success}`,
                   boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                 }}
               >
                 <h4 style={{ margin: "0 0 8px", color: C.secondaryText, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Detection</h4>
                 <div style={{ fontSize: 18, fontWeight: 900, color: hasPhoneCheating ? C.error : C.success }}>
                   {hasPhoneCheating ? "Suspicious" : "Clean"}
                 </div>
                 <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: C.secondaryText }}>
                   AI Visual Scan
                 </p>
               </div>

               {/* Browser Proctoring */}
               <div
                 style={{
                   background: "#fff", padding: "20px 24px", borderRadius: 16,
                   borderTop: `4px solid ${tabSwitches > 0 ? C.warning : C.success}`,
                   boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                 }}
               >
                 <h4 style={{ margin: "0 0 8px", color: C.secondaryText, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Browser Focus</h4>
                 <div style={{ fontSize: 18, fontWeight: 900, color: tabSwitches > 0 ? C.warning : C.success }}>
                   {tabSwitches > 0 ? "Tab Switches" : "Stayed in Tab"}
                 </div>
                 <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: C.secondaryText }}>
                   {tabSwitches} Events
                 </p>
               </div>
             </div>
          </div>

          {/* Full Personality Analysis */}
          {reportData.personality?.status === "completed" && (
            <div
              style={{
                background: "#fff",
                padding: 32,
                borderRadius: 20,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.darkBlue,
                    borderBottom: `3px solid ${C.teal}`,
                    paddingBottom: 8,
                    display: "inline-block",
                  }}
                >
                  Personality Profile Analysis
                </h3>

                {/* Dominant Traits Display */}
                {reportData.personality?.overall?.summary?.dominant_traits && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f5f5', padding: '8px 16px', borderRadius: 999 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: C.secondaryText, textTransform: 'uppercase' }}>Dominant Traits:</span>
                    {reportData.personality.overall.summary.dominant_traits.map(t => 
                      <Tag key={t} label={t} color="#9c27b0" />
                    )}
                  </div>
                )}
              </div>

              {/* All Personality Traits Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 20,
                  marginBottom: 32,
                }}
              >
                {Object.entries(
                  reportData.personality?.overall?.traits || {},
                ).map(([key, data]) => (
                  <PersonalityTrait key={key} traitKey={key} traitData={data} />
                ))}
              </div>

              {/* Candidate Insights Summary */}
              {reportData.personality?.overall?.candidate_view?.summary && (
                <div
                  style={{
                    background: `${C.teal}08`,
                    padding: 24,
                    borderRadius: 16,
                    border: `1px solid ${C.teal}33`,
                    borderLeft: `4px solid ${C.teal}`,
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 16px",
                      fontSize: 15,
                      fontWeight: 800,
                      color: C.darkBlue,
                    }}
                  >
                    💡 Your AI Behavioral Insights
                  </h4>
                  <BulletList
                    items={
                      reportData.personality?.overall?.candidate_view?.summary
                    }
                    icon="✨"
                    iconColor={C.teal}
                  />
                </div>
              )}
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}
          >
            <div
              style={{
                background: "#f8fff8",
                padding: 28,
                borderRadius: 20,
                border: `1px solid ${C.success}33`,
              }}
            >
              <h3
                style={{ margin: "0 0 16px", color: C.success, fontSize: 16, fontWeight: 800 }}
              >
                Overall Strengths
              </h3>
              <BulletList
                items={technicalData.overall_strengths}
                icon="✓"
                iconColor={C.success}
              />
            </div>
            <div
              style={{
                background: "#fff8f8",
                padding: 28,
                borderRadius: 20,
                border: `1px solid ${C.error}33`,
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: C.error, fontSize: 16, fontWeight: 800 }}>
                Overall Weaknesses
              </h3>
              <BulletList
                items={technicalData.overall_weaknesses}
                icon="✗"
                iconColor={C.error}
              />
            </div>
          </div>

          {/* Skill Assessment & Tips */}
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}
          >
            {/* Skill Assessment */}
            <div style={{ background: "#fff", padding: 28, borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: C.darkBlue }}>
                Detailed Skill Assessment
              </h3>

              {Object.entries(technicalData.skill_assessment || {}).map(([skill, value]) => (
                <div
                  key={skill}
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "16px",
                    marginBottom: 16,
                    background: "#fff",
                  }}
                >
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: C.darkBlue, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {skill.replace(/_/g, " ")}
                    </span>
                    {typeof value === "object" && (value.rating || value.understanding) && (
                       <Tag label={value.rating || value.understanding} color={scoreColor(value.rating === "Good"||value.rating === "Excellent"? 80 : value.rating === "Poor"||value.rating === "None"? 20 : 50)} />
                    )}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: C.secondaryText,
                      lineHeight: "1.6",
                    }}
                  >
                    {typeof value === "object" ? (value.remarks || value.evidence || value.overall || "No remarks") : parseSkill(value)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Tips Section */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{ background: "#fff", padding: 28, borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", height: '100%' }}
              >
                <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: C.darkBlue }}>
                  Next Steps & Tips for You
                </h3>
                <div style={{ background: `${C.cta}08`, border: `1px solid ${C.cta}33`, padding: 20, borderRadius: 16 }}>
                  <BulletList
                    items={formatTips(technicalData.tips_for_candidate)}
                    icon="🚀"
                    iconColor={C.cta}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}