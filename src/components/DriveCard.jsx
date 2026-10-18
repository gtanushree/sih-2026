import { useState } from "react";
import { Building, MapPin, DollarSign, CheckCircle, Lock, ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";

export default function DriveCard({ drive, onApplicationSubmitted }) {
  const [applying, setApplying] = useState(false);
  const [appStatus, setAppStatus] = useState(drive.applicationStatus || null);

  const hasExternalApplicationUrl = (() => {
    try {
      const url = new URL(drive.applicationUrl);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  })();

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.applyToDrive(drive._id);
      setAppStatus("applied");
      if (onApplicationSubmitted) onApplicationSubmitted(drive._id);
    } catch {
      alert("Failed to apply or already applied.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={`card-stark flex flex-col justify-between h-full bg-white ${
      !drive.isEligible ? "opacity-80 bg-gray-50 border-gray-400" : ""
    }`}>
      <div>
        {/* Card Header: Company & Match Badge */}
        <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-2.5 mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-black" />
              <h3 className="font-black text-sm uppercase tracking-tight">{drive.companyName}</h3>
            </div>
            <p className="font-extrabold text-base text-black mt-0.5">{drive.roleTitle}</p>
          </div>

          <div className="text-right">
            <span className={`badge-stark text-xs font-black ${
              drive.matchPercentage >= 80 ? "bg-green-200" : drive.matchPercentage >= 60 ? "bg-yellow-200" : "bg-gray-200"
            }`}>
              {drive.matchPercentage}% FIT
            </span>
          </div>
        </div>

        {/* Eligibility & Compensation Meta */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 font-bold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{drive.packageLpa || "12 LPA"}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-gray-700">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{drive.location || "Remote"}</span>
          </div>
        </div>

        {/* Eligibility Warning or Badge */}
        <div className="mb-3">
          {drive.isEligible ? (
            <span className="badge-stark bg-black text-white text-[11px]">
              ✓ ELIGIBLE (MIN CGPA {drive.minCgpa})
            </span>
          ) : (
            <span className="badge-stark bg-red-100 text-red-900 border-red-900 text-[10px]">
              <Lock className="w-3 h-3" /> {drive.eligibilityReason}
            </span>
          )}
        </div>

        {/* Job Description Brief */}
        <p className="text-xs font-medium text-gray-700 mb-3 line-clamp-2">
          {drive.jdText}
        </p>

        {/* Required Skills Pills */}
        <div className="mb-4">
          <div className="text-[10px] font-extrabold uppercase text-gray-600 mb-1.5">REQUIRED SKILLS</div>
          <div className="flex flex-wrap gap-1">
            {(drive.skillsRequired || []).map((skill, idx) => (
              <span key={idx} className="badge-stark text-[10px] py-0.5 px-1.5 bg-gray-100">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t-2 border-black pt-3 flex items-center justify-between mt-auto">
        <span className="text-[10px] font-bold text-gray-500 uppercase">
          DEADLINE: {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : "UPCOMING"}
        </span>

        {appStatus ? (
          <span className="badge-stark bg-green-200 text-black text-xs font-black uppercase">
            <CheckCircle className="w-3.5 h-3.5" /> APPLIED
          </span>
        ) : hasExternalApplicationUrl && drive.isEligible ? (
          <a
            href={drive.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-1 px-3"
          >
            APPLY NOW
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            onClick={handleApply}
            disabled={!drive.isEligible || applying}
            className={`btn-primary text-xs py-1 px-3 ${
              !drive.isEligible ? "bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed shadow-none" : ""
            }`}
          >
            {applying ? "APPLYING..." : "APPLY NOW"}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
