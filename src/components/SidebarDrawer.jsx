import { useState } from "react";
import {
  X, LogOut, History, Settings, User, ChevronRight, MessageSquareText, MessageSquare
} from "lucide-react";

const cleanPreview = (text = "") => text
  .replace(/[#*_`>]/g, "")
  .replaceAll("[", "")
  .replaceAll("]", "")
  .replace(/\s+/g, " ")
  .trim();

const getHistoryGroup = (value) => {
  if (!value) return "Older";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Older";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const daysAgo = Math.floor((today - date) / 86400000);

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo <= 7) return "Previous 7 Days";
  if (daysAgo <= 30) return "Previous 30 Days";
  return "Older";
};

const HISTORY_GROUPS = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older"];

export default function SidebarDrawer({ isOpen, onClose, user, onLogout, onOpenProfile, chatSessions = [], onSelectChat }) {
  const isTpo = user?.role === "tpo" || user?.role === "admin";
  const [driveAlerts, setDriveAlerts] = useState(true);
  const [aiScoring, setAiScoring] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleAnimatedClose = (callback) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      if (callback) callback();
    }, 220);
  };

  const recentAiHistory = chatSessions
    .map((session) => ({
      sessionId: session.sessionId,
      title: session.title,
      date: session.updatedAt || session.createdAt,
    }))
    .slice(0, 30);

  const groupedAiHistory = HISTORY_GROUPS
    .map((label) => ({
      label,
      items: recentAiHistory.filter((item) => getHistoryGroup(item.date) === label)
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Darkened Backdrop Overlay with Entrance & Exit Animation */}
      <div
        onClick={() => handleAnimatedClose()}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs ${isClosing ? "animate-fade-overlay-out" : "animate-fade-overlay"
          }`}
      />

      {/* Right Side Drawer Panel with Smooth Slide-In & Slide-Out Animation */}
      <aside
        className={`relative w-full sm:w-1/3 min-w-[340px] max-w-md bg-white border-l-2 border-black h-full flex flex-col z-10 shadow-2xl overflow-hidden ${isClosing ? "animate-drawer-slide-out" : "animate-drawer-slide"
          }`}
      >

        {/* Drawer Header */}
        <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black text-white rounded-none">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-tight">PORTAL CONTROL DRAWER</h2>
              <p className="text-[11px] font-semibold text-gray-600">AI History & Settings</p>
            </div>
          </div>

          <button
            onClick={() => handleAnimatedClose()}
            className="btn-secondary p-1.5 hover:bg-gray-200 transition-transform duration-150 active:scale-95 cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body — Independently Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Section 1: AI Chat History */}
          <div className="animate-item-up" style={{ animationDelay: "40ms" }}>
            <div className="mb-3 flex items-center border-b-2 border-black pb-2">
              <div className="flex min-w-0 items-center gap-1.5 text-xs font-extrabold uppercase">
                <History className="h-4 w-4 shrink-0 text-black" />
                <span className="truncate">RECENT AI CHAT HISTORY</span>
              </div>
            </div>

            <div className="max-h-[42vh] overflow-y-auto pr-1">
              {groupedAiHistory.map((group) => (
                <div key={group.label} className="mb-4 last:mb-0">
                  <h3 className="mb-1.5 px-2 text-[10px] font-bold text-gray-500">
                    {group.label}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item, idx) => (
                      <button
                        type="button"
                        key={item.sessionId || `${item.date || group.label}-${idx}`}
                        title={cleanPreview(item.title)}
                        onClick={() => handleAnimatedClose(() => onSelectChat?.(item.sessionId))}
                        className="group flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-200"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800">
                          {cleanPreview(item.title) || "Untitled conversation"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {recentAiHistory.length === 0 && (
                <div className="flex flex-col items-center border-2 border-dashed border-gray-400 bg-gray-50 px-4 py-6 text-center">
                  <MessageSquareText className="mb-2 h-6 w-6 text-gray-400" />
                  <div className="text-[11px] font-black uppercase">No conversations yet</div>
                  <p className="mt-1 max-w-52 text-[10px] font-medium text-gray-500">
                    Ask the placement assistant about jobs or resumes to start your history.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Account Info Box */}
          {user && (
            <div className="card-stark bg-white p-3 space-y-2 border-1.5 border-black hover:border-black transition-all animate-item-up" style={{ animationDelay: "80ms" }}>
              <div className="flex items-center justify-between">
                <span className="badge-stark bg-green-200 text-[10px]">
                  {isTpo ? "COLLEGE TPO ACCOUNT" : "IPU DOMAIN ACCOUNT"}
                </span>
                {!isTpo && <span className="text-[10px] font-mono font-bold text-gray-500">
                  CGPA {user.cgpa || 0.0}
                </span>}
              </div>
              <div>
                <div className="font-black text-sm uppercase">{user.name || "Alex Rivera"}</div>
                <div className="text-xs font-mono text-gray-600">{user.email || "alex.cs2026@ipu.ac.in"}</div>
              </div>
              <button
                onClick={() => handleAnimatedClose(onOpenProfile)}
                className="btn-secondary w-full text-xs py-1.5 justify-center mt-1 group cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isTpo ? "EDIT TPO PROFILE" : "EDIT PROFILE & ACADEMICS"}</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          )}

        </div>

        {/* Section 2: Platform Settings */}
        <div className="p-4 space-y-2.5 animate-item-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-1.5 border-b-1.5 border-black pb-1.5 text-xs font-extrabold uppercase">
            <Settings className="w-4 h-4 text-black" />
            <span>PREFERENCES & SETTINGS</span>
          </div>

          <div className="space-y-3 text-xs bg-gray-50 p-3 border border-black">
            {/* Toggle 1: Placement Alerts */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">Email Drive Alerts</div>
                <div className="text-[10px] text-gray-500">Instant email notifications for new drives</div>
              </div>
              <button
                onClick={() => setDriveAlerts(!driveAlerts)}
                className={`w-9 h-5 flex items-center border-1.5 border-black p-0.5 transition-all duration-200 cursor-pointer ${driveAlerts ? "bg-black justify-end" : "bg-gray-200 justify-start"
                  }`}
              >
                <div className="w-3.5 h-3.5 bg-white border border-black transition-transform duration-200" />
              </button>
            </div>

            {/* Toggle 2: AI Auto Scoring */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">AI Auto Resume Scoring</div>
                <div className="text-[10px] text-gray-500">Auto re-calculate ATS score when PDF updates</div>
              </div>
              <button
                onClick={() => setAiScoring(!aiScoring)}
                className={`w-9 h-5 flex items-center border-1.5 border-black p-0.5 transition-all duration-200 cursor-pointer ${aiScoring ? "bg-black justify-end" : "bg-gray-200 justify-start"
                  }`}
              >
                <div className="w-3.5 h-3.5 bg-white border border-black transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer: Logout Session */}
        <div className="p-4 border-t-2 border-black bg-gray-50 animate-item-up" style={{ animationDelay: "160ms" }}>
          <button
            onClick={() => handleAnimatedClose(onLogout)}
            className="btn-primary w-full justify-center py-2.5 text-xs bg-red-600 text-white border-black hover:bg-red-700 transition-transform duration-150 active:scale-98 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT CURRENT SESSION</span>
          </button>
        </div>

      </aside>
    </div>
  );
}
