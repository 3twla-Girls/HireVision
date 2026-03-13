import { useState, useRef, useEffect, useCallback } from 'react'
import { SlidersHorizontal, ChevronUp, ChevronDown, Search, X, MapPin, Globe } from 'lucide-react'

// ── Comprehensive country & city lists ──────────────────────────────────────
const ALL_COUNTRIES = [
    'Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria',
    'Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Bosnia',
    'Brazil','Bulgaria','Cambodia','Canada','Chile','China','Colombia','Croatia',
    'Cuba','Cyprus','Czech Republic','Denmark','Ecuador','Egypt','Estonia',
    'Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala',
    'Honduras','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel',
    'Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kosovo','Kuwait',
    'Kyrgyzstan','Latvia','Lebanon','Libya','Lithuania','Luxembourg','Malaysia',
    'Malta','Mexico','Moldova','Mongolia','Montenegro','Morocco','Myanmar',
    'Nepal','Netherlands','New Zealand','Nigeria','North Korea','Norway','Oman',
    'Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland',
    'Portugal','Qatar','Romania','Russia','Saudi Arabia','Senegal','Serbia',
    'Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea',
    'Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan',
    'Tajikistan','Tanzania','Thailand','Tunisia','Turkey','Turkmenistan',
    'UAE','Uganda','UK','Ukraine','USA','Uruguay','Uzbekistan','Venezuela',
    'Vietnam','Yemen','Zimbabwe',
]

const ALL_CITIES = [
    'Abu Dhabi','Accra','Addis Ababa','Alexandria','Algiers','Almaty','Amman',
    'Amsterdam','Ankara','Athens','Atlanta','Auckland','Baghdad','Bangkok',
    'Barcelona','Beijing','Beirut','Belgrade','Berlin','Bogotá','Brussels',
    'Budapest','Buenos Aires','Cairo','Calgary','Caracas','Casablanca',
    'Chicago','Colombo','Copenhagen','Dallas','Delhi','Denver','Dhaka','Doha',
    'Dubai','Dublin','Edinburgh','Frankfurt','Geneva','Glasgow','Guangzhou',
    'Hamburg','Hanoi','Helsinki','Ho Chi Minh City','Hong Kong','Houston',
    'Hyderabad','Istanbul','Jakarta','Jerusalem','Johannesburg','Karachi',
    'Kiev','Kinshasa','Kolkata','Kuala Lumpur','Lagos','Lahore','Lima',
    'Lisbon','London','Los Angeles','Luxembourg','Lyon','Madrid','Manila',
    'Melbourne','Mexico City','Miami','Milan','Minneapolis','Minsk','Montreal',
    'Moscow','Mumbai','Munich','Nairobi','New York','Nicosia','Osaka','Oslo',
    'Ottawa','Paris','Prague','Riyadh','Rome','San Francisco','Santiago',
    'São Paulo','Seattle','Seoul','Shanghai','Singapore','Sofia','Stockholm',
    'Sydney','Taipei','Tehran','Tel Aviv','Tokyo','Toronto','Tunis','Vancouver',
    'Vienna','Warsaw','Washington DC','Zurich',
]

// ── Sections config ──────────────────────────────────────────────────────────
const sections = [
    {
        key: 'workplace',
        label: 'Workplace',
        options: ['On site', 'Remote', 'Hybrid'],
    },
    {
        key: 'jobType',
        label: 'Job Type',
        options: ['Full-time', 'Part-time', 'Contract'],
    },
    {
        key: 'country',
        label: 'Country',
        type: 'search',
        icon: 'globe',
        placeholder: 'Search country…',
        suggestions: ALL_COUNTRIES,
    },
    {
        key: 'city',
        label: 'City',
        type: 'search',
        icon: 'pin',
        placeholder: 'Search city…',
        suggestions: ALL_CITIES,
    },
    {
        key: 'experience',
        label: 'Experience Level',
        options: ['Junior', 'Mid-level', 'Senior'],
    },
]

// All sections closed by default
const DEFAULT_OPEN = {}

