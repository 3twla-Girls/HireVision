import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Edit,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Clock,
  DollarSign,
  Layers,
  ArrowLeft,
  Plus,
  Building2,
  TrendingUp,
  Mail,
  Calendar,
  Link,
  FileText,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { JOBS } from "../../data/jobs";
import api from "../../api/axios";
import toast from "react-hot-toast";

/* ─── helpers ──────────────────────────────────────────────── */

const inferWorkplace = (jobType) => {
  if (!jobType) return "On site";
  const t = jobType.toLowerCase();
  if (t.includes("remote")) return "Remote";
  if (t.includes("hybrid")) return "Hybrid";
  return "On site";
};

const inferType = (jobType) => {
  if (!jobType) return "Full-time";
  const t = jobType.toLowerCase();
  if (t.includes("part")) return "Part-time";
  if (t.includes("contract")) return "Contract";
  return "Full-time";
};

const StatusBadge = ({ status, small = false }) => {
  const isOpen = status === "Open";
  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-full border
      ${small ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1"}
      ${
        isOpen
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-red-50   text-red-600   border-red-100"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-400"}`}
      />
      {status}
    </span>
  );
};

/* ─── Bulk Invite Modal ─────────────────────────────────────── */
/**
 * BulkInviteModal
 *
 * Opens when the recruiter closes a job. It:
 *  1. Fetches the list of shortlisted session IDs from the backend
 *     (GET /api/v1/job/{job_id}/shortlisted-sessions).
 *  2. Lets the recruiter optionally customise the interview date/link/notes.
 *  3. Posts to /api/v1/email/bulk-invite with the real session IDs.
 *
 * Note: The pipeline already auto-sent a first-pass email right after closing.
 * This modal lets the recruiter resend with a confirmed date + link.
 */
const BulkInviteModal = ({ job, recruiterId, onClose, onSuccess }) => {
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewLink, setInterviewLink] = useState("");
  const [extraNotes, setExtraNotes]       = useState("");
  const [sending, setSending]             = useState(false);

  // Shortlisted session IDs — fetched from backend on mount
  const [sessionIds, setSessionIds]       = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionError, setSessionError]   = useState(null);

  // ── Fetch accepted session IDs as soon as the modal opens ────────────
  useEffect(() => {
    let cancelled = false;
    let pollTimeout;

    const fetchSessions = async (retryCount = 0) => {
      if (cancelled) return;
      
      try {
        // 1. Check pipeline status first
        const statusRes = await api.get(`/job/${job.id}/pipeline-status`);
        const { breakdown, total_applications } = statusRes.data;
        const pendingCount = breakdown?.pending || 0;
        
        // If there are pending applications and we haven't timed out (e.g. 10 retries = 20s)
        if (total_applications > 0 && pendingCount > 0 && retryCount < 10) {
           pollTimeout = setTimeout(() => fetchSessions(retryCount + 1), 2000);
           return; // wait for next poll
        }

        // 2. Fetch the actual shortlisted sessions once pipeline is done (or timed out)
        const res = await api.get(`/job/${job.id}/shortlisted-sessions`);
        if (!cancelled) {
          setSessionIds(res.data.session_ids || []);
          setLoadingSessions(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch shortlisted sessions:", err);
          setSessionError(
            "Could not load shortlisted candidates. The pipeline may still be running."
          );
          setLoadingSessions(false);
        }
      }
    };

    setLoadingSessions(true);
    setSessionError(null);
    fetchSessions();

    return () => { 
      cancelled = true; 
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [job.id]);

  // ── Send invitations ─────────────────────────────────────────────────
  const handleSend = async () => {
    if (!interviewDate.trim()) {
      toast.error("Please enter an interview date.");
      return;
    }

    if (sessionIds.length === 0) {
      toast.error("No shortlisted candidates found for this job.");
      return;
    }

    setSending(true);
    try {
      const res = await api.post("/email/bulk-invite", {
        session_ids:    sessionIds,
        recruiter_id:   recruiterId,
        interview_date: interviewDate,
        interview_link: interviewLink,
        extra_notes:    extraNotes,
      });

      const { sent_count, failed_count } = res.data;
      if (sent_count > 0) {
        toast.success(
          `✅ Invitations sent to ${sent_count} candidate${sent_count > 1 ? "s" : ""}${
            failed_count > 0 ? ` · ${failed_count} failed` : ""
          }`
        );
      } else {
        toast.error(`All ${failed_count} invitation(s) failed to send.`);
      }

      onSuccess();
    } catch (err) {
      console.error("Bulk invite error:", err);
      toast.error(err.response?.data?.signal || "Failed to send invitations.");
    } finally {
      setSending(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1B3C53] to-[#456882] px-7 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg leading-tight">
                Send Interview Invitations
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                Job closed · Notify shortlisted candidates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors mt-0.5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Job Info Banner */}
        <div className="bg-[#F8FAFC] border-b border-gray-100 px-7 py-3 flex items-center gap-2">
          <Briefcase size={14} className="text-[#FF914D]" />
          <span className="text-sm font-bold text-[#1B3C53]">{job.title}</span>
          <span className="text-gray-300">·</span>

          {/* Candidate count — live from shortlisted sessions */}
          {loadingSessions ? (
            <span className="text-xs text-[#456882] font-medium flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" />
              Loading shortlisted…
            </span>
          ) : sessionError ? (
            <span className="text-xs text-red-500 font-medium">Pipeline still running</span>
          ) : (
            <span className="text-xs text-[#456882] font-medium">
              {sessionIds.length} shortlisted candidate{sessionIds.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Pipeline-still-running notice */}
        {!loadingSessions && sessionError && (
          <div className="mx-7 mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            ⏳ {sessionError}
            <br />
            You can still fill in the details below and send once the pipeline finishes,
            or close and retry in a moment.
          </div>
        )}

        {/* Auto-sent notice — shown when pipeline already emailed them */}
        {!loadingSessions && !sessionError && sessionIds.length > 0 && (
          <div className="mx-7 mt-5 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 font-medium">
            ✉️ An automatic invitation was already sent when the job closed. Use this
            form to resend with a <strong>confirmed date and link</strong>.
          </div>
        )}

        {/* Form */}
        <div className="px-7 py-6 space-y-5">

          {/* Interview Date */}
          <div>
            <label className="block text-xs font-black text-[#456882] uppercase tracking-[0.1em] mb-2">
              <Calendar size={12} className="inline mr-1.5" />
              Interview Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 2026-04-15 03:00 PM"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F8FAFC] text-sm font-medium text-[#1B3C53] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 focus:border-[#1B3C53]/40 transition"
            />
          </div>

          {/* Interview Link */}
          <div>
            <label className="block text-xs font-black text-[#456882] uppercase tracking-[0.1em] mb-2">
              <Link size={12} className="inline mr-1.5" />
              Interview Link <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/..."
              value={interviewLink}
              onChange={(e) => setInterviewLink(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F8FAFC] text-sm font-medium text-[#1B3C53] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 focus:border-[#1B3C53]/40 transition"
            />
          </div>

          {/* Extra Notes */}
          <div>
            <label className="block text-xs font-black text-[#456882] uppercase tracking-[0.1em] mb-2">
              <FileText size={12} className="inline mr-1.5" />
              Notes for Candidates <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please have your portfolio ready and join 5 minutes early."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F8FAFC] text-sm font-medium text-[#1B3C53] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 focus:border-[#1B3C53]/40 transition resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-7 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-[#456882] text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSend}
            disabled={sending || loadingSessions || sessionIds.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF914D] hover:bg-[#e07d3c] text-white text-sm font-black transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={16} />
                Send to {loadingSessions ? "…" : sessionIds.length} Candidates
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Job List Item ─────────────────────────────────────────── */
const JobListItem = ({ job, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200
      ${
        isSelected
          ? "bg-[#1B3C53] text-white border-[#1B3C53] shadow-lg shadow-[#1B3C53]/20 scale-[1.01]"
          : "bg-white text-[#1B3C53] border-gray-100 hover:border-[#1B3C53]/20 hover:shadow-md"
      }`}
  >
    <div className="flex items-start justify-between gap-2 mb-2.5">
      <h3 className="font-bold text-base leading-snug line-clamp-2 flex-1">
        {job.title}
      </h3>
      <StatusBadge status={job.status} small />
    </div>

    <p
      className={`text-sm mb-4 flex items-center gap-1.5 ${isSelected ? "text-white/70" : "text-[#456882]"}`}
    >
      <MapPin size={13} />
      {job.workplace} · {job.type}
    </p>

    <div className="flex items-center justify-between">
      <span
        className={`text-xs font-semibold flex items-center gap-1.5 ${isSelected ? "text-white/50" : "text-gray-400"}`}
      >
        <Clock size={12} /> {job.postedAgo}
      </span>
      <span
        className={`text-sm font-bold flex items-center gap-1.5 text-[#FF914D]`}
      >
        <Users size={14} /> {job.applicants} candidates
      </span>
    </div>
  </button>
);

