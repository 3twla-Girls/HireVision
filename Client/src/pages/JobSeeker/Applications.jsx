import React, { useState } from 'react'
import {
  Send,
  Bookmark,
  XCircle,
  MessageSquareText,
  Search,
  Briefcase,
} from 'lucide-react'
import APPLICATIONS from '../../data/applications'
import ApplicationCard from '../../components/JobSeeker/ApplicationCard'

const TABS = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'saved', label: 'Saved Jobs', icon: Bookmark },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
  { key: 'feedbacks', label: 'Feedbacks', icon: MessageSquareText },
]

const Applications = () => {
  const [activeTab, setActiveTab] = useState('submitted')
  const [searchQuery, setSearchQuery] = useState('')

  // Count per tab
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = APPLICATIONS.filter((a) => a.tab === tab.key).length
    return acc
  }, {})

  // Filtered applications for the active tab + search
  const filtered = APPLICATIONS.filter((a) => {
    if (a.tab !== activeTab) return false
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

  // Summary stats
  const totalApps = APPLICATIONS.filter((a) => a.tab === 'submitted' || a.tab === 'rejected').length
  const passedCount = APPLICATIONS.filter((a) => a.status === 'passed').length
  const reviewCount = APPLICATIONS.filter((a) => a.status === 'under review').length
  const feedbackCount = APPLICATIONS.filter((a) => a.tab === 'feedbacks').length
  const rejectedCount = APPLICATIONS.filter((a) => a.tab === 'rejected').length

  const stats = [
    // {
    //   label: 'Total Applications',
    //   value: totalApps,
    //   icon: Briefcase,
    //   color: 'from-dark-blue to-light-blue',
    //   iconBg: 'bg-dark-blue/10',
    //   iconColor: 'text-dark-blue',
    // },
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 max-w-5xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-dark-blue">
            Your Applications & Feedback
          </h1>
          <p className="text-[15px] text-dark-gray3 mt-2">
            Track your progress, manage saved jobs, and review feedback — all in
            one place.
          </p>
        </div>

        {/* ── Stats Overview ── */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 center">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="relative bg-white rounded-2xl p-5 shadow-sm border border-light-gray2/60
                           hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
              >
                {/* Gradient accent line at top */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
                />
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center
                                group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-dark-blue leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[12px] text-dark-gray3 mt-0.5 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Tabs + Search ── */}
        <div className="sticky top-20 z-40 bg-light-gray1/95 backdrop-blur-sm pt-3 md:pt-4 pb-0 -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-[60px] lg:px-[60px]
                        flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 rounded-3xl border-b border-light-gray2 mb-6
                        shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex gap-0 sm:gap-2 md:gap-5 overflow-x-auto no-scrollbar -mb-px flex-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 pb-2.5 sm:pb-3 px-2.5 sm:px-2 md:px-1 text-[12px] sm:text-[14px] md:text-[15px] font-semibold
                              whitespace-nowrap transition-all duration-200 border-b-[3px]
                              ${activeTab === tab.key
                      ? 'text-dark-blue border-dark-blue'
                      : 'text-dark-gray3 border-transparent hover:text-dark-blue hover:border-light-gray2'
                    }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 sm:w-4 sm:h-4 ${activeTab === tab.key
                      ? 'text-dark-blue'
                      : 'text-dark-gray3'
                      }`}
                  />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                  <span
                    className={`hidden sm:inline-flex text-[11px] sm:text-[12px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md min-w-[22px] sm:min-w-[24px] text-center
                                ${activeTab === tab.key
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

          {/* Search within tab */}
          <div className="relative mb-2 md:mb-2 shrink-0">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-gray3"
            />
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
          {filtered.length > 0 ? (
            filtered.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-light-gray2/60 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-light-gray1 flex items-center justify-center">
                <Search size={28} className="text-dark-gray3" />
              </div>
              <p className="text-lg font-semibold text-dark-blue mb-1">
                {searchQuery
                  ? 'No matching applications'
                  : 'No applications yet'}
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