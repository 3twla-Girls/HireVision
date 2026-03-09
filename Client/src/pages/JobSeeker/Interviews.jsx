import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  History,
  FlaskConical,
  Search,
  Play,
  Clock,
} from 'lucide-react'
import INTERVIEWS from '../../data/interviews'
import InterviewCard from '../../components/JobSeeker/InterviewCard'

const TABS = [
  { key: 'upcoming', label: 'Upcoming Interviews', icon: CalendarCheck },
  { key: 'past', label: 'Past Interviews', icon: History },
  { key: 'mock', label: 'Mock Interview Results', icon: FlaskConical },
]

// Short labels for narrow screens
const SHORT_LABELS = {
  upcoming: 'Upcoming',
  past: 'Past',
  mock: 'Mock Results',
}

// ── Live upcoming count (updates when interviews expire) ───────
const useLiveCounts = () => {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return TABS.reduce((acc, tab) => {
    acc[tab.key] = INTERVIEWS.filter((i) => i.tab === tab.key).length
    return acc
  }, {})
}

const Interviews = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const tabCounts = useLiveCounts()

  const filtered = INTERVIEWS.filter((i) => {
    if (i.tab !== activeTab) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      i.jobTitle.toLowerCase().includes(q) ||
      i.company.toLowerCase().includes(q) ||
      (i.city || '').toLowerCase().includes(q)
    )
  })

  // Stats derived from data
  const upcomingCount = INTERVIEWS.filter((i) => i.tab === 'upcoming').length
  const pastCount = INTERVIEWS.filter((i) => i.tab === 'past').length
  const mockCount = INTERVIEWS.filter((i) => i.tab === 'mock').length
  const avgScore = mockCount
    ? Math.round(
      INTERVIEWS.filter((i) => i.tab === 'mock').reduce((s, i) => s + i.score, 0) / mockCount
    )
    : 0

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 max-w-5xl">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-dark-blue">
              Your Scheduled &amp; Previous Interviews
            </h1>
            <p className="text-[15px] text-dark-gray3 mt-2 leading-relaxed">
              Here you can find all your interviews status and schedule.<br className="hidden sm:block" />
              You can start a mock interview for practice.
            </p>
          </div>

          {/* Start Mock Interview CTA */}
          <button
            onClick={() => navigate('/interview/mock')}
            className="flex items-center gap-2 px-8 py-4 rounded-3xl bg-light-blue text-white
                       font-semibold text-[14px] shadow-xl md:mt-8 
                       hover:bg-dark-blue/90 hover:shadow-lg hover:-translate-y-0.5
                       active:scale-95 transition-all duration-200 shrink-0 self-start sm:self-auto"
          >
            <Play size={16} className="fill-white" />
            Start Mock Interview
          </button>

        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Upcoming Interviews',
              value: upcomingCount,
              icon: CalendarCheck,
              color: 'from-dark-blue to-light-blue',
              iconBg: 'bg-dark-blue/10',
              iconColor: 'text-dark-blue',
            },
            {
              label: 'Past Interviews',
              value: pastCount,
              icon: History,
              color: 'from-light-blue to-teal',
              iconBg: 'bg-light-blue/10',
              iconColor: 'text-light-blue',
            },
            {
              label: 'Mock Interview Results',
              value: mockCount,
              icon: FlaskConical,
              color: 'from-teal to-emerald-400',
              iconBg: 'bg-light-teal',
              iconColor: 'text-teal',
            },
            {
              label: 'Avg. Mock Score',
              value: `${avgScore}%`,
              icon: Clock,
              color: 'from-orange to-light-orange',
              iconBg: 'bg-orange/10',
              iconColor: 'text-dark-orange',
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="relative bg-white rounded-2xl p-5 shadow-sm border border-light-gray2/60
                           hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center
                                group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-dark-blue leading-none">{stat.value}</p>
                    <p className="text-[12px] text-dark-gray3 mt-0.5 font-medium">{stat.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Tabs + Search ── */}
        <div
          className="sticky top-20 z-40 bg-light-gray1/95 backdrop-blur-sm pt-3 md:pt-4 pb-0
                     -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-[60px] lg:px-[60px]
                     flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4
                     rounded-3xl border-b border-light-gray2 mb-6
                     shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]"
        >
          {/* Tab buttons */}
          <div className="flex gap-0 md:gap-4 overflow-x-auto no-scrollbar -mb-px flex-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearchQuery('') }}
                  className={`flex items-center gap-2.5 pb-2.5 md:pb-3 px-2.5 md:px-1
                              text-[12px] md:text-[16px] font-semibold
                              whitespace-nowrap transition-all duration-200 border-b-[3px]
                              ${isActive
                      ? 'text-dark-blue border-dark-blue'
                      : 'text-dark-gray3 border-transparent hover:text-dark-blue hover:border-light-gray2'
                    }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 ${isActive ? 'text-dark-blue' : 'text-dark-gray3'}`}
                  />
                  <span>{SHORT_LABELS[tab.key]}</span>
                  <span
                    className={`inline-flex text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[22px] text-center
                                ${isActive
                        ? 'bg-dark-blue text-white'
                        : 'bg-light-gray1 text-dark-gray3 border border-light-gray2'
                      }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative mb-2 shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-gray3" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-light-gray2
                         text-[13px] text-dark-gray4 placeholder:text-dark-gray3
                         focus:outline-none focus:ring-2 focus:ring-dark-blue/20 focus:border-dark-blue/30
                         transition-all duration-200 w-full lg:w-52"
            />
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="flex flex-col gap-4">
          {filtered.length > 0 ? (
            filtered.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-light-gray2/60 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-light-gray1 flex items-center justify-center">
                <Search size={28} className="text-dark-gray3" />
              </div>
              <p className="text-lg font-semibold text-dark-blue mb-1">
                {searchQuery ? 'No matching interviews' : 'Nothing here yet'}
              </p>
              <p className="text-[14px] text-dark-gray3 max-w-sm mx-auto">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search term.`
                  : 'Interviews scheduled for you will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Interviews;