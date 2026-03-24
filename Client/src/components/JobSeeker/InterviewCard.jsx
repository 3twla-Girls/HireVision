import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, CalendarDays, Star, ChevronRight, CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'
import FeedbackModal from './FeedbackModal'

// ── Countdown hook ─────────────────────────────────────────────
const useCountdown = (targetIso) => {
    const calc = () => {
        const diff = new Date(targetIso) - Date.now()
        if (diff <= 0) return { h: 0, m: 0, s: 0, ready: true }
        const total = Math.floor(diff / 1000)
        return {
            h: Math.floor(total / 3600),
            m: Math.floor((total % 3600) / 60),
            s: total % 60,
            ready: false,
        }
    }
    const [time, setTime] = useState(calc)
    useEffect(() => {
        const id = setInterval(() => setTime(calc()), 1000)
        return () => clearInterval(id)
    }, [targetIso])
    return time
}

const pad = (n) => String(n).padStart(2, '0')

// ── Outcome badge config ───────────────────────────────────────
const outcomeConfig = {
    passed: { label: 'Passed', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', icon: XCircle },
    pending: { label: 'Awaiting', bg: 'bg-orange/10', text: 'text-dark-orange', border: 'border-orange/30', icon: Loader2 },
}

// ── Score animation hook ──────────────────────────────────────
const useScoreAnimation = (target, duration = 900) => {
    const [current, setCurrent] = useState(0)
    useEffect(() => {
        setCurrent(0)
        let start = null
        const step = (timestamp) => {
            if (!start) start = timestamp
            const elapsed = timestamp - start
            const progress = Math.min(elapsed / duration, 1)
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCurrent(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(step)
        }
        const raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [target])
    return current
}

// ── Score ring ─────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
    const animated = useScoreAnimation(score)
    const colour = score >= 80 ? '#10b981' : score >= 60 ? '#FF914D' : '#ef4444'
    const r = 22
    const circ = 2 * Math.PI * r
    const offset = circ * (1 - animated / 100)
    return (
        <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="#F5F5F5" strokeWidth="5" />
                <circle
                    cx="28" cy="28" r={r} fill="none"
                    stroke={colour} strokeWidth="5"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-dark-blue">
                {animated}%
            </span>
        </div>
    )
}

// ── Stars ──────────────────────────────────────────────────────
const Stars = ({ rating }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
            <Star
                key={i}
                size={13}
                className={i <= rating ? 'text-light-orange fill-light-orange' : 'text-light-gray2 fill-light-gray2'}
            />
        ))}
    </div>
)

