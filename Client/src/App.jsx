import React from 'react'
import { Route, Routes } from 'react-router-dom'
import {Toaster} from 'react-hot-toast'
import Home from './pages/JobSeeker/Home'
import Job from './pages/JobSeeker/Job'
import Layout from './pages/shared/Layout'
import Login from './pages/shared/Login'
import Applications from './pages/JobSeeker/Applications'
import Interviews from './pages/JobSeeker/Interviews'
import InterviewLive from './pages/JobSeeker/InterviewLive'
import InterviewSetup from './pages/JobSeeker/InterviewSetup'

const App = () => {
  const user = true
  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={ !user? <Login />:<Layout/>}>
          <Route index element={<Home />} />
          <Route path='job/:jobId' element={<Job />} />
          <Route path='applications' element={<Applications />} />
          <Route path='interviews' element={<Interviews />} />
          <Route path='interview/:type/:jobName?' element={<InterviewSetup />} />
          <Route path='interview/:id/live' element={<InterviewLive />} />
          <Route path='interview/mock' element={<InterviewSetup type='mock' />} />
          <Route path='interview/mock/live' element={<InterviewLive type='mock' />} />
        </Route>
      </Routes>
    </>
  )
}

export default App