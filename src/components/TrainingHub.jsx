import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { BookOpen, Calendar, CheckCircle, Clock, MapPin, Users } from "lucide-react";

export default function TrainingHub() {
  const [activeTab, setActiveTab] = useState("discover"); // discover | my_programs
  const [programs, setPrograms] = useState([]);
  const [myPrograms, setMyPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        api.getTrainingPrograms(),
        api.getMyTrainingPrograms(),
      ]);
      setPrograms(allRes.data || []);
      setMyPrograms(myRes.data || []);
    } catch (error) {
      console.error("Failed to fetch training data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (programId) => {
    try {
      await api.registerForTraining(programId);
      // Optimistic update or refetch
      fetchData();
      alert("Successfully enrolled in training program!");
    } catch (error) {
      console.error("Enrollment failed", error);
      alert("Failed to enroll.");
    }
  };

  if (loading) {
    return (
      <div className="card-stark p-10 text-center">
        <div className="text-xs font-black uppercase">Loading Training Programs...</div>
      </div>
    );
  }

  return (
    <div className="card-stark space-y-4 bg-white">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <h3 className="text-sm font-black uppercase">TRAINING & CERTIFICATIONS</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-3 py-1 text-xs font-bold ${
              activeTab === "discover" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            DISCOVER
          </button>
          <button
            onClick={() => setActiveTab("my_programs")}
            className={`px-3 py-1 text-xs font-bold ${
              activeTab === "my_programs" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            MY PROGRAMS
          </button>
        </div>
      </div>

      {activeTab === "discover" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {programs.map((prog) => (
            <div key={prog._id} className="flex flex-col border-2 border-black bg-gray-50 p-4 transition-all hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-2 flex items-start justify-between">
                <span className="badge-stark bg-blue-100 text-[10px]">{prog.type}</span>
                <span className="badge-stark bg-yellow-100 text-[10px]">{prog.status.toUpperCase()}</span>
              </div>
              <h4 className="text-sm font-black uppercase">{prog.title}</h4>
              <p className="mb-4 mt-2 text-xs font-medium text-gray-600 line-clamp-2">{prog.description}</p>
              
              <div className="mt-auto space-y-2 text-[11px] font-bold text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(prog.schedule[0].date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{prog.schedule[0].time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{prog.schedule[0].venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>{prog.enrolledCount} / {prog.capacity} Enrolled</span>
                </div>
              </div>

              <button 
                onClick={() => handleEnroll(prog._id)}
                className="btn-primary mt-4 w-full py-2 text-xs"
                disabled={myPrograms.some(mp => mp.program._id === prog._id)}
              >
                {myPrograms.some(mp => mp.program._id === prog._id) ? "ALREADY ENROLLED" : "ENROLL NOW"}
              </button>
            </div>
          ))}
          {programs.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-gray-400 p-8 text-center">
              <div className="text-xs font-black uppercase">No programs available</div>
            </div>
          )}
        </div>
      )}

      {activeTab === "my_programs" && (
        <div className="space-y-3">
          {myPrograms.map((entry, index) => (
            <div key={index} className="flex flex-col gap-3 border-2 border-black bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-stark bg-blue-100 text-[9px]">{entry.program.type}</span>
                  <span className="badge-stark bg-green-200 text-[9px]">{entry.completionStatus.toUpperCase()}</span>
                </div>
                <h4 className="text-sm font-black uppercase">{entry.program.title}</h4>
                <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {new Date(entry.program.schedule[0].date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {entry.program.schedule[0].venue}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="border border-black px-2 py-1 text-center">
                   <div className="text-[9px] font-black uppercase text-gray-500">Attendance</div>
                   <div className="text-sm font-black">{entry.attendance.length} / {entry.program.schedule.length}</div>
                 </div>
                 {entry.completionStatus === 'completed' && (
                   <button className="btn-primary flex items-center gap-1 px-3 py-2 text-[10px]">
                     <CheckCircle className="h-3.5 w-3.5" /> CERTIFICATE
                   </button>
                 )}
              </div>
            </div>
          ))}
          {myPrograms.length === 0 && (
             <div className="border-2 border-dashed border-gray-400 p-8 text-center">
              <div className="text-xs font-black uppercase">Not enrolled in any programs</div>
              <button onClick={() => setActiveTab("discover")} className="btn-secondary mt-3 px-3 py-1.5 text-xs">BROWSE PROGRAMS</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
