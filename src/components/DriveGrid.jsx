import { useState } from "react";
import DriveCard from "./DriveCard";
import { Briefcase, Search } from "lucide-react";

export default function DriveGrid({ aiMatchedJobs = [], databaseJobs = [], activeTab = "matched", onTabChange, onApplicationSubmitted }) {
  const [filterEligible, setFilterEligible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const drives = activeTab === "matched" ? aiMatchedJobs : databaseJobs;

  const filteredDrives = drives.filter((drive) => {
    if (filterEligible && !drive.isEligible) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCompany = String(drive.companyName || "").toLowerCase().includes(q);
      const matchRole = String(drive.roleTitle || "").toLowerCase().includes(q);
      const matchSkill = (drive.skillsRequired || []).some(s => s.toLowerCase().includes(q));
      return matchCompany || matchRole || matchSkill;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 border-2 border-black bg-white sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onTabChange?.("matched")}
          className={`px-4 py-3 text-xs font-black uppercase transition-colors ${activeTab === "matched" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
        >
          AI-MATCHED PLACEMENT DRIVES
          <span className={`ml-2 border px-1.5 py-0.5 text-[10px] ${activeTab === "matched" ? "border-white" : "border-black"}`}>{aiMatchedJobs.length}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange?.("available")}
          className={`border-t-2 border-black px-4 py-3 text-xs font-black uppercase transition-colors sm:border-l-2 sm:border-t-0 ${activeTab === "available" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
        >
          AVAILABLE JOBS
          <span className={`ml-2 border px-1.5 py-0.5 text-[10px] ${activeTab === "available" ? "border-white" : "border-black"}`}>{databaseJobs.length}</span>
        </button>
      </div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 border-2 border-black shadow-bold-sm">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          <h2 className="font-black text-base uppercase">
            {activeTab === "available" ? "AVAILABLE JOBS" : "AI-MATCHED PLACEMENT DRIVES"}
          </h2>
          <span className="badge-stark bg-black text-white ml-2">{filteredDrives.length} {activeTab === "available" ? "JOBS" : "DRIVES"}</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="flex min-w-0 flex-1 items-center border-[1.5px] border-black bg-white sm:w-48 sm:flex-none">
            <Search className="ml-2.5 h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />
            <input
              type="text"
              placeholder={activeTab === "available" ? "Search jobs..." : "Search drives..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search placement drives"
              className="min-w-0 w-full bg-transparent py-1.5 pl-2 pr-3 text-xs font-medium outline-none"
            />
          </div>

          {/* Eligible Only Filter Toggle */}
          <label className="flex items-center gap-1.5 text-xs font-extrabold cursor-pointer border-2 border-black px-2 py-1 bg-gray-50 hover:bg-gray-100">
            <input
              type="checkbox"
              checked={filterEligible}
              onChange={(e) => setFilterEligible(e.target.checked)}
              className="accent-black"
            />
            <span>ELIGIBLE ONLY</span>
          </label>
        </div>
      </div>

      {/* Drives Grid */}
      {filteredDrives.length === 0 ? (
        <div className="card-stark bg-white text-center py-12">
          <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <h3 className="font-black text-sm uppercase">
            {activeTab === "available" ? "NO AVAILABLE JOBS FOUND" : "NO MATCHED DRIVES FOUND"}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {activeTab === "available"
              ? "No jobs have been posted yet. Check again later."
              : "Try adjusting your search query or profile skills."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrives.map((drive) => (
            <DriveCard
              key={drive._id || drive.companyName}
              drive={drive}
              onApplicationSubmitted={onApplicationSubmitted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
