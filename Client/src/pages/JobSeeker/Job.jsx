import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import JobDetails from '../../components/JobSeeker/JobDetails'
import { SearchX, Loader2 } from 'lucide-react'
import ApplyModal from '../../components/JobSeeker/ApplyModal'
import SimilarJobCard from '../../components/JobSeeker/SimilarJobCard'
import CircularScore from '../../components/shared/CircularScore'

const CURRENT_USER_ID = '69aa315763b720c25373f035'

// Maps raw API job doc → the shape JobDetails / SimilarJobCard expect
const mapJobFromApi = (j) => {
  const parts = (j.location ?? '').split(',').map((s) => s.trim())
  const city    = parts[0] ?? ''
  const country = parts.slice(1).join(', ') || parts[0] || ''
  const diff    = j.created_at ? Math.floor((Date.now() - new Date(j.created_at)) / 86_400_000) : null
  const postedAgo = diff === null ? 'Recently' : diff === 0 ? 'Today' : diff === 1 ? '1 day ago' : `${diff} days ago`
  const backendType = j.job_type ?? j.type ?? 'full_time'
  let workplace = 'On site', typeProp = 'full_time'
  if (['remote', 'hybrid', 'on_site'].includes(backendType)) {
    workplace = backendType === 'remote' ? 'Remote' : backendType === 'hybrid' ? 'Hybrid' : 'On site'
  } else {
    typeProp = backendType
  }
  return {
    id:         j._id ?? j.id,
    title:      j.job_title,
    company:    j.company    ?? 'Company',
    recruiter:  j.recruiter  ?? '',
    city, country, workplace,
    type:       typeProp,
    postedAgo,
    experience: j.required_experience ?? 'Mid-level',
    yearsOfExp: j.years_of_exp        ?? '',
    skills:     j.required_skills     ?? [],
    description:j.job_description || j.description || 'No description provided.',
    salary:     j.salary    || 'Not specified',
    education:  j.education || 'Not specified',
    status:     j.status    || 'Active',
    cluster_id: j.cluster_id ?? null,
  }
}

