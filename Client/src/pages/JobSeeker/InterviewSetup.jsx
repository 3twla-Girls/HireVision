import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Headphones, Eye, Timer } from 'lucide-react';
import InterviewSetupModal from '../../components/JobSeeker/InterviewSetupModal';
import { INSTRUCTIONS_DATA } from '../../data/interviewInstruction';
import toast from 'react-hot-toast';

const InterviewSetup = () => {
  const { type, jobName } = useParams();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);

  const isMock = type === 'mock';
  const displayTitle = isMock ? "Mock Interview" : `Interview for: ${jobName}`;

  const handleStartInterview = (e) => {
    e.preventDefault();
    toast.success('Interview setup is complete! Starting your session...', { duration: 3000 });
    setShowSetup(true);
  };

  return (
    <div className="min-h-screen animate-fadeIn">
      <div className="grid grid-cols-12 gap-5 mx-auto px-[60px] py-12">
        <main className="col-start-2 col-span-10 flex flex-col items-center">
          
          {/* Title Section */}
          <div className="text-center mb-10 w-full">
            <h1 className="text-3xl font-bold text-dark-blue mb-4">{displayTitle}</h1>
            <p className="text-dark-gray3 text-sm max-w-lg mx-auto leading-relaxed">
              {isMock 
                ? "Ready to Ace Your Interview? Set up your session and follow our tips to get the most out of your mock interview."
                : "This is a real recruitment session. Please ensure your environment is ready before starting the AI evaluation."}
            </p>
          </div>

          {/* 3. Instructions Card - Mapping over data */}
          <div className="bg-white rounded-2xl p-6 px-10 mb-10 shadow-sm border border-light-gray1 w-full">
            <div className="space-y-2">
              {INSTRUCTIONS_DATA.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="bg-light-gray1 p-2 rounded-xl">
                    {item.icon}
                  </div>
                  <p className="text-sm text-dark-gray3 leading-relaxed">
                    <strong className="text-light-blue">{item.title}: </strong>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Section */}
          <form className="space-y-6 w-full" onSubmit={(e) => handleStartInterview(e)}>
            {isMock && (
              <div className="grid grid-cols-1 gap-2">
              <label className="text-dark-blue font-semibold text-sm ml-1">Job role:</label>
              <input 
                type="text" 
                defaultValue={isMock ? "" : jobName}
                disabled={!isMock}
                required={isMock}
                placeholder="e.g. Frontend Developer"
                className={`w-full border border-light-blue rounded-lg p-3 outline-none transition-all ${
                  !isMock ? 'bg-light-gray1 cursor-not-allowed opacity-70' : 'focus:ring-2 focus:ring-logo-blue/20'
                }`} 
                />
            </div>
            )}
            
            {isMock && (
            <div className="grid grid-cols-1 gap-2">
              <label className="text-dark-blue font-semibold text-sm ml-1">Job description:</label>
              <textarea 
                rows="5"
                // defaultValue={isMock ? "" : jobName}
                placeholder={isMock ? "Paste the job requirements here..." : "Details fetched from job post."}
                disabled={!isMock}
                required={isMock}
                className={`w-full border border-light-blue rounded-lg p-3 outline-none transition-all ${
                  !isMock ? 'bg-light-gray1 cursor-not-allowed opacity-70' : 'focus:ring-2 focus:ring-logo-blue/20'
                  }`}
                  ></textarea>
            </div>
                )}

            {/* Start Button */}
            <div className="flex justify-center mt-12 w-full">
              <button 
                type='submit'
                className="bg-dark-blue text-white px-24 py-3 rounded-xl font-bold text-lg 
                          hover:bg-light-blue transform hover:scale-[1.02] active:scale-[0.98] 
                          transition-all shadow-lg"
              >
                Start
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <InterviewSetupModal 
          setShowSetup={setShowSetup}
        />
      )}
    </div>
  );
};

export default InterviewSetup;