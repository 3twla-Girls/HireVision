import React, { useState } from 'react'
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';

const Navbar = ({ role }) => {
  const [selectedTab, setSelectedTab] = useState(role === 'jobseeker' ? 'JOBS' : 'DASHBOARD');
  const selectedTabStyle = "font-bold p-2 border-b-4 border-dark-blue";
  const defaultTabStyle = "p-2 hover:text-gray-900";
  return (
    <nav className="flex sticky top-0 z-10 bg-light-gray1 justify-between p-4 px-20 border-b border-light-gray2 ">
      <Link to="/" onClick={()=>setSelectedTab('JOBS')} className="logo flex items-center font-bold text-3xl cursor-pointer">
        <img src={assets.logo} alt="HireVision Logo" className='w-8'/>
        <span className='text-logo-blue'>Hire</span>
        <span className="text-orange">Vision</span>
      </Link>
      
      {role === 'jobseeker' ? (
        // Jobseeker navbar
        <div className='menu flex-1 flex gap-10 items-center justify-evenly'>
          <div className="flex gap-20 text-lg text-dark-blue">
            <Link to="/" onClick={() => setSelectedTab('JOBS')} className={selectedTab === 'JOBS' ? selectedTabStyle : defaultTabStyle}>JOBS</Link>
            <Link to="/applications" onClick={() => setSelectedTab('APPLICATIONS')} className={selectedTab === 'APPLICATIONS' ? selectedTabStyle : defaultTabStyle}>APPLICATIONS</Link>
            <Link to="/interviews" onClick={() => setSelectedTab('INTERVIEWS')} className={selectedTab === 'INTERVIEWS' ? selectedTabStyle : defaultTabStyle}>INTERVIEWS</Link>
          </div>
          {/* search bar for jobseeker */}
          <div>
            <input type="text" placeholder="Search jobs..." className='ml-4 px-2 py-1 rounded-md border border-light-gray2 focus:outline-none focus:ring-2 focus:ring-light-blue' />
          </div>
          {/* profile icon for jobseeker */}
          <div className="ml-4">
            <img src={assets.profileIcon} alt="Profile" className='w-8 h-8 bg-light-gray2 rounded-full'/>
          </div>
        </div>
      ) : (
        // Recruiter navbar
        <div className='menu flex-1 flex gap-10 items-center justify-evenly'>
          <div className="flex gap-20 text-lg text-dark-blue">
            <Link to="/dashboard" onClick={() => setSelectedTab('DASHBOARD')} className={selectedTab === 'DASHBOARD' ? selectedTabStyle : defaultTabStyle}>DASHBOARD</Link>
            <Link to="/applications" onClick={() => setSelectedTab('APPLICATIONS')} className={selectedTab === 'APPLICATIONS' ? selectedTabStyle : defaultTabStyle}>APPLICATIONS</Link>
            <Link to="/interviews" onClick={() => setSelectedTab('INTERVIEWS')} className={selectedTab === 'INTERVIEWS' ? selectedTabStyle : defaultTabStyle}>INTERVIEWS</Link>
          </div>
          <div className='flex items-center gap-10'>
            {/* Post a job button for recruiter */}
            <button className="bg-dark-blue text-lg text-white px-7 py-2 rounded-md hover:bg-light-blue transition duration-200">
              Post a Job
            </button>
            {/* profile icon for recruiter */}
            <div className="ml-4">
              <img src={assets.profileIcon} alt="Profile" className='w-8 h-8 bg-light-gray2 rounded-full'/>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
};

export default Navbar