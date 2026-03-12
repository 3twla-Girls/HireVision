import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, MapPin, GraduationCap, Send, X, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

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
  { value: "expired", label: "Expired" }
];

const WORKPLACE_TYPES = [
  { value: "on_site", label: "On-site" },
  { value: "remote", label: "Remote (Online)" },
  { value: "hybrid", label: "Hybrid" }
];

const EditJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [skillInput, setSkillInput] = useState("");

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
    num_questions: 5,
    number_of_questions_per_interview: 3
  });

    useEffect(() => {
    // 1️⃣ حماية: لو الـ jobId لسه مش موجود في الـ URL، اخرج وم تعملش حاجة
    if (!jobId || jobId === "undefined") return;

    const fetchJobData = async () => {
      try {
        setFetching(true); // نبدأ التحميل
        const response = await api.get(`/job/${jobId}`);
        const job = response.data;

        // 2️⃣ حماية من الـ null في الـ location
        const locationParts = job?.location ? job.location.split(', ') : ["", ""];

        setFormData({
          job_title: job?.job_title || "",
          job_description: job?.job_description || "",
          required_skills: job?.required_skills || [],
          required_experience: job?.required_experience || "",
          required_education: job?.required_education || "",
          status: job?.status || "open",
          country: locationParts[1] || "",
          city: locationParts[0] || "",
          job_type: job?.job_type || "full_time",
          workplace: job?.workplace || "on_site",
          num_questions: job?.num_questions || 5,
          number_of_questions_per_interview: job?.number_of_questions_per_interview || 3
        });
        
        setFetching(false); // كدة الداتا وصلت، نقدر نعرض الفورم
      } catch (error) {
        console.error("Error fetching job:", error);
        toast.error("Failed to load job data");
        navigate('/job-management');
      }
    };

    fetchJobData();
  }, [jobId, navigate]);

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
    setLoading(true);

    const finalData = {
      ...formData,
      num_questions: parseInt(formData.num_questions),
      number_of_questions_per_interview: parseInt(formData.number_of_questions_per_interview),
      location: `${formData.city}, ${formData.country}`,
    };

    try {
      const response = await api.patch(`/job/${jobId}`, finalData);
      
      if (response.data.signal === "JOB_UPDATED_SUCCESSFULLY" || response.status === 200) {
        toast.success('Job updated successfully!');
        navigate(`/job-preview/${jobId}`);
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !jobId || jobId === "undefined") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF914D] mb-4"></div>
        <p className="text-[#1B3C53] font-bold italic">Loading Vacancy Details...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 md:px-[60px] py-10 grid grid-cols-12 gap-8">
        
        {/* Header */}
        <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-[#1B3C53] flex items-center gap-3 italic tracking-tight uppercase">
               <Edit3 className="bg-[#1B3C53] text-white p-1 rounded-lg shadow-lg" size={32} />
               Update Vacancy
            </h1>
            <p className="text-[#456882] font-medium mt-1">Editing: <span className="text-[#FF914D]">{formData.job_title}</span></p>
          </div>
        </div>

        {/* Main Content (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#FF914D]"></div>
            <h3 className="text-xl font-bold text-[#1B3C53] mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-[#FF914D]" />
              Role Description
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Job Title</label>
                <input 
                  type="text" required name="job_title" value={formData.job_title} onChange={handleInputChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#1B3C53]/10 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Job Description</label>
                <textarea 
                  required name="job_description" rows="10" value={formData.job_description} onChange={handleInputChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#1B3C53]/10 outline-none transition-all font-medium leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#1B3C53] mb-6 flex items-center gap-2">
              <GraduationCap size={22} className="text-[#FF914D]" />
              Candidate Requirements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Required Experience</label>
                <input 
                  type="text" required name="required_experience" value={formData.required_experience} onChange={handleInputChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1B3C53]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Required Education</label>
                <input 
                  type="text" required name="required_education" value={formData.required_education} onChange={handleInputChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1B3C53]/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#456882] uppercase tracking-widest mb-2">Required Skills (Press Enter to add)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.required_skills.map(skill => (
                  <span key={skill} className="bg-[#1B3C53] text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                    {skill}
                    <X size={14} className="cursor-pointer hover:text-[#FF914D]" onClick={() => removeSkill(skill)} />
                  </span>
                ))}
              </div>
              <input 
                type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill}
                placeholder="Add more skills..."
                className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl outline-none focus:border-[#FF914D] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#1B3C53] p-8 rounded-[2.5rem] shadow-2xl text-white sticky top-10">
            <h3 className="text-xl font-bold mb-8 border-b border-white/10 pb-4 italic tracking-tight">UPDATE CONFIG</h3>
            
            <div className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Job Type</label>
                <select 
                  name="job_type" value={formData.job_type} onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none cursor-pointer font-bold"
                >
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value} className="text-[#1B3C53]">{t.label}</option>)}
                </select>
              </div>

              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Workplace</label>
                <select 
                  name="workplace" value={formData.workplace} onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none cursor-pointer font-bold"
                >
                  {WORKPLACE_TYPES.map(w => <option key={w.value} value={w.value} className="text-[#1B3C53]">{w.label}</option>)}
                </select>
              </div>

              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Current Status</label>
                <select 
                  name="status" value={formData.status} onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none cursor-pointer font-bold"
                >
                  {JOB_STATUS.map(s => <option key={s.value} value={s.value} className="text-[#1B3C53]">{s.label}</option>)}
                </select>
              </div>

              <div className="pt-4 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 block">Primary Location</label>
                <input 
                  type="text" placeholder="Country" name="country" value={formData.country} onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#FF914D]"
                />
                <input 
                  type="text" placeholder="City" name="city" value={formData.city} onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#FF914D]"
                />
              </div>
            </div>

            <button 
              onClick={handleSubmit} disabled={loading}
              className="w-full mt-10 bg-[#FF914D] hover:bg-white hover:text-[#FF914D] text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 text-lg uppercase tracking-widest"
            >
              {loading ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditJob;