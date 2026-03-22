import React, { useState, useEffect } from 'react'
import Navbar from '../../components/shared/Navbar'
import { Outlet } from 'react-router-dom'

// ── Current user IDs (temporary until auth is wired up) ──────────────────────
const USER_IDS = {
  jobseeker: '69aa315763b720c25373f035',
  recruiter:  '69aa302c63b720c25373f034',
}

const Layout = () => {
  // const role = 'jobseeker';
  const role = 'recruiter';

  const [profileImageUrl, setProfileImageUrl] = useState(null)

  useEffect(() => {
    const userId = USER_IDS[role]
    if (!userId) return
    fetch(`/api/v1/user/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user?.profile_image_url) {
          setProfileImageUrl(data.user.profile_image_url)
        }
      })
      .catch(() => {})
  }, [role])

  return (
    <div className="min-h-screen bg-light-gray1">
      <Navbar role={role} profileImageUrl={profileImageUrl} />
      <Outlet />
    </div>
  )
}

export default Layout
