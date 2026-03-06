import React, { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { JOBS } from '../../data/jobs'
import FilterSidebar from '../../components/JobSeeker/FilterSidebar'
import JobCard from '../../components/JobSeeker/JobCard'
import RightSidebar from '../../components/JobSeeker/RightSidebar'

const Home = () => {
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* ── Desktop layout (lg+): 3-column grid ── */}
      <div className="hidden lg:grid mx-auto px-[60px] py-8 grid-cols-12 gap-5 items-stretch">
        {/* Left – Filters (3 cols) */}
        <div className="col-span-3 pb-8">
          <FilterSidebar />
        </div>

        {/* Center – Job Listings (6 cols) */}
        <main className="col-span-6">
          <h1 className="text-2xl font-bold text-dark-blue mb-6">
            Recommended for you!
          </h1>
          <div className="flex flex-col gap-4">
            {JOBS.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </main>

        {/* Right – Sidebar Widgets (3 cols) */}
        <div className="col-span-3">
          <RightSidebar />
        </div>
      </div>

      {/* ── Tablet layout (md–lg): 2-column grid ── */}
      <div className="hidden md:block lg:hidden mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-5 items-stretch">
          {/* Jobs (8 cols) */}
          <main className="col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-dark-blue">
                Recommended for you!
              </h1>
              <button
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-light-gray2
                           shadow-sm hover:shadow-md hover:border-orange/40 transition-all duration-200
                           text-sm font-semibold text-dark-blue"
              >
                <SlidersHorizontal size={16} className="text-orange" strokeWidth={2.2} />
                Filters
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {JOBS.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </main>

          {/* Right sidebar (4 cols) */}
          <div className="col-span-4">
            <RightSidebar />
          </div>
        </div>

        {/* Filter panel overlay */}
        <FilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      </div>

      {/* ── Phone layout (<md): single column ── */}
      <div className="block md:hidden mx-auto px-4 py-5">
        {/* Right sidebar as row */}
        <div className="mb-5">
          <RightSidebar />
        </div>

        {/* Header + filter button */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-dark-blue">
            Recommended for you!
          </h1>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-light-gray2
                       shadow-sm hover:shadow-md hover:border-orange/40 transition-all duration-200
                       text-sm font-semibold text-dark-blue"
          >
            <SlidersHorizontal size={16} className="text-orange" strokeWidth={2.2} />
            Filters
          </button>
        </div>

        {/* Job cards */}
        <div className="flex flex-col gap-4">
          {JOBS.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {/* Filter panel overlay */}
        <FilterSidebar isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      </div>
    </div>
  )
}

export default Home