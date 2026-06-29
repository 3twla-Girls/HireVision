import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SlidersHorizontal, SearchX, RefreshCw } from "lucide-react";
import FilterSidebar from "../../components/JobSeeker/FilterSidebar";
import JobCard from "../../components/JobSeeker/JobCard";
import RightSidebar from "../../components/JobSeeker/RightSidebar";
import { useNavigate } from "react-router-dom";

// Map API job fields → JobCard prop shape
const mapJob = (job) => {
  const parts = (job.location ?? "").split(",").map((s) => s.trim());
  const city = parts[0] ?? "";
  const country = parts.slice(1).join(", ") || parts[0] || "";

  const posted = job.created_at
    ? (() => {
        const diff = Math.floor(
          (Date.now() - new Date(job.created_at)) / 86_400_000,
        );
        if (diff === 0) return "Today";
        if (diff === 1) return "1 day ago";
        return `${diff} days ago`;
      })()
    : "Recently";

  const backendType = job.job_type ?? job.type ?? "full_time";

  let workplace = "On site";
  let typeProp = "full_time";

  if (["remote", "hybrid", "on_site"].includes(backendType)) {
    workplace =
      backendType === "remote"
        ? "Remote"
        : backendType === "hybrid"
          ? "Hybrid"
          : "On site";
    // Default the type prop to 'full_time' when the backend only saved the workplace
  } else {
    workplace = "On site"; // Default workplace for legacy full_time jobs
    typeProp = backendType;
  }

  return {
    id: job._id ?? job.id,
    title: job.job_title,
    company: job.company ?? "Company",
    recruiter: job.recruiter ?? "",
    city,
    country,
    workplace,
    type: typeProp,
    postedAgo: posted,
    experience: job.required_experience ?? "Mid-level",
    yearsOfExp: job.years_of_exp ?? "",
    skills: job.required_skills ?? [],
    description:
      job.job_description ||
      job.description ||
      "No description provided for this job.",
    salary: job.salary || "Not specified",
    education: job.education || "Not specified",
    status: job.status || "Active",
    cluster_id: job.cluster_id ?? null,
  };
};

// Apply all active filters to the jobs list
// Map display labels → backend enum values
const JOB_TYPE_MAP = {
  "Full-time": "full_time",
  "Part-time": "part_time",
  Contract: "contract",
  Remote: "remote",
  Hybrid: "hybrid",
  "On site": "on_site",
};

const applyFilters = (jobs, { checked = {}, searchValues = {} }) => {
  const activeWorkplaces = ["On site", "Remote", "Hybrid"].filter(
    (v) => checked[v],
  );

  // Convert display labels to backend enum values before comparing
  const activeTypes = ["Full-time", "Part-time", "Contract"]
    .filter((v) => checked[v])
    .map((v) => JOB_TYPE_MAP[v]);

  const activeExp = ["Junior", "Mid-level", "Senior"].filter((v) => checked[v]);
  const countryQ = (searchValues.country ?? "").trim().toLowerCase();
  const cityQ = (searchValues.city ?? "").trim().toLowerCase();

  return jobs.filter((job) => {
    if (
      activeWorkplaces.length > 0 &&
      !activeWorkplaces.includes(job.workplace)
    )
      return false;
    if (activeTypes.length > 0 && !activeTypes.includes(job.type)) return false; // now "full_time" === "full_time" ✅
    if (activeExp.length > 0 && !activeExp.includes(job.experience))
      return false;
    if (countryQ && !job.country.toLowerCase().includes(countryQ)) return false;
    if (cityQ && !job.city.toLowerCase().includes(cityQ)) return false;
    return true;
  });
};

// ── Empty / No-results UI ────────────────────────────────────────────────────
const EmptyState = ({ isFiltered, onClear }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-20 h-20 rounded-full bg-orange/10 flex items-center justify-center mb-5 shadow-inner">
      <SearchX size={36} className="text-orange" strokeWidth={1.6} />
    </div>
    <h2 className="text-xl font-bold text-dark-blue mb-2">
      {isFiltered ? "No matching jobs" : "No recommendations yet"}
    </h2>
    {isFiltered && (
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                   bg-orange text-white text-sm font-semibold
                   hover:bg-dark-orange shadow-md hover:shadow-lg
                   transition-all duration-200"
      >
        <RefreshCw size={14} />
        Clear filters
      </button>
    )}
  </div>
);

