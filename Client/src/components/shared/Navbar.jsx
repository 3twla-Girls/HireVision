import React from 'react'

const Navbar = ({ role }) => {
  return (
    <nav className="flex justify-between p-4 bg-slate-900 border-b border-slate-800">
      <div className="logo font-bold text-blue-500">HireVision</div>

      <div className="menu">
        {role === 'recruiter' ? (
          // Recruiter navbar
          <div className="flex gap-4 text-sm">
            <span>DASHBOARD</span>
            <span>JOBS</span>
            <span>INTERVIEWS</span>
          </div>
        ) : (
          // Jobseeker navbar
          <div className="flex gap-4 text-sm">
            <span>JOBS</span>
            <span>APPLICATIONS</span>
            <span>INTERVIEWS</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar