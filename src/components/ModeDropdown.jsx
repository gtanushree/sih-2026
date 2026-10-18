import { useState, useRef, useEffect } from "react";
import { GraduationCap, Building2, ShieldCheck, ChevronDown, Check, Files, Mail, Users } from "lucide-react";

const MODES = [
  {
    id: "student",
    label: "Student Mode",
    badge: "IPU @ipu.ac.in",
    icon: GraduationCap,
    description: "Career profile, skills, projects, experience & job matching"
  },
  {
    id: "alumni_connect",
    label: "Alumni Connect",
    badge: "Student Mentorship",
    icon: Users,
    description: "Find alumni mentors and manage connection requests"
  },
  {
    id: "alumni",
    label: "Alumni Portal",
    badge: "Mentor Workspace",
    icon: Users,
    description: "Onboard, review requests and mentor students"
  },
  {
    id: "resume",
    label: "Resume Studio",
    badge: "Student Workspace",
    icon: Files,
    description: "Generate, upload, manage and score resume versions"
  },
  {
    id: "pr_outreach",
    label: "PR & Outreach",
    badge: "AI Mail Workspace",
    icon: Mail,
    description: "Draft and review professional outreach with the AI agent"
  },
  {
    id: "company",
    label: "Company / Recruiter Mode",
    badge: "Verified Domain",
    icon: Building2,
    description: "Post placement drives & manage student applicants"
  },
  {
    id: "tpo",
    label: "College TPO Mode",
    badge: "Super Admin",
    icon: ShieldCheck,
    description: "TPO oversight, analytics & campus drive management"
  }
];

export default function ModeDropdown({ activeMode, setActiveMode, userRole = "student" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const allowedByRole = {
    student: ["student", "resume", "pr_outreach", "alumni_connect"],
    tpo: ["tpo", "pr_outreach"],
    admin: ["tpo", "pr_outreach"],
    company: ["company"],
    alumni: ["alumni"],
  };
  const visibleModes = MODES.filter((mode) => (allowedByRole[userRole] || ["student"]).includes(mode.id));
  const currentMode = visibleModes.find((m) => m.id === activeMode) || visibleModes[0] || MODES[0];
  const CurrentIcon = currentMode.icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button with space-between layout */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-72 flex items-center justify-between gap-2.5 bg-white border border-gray-900 px-3.5 py-1.5 rounded-none hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-black text-white rounded-none">
            <CurrentIcon className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 leading-none">
              CURRENT MODE
            </div>
            <div className="text-xs font-black uppercase text-black mt-0.5">
              <span>{currentMode.label}</span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-black transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-1.5 w-72 bg-white border-2 border-black z-50 py-0 rounded-none divide-y divide-gray-100 shadow-md">
          {visibleModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => {
                  setActiveMode(mode.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${isSelected ? "bg-black text-white" : "hover:bg-gray-100 text-black"
                  }`}
              >
                <div
                  className={`p-1.5 rounded-none mt-0.5 ${isSelected ? "bg-white text-black" : "bg-black text-white"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black uppercase tracking-tight truncate">
                      {mode.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                  </div>
                  <p
                    className={`text-[11px] font-medium leading-tight mt-0.5 line-clamp-1 ${isSelected ? "text-gray-300" : "text-gray-600"
                      }`}
                  >
                    {mode.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
