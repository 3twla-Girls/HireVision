import React, { useState } from 'react'
import JobDetails from '../../components/JobSeeker/JobDetails'
import {job,JOBS} from '../../data/jobs'
import { BookmarkIcon, Clock, MapPin, SendHorizonalIcon } from 'lucide-react'
import ApplyModal from '../../components/JobSeeker/ApplyModal'
import USERS from '../../data/user'
import SimilarJobCard from '../../components/JobSeeker/SimilarJobCard'

const Job = () => {
  const user = USERS[1]; 
  const matchingScore = 80; 
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (matchingScore / 100) * circumference;

  const [showApply, setShowApply] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#F7F9FB]">
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 items-start">
        
        {/* --- Center: Main Job Content (Order 1 on mobile) --- */}
        <main className="order-1 lg:order-2 lg:col-span-6 md:col-span-4 space-y-4 w-full">
          <JobDetails job={job} setShowApply={setShowApply}/>
        </main>

        {/* --- Right Sidebar: Widgets (Order 2 on mobile) --- */}
        <aside className="order-2 lg:order-3 lg:col-span-3 md:col-span-2 space-y-4 h-fit lg:sticky lg:top-28 w-full">
          
          {/* Matching Score Widget */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md flex flex-col items-center text-center border border-gray-50 transition-transform hover:scale-[1.02]">
            <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center mb-6">
              <svg className="absolute w-full h-full animate-[spin_4s_linear_infinite]" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                <circle 
                  cx="64" cy="64" r={radius} strokeWidth="12" fill="transparent" 
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  className="stroke-dark-blue transition-all duration-1000 ease-in-out" 
                />
              </svg>
              <span className="text-2xl md:text-3xl font-extrabold text-dark-orange">
                {matchingScore}%
              </span>
            </div>
            
            <h3 className="text-lg md:text-xl font-bold text-dark-blue">
              {matchingScore >= 75 ? "Good Matching" : matchingScore >= 50 ? "Average Matching" : "Low Matching"}
            </h3>
            
            <p className="text-[13px] text-light-blue mt-2">
              {matchingScore >= 75 ? "You are good enough to apply ✓" : matchingScore >= 50 ? "You might need more skills" : "You may want to improve your skills"} 
            </p>
          </div>

          {/* Company Info Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border border-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-dark-blue rounded-lg flex items-center justify-center text-white text-[10px] font-bold">LOGO</div>
              <h3 className="text-lg font-bold text-dark-blue truncate">{job.company}</h3>
            </div>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
              Our company is composed of talented and passionate individuals who are dedicated to innovation and excellence.
            </p>
            <a href="#" className="flex items-center justify-between text-dark-orange font-bold text-sm hover:translate-x-1 transition-transform">
              <span className="flex items-center gap-2">Visit Website</span>
              <span>↗</span>
            </a>
          </div>
        </aside>

        {/* --- Left Sidebar: Similar Jobs (Order 3 on mobile) --- */}
        <aside className="order-3 lg:order-1 lg:col-span-3 md:col-span-6 h-fit lg:sticky lg:top-28 flex flex-col w-full">
          <h2 className="text-xl md:text-2xl font-semibold text-dark-blue mb-6">Similar Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto px-2 custom-scrollbar no-scrollbar lg:h-[calc(100vh-200px)]">
            {JOBS.map((jobItem) => {
              return (
                <SimilarJobCard key={jobItem.id} job={jobItem} />
              )
            })}
          </div>
        </aside>

      </div>
      
      {/* Apply Modal */}
      {showApply && (
        <ApplyModal setShowApply={setShowApply} jobTitle={job.title} userResumes={user.resumes} />
      )}
    </div>
  );
}

export default Job;