import React, { useState } from "react";
import { Lock, ShieldAlert, AlertOctagon, Send, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function AccessDeniedView({ user, attemptedMode, onReturnToApprovedMode }) {
  const [requestSent, setRequestSent] = useState(false);

  const handleSendTpoRequest = () => {
    setRequestSent(true);
  };

  const modeTitle = attemptedMode === "admin" ? "TPO ADMIN OVERSIGHT MODE" : "COMPANY RECRUITER MODE";

  return (
    <div className="card-stark bg-white p-8 border-2 border-black space-y-6 animate-fadeIn">
      
      {/* Stark Red Warning Header */}
      <div className="bg-red-600 text-white p-5 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black text-white border border-white">
            <Lock className="w-8 h-8 text-yellow-300" />
          </div>
          <div>
            <span className="badge-stark bg-yellow-300 text-black text-[10px] font-black">
              HTTP 403 UNAUTHORIZED
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-white mt-0.5">
              ACCESS DENIED TO {modeTitle}
            </h2>
            <p className="text-xs text-red-100 font-mono">
              Role: <span className="font-bold text-white uppercase">{user?.role || "STUDENT"}</span> | User: <span className="font-bold text-yellow-200">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="badge-stark bg-white text-black text-xs font-black">
          SECURITY GUARD ENFORCED
        </div>
      </div>

      {/* Main Context Explanation Card */}
      <div className="p-4 border-2 border-black bg-gray-50 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-red-600 font-black text-sm uppercase">
          <AlertOctagon className="w-5 h-5" />
          <span>PERMISSIONS POLICY CHECK FAILED</span>
        </div>

        <p className="text-gray-800 font-medium leading-relaxed">
          Your account <span className="font-bold text-black font-mono">{user?.email}</span> is currently registered with <span className="font-extrabold text-black">STUDENT PERMISSIONS</span>. Operating <span className="font-extrabold text-black">{modeTitle}</span> requires elevated Administrative or Corporate Recruiter access clearance issued directly by the <span className="font-black text-black">GGSIPU Training & Placement Officer (TPO)</span>.
        </p>

        <div className="p-3 bg-white border border-black space-y-1 font-mono text-[11px]">
          <div>• Attempted Mode: <span className="font-bold uppercase text-red-600">{attemptedMode}</span></div>
          <div>• User Registered Role: <span className="font-bold uppercase text-black">{user?.role || "student"}</span></div>
          <div>• Status: <span className="font-bold uppercase text-red-600">Access Restricted by Role Guard</span></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={onReturnToApprovedMode}
          className="btn-secondary w-full sm:w-auto text-xs py-2 px-4 flex items-center justify-center gap-2 font-black"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← RETURN TO APPROVED STUDENT MODE</span>
        </button>

        {requestSent ? (
          <div className="badge-stark bg-green-200 text-black text-xs py-2 px-4 flex items-center gap-2 border-2 border-black font-black">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>TPO ACCESS CLEARANCE REQUEST LOGGED</span>
          </div>
        ) : (
          <button
            onClick={handleSendTpoRequest}
            className="btn-primary w-full sm:w-auto text-xs py-2 px-4 flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800"
          >
            <Send className="w-4 h-4" />
            <span>REQUEST ACCESS CLEARANCE FROM TPO</span>
          </button>
        )}
      </div>

    </div>
  );
}
