import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Edit, Users, Eye, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { JOBS } from '../../data/jobs';

const JobManagement = () => {
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState(JOBS[0]?.id || null);
  const [jobs, setJobs] = useState(
    JOBS.map(job => ({ ...job, status: job.id % 2 === 0 ? 'Closed' : 'Open' })) // Mocking statuses
  );

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  const toggleStatus = (id) => {
    setJobs(jobs.map(job =>
      job.id === id
        ? { ...job, status: job.status === 'Open' ? 'Closed' : 'Open' }
        : job
    ));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 md:px-[60px] py-10 grid grid-cols-12 gap-8">

        {/* Header */}
        <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-[#1B3C53] flex items-center gap-3  tracking-tight">
              <Briefcase className="bg-[#FF914D] text-white p-1.5 rounded-lg shadow-lg" size={36} />
              JOB MANAGEMENT
            </h1>
            <p className="text-[#456882] font-medium mt-1">Manage all your currently posted vacancies and applicants.</p>
          </div>
        </div>

        {/* Sidebar Checklist of Jobs (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          {jobs.map(job => (
            <div
              key={job.id}
              onClick={() => setSelectedJobId(job.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${selectedJobId === job.id
                ? 'bg-[#1B3C53] text-white shadow-xl scale-[1.02] border-[#1B3C53]'
                : 'bg-white text-[#1B3C53] hover:border-[#1B3C53]/30 border-gray-100 hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${job.status === 'Open'
                  ? selectedJobId === job.id ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                  : selectedJobId === job.id ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                  }`}>
                  {job.status}
                </span>
              </div>
              <p className={`text-sm mb-3 ${selectedJobId === job.id ? 'text-white/70' : 'text-[#456882]'}`}>
                {job.workplace} • {job.type}
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className={`text-[11px] font-bold ${selectedJobId === job.id ? 'text-white/50' : 'text-gray-400'}`}>
                  {job.postedAgo}
                </span>
                <div className={`flex items-center gap-1 ${selectedJobId === job.id ? 'text-white/80' : 'text-[#FF914D]'}`}>
                  <Users size={14} />
                  <span className="text-xs font-bold">{job.id * 12} Candidates</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area: Job Details (8 Cols) */}
        <div className="col-span-12 lg:col-span-8">
          {selectedJob ? (
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#1B3C53]"></div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-gray-100 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-[#1B3C53]">{selectedJob.title}</h2>
                    <span className={`text-xs uppercase font-black px-3 py-1 rounded-full ${selectedJob.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[#456882] font-medium text-sm">
                    <span className="flex items-center gap-1"><MapPin size={16} className="text-[#FF914D]" /> {selectedJob.city}, {selectedJob.country}</span>
                    <span className="flex items-center gap-1"><Briefcase size={16} className="text-[#FF914D]" /> {selectedJob.experience} • {selectedJob.workplace}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 shrink-0">
                  <button

                    onClick={() => navigate(`/job-preview/69aae77ddef3bd659ee84eac`)}
                    className="flex items-center gap-2 bg-[#F8FAFC] text-[#1B3C53] hover:bg-[#1B3C53] hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-gray-200">
                    <Eye size={16} /> Preview
                  </button>
                  <button className="flex items-center gap-2 bg-[#F8FAFC] text-[#1B3C53] hover:bg-[#1B3C53] hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-gray-200">
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(selectedJob.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${selectedJob.status === 'Open'
                      ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white'
                      : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white'
                      }`}
                  >
                    {selectedJob.status === 'Open' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {selectedJob.status === 'Open' ? 'Close Job' : 'Reopen Job'}
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <div>
                  <h3 className="text-sm font-black text-[#456882] uppercase tracking-widest mb-4">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map(skill => (
                      <span key={skill} className="bg-[#1B3C53]/5 text-[#1B3C53] px-3 py-1.5 rounded-lg text-sm font-bold border border-[#1B3C53]/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#456882]/60 mb-1">Salary</span>
                      <span className="text-[#1B3C53] font-bold">{selectedJob.salary}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#456882]/60 mb-1">Type</span>
                      <span className="text-[#1B3C53] font-bold">{selectedJob.type}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#456882]/60 mb-1">Posted</span>
                      <span className="text-[#1B3C53] font-bold">{selectedJob.postedAgo}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#456882]/60 mb-1">Urgency</span>
                      <span className="text-[#1B3C53] font-bold">{selectedJob.urgent ? 'High🔥' : 'Normal'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Applicants CTA */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <button className="w-full bg-[#FF914D] hover:bg-[#1B3C53] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg text-sm uppercase tracking-widest">
                  <Users size={18} />
                  Review {selectedJob.id * 12} Applicants
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-[#1B3C53] mb-2">No Job Selected</h3>
              <p className="text-[#456882]">Select a job from the sidebar to view details and manage applicants.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default JobManagement;