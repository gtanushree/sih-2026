import { useState } from "react";
import { Sliders, X, Save, Check, GraduationCap, Link2, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import GgsipuConnect from "./GgsipuConnect";

export default function ProfileModal({ user, onClose, onProfileUpdated }) {
  const isTpo = user?.role === "tpo" || user?.role === "admin";
  const [name, setName] = useState(user?.name || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [collegeName, setCollegeName] = useState(user?.collegeName || "");
  const [passingYear, setPassingYear] = useState(user?.passingYear || "");
  const [ggsipuLinked, setGgsipuLinked] = useState(user?.ggsipuLinked || false);
  const [cgpa, setCgpa] = useState(user?.cgpa ?? "");
  const [skills, setSkills] = useState((user?.skills || []).join(", "));
  const [projects, setProjects] = useState((user?.projects || []).map((project) => ({
    ...project,
    skills: Array.isArray(project.skills) ? project.skills.join(", ") : project.skills || ""
  })));
  const [certifications, setCertifications] = useState(user?.certifications || []);
  const [experience, setExperience] = useState(user?.experience || []);
  const [socialLinks, setSocialLinks] = useState({
    github: user?.socialLinks?.github || "",
    linkedin: user?.socialLinks?.linkedin || "",
  });
  const [showGgsipuConnect, setShowGgsipuConnect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("General");
  const tabs = ["General", "Skills", "Projects", "Certifications", "Experience"];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const profileUpdate = isTpo
        ? { name: name.trim() }
        : {
          branch,
          collegeName,
          passingYear,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          projects: projects.filter((project) => project.title?.trim()).map((project) => ({
            ...project,
            skills: String(project.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean)
          })),
          certifications: certifications.filter((certificate) => certificate.name?.trim()),
          experience: experience.filter((item) => item.title?.trim()),
          socialLinks: {
            ...(user?.socialLinks || {}),
            github: socialLinks.github.trim(),
            linkedin: socialLinks.linkedin.trim(),
          },
          ...(cgpa !== "" ? { cgpa: parseFloat(cgpa) } : {}),
        };

      const res = await api.updateProfile(profileUpdate);
      setSaved(true);
      if (onProfileUpdated) onProfileUpdated(res.data);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 800);
    } catch {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const updateListItem = (setter, index, field, value) => {
    setter((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const removeListItem = (setter, index) => {
    setter((items) => items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-stark bg-white max-h-[90vh] max-w-md w-full relative overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 btn-secondary p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
          <Sliders className="w-5 h-5" />
          <h2 className="font-black text-base uppercase">{isTpo ? "EDIT TPO PROFILE" : "EDIT STUDENT PROFILE"}</h2>
        </div>

        {!isTpo && (
          <div className="flex w-full items-center gap-1 overflow-x-auto border-b-2 border-black pb-2 mb-4 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[10px] font-black uppercase transition-colors whitespace-nowrap ${activeTab === tab ? "bg-black text-white" : "bg-gray-100 text-black hover:bg-gray-200"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {(!isTpo ? activeTab === "General" : true) && (
            <div className="space-y-4 animate-in fade-in">
              {!isTpo && <div className="border-2 border-black bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <div>
                <div className="text-xs font-black uppercase">GGSIPU Academic Profile</div>
                <div className="text-[10px] font-semibold text-gray-600">
                  Optional sync for branch, CGPA and academic records
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGgsipuConnect((current) => !current)}
              className="btn-secondary shrink-0 px-2 py-1 text-[10px]"
            >
              <Link2 className="h-3.5 w-3.5" />
              {showGgsipuConnect ? "CLOSE" : ggsipuLinked ? "RE-SYNC" : "CONNECT IPU"}
            </button>
          </div>

          {ggsipuLinked && !showGgsipuConnect && (
            <div className="mt-2 text-[10px] font-bold text-green-800">ACADEMIC PROFILE CONNECTED</div>
          )}

          {showGgsipuConnect && (
            <div className="mt-3 border-t border-black pt-3">
              <GgsipuConnect
                onConnected={(updatedUser) => {
                  setGgsipuLinked(true);
                  setBranch(updatedUser.branch || "");
                  setCgpa(updatedUser.cgpa ?? "");
                  onProfileUpdated?.(updatedUser);
                }}
              />
            </div>
              )}
            </div>}

            <div>
            <label className="block text-xs font-extrabold uppercase mb-1">{isTpo ? "TPO Name" : "Student Name"}</label>
            <input
              type="text"
              disabled={!isTpo}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required={isTpo}
              className={`input-stark w-full text-xs font-bold ${isTpo ? "bg-white" : "bg-gray-100"}`}
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase mb-1">{isTpo ? "Official College Email" : "College Email"}</label>
            <input
              type="text"
              disabled
              value={user?.email || "student@college.edu"}
              className="input-stark w-full text-xs bg-gray-100 font-mono"
            />
          </div>

          {!isTpo && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase">College Name</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(event) => setCollegeName(event.target.value)}
                    placeholder="e.g. MSIT"
                    className="input-stark w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase">Passing Year</label>
                  <input
                    type="text"
                    value={passingYear}
                    onChange={(event) => setPassingYear(event.target.value)}
                    placeholder="e.g. 2026"
                    className="input-stark w-full text-xs font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase">Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    placeholder="e.g. CSE"
                    required
                    className="input-stark w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase">CGPA</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={cgpa}
                    onChange={(event) => setCgpa(event.target.value)}
                    placeholder="0.00 – 10.00"
                    required
                    className="input-stark w-full text-xs font-bold"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-3 pt-2">
            <label className="text-xs font-extrabold uppercase">Socials</label>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">GitHub</label>
              <input
                type="url"
                value={socialLinks.github}
                onChange={(event) => setSocialLinks((links) => ({ ...links, github: event.target.value }))}
                placeholder="https://github.com/username"
                className="input-stark w-full text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase text-gray-600">LinkedIn</label>
              <input
                type="url"
                value={socialLinks.linkedin}
                onChange={(event) => setSocialLinks((links) => ({ ...links, linkedin: event.target.value }))}
                placeholder="https://www.linkedin.com/in/username"
                className="input-stark w-full text-xs"
              />
            </div>
          </div>
          </div>
          )}

          {!isTpo && activeTab === "Skills" && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-extrabold uppercase mb-1">Skills (Comma-separated)</label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={5}
                  className="input-stark w-full text-xs font-medium"
                  placeholder="React, TypeScript, Node.js, Python, SQL..."
                />
              </div>
            </div>
          )}

          {!isTpo && activeTab === "Projects" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase">Projects</label>
                <button type="button" onClick={() => setProjects((items) => [...items, { title: "", description: "", skills: "", link: "" }])} className="btn-secondary px-2 py-1 text-[10px]"><Plus className="h-3 w-3" /> ADD PROJECT</button>
              </div>
            {projects.map((project, index) => (
              <div key={index} className="space-y-2 border-2 border-black bg-gray-50 p-2.5">
                <div className="flex gap-2">
                  <input value={project.title || ""} onChange={(event) => updateListItem(setProjects, index, "title", event.target.value)} placeholder="Project title" className="input-stark min-w-0 flex-1 text-xs" />
                  <button type="button" onClick={() => removeListItem(setProjects, index)} className="btn-secondary p-1.5" title="Remove project"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <textarea value={project.description || ""} onChange={(event) => updateListItem(setProjects, index, "description", event.target.value)} placeholder="What did you build?" rows={2} className="input-stark w-full text-xs" />
                <input value={project.skills || ""} onChange={(event) => updateListItem(setProjects, index, "skills", event.target.value)} placeholder="Skills: React, Python, SQL" className="input-stark w-full text-xs" />
              </div>
            ))}
          </div>
          )}

          {!isTpo && activeTab === "Certifications" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase">Certifications</label>
                <button type="button" onClick={() => setCertifications((items) => [...items, { name: "", issuer: "", date: "", credentialUrl: "" }])} className="btn-secondary px-2 py-1 text-[10px]"><Plus className="h-3 w-3" /> ADD CERTIFICATION</button>
              </div>
            {certifications.map((certificate, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 border-2 border-black bg-gray-50 p-2.5">
                <input value={certificate.name || ""} onChange={(event) => updateListItem(setCertifications, index, "name", event.target.value)} placeholder="Certificate" className="input-stark min-w-0 text-xs" />
                <input value={certificate.issuer || ""} onChange={(event) => updateListItem(setCertifications, index, "issuer", event.target.value)} placeholder="Issuer" className="input-stark min-w-0 text-xs" />
                <button type="button" onClick={() => removeListItem(setCertifications, index)} className="btn-secondary p-1.5" title="Remove certification"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            </div>
          )}

          {!isTpo && activeTab === "Experience" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase">Experience</label>
                <button type="button" onClick={() => setExperience((items) => [...items, { title: "", company: "", duration: "", description: "" }])} className="btn-secondary px-2 py-1 text-[10px]"><Plus className="h-3 w-3" /> ADD EXPERIENCE</button>
              </div>
            {experience.map((item, index) => (
              <div key={index} className="space-y-2 border-2 border-black bg-gray-50 p-2.5">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input value={item.title || ""} onChange={(event) => updateListItem(setExperience, index, "title", event.target.value)} placeholder="Role" className="input-stark min-w-0 text-xs" />
                  <input value={item.company || ""} onChange={(event) => updateListItem(setExperience, index, "company", event.target.value)} placeholder="Company" className="input-stark min-w-0 text-xs" />
                  <button type="button" onClick={() => removeListItem(setExperience, index)} className="btn-secondary p-1.5" title="Remove experience"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <input value={item.duration || ""} onChange={(event) => updateListItem(setExperience, index, "duration", event.target.value)} placeholder="Duration, e.g. Jun 2025 – Aug 2025" className="input-stark w-full text-xs" />
                <textarea value={item.description || ""} onChange={(event) => updateListItem(setExperience, index, "description", event.target.value)} placeholder="Responsibilities and impact" rows={2} className="input-stark w-full text-xs" />
              </div>
            ))}
            </div>
          )}

          <div className="pt-4 mt-6 border-t-2 border-black flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              CANCEL
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-xs">
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SAVED!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "SAVING..." : "SAVE PROFILE"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
