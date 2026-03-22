import React, { useState, useEffect } from 'react'
import {
  Send,
  XCircle,
  MessageSquareText,
  Search,
  Loader2,
} from 'lucide-react'
import ApplicationCard from '../../components/JobSeeker/ApplicationCard'

// ─── Constants ───────────────────────────────────────────────────────────────
const CURRENT_USER_ID = '69aa315763b720c25373f035'

const TABS = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
  { key: 'feedbacks', label: 'Feedbacks', icon: MessageSquareText },
]

// ─── Status Mapping ───────────────────────────────────────────────────────────
// Backend statuses: "pending" | "accepted" | "rejected"
// UI statuses:      "under review" | "passed" | "rejected" | "feedback"
// UI tabs:          "submitted" | "rejected" | "feedbacks"
const mapStatus = (backendStatus) => {
  switch (backendStatus) {
    case 'accepted': return 'passed'
    case 'rejected': return 'rejected'
    default:         return 'under review'   // "pending"
  }
}

// Tab membership: an application can appear in multiple tabs
// - Submitted  → backendStatus is 'pending' or 'accepted'
// - Rejected   → backendStatus is 'rejected'
// - Feedbacks  → has a cv_feedback_url (regardless of status)
const appBelongsToTab = (app, tabKey) => {
  switch (tabKey) {
    case 'submitted': return app.backendStatus === 'pending' || app.backendStatus === 'accepted'
    case 'rejected':  return app.backendStatus === 'rejected'
    case 'feedbacks': return Boolean(app.feedbackFile) && (app.backendStatus === 'accepted' || app.backendStatus === 'rejected')
    default: return false
  }
}

// ─── Date Formatter ───────────────────────────────────────────────────────────
const formatDate = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

