import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Bookmark, Send, Briefcase, GraduationCap } from 'lucide-react'

const WORKPLACE_COLORS = {
  'Remote':  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'Hybrid':  'bg-violet-50 text-violet-600 border-violet-200',
  'On site': 'bg-sky-50 text-sky-600 border-sky-200',
}

const TYPE_COLORS = {
  'full_time':  'bg-blue-50 text-blue-600 border-blue-200',
  'part_time':  'bg-amber-50 text-amber-600 border-amber-200',
  'contract':   'bg-rose-50 text-rose-600 border-rose-200',
  'Full-time':  'bg-blue-50 text-blue-600 border-blue-200',
  'Part-time':  'bg-amber-50 text-amber-600 border-amber-200',
  'Contract':   'bg-rose-50 text-rose-600 border-rose-200',
  'remote':     'bg-emerald-50 text-emerald-600 border-emerald-200',
  'hybrid':     'bg-violet-50 text-violet-600 border-violet-200',
  'on_site':    'bg-sky-50 text-sky-600 border-sky-200',
}

const TYPE_LABELS = {
  'full_time': 'Full-time',
  'part_time': 'Part-time',
  'contract':  'Contract',
  'remote':    'Remote',
  'hybrid':    'Hybrid',
  'on_site':   'On site',
}

const JobCard = ({ job }) => {
  const workplaceClass = WORKPLACE_COLORS[job.workplace] ?? 'bg-gray-50 text-gray-600 border-gray-200'
  const typeClass      = TYPE_COLORS[job.type]           ?? 'bg-gray-50 text-gray-600 border-gray-200'
  const typeLabel      = TYPE_LABELS[job.type]           ?? job.type

  return (
    <Link
      to={`/job/${job.id}`}
      state={{ job }}
      className="block rounded-3xl border border-gray-100 bg-white shadow-sm
                 hover:shadow-xl hover:-translate-y-0.5
                 transition-all duration-300 ease-out group overflow-hidden"
    >
      {/* ── Accent bar ── */}
      <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-orange to-dark-orange transition-all duration-500 ease-out" />

      <div className="px-6 pt-5 pb-5">
        {/* ── Row 1: Logo + Title + Company + Bookmark ── */}
        <div className="flex items-start gap-4">
          {/* Company logo */}
          <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-light-gray1 to-light-gray2
                          flex items-center justify-center border border-light-gray2
                          group-hover:scale-105 transition-transform duration-300 shadow-sm">
            <span className="text-2xl">🏢</span>
          </div>

          {/* Title + company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-2xl text-dark-blue text-[1.2rem] leading-snug
                             group-hover:text-dark-orange transition-colors duration-300 truncate">
                {job.title}
              </h3>
              <button
                onClick={(e) => e.preventDefault()}
                className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg
                           text-orange bg-orange/5 hover:bg-orange/15
                           transition-all duration-200 icon-hover-bounce"
              >
                <Bookmark size={16} className="fill-current" />
              </button>
            </div>
            <p className="text-[13.5px] text-dark-gray3 mt-0.5 truncate">
              {job.company}{job.recruiter ? ` · ${job.recruiter}` : ''}
            </p>
          </div>
        </div>

        {/* ── Row 2: Badges ── */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {/* Workplace badge */}
          <span className={`inline-flex items-center gap-1 text-[13px] font-semibold
                            border rounded-lg px-2.5 py-1 ${workplaceClass}`}>
            {job.workplace}
          </span>

          {/* Job type badge */}
          <span className={`inline-flex items-center gap-1 text-[13px] font-semibold
                            border rounded-lg px-2.5 py-1 ${typeClass}`}>
            {typeLabel}
          </span>

          {/* Experience level */}
          {job.experience && (
            <span className="inline-flex items-center gap-1 text-[13px] font-medium
                             bg-light-gray1 border border-light-gray2 text-dark-gray3
                             rounded-lg px-2.5 py-1">
              <GraduationCap size={12} />
              {job.experience}
            </span>
          )}

          {/* Location */}
          {(job.city || job.country) && (
            <span className="inline-flex items-center gap-1 text-[12px] text-dark-gray3 ml-auto">
              <MapPin size={12} className="text-light-blue shrink-0" />
              {[job.city, job.country].filter(Boolean).join(', ')}
            </span>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-dashed border-light-gray2 my-4" />

        {/* ── Row 3: Skills + footer meta ── */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Skill pills */}
            {job.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="text-[12px] text-dark-gray3 bg-light-gray1 border border-light-gray2
                               px-2.5 py-0.5 rounded-md
                               group-hover:border-light-blue/40 group-hover:text-dark-blue
                               transition-colors duration-300"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 5 && (
                  <span className="text-[12px] text-dark-gray3 px-2.5 py-0.5">
                    +{job.skills.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right-side meta */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-[12px] text-dark-gray3">
              <Clock size={12} />
              {job.postedAgo}
            </span>
            <button
              onClick={(e) => e.preventDefault()}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         text-light-blue bg-sky-50 hover:bg-dark-orange hover:text-white
                         transition-all duration-200 icon-hover-send shadow-sm"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default JobCard
