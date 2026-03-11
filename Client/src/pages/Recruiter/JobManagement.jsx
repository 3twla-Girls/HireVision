import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, MapPin, Edit, Users, Eye, CheckCircle, XCircle,
  Search, Clock, DollarSign, Layers, ArrowLeft, Plus,
  Building2, TrendingUp
} from 'lucide-react';
import { JOBS } from '../../data/jobs';

/* ─── helpers ──────────────────────────────────────────────── */
const mockJobs = JOBS.map((job, i) => ({
  ...job,
  
  status: i % 2 === 0 ? 'Open' : 'Closed',
  applicants: (job.id * 12) + i * 3,
  views: job.id * 47 + 100,
}));
// const mockJobs =[];

const StatusBadge = ({ status, small = false }) => {
  const isOpen = status === 'Open';
  return (
    <span className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-full border
      ${small ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'}
      ${isOpen
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-red-50   text-red-600   border-red-100'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {status}
    </span>
  );
};

/* ─── Job List Item ─────────────────────────────────────────── */
const JobListItem = ({ job, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200
      ${isSelected
        ? 'bg-[#1B3C53] text-white border-[#1B3C53] shadow-lg shadow-[#1B3C53]/20 scale-[1.01]'
        : 'bg-white text-[#1B3C53] border-gray-100 hover:border-[#1B3C53]/20 hover:shadow-md'}`}
  >
    <div className="flex items-start justify-between gap-2 mb-2.5">
      <h3 className="font-bold text-base leading-snug line-clamp-2 flex-1">{job.title}</h3>
      <StatusBadge status={job.status} small />
    </div>

    <p className={`text-sm mb-4 flex items-center gap-1.5 ${isSelected ? 'text-white/70' : 'text-[#456882]'}`}>
      <MapPin size={13} />
      {job.workplace} · {job.type}
    </p>

    <div className="flex items-center justify-between">
      <span className={`text-xs font-semibold flex items-center gap-1.5 ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>
        <Clock size={12} /> {job.postedAgo}
      </span>
      <span className={`text-sm font-bold flex items-center gap-1.5 text-[#FF914D]`}>
        <Users size={14} /> {job.applicants} candidates
      </span>
    </div>
  </button>
);

/* ─── Detail Panel ──────────────────────────────────────────── */
const JobDetailPanel = ({ job, onToggleStatus, onBack }) => {
  const navigate = useNavigate();
  const isOpen = job.status === 'Open';

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Colored left accent */}
      <div className="absolute left-0 top-0 w-4 h-full bg-gradient-to-b from-[#1B3C53] via-[#456882] to-[#FF914D] rounded-l-[2rem]" />

      <div className="p-8 md:p-10 overflow-y-auto no-scrollbar">
        {/* Back button — mobile only */}
        <button onClick={onBack} className="lg:hidden flex items-center gap-2 text-[#456882] text-sm font-bold mb-5 hover:text-[#1B3C53] transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </button>

        {/* Job Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-8 pb-8 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h2 className="text-3xl font-black text-[#1B3C53] leading-tight">{job.title}</h2>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#456882] text-sm font-medium">
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-[#FF914D]" />
                {job.city}, {job.country}
              </span>
              <span className="flex items-center gap-2">
                <Building2 size={16} className="text-[#FF914D]" />
                {job.workplace}
              </span>
              <span className="flex items-center gap-2">
                <Briefcase size={16} className="text-[#FF914D]" />
                {job.experience}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => navigate(`/job-preview/69aae77ddef3bd659ee84eac`)}
              className="flex items-center gap-2 bg-gray-50 text-[#1B3C53] hover:bg-[#1B3C53] hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-gray-200 hover:border-[#1B3C53]">
              <Eye size={16} /> Preview
            </button>
            <button className="flex items-center gap-2 bg-gray-50 text-[#1B3C53] hover:bg-[#1B3C53] hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-gray-200 hover:border-[#1B3C53]">
              <Edit size={16} /> Edit
            </button>
            <button
              onClick={() => onToggleStatus(job.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border
                ${isOpen
                  ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'}`}>
              {isOpen ? <XCircle size={16} /> : <CheckCircle size={16} />}
              {isOpen ? 'Close Job' : 'Reopen'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: DollarSign, label: 'Salary', value: job.salary,    color: 'bg-emerald-500' },
            { icon: Layers,     label: 'Type',   value: job.type,      color: 'bg-[#456882]'   },
            { icon: Clock,      label: 'Posted', value: job.postedAgo, color: 'bg-[#1B3C53]'   },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[#F8FAFC] rounded-2xl p-5 border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#456882]/60 mb-1.5">{label}</p>
              <p className="text-base font-bold text-[#1B3C53]">{value}</p>
            </div>
          ))}
        </div>

        {/* Required Skills */}
        <div className="mb-8">
          <h4 className="text-sm font-black text-[#456882] uppercase tracking-[0.1em] mb-4">Required Skills</h4>
          <div className="flex flex-wrap gap-2.5">
            {job.skills.map(skill => (
              <span key={skill} className="bg-[#1B3C53]/5 text-[#1B3C53] border border-[#1B3C53]/10 px-3 py-1 rounded-xl text-sm font-bold hover:bg-[#1B3C53] hover:text-white transition-colors cursor-default">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-gray-200">
          <button
             onClick={() => navigate(`/job-preview/69aae77ddef3bd659ee84eac`)}
            className="w-full bg-[#FF914D] hover:bg-[#1B3C53] text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg text-base uppercase tracking-widest group">
            <Users size={16} className="group-hover:scale-110 transition-transform" />
            Review {job.applicants} Applicants
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const JobManagement = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(mockJobs);
  const [selectedJobId, setSelectedJobId] = useState(mockJobs[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [mobileView, setMobileView] = useState('list');

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'All' || job.status === filterStatus;
    return matchSearch && matchFilter;
  }), [jobs, search, filterStatus]);

  const stats = useMemo(() => ({
    open: jobs.filter(j => j.status === 'Open').length,
    closed: jobs.filter(j => j.status === 'Closed').length,
  }), [jobs]);

  const toggleStatus = (id) => {
    setJobs(prev => prev.map(j =>
      j.id === id ? { ...j, status: j.status === 'Open' ? 'Closed' : 'Open' } : j
    ));
  };

  const handleSelectJob = (id) => {
    setSelectedJobId(id);
    setMobileView('detail');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-[60px] py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-2">
          <span className="w-10 h-10 bg-[#FF914D] rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Briefcase size={20} className="text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-[#1B3C53] tracking-tight leading-tight">Job Management</h1>
            <p className="text-[#456882] text-sm font-medium">
              {jobs.length === 0 ? 'No jobs posted yet' : `${stats.open} open · ${stats.closed} closed`}
            </p>
          </div>
        </div>

        {/* ── Empty State ── */}
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center mb-6">
              <Briefcase size={40} className="text-gray-200" />
            </div>
            <h2 className="text-xl font-black text-[#1B3C53] mb-2">No Jobs Posted Yet</h2>
            <p className="text-[#456882] text-sm font-medium max-w-xs mb-8">
              You haven't posted any job openings. Create your first vacancy to start receiving applicants.
            </p>
            <button
              onClick={() => navigate('/post-job')}
              className="flex items-center gap-2 bg-[#FF914D] hover:bg-[#e07d3c] text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <Plus size={16} /> Post Your First Job
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 lg:gap-6">

            {/* Sidebar — hidden on mobile when viewing detail */}
            <div className={`col-span-12 lg:col-span-4 flex flex-col gap-3
              ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}`}>

              {/* Search & Filter */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm space-y-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 text-sm font-medium text-[#1B3C53] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 transition"
                  />
                </div>
                <div className="flex gap-2">
                  {['All', 'Open', 'Closed'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-colors
                        ${filterStatus === s
                          ? 'bg-[#1B3C53] text-white'
                          : 'bg-[#F8FAFC] text-[#456882] hover:bg-gray-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job List */}
              <div className="relative space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto px-2 pb-3 no-scrollbar">
                {filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-[#456882] font-medium">No jobs match your search.</p>
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <div key={job.id} className="relative">
                      <JobListItem
                        job={job}
                        isSelected={selectedJobId === job.id}
                        onClick={() => handleSelectJob(job.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail Panel — hidden on mobile when viewing list */}
            <div className={`col-span-12 lg:col-span-8 min-h-[500px] lg:min-h-0
              ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
              {selectedJob ? (
                <JobDetailPanel
                  job={selectedJob}
                  onToggleStatus={toggleStatus}
                  onBack={() => setMobileView('list')}
                />
              ) : (
                <div className="bg-white h-full min-h-[400px] rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center p-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                    <Briefcase size={28} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1B3C53] mb-1">No Job Selected</h3>
                  <p className="text-[#456882] text-sm max-w-xs">Select a job from the list to view its details and manage applicants.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default JobManagement;