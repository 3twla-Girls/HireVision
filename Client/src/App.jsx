import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/JobSeeker/Home'
import Job from './pages/JobSeeker/Job'
import Layout from './pages/shared/Layout'
import Login from './pages/shared/Login'
import Applications from './pages/JobSeeker/Applications'
import Interviews from './pages/JobSeeker/Interviews'
import InterviewLive from './pages/JobSeeker/InterviewLive'
import InterviewSetup from './pages/JobSeeker/InterviewSetup'
import Profile from './pages/JobSeeker/Profile'
import CandidateProfile from './pages/Recruiter/CandidateProfile'
import Dashboard from './pages/Recruiter/Dashboard'
import JobManagement from './pages/Recruiter/JobManagement'
import PostJob from './pages/Recruiter/PostJob'
import JobPreview from './pages/Recruiter/JobPreview'
import JobApplications from './pages/Recruiter/JobApplications'
import RecruiterProfile from './pages/Recruiter/RecruiterProfile'

const App = () => {
  const user = true
  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={!user ? <Login /> : <Layout />}>
          <Route index element={<Home />} />
          <Route path='job/:jobId' element={<Job />} />
          <Route path='applications' element={<Applications />} />
          <Route path='interviews' element={<Interviews />} />
          <Route path='profile' element={<Profile />} />
          <Route path='interview/:type/:jobName?' element={<InterviewSetup />} />
          <Route path='interview/:id/live' element={<InterviewLive />} />

          <Route path='profile' element={<Profile />} />

          {/* recruiter */}
          <Route path='candidate-profile/:applicationId' element={<CandidateProfile />} />
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='job-management' element={<JobManagement />} />
          <Route path='post-job' element={<PostJob />} />
          <Route path='job-preview/:jobId' element={<JobPreview />} />
          <Route path='job-applications/:jobId' element={<JobApplications/>} />
          <Route path='recruiter-profile' element={<RecruiterProfile />} />


        </Route>
      </Routes>
    </>
  )
}

export default App