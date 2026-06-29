import { BookmarkIcon, ClockIcon, MapPinIcon, SendHorizonalIcon } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const SimilarJobCard = ({ job }) => {
  return (
    <Link 
        to={`/job/${job.id}`} 
        state={{ job }}
        key={job.id} 
        className="flex flex-col gap-3 bg-white p-4 rounded-3xl shadow-md border border-transparent hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer group"
    >
        <div className='flex gap-2'>
        <div className="w-10 h-10 md:w-12 md:h-12 bg-light-gray1 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
            <span className="text-lg md:text-xl">🏢</span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
            <h3 className="font-bold text-[14px] md:text-[16px] text-dark-blue truncate">{job.title}</h3>
            <button className="text-dark-orange hover:scale-110 transition-transform">
                <BookmarkIcon className={`w-4 h-4 md:w-5 md:h-5`} />
            </button>
            </div>
            <p className="text-[11px] md:text-[12px] text-dark-blue truncate">{job.company}</p>
        </div>
        </div>

        <div className="flex flex-wrap gap-1 text-[11px] md:text-[12px] text-dark-blue">
        <span className="px-2 py-0.5 bg-light-gray1 rounded-lg border border-gray-100">{job.workplace}</span>
        <span className="px-2 py-0.5 bg-light-gray1 rounded-lg border border-gray-100">{job.type}</span>
        <span className="ml-auto text-light-blue flex items-center gap-1">
            <ClockIcon className="w-3 h-3" /> {job.postedAgo}
        </span>
        </div>

        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
        <div className="flex items-center text-[11px] md:text-[12px] text-light-blue truncate max-w-[60%]">
            <MapPinIcon className="w-3 h-3 mr-1" /> {job.city}
        </div>
        <div className="flex items-center gap-2">
            <button className="text-light-blue group-hover:translate-x-1 transition-transform">
            <SendHorizonalIcon className="w-4 h-4" />
            </button>
        </div>
        </div>
    </Link>
    );
}

export default SimilarJobCard