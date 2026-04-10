import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, GraduationCap, Clock, Send, Plus, X, ListOrdered, Shuffle, Calendar, Users, Target, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const JOB_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" }
];

const JOB_STATUS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const WORKPLACE_TYPES = [
  { value: "on_site", label: "On-site" },
  { value: "remote", label: "Remote (Online)" },
  { value: "hybrid", label: "Hybrid" }
];

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const { userData } = useAuth();
  const recruiterId = userData?._id;

  const [formData, setFormData] = useState({
    job_title: "",
    job_description: "",
    required_skills: [],
    required_experience: "",
    required_education: "",
    status: "open",
    country: "",
    city: "",
    job_type: "full_time",
    workplace: "on_site",
    num_questions: 10,
    number_of_questions_per_interview: 5,
    // Automation Fields
    expiry_date: "", 
    max_applications_count: 50, 
    top_candidates_count: 15, 
    interview_gap_days: 5, 
    // min_matching_score: 70 
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.required_skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }
    
    setLoading(true);

    const finalData = {
      ...formData,
      num_questions: parseInt(formData.num_questions) || 10,
      number_of_questions_per_interview: parseInt(formData.number_of_questions_per_interview) || 5,
      max_applications_count: parseInt(formData.max_applications_count) || 50,
      top_candidates_count: parseInt(formData.top_candidates_count) || 15,
      interview_gap_days: parseInt(formData.interview_gap_days) || 5,
      location: [formData.city, formData.country].filter(Boolean).join(", ") || "Unspecified",
      job_recruiter_id: recruiterId 
    };

    try {
      const response = await api.post(`/job/create/${recruiterId}`, finalData);
      
      if (response.data.signal === "JOB_CREATED_SUCCESSFULLY") {
        const newJobId = response.data.job_id;
        toast.success('Job created! Now generating interview questions...');

        try {
          toast.loading("AI is crafting your interview questions...", { id: "gen_loading" });
          await api.post(`/questions/generate-interview-questions/${newJobId}`);
          toast.success("AI questions generated successfully!", { id: "gen_loading" });
        } catch (genError) {
          console.error("Question Generation Error:", genError);
          toast.error("Job created, but question generation failed.", { id: "gen_loading" });
        }

        setTimeout(() => {
          navigate(`/job-preview/${newJobId}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Full Error:", error);
      if (error.response?.status === 422) {
        toast.error("Validation failed. Description must be at least 10 characters long.");
      } else if (error.response?.data?.signal === "JOB_ALREADY_EXISTS") {
        toast.error("A job with this title and location already exists.");
      } else {
        toast.error("Failed to post job. Please check all required fields.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 md:px-[60px] py-10 grid grid-cols-12 gap-8">
        
        {/* Header */}
        <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-[#1B3C53] flex items-center gap-3 italic tracking-tight">
                <Plus className="bg-[#FF914D] text-white p-1 rounded-lg shadow-lg" size={32} />
                POST NEW VACANCY
            </h1>
            <p className="text-[#456882] font-medium mt-1">Define the role and let HireVision AI find your perfect match.</p>
          </div>
        </div>

        {/* Main Content (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Card: Role Details */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#1B3C53]"></div>
            <h3 className="text-xl font-bold text-[#1B3C53] mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-[#FF914D]" />
              Role Description
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Job Title</label>
                <input type="text" required name="job_title" value={formData.job_title} onChange={handleInputChange} placeholder="e.g. Frontend developer" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#1B3C53]/10 outline-none transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Job Description</label>
                <textarea required name="job_description" rows="10" value={formData.job_description} onChange={handleInputChange} placeholder="Describe the mission..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#1B3C53]/10 outline-none transition-all font-medium leading-relaxed"></textarea>
              </div>
            </div>
          </div>

          {/* Card: Requirements */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#1B3C53] mb-6 flex items-center gap-2">
              <GraduationCap size={22} className="text-[#FF914D]" />
              Candidate Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Required Experience</label>
                <input type="text" required name="required_experience" value={formData.required_experience} onChange={handleInputChange} placeholder="e.g. 2-4 years" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1B3C53]/10" />
              </div>
              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Required Education</label>
                <input type="text" required name="required_education" value={formData.required_education} onChange={handleInputChange} placeholder="e.g. Bachelor's Degree" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1B3C53]/10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Required Skills</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.required_skills.map(skill => (
                  <span key={skill} className="bg-[#1B3C53] text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 group">
                    {skill} <X size={14} className="cursor-pointer hover:text-[#FF914D]" onClick={() => removeSkill(skill)} />
                  </span>
                ))}
              </div>
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder="Type a skill and hit Enter..." className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl outline-none focus:border-[#FF914D] transition-all" />
            </div>
          </div>

          {/* --- NEW: Automation & Ranking (Centered and Dark Styled) --- */}
          <div className="bg-[#1B3C53] p-10 rounded-[2.5rem] shadow-2xl text-white">
            <h3 className="text-2xl font-black mb-8 border-b border-white/10 pb-4 italic tracking-tight flex items-center gap-3">
              <Zap className="text-[#FF914D] fill-[#FF914D]" size={22} />
              AI AUTOMATION & RANKING
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 block flex items-center gap-2">
                    <Calendar size={14} className="text-[#FF914D]" /> Application Closing Date
                  </label>
                  <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold text-white" />
                </div>

                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 block flex items-center gap-2">
                    <Users size={14} className="text-[#FF914D]" /> Maximum Applicants Count
                  </label>
                  <input type="number" name="max_applications_count" value={formData.max_applications_count} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 block flex items-center gap-2">
                    <Target size={14} className="text-[#FF914D]" /> Top Candidates to Shortlist
                  </label>
                  <input type="number" name="top_candidates_count" value={formData.top_candidates_count} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold" />
                </div>

                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 block flex items-center gap-2">
                    <Clock size={14} className="text-[#FF914D]" /> Interview Start Gap (Days)
                  </label>
                  <input type="number" name="interview_gap_days" value={formData.interview_gap_days} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#1B3C53] p-8 rounded-[2.5rem] shadow-2xl text-white sticky top-10">
            <h3 className="text-xl font-bold mb-8 border-b border-white/10 pb-4 italic tracking-tight">JOB CONFIGURATION</h3>
            
            <div className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Job Type</label>
                <select name="job_type" value={formData.job_type} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all cursor-pointer font-bold">
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value} className="text-[#1B3C53]">{t.label}</option>)}
                </select>
              </div>

              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Workplace</label>
                <select name="workplace" value={formData.workplace} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all cursor-pointer font-bold">
                  {WORKPLACE_TYPES.map(w => <option key={w.value} value={w.value} className="text-[#1B3C53]">{w.label}</option>)}
                </select>
              </div>

              <div className="pt-4 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 block">Primary Location</label>
                <input type="text" placeholder="Country" name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#FF914D]" />
                <input type="text" placeholder="City" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#FF914D]" />
              </div>

              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-4 mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF914D]">AI Interview Settings</h4>
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block flex items-center gap-2"><ListOrdered size={12} /> Questions Bank Size</label>
                  <input type="number" name="num_questions" value={formData.num_questions} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold" />
                </div>
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block flex items-center gap-2"><Shuffle size={12} /> Questions Per Session</label>
                  <input type="number" name="number_of_questions_per_interview" value={formData.number_of_questions_per_interview} onChange={handleInputChange} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold" />
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full mt-10 bg-[#FF914D] hover:bg-white hover:text-[#FF914D] text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 text-lg uppercase tracking-widest">
              {loading ? "PROCESSING..." : <><Send size={20} /> PUBLISH JOB</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;