const Job = () => {
  const location = useLocation();
  const { jobId } = useParams();

  // Use state if navigated with it (e.g. from Home/JobCard), else fetch from API
  const [job, setJob]           = useState(location.state?.job || null);
  const [loadingJob, setLoadingJob] = useState(!location.state?.job);
  const [jobError, setJobError]  = useState(null);

  useEffect(() => {
    // If state was already provided, no need to fetch
    if (location.state?.job) {
      setJob(location.state.job);
      setLoadingJob(false);
      return;
    }
    if (!jobId) return;
    const fetchJob = async () => {
      try {
        setLoadingJob(true);
        const res = await fetch(`/api/v1/job/${jobId}`);
        if (!res.ok) throw new Error(`Job not found (${res.status})`);
        const data = await res.json();
        setJob(mapJobFromApi(data));
      } catch (err) {
        console.error('Failed to fetch job:', err);
        setJobError('Could not load this job. Please try again.');
      } finally {
        setLoadingJob(false);
      }
    };
    fetchJob();
  }, [jobId]);

  // Scroll to top when the job ID changes (i.e. clicked a Similar Job)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [jobId]);

  const matchingScore = 80;

  const [showApply, setShowApply] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // ── Application status for this specific job ──────────────────────────────
  const [applicationStatus, setApplicationStatus] = useState(null); // null | 'pending' | 'accepted' | 'rejected'

  useEffect(() => {
    const checkApplicationStatus = async () => {
      const currentJobId = jobId || job?.id;
      if (!currentJobId) return;
      try {
        const res = await fetch(`/api/v1/application/candidate/${CURRENT_USER_ID}`);
        if (!res.ok) return;
        const apps = await res.json();
        const match = Array.isArray(apps)
          ? apps.find(a => String(a.job_id) === String(currentJobId))
          : null;
        setApplicationStatus(match ? match.status : null);
      } catch (err) {
        console.warn('Could not check application status:', err);
      }
    };
    checkApplicationStatus();
  }, [jobId, job?.id]);

  useEffect(() => {
    setSimilarJobs([]);

    if (job?.cluster_id === undefined || job?.cluster_id === null) {
      return;
    }

    const fetchSimilarJobs = async () => {
      setLoadingSimilar(true);
      try {
        const res = await fetch(`/api/v1/job/cluster/${job.cluster_id}`);
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter(j => String(j._id ?? j.id) !== String(job.id));

          const mappedJobs = filtered.map(j => {
            const parts = (j.location ?? '').split(',').map((s) => s.trim());
            const city = parts[0] ?? '';
            const country = parts.slice(1).join(', ') || parts[0] || '';
            const posted = j.created_at
              ? (() => {
                  const diff = Math.floor((Date.now() - new Date(j.created_at)) / 86_400_000);
                  if (diff === 0) return 'Today';
                  if (diff === 1) return '1 day ago';
                  return `${diff} days ago`;
                })()
              : 'Recently';

            const backendType = j.job_type ?? j.type ?? 'full_time';
            let workplace = 'On site';
            let typeProp = 'full_time';

            if (['remote', 'hybrid', 'on_site'].includes(backendType)) {
              workplace = backendType === 'remote' ? 'Remote' : backendType === 'hybrid' ? 'Hybrid' : 'On site';
            } else {
              workplace = 'On site';
              typeProp = backendType;
            }

            return {
              id: j._id ?? j.id,
              title: j.job_title,
              company: j.company ?? 'Company',
              recruiter: j.recruiter ?? '',
              city,
              country,
              workplace,
              type: typeProp,
              postedAgo: posted,
              experience: j.required_experience ?? 'Mid-level',
              yearsOfExp: j.years_of_exp ?? '',
              skills: j.required_skills ?? [],
              description: j.job_description || j.description || 'No description provided.',
              salary: j.salary || 'Not specified',
              education: j.education || 'Not specified',
              status: j.status || 'Active',
              cluster_id: j.cluster_id ?? null,
            };
          });

          setSimilarJobs(mappedJobs);
        }
      } catch (error) {
        console.error("Failed to fetch similar jobs", error);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchSimilarJobs();
  }, [job]);

  if (loadingJob) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-dark-blue" />
    </div>
  );

  if (jobError) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="text-lg font-semibold text-dark-blue mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500">{jobError}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 items-start">

        {/* --- Center: Main Job Content --- */}
        <main className="order-1 lg:order-2 lg:col-span-6 md:col-span-4 space-y-4 w-full">
          <JobDetails job={job} setShowApply={setShowApply} applicationStatus={applicationStatus} />
        </main>

        {/* --- Right Sidebar: Widgets --- */}
        <aside className="order-2 lg:order-3 lg:col-span-3 md:col-span-2 space-y-4 h-fit lg:sticky lg:top-28 w-full">

          {/* Matching Score Widget */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md flex flex-col items-center text-center border border-gray-50 transition-transform hover:scale-[1.02]">
            <CircularScore score={matchingScore} />
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
              <h3 className="text-lg font-bold text-dark-blue truncate">{job?.company}</h3>
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

        {/* --- Left Sidebar: Similar Jobs --- */}
        <aside className="order-3 lg:order-1 lg:col-span-3 md:col-span-6 h-fit lg:sticky lg:top-28 flex flex-col w-full">
          <h2 className="text-xl md:text-2xl font-semibold text-dark-blue mb-6">Similar Jobs</h2>
          {loadingSimilar ? (
            <p className="text-sm text-gray-400 px-2">Loading similar jobs...</p>
          ) : similarJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 content-start overflow-y-auto px-2 custom-scrollbar no-scrollbar lg:h-[calc(100vh-200px)]">
              {similarJobs.map((jobItem) => (
                <SimilarJobCard key={jobItem.id} job={jobItem} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center mt-2">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <SearchX className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-[15px] font-bold text-dark-blue mb-1">No similar jobs</h3>
              <p className="text-[13px] text-light-blue leading-relaxed">
                We couldn't find any other roles matching this profile right now.
              </p>
            </div>
          )}
        </aside>

      </div>

      {/* Apply Modal */}
      {showApply && (
        <ApplyModal setShowApply={setShowApply} jobTitle={job.title} />
      )}
    </div>
  );
}

export default Job;