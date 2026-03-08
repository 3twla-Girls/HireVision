import React from 'react';
import { useNavigate } from 'react-router-dom';

const Interviews = () => {
  const navigate = useNavigate();

  const demoJob = {
    title: "Frontend-Developer",
    id: "123"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-2xl font-bold text-dark-blue mb-4">Test Interview Setup</h1>
      
      <div className="flex gap-4">
        <button 
          onClick={() => navigate('/interview/mock')}
          className="bg-light-blue text-white px-8 py-3 rounded-lg font-bold hover:bg-dark-blue transition-all shadow-md"
        >
          Try Mock Interview
        </button>

        <button 
          onClick={() => navigate(`/interview/real/${demoJob.title}`)}
          className="bg-orange text-white px-8 py-3 rounded-lg font-bold hover:bg-light-orange transition-all shadow-md"
        >
          Try Real Interview (Demo Job)
        </button>
      </div>

      <p className="text-dark-gray3 text-sm mt-4 italic">
        * This is a temporary testing page to verify the routing logic.
      </p>
    </div>
  );
};

export default Interviews;