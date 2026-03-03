import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Menu, X } from 'lucide-react'
import { assets } from '../../assets/assests'

const Navbar = ({ role }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const jobSeekerLinks = [
    { label: 'JOBS', path: '/' },
    { label: 'APPLICATIONS', path: '/applications' },
    { label: 'INTERVIEWS', path: '/interviews' },
  ]

  const recruiterLinks = [
    { label: 'JOBS', path: '/' },
    { label: 'APPLICATIONS', path: '/applications' },
    { label: 'INTERVIEWS', path: '/interviews' },
  ]

  const links = role === 'recruiter' ? recruiterLinks : jobSeekerLinks

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-light-gray2">
      {/* Desktop Navbar */}
      <div className="px-4 md:px-8 lg:px-[60px] grid grid-cols-12 gap-5 items-end">

        {/* Logo — first 3 columns */}
        <div className="col-span-6 lg:col-span-3 py-4">
          <Link to="/" className="flex items-center">
            <img src={assets.hireLogo} alt="HireVision" className="h-8 md:h-10 object-contain" />
            <span className="text-2xl md:text-3xl font-bold leading-none -ml-3">
              <span className="text-logo-blue">Hire</span>
              <span className="text-orange">Vision</span>
            </span>
          </Link>
        </div>

        {/* Nav Links — center 6 columns (hidden on mobile) */}
        <div className="hidden lg:flex col-span-6 items-end justify-center gap-14">
          {links.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`text-base tracking-wider py-4 px-3 transition-colors ${isActive
                  ? 'text-dark-blue font-semibold border-b-[3px] border-dark-blue'
                  : 'text-dark-gray3 font-normal hover:text-dark-blue border-b-[3px] border-transparent'
                  }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right — Search + Avatar (hidden on mobile) + Hamburger */}
        <div className="col-span-6 lg:col-span-3 flex items-center justify-end gap-4 py-3">
          {/* Search Bar — hidden on small screens */}
          <div className="hidden md:flex items-center gap-2 border border-dark-blue rounded-lg px-4 py-1.5 flex-1 max-w-[200px]">
            <Search size={15} className="text-dark-blue shrink-0" />
            <input
              type="text"
              placeholder="search"
              className="bg-transparent outline-none text-sm text-dark-blue w-full placeholder:text-dark-blue text-center"
            />
          </div>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-light-gray2 flex items-center justify-center text-dark-gray3 font-semibold text-sm shrink-0">
            T
          </div>

          {/* Hamburger Button — visible only on mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-dark-blue p-1"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-light-gray2 px-4 pb-4">
          {/* Mobile Nav Links */}
          <div className="flex flex-col gap-1 pt-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-lg text-base tracking-wide transition-colors ${isActive
                      ? 'text-dark-blue font-semibold bg-light-gray1'
                      : 'text-dark-gray3 font-normal hover:bg-light-gray1 hover:text-dark-blue'
                    }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile Search */}
          <div className="md:hidden flex items-center gap-2 border border-dark-blue rounded-lg px-4 py-2 mt-3">
            <Search size={15} className="text-dark-blue shrink-0" />
            <input
              type="text"
              placeholder="search"
              className="bg-transparent outline-none text-sm text-dark-blue w-full placeholder:text-dark-blue"
            />
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar