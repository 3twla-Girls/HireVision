import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Job Seeker Pages
import Home from "./pages/JobSeeker/Home";
import Job from "./pages/JobSeeker/Job";
import Applications from "./pages/JobSeeker/Applications";
import Interviews from "./pages/JobSeeker/Interviews";
import InterviewLive from "./pages/JobSeeker/InterviewLive";
import InterviewSetup from "./pages/JobSeeker/InterviewSetup";
import Profile from "./pages/JobSeeker/Profile";

// Recruiter Pages
import CandidateProfile from "./pages/Recruiter/CandidateProfile";
import Dashboard from "./pages/Recruiter/Dashboard";
import JobManagement from "./pages/Recruiter/JobManagement";
import PostJob from "./pages/Recruiter/PostJob";
import JobPreview from "./pages/Recruiter/JobPreview";
import JobApplications from "./pages/Recruiter/JobApplications";
import RecruiterProfile from "./pages/Recruiter/RecruiterProfile";
import EditJob from "./pages/Recruiter/EditJob";

// Shared
import Layout from "./pages/shared/Layout";
import Login from "./pages/shared/Login";
import Register from "./pages/shared/Register";
import { useAuth } from "./context/AuthContext";

const App = () => {
  // const userData = JSON.parse(sessionStorage.getItem("user"));
  const { userData, loading } = useAuth();
  console.log("USER: ",userData)
  const userRole = userData?.role
  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }
  return (
    <>
      <Toaster />
      <Routes>
        {/* Top-level public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected / Layout route */}
        <Route path="/" element={userData ? <Layout/> : <Navigate to="/register" replace />}>
          {/* Job Seeker */}
          <Route index element={userRole === "jobseeker" ? <Home /> : <JobManagement/>} />
          <Route path="job/:jobId" element={<Job />} />
          <Route path="applications" element={<Applications />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="profile" element={<Profile />} />
          <Route path="interview/:type/:jobName?" element={<InterviewSetup />} />
          <Route path="interview/:type/live" element={<InterviewLive />} />

          {/* Recruiter */}
          <Route path="candidate-profile/:applicationId" element={<CandidateProfile />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="job-management" element={<JobManagement />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="edit-job/:jobId" element={<EditJob />} />
          <Route path="job-preview/:jobId" element={<JobPreview />} />
          <Route path="job-applications/:jobId" element={<JobApplications />} />
          <Route path="recruiter-profile" element={<RecruiterProfile />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;