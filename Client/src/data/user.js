// Dummy users data based on MongoDB schema
const USERS = [
    {
        _id: "69a84458a6fb5d47a0c99f0a",
        email: "eman_recruiter@gizasysem.com",
        name: "Eman Ahmed",
        password: "hashed_password_123",
        role: "recruiter",
        profile_image_url: "https://res.cloudinary.com/dzufxvqbb/image/upload/v1772635229/images/eman.png",
        profile_image_public_id: "images/eman_id",
        education: "Computer Science",
        job_title: "Machine Learning Engineer",
        location: "Cairo, Egypt",
        company_name: "Giza System",
        company_web_link: "https://gizasysems.com",
        jobs: [],
        created_at: "2026-03-04T14:40:24.853Z"
    },
    {
        _id: "69b22147c2da5e31a0b11f2c",
        email: "omar_dev@gmail.com",
        name: "Omar Khaled",
        password: "hashed_password_456",
        role: "jobseeker", // Job Seeker
        profile_image_url: "https://res.cloudinary.com/dzufxvqbb/image/upload/v1773087564/download_6_jkvzjn.jpg",
        profile_image_public_id: "images/omar_id",
        education: "Information Systems",
        job_title: "Frontend Developer",
        location: "Dubai, UAE",
        resumes: [ // إضافة اختيارية للتيست في الـ Modal
            { id: "r1", name: "My_Resume2.pdf", created_at: "20/2/2026",data:'/resume.pdf' },
            { id: "r2", name: "My_Resume.pdf", created_at: "15/1/2026" ,data:'/resume.pdf' }
        ],
        date_of_birth: "2004-06-15",
        applications: [], // To store job applications
        skills: ['React', 'HTML', 'CSS', 'Node', 'JavaScript', 'Python', 'Tailwind', 'REST APIs', 'AWS', 'Android', 'Kotlin'],
        socials: {
            github: "https://github.com/omar_khaled",
            linkedin: "https://linkedin.com/in/omar_khaled",
            website: "https://omarkhaled.dev",
            phone: "+971 50 123 4567"
        },
        stats: {
            totalApplications: 24,
            interviews: 8,
            accepted: 3
        },
        
        created_at: "2026-02-15T10:20:00.000Z"
    },
];

export default USERS;