// ── Custom Checkbox ──────────────────────────────────────────────────────────
function Checkbox({ checked, onChange }) {
    return (
        <span
            onClick={onChange}
            className={`inline-flex items-center justify-center w-[17px] h-[17px] rounded shrink-0 cursor-pointer
                        transition-all duration-150
                        ${checked
                    ? 'border-[1.5px] border-orange bg-orange shadow-[0_0_0_3px_rgba(255,145,77,0.15)]'
                    : 'border-[1.5px] border-[#c8d6e5] bg-white'
                }`}
        >
            {checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </span>
    )
}

// ── Main Component ───────────────────────────────────────────────────────────
// onChange({ checked, searchValues }) is called on every filter change.
//
// checked      = { 'Remote': true, 'Full-time': true, … }   (option label → bool)
// searchValues = { country: 'Egypt', city: 'Cairo' }        (sec.key → selected string)
export default function FilterSidebar({ isOpen, onClose, onChange }) {
    const [openSections, setOpenSections] = useState(DEFAULT_OPEN)
    const [checked, setChecked]           = useState({})
    const [searchValues, setSearchValues] = useState({})

    // Notify parent whenever any filter changes
    useEffect(() => {
        onChange?.({ checked, searchValues })
    }, [checked, searchValues]) // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = (key) =>
        setOpenSections((p) => ({ ...p, [key]: !p[key] }))

    const toggleCheck = (opt) =>
        setChecked((p) => ({ ...p, [opt]: !p[opt] }))

    // Update a single search/select field and notify parent immediately
    const handleSearchChange = (key, value) =>
        setSearchValues((p) => ({ ...p, [key]: value }))

    const clearAll = () => {
        setChecked({})
        setSearchValues({})
    }

    const isPanel = typeof isOpen !== 'undefined'

    const sidebarContent = (
        <aside className={`overflow-y-auto rounded-3xl p-6 shadow-md bg-white ${
            isPanel ? 'h-full rounded-none rounded-r-3xl' : 'sticky top-28 max-h-[calc(100vh-130px)]'
        }`}>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-5 bg-white">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg border">
                        <SlidersHorizontal size={20} className="text-dark-blue" strokeWidth={2.2} />
                    </span>
                    <span className="font-bold text-[1.2rem] text-dark-blue">Filters</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={clearAll}
                        className="text-xs font-medium text-dark-gray3 hover:text-orange transition-colors duration-150"
                    >
                        Clear all
                    </button>
                    {isPanel && (
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-light-gray1 hover:bg-light-gray2 transition-colors"
                        >
                            <X size={16} className="text-dark-gray3" strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Sections ── */}
            {sections.map((sec, i) =>
                sec.type === 'search' ? (
                    <SearchSection
                        key={sec.key}
                        sec={sec}
                        isOpen={!!openSections[sec.key]}
                        onToggle={() => toggle(sec.key)}
                        value={searchValues[sec.key] ?? ''}
                        onChange={(v) => handleSearchChange(sec.key, v)}
                        isLast={i === sections.length - 1}
                    />
                ) : (
                    <Section
                        key={sec.key}
                        sec={sec}
                        isOpen={!!openSections[sec.key]}
                        onToggle={() => toggle(sec.key)}
                        checked={checked}
                        onCheck={toggleCheck}
                        isLast={i === sections.length - 1}
                    />
                )
            )}
        </aside>
    )

    // Panel mode (phone / tablet)
    if (isPanel) {
        if (!isOpen) return null
        return (
            <div className="fixed inset-0 z-50 flex" onClick={onClose}>
                <div
                    className="w-[300px] max-w-[85vw] h-full animate-slideInLeft"
                    onClick={(e) => e.stopPropagation()}
                >
                    {sidebarContent}
                </div>
                <div className="flex-1 filter-backdrop" />
            </div>
        )
    }

    // Inline mode (desktop)
    return sidebarContent
}

// ── Checkbox Section ─────────────────────────────────────────────────────────
function Section({ sec, isOpen, onToggle, checked, onCheck, isLast }) {
    return (
        <div className={isLast ? '' : 'mb-1'}>
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full py-2.5 bg-transparent border-none cursor-pointer
                           font-bold text-[0.83rem] text-dark-gray3 hover:text-dark-blue tracking-wide transition-colors duration-150"
            >
                <span className="flex items-center gap-1.5">{sec.label}</span>
                <span className={`flex items-center justify-center w-[22px] h-[22px] rounded-md transition-all duration-150
                    ${isOpen
                        ? 'bg-orange/10 border border-orange/25'
                        : 'bg-light-gray1 border border-light-gray2'
                    }`}>
                    {isOpen
                        ? <ChevronUp size={12} strokeWidth={3} className="text-orange" />
                        : <ChevronDown size={12} strokeWidth={3} className="text-dark-gray3" />
                    }
                </span>
            </button>

            {isOpen && sec.options && (
                <div className="flex flex-col gap-[0.45rem] pl-1 pb-2.5 overflow-hidden animate-slideDown">
                    {sec.options.map((opt) => (
                        <OptionRow
                            key={opt}
                            opt={opt}
                            checked={!!checked[opt]}
                            onCheck={() => onCheck(opt)}
                        />
                    ))}
                </div>
            )}

            {!isLast && <div className="h-px bg-light-gray1" />}
        </div>
    )
}

// ── Search / Select Section ───────────────────────────────────────────────────
// `value` is the currently selected/typed string for this field.
// Selecting from the dropdown sets the full value; typing also updates it live.
function SearchSection({ sec, isOpen, onToggle, value, onChange, isLast }) {
    const [focused, setFocused]   = useState(false)
    const [showDrop, setShowDrop] = useState(false)
    const inputRef = useRef(null)
    const wrapRef  = useRef(null)

    // Filter suggestions based on current input
    const filtered = value.trim().length === 0
        ? sec.suggestions.slice(0, 8)
        : sec.suggestions
            .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 20)

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // User picks a suggestion → set full value, close dropdown, trigger filter
    const select = (s) => {
        onChange(s)
        setShowDrop(false)
        inputRef.current?.blur()
    }

    // User clears the field → reset value, trigger filter
    const clear = (e) => {
        e.preventDefault()
        onChange('')
        setShowDrop(false)
    }

    const hasValue = value.trim().length > 0

    return (
        <div className={isLast ? '' : 'mb-1'}>
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full py-2.5 bg-transparent border-none cursor-pointer
                           font-bold text-[0.83rem] text-dark-gray3 hover:text-dark-blue tracking-wide transition-colors duration-150"
            >
                <span className="flex items-center gap-1.5">{sec.label}</span>
                <span className={`flex items-center justify-center w-[22px] h-[22px] rounded-md transition-all duration-150
                    ${isOpen
                        ? 'bg-orange/10 border border-orange/25'
                        : 'bg-light-gray1 border border-light-gray2'
                    }`}>
                    {isOpen
                        ? <ChevronUp size={12} strokeWidth={3} className="text-orange" />
                        : <ChevronDown size={12} strokeWidth={3} className="text-dark-gray3" />
                    }
                </span>
            </button>

            {isOpen && (
                <div ref={wrapRef} className="pb-3 relative animate-slideDown">
                    {/* Input */}
                    <div className={`flex items-center gap-2 rounded-[10px] px-2.5 py-[0.45rem] transition-all duration-150
                        ${focused
                            ? 'bg-white border-[1.5px] border-orange shadow-[0_0_0_3px_rgba(255,145,77,0.12)]'
                            : 'bg-light-gray1 border-[1.5px] border-light-gray2'
                        }`}>
                        {sec.icon === 'globe'
                            ? <Globe size={13} className={`shrink-0 transition-colors duration-150 ${focused ? 'text-orange' : 'text-dark-gray3'}`} />
                            : <MapPin size={13} className={`shrink-0 transition-colors duration-150 ${focused ? 'text-orange' : 'text-dark-gray3'}`} />
                        }
                        <input
                            ref={inputRef}
                            value={value}
                            onChange={(e) => { onChange(e.target.value); setShowDrop(true) }}
                            onFocus={() => { setFocused(true); setShowDrop(true) }}
                            onBlur={() => setFocused(false)}
                            placeholder={sec.placeholder}
                            className="flex-1 border-none outline-none bg-transparent text-[0.82rem] text-dark-blue min-w-0"
                        />
                        {hasValue && (
                            <button
                                onMouseDown={clear}
                                className="flex items-center justify-center bg-light-gray1 border-none rounded w-[18px] h-[18px] cursor-pointer shrink-0 p-0"
                            >
                                <X size={10} className="text-dark-gray3" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown suggestions */}
                    {showDrop && filtered.length > 0 && (
                        <div className="absolute top-[calc(100%-4px)] left-0 right-0 bg-white border-[1.5px] border-light-gray2
                                        rounded-[10px] shadow-lg z-50 overflow-hidden animate-slideDown">
                            <div className="max-h-[180px] overflow-y-auto">
                                {filtered.map((s, idx) => (
                                    <DropItem
                                        key={s}
                                        label={s}
                                        query={value}
                                        isLast={idx === filtered.length - 1}
                                        onSelect={() => select(s)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected value chip (shown when dropdown is closed) */}
                    {hasValue && !showDrop && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            <span className="inline-flex items-center gap-1.5 bg-orange/10 border border-orange/30
                                             rounded-md px-2 py-0.5 text-[0.73rem] font-semibold text-orange">
                                {value}
                                <button
                                    onMouseDown={clear}
                                    className="bg-transparent border-none cursor-pointer flex p-0"
                                >
                                    <X size={9} className="text-orange" strokeWidth={3} />
                                </button>
                            </span>
                        </div>
                    )}
                </div>
            )}

            {!isLast && <div className="h-px bg-light-gray1" />}
        </div>
    )
}

// ── Dropdown Item ─────────────────────────────────────────────────────────────
function DropItem({ label, query, isLast, onSelect }) {
    const idx    = label.toLowerCase().indexOf(query.toLowerCase())
    const before = idx >= 0 ? label.slice(0, idx) : label
    const match  = idx >= 0 ? label.slice(idx, idx + query.length) : ''
    const after  = idx >= 0 ? label.slice(idx + query.length) : ''

    return (
        <div
            onMouseDown={onSelect}
            className={`flex items-center gap-2 px-3 py-[0.45rem] cursor-pointer hover:bg-light-gray1
                        transition-colors duration-100
                        ${isLast ? '' : 'border-b border-light-gray1'}`}
        >
            <Search size={11} className="text-dark-gray3 shrink-0" />
            <span className="text-[0.82rem] text-dark-blue">
                {before}
                <strong className="text-orange">{match}</strong>
                {after}
            </span>
        </div>
    )
}

// ── Option Row ───────────────────────────────────────────────────────────────
function OptionRow({ opt, checked, onCheck }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer px-2 py-[0.3rem] rounded-lg
                          hover:bg-light-gray1 transition-colors duration-150">
            <Checkbox checked={checked} onChange={onCheck} />
            <span className={`flex-1 text-[0.83rem] select-none transition-colors duration-150
                ${checked ? 'font-semibold text-dark-blue' : 'font-normal text-dark-gray3'}`}>
                {opt}
            </span>
        </label>
    )
}