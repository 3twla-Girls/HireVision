import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Menu, X, PlusCircle } from 'lucide-react'
import { assets } from '../../assets/assets'
import USERS from '../../data/user';

// Mock finding the current logged-in user
const currentUser = USERS.find((user) => user.role === 'jobseeker');

const Navbar = ({ role }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const jobSeekerLinks = [
    { label: 'JOBS', path: '/' },
    { label: 'APPLICATIONS', path: '/applications' },
    { label: 'INTERVIEWS', path: '/interviews' },
  ]

  const recruiterLinks = [
    { label: 'DASHBOARD', path: '/dashboard' },
    { label: 'APPLICATIONS', path: '/applications' },
    { label: 'INTERVIEWS', path: '/interviews' },
  ]

  const links = role === 'recruiter' ? recruiterLinks : jobSeekerLinks

  return (
    <nav className="bg-dark-blue sticky top-0 z-50 shadow-md">
      {/* Desktop Navbar */}
      <div className="px-4 md:px-8 lg:px-[60px] grid grid-cols-12 items-center h-20">

        {/* Logo Section */}
        <div className="col-span-6 lg:col-span-3">
          <Link to="/" className="flex items-center">
            <img src={assets.logo} alt="HireVision" className="h-8 object-contain" />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Hire</span>
              <span className="text-orange">Vision</span>
            </span>
          </Link>
        </div>

        {/* Navigation Links - Center */}
        <div className="hidden lg:flex col-span-6 justify-center items-center h-full gap-3">
          {links.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`text-[15px] tracking-wide px-5 py-2 rounded-full transition-all duration-200 ${isActive
                  ? 'bg-white text-dark-blue font-bold shadow-sm'
                  : 'text-white/70 font-medium hover:bg-white/10 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right Side - Actions & Profile */}
        <div className="col-span-6 lg:col-span-3 flex items-center justify-end gap-6">

          {/* Search Bar - Shown for Jobseeker on desktop */}
          {role !== 'recruiter' && (
            <div className="hidden xl:flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 w-48 focus-within:ring-2 focus-within:ring-white/30">
              <Search size={18} className="text-white/60" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="bg-transparent outline-none text-xs text-white placeholder-white/50 w-full"
              />
            </div>
          )}

          {/* Post a Job Button - Only for Recruiter */}
          {role === 'recruiter' && (
            <Link
              to="/post-job"
              className="hidden md:flex items-center gap-2 bg-dark-blue text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-light-blue transition-colors shadow-md"
            >
              <PlusCircle size={18} />
              Post a Job
            </Link>
          )}

          {/* User Avatar */}
          <Link to="/profile" className="flex-shrink-0">
            <img
              src={currentUser?.profile_image_url || "https://via.placeholder.com/40"}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-white/30 object-cover hover:border-white transition-colors bg-white/10"
            />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-1 hover:bg-white/10 rounded-md"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-light-gray2 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-4 gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-xl text-[16px] font-bold transition-all ${isActive
                    ? 'bg-light-gray1 text-dark-blue shadow-sm'
                    : 'text-dark-gray3 hover:bg-gray-50'
                    }`}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* Mobile-only action for Recruiter */}
            {role === 'recruiter' && (
              <Link
                to="/post-job"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 bg-dark-blue text-white py-4 rounded-xl font-bold shadow-lg"
              >
                Post a Job
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar