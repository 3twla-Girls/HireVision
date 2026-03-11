import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Bookmark, Send } from 'lucide-react'

const JobCard = ({ job }) => (
    <Link
        to={`/job/${job.id}`}
        className="block rounded-3xl border border-gray-100 bg-white px-6 py-5 shadow-md
                   border-l-4 border-l-transparent
                   hover:border-l-orange hover:shadow-xl hover:-translate-y-1
                   transition-all duration-300 ease-out group"
    >
        {/* ── Row 1: Logo + Title + Company + Salary ── */}
        <div className="flex items-start gap-4">
            {/* Company Logo */}
            <div className="w-14 h-14 shrink-0 rounded-xl bg-light-gray1 flex items-center justify-center border border-light-gray2
                            group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                <span className="text-2xl">🏢</span>
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <h3 className="font-bold text-dark-blue text-xl group-hover:text-dark-orange transition-colors duration-300 leading-snug">
                        {job.title}
                    </h3>
                    <button
                        onClick={(e) => e.preventDefault()}
                        className="text-dark-orange icon-hover-bounce ml-3 shrink-0 mt-0.5"
                    >
                        <Bookmark size={18} className="fill-current" />
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-1">
                    <p className="text-[15px] text-dark-gray3">
                        {job.company} · {job.recruiter}
                    </p>

                </div>
            </div>
        </div>

        {/* ── Row 2: Location + Workplace + Type ── */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-[14px]">
            <span className="flex items-center gap-1.5 text-dark-gray3">
                <MapPin size={15} className="text-light-blue" />
                {job.city}, {job.country}
            </span>

            <span className="bg-light-blue text-white px-3 py-1 rounded-md text-[13px] font-semibold uppercase tracking-wide">
                {job.workplace}
            </span>

            <span className="text-dark-gray3">{job.type}</span>

            <span className="flex items-center gap-1.5 text-dark-gray3 ml-auto">
                <Clock size={14} className="text-dark-gray3" />
                {job.postedAgo}
            </span>
        </div>

        {/* ── Divider ── */}
        <hr className="border-light-gray2 my-4" />

        {/* ── Row 3: Experience + Skills + Send ── */}
        <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-[14px] text-dark-gray3 mb-2.5">
                    {job.experience} · {job.yearsOfExp}
                </p>

                {/* Skill pills */}
                <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                        <span
                            key={skill}
                            className="text-[13px] text-dark-gray3 bg-light-gray1 border border-light-gray2 
                                       px-3 py-1 rounded-lg
                                       group-hover:border-[#5BBFBA]/40 group-hover:text-dark-blue
                                       transition-colors duration-300"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <button
                onClick={(e) => e.preventDefault()}
                className="text-light-blue hover:text-dark-orange icon-hover-send shrink-0 ml-2 mb-1"
            >
                <Send size={20} />
            </button>
        </div>
    </Link>
)

export default JobCard
