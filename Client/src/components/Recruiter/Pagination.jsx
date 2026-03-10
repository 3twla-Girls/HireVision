import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
            <span className="text-sm text-gray-500 whitespace-nowrap">
                Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
                        currentPage === 1
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                    {(() => {
                        let startPage = 1
                        let endPage = totalPages

                        if (totalPages > 3) {
                            if (currentPage === 1) {
                                startPage = 1
                                endPage = 3
                            } else if (currentPage === totalPages) {
                                startPage = totalPages - 2
                                endPage = totalPages
                            } else {
                                startPage = currentPage - 1
                                endPage = currentPage + 1
                            }
                        }

                        const pages = []
                        for (let i = startPage; i <= endPage; i++) {
                            pages.push(i)
                        }

                        return pages.map(pageNumber => (
                            <button
                                key={pageNumber}
                                onClick={() => onPageChange(pageNumber)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 animate-fade-in-scale ${
                                    currentPage === pageNumber
                                        ? 'bg-light-blue text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
                                }`}
                            >
                                {pageNumber}
                            </button>
                        ))
                    })()}
                </div>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
                        currentPage === totalPages
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
