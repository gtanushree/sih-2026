import React, { useState } from "react";
import { Building2, Plus, CheckCircle, ShieldCheck, DollarSign, MapPin } from "lucide-react";
import { api } from "../lib/api";

export default function CompanyMode({ user }) {
  const [companyName, setCompanyName] = useState(() => user?.company?.name || user?.companyName || "");
  const [roleTitle, setRoleTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [minCgpa, setMinCgpa] = useState("7.5");
  const [eligibleBranch, setEligibleBranch] = useState("Computer Science, Information Technology");
  const [skillsRequired, setSkillsRequired] = useState("React, Node.js, TypeScript, SQL");
  const [packageLpa, setPackageLpa] = useState("18 LPA");
  const [location, setLocation] = useState("Bengaluru / Hybrid");
  const [driveDate, setDriveDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    setPosting(true);
    setSuccessMsg("");
    try {
      await api.createDrive({
        companyName,
        title: roleTitle,
        description: jdText,
        driveDate,
        deadline: deadline || undefined,
        minCgpa: parseFloat(minCgpa),
        eligibleBranch: eligibleBranch.split(",").map(s => s.trim()),
        skillsRequired: skillsRequired.split(",").map(s => s.trim()),
        packageLpa,
        location
      });
      setSuccessMsg(`Successfully published placement drive for '${roleTitle}'!`);
      setRoleTitle("");
      setJdText("");
      setDriveDate("");
      setDeadline("");
    } catch (err) {
      alert("Failed to post drive.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="card-stark bg-white">
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            <div>
              <h2 className="font-black text-lg uppercase">RECRUITER / COMPANY PORTAL</h2>
              <p className="text-xs font-semibold text-gray-600">
                Verified Official Email: <span className="font-mono underline">{user?.officialEmail || "recruiter@company.com"}</span>
              </p>
            </div>
          </div>
          <span className="badge-stark bg-green-200 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED RECRUITER
          </span>
        </div>
      </div>

      {/* Post Placement Drive Form */}
      <div className="card-stark bg-white">
        <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
          <Plus className="w-5 h-5" />
          <h3 className="font-black text-sm uppercase">POST NEW PLACEMENT DRIVE</h3>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-100 border-2 border-black text-xs font-bold text-black flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-black" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateDrive} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Infosys"
                className="input-stark w-full text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Role Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Full Stack Developer (SDE-1)"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="input-stark w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase mb-1">Job Description & Responsibilities</label>
            <textarea
              required
              rows={4}
              placeholder="Describe key responsibilities, team structure, and project scope..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="input-stark w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Min Cutoff CGPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                className="input-stark w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Package Offered (LPA)</label>
              <input
                type="text"
                value={packageLpa}
                onChange={(e) => setPackageLpa(e.target.value)}
                className="input-stark w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Job Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-stark w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Campus Drive Date</label>
              <input
                type="date"
                required
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                className="input-stark w-full text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Application Deadline</label>
              <input
                type="date"
                value={deadline}
                max={driveDate || undefined}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-stark w-full text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Eligible Branches (Comma-separated)</label>
              <input
                type="text"
                value={eligibleBranch}
                onChange={(e) => setEligibleBranch(e.target.value)}
                className="input-stark w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Required Skills (Comma-separated)</label>
              <input
                type="text"
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                className="input-stark w-full text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={posting} className="btn-primary w-full justify-center py-2 text-xs">
              <span>{posting ? "PUBLISHING DRIVE..." : "PUBLISH PLACEMENT DRIVE"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
