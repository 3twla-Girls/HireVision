import React from 'react'
import Navbar from '../../components/shared/Navbar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
    const role = 'recruiter'
  return (
    <>
        <Navbar role={role} />
        <Outlet />
    </>
  )
}

export default Layout