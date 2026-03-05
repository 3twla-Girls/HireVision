import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ApplyModal = ({ setShowApply, jobTitle }) => {

  const resumes = [
    { id: 1, name: "My_Resume2.pdf", uploadedAt: "20/2/2026" },
    { id: 2, name: "My_Resume.pdf", uploadedAt: "15/1/2026" },
  ];

  const [selectedResume, setSelectedResume] = useState(resumes[0]); // Example selected resume, replace with actual logic
  const selectedResumeStyle = "bg-gray-100";

  const onClose = () => {
    setShowApply(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Application submitted successfully!');
    onClose();
  }

  const handleResumeUpload = () => {
    // Handle resume upload logic here
    toast.success('Resume uploaded successfully!');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-10 py-6 border-b border-gray-100">
          <h2 className="text-2xl font-medium text-dark-blue">
            Apply for: <span className="font-bold ml-1">{jobTitle || "Job Position Title"}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-3xl font-bold text-dark-blue hover:text-red-500 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form className="p-10 pb-4 space-y-8" onSubmit={(e) => handleSubmit(e)}>
          
          {/* Experience Field */}
          <div className="space-y-3">
            <label className="block text-lg font-medium text-dark-blue">
              your years of experience in this field:
            </label>
            <input 
              type="number" required min="0" placeholder="e.g. 3"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-400 outline-none transition-all"
            />
          </div>

          {/* Resume Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark-blue">Resume</h3>
            
            <div className="space-y-3">
              {resumes.map((resume) => (
                <label 
                  onClick={()=>setSelectedResume(resume)}
                  key={resume.id} 
                  className={`flex items-center justify-between border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedResume.id === resume.id ? selectedResumeStyle : ""}`}
                >
                  <div className="flex gap-4 items-center">
                    <span className="font-medium text-light-blue">{resume.name}</span>
                    <span className="text-sm text-light-blue">uploaded {resume.uploadedAt}</span>
                  </div>
                  <input type="radio" name="resume" className="w-5 h-5 accent-dark-blue" checked={selectedResume.id === resume.id} readOnly />
                </label>
              ))}
            </div>

            <button type='button' onClick={()=>handleResumeUpload()} className="mt-2 px-6 py-2 border border-dark-blue text-dark-blue rounded-lg font-semibold hover:bg-slate-50 transition-colors">
              Upload Resume
            </button>
          </div>

          {/* Footer / Action Button */}
          <div className="p-10 pt-0 flex justify-end">
            <button 
              className="bg-dark-blue text-white px-12 py-3 rounded-lg font-bold text-lg hover:bg-slate-800 transition-all shadow-lg"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ApplyModal;