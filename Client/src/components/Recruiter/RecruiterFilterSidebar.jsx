import { useMemo, useState } from "react"
import Select from "react-select"
import countryList from "react-select-country-list"
import ReactCountryFlag from "react-country-flag"
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react"

/* ---------------- Sort Options ---------------- */
const SORT_OPTIONS = [
  "Highest Score",
  "Lowest Score",
  "Most Recent",
  "Oldest First",
]

/* ---------------- Status Options ---------------- */
const STATUS_OPTIONS = ["Pending", "Accepted", "Rejected"]

/* ---------------- Country Select ---------------- */
function CountrySelect({ value, onChange }) {

  const options = useMemo(
    () =>
      countryList().getData().map((c) => ({
        value: c.value,
        label: c.label,
      })),
    []
  )

  return (
    <div className="mt-2">
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Select country"
        isSearchable
        formatOptionLabel={(country) => (
          <div className="flex items-center gap-2">
            <ReactCountryFlag
              svg
              countryCode={country.value}
              style={{ width: 20, height: 20 }}
            />
            <span>{country.label}</span>
          </div>
        )}
      />
    </div>
  )
}

/* ---------------- Section ---------------- */
function Section({ title, isOpen, toggle, children }) {
  return (
    <div className="mb-3">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full text-sm font-semibold py-2"
      >
        {title}
        {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
      </button>
      {isOpen && <div className="mt-1">{children}</div>}
    </div>
  )
}

/* ---------------- Checkbox ---------------- */
function Checkbox({ checked }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded border
      ${checked ? "bg-orange border-orange" : "bg-white border-gray-300"}`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8"/>
        </svg>
      )}
    </span>
  )
}

/* ---------------- Radio ---------------- */
function Radio({ selected }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border
      ${selected ? "bg-orange border-orange" : "bg-white border-gray-300"}`}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-white"/>}
    </span>
  )
}

/* ---------------- Sidebar ---------------- */
export default function RecruiterFilterSidebar({ onFilterChange, isOpen, onClose }) {

  const [openSections, setOpenSections] = useState({
    sort: true,
    status: true,
    country: true,
  })

  const [sortValue, setSortValue] = useState("")
  const [status, setStatus] = useState({})
  const [country, setCountry] = useState(null)

  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const emit = (s, st, c) => {
    onFilterChange?.({
      sort: s,
      status: st,
      country: c?.label || "",
      city: ""
    })
  }

  const handleSort = (option) => {
    setSortValue(option)
    emit(option, status, country)
  }

  const handleStatus = (opt) => {
    const updated = { ...status, [opt]: !status[opt] }
    setStatus(updated)
    emit(sortValue, updated, country)
  }

  const handleCountry = (value) => {
    setCountry(value)
    emit(sortValue, status, value)
  }

  const clearAll = () => {
    setSortValue("")
    setStatus({})
    setCountry(null)
    emit("", {}, null)
  }

  return (
    <aside className={`w-[270px] bg-white rounded-l-2xl shadow-md p-5 ${isOpen ? 'fixed inset-y-0 right-0 z-50 h-full overflow-y-auto' : ''}`}>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 font-bold">
          <SlidersHorizontal size={18}/>
          Filters
        </div>

        <div className="flex items-center gap-3">
          <button onClick={clearAll} className="text-xs text-gray-500">
            Clear all
          </button>
          
          {onClose && (
            <button onClick={onClose} className="text-gray-500 bg-gray-100 p-1.5 rounded-md lg:hidden">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>
      </div>

      <Section title="Sort By" isOpen={openSections.sort} toggle={() => toggleSection("sort")}>
        {SORT_OPTIONS.map((opt) => (
          <div
            key={opt}
            className="flex items-center gap-2 py-1 cursor-pointer"
            onClick={(e) => { e.preventDefault(); handleSort(opt); }}
          >
            <Radio selected={sortValue === opt}/>
            <span>{opt}</span>
          </div>
        ))}
      </Section>

      <Section title="Application Status" isOpen={openSections.status} toggle={() => toggleSection("status")}>
        {STATUS_OPTIONS.map((opt) => (
          <div
            key={opt}
            className="flex items-center gap-2 py-1 cursor-pointer"
            onClick={(e) => { e.preventDefault(); handleStatus(opt); }}
          >
            <Checkbox checked={!!status[opt]}/>
            <span>{opt}</span>
          </div>
        ))}
      </Section>

      <Section title="Country" isOpen={openSections.country} toggle={() => toggleSection("country")}>
        <CountrySelect value={country} onChange={handleCountry}/>
      </Section>

    </aside>
  )
}