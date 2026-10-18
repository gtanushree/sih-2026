import ModeDropdown from "./ModeDropdown";
import { Menu } from "lucide-react";

export default function HeaderBar({ activeMode, setActiveMode, user, onOpenDrawer }) {
  return (
    <header className="bg-white border-b-2 border-black px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="bg-black text-white font-black text-xl px-2.5 py-1 border-2 border-black">
            TNP.AI
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight uppercase tracking-tight">
              IPU Placement Platform
            </h1>
            <p className="text-xs font-semibold text-gray-600">GGSIPU Training & Placement Cell</p>
          </div>
        </div>

        {/* Custom Mode Selector Dropdown */}
        <ModeDropdown activeMode={activeMode} setActiveMode={setActiveMode} userRole={user?.role} />

        {/* Hamburger Menu Trigger Button (Replaces raw Logout icon) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDrawer}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-2 border-1.5 border-black shadow-bold-sm cursor-pointer"
            title="Open Control Menu & AI History"
          >
            <Menu className="w-4 h-4 text-white" />
            <span className="font-extrabold tracking-wider">MENU</span>
          </button>
        </div>

      </div>
    </header>
  );
}
