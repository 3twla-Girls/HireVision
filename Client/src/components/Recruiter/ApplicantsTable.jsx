import { ChevronDown, Eye, MessageSquare, MapPin } from 'lucide-react'
import { getScoreColor, getStatusColor, STATUS_LABEL, timeAgo } from './JobApplicationsHelpers'

export const ApplicantsTable = ({ displayed, job, renderRow, originalCount }) => {
    const totalCount = originalCount ?? displayed.length

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-sm">Applicants ({totalCount})</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-500 text-sm font-semibold">
                            <th className="px-6 py-3 text-left">Name</th>
                            <th className="px-6 py-3 text-left">CV Match Score</th>
                            <th className="px-6 py-3 text-left">Application Status</th>
                            <th className="px-6 py-3 text-left">Applied Date</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {totalCount === 0 || displayed.length === 0
                            ? <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400">No applicants found.</td></tr>
                            : displayed.map((app, i) => renderRow(app, i))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}
