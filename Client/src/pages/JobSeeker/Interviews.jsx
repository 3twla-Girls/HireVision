import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck, FlaskConical, Search, Play,
  Loader2, Sparkles, TrendingUp, Clock3,
} from 'lucide-react'
import InterviewCard from '../../components/JobSeeker/InterviewCard'

const TABS = [
  { key: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
  { key: 'mock',     label: 'Mock Results', icon: FlaskConical },
]

// ── Map a raw DB session → InterviewCard prop shape ──────────────
const mapSession = (s) => {
  const date = s.session_date
    ? new Date(s.session_date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

  const rawScore = s.final_summary?.technical?.final_score
  const score = rawScore != null ? Math.min(Math.round(Number(rawScore) * 10), 100) : 0

  const totalQuestions = s.answers?.length ?? 0
  const answeredCorrectly = s.answers?.filter(
    (a) => Number(a.evaluation?.score ?? 0) >= 3
  ).length ?? 0

  // A real session is "upcoming" while now < session_date + 5 hours
  const sessionDay  = s.session_date ? new Date(s.session_date) : null
  const expiresAt   = sessionDay ? new Date(sessionDay.getTime() + 5 * 60 * 60 * 1000) : null
  const isUpcoming  = expiresAt ? Date.now() < expiresAt.getTime() : false

  return {
    id: s._id,
    jobId: s.job_id ?? null,
    tab: s.is_mock ? 'mock' : (isUpcoming ? 'upcoming' : 'past'),
    jobTitle: s.job_title || 'Interview Session',
    company:  s.company  || '—',
    city:     s.city     || '—',
    country:  s.country  || '',
    interviewDate: date,
    scheduledAt:   s.session_date ?? new Date().toISOString(),
    score,
    totalQuestions,
    answeredCorrectly,
    duration: `${totalQuestions} Q`,
    reportFile: s.final_summary?.technical ? s._id : null,
    _raw: s,
  }
}

// ── Animated score ring for the avg stat ─────────────────────────
const MiniRing = ({ value }) => {
  const r = 18, circ = 2 * Math.PI * r
  const color = value >= 70 ? '#10b981' : value >= 50 ? '#FF914D' : '#ef4444'
  return (
    <div className="relative w-12 h-12">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-dark-blue">
        {value}%
      </span>
    </div>
  )
}

const Interviews = () => {
  const navigate = useNavigate()
  const user = JSON.parse(sessionStorage.getItem('user') || 'null')
  const candidateId = user?._id ?? ''

  const [sessions,    setSessions]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [activeTab,   setActiveTab]   = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!candidateId) { setLoading(false); return }
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/v1/interview/candidate/${candidateId}`)
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()

        const uniqueJobIds = [...new Set(
          data.filter((s) => !s.is_mock && s.job_id).map((s) => s.job_id)
        )]
        const jobMap = {}
        await Promise.all(
          uniqueJobIds.map(async (jobId) => {
            try {
              const jr = await fetch(`/api/v1/job/${jobId}`)
              if (jr.ok) { const job = await jr.json(); jobMap[jobId] = job }
            } catch { /* ignore */ }
          })
        )

        const mapped = data.map((s) => {
          const base = mapSession(s)
          if (!s.is_mock && s.job_id && jobMap[s.job_id]) {
            const job = jobMap[s.job_id]
            const parts = (job.location ?? '').split(',').map((p) => p.trim())
            base.jobTitle = job.job_title || base.jobTitle
            base.company  = job.company   || '—'
            base.city     = parts[0]      || '—'
            base.country  = parts.slice(1).join(', ') || parts[0] || ''
          }
          return base
        })

        setSessions(mapped)
      } catch (err) {
        console.error('Failed to fetch interviews:', err)
        setError('Could not load interviews. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [candidateId])

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = sessions.filter((s) => s.tab === tab.key).length
    return acc
  }, {})

  const filtered = sessions.filter((s) => {
    if (s.tab !== activeTab) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return s.jobTitle.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)
  })

  const mockSessions = sessions.filter((s) => s.tab === 'mock')
  const avgScore = mockSessions.length
    ? Math.round(mockSessions.reduce((sum, s) => sum + s.score, 0) / mockSessions.length)
    : 0
  const bestScore = mockSessions.length
    ? Math.max(...mockSessions.map((s) => s.score))
    : 0

  return (
    <div className="min-h-screen bg-light-gray1">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-blue via-[#1e4d6b] to-light-blue">
        {/* decorative blobs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-teal/10 blur-2xl" />

        <div className="relative mx-auto px-4 md:px-8 lg:px-[60px] py-10 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-teal" />
                <span className="text-teal text-[13px] font-semibold tracking-wide uppercase">
                  Interview Hub
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                Your Interviews
              </h1>
              <p className="text-white/60 text-[14px] mt-1.5">
                Track sessions, review mock results, and prepare to excel.
              </p>
            </div>

            <button
              onClick={() => navigate('/interview/mock')}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl
                         bg-white text-dark-blue font-bold text-[14px]
                         hover:bg-light-gray1 hover:scale-[1.03] active:scale-95
                         transition-all duration-200 shadow-lg shrink-0 self-start sm:self-auto"
            >
              <Play size={15} className="fill-dark-blue" />
              Start Mock Interview
            </button>
          </div>

          {/* ── Stat chips inside hero ── */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: CalendarCheck, label: 'Upcoming', value: tabCounts.upcoming ?? 0, color: 'bg-white/10 text-white' },
              { icon: FlaskConical,  label: 'Mocks Done', value: tabCounts.mock ?? 0,     color: 'bg-teal/20 text-teal' },
              { icon: TrendingUp,    label: 'Avg Score',  value: `${avgScore}%`,          color: 'bg-orange/20 text-light-orange' },
              { icon: Clock3,        label: 'Best Score', value: `${bestScore}%`,          color: 'bg-white/10 text-white' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl backdrop-blur-sm ${color} border border-white/10`}>
                <Icon size={14} />
                <span className="text-[13px] font-semibold">{label}:&nbsp;<span className="font-bold">{value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 max-w-5xl">

        {/* ── Tab bar + Search ── */}
        <div className="sticky top-16 z-30 bg-light-gray1/95 backdrop-blur-sm py-3
                        -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-[60px] lg:px-[60px] mb-6
                        border-b border-light-gray2/60 shadow-sm
                        flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-light-gray2/60 self-start">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearchQuery('') }}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold
                              transition-all duration-200
                              ${isActive
                    ? 'bg-dark-blue text-white shadow-md'
                    : 'text-dark-gray3 hover:bg-light-gray1 hover:text-dark-blue'
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  {tab.label}
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center
                                   ${isActive ? 'bg-white/20 text-white' : 'bg-light-gray1 text-dark-gray3'}`}>
                    {tabCounts[tab.key] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-gray3 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'mock' ? 'mock results' : 'interviews'}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl bg-white border border-light-gray2/80
                         text-[13px] text-dark-gray4 placeholder:text-dark-gray3
                         focus:outline-none focus:ring-2 focus:ring-dark-blue/20 focus:border-dark-blue/40
                         transition-all duration-200 w-full sm:w-56 shadow-sm"
            />
          </div>
        </div>



        {/* ── Cards ── */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-light-gray2/60 flex items-center justify-center">
                <Loader2 size={26} className="animate-spin text-dark-blue" />
              </div>
              <p className="text-[14px] text-dark-gray3 font-medium">Loading your interviews…</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm">
              <p className="text-sm text-red-500 font-semibold">⚠️ {error}</p>
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-[12px] text-dark-gray3 font-medium ml-1 mb-1">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              {filtered.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-light-gray2/60 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-light-gray1 to-white
                              border border-light-gray2 flex items-center justify-center shadow-inner">
                {activeTab === 'mock'
                  ? <FlaskConical size={28} className="text-teal" />
                  : <CalendarCheck size={28} className="text-light-blue" />}
              </div>
              <p className="text-[17px] font-bold text-dark-blue mb-1.5">
                {searchQuery ? 'No matching results' : activeTab === 'mock' ? 'No mock sessions yet' : 'No upcoming interviews'}
              </p>
              <p className="text-[13px] text-dark-gray3 max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search.`
                  : activeTab === 'mock'
                    ? 'Start a mock interview above to practice and track your progress here.'
                    : 'Your scheduled interviews will appear here once assigned.'}
              </p>
              {!searchQuery && activeTab === 'mock' && (
                <button
                  onClick={() => navigate('/interview/mock')}
                  className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
                             bg-dark-blue text-white text-[13px] font-semibold
                             hover:bg-light-blue active:scale-95 transition-all duration-200"
                >
                  <Play size={13} className="fill-white" />
                  Start Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Interviews