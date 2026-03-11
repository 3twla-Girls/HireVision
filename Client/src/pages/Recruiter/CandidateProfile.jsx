import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, MapPin, Clock, Download, Send,
  CheckCircle, XCircle, Layers, FileText, User,
  Briefcase, Star, AlertCircle
} from 'lucide-react';

/* ─── Mock Data (replace with API call) ─────────────────────── */
const APPLICATION = {
  _id: '69aaebe4def3bd659ee84eb3',
  job_id: '69aae77ddef3bd659ee84eac',
  candidate_id: '69aa315763b720c25373f035',
  years_of_exp: 3,
  created_at: '2026-03-06T14:59:48.212Z',
  status: 'pending',
  cv_feedback_url: 'https://res.cloudinary.com/dzufxvqbb/raw/upload/v1772826743/feedbacks/69aa315763b720c25373f035/hflkmovcwgchktxiuqd3',
  matching_score: 66.98,
  matching_skills: ['HTML', 'React', 'JavaScript', 'CSS', 'Git'],
  missing_skills: ['Bootstrap', 'Tailwind CSS', 'Figma', 'REST API'],
};

const CANDIDATE = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@email.com',
  city: 'San Francisco',
  country: 'USA',
  avatar: null,
};

const JOB = { title: 'Frontend Developer' };

// Mock CV feedback lines parsed from the PDF
const CV_FEEDBACK = [
  { text: 'Strong foundational skills in core web technologies', positive: true },
  { text: 'Well-structured and clearly presented CV', positive: true },
  { text: 'Projects demonstrate practical real-world impact', positive: true },
  { text: 'Lacks experience with modern CSS frameworks', positive: false },
];

/* ─── Circular Progress ─────────────────────────────────────── */
const CircularScore = ({ score, color, size = 120 }) => {
  const [animated, setAnimated] = useState(0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = color === 'orange' ? '#FF914D' : '#10b981';

  // Animate from 0 → score on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 50);
    return () => clearTimeout(t);
  }, [score]);

  const progress = (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          {/* track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          {/* progress arc */}
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={strokeColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        {/* Animated counter */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-[#1B3C53]">{Math.round(animated)}%</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Status Badge ──────────────────────────────────────────── */
const statusConfig = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  reviewed:  { label: 'Reviewed',  bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  accepted:  { label: 'Accepted',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'     },
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
  const [appStatus, setAppStatus] = useState(APPLICATION.status);

  const app = APPLICATION;
  const candidate = CANDIDATE;

  const postedDate = new Date(app.created_at);
  const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / 86400000);

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
              Application for <span className="font-bold text-[#FF914D]">{JOB.title}</span>
            </p>
          </div>
        </div>

        {/* ── Candidate Header Card ── */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-3xl bg-[#1B3C53]/10 flex items-center justify-center shrink-0 border border-[#1B3C53]/10">
                {candidate.avatar
                  ? <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover rounded-2xl" />
                  : <User size={28} className="text-[#1B3C53]/40" />
                }
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1B3C53]">{candidate.name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <span className="flex items-center gap-1.5 text-[#456882] text-sm">
                    <Mail size={13} className="text-[#FF914D]" /> {candidate.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#456882] text-sm">
                    <MapPin size={13} className="text-[#FF914D]" /> {candidate.city}, {candidate.country}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#456882] text-sm">
                    <Briefcase size={13} className="text-[#FF914D]" /> {app.years_of_exp} yrs experience
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3 shrink-0">
              <StatusBadge status={appStatus} />
              <span className="flex items-center gap-1.5 text-[#456882] text-xs font-medium">
                <Clock size={12} /> Applied {daysAgo} days ago
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
                  <CircularScore score={app.matching_score} color="green" />
                  <span className="text-xs font-bold text-[#456882]">CV Score</span>
                </div>
                {/* Vertical divider */}
                <div className="h-24 w-px bg-gray-100" />
                <div className="flex flex-col items-center gap-2">
                  <CircularScore score={72} color="orange" />
                  <span className="text-xs font-bold text-[#456882]">Interview Score</span>
                </div>
              </div>
            </Card>

            {/* Matching Skills */}
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
                {app.matching_skills.map(skill => (
                  <span key={skill} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-sm font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>

            {/* Missing Skills */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-red-400 rounded-lg flex items-center justify-center">
                  <XCircle size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-[#1B3C53]">Missing Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {app.missing_skills.map(skill => (
                  <span key={skill} className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-xl text-sm font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">

            {/* CV Feedback */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#1B3C53] rounded-lg flex items-center justify-center">
                  <FileText size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-[#1B3C53]">CV Feedback</h3>
              </div>
              <ul className="space-y-2.5">
                {CV_FEEDBACK.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#456882] font-medium">
                    <span className={`mt-0.5 shrink-0 ${item.positive ? 'text-emerald-500' : 'text-[#FF914D]'}`}>
                      {item.positive
                        ? <CheckCircle size={15} />
                        : <AlertCircle size={15} />
                      }
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* View full CV feedback PDF button */}
              <a
                href={app.cv_feedback_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center gap-2 text-[#1B3C53] hover:text-[#FF914D] text-sm font-bold transition-colors">
                <Download size={15} /> View Full CV Feedback Report
              </a>
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
                  onClick={() => setAppStatus('accepted')}
                  className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border
                    ${appStatus === 'accepted'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}>
                  <CheckCircle size={15} /> Accept
                </button>
                <button
                  onClick={() => setAppStatus('rejected')}
                  className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border
                    ${appStatus === 'rejected'
                      ? 'bg-red-500 text-white border-red-500 shadow-md'
                      : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500'}`}>
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a
                href={app.cv_feedback_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#1B3C53] hover:bg-[#0f2535] text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg">
                <Download size={16} /> View CV
              </a>
              <a
                href={`mailto:${candidate.email}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FF914D] hover:bg-[#e07d3c] text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg">
                <Send size={16} /> Send Email
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateProfile;