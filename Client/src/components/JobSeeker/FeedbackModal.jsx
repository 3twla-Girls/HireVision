import React from 'react'
import { X, Download } from 'lucide-react'

/**
 * Returns a viewable src for the iframe:
 * - Cloudinary / external http URLs: wrap with Google Docs Viewer so the PDF
 *   renders inline even though Cloudinary serves raw files as attachments.
 * - Local / blob URLs: use directly.
 */
const getViewerSrc = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  }
  return url
}

const FeedbackModal = ({ isOpen, onClose, feedbackFile, jobTitle, modalTitle = "Feedback for:", downloadName }) => {
    if (!isOpen) return null

    const handleDownload = async () => {
        try {
            const response = await fetch(feedbackFile)
            const blob = await response.blob()

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = downloadName || `${jobTitle}-feedback.pdf`
            document.body.appendChild(a)
            a.click()

            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Download failed:", error)
        }
    }

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-[95vw] max-w-4xl h-[90vh] flex flex-col overflow-hidden
                           animate-[fadeInScale_0.25s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray2">
                    <div className="flex items-center gap-3">

                        {/* Download button */}
                        <button
                            onClick={handleDownload}
                            className="text-dark-gray3 hover:text-dark-blue transition-colors duration-200"
                            title="Download feedback"
                        >
                            <Download size={20} />
                        </button>

                        <h2 className="text-lg text-dark-gray3 font-medium">
                            {modalTitle}{' '}
                            <span className="font-bold text-dark-blue text-xl">
                                {jobTitle}
                            </span>
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-dark-gray3 hover:text-dark-blue transition-colors duration-200
                                   hover:bg-light-gray1 rounded-lg p-1.5"
                        title="Close"
                    >
                        <X size={22} strokeWidth={2.5} />
                    </button>
                </div>

                {/* PDF Viewer — Google Docs Viewer handles external URLs that
                    can't be embedded directly (e.g. Cloudinary raw files). */}
                <div className="flex-1 bg-gray-100">
                    <iframe
                        key={feedbackFile}
                        src={getViewerSrc(feedbackFile)}
                        title={`Feedback for ${jobTitle}`}
                        className="w-full h-full border-0"
                    />
                </div>
            </div>
        </div>
    )
}

export default FeedbackModal