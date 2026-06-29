import React from "react";
import {
  Play,
  Briefcase,
  Building2,
  Users,
  Search,
  MapPin,
  ChevronRight,
  Home,
  User,
  Bell,
  Settings,
  Layers,
} from "lucide-react";
import workingGirlImg from "../../assets/home_hero_girl.png";

export default function Hero() {
  return (
    <section className="relative bg-dark-blue text-white overflow-hidden py-16 lg:py-24 px-6 sm:px-12 lg:px-24" id="section-home">
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.18; }
          50% { transform: translateY(-28px) scale(1.04); opacity: 0.28; }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); opacity: 0.12; }
          50% { transform: translateY(-16px) scale(1.06); opacity: 0.22; }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0px); opacity: 0.07; }
          50% { transform: translateY(22px); opacity: 0.14; }
        }
        @keyframes floatGirl {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseBadge {
          0%, 100% { transform: rotate(12deg) scale(1); }
          50% { transform: rotate(0deg) scale(1.08); }
        }
      `}</style>

      {/* ── Animated Bubbles ── */}
      <div
        className="absolute top-[-80px] right-[8%] w-[260px] h-[260px] rounded-full border border-blue-400/20 bg-blue-400/10 pointer-events-none"
        style={{ animation: "floatA 8s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[15%] right-[1%] w-[150px] h-[150px] rounded-full border border-blue-300/15 bg-blue-300/10 pointer-events-none"
        style={{ animation: "floatB 10s ease-in-out infinite 1.5s" }}
      />
      <div
        className="absolute bottom-[8%] right-[16%] w-[90px] h-[90px] rounded-full border border-blue-400/20 bg-blue-400/10 pointer-events-none"
        style={{ animation: "floatA 12s ease-in-out infinite 2s" }}
      />
      <div
        className="absolute top-[-120px] right-[28%] w-[380px] h-[380px] rounded-full border border-orange-400/10 bg-orange-400/5 pointer-events-none"
        style={{ animation: "floatC 14s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[20%] left-[4%] w-[70px] h-[70px] rounded-full border border-blue-300/15 bg-blue-300/10 pointer-events-none"
        style={{ animation: "floatB 9s ease-in-out infinite 3s" }}
      />
      <div
        className="absolute top-[35%] left-[1%] w-[110px] h-[110px] rounded-full border border-orange-400/10 bg-orange-400/5 pointer-events-none"
        style={{ animation: "floatC 11s ease-in-out infinite 1s" }}
      />
      <div
        className="absolute top-[8%] left-[28%] w-[55px] h-[55px] rounded-full border border-blue-400/15 bg-blue-400/10 pointer-events-none"
        style={{ animation: "floatA 7s ease-in-out infinite 0.5s" }}
      />

      {/* Original decorative blurs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none transform -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">

        {/* ── Left Content ── */}
        <div className="lg:col-span-5 space-y-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
            Find your dream job or the{" "}
            <span className="text-dark-orange">perfect candidate</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl leading-relaxed">
            Join HireVision to start your career journey. Connect with top
            companies or find the right talent for your team.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <button className="bg-[#FF6B35] hover:bg-[#E85A24] text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-orange-600/20 transition duration-200 transform hover:-translate-y-0.5">
              Get Started
            </button>
            <button className="group flex items-center space-x-3 font-medium text-white hover:text-orange-400 transition duration-200">
              <span className="w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center group-hover:border-orange-400/50 group-hover:bg-orange-500/10 transition duration-200">
                <Play className="w-4 h-4 fill-white text-white group-hover:text-orange-400 group-hover:fill-orange-400" />
              </span>
              <span>Watch how it works</span>
            </button>
          </div>

          <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl text-orange-400 hidden sm:block">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">25K+</div>
                <div className="text-xs text-gray-400 font-medium">Jobs Available</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl text-orange-400 hidden sm:block">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">10K+</div>
                <div className="text-xs text-gray-400 font-medium">Top Companies</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl text-orange-400 hidden sm:block">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">50K+</div>
                <div className="text-xs text-gray-400 font-medium">Active Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Dashboard ── */}
        <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[640px]">

            {/* App Window */}
            <div className="bg-white rounded-2xl w-full text-gray-800 shadow-2xl overflow-hidden border border-white/10 flex flex-col transform hover:scale-[1.005] transition duration-300 relative z-10">

              {/* Title bar */}
              <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center space-x-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              </div>

              <div className="flex flex-1 min-h-[440px] bg-white">

                {/* Sidebar */}
                <div className="w-14 border-r border-gray-100 flex flex-col items-center py-4 justify-between text-gray-400">
                  <div className="space-y-5 flex flex-col items-center w-full">
                    <div className="p-1.5 text-gray-300">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="p-2 bg-[#0F2C59] text-white rounded-lg">
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="p-1.5 hover:text-gray-600 transition">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="p-1.5 hover:text-gray-600 transition">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="p-1.5 hover:text-gray-600 transition">
                      <Settings className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                </div>

                {/* Workspace */}
                <div className="flex-1 bg-[#F8FAFC] p-5 space-y-5 relative">

                  {/* Search bar */}
                  <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                    <div className="flex-1 flex items-center space-x-2 bg-[#F8FAFC] rounded-lg px-2.5 py-1.5">
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Job Title or Keyword"
                        disabled
                        className="bg-transparent text-[11px] outline-none w-full cursor-not-allowed text-gray-700 font-medium"
                      />
                    </div>
                    <div className="flex-1 flex items-center space-x-2 bg-[#F8FAFC] rounded-lg px-2.5 py-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Location"
                        disabled
                        className="bg-transparent text-[11px] outline-none w-full cursor-not-allowed text-gray-700 font-medium"
                      />
                    </div>
                    <button
                      disabled
                      className="bg-[#FF6B35] text-white text-[11px] font-semibold px-4 py-1.5 rounded-lg whitespace-nowrap cursor-not-allowed"
                    >
                      Search Jobs
                    </button>
                  </div>

                  {/* Feed */}
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-7 space-y-2.5">
                      <div className="text-[11px] font-bold text-gray-500 tracking-wide">
                        Featured Jobs
                      </div>

                      <div className="bg-white p-3 border border-gray-100 rounded-xl flex items-center justify-between shadow-sm hover:border-gray-200 transition">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#1D3557] flex items-center justify-center text-white font-bold text-[10px]">
                            M
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h4 className="text-[11px] font-bold text-gray-800">
                                Senior Product Designer
                              </h4>
                              <span className="bg-blue-50 text-blue-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
                                New
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-400">TechVision Inc.</p>
                            <p className="text-[8px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5" /> Full Time{" "}
                              <MapPin className="w-2.5 h-2.5" /> Remote
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>

                      <div className="bg-white p-3 border border-gray-100 rounded-xl flex items-center justify-between shadow-sm hover:border-gray-200 transition">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-white font-bold text-[10px]">
                            ⚙️
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-gray-800">
                              Frontend Developer
                            </h4>
                            <p className="text-[9px] text-gray-400">CodeCraft</p>
                            <p className="text-[8px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5" /> Full Time{" "}
                              <MapPin className="w-2.5 h-2.5" /> New York, USA
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>

                      <div className="bg-white p-3 border border-gray-100 rounded-xl flex items-center justify-between shadow-sm hover:border-gray-200 transition">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-[10px]">
                            N
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-gray-800">
                              Marketing Manager
                            </h4>
                            <p className="text-[9px] text-gray-400">Brandify</p>
                            <p className="text-[8px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5" /> Full Time{" "}
                              <MapPin className="w-2.5 h-2.5" /> Los Angeles, USA
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </div>

                    <div className="col-span-5">
                      <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-sm space-y-2.5 relative z-10">
                        <div className="text-[9px] text-gray-400 font-bold flex justify-between items-center">
                          <span>Recommended for you</span>
                          <span className="text-[8px] text-gray-300">→</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">
                            UX
                          </div>
                          <div>
                            <h5 className="text-[10px] font-bold text-gray-800 leading-tight">
                              UX Researcher
                            </h5>
                            <p className="text-[8px] text-gray-400">DesignHub • Remote</p>
                          </div>
                        </div>
                        <button
                          disabled
                          className="w-full bg-white border border-gray-100 text-[#0F2C59] text-[9px] font-bold py-1 rounded-lg cursor-not-allowed"
                        >
                          View Job
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Girl Image ── */}
            <img
              src={workingGirlImg}
              alt="Woman working on laptop illustration"
              className="absolute w-[400px] sm:w-[420px] md:w-[600px] h-auto object-contain pointer-events-none z-20"
              style={{
                
                right: "-130px",
                bottom: "-80px",
              }}
            />

            {/* ── Floating Briefcase Badge ── */}
            <div
              className="absolute top-1/4 -right-10 w-14 h-14 bg-white rounded-full shadow-2xl border border-gray-100 hidden sm:flex items-center justify-center z-30"
              style={{ animation: "pulseBadge 4s ease-in-out infinite" }}
            >
              <Briefcase className="w-5 h-5 text-blue-900" />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}