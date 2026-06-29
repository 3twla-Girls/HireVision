import React, { useState, useEffect } from 'react'
import {
  Send, XCircle, MessageSquareText, Search, Sparkles,
  CheckCircle2, Clock, Filter,
} from 'lucide-react'
import ApplicationCard from '../../components/JobSeeker/ApplicationCard'
import { useAuth } from '../../context/AuthContext'

// Two main tabs: Applications (submitted + rejected) and Feedbacks
const TABS = [
  { key: 'applications', label: 'Applications',  icon: Send },
  { key: 'feedbacks',    label: 'Feedbacks',     icon: MessageSquareText },
]

// Status filter options inside the Applications tab
const STATUS_FILTERS = [
  { key: 'all',      label: 'All',          activeClass: 'bg-dark-blue  text-white border-dark-blue'  },
  { key: 'pending',  label: 'Under Review', activeClass: 'bg-orange     text-white border-orange'      },
  { key: 'accepted', label: 'Passed',       activeClass: 'bg-teal       text-white border-teal'        },
  { key: 'rejected', label: 'Rejected',     activeClass: 'bg-red-400 text-white border-red-400'},
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mapStatus = (backendStatus) => {
  switch (backendStatus) {
    case 'accepted': return 'passed'
    case 'rejected': return 'rejected'
    default:         return 'under review'
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

const splitLocation = (location = '') => {
  const parts = location.split(',').map((s) => s.trim())
  return { city: parts[0] ?? '', country: parts.slice(1).join(', ') || parts[0] || '' }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeletons = () => (
  <div className="flex flex-col gap-3">
    {[1, 2, 3].map((n) => (
      <div key={n} className="bg-white rounded-2xl px-6 py-5 border-l-[8px] border-l-light-gray2 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-light-gray1 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-light-gray1 rounded w-2/5" />
            <div className="h-3 bg-light-gray1 rounded w-1/3" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-7 w-24 bg-light-gray1 rounded-lg" />
            <div className="h-3 w-28 bg-light-gray1 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const Applications = () => {
  const { userData } = useAuth()
  const candidateId = userData?._id ?? userData?.id ?? null

  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [activeTab, setActiveTab]       = useState('applications')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery]   = useState('')

  useEffect(() => {
    if (!candidateId) return
    const fetchApplications = async () => {
      try {
        setLoading(true); setError(null)
        const appRes = await fetch(`/api/v1/application/candidate/${candidateId}`)
        if (!appRes.ok) throw new Error(`Failed (${appRes.status})`)
        const appData = await appRes.json()
        
        if (!Array.isArray(appData) || appData.length === 0) { 
          setApplications([])
          return 
        }

        // console.log("Fetched applications: ", appData)
        const enriched = await Promise.all(
          appData.map(async (app) => {
            let job = {}
            try {
              const jr = await fetch(`/api/v1/job/${app.job_id}`)
              if (jr.ok) job = await jr.json()
            } catch (_) {}
            const { city, country } = splitLocation(job.location)
            return {
              id: app._id, jobId: app.job_id,
              jobTitle:         job.job_title  ?? 'Unknown Job',
              company:          job.company    ?? 'Company',
              city, country,
              appliedDate:      formatDate(app.created_at),
              status:           mapStatus(app.status),
              backendStatus:    app.status,
              matchingScore:    app.matching_score  ?? null,
              matchingSkills:   app.matching_skills ?? [],
              missingSkills:    app.missing_skills  ?? [],
              feedbackFile:     app.cv_feedback_url ?? null,
              feedbackFileName: app.cv_feedback_url ? 'CV_Feedback.pdf' : null,
              interview_session_id: app.interview_session_id ?? null
            }
          })
        )
        setApplications(enriched)
      } catch (err) {
        console.error(err)
        setError('Could not load your applications. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [candidateId])

  // ── Counts ──────────────────────────────────────────────────────────────────
  const passedCount   = applications.filter((a) => a.backendStatus === 'accepted').length
  const reviewCount   = applications.filter((a) => a.backendStatus === 'pending').length
  const rejectedCount = applications.filter((a) => a.backendStatus === 'rejected').length
  const feedbackCount = applications.filter(
    (a) => a.feedbackFile 
  ).length

  const tabCounts = {
    applications: applications.length,
    feedbacks:    feedbackCount,
  }

  // Status filter counts (for badges inside the filter pills)
  const statusCounts = {
    all:      applications.length,
    pending:  reviewCount,
    accepted: passedCount,
    rejected: rejectedCount,
  }

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = applications.filter((a) => {
    if (activeTab === 'feedbacks') {
      return a.feedbackFile 
    }
    // Applications tab: apply status filter
    if (statusFilter !== 'all' && a.backendStatus !== statusFilter) return false
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return a.jobTitle.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-light-gray1">

      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-blue via-[#1e4d6b] to-light-blue">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-teal/10 blur-2xl" />

        <div className="relative mx-auto px-4 md:px-8 lg:px-[60px] py-10 max-w-5xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-teal" />
            <span className="text-teal text-[13px] font-semibold tracking-wide uppercase">Application Tracker</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">Your Applications</h1>
          <p className="text-white/60 text-[14px] mt-1.5">Track your progress and review feedback — all in one place.</p>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: CheckCircle2,      label: 'Passed',       value: loading ? '—' : passedCount,   color: 'bg-teal/20 text-teal' },
              { icon: Clock,             label: 'Under Review',  value: loading ? '—' : reviewCount,   color: 'bg-white/10 text-white' },
              { icon: XCircle,           label: 'Rejected',      value: loading ? '—' : rejectedCount, color: 'bg-orange/20 text-light-orange' },
              { icon: MessageSquareText, label: 'Feedbacks',     value: loading ? '—' : feedbackCount, color: 'bg-white/10 text-white' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl backdrop-blur-sm ${color} border border-white/10`}>
                <Icon size={14} />
                <span className="text-[13px] font-semibold">{label}:&nbsp;<span className="font-bold">{value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 max-w-5xl">

        {/* ── Sticky tab bar ── */}
        <div className="sticky top-16 z-30 bg-light-gray1/95 backdrop-blur-sm py-3
                        -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-[60px] lg:px-[60px] mb-5
                        border-b border-light-gray2/60 shadow-sm">

          {/* Tabs + Search row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            {/* Pill tabs */}
            <div className="flex items-center gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-light-gray2/60 self-start">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setStatusFilter('all'); setSearchQuery('') }}
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
                      {loading ? '·' : tabCounts[tab.key]}
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
                placeholder="Search applications…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-white border border-light-gray2/80
                           text-[13px] text-dark-gray4 placeholder:text-dark-gray3
                           focus:outline-none focus:ring-2 focus:ring-dark-blue/20 focus:border-dark-blue/40
                           transition-all duration-200 w-full sm:w-56 shadow-sm"
              />
            </div>
          </div>

          {/* Status filter pills — only on Applications tab */}
          {activeTab === 'applications' && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-1 text-[12px] text-dark-gray3 font-medium mr-1">
                <Filter size={12} />
                Filter:
              </div>
              {STATUS_FILTERS.map((f) => {
                const isActive = statusFilter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3.5 py-1 rounded-lg text-[12px] font-semibold border transition-all duration-200
                                ${isActive
                      ? f.activeClass
                      : 'bg-white text-dark-gray3 border-light-gray2 hover:border-dark-blue/30 hover:text-dark-blue'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Cards ── */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <Skeletons />
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-light-gray2/60 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                <XCircle size={28} className="text-red-400" />
              </div>
              <p className="text-[17px] font-bold text-dark-blue mb-1">Something went wrong</p>
              <p className="text-[13px] text-dark-gray3 max-w-sm mx-auto">{error}</p>
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-[12px] text-dark-gray3 font-medium ml-1 mb-1">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              {filtered.map((app) => (
                <ApplicationCard
                  key={app.id}
                  navigable={activeTab !== 'feedbacks'}
                  application={
                    activeTab === 'feedbacks'
                      ? app
                      : { ...app, feedbackFile: null, feedbackFileName: null }
                  }
                />
              ))}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-light-gray2/60 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-light-gray1 to-white
                              border border-light-gray2 flex items-center justify-center shadow-inner">
                <Search size={28} className="text-dark-gray3" />
              </div>
              <p className="text-[17px] font-bold text-dark-blue mb-1.5">
                {searchQuery ? 'No matching results' : 'Nothing here yet'}
              </p>
              <p className="text-[13px] text-dark-gray3 max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search.`
                  : activeTab === 'feedbacks'
                    ? 'Feedback from recruiters will appear here.'
                    : 'Applications you submit will appear here.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Applications