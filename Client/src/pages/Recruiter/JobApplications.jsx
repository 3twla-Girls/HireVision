import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Eye, MessageSquare, MapPin, Pencil, Trash2, Building2, Users, Video } from 'lucide-react'

import JOBS         from '../../database/jobs'
import APPLICATIONS from '../../database/applications'
import CANDIDATES   from '../../database/candidates'
import RecruiterFilterSidebar from '../../components/Recruiter/RecruiterFilterSidebar'
import { JobHeader } from '../../components/Recruiter/JobHeader'
import { ApplicantsTable } from '../../components/Recruiter/ApplicantsTable'
import { ApplicantsCards } from '../../components/Recruiter/ApplicantsCards'
import { FilterBtn } from '../../components/Recruiter/FilterBtn'
import { Pagination } from '../../components/Recruiter/Pagination'
import { useNavigate } from 'react-router-dom'
import { getScoreColor, getStatusColor, STATUS_LABEL, STATUS_LABEL_TO_KEY, timeAgo } from '../../components/Recruiter/JobApplicationsHelpers'
import { useDeleteJob } from '../../hooks/useDeleteJob'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import InterviewResultsTab from '../../components/Recruiter/InterviewResultsTab'

// ── Component ─────────────────────────────────────────────────
const JobApplications = () => {

    const { jobId } = useParams()
    const navigate = useNavigate()
    const [filterPanelOpen, setFilterPanelOpen] = useState(false)
    const [candidate,setCandidate] = useState(null)
    const [activeTab, setActiveTab] = useState('cv')  // 'cv' | 'interview'

    const { deleteJob, isDeleting } = useDeleteJob()

    // Unified filter state — shape: { sort, status, country, city }
    // sort:    string  e.g. 'Highest Score'
    // status:  object  e.g. { Completed: true, Pending: false }
    // country: string
    // city:    string
    const [job, setJob] = useState(null)
    const [filters, setFilters] = useState({ sort: '', status: {}, country: '', city: '' })
    const [applications, setApplications] = useState([])

    // ── Compute interview date & whether interviews are done ────────
    // Interview date = job.expiry_date + job.interview_gap_days (days)
    // The tab unlocks the day AFTER the scheduled interview date
    const interviewDate = useMemo(() => {
        if (!job?.expiry_date) return null
        const base = new Date(job.expiry_date)
        const gap  = job.interview_gap_days ?? 0
        base.setDate(base.getDate() + gap)
        return base
    }, [job])

    const interviewsEnded = useMemo(() => {
        if (!interviewDate) return false
        // Unlock the tab the day after the interview date
        const dayAfter = new Date(interviewDate)
        dayAfter.setDate(dayAfter.getDate() + 1)
        return new Date() >= dayAfter
    }, [interviewDate])

    useEffect(() => {
        let isMounted = true;

        const fetchJobData = async () => {
            try {
                const response = await api.get(`/job/${jobId}`);
                if (!isMounted) return;
                
                setJob(response.data);

                if (response.status === 200) {
                    try {
                        const appsResponse = await api.get(`/application/job/${jobId}`);
                        const appsList = appsResponse.data || [];

                        const enrichedApps = await Promise.all(
                            appsList.map(async (app) => {
                                try {
                                    const candidateRes = await api.get(`/user/${app.candidate_id}`);
                                    return { ...app, candidate: candidateRes.data };
                                } catch (e) {
                                    console.error(`Failed to fetch candidate ${app.candidate_id}`, e);
                                    return { ...app, candidate: null };
                                }
                            })
                        );

                        if (isMounted) {
                            setApplications(enrichedApps);
                            console.log("app:",enrichedApps)
                        }
                    } catch (error) {
                        console.error("Error fetching applications:", error);
                    }
                }
            } catch (error) {
                console.error("Error fetching job:", error);
                if (isMounted) {
                    toast.error("Failed to load job data");
                    navigate('/job-management');
                }
            }
        };

        fetchJobData();

        return () => { isMounted = false; }; // Cleanup function
    }, [jobId, navigate]);



    // const job = useMemo(
    //     () => JOBS.find(j => j._id === jobId) ?? JOBS[0],
    //     [jobId]
    // )

    // const enriched = useMemo(() =>
    //     APPLICATIONS
    //         .filter(a => a.job_id === job?._id)
    //         .map(a => ({
    //             ...a,
    //             candidate: CANDIDATES.find(c => c._id === a.candidate_id) ?? null,
    //         })),
    //     [job]
    // )

    var displayed = useMemo(() => {
        let list = applications

        const activeStatuses = Object.keys(filters.status || {})
                                      .filter(k => filters.status[k])

        if (activeStatuses.length) {
            list = list.filter(a => activeStatuses.includes(a.status))
        }

        if (filters.city) {
            list = list.filter(a =>
                (a.candidate?.location ?? job?.location ?? '')
                    .toLowerCase()
                    .includes(filters.city.toLowerCase())
            )
        } else if (filters.country) {
            list = list.filter(a =>
                (a.candidate?.location ?? job?.location ?? '')
                    .toLowerCase()
                    .includes(filters.country.toLowerCase())
            )
        }

        var sort = filters.sort
        if (sort === 'Highest Score') list.sort((a, b) => b.matching_score - a.matching_score)
        if (sort === 'Lowest Score') list.sort((a, b) => a.matching_score - b.matching_score)
        if (sort === 'Most Recent') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        if (sort === 'Oldest First') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

        return list
    }, [applications, filters])

    // ── Pagination variables ─────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 6
    
    // Automatically reset pagination back to page 1 if the filter criteria changes
    useEffect(() => {
        setCurrentPage(1)
    }, [filters])

    const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE)
    const paginatedItems = displayed.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const lastUpdate = useMemo(() => {
        if (!applications.length) return '—'
        const latest = applications.reduce((a, b) =>
            new Date(a.created_at) > new Date(b.created_at) ? a : b
        )
        return timeAgo(latest.created_at)
    }, [applications])

    // ── Shared row renderer ───────────────────────────────
    const renderRow = (app, i) => {
        const candidate           = app.candidate.user
        console.log("candidate : ",candidate)
        const displayName = candidate?.name ?? `Candidate #${app.candidate_id.slice(-4)}`
        const displayCity = candidate?.location ?? job?.location ?? '—'
        const avatar      = candidate?.profile_image_url ?? null
        const initials    = candidate?.name ? candidate.name.slice(0, 2).toUpperCase() : '??'

        return (
            <tr key={`${app._id}-${i}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        {avatar ? (
                            <img src={avatar} alt={displayName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                        ) : null}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ display: avatar ? 'none' : 'flex' }}>{initials}</div>
                        <div>
                            <p className="font-semibold text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5"><MapPin className="w-3 h-3" /> {displayCity}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-bold ${getScoreColor(app.matching_score)}`}>
                        {Math.round(app.matching_score)}%
                    </span>
                </td>
                <td className={`px-6 py-4 text-sm ${getStatusColor(app.status)}`}>{STATUS_LABEL[app.status] ?? app.status}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{timeAgo(app.created_at)}</td>
                <td className="px-6 py-4">
                    <div className="flex gap-2">
                        <button 
                        onClick={() => navigate(`/candidate-profile/${app._id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-light-blue hover:scale-105 text-white text-xs font-semibold rounded-lg transition">
                            <Eye className="w-3.5 h-3.5" /> View 
                        </button>
                    </div>
                </td>
            </tr>
        )
    }

    // ── Shared card renderer (mobile / tablet) ────────────
    const renderCard = (app, i) => {
        const c           = app.candidate.user
        console.log("candidate: ",c)
        const displayName = c?.name ?? `Candidate #${app.candidate_id.slice(-4)}`
        const displayCity = c?.location ?? job?.location ?? '—'
        const avatar      = c?.profile_image_url ?? null
        const initials    = c?.name ? c.name.slice(0, 2).toUpperCase() : '??'

        return (
            <div key={`${app._id}-${i}`} className="p-3 space-y-2.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {avatar ? (
                            <img src={avatar} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-xs truncate">{displayName}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 shrink-0" /> {displayCity}</p>
                        </div>
                    </div>
                    <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-white text-xs font-bold ${getScoreColor(app.matching_score)}`}>
                        {Math.round(app.matching_score)}%
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className={getStatusColor(app.status)}>{STATUS_LABEL[app.status] ?? app.status}</span>
                    <span className="text-gray-400">{timeAgo(app.created_at)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => navigate(`/candidate-profile/${app._id}`)}
                        className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-light-blue text-white text-xs font-semibold rounded-lg transition">
                        <Eye className="w-2.5 h-2.5" /> View
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Unified responsive layout */}
            <div className="flex flex-col lg:flex-row gap-4 md:gap-5 lg:gap-6 p-4 md:p-6 lg:px-8 xl:px-12 w-full max-w-[1600px] mx-auto">

                {/* Sidebar — Hidden on mobile/tablet, fixed width on desktop; only for CV tab */}
                {activeTab === 'cv' && (
                    <div className="hidden lg:block shrink-0 w-[270px]">
                        <RecruiterFilterSidebar onFilterChange={setFilters} />
                    </div>
                )}

                {/* Main content — Takes up remaining space */}
                <div className="flex-1 min-w-0 w-full space-y-4 md:space-y-5">

                    {/* ── Tab Switcher ── */}
                    <div className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-xl shadow-sm w-fit">
                        <button
                            id="tab-cv-applicants"
                            onClick={() => setActiveTab('cv')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'cv'
                                    ? 'bg-dark-orange text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            CV Applicants
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                                activeTab === 'cv' ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>{applications.length}</span>
                        </button>

                        {interviewsEnded ? (
                            <button
                                id="tab-interview-results"
                                onClick={() => setActiveTab('interview')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    activeTab === 'interview'
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <Video className="w-4 h-4" />
                                Interview Results
                            </button>
                        ) : (
                            <div
                                title={interviewDate
                                    ? `Available after ${interviewDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                    : 'Not yet scheduled'
                                }
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 cursor-not-allowed select-none"
                            >
                                <Video className="w-4 h-4" />
                                Interview Results
                                {interviewDate && (
                                    <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">
                                        {interviewDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}+
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Top section: Title + Filter button — CV tab only */}
                    {activeTab === 'cv' && (
                        <div className="flex items-center justify-between gap-3 lg:hidden">
                            <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">{job?.job_title ?? 'Job'}</h2>
                            <FilterBtn full={false} onClick={() => setFilterPanelOpen(true)} />
                        </div>
                    )}

                    {/* Job Header — Mobile/Tablet only */}
                    <div className="block md:block lg:hidden">
                        <JobHeader compact={false} job={job} enriched={applications} lastUpdate={lastUpdate} />
                    </div>

                    
                    {/* Desktop Header with Manage buttons */}
                    <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-8 flex items-start gap-4">
                                <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0">
                                    <span className="text-[70px]">🏢</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{job?.job_title ?? 'Job Title'}</h1>
                                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        {job?.location ?? ''}
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full 
                                            ${job?.status === 'open' ? 'bg-green-50 text-green-700' : job?.status === 'closed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}
                                            font-semibold text-xs border border-green-100`}>
                                            {/* if job is open it will be gren if closed it will be reed if expired it will be yellow */}
                                            <span className={`w-1.5 h-1.5 rounded-full ${job?.status === 'open' ? 'bg-green-500' : job?.status === 'closed' ? 'bg-red-500' : 'bg-yellow-500'} inline-block`} />
                                            {job?.status === 'open' ? 'Active' : (job?.status ?? 'Active')}
                                        </span>
                                        <span className="text-sm text-gray-500">Total Applicants: <strong className="text-dark-orange">{applications.length}</strong></span>
                                        <span className="text-sm text-gray-500">Last Update: <strong className="text-gray-900">{lastUpdate}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4 flex flex-col items-end gap-2">
                                <span className="text-sm font-bold text-gray-900">Manage Job</span>
                                <div className="flex gap-2">
                                    <button onClick={()=> navigate(`/edit-job/${jobId}`)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white bg-dark-orange rounded-lg hover:scale-105 font-medium text-sm transition">
                                        <Pencil className="w-3.5 h-3.5" /> Edit Job
                                    </button>
                                    <button onClick={() => deleteJob(jobId)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white bg-light-blue hover:scale-105 rounded-lg font-medium text-sm transition">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete Job
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── CV Applicants tab ── */}
                    {activeTab === 'cv' && (
                        <>
                            {/* Applicants Table (desktop) / Cards (mobile) */}
                            <div className="hidden lg:block">
                                <ApplicantsTable displayed={paginatedItems} job={job} renderRow={renderRow} originalCount={displayed.length} />
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </div>
                            <div className="block lg:hidden">
                                <ApplicantsCards displayed={paginatedItems} renderCard={renderCard} originalCount={displayed.length} />
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </div>
                        </>
                    )}

                    {/* ── Interview Results tab ── */}
                    {activeTab === 'interview' && interviewsEnded && (
                        <InterviewResultsTab jobId={jobId} applications={applications} interviewDate={interviewDate} />
                    )}
                </div>
            </div>

            {/* Filter panel for mobile/tablet */}
            {filterPanelOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
                        onClick={() => setFilterPanelOpen(false)} 
                    />
                    <RecruiterFilterSidebar
                        isOpen={filterPanelOpen}
                        onClose={() => setFilterPanelOpen(false)}
                        onFilterChange={setFilters}
                    />
                </>
            )}
        </div>
    )
}

export default JobApplications
