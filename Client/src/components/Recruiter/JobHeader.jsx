import { Building2, Pencil, Trash2 } from 'lucide-react'

export const JobHeader = ({ compact = false, job, enriched, lastUpdate }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className={compact ? 'flex gap-3' : 'flex gap-4'}>
            <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0">
                <span className="text-[70px]">🏢</span>
            </div>
            <div className="flex-1 min-w-0">
                <h1 className={`${compact ? 'text-base' : 'text-xl'} font-bold text-gray-900 truncate`}>{job?.job_title ?? 'Job Title'}</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">Recruitment Company · {job?.location ?? ''}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold text-xs border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        {job?.status === 'open' ? 'Active' : (job?.status ?? 'Active')}
                    </span>
                    <span className="text-xs text-gray-500">Applicants: <strong className="text-dark-orange">{enriched.length}</strong></span>
                    <span className="text-xs text-gray-500">Updated: <strong className="text-gray-900">{lastUpdate}</strong></span>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
            <button className="inline-flex items-center justify-center gap-1.5 py-2 text-white bg-dark-orange rounded-lg hover:scale-105 font-medium text-sm transition">
                <Pencil className="w-3.5 h-3.5" /> Edit Job
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 py-2 text-white bg-light-blue hover:scale-105 rounded-lg  font-medium text-sm transition">
                <Trash2 className="w-3.5 h-3.5" /> Delete Job
            </button>
        </div>
    </div>
)
