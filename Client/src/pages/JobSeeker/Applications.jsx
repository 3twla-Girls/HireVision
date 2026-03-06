import React, { useState } from 'react'
import APPLICATIONS from '../../data/applications'
import ApplicationCard from '../../components/JobSeeker/ApplicationCard'

const TABS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'saved', label: 'Saved Jobs' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'feedbacks', label: 'Feedbacks' },
]

const Applications = () => {
  const [activeTab, setActiveTab] = useState('submitted')

  // Count per tab
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = APPLICATIONS.filter((a) => a.tab === tab.key).length
    return acc
  }, {})

  // Filtered applications for the active tab
  const filtered = APPLICATIONS.filter((a) => a.tab === activeTab)

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 max-w-5xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-dark-blue">
            Your Applications & Feedback
          </h1>
          <p className="text-[15px] text-dark-gray3 mt-2">
            Here you can find all your submitted,rejected and saved jobs
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-light-gray2 mb-8">
          <div className="flex gap-2 md:gap-6 overflow-x-auto no-scrollbar -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-1 text-[15px] font-semibold
                            whitespace-nowrap transition-all duration-200 border-b-[3px]
                            ${activeTab === tab.key
                    ? 'text-dark-blue border-dark-blue'
                    : 'text-dark-gray3 border-transparent hover:text-dark-blue hover:border-light-gray2'
                  }`}
              >
                {tab.label}
                <span
                  className={`text-[12px] font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center
                              ${activeTab === tab.key
                      ? 'bg-dark-blue text-white'
                      : 'bg-light-gray1 text-dark-gray3 border border-light-gray2'
                    }`}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Application Cards ── */}
        <div className="flex flex-col gap-4">
          {filtered.length > 0 ? (
            filtered.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-dark-gray3">
                No applications found in this tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Applications