/* ─── Detail Panel ──────────────────────────────────────────── */
const JobDetailPanel = ({ job, onToggleStatus, onBack }) => {
  const navigate = useNavigate();
  const isOpen = job.status === "Open";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Colored left accent */}
      <div className="absolute left-0 top-0 w-4 h-full bg-gradient-to-b from-[#1B3C53] via-[#456882] to-[#FF914D] rounded-l-[2rem]" />

      <div className="p-8 md:p-10 overflow-y-auto no-scrollbar">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="lg:hidden flex items-center gap-2 text-[#456882] text-sm font-bold mb-5 hover:text-[#1B3C53] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Jobs
        </button>

        {/* Job Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-8 pb-8 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h2 className="text-3xl font-black text-[#1B3C53] leading-tight">
                {job.title}
              </h2>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#456882] text-sm font-medium">
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-[#FF914D]" />
                {job.city}, {job.country}
              </span>
              <span className="flex items-center gap-2">
                <Building2 size={16} className="text-[#FF914D]" />
                {job.workplace}
              </span>
              <span className="flex items-center gap-2">
                <Briefcase size={16} className="text-[#FF914D]" />
                {job.experience}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => navigate(`/job-preview/${job.id}`)}
              className="flex items-center gap-2 bg-gray-50 text-[#1B3C53] hover:bg-[#1B3C53] hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-gray-200 hover:border-[#1B3C53]"
            >
              <Eye size={16} /> Preview
            </button>

            <button
              onClick={() => onToggleStatus(job.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border
                ${
                  isOpen
                    ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                }`}
            >
              {isOpen ? <XCircle size={16} /> : <CheckCircle size={16} />}
              {isOpen ? "Close Job" : "Reopen"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: DollarSign,
              label: "Salary",
              value: job.salary,
              color: "bg-emerald-500",
            },
            {
              icon: Layers,
              label: "Type",
              value: job.type,
              color: "bg-[#456882]",
            },
            {
              icon: Clock,
              label: "Posted",
              value: job.postedAgo,
              color: "bg-[#1B3C53]",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="bg-[#F8FAFC] rounded-2xl p-5 border border-gray-100"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}
              >
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#456882]/60 mb-1.5">
                {label}
              </p>
              <p className="text-base font-bold text-[#1B3C53]">{value}</p>
            </div>
          ))}
        </div>

        {/* Required Skills */}
        <div className="mb-8">
          <h4 className="text-sm font-black text-[#456882] uppercase tracking-[0.1em] mb-4">
            Required Skills
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="bg-[#1B3C53]/5 text-[#1B3C53] border border-[#1B3C53]/10 px-3 py-1 rounded-xl text-sm font-bold hover:bg-[#1B3C53] hover:text-white transition-colors cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate(`/job-applications/${job.id}`)}
            className="w-full bg-[#FF914D] hover:bg-[#1B3C53] text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg text-base uppercase tracking-widest group"
          >
            <Users
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            Review {job.applicants || 0} Applicants
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const JobManagement = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [mobileView, setMobileView] = useState("list");

  // ── Bulk invite modal state ──────────────────────────────────
  const [inviteModalJob, setInviteModalJob] = useState(null); // job object | null

  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/Register");
    }
  }, [user, navigate]);

  const CURRENT_RECRUITER_ID = user._id;

  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/job/all/${CURRENT_RECRUITER_ID}`);
        if (res.ok) {
          const data = await res.json();
          const mappedJobs = data.map((j) => ({
            id: j._id,
            title: j.job_title,
            city: j.location ? j.location.split(",")[0] : "Unknown",
            country:
              j.location && j.location.includes(",")
                ? j.location.split(",")[1].trim()
                : "",
            workplace: inferWorkplace(j.job_type),
            type: inferType(j.job_type),
            experience: j.required_experience || "Not specified",
            postedAgo: j.created_at
              ? new Date(j.created_at).toLocaleDateString()
              : "Recently",
            salary: "Not specified",
            skills: j.required_skills || [],
            applicants: j.applicants_count || 0,
            status: j.status === "open" ? "Open" : "Closed",
          }));
          setJobs(mappedJobs);

          if (mappedJobs.length > 0) {
            setSelectedJobId(mappedJobs[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch recruiter jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const matchSearch =
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.company?.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          filterStatus === "All" || job.status === filterStatus;
        return matchSearch && matchFilter;
      }),
    [jobs, search, filterStatus]
  );

  const stats = useMemo(
    () => ({
      open: jobs.filter((j) => j.status === "Open").length,
      closed: jobs.filter((j) => j.status === "Closed").length,
    }),
    [jobs]
  );

  // ── Toggle job status ────────────────────────────────────────
  const toggleStatus = async (id) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;

    const newStatus = job.status.toLowerCase() === "open" ? "closed" : "open";

    try {
      const res = await api.patch(`/job/${id}/status`, { status: newStatus });

      if (res.status === 200) {
        // Update local UI immediately
        setJobs((prev) =>
          prev.map((j) =>
            j.id === id
              ? { ...j, status: newStatus === "open" ? "Open" : "Closed" }
              : j
          )
        );

        toast.success(`Job status updated to ${newStatus}`);

        // ── If the job is being CLOSED, open the invite modal.
        // The modal will fetch shortlisted session IDs from the backend.
        // Note: the pipeline runs in the background simultaneously —
        // the modal shows a "pipeline still running" notice if sessions
        // aren't ready yet. The recruiter can close + retry later.
        if (newStatus === "closed") {
          setInviteModalJob({ ...job, status: "Closed" });
        }
      }
    } catch (err) {
      console.error("Could not update job status:", err);
      const errorMsg = err.response?.data?.signal || "Failed to update status";
      toast.error(`Error: ${errorMsg}`);
    }
  };

  const handleSelectJob = (id) => {
    setSelectedJobId(id);
    setMobileView("detail");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">

      {/* ── Bulk Invite Modal ── */}
      {inviteModalJob && (
        <BulkInviteModal
          job={inviteModalJob}
          recruiterId={CURRENT_RECRUITER_ID}
          onClose={() => setInviteModalJob(null)}
          onSuccess={() => setInviteModalJob(null)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-[60px] py-8 space-y-6">
        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-2">
          <span className="w-10 h-10 bg-[#FF914D] rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Briefcase size={20} className="text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-[#1B3C53] tracking-tight leading-tight">
              Job Management
            </h1>
            <p className="text-[#456882] text-sm font-medium">
              {jobs.length === 0
                ? "No jobs posted yet"
                : `${stats.open} open · ${stats.closed} closed`}
            </p>
          </div>
        </div>

        {/* ── Empty & Loading States ── */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-[#1B3C53] font-bold animate-pulse text-lg">
              Loading Jobs...
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center mb-6">
              <Briefcase size={40} className="text-gray-200" />
            </div>
            <h2 className="text-xl font-black text-[#1B3C53] mb-2">
              No Jobs Posted Yet
            </h2>
            <p className="text-[#456882] text-sm font-medium max-w-xs mb-8">
              You haven't posted any job openings. Create your first vacancy to
              start receiving applicants.
            </p>
            <button
              onClick={() => navigate("/post-job")}
              className="flex items-center gap-2 bg-[#FF914D] hover:bg-[#e07d3c] text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus size={16} /> Post Your First Job
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            {/* Sidebar — hidden on mobile when viewing detail */}
            <div
              className={`col-span-12 lg:col-span-4 flex flex-col gap-3
              ${mobileView === "detail" ? "hidden lg:flex" : "flex"}`}
            >
              {/* Search & Filter */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm space-y-2">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search jobs…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 text-sm font-medium text-[#1B3C53] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 transition"
                  />
                </div>
                <div className="flex gap-2">
                  {["All", "Open", "Closed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-colors
                        ${
                          filterStatus === s
                            ? "bg-[#1B3C53] text-white"
                            : "bg-[#F8FAFC] text-[#456882] hover:bg-gray-100"
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job List */}
              <div className="relative space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto px-2 pb-3 no-scrollbar">
                {filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-[#456882] font-medium">
                      No jobs match your search.
                    </p>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.id} className="relative">
                      <JobListItem
                        job={job}
                        isSelected={selectedJobId === job.id}
                        onClick={() => handleSelectJob(job.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail Panel — hidden on mobile when viewing list */}
            <div
              className={`col-span-12 lg:col-span-8 min-h-[500px] lg:min-h-0
              ${mobileView === "list" ? "hidden lg:block" : "block"}`}
            >
              {selectedJob ? (
                <JobDetailPanel
                  job={selectedJob}
                  onToggleStatus={toggleStatus}
                  onBack={() => setMobileView("list")}
                />
              ) : (
                <div className="bg-white h-full min-h-[400px] rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center p-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                    <Briefcase size={28} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1B3C53] mb-1">
                    No Job Selected
                  </h3>
                  <p className="text-[#456882] text-sm max-w-xs">
                    Select a job from the list to view its details and manage
                    applicants.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobManagement;