// ── Upcoming card ──────────────────────────────────────────────
const UpcomingCard = ({ interview }) => {
    const navigate = useNavigate()
    const { h, m, s, ready } = useCountdown(interview.scheduledAt)

    return (
        <div
            className="bg-white rounded-2xl shadow-sm border border-light-gray2/60 px-6 py-5
                 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group
                 border-l-[8px] border-l-dark-blue"
        >
            <div className="flex items-center gap-4">
                {/* Logo */}
                <div className="w-13 h-13 shrink-0 rounded-xl bg-light-gray1 border border-light-gray2 flex items-center justify-center
                        group-hover:scale-105 transition-transform duration-300">
                    <span className="text-2xl">🏢</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-dark-blue text-[17px] leading-snug group-hover:text-dark-orange transition-colors duration-300">
                        {interview.jobTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[13px] text-dark-gray3">
                        <MapPin size={13} className="text-light-blue shrink-0" />
                        <span>{interview.city}, {interview.country}</span>
                        <span className="mx-1">•</span>
                        <span>{interview.company}</span>
                    </div>
                </div>

                {/* Countdown + date + CTA */}
                <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                        <div className={`flex items-center gap-1.5 text-[13px] font-semibold mb-1
                            ${ready ? 'text-emerald-600' : 'text-dark-blue'}`}>
                            <Clock size={13} className="shrink-0" />
                            <span>
                                {ready
                                    ? 'Starting now!'
                                    : `Countdown: ${pad(h)}:${pad(m)}:${pad(s)}`}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px] text-dark-gray3">
                            <CalendarDays size={13} className="shrink-0" />
                            <span>Interview Date {interview.interviewDate}</span>
                        </div>
                    </div>

                    {/* Start / Not now */}
                    {ready ? (
                        <button
                            onClick={() => navigate(`/interview/real/${encodeURIComponent(interview.jobTitle)}`, {
                                state: { sessionId: interview.id, jobId: interview.jobId }
                            })}
                            className="px-5 py-2 rounded-xl bg-dark-blue text-white text-[13px] font-semibold
                         hover:bg-dark-blue/90 hover:shadow-md active:scale-95 transition-all duration-200 shrink-0"
                        >
                            Start now
                        </button>
                    ) : (
                        <button
                            disabled
                            className="px-5 py-2 rounded-xl border border-light-gray2 text-dark-gray3 text-[13px] font-semibold
                         cursor-not-allowed shrink-0"
                        >
                            Not now
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile countdown row */}
            <div className="sm:hidden mt-3 pt-3 border-t border-light-gray2/60 flex items-center justify-between text-[12px]">
                <div className={`flex items-center gap-1 font-semibold ${ready ? 'text-emerald-600' : 'text-dark-blue'}`}>
                    <Clock size={12} />
                    {ready ? 'Starting now!' : `${pad(h)}:${pad(m)}:${pad(s)}`}
                </div>
                <div className="flex items-center gap-1 text-dark-gray3">
                    <CalendarDays size={12} />
                    {interview.interviewDate}
                </div>
            </div>
        </div>
    )
}

// ── Past card ──────────────────────────────────────────────────
const PastCard = ({ interview }) => {
    const cfg = outcomeConfig[interview.outcome] || outcomeConfig.pending
    const Icon = cfg.icon
    return (
        <div
            className="bg-white rounded-2xl shadow-sm border border-light-gray2/60 px-6 py-5
                 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group
                 border-l-[8px] border-l-light-blue"
        >
            <div className="flex items-center gap-4">
                <div className="w-13 h-13 shrink-0 rounded-xl bg-light-gray1 border border-light-gray2 flex items-center justify-center
                        group-hover:scale-105 transition-transform duration-300">
                    <span className="text-2xl">🏢</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-dark-blue text-[17px] leading-snug group-hover:text-dark-orange transition-colors duration-300">
                        {interview.jobTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[13px] text-dark-gray3">
                        <MapPin size={13} className="text-light-blue shrink-0" />
                        <span>{interview.city}, {interview.country}</span>
                        <span className="mx-1">•</span>
                        <span>{interview.company}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold border
                            ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <Icon size={13} />
                        {cfg.label}
                    </span>
                    <div className="flex items-center gap-1.5 text-[12px] text-dark-gray3">
                        <CalendarDays size={12} />
                        {interview.interviewDate}
                        {interview.duration && <span className="ml-2 text-dark-gray3">• {interview.duration}</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Mock result card ───────────────────────────────────────────
const MockCard = ({ interview }) => {
    const [showReport, setShowReport] = useState(false)
    const scoreColor = interview.score >= 80
        ? 'text-emerald-600'
        : interview.score >= 60
            ? 'text-dark-orange'
            : 'text-red-500'

    return (
        <>
            <div
                className="bg-white rounded-2xl shadow-sm border border-light-gray2/60 px-6 py-5
                     hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group
                     border-l-[8px] border-l-teal"
            >
                <div className="flex items-center gap-4">
                    <ScoreRing score={interview.score} />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-dark-blue text-[17px] leading-snug group-hover:text-dark-orange transition-colors duration-300">
                            {interview.jobTitle}
                        </h3>
                        <div className="flex items-center flex-wrap gap-3 mt-1.5 text-[13px] text-dark-gray3">
                            <span className="flex items-center gap-1">
                                <CalendarDays size={12} /> {interview.interviewDate}
                            </span>
                            <span>• {interview.answeredCorrectly}/{interview.totalQuestions} correct</span>
                            <span>• {interview.duration}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-2xl font-bold ${scoreColor}`}>{interview.score}%</span>
                        {interview.reportFile && (
                            <button
                                onClick={() => setShowReport(true)}
                                className="flex items-center gap-1 text-[12px] font-semibold text-dark-blue
                                         hover:text-dark-orange transition-colors duration-200"
                            >
                                <FileText size={13} /> View Report <ChevronRight size={13} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <FeedbackModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                feedbackFile={interview.reportFile}
                jobTitle={interview.jobTitle}
            />
        </>
    )
}

// ── Feedback card ──────────────────────────────────────────────
const FeedbackCard = ({ interview }) => {
    const [showFeedback, setShowFeedback] = useState(false)
    return (
        <>
            <div
                className="bg-white rounded-2xl shadow-sm border border-light-gray2/60 px-6 py-5
                       hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group
                       border-l-[6px] border-l-orange"
            >
                <div className="flex items-start gap-4">
                    <div className="w-13 h-13 shrink-0 rounded-xl bg-light-gray1 border border-light-gray2 flex items-center justify-center
                              group-hover:scale-105 transition-transform duration-300 mt-0.5">
                        <span className="text-2xl">🏢</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-dark-blue text-[17px] leading-snug group-hover:text-dark-orange transition-colors duration-300">
                                    {interview.jobTitle}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1 text-[13px] text-dark-gray3">
                                    <MapPin size={13} className="text-light-blue shrink-0" />
                                    <span>{interview.city}, {interview.country}</span>
                                    <span className="mx-1">•</span>
                                    <span>{interview.company}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <Stars rating={interview.rating} />
                                <span className="text-[12px] text-dark-gray3 flex items-center gap-1">
                                    <CalendarDays size={11} /> {interview.interviewDate}
                                </span>
                            </div>
                        </div>
                        {interview.feedbackSummary && (
                            <p className="mt-3 text-[13px] text-dark-gray3 bg-light-gray1 rounded-xl px-4 py-3 leading-relaxed border border-light-gray2/60">
                                💬 {interview.feedbackSummary}
                            </p>
                        )}
                        {interview.feedbackFile && (
                            <button
                                onClick={() => setShowFeedback(true)}
                                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold
                                           text-dark-blue bg-light-gray1 border border-light-gray2
                                           hover:border-dark-blue/30 hover:shadow-sm transition-all duration-200"
                            >
                                <FileText size={14} />
                                Open Feedback PDF
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <FeedbackModal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                feedbackFile={interview.feedbackFile}
                jobTitle={interview.jobTitle}
            />
        </>
    )
}

// ── Main export ────────────────────────────────────────────────
const InterviewCard = ({ interview }) => {
    switch (interview.tab) {
        case 'upcoming': return <UpcomingCard interview={interview} />
        case 'past': return <PastCard interview={interview} />
        case 'mock': return <MockCard interview={interview} />
        case 'feedbacks': return <FeedbackCard interview={interview} />
        default: return null
    }
}

export default InterviewCard
