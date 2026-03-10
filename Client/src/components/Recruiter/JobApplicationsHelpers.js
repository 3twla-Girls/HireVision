// Helper functions for JobApplications

export const getScoreColor = (score) => {
    if (score >= 75) return 'bg-green-600'
    return 'bg-dark-orange'
}

export const getStatusColor = (status) => {
    switch (status) {
        case 'Accepted':
            return 'text-green-600 font-semibold'
        case 'Pending':
            return 'text-dark-orange font-semibold'
        case 'Rejected':
            return 'text-red-600 font-semibold'
        default:
            return 'text-gray-500'
    }
}

export const STATUS_LABEL = {
    Pending: "Pending",
    Accepted: "Accepted",
    Rejected: "Rejected"
}

export const STATUS_LABEL_TO_KEY = {
    Pending: "Pending",
    Accepted: "Accepted",
    Rejected: "Rejected"
}

export const timeAgo = (iso) => {
    const days  = Math.floor((Date.now() - new Date(iso)) / 86400000)+1
    const weeks = Math.floor(days / 7)
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (weeks === 1) return '1 week ago'

    return `${weeks} weeks ago`
}