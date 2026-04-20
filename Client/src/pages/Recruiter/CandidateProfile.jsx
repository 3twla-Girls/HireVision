import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Mail, MapPin, Clock, Download, Send,
  CheckCircle, XCircle, Layers, FileText, User,
  Briefcase, Star, AlertCircle, Loader2
} from 'lucide-react';
import api from '../../api/axios';

/* ─── Circular Progress ─────────────────────────────────────── */
const CircularScore = ({ score, color, size = 120 }) => {
  const [animated, setAnimated] = useState(0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = color === 'orange' ? '#FF914D' : '#10b981';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 50);
    return () => clearTimeout(t);
  }, [score]);

  const progress = (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={strokeColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-[#1B3C53]">{Math.round(animated)}%</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Status Badge ──────────────────────────────────────────── */
const statusConfig = {
  pending:               { label: 'Pending',             bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  reviewed:              { label: 'Reviewed',            bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  accepted:              { label: 'Accepted',            bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:              { label: 'Rejected',            bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'     },
  accepted_for_interview:{ label: 'Accepted for Interview', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${cfg.bg} ${cfg.text} border-transparent`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ─── Section Card ──────────────────────────────────────────── */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

/* ─── Main Page ─────────────────────────────────────────────── */
const CandidateProfile = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();

  const [app, setApp]           = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [job, setJob]           = useState(null);
  const [appStatus, setAppStatus] = useState('pending');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [saving, setSaving]     = useState(false);

  // ── Fetch application + candidate + job ──────────────────────
  useEffect(() => {
    if (!applicationId) return;

    const fetchAll = async () => {
      try {
        setLoading(true);

        // 1. Application
        const appRes = await fetch(`/api/v1/application/${applicationId}`);
        // const appRes = await api.get(`/application/${applicationId}`);
        if (!appRes.ok) throw new Error('Application not found');
        const appData = await appRes.json();
        setApp(appData);
        setAppStatus(appData.status ?? 'pending');

        // 2. Candidate user (fetch in parallel with job)
        const [candidateRes, jobRes] = await Promise.all([
          fetch(`/api/v1/user/${appData.candidate_id}`),
          fetch(`/api/v1/job/${appData.job_id}`),
        ]);

        if (candidateRes.ok) {
          const userData = await candidateRes.json();
          setCandidate(userData.user ?? userData);
        }
        if (jobRes.ok) setJob(await jobRes.json());

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [applicationId]);

  // ── Update status ────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/application/${applicationId}/status?status_value=${newStatus}`, {
        method: 'PATCH',
      });
      if (res.ok) setAppStatus(newStatus);
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error states ────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#456882]">
          <Loader2 size={36} className="animate-spin text-[#1B3C53]" />
          <p className="text-sm font-semibold">Loading candidate profile…</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="text-sm font-semibold text-red-500">{error ?? 'Application not found'}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-[#1B3C53] underline">Go back</button>
        </div>
      </div>
    );
  }

  const postedDate = new Date(app.created_at);
  const daysAgo    = Math.floor((Date.now() - postedDate.getTime()) / 86400000);

  const candidateName  = candidate?.name ?? candidate?.full_name ?? 'Candidate';
  const candidateEmail = candidate?.email ?? '—';
  const location       = candidate?.location ?? '';
  const locationParts  = location.split(',').map((p) => p.trim());
  const city    = locationParts[0] ?? '—';
  const country = locationParts.slice(1).join(', ') || '';

  const matchScore    = app.matching_score != null ? Math.round(app.matching_score) : 0;
  const matchSkills   = app.matching_skills ?? [];
  const missingSkills = app.missing_skills  ?? [];
  const cvUrl         = app.cv_feedback_url ?? null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-5">

        {/* ── Back + Page Title ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#456882] hover:bg-[#1B3C53] hover:text-white transition-all shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#1B3C53] leading-tight">Candidate Profile</h1>
            <p className="text-[#456882] text-xs font-medium mt-0.5">
              Application for <span className="font-bold text-[#FF914D]">{job?.job_title ?? '—'}</span>
            </p>
          </div>
        </div>

        {/* ── Candidate Header Card ── */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-3xl bg-[#1B3C53]/10 flex items-center justify-center shrink-0 border border-[#1B3C53]/10">
                {candidate?.avatar
                  ? <img src={candidate.avatar} alt={candidateName} className="w-full h-full object-cover rounded-2xl" />
                  : <User size={28} className="text-[#1B3C53]/40" />
                }
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1B3C53]">{candidateName}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <span className="flex items-center gap-1.5 text-[#456882] text-sm">
                    <Mail size={13} className="text-[#FF914D]" /> {candidateEmail}
                  </span>
                  {location && (
                    <span className="flex items-center gap-1.5 text-[#456882] text-sm">
                      <MapPin size={13} className="text-[#FF914D]" /> {city}{country ? `, ${country}` : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-[#456882] text-sm">
                    <Briefcase size={13} className="text-[#FF914D]" /> {app.years_of_exp} yrs experience
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3 shrink-0">
              <StatusBadge status={appStatus} />
              <span className="flex items-center gap-1.5 text-[#456882] text-xs font-medium">
                <Clock size={12} /> Applied {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago
              </span>
            </div>
          </div>
        </Card>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT COLUMN */}
          <div className="space-y-5">

            {/* Matching Score */}
            <Card>
              <h3 className="text-xs font-black text-[#456882] uppercase tracking-[0.15em] mb-5">CV Matching Score</h3>
              <div className="flex items-center justify-center gap-10">
                <div className="flex flex-col items-center gap-2">
                  <CircularScore score={matchScore} color="green" />
                  <span className="text-xs font-bold text-[#456882]">CV Score</span>
                </div>
              </div>
            </Card>

            {/* Matching Skills */}
            {matchSkills.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                  <h3 className="text-sm font-black text-[#1B3C53]">
                    Matching Skills <span className="text-[#456882] font-medium text-xs">(From CV)</span>
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchSkills.map(skill => (
                    <span key={skill} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-sm font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Missing Skills */}
            {missingSkills.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-red-400 rounded-lg flex items-center justify-center">
                    <XCircle size={14} className="text-white" />
                  </div>
                  <h3 className="text-sm font-black text-[#1B3C53]">Missing Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map(skill => (
                    <span key={skill} className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-xl text-sm font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* No skills info yet */}
            {matchSkills.length === 0 && missingSkills.length === 0 && (
              <Card>
                <p className="text-sm text-[#456882] text-center py-4">Skills analysis not yet available.</p>
              </Card>
            )}

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">

            {/* CV Feedback */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#1B3C53] rounded-lg flex items-center justify-center">
                  <FileText size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-[#1B3C53]">CV Feedback Report</h3>
              </div>

              {cvUrl ? (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1B3C53] hover:text-[#FF914D] text-sm font-bold transition-colors">
                  <Download size={15} /> View Full CV Feedback Report
                </a>
              ) : (
                <p className="text-sm text-[#456882]">No CV feedback report available yet.</p>
              )}
            </Card>

            {/* Application Decision */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#FF914D] rounded-lg flex items-center justify-center">
                  <Star size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-[#1B3C53]">Application Decision</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusChange('accepted')}
                  disabled={saving}
                  className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border
                    ${appStatus === 'accepted'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}>
                  <CheckCircle size={15} /> Accept
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={saving}
                  className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border
                    ${appStatus === 'rejected'
                      ? 'bg-red-500 text-white border-red-500 shadow-md'
                      : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500'}`}>
                  <XCircle size={15} /> Reject
                </button>
              </div>
              {saving && <p className="text-xs text-[#456882] mt-2 text-center">Saving…</p>}
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {cvUrl ? (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1B3C53] hover:bg-[#0f2535] text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg">
                  <Download size={16} /> View CV Report
                </a>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-400 font-black py-3.5 rounded-2xl text-sm cursor-not-allowed">
                  <Download size={16} /> No CV Report
                </div>
              )}
              <a
                href={`mailto:${candidateEmail}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FF914D] hover:bg-[#e07d3c] text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg">
                <Send size={16} /> Send Email
              </a>
            </div>
            <div className="flex gap-3">
              {appStatus === 'accepted_for_interview' || appStatus === 'pending' ? (
                <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl text-xs border border-gray-200 cursor-not-allowed">
                  <AlertCircle size={16} />
                  <span>Candidate hasn't started the interview yet</span>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/candidate-interview-report/${applicationId}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FF914D] hover:bg-[#e07d3c] text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg"
                >
                  <FileText size={16} /> View Interview Report
                </button>
              )}
            </div>


          </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateProfile;