// interviews.js — mock data for the Interviews page

const now = new Date()

// Helper: add/subtract minutes from now
const minutesFromNow = (min) => new Date(now.getTime() + min * 60 * 1000).toISOString()
const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString()
const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString()

const INTERVIEWS = [
    // ── Upcoming ──────────────────────────────────────────────────
    {
        id: 1,
        tab: 'upcoming',
        jobTitle: 'Frontend Developer',
        company: 'TechCorp',
        city: 'Cairo',
        country: 'Egypt',
        scheduledAt: minutesFromNow(0),   // happening right now → countdown 0
        interviewDate: '20/2/2026',
    },
    {
        id: 2,
        tab: 'upcoming',
        jobTitle: 'UX Designer',
        company: 'Creative Studio',
        city: 'Alexandria',
        country: 'Egypt',
        scheduledAt: minutesFromNow(605), // ~10 hours away
        interviewDate: '30/3/2026',
    },
    {
        id: 3,
        tab: 'upcoming',
        jobTitle: 'Data Analyst',
        company: 'DataFlow Inc.',
        city: 'Dubai',
        country: 'UAE',
        scheduledAt: daysFromNow(3),
        interviewDate: '10/4/2026',
    },

    // ── Past ──────────────────────────────────────────────────────
    {
        id: 4,
        tab: 'past',
        jobTitle: 'Backend Developer',
        company: 'CloudSystems',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        interviewDate: '10/2/2026',
        outcome: 'passed',
        duration: '45 min',
    },
    {
        id: 5,
        tab: 'past',
        jobTitle: 'Product Manager',
        company: 'VisionSoft',
        city: 'Cairo',
        country: 'Egypt',
        interviewDate: '1/2/2026',
        outcome: 'rejected',
        duration: '30 min',
    },
    {
        id: 6,
        tab: 'past',
        jobTitle: 'DevOps Engineer',
        company: 'InfraStack',
        city: 'Berlin',
        country: 'Germany',
        interviewDate: '20/1/2026',
        outcome: 'pending',
        duration: '60 min',
    },

    // ── Mock Interview Results ─────────────────────────────────────
    {
        id: 7,
        tab: 'mock',
        jobTitle: 'Frontend Developer',
        company: 'Mock Session',
        city: 'Cairo',
        country: 'Egypt',
        interviewDate: '5/3/2026',
        score: 82,
        totalQuestions: 10,
        answeredCorrectly: 8,
        duration: '38 min',
        reportFile: '/resume.pdf',
        reportFileName: 'Mock_Report_Frontend_Dev.pdf',
    },
    {
        id: 8,
        tab: 'mock',
        jobTitle: 'React Developer',
        company: 'Mock Session',
        city: 'Cairo',
        country: 'Egypt',
        interviewDate: '28/2/2026',
        score: 65,
        totalQuestions: 10,
        answeredCorrectly: 6,
        duration: '42 min',
        reportFile: '/resume.pdf',
        reportFileName: 'Mock_Report_React_Dev.pdf',
    },
    {
        id: 9,
        tab: 'mock',
        jobTitle: 'Mobile Developer',
        company: 'Mock Session',
        city: 'Cairo',
        country: 'Egypt',
        interviewDate: '28/2/2026',
        score: 20,
        totalQuestions: 10,
        answeredCorrectly: 2,
        duration: '42 min',
        reportFile: '/resume.pdf',
        reportFileName: 'Mock_Report_Mobile_Dev.pdf',
    },

    // ── Feedbacks ─────────────────────────────────────────────────
    {
        id: 10,
        tab: 'feedbacks',
        jobTitle: 'Frontend Developer',
        company: 'TechCorp',
        city: 'Cairo',
        country: 'Egypt',
        interviewDate: '10/2/2026',
        feedbackSummary: 'Strong communication skills. Improve system design knowledge.',
        rating: 4,
        feedbackFile: '/resume.pdf',
        feedbackFileName: 'Feedback_Frontend_Dev.pdf',
    },
    {
        id: 11,
        tab: 'feedbacks',
        jobTitle: 'Backend Developer',
        company: 'CloudSystems',
        city: 'Riyadh',
        country: 'Saudi Arabia',
        interviewDate: '1/2/2026',
        feedbackSummary: 'Good problem solving. Work on time complexity awareness.',
        rating: 3,
        feedbackFile: '/resume.pdf',
        feedbackFileName: 'Feedback_Backend_Dev.pdf',
    },
]

export default INTERVIEWS
