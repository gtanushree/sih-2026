import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDriveDate(drive) {
  const value = drive.driveDate || drive.eventDate || drive.date || drive.deadline;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function getInitialMonth(drives) {
  const datedDrives = drives.map(getDriveDate).filter(Boolean).sort((a, b) => a - b);
  const today = new Date();
  const relevantDate = datedDrives.find((date) => date >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) || datedDrives.at(-1);
  return relevantDate ? new Date(relevantDate.getFullYear(), relevantDate.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1);
}

export default function PlacementCalendar({ drives = [], title = "PLACEMENT CALENDAR", compact = false }) {
  const scheduledDrives = useMemo(() => drives
    .map((drive) => ({ ...drive, calendarDate: getDriveDate(drive) }))
    .filter((drive) => drive.calendarDate), [drives]);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(drives));
  const [selectedDate, setSelectedDate] = useState(null);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthLabel = visibleMonth.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);
  const selectedEvents = selectedDate ? scheduledDrives.filter((drive) => sameDay(drive.calendarDate, selectedDate)) : [];

  const changeMonth = (offset) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
  };

  return (
    <section className={`card-stark bg-white ${compact ? "p-4" : ""}`}>
      <div className="flex flex-col gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <div>
            <h3 className="text-sm font-black uppercase">{title}</h3>
            <p className="text-[11px] font-medium text-gray-600">Hover over a marked date to see the companies scheduled that day.</p>
          </div>
        </div>
        <span className="badge-stark bg-yellow-100 text-[10px]">{scheduledDrives.length} SCHEDULED</span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_13rem]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="btn-secondary p-1.5"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-xs font-black uppercase">{monthLabel}</div>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="btn-secondary p-1.5"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 border-l border-t border-black">
            {WEEKDAYS.map((day) => <div key={day} className="border-b border-r border-black bg-black py-1.5 text-center text-[10px] font-black uppercase text-white">{day}</div>)}
            {cells.map((day, index) => {
              if (!day) return <div key={`blank-${index}`} className="min-h-16 border-b border-r border-black bg-gray-50" />;
              const date = new Date(year, month, day);
              const events = scheduledDrives.filter((drive) => sameDay(drive.calendarDate, date));
              const isToday = sameDay(date, new Date());
              const eventNames = events.map((event) => `${event.companyName || event.company?.name || "Company"}${event.roleTitle || event.title ? ` - ${event.roleTitle || event.title}` : ""}`).join("\n");
              return (
                <button
                  type="button"
                  key={day}
                  title={eventNames || undefined}
                  onClick={() => events.length && setSelectedDate(date)}
                  className={`group relative min-h-16 border-b border-r border-black p-1.5 text-left transition-colors ${events.length ? "cursor-pointer bg-yellow-50 hover:bg-yellow-100" : "cursor-default bg-white"} ${isToday ? "ring-2 ring-inset ring-black" : ""}`}
                >
                  <span className="text-[11px] font-black">{day}</span>
                  {events.length > 0 && <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-black" />}
                  {events.length > 0 && <span className="absolute bottom-1 right-1 text-[9px] font-black">{events.length}</span>}
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-44 -translate-x-1/2 border-2 border-black bg-black p-2 text-[10px] font-bold leading-relaxed text-white shadow-lg group-hover:block">
                    {eventNames}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="border-2 border-black bg-gray-50 p-3">
          <div className="text-[10px] font-black uppercase text-gray-600">{selectedDate ? selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Date details"}</div>
          {selectedEvents.length ? (
            <div className="mt-2 space-y-2">
              {selectedEvents.map((drive, index) => <div key={drive._id || `${drive.companyName}-${index}`} className="border border-black bg-white p-2">
                <div className="text-xs font-black uppercase">{drive.companyName || drive.company?.name || "Company"}</div>
                <div className="mt-0.5 text-[10px] font-bold text-gray-600">{drive.roleTitle || drive.title || "Placement drive"}</div>
                {drive.location && <div className="mt-1 flex items-center gap-1 text-[10px]"><MapPin className="h-3 w-3" />{drive.location}</div>}
              </div>)}
            </div>
          ) : <div className="mt-2 text-[11px] font-medium leading-relaxed text-gray-600"><Clock className="mb-1 h-4 w-4" />Select a marked date to view its companies. Dates without a marker have no listed drive.</div>}
        </aside>
      </div>
    </section>
  );
}
