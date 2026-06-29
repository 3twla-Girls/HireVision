import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, MapPin, ShieldCheck, ShieldAlert, Clock, Loader2, AlertCircle, Check, X } from 'lucide-react'
import api from '../../api/axios'
import InterviewFilterSidebar from './InterviewFilterSidebar'
import { FilterBtn } from './FilterBtn'
import { Pagination } from './Pagination'
import { timeAgo } from './JobApplicationsHelpers'

/* ── Score colour ────────────────────────────────────────── */
const getTechScoreColor = (score) => {
  if (score == null) return 'bg-gray-300'
  if (score >= 75)   return 'bg-emerald-600'
  if (score >= 50)   return 'bg-dark-orange'
  return 'bg-red-500'
}

/* ── Status Badge ────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  if (!status) return <span className="text-xs text-gray-400 italic">—</span>
  const isCompleted = status.toLowerCase() === 'completed'
  const isAccepted = status.toLowerCase() === 'accepted'
  const isRejected = status.toLowerCase() === 'rejected'

  let badgeColor = 'bg-gray-50 text-gray-700 border-gray-100'
  if (isCompleted) badgeColor = 'bg-blue-50 text-blue-700 border-blue-100'
  if (isAccepted) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (isRejected) badgeColor = 'bg-red-50 text-red-600 border-red-100'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
      {isAccepted ? "Passed" : status}
    </span>
  )
}

/* ── Avatar / initials ───────────────────────────────────── */
const Avatar = ({ url, name }) => {
  const initials = name ? name.slice(0, 2).toUpperCase() : '??'
  return url
    ? <img src={url} alt={name}
        className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
    : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
}

const ITEMS_PER_PAGE = 6

