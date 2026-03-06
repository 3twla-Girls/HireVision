import React from 'react'
import { MapPin, FileText, Download, Eye } from 'lucide-react'

const statusConfig = {
    passed: {
        label: 'Passed',
        bg: 'bg-dark-blue',
        text: 'text-white',
        border: '',
    },
    'under review': {
        label: 'Under Review',
        bg: 'bg-white',
        text: 'text-dark-blue',
        border: 'border border-dark-blue',
    },
    saved: {
        label: 'Saved',
        bg: 'bg-light-teal',
        text: 'text-teal',
        border: 'border border-teal/30',
    },
    rejected: {
        label: 'Rejected',
        bg: 'bg-red-50',
        text: 'text-red-500',
        border: 'border border-red-200',
    },
    feedback: {
        label: 'Feedback',
        bg: 'bg-orange/10',
        text: 'text-dark-orange',
        border: 'border border-orange/30',
    },
}

const ApplicationCard = ({ application }) => {
    const config = statusConfig[application.status] || statusConfig['under review']

    return (
        <div
            className="bg-white rounded-2xl shadow-md px-6 py-5 border-l-[12px] border-dark-blue
                        hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out
                        group"
        >
            <div className="flex items-center gap-4">
                {/* Company Logo Placeholder */}
                <div
                    className="w-14 h-14 shrink-0  rounded-xl bg-light-gray1 flex items-center justify-center
                                border border-light-gray2 group-hover:shadow-md group-hover:scale-105
                                transition-all duration-300"
                >
                    <span className="text-2xl">🏢</span>
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-dark-blue text-lg leading-snug group-hover:text-dark-orange transition-colors duration-300">
                        {application.jobTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[14px] text-dark-gray3">
                        <MapPin size={14} className="text-light-blue shrink-0" />
                        <span>
                            {application.city}, {application.country}
                        </span>
                        <span className="mx-1">•</span>
                        <span>{application.company}</span>
                    </div>
                </div>

                {/* Status + Date (right side) */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                        className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold
                                    ${config.bg} ${config.text} ${config.border}`}
                    >
                        {config.label}
                    </span>
                    <span className="text-[13px] text-dark-gray3">
                        Applied on {application.appliedDate}
                    </span>
                </div>
            </div>

            {/* Feedback PDF (only for feedback tab) */}
            {application.feedbackFile && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <FileText size={18} className="text-dark-orange shrink-0" />
                    <span className="text-[14px] font-medium text-dark-blue">
                        {application.feedbackFileName || 'Feedback.pdf'}
                    </span>

                    {/* Open button */}
                    <a
                        href={application.feedbackFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold
                                   text-dark-blue bg-light-gray1 border border-light-gray2
                                   hover:border-dark-blue/30 hover:shadow-sm transition-all duration-200"
                    >
                        <Eye size={14} />
                        Open
                    </a>

                    {/* Download button */}
                    <a
                        href={application.feedbackFile}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold
                                   text-white bg-dark-blue
                                   hover:bg-dark-blue/90 hover:shadow-sm transition-all duration-200"
                    >
                        <Download size={14} />
                        Download
                    </a>
                </div>
            )}
        </div>
    )
}

export default ApplicationCard
