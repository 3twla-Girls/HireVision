import React from "react";
import { CheckCircle, Target, Users, Briefcase, TrendingUp, Award, ArrowRight } from "lucide-react";
import aboutImg from "../../assets/about_sec.png"; // replace with your actual image path


const features = [
  { title: "Smart Job Matching", desc: "AI-powered recommendations tailored to your skills and experience." },
  { title: "Real-Time Alerts", desc: "Get notified instantly when a job matching your profile is posted." },
  { title: "Verified Talent Pool", desc: "Access a curated pool of pre-screened candidates ready to hire." },
  { title: "Smart Applicant Tracking", desc: "Manage, filter and shortlist applicants effortlessly in one dashboard." },
];


export default function about() {
  return (
    <section className="relative bg-gray-100 py-20 lg:py-28 px-6 sm:px-12 lg:px-24 overflow-hidden" id="section-about">

      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-100/40 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Main Split Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Image ── */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={aboutImg}
                alt="About HireVision"
                className="w-full h-[480px] object-cover"
              />
              {/* Overlay tint */}
              <div className="absolute inset-0 bg-[#0F2C59]/10 rounded-3xl" />
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-8 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-52">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">95%</div>
                  <div className="text-xs text-gray-400 font-medium">Placement Rate</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-[95%] bg-[#FF6B35] rounded-full" />
              </div>
            </div>

            {/* Floating users card */}
            <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F2C59]/10 flex items-center justify-center text-[#0F2C59]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">50K+</div>
                <div className="text-xs text-gray-400 font-medium">Happy Users</div>
              </div>
            </div>
          </div>

          {/* ── Right: Text Content ── */}
          <div className="space-y-8">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-semibold px-4 py-2 rounded-full">
              <Target className="w-4 h-4" />
              About HireVision
            </div>

            {/* Mission */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Connecting talent with{" "}
                <span className="text-[#FF6B35]">opportunity</span>, every day
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                HireVision was built on a simple belief finding the right job or the
                right person shouldn't be hard. We bridge the gap between ambitious
                professionals and the companies that need them, using smart technology
                and a human touch.
              </p>
            </div>


            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map(({ title, desc }) => (
                <div
                  key={title}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition duration-200"
                >
                  <div className="w-2 h-2 rounded-full bg-[#FF6B35] mb-3" />
                  <h4 className="text-sm font-bold text-gray-800 mb-1">{title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

       

      </div>
    </section>
  );
}