// ─── Location splitter ────────────────────────────────────────────────────────
const splitLocation = (location = '') => {
  const parts = location.split(',').map((s) => s.trim())
  return { city: parts[0] ?? '', country: parts.slice(1).join(', ') || parts[0] || '' }
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const Skeletons = () => (
  <div className="flex flex-col gap-4">
    {[1, 2, 3].map((n) => (
      <div
        key={n}
        className="bg-white rounded-2xl px-6 py-5 border-l-[8px] border-l-light-gray2 animate-pulse"
      >
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
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [activeTab, setActiveTab]       = useState('submitted')
  const [searchQuery, setSearchQuery]   = useState('')

  // ── Fetch applications + enrich with job details ──────────────────────────
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1️⃣ Fetch all applications for this candidate
        const appRes = await fetch(`/api/v1/application/candidate/${CURRENT_USER_ID}`)
        if (!appRes.ok) throw new Error(`Failed to fetch applications (${appRes.status})`)
        const appData = await appRes.json()

        if (!Array.isArray(appData) || appData.length === 0) {
          setApplications([])
          return
        }

        // 2️⃣ Fetch job details for every application in parallel
        const enriched = await Promise.all(
          appData.map(async (app) => {
            let job = {}
            try {
              const jobRes = await fetch(`/api/v1/job/${app.job_id}`)
              if (jobRes.ok) job = await jobRes.json()
            } catch (_) {
              // non-critical — show fallback values if job fetch fails
            }

            const hasFeedback = Boolean(app.cv_feedback_url)
            const { city, country } = splitLocation(job.location)

            return {
              id:               app._id,
              jobId:            app.job_id,
              jobTitle:         job.job_title  ?? 'Unknown Job',
              company:          job.company    ?? 'Company',
              city,
              country,
              appliedDate:      formatDate(app.created_at),
              status:           mapStatus(app.status),
              backendStatus:    app.status,
              matchingScore:    app.matching_score    ?? null,
              matchingSkills:   app.matching_skills   ?? [],
              missingSkills:    app.missing_skills    ?? [],
              feedbackFile:     app.cv_feedback_url   ?? null,
              feedbackFileName: app.cv_feedback_url ? 'CV_Feedback.pdf' : null,
            }
          })
        )

        setApplications(enriched)
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError('Could not load your applications. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  // ── Derived counts & filters ──────────────────────────────────────────────
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = applications.filter((a) => appBelongsToTab(a, tab.key)).length
    return acc
  }, {})

  const filtered = applications.filter((a) => {
    if (!appBelongsToTab(a, activeTab)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        a.jobTitle.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
      )
    }
    return true
  })

  // ── Stats (use backendStatus so feedback apps still count correctly) ──────
  const passedCount   = applications.filter((a) => a.backendStatus === 'accepted').length
  const reviewCount   = applications.filter((a) => a.backendStatus === 'pending').length
  const rejectedCount = applications.filter((a) => a.backendStatus === 'rejected').length
  const feedbackCount = applications.filter((a) => appBelongsToTab(a, 'feedbacks')).length

  const stats = [
    {
      label: 'Passed',
      value: passedCount,
      icon: Send,
      color: 'from-emerald-500 to-emerald-400',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Under Review',
      value: reviewCount,
      icon: Search,
      color: 'from-orange to-light-orange',
      iconBg: 'bg-orange/10',
      iconColor: 'text-dark-orange',
    },
    {
      label: 'Rejected',
      value: rejectedCount,
      icon: XCircle,
      color: 'from-red-500 to-red-400',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      label: 'Feedbacks',
      value: feedbackCount,
      icon: MessageSquareText,
      color: 'from-teal to-emerald-400',
      iconBg: 'bg-light-teal',
      iconColor: 'text-teal',
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 max-w-5xl">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-dark-blue">
            Your Applications &amp; Feedback
          </h1>
          <p className="text-[15px] text-dark-gray3 mt-2">
            Track your progress, manage saved jobs, and review feedback — all in one place.
          </p>
        </div>

        {/* ── Stats Overview ── */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="relative bg-white rounded-2xl p-5 shadow-sm border border-light-gray2/60
                           hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center
                                   group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-dark-blue leading-none">
                      {loading ? '—' : stat.value}
                    </p>
                    <p className="text-[12px] text-dark-gray3 mt-0.5 font-medium">{stat.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Tabs + Search ── */}
        <div className="sticky top-20 z-40 bg-light-gray1/95 backdrop-blur-sm pt-3 md:pt-4 pb-0
                        -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-[60px] lg:px-[60px]
                        flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4
                        rounded-3xl border-b border-light-gray2 mb-6
                        shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex gap-0 sm:gap-2 md:gap-5 overflow-x-auto no-scrollbar -mb-px flex-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 pb-2.5 sm:pb-3 px-2.5 sm:px-2 md:px-1
                              text-[12px] sm:text-[14px] md:text-[15px] font-semibold whitespace-nowrap
                              transition-all duration-200 border-b-[3px]
                              ${activeTab === tab.key
                                ? 'text-dark-blue border-dark-blue'
                                : 'text-dark-gray3 border-transparent hover:text-dark-blue hover:border-light-gray2'
                              }`}
                >
                  <Icon size={15} className={`shrink-0 sm:w-4 sm:h-4 ${activeTab === tab.key ? 'text-dark-blue' : 'text-dark-gray3'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                  <span className={`hidden sm:inline-flex text-[11px] sm:text-[12px] font-bold px-1.5 sm:px-2 py-0.5
                                    rounded-md min-w-[22px] sm:min-w-[24px] text-center
                                    ${activeTab === tab.key
                                      ? 'bg-dark-blue text-white'
                                      : 'bg-light-gray1 text-dark-gray3 border border-light-gray2'
                                    }`}>
                    {loading ? '·' : tabCounts[tab.key]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative mb-2 md:mb-2 shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-gray3" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-light-gray2
                         text-[13px] text-dark-gray4 placeholder:text-dark-gray3
                         focus:outline-none focus:ring-2 focus:ring-dark-blue/20 focus:border-dark-blue/30
                         transition-all duration-200 w-full md:w-56"
            />
          </div>
        </div>

        {/* ── Application Cards ── */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <Skeletons />
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-light-gray2/60 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                <XCircle size={28} className="text-red-400" />
              </div>
              <p className="text-lg font-semibold text-dark-blue mb-1">Something went wrong</p>
              <p className="text-[14px] text-dark-gray3 max-w-sm mx-auto">{error}</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                navigable={activeTab !== 'feedbacks'}
                application={
                  activeTab === 'feedbacks'
                    ? app
                    : { ...app, feedbackFile: null, feedbackFileName: null }
                }
              />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-light-gray2/60 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-light-gray1 flex items-center justify-center">
                <Search size={28} className="text-dark-gray3" />
              </div>
              <p className="text-lg font-semibold text-dark-blue mb-1">
                {searchQuery ? 'No matching applications' : 'No applications yet'}
              </p>
              <p className="text-[14px] text-dark-gray3 max-w-sm mx-auto">
                {searchQuery
                  ? `We couldn't find any results for "${searchQuery}". Try a different search term.`
                  : 'Applications you submit will appear here. Start exploring jobs to get started!'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Applications