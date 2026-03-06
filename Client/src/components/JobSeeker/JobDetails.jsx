import { Bookmark, CircleAlertIcon, CircleCheckIcon, Clock, ExternalLinkIcon, MapPinIcon } from "lucide-react";
import USERS from "../../data/user";

const JobDetails = ({ job, setShowApply }) => {
    if (!job) return null;
    const user = USERS[1];
    const userSkills = ["React", "HTML", "CSS", "Node"];
    const isApplied = user.applications?.some(app => app.jobId === job.id);
    const isSaved = user.savedJobs?.includes(job.id);

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div className="shadow-md border-l-[12px] border-dark-blue bg-white sticky top-[100px] z-10 p-5 rounded-3xl flex flex-col lg:flex-row lg:justify-between gap-6">
        {/* LEFT SIDE */}
        <div className="flex gap-4 flex-1">
            <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0">
                <span className="text-[70px]">🏢</span>
            </div>
            <div className="flex flex-col justify-between">
            <h2 className="text-2xl font-semibold text-dark-blue break-words">
                {job.title}
            </h2>
            <p className="text-sm text-dark-blue mt-1 break-words">
                <ExternalLinkIcon className="inline w-4 h-4 mr-1 text-dark-blue" />
                {job.company} • {job.recruiter}
            </p>
            <p className="text-sm text-light-blue mt-auto break-words">
                <MapPinIcon className="inline w-4 h-4 mr-1" />
                {job.location}
            </p>
            </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
            {/* STATUS */}
            <span className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded-xl whitespace-nowrap">
            {job.status}
            </span>

            {/* ACTIONS */}
            <div className="flex sm:flex-row gap-2 w-full sm:w-auto">
                <button>
                    <Bookmark className={`w-8 h-8 text-dark-blue hover:scale-110 hover:text-light-blue transition-transform ${isSaved ? 'fill-current' : ''}`}/>
                </button>
                <button
                onClick={() => !isApplied && setShowApply(true)}
                disabled={isApplied}
                className={`
                    relative group overflow-hidden
                    px-4 py-3 rounded-2xl font-bold text-lg
                    transition-all duration-300 ease-out
                    ${isApplied 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                    : "bg-dark-orange text-white shadow-[0_4px_0_rgb(194,65,12)] active:shadow-none active:translate-y-[4px] hover:bg-[#ff7b4d]"}
                `}
                >
                    {!isApplied && (
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform"></span>
                    )}
                    
                    <span className="relative flex items-center justify-center gap-2">
                        {isApplied ? "Application Sent ✓" : "Apply Now"}
                    </span>
                </button>
            </div>
        </div>
        </div>

      {/* ================= JOB DETAILS ================= */}
      <div className="bg-white rounded-3xl p-6 space-y-5 shadow-md">
        <div className="flex items-center">
            <h3 className="text-dark-orange font-semibold text-xl">
            Job Details
            </h3>
            {/* posted days & number of applied */}
            <div className="text-sm text-light-blue font-medium ml-auto">
                <Clock className="inline w-4 h-4 mr-1"/>
                3 days ago
            </div>
            <div className="border-2 border-light-blue rounded-lg p-1 text-sm text-light-blue font-medium ml-4">
                120 applicants
            </div>

        </div>

        <div className="grid grid-cols-2 gap-y-3 text-md ml-3">
            <span className="font-medium text-dark-blue">
                Required Experience:
            </span>
            <span className="text-light-blue">
                {job.experience}
            </span>

            <span className="font-medium text-dark-blue">
                Career Level:
            </span>
            <span className="text-light-blue">
                {job.careerLevel}
            </span>

            <span className="font-medium text-dark-blue">
                Required Education:
            </span>
            <span className="text-light-blue">
                {job.education}
            </span>

            <span className="font-medium text-dark-blue">
                Salary:
            </span>
            <span className="text-light-blue">
                {job.salary}
            </span>

            <span className="font-medium text-dark-blue">
                Job Type:
            </span>
            <span className="text-light-blue">
                {job.type}
            </span>

            <span className="font-medium text-dark-blue">
                Workplace:
            </span>
            <span className="text-light-blue">
                {job.workplace}
            </span>
        </div>
        {/* ================= SKILLS ================= */}
        <div className="bg-light-blue rounded-3xl text-xl p-5">
            <h3 className="text-white font-semibold mb-4">
            Skills & Tools:
            </h3>

            <div className="flex flex-wrap gap-3">
            {job.skills.map((skill, index) => (
                <span
                key={index}
                className="bg-white text-slate-700 text-sm px-4 py-1 rounded-full shadow-sm"
                >
                {userSkills.includes(skill) ? (
                    <CircleCheckIcon className="w-4 h-4 text-green-500 inline mr-1" />
                ) : (
                    <CircleAlertIcon className="w-4 h-4 text-red-500 inline mr-1" />
                )}{skill}
                </span>
            ))}
            </div>
        </div>
      </div>


      {/* ================= DESCRIPTION ================= */}
      <div className="bg-white rounded-3xl p-6 space-y-3 shadow-md">
        <h3 className="text-dark-orange font-semibold text-xl mb-2">
          Job Description
        </h3>

        <p className="text-sm text-gray-600 leading-relaxed">
          {job.description}
        </p>
      </div>

    </div>
  );
};

export default JobDetails;