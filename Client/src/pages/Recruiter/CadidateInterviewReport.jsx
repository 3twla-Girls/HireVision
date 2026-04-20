import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import CircularScore from "../../components/shared/CircularScore";

// ─── الألوان والتنسيقات الثابتة ────────────────────────────────────────────────────────
const C = {
  darkBlue: "#1B3C53",
  logoBlue: "#063192",
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

const questionColors = ["#4361ee", "#e63946", "#2a9d8f", "#e9c46a", "#9c27b0"];

// ─── Sub-Components ──────────────────────────────────────────────────────────

// مكون عرض نقاط الغش (Cheating Badge)
const CheatingBadge = ({ type, count }) => (
  <div style={{
    background: count > 0 ? C.error + "15" : C.success + "15",
    color: count > 0 ? C.error : C.success,
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "5px"
  }}>
    {count > 0 ? "⚠️" : "✅"} {type}: {count}
  </div>
);

// مكون عرض السمة الشخصية (Personality Card)
function PersonalityTrait({ traitKey, traitData }) {
  const score = Math.round((traitData?.score || 0) * 100);
  return (
    <div style={{
      background: "#fff", padding: "16px", borderRadius: "12px",
      border: `1px solid ${C.border}`, textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: C.secondaryText, marginBottom: "8px" }}>{traitKey.toUpperCase()}</div>
      <CircularScore score={score} size={60} strokeColor={C.teal} textColor={C.teal} />
      <div style={{ marginTop: "8px", fontWeight: 700, fontSize: "13px", color: C.darkBlue }}>{traitData?.label}</div>
      <p style={{ fontSize: "11px", color: C.secondaryText, margin: "5px 0 0" }}>{traitData?.hr_report}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const CandidateInterviewReport = () => {
  const { applicationId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("responses"); // responses | integrity | personality
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // const response = await api.get(`/interview/report/${applicationId}`);
        const response = await fetch(`api/v1/interview/report/${applicationId}`);
        setReportData(response.data);
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [applicationId]);

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Loading Report...</div>;
  if (!reportData) return <div style={{ padding: "50px", textAlign: "center" }}>No Data Found</div>;

  const currentAnswer = reportData.answers[selectedQuestionIdx];
  const phoneCheating = reportData.phone_detection?.[currentAnswer?.question_id?.$oid] || {};

  return (
    <div style={{ padding: "24px", background: C.lightGray, minHeight: "100vh", fontFamily: "sans-serif" }}>
      
      {/* Header Section */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", color: C.darkBlue }}>{reportData.job_title} - Interview Report</h1>
          <p style={{ color: C.secondaryText, margin: "5px 0 0" }}>Candidate ID: {reportData.candidate_id}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", color: C.secondaryText }}>Overall Technical Score</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: C.logoBlue }}>{reportData.final_summary.technical.final_score}/10</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["responses", "integrity", "personality"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold",
              background: activeTab === tab ? C.darkBlue : "#fff",
              color: activeTab === tab ? "#fff" : C.secondaryText,
              transition: "0.3s"
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 1. Responses Tab */}
      {activeTab === "responses" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px" }}>
          {/* Questions List */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "15px" }}>
            {reportData.answers.map((ans, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedQuestionIdx(idx)}
                style={{
                  padding: "12px", borderRadius: "8px", cursor: "pointer", marginBottom: "10px",
                  border: `1px solid ${selectedQuestionIdx === idx ? C.logoBlue : "#eee"}`,
                  background: selectedQuestionIdx === idx ? C.lightTeal : "transparent"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "13px" }}>Question {idx + 1}</div>
                <div style={{ fontSize: "11px", color: C.secondaryText }}>Score: {ans.evaluation.score}/10</div>
              </div>
            ))}
          </div>

          {/* Answer Detail */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ marginTop: 0 }}>Answer Transcription</h3>
            <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", lineHeight: "1.6", borderLeft: `4px solid ${C.teal}`, marginBottom: "20px" }}>
              {currentAnswer.speech_to_text.transcription}
            </div>

            <h4>Technical Evaluation</h4>
            <p style={{ color: C.secondaryText }}>{currentAnswer.evaluation.overall_feedback}</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={{ background: "#f8fff8", padding: "10px", borderRadius: "8px" }}>
                <strong style={{ color: C.success }}>Weaknesses:</strong>
                <ul style={{ fontSize: "13px" }}>{currentAnswer.evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
              <div style={{ background: "#fff8f8", padding: "10px", borderRadius: "8px" }}>
                <strong style={{ color: C.error }}>Missing Points:</strong>
                <ul style={{ fontSize: "13px" }}>{currentAnswer.evaluation.missing_points.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Integrity & Cheating Tab */}
      {activeTab === "integrity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px" }}>
            <h3>Face Authentication & Eye Gaze</h3>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
               <CheatingBadge type="Different Person" count={reportData.final_summary.integrity.face_auth.counts.different_person} />
               <CheatingBadge type="No Face Detected" count={reportData.final_summary.integrity.face_auth.counts.no_face} />
               <CheatingBadge type="Multiple Faces" count={reportData.final_summary.integrity.face_auth.counts.multiple_faces} />
            </div>
            
            <div style={{ background: "#fff8f8", padding: "15px", borderRadius: "8px", border: `1px solid ${C.error}33` }}>
              <strong style={{ color: C.error }}>Eye Gaze Status: {reportData.final_summary.integrity.eye_gaze.status}</strong>
              <p style={{ margin: "5px 0", fontSize: "14px" }}>Total duration of suspicious gaze: {reportData.final_summary.integrity.eye_gaze.total_duration} seconds</p>
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px" }}>
            <h3>Phone Detection Per Question</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `2px solid #eee` }}>
                  <th style={{ padding: "10px" }}>Question Index</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px" }}>Severity</th>
                  <th style={{ padding: "10px" }}>Usage Ratio</th>
                </tr>
              </thead>
              <tbody>
                {reportData.answers.map((ans, idx) => {
                  const phone = reportData.phone_detection[ans.question_id.$oid];
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px" }}>Question {idx + 1}</td>
                      <td style={{ padding: "10px" }}>{phone?.is_cheating ? "⚠️ Detected" : "✅ Clean"}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ color: phone?.severity === "Clean" ? C.success : C.error }}>{phone?.severity}</span>
                      </td>
                      <td style={{ padding: "10px" }}>{(phone?.summary?.usage_ratio * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Personality Tab */}
      {activeTab === "personality" && (
        <div style={{ background: "#fff", padding: "24px", borderRadius: "16px" }}>
          <h2 style={{ color: C.darkBlue, marginBottom: "20px" }}>Big Five Personality Analysis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            {Object.entries(reportData.personality.overall.traits).map(([key, data]) => (
              <PersonalityTrait key={key} traitKey={key} traitData={data} />
            ))}
          </div>

          <div style={{ background: C.lightTeal, padding: "20px", borderRadius: "12px", borderLeft: `5px solid ${C.teal}` }}>
            <h4 style={{ margin: "0 0 10px 0", color: C.darkBlue }}>HR Decision Support</h4>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {reportData.personality.overall.hr_view.summary.map((point, i) => (
                <li key={i} style={{ marginBottom: "8px", fontSize: "14px" }}>{point}</li>
              ))}
            </ul>
            <div style={{ marginTop: "15px", fontWeight: "bold" }}>
              Recommendation: <span style={{ color: C.cta }}>{reportData.personality.overall.hr_view.decision}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateInterviewReport;