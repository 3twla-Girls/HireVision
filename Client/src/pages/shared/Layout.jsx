import React, { useState, useEffect } from 'react'
import Navbar from '../../components/shared/Navbar'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext';

// ── Current user IDs (temporary until auth is wired up) ──────────────────────
// const USER_IDS = {
//   jobseeker: '69aa315763b720c25373f035',
//   recruiter: '69aa302c63b720c25373f034',
// }
// const user = JSON.parse(sessionStorage.getItem("user"));
const Layout = () => {
  // const role = 'jobseeker';
  const { userData } = useAuth();
  const role = userData.role;

  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const location = useLocation()

  // useEffect(() => {
  //   // const userId = USER_IDS[role]
  //   const userId = user._id
  //   if (!userId) {
  //     console.log("There is no user id!")
  //     return
  //   }
  //   fetch(`/api/v1/user/${userId}`)
  //     .then((r) => (r.ok ? r.json() : null))
  //     .then((data) => {
  //       if (data?.user?.profile_image_url) {
  //         setProfileImageUrl(data.user.profile_image_url)
  //         console.log("setting user image done")
  //       }
  //     })
  //     .catch((e) => {
  //       console.log("error in fetching user")
  //     })
  // }, [role])

  const isRegisterPage = location.pathname === '/Register'

  return (
    <div className="min-h-screen bg-light-gray1">
      {!isRegisterPage && <Navbar role={role} profileImageUrl={profileImageUrl} />}
      <Outlet />
    </div>
  )
}

export default Layout
