import React, { useState } from 'react'
import { SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react'

const FilterSidebar = () => {
    const [openSections, setOpenSections] = useState({ workplace: true })

    const toggle = (key) =>
        setOpenSections((p) => ({ ...p, [key]: !p[key] }))

    const sections = [
        {
            key: 'workplace',
            label: 'Workplace',
            options: ['On site', 'Remote', 'Hybrid'],
        },
        { key: 'jobType', label: 'Job type' },
        { key: 'country', label: 'Country' },
        { key: 'city', label: 'City' },
        { key: 'experience', label: 'Experience Level' },
    ]

    return (
        <aside className="rounded-xl bg-white p-5 h-full sticky top-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-dark-blue font-semibold text-2xl">
                    <SlidersHorizontal size={22} className="text-dark-blue" />
                    Filter
                </div>
                <button className="text-sm text-dark-gray3 hover:text-orange transition-colors">
                    Clear all
                </button>
            </div>

            <hr className="border-light-gray1 mb-4" />

            {sections.map((sec) => (
                <div key={sec.key} className="mb-3">
                    <button
                        onClick={() => toggle(sec.key)}
                        className="flex items-center justify-between w-full py-2 text-dark-blue font-semibold text-lx"
                    >
                        {sec.label}
                        {openSections[sec.key] ? (
                            <ChevronUp size={18} strokeWidth={3} className="text-dark-blue" />
                        ) : (
                            <ChevronDown size={18} strokeWidth={3} className="text-dark-blue" />
                        )}
                    </button>

                    {openSections[sec.key] && sec.options && (
                        <div className="flex flex-col gap-2 pl-1 pb-2">
                            {sec.options.map((opt) => (
                                <label
                                    key={opt}
                                    className="flex items-center gap-2 text-sm text-dark-blue cursor-pointer hover:text-orange transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 accent-orange"
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    )}

                    <hr className="border-light-gray1" />
                </div>
            ))}
        </aside>
    )
}

export default FilterSidebar
