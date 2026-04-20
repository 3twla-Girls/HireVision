import { useState } from "react"
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react"

/* ── Sort options ─────────────────────────────────────────── */
const SORT_OPTIONS = [
  "Highest Score",
  "Lowest Score",
 
]

/* ── Section wrapper ─────────────────────────────────────── */
function Section({ title, isOpen, toggle, children }) {
  return (
    <div className="mb-3">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full text-sm font-semibold py-2"
      >
        {title}
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && <div className="mt-1">{children}</div>}
    </div>
  )
}

/* ── Custom Radio ─────────────────────────────────────────── */
function Radio({ selected }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border
      ${selected ? "bg-orange border-orange" : "bg-white border-gray-300"}`}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-white" />}
    </span>
  )
}

/* ── Score Range Slider ──────────────────────────────────── */
function ScoreRangeSlider({ min, max, onChange }) {
  return (
    <div className="space-y-3 px-1 pt-1">
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Min Score</label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={min}
          onChange={(e) => onChange(Number(e.target.value), max)}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #FF914D ${min}%, #e5e7eb ${min}%)`,
          }}
        />
        <label className="text-xs text-gray-400">Max Score</label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={max}
          onChange={(e) => onChange(min, Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #FF914D ${max}%, #e5e7eb ${max}%)`,
          }}
        />
      </div>
    </div>
  )
}

/* ══ Main Sidebar ════════════════════════════════════════════ */
export default function InterviewFilterSidebar({ onFilterChange, isOpen, onClose }) {

  const [openSections, setOpenSections] = useState({
    sort:  true,
    score: true,
  })

  const [sortValue,  setSortValue]  = useState("")
  const [scoreRange, setScoreRange] = useState([0, 100])

  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const emit = (sort, score) => {
    onFilterChange?.({ sort, score })
  }

  const handleSort = (opt) => {
    setSortValue(opt)
    emit(opt, scoreRange)
  }

  const handleScore = (min, max) => {
    const updated = [min, max]
    setScoreRange(updated)
    emit(sortValue, updated)
  }

  const clearAll = () => {
    setSortValue("")
    setScoreRange([0, 100])
    emit("", [0, 100])
  }

  return (
    <aside
      className={`w-[270px] bg-white rounded-l-2xl shadow-md p-5 ${
        isOpen ? "fixed inset-y-0 right-0 z-50 h-full overflow-y-auto" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 font-bold">
          <SlidersHorizontal size={18} />
          Filters
        </div>
        <div className="flex items-center gap-3">
          <button onClick={clearAll} className="text-xs text-gray-500">
            Clear all
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 bg-gray-100 p-1.5 rounded-md lg:hidden"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <Section title="Sort By" isOpen={openSections.sort} toggle={() => toggle("sort")}>
        {SORT_OPTIONS.map((opt) => (
          <div
            key={opt}
            className="flex items-center gap-2 py-1 cursor-pointer"
            onClick={() => handleSort(opt)}
          >
            <Radio selected={sortValue === opt} />
            <span className="text-sm">{opt}</span>
          </div>
        ))}
      </Section>

      <div className="border-t border-gray-100 my-2" />

      {/* Score Range */}
      <Section title="Technical Score" isOpen={openSections.score} toggle={() => toggle("score")}>
        <ScoreRangeSlider
          min={scoreRange[0]}
          max={scoreRange[1]}
          onChange={handleScore}
        />
      </Section>

    </aside>
  )
}
