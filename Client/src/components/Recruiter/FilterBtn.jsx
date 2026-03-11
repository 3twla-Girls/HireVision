import { SlidersHorizontal } from 'lucide-react'

export const FilterBtn = ({ full = false, onClick }) => (
    <button
        onClick={onClick}
        className={`${full ? 'w-full' : ''} inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-orange text-white rounded-xl font-semibold text-sm`}
    >
        <SlidersHorizontal className="w-4 h-4" /> Filters
    </button>
)
