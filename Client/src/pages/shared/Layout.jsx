import React from 'react'
import Navbar from '../../components/shared/Navbar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
    // const role = 'jobseeker'; 
    const role = 'jobseeker'; // Change to 'recruiter' to test recruiter navbar
  return (
    <div className="min-h-screen bg-light-gray1">
        <Navbar role={role} />
        <Outlet />
    </div>
  )
}

export default Layout