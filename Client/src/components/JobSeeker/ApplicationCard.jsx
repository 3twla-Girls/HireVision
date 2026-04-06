import React, { useState } from 'react'
import { MapPin, FileText, Download, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FeedbackModal from './FeedbackModal'

const statusConfig = {
    passed: {
        label: 'Passed',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border border-emerald-200',
    },
    'under review': {
        label: 'Under Review',
        bg: 'bg-orange/10',
        text: 'text-dark-orange',
        border: 'border border-orange/30',
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

const tabBorderColor = {
    submitted: 'border-l-dark-blue',
    saved: 'border-l-teal',
    rejected: 'border-l-red-400',
    feedbacks: 'border-l-orange',
}

const ApplicationCard = ({ application, navigable = false }) => {
    const config = statusConfig[application.status] || statusConfig['under review']
    const [showFeedback, setShowFeedback] = useState(false)
    const navigate = useNavigate()

    const handleCardClick = () => {
        if (navigable && application.jobId) {
            navigate(`/job/${application.jobId}`)
        }
    }

    return (
        <>
            <div
                onClick={handleCardClick}
                className={`bg-white rounded-2xl shadow-md px-6 py-5 border-l-[8px] ${tabBorderColor[application.tab] || 'border-l-dark-blue'
                    } hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out group
                    ${navigable ? 'cursor-pointer' : ''}`}
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

                {/* Feedback Section (only for feedback tab) */}
                {application.feedbackFile && (
                    <div
                        className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-dark-orange shrink-0" />
                            <span className="text-[14px] font-medium text-dark-blue">
                                {application.feedbackFileName || 'Application/Session Feedback'}
                            </span>
                        </div>

                        {/* Navigate to candidate report button */}
                        <button
                            onClick={() => navigate(`/candidate-report/${application.sessionId || application.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold
                                       text-white bg-dark-blue
                                       hover:bg-dark-blue/90 hover:shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <Eye size={14} />
                            View Candidate Report
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default ApplicationCard

