import React from 'react';
import {
  MapPin,
  Download,
  Github,
  Linkedin,
  Globe,
  Mail,
  Eye,
  FileText,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  Settings,
  PenTool,
  Layout,
  Server,
  Code,
  Terminal,
  Wind,
  Database,
  Trash2,
  Upload,
  Edit3
} from 'lucide-react';
import { assets } from '../../assets/assets';


import USERS from '../../data/user';
import FeedbackModal from '../../components/JobSeeker/FeedbackModal';
import safwaResume from '../../data/Safwa Ibrahim Resume (1).pdf';

// Mock finding the current logged-in user
const currentUser = USERS.find((user) => user.role === 'jobseeker');


const normalizeSkill = (skill) => {
  return skill
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(".js", "js")
    .replace(".net", "dotnet")
    .replace("html", "html5")
    .replace("css", "css3")
    .replace("node", "nodejs")
    .replace("tailwind", "tailwindcss")
    .replace("aws", "amazonwebservices");
};

const SkillBadge = ({ label }) => {

  const iconName = normalizeSkill(label);

  const isRestApi =
    label.toLowerCase() === "rest apis" ||
    label.toLowerCase() === "rest api";

  return (
    <div className="flex items-center gap-2 bg-light-gray1 px-4 py-2 rounded-full border border-light-gray2/40">

      {isRestApi ? (
        <Database size={16} className="text-logo-blue" />
      ) : (
        <i
          className={`devicon-${iconName}-plain colored`}
          style={{ fontSize: "16px" }}
        />
      )}

      <span className="text-[13px] font-semibold text-dark-blue/80">
        {label}
      </span>

    </div>
  );
};


