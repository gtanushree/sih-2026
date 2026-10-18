import { useState } from "react";
import { Building, GraduationCap, ArrowRight, Clock, Lock, Files, Mail } from "lucide-react";

export default function WelcomeModeSelect({ user, onModeSelected, onRequestAccess }) {
  const [requestedAccess, setRequestedAccess] = useState({}); // { tpo: 'pending', company: 'pending' }

  const handleAccessRequest = (modeKey) => {
    setRequestedAccess((prev) => ({ ...prev, [modeKey]: "pending" }));
    if (onRequestAccess) {
      onRequestAccess(modeKey);
    }
  };

  return (
    <div className="card-stark bg-white p-6 space-y-6 border-2 border-black animate-fadeIn">
      
      {/* Welcome Banner */}
      <div className="bg-black text-white p-5 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-stark bg-yellow-200 text-black text-[10px]">
              AUTHENTICATED SESSION
            </span>
            <span className="badge-stark bg-green-200 text-black text-[10px]">
              @IPU.AC.IN DOMAIN
            </span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">
            WELCOME, {user?.name || "ALEX RIVERA"}!
          </h2>
          <p className="text-xs text-gray-300 font-mono mt-0.5">
            Logged in as: <span className="font-bold text-yellow-300">{user?.email}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-extrabold uppercase text-gray-400">SELECT YOUR OPERATING MODE</div>
          <div className="text-xs font-black uppercase tracking-wider text-white">STEP 2 OF 2</div>
        </div>
      </div>

      {/* Mode Selection Grid */}
      <div className="space-y-3">
        <div className="border-b-1.5 border-black pb-2 flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-wider text-gray-600">
            CHOOSE PORTAL OPERATING MODE
          </h3>
          <span className="text-[10px] font-extrabold bg-gray-100 border border-black px-2 py-0.5">
            PERMISSIONS REVIEW ENFORCED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Student Mode (Auto-Approved for Students) */}
          <div
            onClick={() => onModeSelected("student")}
            className="card-stark bg-white p-5 hover:bg-gray-50 cursor-pointer border-2 border-black flex flex-col justify-between items-center text-center aspect-square group transition-all"
          >
            <div className="p-3.5 bg-black text-white rounded-none mb-2">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 my-auto">
              <span className="badge-stark bg-green-200 text-[10px]">
                AUTO-GRANTED ACCESS
              </span>
              <h3 className="font-black text-base uppercase tracking-tight group-hover:underline">
                STUDENT MODE
              </h3>
              <p className="text-xs font-medium text-gray-600">
                Build your career profile, skills, projects, experience and applications.
              </p>
            </div>

            <button className="btn-primary w-full text-xs justify-center py-1.5 mt-auto">
              <span>ENTER STUDENT PORTAL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Resume Studio (Auto-Approved for Students) */}
          <div
            onClick={() => onModeSelected("resume")}
            className="card-stark bg-white p-5 hover:bg-gray-50 cursor-pointer border-2 border-black flex flex-col justify-between items-center text-center aspect-square group transition-all"
          >
            <div className="p-3.5 bg-black text-white rounded-none mb-2">
              <Files className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 my-auto">
              <span className="badge-stark bg-yellow-200 text-[10px]">STUDENT WORKSPACE</span>
              <h3 className="font-black text-base uppercase tracking-tight group-hover:underline">RESUME STUDIO</h3>
              <p className="text-xs font-medium text-gray-600">Generate, upload, organize and score role-specific resumes.</p>
            </div>

            <button className="btn-primary w-full text-xs justify-center py-1.5 mt-auto">
              <span>OPEN RESUME STUDIO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: PR & Outreach Mode */}
          <div
            onClick={() => onModeSelected("pr_outreach")}
            className="card-stark bg-white p-5 hover:bg-gray-50 cursor-pointer border-2 border-black flex flex-col justify-between items-center text-center aspect-square group transition-all"
          >
            <div className="p-3.5 bg-black text-white rounded-none mb-2">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 my-auto">
              <span className="badge-stark bg-blue-200 text-[10px]">AI MAIL WORKSPACE</span>
              <h3 className="font-black text-base uppercase tracking-tight group-hover:underline">PR & OUTREACH</h3>
              <p className="text-xs font-medium text-gray-600">Draft, refine and approve professional outreach emails with the assistant.</p>
            </div>

            <button className="btn-primary w-full text-xs justify-center py-1.5 mt-auto">
              <span>OPEN MAIL WORKSPACE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Company Recruiter Mode */}
          <div className="card-stark bg-white p-5 border-2 border-black flex flex-col justify-between items-center text-center aspect-square transition-all relative">
            <div className="p-3.5 bg-black text-white rounded-none mb-2">
              <Building className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 my-auto">
              <span className="badge-stark bg-yellow-200 text-[10px]">
                RECRUITER PORTAL
              </span>
              <h3 className="font-black text-base uppercase tracking-tight">
                COMPANY MODE
              </h3>
              <p className="text-xs font-medium text-gray-600">
                Publish corporate placement drives and review applicant resumes.
              </p>
            </div>

            {user?.role === "company" ? (
              <button
                onClick={() => onModeSelected("company")}
                className="btn-primary w-full text-xs justify-center py-1.5 mt-auto"
              >
                <span>ENTER RECRUITER PORTAL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : requestedAccess.company === "pending" ? (
              <div className="w-full bg-yellow-100 border border-black p-1.5 text-[11px] font-bold flex items-center justify-center gap-1 text-black">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>TPO PERMISSION REQUEST PENDING...</span>
              </div>
            ) : (
              <button
                onClick={() => handleAccessRequest("company")}
                className="btn-secondary w-full text-xs justify-center py-1.5 mt-auto bg-gray-100 hover:bg-gray-200"
              >
                <span>REQUEST RECRUITER ACCESS</span>
              </button>
            )}
          </div>

          {/* Card 5: TPO Placement Mode */}
          <div className="card-stark bg-white p-5 border-2 border-black flex flex-col justify-between items-center text-center aspect-square transition-all relative">
            <div className="p-3.5 bg-black text-white rounded-none mb-2">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 my-auto">
              <span className="badge-stark bg-red-200 text-[10px]">
                RESTRICTED TPO ADMIN
              </span>
              <h3 className="font-black text-base uppercase tracking-tight">
                TPO MODE
              </h3>
              <p className="text-xs font-medium text-gray-600">
                Oversee campus statistics, approve company access requests & drives.
              </p>
            </div>

            {requestedAccess.tpo === "pending" ? (
              <div className="w-full bg-red-100 border border-black p-1.5 text-[11px] font-bold flex items-center justify-center gap-1 text-black">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>ACCESS REQUEST SENT TO TPO</span>
              </div>
            ) : (
              <button
                onClick={() => user?.role === "tpo" || user?.role === "admin" ? onModeSelected("tpo") : handleAccessRequest("tpo")}
                className="btn-secondary w-full text-xs justify-center py-1.5 mt-auto bg-gray-100 hover:bg-gray-200"
              >
                <span>{user?.role === "tpo" || user?.role === "admin" ? "ENTER TPO PORTAL" : "REQUEST TPO ACCESS"}</span>
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
