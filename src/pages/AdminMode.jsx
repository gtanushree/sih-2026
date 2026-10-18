import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, BarChart3, Briefcase, CalendarDays, CheckCircle2, ClipboardCheck, FilePlus2, GraduationCap, Handshake, LoaderCircle, Newspaper, Send, Settings, Sparkles, TrendingUp, UserRoundCheck } from "lucide-react";
import { api } from "../lib/api";
import { runAIFeature, sendAIMessage } from "../services/aiRequestHandler";
import { selectAILoading, selectJobCreationWorkspace } from "../store/aiChatSlice";
import { setActiveFeature } from "../store/appContextSlice";
import PlacementCalendar from "../components/PlacementCalendar";
import TrainingScheduler from "../components/TrainingScheduler";
import OfferManagement from "../components/OfferManagement";
import PolicyConfigPanel from "../components/PolicyConfigPanel";
import GapAnalysisPanel from "../components/GapAnalysisPanel";

const TPO_TOOLS = [
  {
    id: "job-creator",
    title: "Job Creator",
    description: "Create, validate and publish placement jobs through the AI assistant.",
    badge: "AVAILABLE",
    badgeClass: "bg-green-200",
    icon: FilePlus2,
    action: "job-creation",
  },
  {
    id: "gap-analysis",
    title: "Gap Analysis",
    description: "Analyse curriculum-to-industry skill gaps and get AI-powered elective recommendations.",
    badge: "AVAILABLE",
    badgeClass: "bg-green-200",
    icon: TrendingUp,
    action: "gap-analysis",
  },
  {
    id: "job-postings",
    title: "Job Postings",
    description: "View every placement job published for students at your college.",
    badge: "LIVE",
    badgeClass: "bg-blue-100",
    icon: Newspaper,
    action: "job-postings",
  },
  {
    id: "placement-calendar",
    title: "Placement Calendar",
    description: "View placement drives and application deadlines in one calendar.",
    badge: "LIVE",
    badgeClass: "bg-blue-100",
    icon: CalendarDays,
    action: "placement-calendar",
  },
  {
    id: "training-scheduler",
    title: "Training Scheduler",
    description: "Create and manage student training programs and schedules.",
    badge: "LIVE",
    badgeClass: "bg-green-100",
    icon: GraduationCap,
    action: "training-scheduler",
  },
  {
    id: "offer-management",
    title: "Offer Management",
    description: "Track offer lifecycles, placements and TPO overrides.",
    badge: "LIVE",
    badgeClass: "bg-yellow-100",
    icon: Handshake,
    action: "offer-management",
  },
  {
    id: "policy-configuration",
    title: "Placement Policy",
    description: "Configure institutional offer and placement rules.",
    badge: "LIVE",
    badgeClass: "bg-gray-100",
    icon: Settings,
    action: "policy-configuration",
  },
  {
    id: "eligibility-rules",
    title: "Eligibility Rules",
    description: "Define branch, CGPA, backlog and graduation-year eligibility policies.",
    badge: "COMING SOON",
    icon: ClipboardCheck,
    badgeClass: "bg-gray-100",
    action: "eligibility-rules",
  },
  {
    id: "application-review",
    title: "Application Review",
    description: "Review applicants, eligibility decisions and placement progress.",
    badge: "COMING SOON",
    icon: UserRoundCheck,
    badgeClass: "bg-gray-100",
    action: "application-review",
  },
  {
    id: "placement-analytics",
    title: "Placement Analytics",
    description: "Track job performance, applications, selections and placement outcomes.",
    badge: "COMING SOON",
    icon: BarChart3,
    badgeClass: "bg-gray-100",
    action: "placement-analytics",
  },
];

const JOB_FIELD_LABELS = {
  company_name: "Company",
  job_role: "Role",
  job_description: "Description",
  app_deadline: "Application deadline",
  salary: "Salary",
  eligible_branches: "Eligible branches",
  location: "Location",
  employment_type: "Employment type",
  minimum_cgpa: "Minimum CGPA",
  maximum_backlogs: "Maximum backlogs",
  graduation_years: "Graduation years",
  skills: "Skills",
  selection_process: "Selection process",
};

const formatJobValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not specified";
  if (value === null || value === undefined || value === "") return "Not specified";
  return String(value);
};

