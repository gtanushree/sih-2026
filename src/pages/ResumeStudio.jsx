import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  ArrowRight,
  FilePlus2,
  Files,
  Upload,
  Gauge,
  ScanSearch,
  FileText,
} from "lucide-react";
import ResumeScoreCard from "../components/ResumeScoreCard";
import ResumeGeneratorWorkspace from "../components/ResumeGeneratorWorkspace";
import { selectResumeWorkspace } from "../store/aiChatSlice";
import { selectStudentJourney } from "../store/aiChatSlice";
import { api } from "../lib/api";

const tools = [
  {
    id: "generator",
    title: "Resume Generator",
    description: "Build a role-focused resume using your career profile.",
    icon: FilePlus2,
    badge: "AI BUILDER",
  },
  {
    id: "bank",
    title: "Resume Bank",
    description: "Manage different resume versions for different job roles.",
    icon: Files,
    badge: "VERSIONS",
  },
  {
    id: "upload",
    title: "Resume Upload",
    description: "Upload an existing PDF and add it to your workspace.",
    icon: Upload,
    badge: "PDF IMPORT",
  },
  {
    id: "ats",
    title: "ATS Score",
    description: "Measure structure, keywords, clarity and role relevance.",
    icon: Gauge,
    badge: "0–100 SCORE",
  },
  {
    id: "skill-gap",
    title: "Skill Gap Analysis",
    description: "Compare your current skills with a target career path.",
    icon: ScanSearch,
    badge: "CAREER FIT",
  },
];

const roleSkills = {
  "Python Developer": ["Python", "FastAPI", "SQL", "Git", "Docker", "REST APIs"],
  "Frontend Developer": ["JavaScript", "React", "TypeScript", "HTML", "CSS", "Git"],
  "Data Analyst": ["Python", "SQL", "Excel", "Power BI", "Statistics", "Data Visualization"],
};

const scoreLabels = {
  ats_structure: "ATS structure",
  keyword_coverage: "Keyword coverage",
  experience_relevance: "Experience relevance",
  project_relevance: "Project relevance",
};