// ── Skeleton loader ──────────────────────────────────────────────────────────
const Skeletons = () => (
  <div className="flex flex-col gap-4">
    {[1, 2, 3].map((n) => (
      <div
        key={n}
        className="rounded-3xl border border-gray-100 bg-white px-6 py-5 shadow-md animate-pulse"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-light-gray2 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-light-gray2 rounded w-3/5" />
            <div className="h-3 bg-light-gray1 rounded w-2/5" />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-16 bg-light-gray2 rounded-md" />
          <div className="h-6 w-20 bg-light-gray2 rounded-md" />
          <div className="h-6 w-14 bg-light-gray2 rounded-md" />
        </div>
        <div className="h-px bg-light-gray1 mb-4" />
        <div className="flex gap-2">
          <div className="h-7 w-16 bg-light-gray1 rounded-lg" />
          <div className="h-7 w-20 bg-light-gray1 rounded-lg" />
          <div className="h-7 w-12 bg-light-gray1 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// ── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [otherJobs, setOtherJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ checked: {}, searchValues: {} });
  const [clearKey, setClearKey] = useState(0);
  const [isGenericList, setIsGenericList] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));

  const navigate = useNavigate(); // Ensure navigate is used inside the component

  useEffect(() => {
    if (!user) {
      navigate("/Register"); // Redirect to register page if user is not found
    }
  }, [user, navigate]);

  const CURRENT_USER_ID = user._id;
  // Receive filter updates from FilterSidebar
  // FilterSidebar calls onChange({ checked, searchValues }) on every change
  const handleFilterChange = useCallback((incoming) => {
    setFilters({
      checked: incoming.checked ?? {},
      searchValues: incoming.searchValues ?? {},
    });
  }, []);

  // Clear filters — bump key to remount FilterSidebar and reset its state
  const handleClearFilters = () => {
    setFilters({ checked: {}, searchValues: {} });
    setClearKey((k) => k + 1);
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        let recList = [];
        let allList = [];

        // 1️⃣ Try recommended jobs first
        try {
          const recRes = await fetch(
            `/api/v1/job/recommended/${CURRENT_USER_ID}`,
          );
          if (recRes.ok) {
            const recData = await recRes.json();
            recList = Array.isArray(recData) ? recData : (recData.jobs ?? []);
          }
        } catch (err) {
          console.warn(
            "Recommended jobs API failed, falling back",
            err,
          );
        }

        // 2️⃣ Fetch all remaining jobs
        try {
          const allRes = await fetch("/api/v1/job/all_jobs");
          if (!allRes.ok) throw new Error(`Server error: ${allRes.status}`);
          const allData = await allRes.json();
          allList = Array.isArray(allData)
            ? allData
            : (allData.jobs ?? []);
        } catch (err) {
          console.warn("All jobs API failed", err);
        }

        const mappedRec = recList.map(mapJob);
        const recIds = new Set(mappedRec.map(j => j.id));
        const mappedOther = allList.map(mapJob).filter(j => !recIds.has(j.id));

        setRecommendedJobs(mappedRec);
        setOtherJobs(mappedOther);
        setIsGenericList(mappedRec.length === 0);

      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        setError("Could not load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [CURRENT_USER_ID]);

  // Re-compute filtered list whenever jobs or filters change
  const filteredRecJobs = useMemo(
    () => applyFilters(recommendedJobs, filters),
    [recommendedJobs, filters],
  );

  const filteredOtherJobs = useMemo(
    () => applyFilters(otherJobs, filters),
    [otherJobs, filters],
  );

  const totalFilteredCount = filteredRecJobs.length + filteredOtherJobs.length;

  // Are any filters currently active?
  const isFiltered =
    Object.values(filters.checked).some(Boolean) ||
    Object.values(filters.searchValues).some(
      (v) => (v ?? "").trim().length > 0,
    );

  // Shared sidebar factory (keyed so clearKey remounts it)
  const sidebar = (extraProps = {}) => (
    <FilterSidebar
      key={clearKey}
      onChange={handleFilterChange}
      {...extraProps}
    />
  );

  const renderContent = () => {
    if (loading) return <Skeletons />;
    if (error)
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <SearchX size={36} className="text-red-400" strokeWidth={1.6} />
          </div>
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      );
    if (totalFilteredCount === 0) {
      return (
        <EmptyState
          isFiltered={isFiltered && (recommendedJobs.length > 0 || otherJobs.length > 0)}
          onClear={handleClearFilters}
        />
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {/* ── No-CV upsell banner ── */}
        {isGenericList && (
          <div
            className="flex items-center gap-4 rounded-2xl border border-orange/30
                          bg-gradient-to-r from-orange/5 to-amber-50 px-5 py-4 shadow-sm"
          >
            <span className="text-3xl shrink-0">📄</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-dark-blue text-sm leading-snug">
                Want jobs tailored to your skills?
              </p>
              <p className="text-[13px] text-dark-gray3 mt-0.5">
                Upload your CV and we'll show personalised recommendations just
                for you.
              </p>
            </div>
            <a
              href="/profile"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                         bg-orange text-white text-[13px] font-semibold
                         hover:bg-dark-orange shadow-md hover:shadow-lg
                         transition-all duration-200"
            >
              Upload CV
            </a>
          </div>
        )}
        
        {/* RECOMMENDED SECTION */}
        {filteredRecJobs.length > 0 && !isGenericList && (
           <>
              {filteredRecJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              
              {filteredOtherJobs.length > 0 && (
                 <div className="mt-6 mb-2">
                    <h2 className="text-xl font-bold text-dark-blue border-b border-gray-100 pb-3">More Jobs You Might Like</h2>
                 </div>
              )}
           </>
        )}
        
        {/* OTHER JOBS SECTION */}
        {filteredOtherJobs.length > 0 && (
           <>
              {filteredOtherJobs.map((job) => (
                 <JobCard key={job.id} job={job} />
              ))}
           </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* ── Desktop (lg+): 3-column grid ── */}
      <div className="hidden lg:grid mx-auto px-[60px] py-8 grid-cols-12 gap-5 items-stretch">
        <div className="col-span-3 pb-8">{sidebar()}</div>

        <main className="col-span-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-dark-blue">
              {isGenericList ? "Browse Jobs" : "Recommended for you!"}
            </h1>
            {!loading && !error && (
              <span className="text-sm text-dark-gray3 font-medium">
                {totalFilteredCount} job{totalFilteredCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {renderContent()}
        </main>

        <div className="col-span-3">
          <RightSidebar />
        </div>
      </div>

      {/* ── Tablet (md–lg): 2-column grid ── */}
      <div className="hidden md:block lg:hidden mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-5 items-stretch">
          <main className="col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-dark-blue">
                {isGenericList ? "Browse Jobs" : "Recommended for you!"}
              </h1>
              <div className="flex items-center gap-3">
                {!loading && !error && (
                  <span className="text-sm text-dark-gray3 font-medium">
                    {totalFilteredCount} job
                    {totalFilteredCount !== 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={() => setFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-light-gray2
                             shadow-sm hover:shadow-md hover:border-orange/40 transition-all duration-200
                             text-sm font-semibold text-dark-blue"
                >
                  <SlidersHorizontal
                    size={16}
                    className="text-orange"
                    strokeWidth={2.2}
                  />
                  Filters
                </button>
              </div>
            </div>
            {renderContent()}
          </main>

          <div className="col-span-4">
            <RightSidebar />
          </div>
        </div>

        {sidebar({ isOpen: filterOpen, onClose: () => setFilterOpen(false) })}
      </div>

      {/* ── Phone (<md): single column ── */}
      <div className="block md:hidden mx-auto px-4 py-5">
        <div className="mb-5">
          <RightSidebar />
        </div>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-dark-blue">
            {isGenericList ? "Browse Jobs" : "Recommended for you!"}
          </h1>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-light-gray2
                       shadow-sm hover:shadow-md hover:border-orange/40 transition-all duration-200
                       text-sm font-semibold text-dark-blue"
          >
            <SlidersHorizontal
              size={16}
              className="text-orange"
              strokeWidth={2.2}
            />
            Filters
          </button>
        </div>

        {renderContent()}

        {sidebar({ isOpen: filterOpen, onClose: () => setFilterOpen(false) })}
      </div>
    </div>
  );
};

export default Home;
