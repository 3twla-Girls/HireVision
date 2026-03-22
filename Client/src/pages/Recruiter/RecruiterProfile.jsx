import React, { useEffect, useState } from 'react'
import {
  MapPin, Mail, Briefcase, Globe, Building2, Calendar,
  GraduationCap, Loader2, Pencil, Check, X, Camera
} from 'lucide-react'

// ── Recruiter whose profile we are viewing ──────────────────────────────────
const CURRENT_RECRUITER_ID = '69aa302c63b720c25373f034'

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return 'Not specified'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

// ── Editable field component ─────────────────────────────────────────────────
const EditableField = ({ label, value, field, icon: Icon, onSave, type = 'text' }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const handleSave = () => {
    onSave(field, draft)
    setEditing(false)
  }
  const handleCancel = () => {
    setDraft(value || '')
    setEditing(false)
  }

  return (
    <div className="group flex items-start gap-3 py-3 border-b border-light-gray2/50 last:border-none">
      {Icon && <Icon size={17} className="text-light-blue shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-dark-gray3 uppercase tracking-wider mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              className="flex-1 bg-light-gray1 border border-light-gray2 rounded-lg px-3 py-1.5
                         text-[14px] text-dark-blue outline-none focus:border-dark-blue/40 transition-colors"
            />
            <button onClick={handleSave}
              className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors">
              <Check size={13} />
            </button>
            <button onClick={handleCancel}
              className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors">
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-dark-blue font-medium truncate">
              {value || <span className="italic text-dark-gray3 font-normal">Not specified</span>}
            </span>
            <button
              onClick={() => { setDraft(value || ''); setEditing(true) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-dark-gray3 hover:text-dark-blue"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Avatar skeleton ───────────────────────────────────────────────────────────
const AvatarSkeleton = () => (
  <div className="w-28 h-28 rounded-2xl bg-light-gray2 animate-pulse" />
)

// ── Page skeleton ─────────────────────────────────────────────────────────────
const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-48 rounded-3xl bg-light-gray2" />
    <div className="h-64 rounded-3xl bg-light-gray2" />
    <div className="h-48 rounded-3xl bg-light-gray2" />
  </div>
)

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, color }) => (
  <div className={`flex flex-col items-center justify-center py-5 px-4 rounded-2xl ${color}`}>
    <span className="text-2xl font-bold text-dark-blue">{value ?? '—'}</span>
    <span className="text-[12px] text-dark-gray3 mt-0.5 text-center">{label}</span>
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
const RecruiterProfile = () => {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveMsg, setSaveMsg]   = useState(null)
  const [jobStats, setJobStats] = useState({ total: null, open: null, closed: null })

  // ── Fetch recruiter data + job stats in parallel ───────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [userRes, jobsRes] = await Promise.all([
          fetch(`/api/v1/user/${CURRENT_RECRUITER_ID}`),
          fetch(`/api/v1/job/all/${CURRENT_RECRUITER_ID}`),
        ])
        if (userRes.ok) {
          const data = await userRes.json()
          setUser(data.user)
        } else {
          throw new Error(`Server error (${userRes.status})`)
        }
        if (jobsRes.ok) {
          const jobs = await jobsRes.json()
          if (Array.isArray(jobs)) {
            setJobStats({
              total:  jobs.length,
              open:   jobs.filter(j => j.status === 'open').length,
              closed: jobs.filter(j => j.status !== 'open').length,
            })
          }
        }
      } catch (err) {
        console.error(err)
        setError('Could not load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── Inline field save ──────────────────────────────────────────────────────
  const handleSave = async (field, value) => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/v1/user/${CURRENT_RECRUITER_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
      setUser((prev) => ({ ...prev, [field]: value }))
      setSaveMsg('Saved!')
    } catch {
      setSaveMsg('Failed to save. Please try again.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 2500)
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <ProfileSkeleton />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh] text-center">
      <div>
        <p className="text-lg font-semibold text-dark-blue mb-2">Something went wrong</p>
        <p className="text-sm text-dark-gray3">{error}</p>
      </div>
    </div>
  )

  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : '—'
  const avatarInitials = initials(user?.name)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-6">

      {/* ── Toast ── */}
      {saveMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold
          ${saveMsg === 'Saved!'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {saveMsg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HERO CARD
      ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-light-gray2/40">

        {/* Cover strip */}
        <div className="h-32 bg-gradient-to-r from-dark-blue via-logo-blue to-light-blue relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Avatar + name row */}
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">

            {/* Avatar */}
            <div className="relative shrink-0 group">
              {user?.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.name}
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg
                                bg-gradient-to-br from-dark-blue to-logo-blue
                                flex items-center justify-center text-white text-3xl font-bold">
                  {avatarInitials}
                </div>
              )}
              <button className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </button>
            </div>

            {/* Name + title */}
            <div className="flex-1 sm:mb-2">
              <h1 className="text-2xl font-bold text-white drop-shadow">{user?.name}</h1>
              <p className="text-[14px] text-dark-gray3 mt-0.5 flex items-center gap-1.5">
                <Briefcase size={14} />
                {user?.job_title || 'No title set'}
              </p>
              {user?.company_name && (
                <p className="text-[13px] text-dark-gray3 mt-0.5 flex items-center gap-1.5">
                  <Building2 size={13} />
                  {user.company_name}
                </p>
              )}
            </div>

            {/* Member since badge */}
            <div className="sm:mb-4 shrink-0">
              <span className="px-4 py-1.5 text-[12px] font-semibold bg-light-gray1 border border-light-gray2 rounded-full text-dark-gray3">
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT GRID
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        {/* ── Left column ─────────────────────────────────── */}
        <div className="md:col-span-3 space-y-6">

          {/* Personal Info card */}
          <section className="bg-white rounded-3xl shadow-md border border-light-gray2/40 p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-dark-blue">Personal Information</h2>
            </div>

            <EditableField label="Full Name"     field="name"         icon={null}       value={user?.name}         onSave={handleSave} />
            <EditableField label="Email"         field="email"        icon={Mail}        value={user?.email}        onSave={handleSave} type="email" />
            <EditableField label="Job Title"     field="job_title"    icon={Briefcase}   value={user?.job_title}    onSave={handleSave} />
            <EditableField label="Location"      field="location"     icon={MapPin}      value={user?.location}     onSave={handleSave} />
            <EditableField label="Education"     field="education"    icon={GraduationCap} value={user?.education}  onSave={handleSave} />
            <EditableField label="Date of Birth" field="date_of_birth" icon={Calendar}  value={user?.date_of_birth ? formatDate(user.date_of_birth) : ''} onSave={handleSave} />
          </section>

          {/* Company card */}
          <section className="bg-white rounded-3xl shadow-md border border-light-gray2/40 p-6 md:p-8">
            <h2 className="text-lg font-bold text-dark-blue mb-5">Company</h2>

            <EditableField label="Company Name"    field="company_name"     icon={Building2} value={user?.company_name}     onSave={handleSave} />
            <EditableField label="Company Website" field="company_web_link" icon={Globe}      value={user?.company_web_link} onSave={handleSave} />

            {user?.company_web_link && (
              <a href={user.company_web_link} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-dark-orange text-[13px] font-semibold hover:underline">
                <Globe size={14} /> Visit company website ↗
              </a>
            )}
          </section>
        </div>

        {/* ── Right column ────────────────────────────────── */}
        <div className="md:col-span-2 space-y-6">

          {/* Quick-glance stats */}
          <section className="bg-white rounded-3xl shadow-md border border-light-gray2/40 p-6 md:p-8">
            <h2 className="text-lg font-bold text-dark-blue mb-5">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard value={jobStats.total ?? '—'} label="Jobs Posted"  color="bg-blue-50" />
              <StatCard value={jobStats.open  ?? '—'} label="Open Jobs"    color="bg-emerald-50" />
              <StatCard value={jobStats.closed ?? '—'} label="Closed Jobs" color="bg-orange-50" />
              <StatCard value={memberSince}            label="Member Since" color="bg-purple-50" />
            </div>
          </section>

          {/* Role badge */}
          <section className="bg-white rounded-3xl shadow-md border border-light-gray2/40 p-6 md:p-8">
            <h2 className="text-lg font-bold text-dark-blue mb-4">Account</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-dark-gray3">Role</span>
                <span className="px-3 py-1 text-[12px] font-bold bg-dark-blue/10 text-dark-blue rounded-full capitalize">
                  {user?.role || 'recruiter'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-dark-gray3">Status</span>
                <span className="px-3 py-1 text-[12px] font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-dark-gray3">Joined</span>
                <span className="text-[13px] font-medium text-dark-blue">
                  {user?.created_at ? formatDate(user.created_at) : '—'}
                </span>
              </div>
            </div>
          </section>

          {/* Hover tip */}
          <p className="text-[12px] text-dark-gray3 text-center px-2">
            💡 Hover over any field on the left to edit it inline
          </p>
        </div>

      </div>
    </div>
  )
}

export default RecruiterProfile