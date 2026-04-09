import React from 'react'
import { ExternalLinkIcon, MapPinIcon, Clock, Edit, DeleteIcon, Trash, Trash2, CircleCheckIcon, BrainCircuitIcon, MessagesSquareIcon, MessageSquareCheckIcon, PenIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import CircularScore from '../../components/shared/CircularScore'
import api from '../../api/axios'
import { useDeleteJob } from '../../hooks/useDeleteJob'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

const inferWorkplace = (jobType) => {
  if (!jobType) return "On site";
  const t = jobType.toLowerCase();
  if (t.includes('remote')) return "Remote";
  if (t.includes('hybrid')) return "Hybrid";
  return "On site";
};

const inferType = (jobType) => {
  if (!jobType) return "Full-time";
  const t = jobType.toLowerCase();
  if (t.includes('part')) return "Part-time";
  if (t.includes('contract')) return "Contract";
  return "Full-time";
};const JobPreview = () => {

    const navigate = useNavigate();
    const { jobId } = useParams();
    const avgMatchingScore = 78; 

    const handleEdit = () => {
        navigate(`/edit-job/${jobId}`);
    }
    const { deleteJob, isDeleting } = useDeleteJob();

    const [job, setJob] = useState(null)
    useEffect(() => {
        const fetchJobData = async () => {
            try {
                const response = await api.get(`/job/${jobId}`);
                console.log("Job data:", response.data);
                setJob(response.data);

            } catch (error) {
                console.error("Error fetching job:", error);
                toast.error("Failed to load job data");
                navigate('/job-management');
            }
        };

        fetchJobData();
    }, [jobId, navigate]);


  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 md:px-8 lg:px-[60px] py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        <div className="md:col-span-8 lg:col-span-9 space-y-6">
            {/* ================= HEADER ================= */}
            <div className="shadow-md border-l-[12px] border-dark-blue bg-white sticky top-[100px] z-10 p-5 rounded-3xl flex flex-col lg:flex-row lg:justify-between gap-6">
                <div className="flex gap-4 flex-1">
                    <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0 flex items-center justify-center text-4xl">
                        🏢
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className="text-2xl font-bold text-dark-blue">
                            {job?.job_title}
                        </h2>
                        <p className="text-sm text-light-blue mt-2">
                            <MapPinIcon className="inline w-4 h-4 mr-1" />
                            {job?.location}
                        </p>
                    </div>
                </div>

                <div className="flex lg:flex-col items-start lg:items-end justify-between gap-3">
                    <span className="px-4 py-1 text-xs font-bold bg-green-50 text-green-600 rounded-full uppercase tracking-wider">
                        {job?.status}
                    </span>
                    {/* add edit and detelte buttons */}
                    <div className="flex gap-2">
                        <button onClick={()=>handleEdit()} className="bg-light-blue hover:bg-dark-blue text-white px-4 py-2 rounded-lg transition-colors">
                            <PenIcon  className="w-6 h-6 pr-2  inline" />
                            Edit Job
                        </button>
                        <button onClick={() => deleteJob(job?._id)} className="bg-dark-orange hover:bg-orange text-white px-4 py-2 rounded-lg transition-colors">
                            <Trash2  className="w-6 h-6 pr-2 inline" />
                            Delete Job
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= JOB DETAILS ================= */}
            <div className="bg-white rounded-3xl p-8 space-y-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-dark-orange font-bold text-lg uppercase tracking-tight">
                        Job Details
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400 flex items-center">
                            <Clock className="w-4 h-4 mr-1"/>
                            {new Date(job?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="bg-blue-50 px-3 py-1 rounded-lg text-sm text-light-blue font-bold border border-blue-100">
                            {job?.applicants_count || 0} applicants
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 ml-2">
                    <DetailItem label="Required Experience" value={job?.required_experience} />
                    <DetailItem label="Career Level" value={job?.careerLevel || "Not specified"} />
                    <DetailItem label="Required Education" value={job?.required_education} />
                    <DetailItem label="Salary" value={job?.salary || "Not specified"} />
                    <DetailItem label="Job Type" value={inferType(job?.job_type)} />
                    <DetailItem label="Workplace" value={inferWorkplace(job?.job_type)} />
                </div>

                {/* ================= SKILLS ================= */}
                <div className="bg-light-blue rounded-3xl p-6 mt-8">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
                        Skills & Tools
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {job?.required_skills.map((skill, index) => (
                            <span key={index} className="bg-white text-dark-blue text-sm px-5 py-1.5 rounded-full hover:bg-white hover:text-dark-blue transition-colors cursor-default">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= DESCRIPTION ================= */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-dark-orange font-bold text-lg mb-4">
                    Job Description
                </h3>
                <p className="text-gray-600 leading-relaxed text-md">
                    {job?.job_description}
                </p>
            </div>
        </div>

        {/* adding gap 1 col */}
        {/* <div className='lg:col-span-1'></div> */}

        {/* ================= SIDEBAR ANALYTICS (col-span-4) ================= */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6 lg:sticky lg:top-28 h-fit">
            
            {/* 1. AI Matching Overview Card */}
            <div className="bg-white rounded-3xl p-6 shadow-md border-t-8 border-dark-blue">
                <h3 className="text-dark-blue font-bold text-lg flex items-center gap-2">
                    <span className="bg-orange-100">
                        <BrainCircuitIcon size={20} className="text-dark-orange" />
                    </span>
                    AI Insights
                </h3>
                <div className="flex flex-col items-center py-4">
                    <CircularScore score={avgMatchingScore} size={120} strokeWidth={10} dur={1500} />
                    <p className="text-sm font-medium text-gray-500 mt-3">Avg. Match Score</p>
                </div>
                <div className="space-y-3 mt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Candidate Quality</span>
                        <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded-md">HIGH</span>
                    </div>
                </div>
            </div>

            {/* 2. Applicant Pipeline Stats */}
            <div className="bg-light-blue rounded-3xl p-6 shadow-md space-y-4">
                <h3 className="text-white font-bold text-lg border-b pb-3">Hiring Pipeline</h3>
                
                <StatRow label="Total Applicants" value={job?.applicants_count || "0"} color="bg-blue-400" />
                <StatRow label="Interviewed" value="0" color="bg-purple-400" />
                <StatRow label="Shortlisted (Passed)" value="0" color="bg-emerald-400" />
                <StatRow label="Rejected" value="0" color="bg-red-400" />

                <button 
                onClick={() => navigate(`/job-applications/${jobId}`)}
                className="mx-auto w-fit mt-4 bg-white text-light-blue p-3 rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg">
                    Manage Applicants
                    <ExternalLinkIcon size={16} />
                </button>
                <div className="absolute -right-4 -bottom-4 text-white/10 rotate-12">
                    {/* <CircleCheckIcon size={100} /> */}
                    <MessageSquareCheckIcon size={100} />
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

const DetailItem = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-medium text-light-blue uppercase mb-1">{label}</span>
        <span className="text-dark-blue font-semibold">{value}</span>
    </div>
)

const StatRow = ({ label, value, color }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color}`}></div>
            <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className="text-sm font-bold text-white">{value}</span>
    </div>
)

export default JobPreview;