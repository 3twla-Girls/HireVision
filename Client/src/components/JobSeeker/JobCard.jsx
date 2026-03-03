import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Bookmark, Send } from 'lucide-react'

const JobCard = ({ job }) => (
    <Link
        to={`/job/${job.id}`}
        className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-lg transition-shadow group"
    >
        <div className="flex gap-4">
            {/* Company Logo Placeholder */}
            <div className="w-14 h-14 shrink-0 rounded-lg bg-light-gray1 flex items-center justify-center border border-light-gray2">
                <span className="text-2xl text-light-blue">🏢</span>
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <h3 className="font-bold text-dark-blue text-base group-hover:text-orange transition-colors leading-tight">
                        {job.title}
                    </h3>
                    <button
                        onClick={(e) => e.preventDefault()}
                        className="text-orange hover:scale-110 transition-transform ml-2 shrink-0"
                    >
                        <Bookmark size={18} fill="#FF914D" />
                    </button>
                </div>

                <p className="text-sm text-dark-gray3 mt-0.5">
                    {job.company} • {job.recruiter}
                    <span className="ml-3 font-semibold text-dark-gray4">{job.salary}</span>
                </p>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-dark-gray3">
                        <MapPin size={13} className="text-dark-blue" /> {job.city}, {job.country}
                    </span>
                    <span className="bg-dark-blue text-white px-2 py-0.5 rounded text-[11px] font-medium">
                        {job.workplace}
                    </span>
                    <span className="text-dark-gray3">{job.type}</span>
                
                    <span className="flex items-center gap-1 text-dark-gray3">
                        <Clock size={13} />
                    </span>
                
                    <span className="text-[11px] px-2 py-0.5 rounded border border-light-blue text-light-blue">
                        {job.postedAgo}
                    </span>
                </div>
            </div>
        </div>

        {/* Bottom row — skills & share */}
        <div className="flex items-end justify-between mt-3">
            <p className="text-xs text-dark-gray3 leading-relaxed">
                {job.experience} • {job.yearsOfExp} •{' '}
                {job.skills.join(', ')}
            </p>
            <button
                onClick={(e) => e.preventDefault()}
                className="text-dark-blue hover:text-orange transition-colors shrink-0 ml-2"
            >
                <Send size={16} />
            </button>
        </div>
    </Link>
)

export default JobCard