/* ══ Main Component ══════════════════════════════════════════ */
export default function InterviewResultsTab({ jobId, applications, interviewDate }) {

  const navigate = useNavigate()

  // ── Data ──────────────────────────────────────────────────
  const [sessions,  setSessions]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // ── Filters ───────────────────────────────────────────────
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  // Pre-set date filter to the interview day when prop is provided
  const toDateStr = (d) => d ? d.toISOString().slice(0, 10) : ''
  const [filters, setFilters] = useState(() => ({
    sort:  '',
    score: [0, 100],
  }))

  // ── Pagination ────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)

  // ── Fetch sessions from `/interview/job/:jobId` ───────────
  useEffect(() => {
    if (!jobId) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/interview/job/${jobId}`)
        const raw = res.data || []

        // Enrich each session with candidate info + application_id
        const enriched = await Promise.all(
          raw.map(async (s) => {
            let candidate = null
            let applicationId = null

            try {
              const userRes = await api.get(`/user/${s.candidate_id}`)
              candidate = userRes.data?.user ?? userRes.data
            } catch (_) {}

            // Match to an application so we can link to CandidateProfile
            const matchedApp = applications.find(
              a => a.candidate_id === s.candidate_id
            )
            applicationId = matchedApp?._id ?? null
            const appStatus = matchedApp?.status ?? s.status

            return { ...s, candidate, applicationId, appStatus }
          })
        )

        if (mounted) setSessions(enriched)
      } catch (e) {
        if (mounted) setError('Failed to load interview sessions.')
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [jobId])

  // ── Filter + sort logic ───────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...sessions]



    // Score range
    const [minScore, maxScore] = filters.score
    if (minScore > 0 || maxScore < 100) {
      list = list.filter(s => {
        const sc = s.technical_score
        if (sc == null) return minScore === 0  // include null when min is 0
        return sc >= minScore && sc <= maxScore
      })
    }


    // Sort
    switch (filters.sort) {
      case 'Highest Score':
        list.sort((a, b) => (b.technical_score ?? -1) - (a.technical_score ?? -1)); break
      case 'Lowest Score':
        list.sort((a, b) => (a.technical_score ?? 101) - (b.technical_score ?? 101)); break
      case 'Most Recent':
        list.sort((a, b) => new Date(b.session_date) - new Date(a.session_date)); break
      case 'Oldest First':
        list.sort((a, b) => new Date(a.session_date) - new Date(b.session_date)); break
    }

    return list
  }, [sessions, filters])

  useEffect(() => { setCurrentPage(1) }, [filters])

  const totalPages    = Math.ceil(displayed.length / ITEMS_PER_PAGE)
  const paginatedItems = displayed.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={32} className="animate-spin text-purple-500" />
          <p className="text-sm font-semibold">Loading interview results…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <AlertCircle size={36} className="text-red-400 mx-auto" />
          <p className="text-sm text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  // ── Helpers ───────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const renderRow = (s, i) => {
    const name    = s.candidate?.name ?? `Candidate #${s.candidate_id.slice(-4)}`
    const city    = s.candidate?.location ?? '—'
    const avatarUrl = s.candidate?.profile_image_url ?? null
    const score   = s.technical_score

    return (
      <tr key={`${s._id}-${i}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        {/* Candidate */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar url={avatarUrl} name={name} />
            <div>
              <p className="font-semibold text-gray-900">{name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-3 h-3" /> {city}
              </p>
            </div>
          </div>
        </td>

        {/* Technical Score */}
        <td className="px-6 py-4">
          <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-bold ${getTechScoreColor(score)}`}>
            {score != null ? `${Math.round(score)}%` : '—'}
          </span>
        </td>

        {/* Date */}
        <td className="px-6 py-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {formatDate(s.session_date)}
          </span>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <StatusBadge status={s.appStatus} />
        </td>

        {/* Action */}
        <td className="px-6 py-4">
          {s.applicationId ? (
            // <button
            //   onClick={() => navigate(`/candidate-profile/${s.applicationId}`)}
            //   className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white text-xs font-semibold rounded-lg transition"
            // >
            //   <Eye className="w-3.5 h-3.5" /> View Profile
            // </button>
            <button
              onClick={() => navigate(`/candidate-profile/${s.applicationId}?sessionId=${s._id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white text-xs font-semibold rounded-lg transition"
            >
              <Eye className="w-3.5 h-3.5" /> View Profile
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">No application</span>
          )}
        </td>
      </tr>
    )
  }

  const renderCard = (s, i) => {
    const name    = s.candidate?.name ?? `Candidate #${s.candidate_id.slice(-4)}`
    const city    = s.candidate?.location ?? '—'
    const avatarUrl = s.candidate?.profile_image_url ?? null
    const score   = s.technical_score

    return (
      <div key={`${s._id}-${i}`} className="p-3 space-y-2.5 border-b border-gray-100 last:border-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar url={avatarUrl} name={name} />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-xs truncate">{name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 shrink-0" /> {city}
              </p>
            </div>
          </div>
          <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-white text-xs font-bold ${getTechScoreColor(score)}`}>
            {score != null ? `${Math.round(score)}%` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-end">
          <StatusBadge status={s.appStatus} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(s.session_date)}</span>
          {/* {s.applicationId && (
            <button
              onClick={() => navigate(`/candidate-profile/${s.applicationId}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <Eye className="w-3 h-3" /> View
            </button>
          )} */}
          {s.applicationId && (
            <button
              onClick={() => navigate(`/candidate-profile/${s.applicationId}?sessionId=${s._id}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <Eye className="w-3 h-3" /> View
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-5 lg:gap-6 w-full">

      {/* Sidebar — desktop */}
      <div className="hidden lg:block shrink-0 w-[270px]">
        <InterviewFilterSidebar onFilterChange={setFilters} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Mobile filter button */}
        <div className="flex items-center justify-between lg:hidden">
          <span className="text-sm font-bold text-gray-700">
            {displayed.length} result{displayed.length !== 1 ? 's' : ''}
          </span>
          <FilterBtn full={false} onClick={() => setFilterPanelOpen(true)} />
        </div>



        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {paginatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Eye size={28} className="text-purple-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No interview results match your filters</p>
              <p className="text-xs text-gray-400">Try adjusting the filters or check back after interviews are completed</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Technical Score</th>
                  <th className="px-6 py-4">Interview Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((s, i) => renderRow(s, i))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="block lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {paginatedItems.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No interview results found.</div>
          ) : (
            paginatedItems.map((s, i) => renderCard(s, i))
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Mobile filter panel overlay */}
      {filterPanelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setFilterPanelOpen(false)}
          />
          <InterviewFilterSidebar
            isOpen={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            onFilterChange={setFilters}
          />
        </>
      )}
    </div>
  )
}