function JobCreatorPanel() {
  const dispatch = useDispatch();
  const workspace = useSelector(selectJobCreationWorkspace);
  const aiLoading = useSelector(selectAILoading);
  const job = workspace.job || {};
  const hasDraft = Boolean(workspace.job);

  const sendJobAction = (text) => dispatch(sendAIMessage({
    text,
    modeName: "job-creation",
    source: "job-creator-ui",
    feature: "job-creation",
  }));

  return (
    <div className="card-stark bg-white">
      <div className="mb-4 flex flex-col justify-between gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="bg-black p-2 text-white"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-black uppercase">AI Job Creator</h3>
            <p className="text-[11px] font-semibold text-gray-600">Build, validate and post a placement job through chat.</p>
          </div>
        </div>
        <span className={`badge-stark text-[10px] ${workspace.status === "post" ? "bg-green-200" : workspace.status === "error" ? "bg-red-100" : "bg-yellow-100"}`}>
          {workspace.status.replaceAll("_", " ").toUpperCase()}
        </span>
      </div>

      {!hasDraft ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 bg-gray-50 p-7 text-center">
          <Briefcase className="mb-2 h-8 w-8" />
          <h4 className="text-xs font-black uppercase">Create a placement job</h4>
          <p className="mt-1 max-w-md text-[11px] text-gray-600">The assistant will collect the company, role, description, deadline and eligibility details.</p>
          <button type="button" disabled={aiLoading} onClick={() => dispatch(runAIFeature("job-creation"))} className="btn-primary mt-4 px-3 py-1.5 text-xs disabled:opacity-50">
            {aiLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} START JOB CREATOR
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(JOB_FIELD_LABELS).map(([field, label]) => (
              <div key={field} className={`${field === "job_description" ? "sm:col-span-2" : ""} border-2 border-black bg-gray-50 p-2.5`}>
                <div className="text-[9px] font-black uppercase text-gray-500">{label}</div>
                <div className="mt-0.5 break-words text-[11px] font-bold">{formatJobValue(job[field])}</div>
              </div>
            ))}
          </div>

          {workspace.missingFields.length > 0 && (
            <div className="mt-3 border-2 border-black bg-yellow-100 p-3">
              <div className="text-[10px] font-black uppercase">Still required</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {workspace.missingFields.map((field) => <span key={field} className="badge-stark bg-white text-[9px]">{JOB_FIELD_LABELS[field] || field}</span>)}
              </div>
              <p className="mt-2 text-[10px] font-semibold">Provide these details in the chat on the left.</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-3">
            <div className="text-[10px] font-bold text-gray-600">
              {workspace.status === "post" ? `Saved job ID: ${workspace.persistedJobId || "created"}` : "Every change made in chat updates this draft."}
            </div>
            {workspace.status === "ready" && !workspace.awaitingConfirmation && (
              <button type="button" disabled={aiLoading} onClick={() => sendJobAction("Post the job")} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
                <Send className="h-4 w-4" /> REVIEW FOR POSTING
              </button>
            )}
            {workspace.awaitingConfirmation && (
              <button type="button" disabled={aiLoading} onClick={() => sendJobAction("Yes, confirm and post the job")} className="btn-primary bg-green-200 px-3 py-1.5 text-xs text-black disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> CONFIRM & POST
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function JobPostingsPanel({ drives, loading }) {
  return (
    <div className="card-stark bg-white">
      <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-2">
        <h3 className="text-sm font-black uppercase">JOB POSTINGS</h3>
        <span className="badge-stark">{drives.length} TOTAL</span>
      </div>

      {loading ? (
        <div className="p-4 text-xs font-bold">Loading job postings...</div>
      ) : drives.length === 0 ? (
        <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-7 text-center">
          <Briefcase className="mx-auto mb-2 h-7 w-7 text-gray-400" />
          <p className="text-xs font-black uppercase">No jobs posted yet</p>
          <p className="mt-1 text-[10px] text-gray-500">Create the first posting with Job Creator.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-left">
            <thead>
              <tr className="bg-black text-xs uppercase text-white">
                <th className="border-2 border-black p-2">Company</th>
                <th className="border-2 border-black p-2">Role Title</th>
                <th className="border-2 border-black p-2">Min CGPA</th>
                <th className="border-2 border-black p-2">Branches</th>
                <th className="border-2 border-black p-2">Package</th>
                <th className="border-2 border-black p-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium">
              {drives.map((drive) => (
                <tr key={drive._id || drive.companyName} className="hover:bg-gray-50">
                  <td className="border-2 border-black p-2 font-extrabold">{drive.companyName}</td>
                  <td className="border-2 border-black p-2 font-bold">{drive.roleTitle}</td>
                  <td className="border-2 border-black p-2 font-mono">{drive.minCgpa}</td>
                  <td className="border-2 border-black p-2">{drive.eligibleBranch.length ? drive.eligibleBranch.join(", ") : "All branches"}</td>
                  <td className="border-2 border-black p-2 font-bold">{drive.packageLpa}</td>
                  <td className="border-2 border-black p-2"><span className="badge-stark bg-green-200 text-[10px]">{drive.status.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const normalizeDrive = (job) => ({
  ...job,
  companyName: job.company?.name || job.companyName || "Unknown Company",
  roleTitle: job.title || job.roleTitle || "Available Role",
  minCgpa: job.minimumCgpa ?? job.minCgpa ?? "Not specified",
  eligibleBranch: job.eligibleBranches || job.eligibleBranch || [],
  packageLpa: job.salary || job.packageLpa || "Not disclosed",
  status: job.status || "active",
  deadline: job.applicationDeadline || job.deadline,
});

export default function AdminMode() {
  const dispatch = useDispatch();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const persistedJobId = useSelector((state) => state.aiChat.jobCreationWorkspace.persistedJobId);
  const activeFeature = useSelector((state) => state.appContext.activeFeature);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const result = await api.getJobs();
        const jobs = result.data || result.jobs || [];
        setDrives(jobs.map(normalizeDrive));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDrives();
  }, [persistedJobId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="card-stark bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-black" />
            <div>
              <h2 className="font-black text-lg uppercase">COLLEGE TPO MODE</h2>
              <p className="text-xs font-semibold text-gray-600">
                Create jobs and manage institutional placement operations.
              </p>
            </div>
          </div>
          <span className="badge-stark bg-black text-white text-xs">TPO OPERATIONS</span>
        </div>
      </div>

      {activeFeature !== null ? (
        <div className="space-y-4">
          <button type="button" onClick={() => dispatch(setActiveFeature(null))} className="btn-secondary px-3 py-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" /> BACK TO TPO TOOLS
          </button>
          {activeFeature === "job-creator" && <JobCreatorPanel />}
          {activeFeature === "gap-analysis" && <GapAnalysisPanel />}
          {activeFeature === "job-postings" && <JobPostingsPanel drives={drives} loading={loading} />}
          {activeFeature === "placement-calendar" && <PlacementCalendar drives={drives} title="TPO PLACEMENT DRIVE CALENDAR" />}
          {activeFeature === "training-scheduler" && <TrainingScheduler />}
          {activeFeature === "offer-management" && <OfferManagement />}
          {activeFeature === "policy-configuration" && <PolicyConfigPanel />}
          {!["job-creator", "gap-analysis", "job-postings", "placement-calendar", "training-scheduler", "offer-management", "policy-configuration"].includes(activeFeature) && (
            <div className="card-stark flex min-h-64 flex-col items-center justify-center bg-white p-8 text-center">
              <Sparkles className="mb-3 h-8 w-8" />
              <h3 className="text-sm font-black uppercase">{TPO_TOOLS.find((tool) => tool.id === activeFeature)?.title || "TPO TOOL"}</h3>
              <p className="mt-1 text-xs font-semibold text-gray-600">This tool is coming soon.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {TPO_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => tool.action === "job-creation" ? dispatch(runAIFeature("job-creation")) : tool.action === "gap-analysis" ? dispatch(runAIFeature("gap-analysis")) : dispatch(setActiveFeature(tool.action))}
                  className="card-stark group flex min-h-48 cursor-pointer flex-col items-center justify-between bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-gray-50"
                >
                  <div className="mb-2 bg-black p-3.5 text-white">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="my-auto space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-tight group-hover:underline">{tool.title}</h3>
                    <p className="line-clamp-2 text-[11px] font-medium text-gray-600">{tool.description}</p>
                  </div>
                  <div className="mt-auto flex w-full items-center justify-between border-t-1.5 border-black pt-2">
                    <span className={`badge-stark text-[10px] ${tool.badgeClass}`}>{tool.badge}</span>
                    <div className="btn-primary px-2 py-1 text-[10px]">
                      <span>OPEN</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
