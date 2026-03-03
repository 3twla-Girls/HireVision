import React from 'react'
import { assets } from '../../assets/assets';

const Navbar = ({ role }) => {
  const selectedTabStyle = "font-bold p-2 border-b-4 border-dark-blue";
  const defaultTabStyle = "p-2 hover:text-gray-900";
  const selectedTab = role === 'jobseeker' ? 'JOBS' : 'DASHBOARD';
  return (
    <nav className="flex justify-between p-4 px-20 border-b border-slate-800 h-[100px]">
      <div className="logo flex items-center font-bold text-3xl">
        <img src={assets.logo} alt="HireVision Logo" className='w-8'/>
        <span className='text-logo-blue'>Hire</span>
        <span className="text-orange">Vision</span>
      </div>
      
      {role === 'jobseeker' ? (
        // Jobseeker navbar
        <div className='menu flex-1 flex gap-10 items-center justify-evenly'>
          <div className="flex gap-20 text-lg text-dark-blue">
            <span className={selectedTab === 'JOBS' ? selectedTabStyle : defaultTabStyle}>JOBS</span>
            <span className={selectedTab === 'APPLICATIONS' ? selectedTabStyle : defaultTabStyle}>APPLICATIONS</span>
            <span className={selectedTab === 'INTERVIEWS' ? selectedTabStyle : defaultTabStyle}>INTERVIEWS</span>
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
            <span className={selectedTab === 'DASHBOARD' ? selectedTabStyle : defaultTabStyle}>DASHBOARD</span>
            <span className={selectedTab === 'APPLICATIONS' ? selectedTabStyle : defaultTabStyle}>APPLICATIONS</span>
            <span className={selectedTab === 'INTERVIEWS' ? selectedTabStyle : defaultTabStyle}>INTERVIEWS</span>
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