import React from 'react'
import JobDetails from '../../components/JobSeeker/JobDetails'
import JOBS from '../../data/jobs'
import { BookmarkIcon, Clock, MapPin, SendHorizonalIcon } from 'lucide-react'
import { useState } from 'react'
import ApplyModal from '../../components/JobSeeker/ApplyModal'
import USERS from '../../data/user'

const Job = () => {

  const user = USERS[1]; // Assuming the second user is the job seeker

  const matchingScore = 80; // Example matching score, replace with actual logic
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (matchingScore / 100) * circumference;

  const [showApply, setShowApply] = useState(false);

  const job = {
    title: "Senior Front-End Developer",
    company: "Company Name",
    recruiter: "Recruiter Name",
    location: "Saudi Arabia",
    status: "Available",
    experience: "0 - 3 years",
    careerLevel: "Entry Level",
    education: "Not Specified",
    salary: "$15,000",
    type: "Full Time",
    workplace: "Remote",
    skills: ["React", "HTML", "CSS", "Node", "Python"],
    description:
      `Join our innovative team as a Senior Front-end React.js / Next.js Developer and shape the future of our cutting-edge technology solutions in Saudi Arabia!
      We are seeking a highly skilled and passionate Senior Front-end Developer to join our dynamic team. In this role, you will be responsible for developing and implementing user interface components using React.js and Next.js concepts. You will be a key player in crafting exceptional user experiences and driving the success of our projects in the Telecom/Technology sector.
      Responsibilities:
      Develop and maintain high-performance, reusable, and reliable front-end code using React.js and Next.js.
      Collaborate with cross-functional teams including designers, product managers, and backend developers to deliver exceptional user experiences.
      Implement responsive designs and ensure cross-browser compatibility.
      Optimize applications for maximum speed and scalability.
      Participate in code reviews and contribute to improving our development processes.
      Stay up-to-date with the latest industry trends and technologies.
      Skills & Technologies:
      Expertise in React.js and Next.js.
      Strong proficiency in JavaScript, HTML, and CSS.
      Experience with RESTful APIs.
      Solid understanding of UI/UX principles.
      Familiarity with Agile development methodologies.
      Growth Opportunities:
      This role offers significant opportunities for professional growth. You will have the chance to work on challenging projects, learn new technologies, and advance your career within a rapidly growing organization. We provide mentorship, training, and resources to help you reach your full potential.
      Team & Culture:
      Our team is composed of talented and passionate individuals who are dedicated to innovation and excellence. We foster a collaborative and supportive environment where everyone's ideas are valued. We believe in work-life balance and provide a Remote work environment based in Riyadh, Saudi Arabia.
      Impact:
      As a Senior Front-end Developer, you will play a critical role in shaping the user experience of our products and services. Your contributions will directly impact the success of our projects and the satisfaction of our customers. You will be part of a team that is making a difference in the Telecom/Technology industry in Saudi Arabia.`
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-[60px] py-8 grid grid-cols-12 gap-6 items-start">
        
        {/* --- Left Sidebar: Similar Jobs (3 cols) --- */}
        <aside className="col-span-3 h-fit sticky top-28 flex flex-col">
          <h2 className="text-2xl font-semibold text-dark-blue mb-6">Similar Jobs</h2>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar no-scrollbar h-[calc(100vh-200px)]">
            {JOBS.map((jobItem) => (
              <div 
                onClick={() => window.location.href = `/job/${jobItem.id}`} 
                key={jobItem.id} 
                className="flex flex-col gap-3 bg-white p-4 rounded-2xl shadow-sm relative group hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-100"
              >
                <div className='flex gap-2'>
                    <div className="w-12 h-12 bg-light-gray1 rounded-xl flex items-center justify-center text-gray-400">
                        <span className="text-xl">🏢</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-[16px] text-dark-blue">{jobItem.title}</h3>
                            <button className="text-dark-orange hover:scale-110 transition-transform">
                                <BookmarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[12px] text-dark-blue mb-2">{jobItem.company}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 text-[12px] text-dark-blue">
                    <span className="px-2 py-0.5 bg-light-gray1 rounded border border-gray-100">{jobItem.workplace}</span>
                    <span className="px-2 py-0.5 bg-light-gray1 rounded border border-gray-100">{jobItem.type}</span>
                    <span className="ml-auto text-light-blue whitespace-nowrap">
                        <Clock className="inline w-3 h-3 mr-1" />
                        {jobItem.postedAgo}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center text-[12px] text-light-blue font-medium truncate">
                        <MapPin className="w-3 h-3 inline" />
                        {jobItem.city}, {jobItem.country}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-dark-blue text-[12px]">{jobItem.salary}</span>
                        <button className="text-light-blue hover:translate-x-1 transition-transform">
                            <SendHorizonalIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- Center: Main Job Content (6 cols) --- */}
        <main className="col-span-6 space-y-6">
          <JobDetails job={job} setShowApply={setShowApply}/>
        </main>

        {/* --- Right Sidebar: Widgets (3 cols) --- */}
        <aside className="sticky top-28 col-span-3 space-y-6 h-fit">
          
          {/* Matching Score Widget */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col items-center text-center">
              <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r={radius} stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                  <circle cx="64" cy="64" r={radius} stroke="#1E293B" strokeWidth="12" fill="transparent" 
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <span className="text-3xl font-extrabold text-dark-orange">{matchingScore}%</span>
              </div>
              
              <h3 className="text-xl font-bold text-dark-blue">
                {matchingScore >= 70 ? "Good Matching" : matchingScore >= 40 ? "Average Matching" : "Low Matching"}
              </h3>
              
              <p className="text-[13px] text-light-blue mt-2">
                {matchingScore >= 70 
                  ? "You are good enough to apply" 
                  : "You might need more skills"} 
                <span className="text-light-blue ml-1">✓</span>
              </p>
            </div>

          {/* Company Info Card */}
          <div className=" bg-white p-8 rounded-[32px] shadow-sm border border-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white text-xs">LOGO</div>
              <h3 className="text-xl font-bold text-[#1E293B]">{job.company || "Company Name"}</h3>
            </div>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-8">
              Our company is composed of talented and passionate individuals who are dedicated to innovation and excellence. 
              We foster a collaborative and supportive environment where everyone's ideas are valued.
            </p>
            <a href="#" className="flex items-center justify-between text-dark-orange font-bold text-sm hover:opacity-80 transition-opacity">
              <span className="flex items-center gap-2"> Visit Website</span>
              <span>↗</span>
            </a>
          </div>

        </aside>

      </div>
      {/* edit profile modal  */}
      {showApply && <ApplyModal setShowApply={setShowApply} jobTitle={job.title} />}
    </div>
  );
}

export default Job