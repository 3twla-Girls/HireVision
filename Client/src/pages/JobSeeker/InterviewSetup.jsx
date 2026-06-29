import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Camera, Headphones, Eye, Timer, X } from 'lucide-react';
import InterviewSetupModal from '../../components/JobSeeker/InterviewSetupModal';
import { INSTRUCTIONS_DATA } from '../../data/interviewInstruction';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const EXPERIENCE_LEVEL = [
  { value: "junior", label: "Junior" },
  { value: "mid-level", label: "Mid-level" },
  { value: "senior", label: "Senior" }
];

const InterviewSetup = () => {
  const { type, jobName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSetup, setShowSetup] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const isMock = type === 'mock';
  const existingSessionId = location.state?.sessionId ?? null;  // passed from upcoming card
  const existingJobId     = location.state?.jobId     ?? null;  // passed from upcoming card
  const displayTitle = isMock ? "Mock Interview" : `Interview for: ${decodeURIComponent(jobName ?? '')}`;

  const [formData, setFormData] = useState({
    job_title: jobName ?? '',
    required_skills: [],
    experience_level: "Mid-level",
    num_questions: 5, 
  });

  const handleStartInterview = async(e) => {
    e.preventDefault();
    
    if (isMock && formData.required_skills.length === 0) {
      toast.error("Please add at least one skill for the mock interview");
      return;
    }
    
    toast.success('Interview setup is complete! Starting your session...', { duration: 3000 });
    setShowSetup(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.required_skills.includes(skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          required_skills: [...prev.required_skills, skillInput.trim()]
        }));
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skillToRemove)
    }));
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

          {/* Instructions Card */}
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
          {isMock ? (
            <form className="space-y-6 w-full mx-auto" onSubmit={handleStartInterview}>
              {/* Job Title Input */}
              <div className="flex flex-col gap-2">
                <label className="text-dark-blue font-bold text-sm ml-1 uppercase tracking-wider">
                  Job role:
                </label>
                <input 
                  type="text" 
                  name="job_title"
                  required 
                  value={formData.job_title} 
                  onChange={handleInputChange}
                  placeholder="e.g. Frontend Developer"
                  className="w-full border-2 border-light-blue/30 rounded-xl p-4 outline-none transition-all 
                            focus:ring-4 focus:ring-logo-blue/10 focus:border-dark-blue bg-white/50" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-dark-blue font-bold text-sm ml-1 uppercase tracking-wider">
                  Number of questions:
                </label>
                <input 
                  type="number" 
                  name="num_questions"
                  required 
                  min="1"
                  max="15"
                  value={formData.num_questions} 
                  onChange={handleInputChange}
                  className="w-full border-2 border-light-blue/30 rounded-xl p-4 outline-none transition-all 
                            focus:ring-4 focus:ring-logo-blue/10 focus:border-dark-blue bg-white/50" 
                />
              </div>

              {/* Experience Level Select */}
              <div className="flex flex-col gap-2">
                <label className="text-dark-blue font-bold text-sm ml-1 uppercase tracking-wider">
                  Experience Level:
                </label>
                <select 
                  name="experience_level"
                  value={formData.experience_level} 
                  onChange={handleInputChange}
                  className="w-full bg-white border-2 border-light-blue/30 p-4 rounded-xl outline-none 
                            focus:border-dark-blue transition-all cursor-pointer font-medium text-dark-blue appearance-none"
                >
                  <option value="" disabled>Select your level</option>
                  {EXPERIENCE_LEVEL.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>

              {/* Skills Input Section */}
              <div className="flex flex-col gap-2">
                <label className="text-dark-blue font-bold text-sm ml-1 uppercase tracking-wider">
                  Skills (Press Enter to add):
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.required_skills.map(skill => (
                    <span 
                      key={skill} 
                      className="bg-dark-blue text-white px-4 py-2 rounded-lg text-sm font-semibold 
                                flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                    >
                      {skill}
                      <X 
                        size={16} 
                        className="cursor-pointer hover:text-red-400 transition-colors" 
                        onClick={() => removeSkill(skill)} 
                      />
                    </span>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={skillInput} 
                  onChange={(e) => setSkillInput(e.target.value)} 
                  onKeyDown={addSkill}
                  placeholder={formData.required_skills.length === 0 ? "Type a skill and hit Enter..." : "Add more..."}
                  className="w-full p-4 bg-gray-50 border-2 border-dashed border-light-blue/50 rounded-xl 
                            outline-none focus:border-dark-blue focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Start Button Mock */}
              <div className="flex justify-center pt-6">
                <button 
                  type="submit"
                  className="bg-dark-blue text-white px-16 py-4 rounded-2xl font-black text-xl 
                            hover:bg-dark-blue transform hover:-translate-y-1 active:scale-95 
                            transition-all shadow-[0_8px_0_rgb(27,60,83,0.2)] hover:shadow-lg w-full md:w-auto"
                >
                  Start Mock Interview
                </button>
              </div>
            </form>
          ) : (
            <form className="flex justify-center mt-12 w-full" onSubmit={handleStartInterview}>
              <button 
                type='submit'
                className="bg-dark-blue text-white px-24 py-3 rounded-xl font-bold text-lg 
                          hover:bg-light-blue transform hover:scale-[1.02] active:scale-[0.98] 
                          transition-all shadow-lg"
              >
                Start
              </button>
            </form>
          )}
          
        </main>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <InterviewSetupModal 
          setShowSetup={setShowSetup} isMock={isMock} jobInfo={formData}
          existingSessionId={existingSessionId}
          existingJobId={existingJobId}
        />
      )}
    </div>
  );
};

export default InterviewSetup;