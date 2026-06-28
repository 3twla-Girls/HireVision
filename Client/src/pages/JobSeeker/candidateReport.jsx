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
        {traitData?.hr_report || "No description available"}
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

// const parseSkill = (value) => {
//   if (!value) return { score: 0, max: 5, comment: "No data" };

//   const match = value.match(/^(\d+)\/(\d+)\s*–\s*(.*)$/);

//   if (!match) {
//     return { score: 0, max: 5, comment: value };
//   }

//   return {
//     score: parseInt(match[1]),
//     max: parseInt(match[2]),
//     comment: match[3],
//   };
// };

// Renders a skill_assessment value safely regardless of its shape.
// Backend may emit either a flat primitive (number/string) or a nested
// object (e.g. { understanding: 3, overall: "..." }). Rendering an object
// directly crashes React, so normalize it to a readable string here.
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
        padding: "2px 10px",
        borderRadius: 999,
        background: color + "18",
        color,
        fontWeight: 700,
        fontSize: 11,
        border: `1px solid ${color}44`,
        marginRight: 6,
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
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]); // ✅ FIX
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState("detail");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!sessionId) return;

        setLoading(true);

        // 🔥 fetch both APIs in parallel (better performance)
        const [sessionRes, questionsRes] = await Promise.all([
          api.get(`/interview/session/${sessionId}`),
          api.get(`/interview/session-questions/${sessionId}`),
        ]);
        console.log("Session:", sessionRes.data);
        console.log("Questions:", questionsRes.data);

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
      (q) => q.question_id === activeAnswer?.question_id,
    ) || questionsWithAnswers[activeIdx];

  const score = Number(technicalData?.final_score);
  const overallScore = isNaN(score) ? 0 : score * 10;
  console.log("Calculated overall score:", overallScore);
  // Get color for a specific question index (for sidebar dots)
  const getQuestionDotColor = (index, isActive) => {
    if (isActive) return C.logoBlue;
    return questionColors[index % questionColors.length];
  };

  // Get background color for the question card when active
  const getActiveCardBackground = (isActive, index) => {
    if (!isActive) return "transparent";
    return `${questionColors[index % questionColors.length]}08`;
  };

  // Get border color for the question card when active
  const getActiveCardBorder = (isActive, index) => {
    if (!isActive) return "transparent";
    return questionColors[index % questionColors.length];
  };

  // Format tips for candidate to ensure each is on its own line
  const formatTips = (tips) => {
    if (!tips) return [];
    if (Array.isArray(tips)) return tips;
    if (typeof tips === "string") {
      // Split by numbers, bullet points, or newlines
      return tips
        .split(/\d+\.\s*|\n\s*[•\-]\s*|\n+/)
        .filter((tip) => tip.trim().length > 0);
    }
    return [];
  };

  const status =
  reportData.final_summary?.integrity?.face_auth?.status || "N/A";

  const statusColor = status === "Failed" ? C.error : C.success;

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
            style={{ margin: "4px 0 0", color: C.secondaryText, fontSize: 13 }}
          >
            Session: {new Date(reportData.session_date).toLocaleString()}{" "}
            &nbsp;·&nbsp;
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
            gridTemplateColumns: "210px 1fr 220px",
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
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>
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
                    (qw) => qw.question_id === ans.question_id,
                  ) || questionsWithAnswers[i];
                let sc = ans.evaluation?.score * 10 || 0;
                if (!ans.evaluation.score && ans.evaluation.type === "mcq") {
                  ans.evaluation.is_correct ? (sc = 100) : (sc = 0);
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
                        padding: "4px 8px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isActive ? dotColor : C.primaryText,
                        }}
                      >
                        Q{i + 1}: {q?.question?.slice(0, 22)}…
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: scoreColor(sc),
                          fontWeight: 600,
                        }}
                      >
                        Score: {sc}/100
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
              padding: 22,
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
                <div style={{ marginBottom: 8 }}>
                  <Tag
                    label={`Q${activeIdx + 1}`}
                    color={questionColors[activeIdx % questionColors.length]}
                  />
                  <Tag
                    label={activeQuestion?.type?.toUpperCase() || "SHORT"}
                    color={C.teal}
                  />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: C.darkBlue,
                    lineHeight: 1.45,
                  }}
                >
                  {activeQuestion?.question || "Question not found"}
                </h3>
              </div>
              <ScoreRing
                score={
                  activeAnswer.evaluation?.score !== undefined &&
                  activeAnswer.evaluation?.score !== null
                    ? activeAnswer.evaluation.score * 10
                    : activeAnswer.evaluation?.type === "mcq"
                      ? activeAnswer.evaluation?.is_correct
                        ? 100
                        : 0
                      : 0
                }
                size={78}
              />
            </div>
            {activeQuestion?.type === "mcq" && activeQuestion?.options && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.secondaryBlue,
                    marginBottom: 8,
                  }}
                >
                  Options
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {activeQuestion.options.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #eee",
                        background: "#f9f9f9",
                        fontSize: 14,
                        fontWeight: 500,
                        color: C.primaryText,
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Answer & Reference */}
            <div style={{ marginBottom: 16 }}>
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
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.secondaryBlue,
                  }}
                >
                  Candidate's Answer
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontWeight: 700,
                    background:
                      activeAnswer.speech_to_text?.status === "success"
                        ? C.success + "18"
                        : C.error + "18",
                    color:
                      activeAnswer.speech_to_text?.status === "success"
                        ? C.success
                        : C.error,
                  }}
                >
                  {activeAnswer.speech_to_text?.status}
                </span>
              </div>
              <div
                style={{
                  background: "#FFFBF5",
                  border: `1.5px solid ${C.cta}44`,
                  borderLeft: `4px solid ${C.cta}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: 14,
                  color: C.primaryText,
                  lineHeight: 1.75,
                }}
              >
                {activeAnswer.type === "mcq"
                  ? activeAnswer.selected_option
                  : activeAnswer.speech_to_text?.transcription ||
                    "No transcription available"}
              </div>
            </div>

            {activeQuestion?.type !== "mcq" && (
              <>
                <div
                  style={{
                    background: C.lightTeal,
                    border: `1.5px solid ${C.teal}44`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 13,
                    color: C.darkBlue,
                    lineHeight: 1.6,
                  }}
                >
                  💬 <strong>Evaluator Feedback:</strong>{" "}
                  {activeAnswer.evaluation?.overall_feedback ||
                    "No feedback available"}
                </div>

                <CollapsibleSection
                  title="Positive Indicators"
                  icon="✓"
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
                  title="Knowledge Gaps"
                  icon="✖"
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                style={{
                  padding: "10px 28px",
                  borderRadius: 999,
                  border: `1.5px solid ${C.border}`,
                  background: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: activeIdx === 0 ? "not-allowed" : "pointer",
                  color: activeIdx === 0 ? C.border : C.primaryText,
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
                  padding: "10px 28px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    activeIdx === reportData.answers.length - 1
                      ? C.border
                      : C.cta,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor:
                    activeIdx === reportData.answers.length - 1
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Snapshot Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              Report Snapshot
            </h3>
            {reportData.answers.map((ans, i) => {
              let sc = ans.evaluation?.score * 10 || 0;
              if (!ans.evaluation.score && ans.evaluation.type === "mcq") {
                ans.evaluation.is_correct ? (sc = 100) : (sc = 0);
              }
              const questionColor = questionColors[i % questionColors.length];
              return (
                <div
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  style={{
                    background: i === activeIdx ? `${questionColor}10` : "#fff",
                    border: `1.5px solid ${i === activeIdx ? questionColor : C.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: questionColor,
                      marginBottom: 6,
                    }}
                  >
                    Q{i + 1}: Question {i + 1}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: scoreColor(sc),
                      }}
                    >
                      {sc}
                    </span>
                    <span style={{ fontSize: 11, color: C.secondaryText }}>
                      /100
                    </span>
                    <Tag
                      label={
                        sc >= 80
                          ? "Strong"
                          : sc >= 60
                            ? "Good"
                            : sc >= 40
                              ? "Weak"
                              : "Poor"
                      }
                      color={scoreColor(sc)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Summary Tab ── */}
      {tab === "summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Integrity Dashboard */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 16,
                borderTop: `4px solid ${
                  reportData.final_summary?.integrity?.eye_gaze?.status ===
                  "High Alerts"
                    ? C.error
                    : C.success
                }`,
              }}
            >
              <h4 style={{ margin: "0 0 8px", color: C.secondaryText }}>
                Eye Gaze Status
              </h4>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color:
                    reportData.final_summary?.integrity?.eye_gaze?.status ===
                    "High Alerts"
                      ? C.error
                      : C.success,
                }}
              >
                {reportData.final_summary?.integrity?.eye_gaze?.status || "N/A"}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                Warnings:{" "}
                {reportData.final_summary?.integrity?.eye_gaze
                  ?.total_warnings || 0}
              </p>
            </div>
            <div
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 16,
                borderTop: `4px solid ${statusColor}`,
              }}
            >
              <h4 style={{ margin: "0 0 8px", color: C.secondaryText }}>
                Face Auth
              </h4>

              <div style={{ fontSize: 20, fontWeight: 800, color: statusColor }}>
                {status}
              </div>

              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                Incidents:{" "}
                {reportData.final_summary?.integrity?.face_auth?.incidents_count || 0}
              </p>
            </div>
            <div
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 16,
                borderTop: `4px solid ${C.secondaryBlue}`,
              }}
            >
              <h4 style={{ margin: "0 0 8px", color: C.secondaryText }}>
                Personality Status
              </h4>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: C.secondaryBlue,
                }}
              >
                {reportData.personality?.status || "N/A"}
              </div>
            </div>
          </div>

          {/* Full Personality Analysis */}
          {reportData.personality?.status === "completed" && (
            <div
              style={{
                background: "#fff",
                padding: 24,
                borderRadius: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px",
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.darkBlue,
                  borderBottom: `2px solid ${C.teal}`,
                  paddingBottom: 8,
                  display: "inline-block",
                }}
              >
                Personality Profile Analysis
              </h3>

              {/* All Personality Traits Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
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
                    background: `${C.teal}10`,
                    padding: 16,
                    borderRadius: 12,
                    borderLeft: `3px solid ${C.teal}`,
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 12px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.teal,
                    }}
                  >
                    💡 Candidate Insights
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
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div
              style={{
                background: "#f8fff8",
                padding: 22,
                borderRadius: 16,
                border: `1px solid ${C.success}33`,
              }}
            >
              <h3
                style={{ margin: "0 0 12px", color: C.success, fontSize: 15 }}
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
                padding: 22,
                borderRadius: 16,
                border: `1px solid ${C.error}33`,
              }}
            >
              <h3 style={{ margin: "0 0 12px", color: C.error, fontSize: 15 }}>
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
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            {/* Skill Assessment */}
            <div style={{ background: "#fff", padding: 22, borderRadius: 16 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>
                Skill Assessment
              </h3>

              {/* {Object.entries(technicalData.skill_assessment || {}).map(
                ([skill, value]) => {
                  const parsed = parseSkill(value);

                  return (
                    <div
                      key={skill}
                      style={{
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        padding: "14px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          {skill}
                        </span>

                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: scoreColor((parsed.score / parsed.max) * 10),
                          }}
                        >
                          {parsed.score}/{parsed.max}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 12,
                          color: C.secondaryText,
                        }}
                      >
                        {parsed.comment}
                      </p>
                    </div>
                  );
                },
              )} */}
              {Object.entries(technicalData.skill_assessment || {}).map(([skill, value]) => (
                <div
                  key={skill}
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px",
                    marginBottom: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.darkBlue }}>
                      {skill.replace(/_/g, " ")}:
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: C.secondaryText,
                      lineHeight: "1.5",
                    }}
                  >
                    {parseSkill(value)}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{ background: "#fff", padding: 22, borderRadius: 16 }}
              >
                <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>
                  Tips for Candidate
                </h3>
                <BulletList
                  items={formatTips(technicalData.tips_for_candidate)}
                  icon="•"
                  iconColor={C.cta}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
