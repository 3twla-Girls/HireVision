export const ApplicantsCards = ({ displayed, renderCard, originalCount }) => {
    const totalCount = originalCount ?? displayed.length

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-sm">Applicants ({totalCount})</span>
            </div>
            {totalCount === 0 || displayed.length === 0
                ? <p className="px-4 py-8 text-center text-gray-400 text-sm">No applicants found.</p>
                : displayed.map((app, i) => renderCard(app, i))
            }
        </div>
    )
}