function ResumeAnalysisPanel({ analysis }) {
  const target = analysis.target_job;
  const gaps = [
    ...(analysis.resume_gaps || []).map((item) => ({ ...item, kind: "Resume gap", color: "bg-yellow-50" })),
    ...(analysis.profile_gaps || []).map((item) => ({ ...item, kind: "Profile gap", color: "bg-red-50" })),
  ];

  return (
    <div className="card-stark space-y-4 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <span className="badge-stark bg-purple-100 text-[10px]">
            {analysis.analysis_type === "gap" ? "JOB GAP ANALYSIS" : "RESUME SCORE"}
          </span>
          <h2 className="mt-2 text-base font-black uppercase">
            {analysis.resume?.title || "Current resume"}
          </h2>
          {target && (
            <p className="text-xs font-bold text-gray-600">
              Against {target.title || "selected role"}{target.company ? ` at ${target.company}` : ""}
            </p>
          )}
        </div>
        <div className="flex h-20 w-20 shrink-0 items-center justify-center border-4 border-black bg-green-100 text-2xl font-black">
          {analysis.overall_score}<span className="text-xs">/100</span>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-700">{analysis.summary}</p>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Object.entries(analysis.subscores || {}).map(([key, value]) => (
          <div key={key} className="border-2 border-black bg-gray-50 p-3">
            <div className="text-[10px] font-black uppercase text-gray-500">{scoreLabels[key] || key.replaceAll("_", " ")}</div>
            <div className="mt-1 text-xl font-black">{value}/100</div>
          </div>
        ))}
      </div>

      {(analysis.matched_requirements || []).length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-black uppercase">Supported matches</h3>
          <div className="space-y-2">
            {analysis.matched_requirements.map((item, index) => (
              <div key={`${item.requirement}-${index}`} className="border-2 border-black bg-green-50 p-3 text-xs">
                <div className="font-black uppercase">{item.requirement}</div>
                <div className="mt-1 text-gray-700">{item.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-black uppercase">Gaps and actions</h3>
          <div className="space-y-2">
            {gaps.map((item, index) => (
              <div key={`${item.kind}-${item.requirement}-${index}`} className={`border-2 border-black p-3 text-xs ${item.color}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black uppercase">{item.requirement}</span>
                  <span className="badge-stark bg-white text-[9px]">{item.kind}</span>
                </div>
                <p className="mt-1 text-gray-700">{item.issue}</p>
                <p className="mt-2 font-bold">Action: {item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(analysis.recommendations || []).length > 0 && (
        <div className="border-2 border-black bg-blue-50 p-3">
          <h3 className="mb-2 text-xs font-black uppercase">Recommended improvements</h3>
          <ul className="list-disc space-y-1 pl-4 text-xs">
            {analysis.recommendations.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResumeStudio({ user, scoreData, onResumeUploaded, onRunGenerator, activeTool, onToolChange }) {
  const [targetRole, setTargetRole] = useState("Python Developer");
  const resumeWorkspace = useSelector(selectResumeWorkspace);
  const resumeAnalysis = resumeWorkspace.analysis;
  const journey = useSelector(selectStudentJourney);
  const [bankResumes, setBankResumes] = useState([]);
  const [bankStatus, setBankStatus] = useState("loading");
  const [bankError, setBankError] = useState("");
  const lastSaveAttempt = useRef(null);

  const loadResumeBank = useCallback(async () => {
    try {
      const result = await api.getResumeBank();
      setBankResumes(result.data || []);
      setBankStatus("ready");
      setBankError("");
    } catch (error) {
      setBankStatus("error");
      setBankError(error.response?.data?.message || error.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadResumeBank();
  }, [loadResumeBank]);

  const saveCompletedResume = useCallback(async () => {
    if (!resumeWorkspace.latexCode?.trim()) return;
    setBankStatus("saving");
    setBankError("");
    try {
      const target = journey.selectedJob;
      const role = target?.roleTitle || target?.title || "Generated Resume";
      const company = target?.companyName || target?.company_name || target?.company;
      const result = await api.saveGeneratedResume({
        latexCode: resumeWorkspace.latexCode,
        title: company ? `${company} ${role}` : role,
        targetJob: target || null,
      });
      setBankResumes((current) => [result.data, ...current.filter((item) => item._id !== result.data._id)]);
      setBankStatus("saved");
    } catch (error) {
      setBankStatus("error");
      setBankError(error.response?.data?.message || error.message);
    }
  }, [journey.selectedJob, resumeWorkspace.latexCode]);

  useEffect(() => {
    if (resumeWorkspace.status !== "complete" || !resumeWorkspace.requestId || lastSaveAttempt.current === resumeWorkspace.requestId) return;
    lastSaveAttempt.current = resumeWorkspace.requestId;
    void saveCompletedResume();
  }, [resumeWorkspace.status, resumeWorkspace.requestId, saveCompletedResume]);

  const viewResume = async (resumeId) => {
    try {
      const result = await api.getResumeAccess(resumeId);
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch (error) { setBankError(error.response?.data?.message || error.message); }
  };

  const skillGap = useMemo(() => {
    const currentSkills = (user?.skills || []).map((skill) => skill.toLowerCase());
    const required = roleSkills[targetRole] || [];
    return {
      matched: required.filter((skill) => currentSkills.includes(skill.toLowerCase())),
      missing: required.filter((skill) => !currentSkills.includes(skill.toLowerCase())),
    };
  }, [targetRole, user?.skills]);

  const renderTool = () => {
    if (activeTool === "upload") {
      return <ResumeScoreCard scoreData={scoreData} onResumeUploaded={onResumeUploaded} />;
    }

    if (activeTool === "ats") {
      return resumeAnalysis?.analysis_type === "score"
        ? <ResumeAnalysisPanel analysis={resumeAnalysis} />
        : <ResumeScoreCard scoreData={scoreData} onResumeUploaded={onResumeUploaded} />;
    }

    if (activeTool === "generator") {
      return <div className="flex h-full min-h-0 flex-col gap-2">
        <div className={`border-2 border-black px-3 py-2 text-xs font-bold ${bankStatus === "error" ? "bg-red-100" : bankStatus === "saved" ? "bg-green-100" : "bg-white"}`}>
          {bankStatus === "saving" ? "Saving completed resume securely to Resume Bank…" : bankStatus === "saved" ? "Resume saved to Resume Bank." : bankError || "Completed resumes are saved automatically."}
          {bankStatus === "error" && resumeWorkspace.status === "complete" && <button type="button" onClick={saveCompletedResume} className="btn-secondary ml-3 px-2 py-1 text-[10px]">RETRY SAVE</button>}
        </div>
        <div className="min-h-0 flex-1"><ResumeGeneratorWorkspace workspace={resumeWorkspace} onStart={onRunGenerator} /></div>
      </div>;
    }

    if (activeTool === "bank") {
      return (
        <div className="card-stark space-y-4 bg-white">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-2"><Files className="h-5 w-5" /><h2 className="text-sm font-black uppercase">Resume Bank</h2></div>
            <span className="badge-stark bg-gray-100 text-[10px]">YOUR VERSIONS</span>
          </div>
          {bankError && <div className="border-2 border-red-700 bg-red-100 p-2 text-xs font-bold text-red-800">{bankError}</div>}
          {bankResumes.length > 0 ? <div className="space-y-2">{bankResumes.map((resume) => (
            <div key={resume._id} className="flex items-center justify-between gap-3 border-2 border-black bg-gray-50 p-3">
              <div className="flex min-w-0 items-center gap-3"><div className="bg-black p-2 text-white"><FileText className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-xs font-black uppercase">{resume.title}</div><div className="text-[10px] font-semibold text-gray-500">Version {resume.version} · {new Date(resume.createdAt).toLocaleDateString()}</div></div></div>
              <button type="button" onClick={() => viewResume(resume._id)} className="btn-primary shrink-0 px-2 py-1 text-[10px]">VIEW PDF</button>
            </div>
          ))}</div> : bankStatus === "loading" ? <div className="p-8 text-center text-xs font-black">LOADING RESUME BANK...</div> : (
            <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-8 text-center">
              <Files className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <div className="text-xs font-black uppercase">Your resume bank is empty</div>
              <p className="mt-1 text-[11px] text-gray-500">Generate or upload your first resume to create a version.</p>
              <button type="button" onClick={() => onToolChange("upload")} className="btn-primary mt-3 px-3 py-1.5 text-xs">UPLOAD RESUME</button>
            </div>
          )}
          {scoreData && <button type="button" onClick={() => onToolChange("ats")} className="btn-secondary px-3 py-1.5 text-xs">OPEN UPLOADED RESUME ATS SCORE: {scoreData.score || 0}/100</button>}
        </div>
      );
    }

    if (resumeAnalysis?.analysis_type === "gap") {
      return <ResumeAnalysisPanel analysis={resumeAnalysis} />;
    }

    return (
      <div className="card-stark space-y-4 bg-white">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2"><ScanSearch className="h-5 w-5" /><h2 className="text-sm font-black uppercase">Skill Gap Analysis</h2></div>
          <span className="badge-stark bg-yellow-100 text-[10px]">{targetRole}</span>
        </div>
        <select value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className="input-stark w-full text-xs">
          {Object.keys(roleSkills).map((role) => <option key={role}>{role}</option>)}
        </select>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-2 border-black bg-green-50 p-3">
            <h3 className="mb-2 text-xs font-black uppercase">Skills You Already Have</h3>
            <div className="flex flex-wrap gap-1.5">
              {skillGap.matched.length ? skillGap.matched.map((skill) => <span key={skill} className="badge-stark bg-green-200 text-[10px]">{skill}</span>) : <span className="text-[11px] text-gray-500">No matching skills recorded yet.</span>}
            </div>
          </div>
          <div className="border-2 border-black bg-yellow-50 p-3">
            <h3 className="mb-2 text-xs font-black uppercase">Skills to Develop</h3>
            <div className="flex flex-wrap gap-1.5">
              {skillGap.missing.map((skill) => <span key={skill} className="badge-stark bg-yellow-200 text-[10px]">{skill}</span>)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={activeTool === "generator" ? "flex h-full min-h-0 flex-col gap-4 overflow-hidden" : "space-y-5"}>
      <div className="card-stark shrink-0 flex flex-col justify-between gap-3 bg-black text-white sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl text-black uppercase font-bold">Resume Studio</h1>
          <p className="text-sm font-medium text-black">Create, organize, score and improve every version of your resume.</p>
        </div>
        <span className="border border-white px-2 py-1 text-sm text-black font-medium">5 RESUME TOOLS</span>
      </div>

      {activeTool ? (
        <div className={activeTool === "generator" ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : "space-y-4"}>
          <button type="button" onClick={() => onToolChange(null)} className="btn-secondary px-3 py-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" /> BACK TO RESUME STUDIO
          </button>
          <div className={activeTool === "generator" ? "min-h-0 flex-1 overflow-hidden" : ""}>
            {renderTool()}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  onToolChange(tool.id);
                  if (tool.id === "generator") onRunGenerator?.();
                }}
                className="card-stark group flex min-h-48 cursor-pointer flex-col items-start bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-gray-50"
              >
                <div className="mb-4 flex w-full items-start justify-between">
                  <div className="bg-black p-2.5 text-white"><Icon className="h-5 w-5" /></div>
                  <span className="badge-stark bg-yellow-100 text-[9px]">{tool.badge}</span>
                </div>
                <h2 className="text-sm font-black uppercase group-hover:underline">{tool.title}</h2>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-600">{tool.description}</p>
                <div className="mt-auto flex w-full items-center justify-between border-t border-black pt-3 text-[10px] font-black">
                  OPEN TOOL <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
