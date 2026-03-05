import React from 'react'
import {JOBS} from '../../data/jobs'
import FilterSidebar from '../../components/JobSeeker/FilterSidebar'
import JobCard from '../../components/JobSeeker/JobCard'
import RightSidebar from '../../components/JobSeeker/RightSidebar'

const Home = () => {
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-[60px] py-8 grid grid-cols-12 gap-5 items-stretch">
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
    </div>
  )
}

export default Home