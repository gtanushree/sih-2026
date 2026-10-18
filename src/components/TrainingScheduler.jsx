import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Calendar, Users, MapPin, Clock, BookOpen, Plus, CheckCircle, Search } from "lucide-react";

export default function TrainingScheduler() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await api.getTrainingPrograms();
      setPrograms(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-stark bg-white mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 mb-4 gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-black" />
          <h3 className="font-black text-sm uppercase">TRAINING PROGRAMS SCHEDULER</h3>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
              <input type="text" placeholder="Search..." className="input-stark py-1.5 pl-8 text-xs w-48" />
           </div>
           <button className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
              <Plus className="w-4 h-4" /> NEW PROGRAM
           </button>
        </div>
      </div>

      {loading ? (
        <div className="text-xs font-bold p-4">Loading training programs...</div>
      ) : (
        <div className="space-y-4">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="border-2 border-black bg-blue-50 p-3 shadow-bold-sm">
                 <div className="text-[10px] font-extrabold uppercase text-gray-600">Active Programs</div>
                 <div className="text-2xl font-black">{programs.length}</div>
              </div>
              <div className="border-2 border-black bg-green-50 p-3 shadow-bold-sm">
                 <div className="text-[10px] font-extrabold uppercase text-gray-600">Total Enrolled</div>
                 <div className="text-2xl font-black">{programs.reduce((acc, curr) => acc + (curr.enrolledCount || 0), 0)}</div>
              </div>
              <div className="border-2 border-black bg-yellow-50 p-3 shadow-bold-sm">
                 <div className="text-[10px] font-extrabold uppercase text-gray-600">Upcoming Sessions</div>
                 <div className="text-2xl font-black">{programs.reduce((acc, curr) => acc + (curr.schedule?.length || 0), 0)}</div>
              </div>
           </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-2 border-black">
              <thead>
                <tr className="bg-black text-white text-xs uppercase">
                  <th className="p-2 border-2 border-black">Program Title</th>
                  <th className="p-2 border-2 border-black">Type</th>
                  <th className="p-2 border-2 border-black">Instructor</th>
                  <th className="p-2 border-2 border-black">Next Session</th>
                  <th className="p-2 border-2 border-black">Enrollment</th>
                  <th className="p-2 border-2 border-black">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium">
                {programs.map((prog) => (
                  <tr key={prog._id} className="hover:bg-gray-50">
                    <td className="p-2 border-2 border-black font-extrabold">{prog.title}</td>
                    <td className="p-2 border-2 border-black">
                       <span className="badge-stark bg-blue-100 text-[9px]">{prog.type}</span>
                    </td>
                    <td className="p-2 border-2 border-black font-bold">{prog.instructor}</td>
                    <td className="p-2 border-2 border-black">
                      <div className="flex flex-col gap-0.5">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(prog.schedule[0].date).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1 text-[10px] text-gray-500"><Clock className="w-3 h-3"/> {prog.schedule[0].time}</span>
                      </div>
                    </td>
                    <td className="p-2 border-2 border-black">
                       <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 h-2 border border-black"><div className="bg-black h-full" style={{ width: `${(prog.enrolledCount/prog.capacity)*100}%` }}></div></div>
                          <span className="font-mono font-bold text-[10px]">{prog.enrolledCount}/{prog.capacity}</span>
                       </div>
                    </td>
                    <td className="p-2 border-2 border-black">
                      <button className="btn-secondary px-2 py-1 text-[10px]">MANAGE</button>
                    </td>
                  </tr>
                ))}
                {programs.length === 0 && (
                   <tr><td colSpan="6" className="p-4 text-center border-2 border-black font-bold text-gray-500 text-xs">No programs scheduled.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