const Profile = () => {
  const [skills, setSkills] = React.useState(() => {
    // Check if we have saved skills in localStorage first
    const savedSkills = localStorage.getItem('user_skills');
    if (savedSkills) {
      return JSON.parse(savedSkills);
    }
    // Fall back to the default data
    return currentUser?.skills || [];
  });

  const [isAddingSkill, setIsAddingSkill] = React.useState(false);
  const [newSkill, setNewSkill] = React.useState("");

  // Auto-save skills to localStorage whenever the array changes
  React.useEffect(() => {
    localStorage.setItem('user_skills', JSON.stringify(skills));
  }, [skills]);

  const [resumes, setResumes] = React.useState(() => {
    const savedResumes = localStorage.getItem('user_resumes');
    if (savedResumes) {
      return JSON.parse(savedResumes);
    }
    return currentUser?.resumes || [];
  });

  React.useEffect(() => {
    localStorage.setItem('user_resumes', JSON.stringify(resumes));
  }, [resumes]);
  const [isResumeModalOpen, setIsResumeModalOpen] = React.useState(false);
  const [selectedResume, setSelectedResume] = React.useState(null);

  const [pendingUploadFile, setPendingUploadFile] = React.useState(null);
  const [uploadName, setUploadName] = React.useState("");
  const [isNamePromptOpen, setIsNamePromptOpen] = React.useState(false);

  const fileInputRef = React.useRef(null);

  const handleDeleteResume = (id) => {
    setResumes(resumes.filter(resume => resume.id !== id));
    // Simulate updating mock data
    if (currentUser) {
      currentUser.resumes = currentUser.resumes.filter(r => r.id !== id);
    }
  };

  const handleRenameResume = (id, newName) => {
    setResumes(resumes.map(resume =>
      resume.id === id ? { ...resume, name: newName } : resume
    ));
    // Simulate updating mock data
    if (currentUser) {
      const match = currentUser.resumes.find(r => r.id === id);
      if (match) match.name = newName;
    }
  };

  const handleDownloadResume = (resumeId, resumeName) => {
    const resumeToDownload = resumes.find(r => r.id === resumeId);
    let hrefToUse = safwaResume; // fallback to the static one

    if (resumeToDownload && resumeToDownload.data) {
      hrefToUse = resumeToDownload.data;
    }

    const link = document.createElement('a');
    link.href = hrefToUse;
    link.download = resumeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewResume = (resume) => {
    setSelectedResume(resume);
    setIsResumeModalOpen(true);
  };

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill !== "" && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      // Also update the mock user data to persist during this session
      if (currentUser && currentUser.skills) {
        currentUser.skills.push(trimmedSkill);
      }
    }
    setNewSkill("");
    setIsAddingSkill(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddSkill();
    } else if (e.key === 'Escape') {
      setIsAddingSkill(false);
      setNewSkill("");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPendingUploadFile(file);
      setUploadName(file.name.replace(/\.[^/.]+$/, "")); // Strip extension for default name
      setIsNamePromptOpen(true);
    }
    // reset input
    e.target.value = '';
  };

  const handleConfirmUpload = () => {
    if (pendingUploadFile) {
      const fileUrl = URL.createObjectURL(pendingUploadFile);

      const newName = uploadName.trim() || pendingUploadFile.name;
      const finalName = newName.toLowerCase().endsWith('.pdf') ? newName : `${newName}.pdf`;

      const newResume = {
        id: `temp_${Date.now()}`,
        name: finalName,
        created_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }),
        data: fileUrl // storing the local url temporarily
      };

      setResumes([...resumes, newResume]);

      if (currentUser && currentUser.resumes) {
        currentUser.resumes.push(newResume);
      }
    }
    setIsNamePromptOpen(false);
    setPendingUploadFile(null);
    setUploadName("");
  };

  const handleCancelUpload = () => {
    setIsNamePromptOpen(false);
    setPendingUploadFile(null);
    setUploadName("");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-light-gray2/60">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <img
                  src={currentUser?.profile_image_url || assets?.profileIcon || "https://via.placeholder.com/256"}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = assets?.profileIcon || "https://via.placeholder.com/256";
                  }}
                  alt={currentUser?.name || "Job Seeker"}
                  className="w-32 h-32 rounded-full object-cover border-[3px] border-light-gray1 bg-white"
                />
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-dark-blue">{currentUser?.name || "Name"}</h1>
                  <p className="text-[17px] text-dark-blue/80 mt-1">{currentUser?.job_title || "Job Title"}</p>
                  <div className="flex items-center gap-1.5 text-dark-gray3 mt-2">
                    <MapPin size={16} />
                    <span className="text-[15px]">{currentUser?.location || "Location"}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <a href={currentUser?.socials?.github || "#"} className="w-10 h-10 rounded-full bg-light-gray1 flex items-center justify-center text-dark-gray4 hover:bg-gray-200 transition-colors">
                      <Github size={18} />
                    </a>
                    <a href={currentUser?.socials?.linkedin || "#"} className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                      <Linkedin size={18} />
                    </a>
                    <a href={currentUser?.socials?.website || "#"} className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors">
                      <Globe size={18} />
                    </a>
                    <a href={`mailto:${currentUser?.email}`} className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange hover:bg-orange/20 transition-colors">
                      <Mail size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills & Tools */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-light-gray2/60">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-dark-blue">Skills & Tools</h2>
                {!isAddingSkill && (
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="text-sm font-semibold text-orange hover:text-dark-orange transition-colors"
                  >
                    + Add Skill
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                {skills.map((skill, index) => (
                  <SkillBadge key={index} label={skill} />
                ))}

                {isAddingSkill && (
                  <div className="flex items-center gap-2 bg-light-gray1 px-2 py-1 rounded-full border border-light-gray2/40">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. React"
                      autoFocus
                      className="bg-transparent outline-none text-[13px] font-semibold text-dark-blue/80 w-24 px-2"
                    />
                    <button onClick={handleAddSkill} className="text-green-600 hover:text-green-700 p-1">
                      <CheckCircle2 size={16} />
                    </button>
                    <button onClick={() => { setIsAddingSkill(false); setNewSkill(""); }} className="text-red-500 hover:text-red-600 p-1">
                      <Eye size={16} className="hidden" /> {/* Using a text fallback, or just an 'x' since X icon isn't imported from lucide */}
                      <span className="font-bold text-[14px] leading-none px-1">×</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Education 1 */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-light-gray2/60">
              <h2 className="text-xl font-bold text-dark-blue mb-4">Education</h2>
              <div>
                <h3 className="text-[16px] font-bold text-dark-blue">{currentUser?.education}</h3>
                <p className="text-[14px] text-dark-gray3 mt-1">Class of {currentUser?.date_of_birth ? new Date(currentUser.date_of_birth).getFullYear() + 22 : "2026"}</p>
              </div>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-1 flex flex-col gap-6">

            <FeedbackModal
              isOpen={isResumeModalOpen}
              onClose={() => {
                setIsResumeModalOpen(false);
                setSelectedResume(null);
              }}
              feedbackFile={selectedResume?.data || safwaResume}
              jobTitle={selectedResume?.name || "Resume"}
              modalTitle="Resume:"
              downloadName={selectedResume?.name || "Resume.pdf"}
            />

            {/* Rename Prompt Modal */}
            {isNamePromptOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleCancelUpload}>
                <div
                  className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-xl animate-[fadeInScale_0.2s_ease-out]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-dark-blue mb-4">Name your resume</h3>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmUpload()}
                    autoFocus
                    placeholder="e.g. Frontend Resume"
                    className="w-full border border-light-gray2 rounded-lg px-3 py-2 text-dark-blue mb-5 outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-all"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleCancelUpload}
                      className="px-4 py-2 text-sm font-semibold text-dark-gray3 hover:text-dark-blue hover:bg-light-gray1 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmUpload}
                      className="px-4 py-2 text-sm font-semibold text-white bg-orange hover:bg-dark-orange rounded-lg transition-colors"
                    >
                      Save & Upload
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Resumes */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-light-gray2/60">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[17px] font-bold text-dark-blue">Resumes</h2>
                <button
                  onClick={handleUploadClick}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-orange hover:bg-orange/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
              <div className="flex flex-col gap-3">
                {resumes.map((resume) => (
                  <ResumeItem
                    key={resume.id}
                    name={resume.name}
                    date={`Uploaded ${resume.created_at}`}
                    onView={() => handleViewResume(resume)}
                    onDownload={() => handleDownloadResume(resume.id, resume.name)}
                    onDelete={() => handleDeleteResume(resume.id)}
                  />
                ))}
                {resumes.length === 0 && (
                  <p className="text-[13px] text-dark-gray3 text-center py-2">No resumes uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-light-gray2/60">
              <h2 className="text-[17px] font-bold text-dark-blue mb-5">Contact Info</h2>
              <div className="flex flex-col gap-4">
                <ContactItem icon={Mail} value={currentUser?.email || "N/A"} />
                <ContactItem icon={Phone} value={currentUser?.socials?.phone || "N/A"} />
                <ContactItem icon={MapPin} value={currentUser?.location || "N/A"} />
              </div>
            </div>

            {/* Profile Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-light-gray2/60">
              <h2 className="text-[17px] font-bold text-dark-blue mb-5">Profile Stats</h2>
              <div className="flex flex-col gap-4">
                <StatItem icon={Briefcase} label="Applications" value={currentUser?.stats?.totalApplications || 0} iconBg="bg-light-gray1" iconColor="text-dark-blue/70" />
                <StatItem icon={Calendar} label="Interviews" value={currentUser?.stats?.interviews || 0} iconBg="bg-light-gray1" iconColor="text-dark-blue/70" />
                <StatItem icon={CheckCircle2} label="Accepted" value={currentUser?.stats?.accepted || 0} iconBg="bg-light-teal" iconColor="text-teal" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};



const ResumeItem = ({ name, date, onView, onDownload, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-light-gray1 rounded-xl border border-light-gray2/30">
    <div className="flex items-center gap-3">
      <div className="text-orange bg-orange/10 p-2 rounded-lg">
        <FileText size={18} />
      </div>
      <div>
        <p className="text-[14px] font-bold text-dark-blue truncate max-w-[150px]">{name}</p>
        <p className="text-[11px] text-dark-gray3 mt-0.5">{date}</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-dark-gray3">
      <button onClick={onView} title="View Resume" className="p-1 hover:bg-light-gray2/50 hover:text-dark-blue rounded-md transition-colors">
        <Eye size={16} />
      </button>
      <button onClick={onDownload} title="Download Resume" className="p-1 hover:bg-light-gray2/50 hover:text-dark-blue rounded-md transition-colors">
        <Download size={16} />
      </button>
      <button onClick={onDelete} title="Delete Resume" className="p-1 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-md transition-colors ml-1">
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

const ContactItem = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-light-gray1 flex items-center justify-center text-dark-blue/60 shrink-0">
      <Icon size={18} />
    </div>
    <p className="text-[14px] font-medium text-dark-blue/90">{value}</p>
  </div>
);

const StatItem = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div className="flex items-center justify-between p-1">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
        <Icon size={18} />
      </div>
      <span className="text-[15px] font-medium text-dark-blue/80">{label}</span>
    </div>
    <span className="text-[18px] font-bold text-dark-blue">{value}</span>
  </div>
);

export default Profile;