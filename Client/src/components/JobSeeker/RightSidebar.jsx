import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarClock,
  Briefcase,
  ChevronRight,
  Loader2,
  VideoIcon,
  ClipboardList,
} from 'lucide-react';

// ─── helpers ───────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ─── Sub-components ────────────────────────────────────────
const Spinner = () => (
  <div className="flex justify-center py-4">
    <Loader2 className="w-5 h-5 animate-spin text-dark-blue/40" />
  </div>
);

const Badge = ({ count, color = 'bg-dark-blue' }) => (
  <span
    className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5
                rounded-full text-white text-[11px] font-bold ${color} shadow-sm`}
  >
    {count}
  </span>
);

// ─── Card: Interview ───────────────────────────────────────
const InterviewCard = ({ session }) => {
  const title = session.job_title ?? 'Interview';
  const date  = fmt(session.scheduled_at ?? session.created_at);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r
                 from-blue-50 to-slate-50 border border-blue-100/60
                 hover:shadow-sm transition-shadow duration-200"
    >
      <div className="w-9 h-9 rounded-xl bg-dark-blue/10 flex items-center justify-center shrink-0">
        <VideoIcon size={16} className="text-dark-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-dark-blue truncate">{title}</p>
        {date && <p className="text-[11px] text-slate-400 mt-0.5">{date}</p>}
      </div>
    </div>
  );
};

// ─── Main Sidebar ──────────────────────────────────────────
const RightSidebar = () => {
  const { userData } = useAuth();
  const candidateId = userData?._id ?? userData?.id ?? null;

  const [interviews, setInterviews] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingInt, setLoadingInt] = useState(true);
  const [loadingApp, setLoadingApp] = useState(true);

  // ── Fetch upcoming interview sessions ─────────────────
  useEffect(() => {
    if (!candidateId) { setLoadingInt(false); return; }
    const run = async () => {
      try {
        const res = await fetch(`/api/v1/interview/candidate/${candidateId}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.sessions ?? []);

        // Filter using the exact logic from Interviews.jsx:
        // 1. Must not be mock
        // 2. 'upcoming' means Date.now() < session_date + 5 hours
        const upcoming = list.filter((s) => {
          if (s.is_mock) return false;
          if (s.answers && s.answers.length > 0) return false;

          const rawDate = s.session_date?.$date || s.session_date; 
          const rawDateStr = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
          
          const now = new Date();
          const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          
          if (rawDateStr && rawDateStr < localDateStr) {
             return false;
          }
          return true;
        });

        setInterviews(upcoming.slice(0, 3));
      } catch (e) {
        console.warn('Failed to fetch interviews:', e);
      } finally {
        setLoadingInt(false);
      }
    };
    run();
  }, [candidateId]);

  // ── Fetch pending applications ─────────────────────────
  useEffect(() => {
    if (!candidateId) { setLoadingApp(false); return; }
    const run = async () => {
      try {
        const res = await fetch(`/api/v1/application/candidate/${candidateId}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setPendingCount(list.filter((a) => a.status === 'pending').length);
      } catch (e) {
        console.warn('Failed to fetch applications:', e);
      } finally {
        setLoadingApp(false);
      }
    };
    run();
  }, [candidateId]);

  return (
    <aside className="flex flex-row md:flex-col gap-4 h-fit lg:sticky lg:top-28">

      {/* ── Upcoming Interviews ─────────────────────────── */}
      <div
        className="flex-1 md:flex-none bg-white rounded-3xl shadow-md border border-gray-50
                   p-5 flex flex-col gap-3 overflow-hidden
                   transition-shadow duration-200 hover:shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-dark-blue/8 flex items-center justify-center bg-slate-100">
              <CalendarClock size={16} className="text-dark-blue" />
            </div>
            <span className="text-[14px] font-bold text-dark-blue">Upcoming Interviews</span>
          </div>
          {!loadingInt && (
            <Badge
              count={interviews.length}
              color={interviews.length > 0 ? 'bg-dark-blue' : 'bg-gray-300'}
            />
          )}
        </div>

        {/* Body */}
        {loadingInt ? (
          <Spinner />
        ) : interviews.length === 0 ? (
          <p className="text-[12px] text-slate-400 text-center py-2">
            No upcoming interviews
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {interviews.map((s, i) => (
              <InterviewCard key={s._id ?? s.id ?? i} session={s} />
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          to="/interviews"
          className="flex items-center justify-between mt-1 text-[12px] font-semibold
                     text-orange hover:text-dark-orange transition-colors duration-200 group"
        >
          <span>View all interviews</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── Pending Applications ────────────────────────── */}
      <div
        className="flex-1 md:flex-none bg-white rounded-3xl shadow-md border border-gray-50
                   p-5 flex flex-col gap-4
                   transition-shadow duration-200 hover:shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <ClipboardList size={16} className="text-dark-blue" />
            </div>
            <span className="text-[14px] font-bold text-dark-blue">Applications</span>
          </div>
          {!loadingApp && (
            <Badge
              count={pendingCount}
              color={pendingCount > 0 ? 'bg-orange' : 'bg-gray-300'}
            />
          )}
        </div>

        {/* Counter row */}
        {loadingApp ? (
          <Spinner />
        ) : (
          <div
            className="flex items-center gap-3 p-3 rounded-2xl
                       bg-gradient-to-r from-orange/5 to-amber-50
                       border border-orange/15"
          >
            <div className="w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center shrink-0">
              <Briefcase size={16} className="text-orange" />
            </div>
            <div>
              <p className="text-[22px] font-extrabold text-dark-blue leading-none">
                {pendingCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">pending review</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          to="/applications"
          className="flex items-center justify-between text-[12px] font-semibold
                     text-orange hover:text-dark-orange transition-colors duration-200 group"
        >
          <span>View all applications</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

    </aside>
  );
};

export default RightSidebar;
