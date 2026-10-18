import { useEffect, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Globe,
  History,
  MapPin,
  Mic2,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { sendAIMessage } from "../services/aiRequestHandler";
import {
  journeyJobSelected,
  selectAILoading,
  selectInterviewHistory,
  selectInterviewWorkspace,
} from "../store/aiChatSlice";
import { INTERVIEW_ANSWER_WINDOW_EVENT } from "./VoiceInterviewInput";
import { socket } from "../lib/socket";
import { api } from "../lib/api";
import RecommendedResources from "./RecommendedResources";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (score) =>
  score >= 75
    ? "bg-green-300 text-green-900"
    : score >= 50
    ? "bg-yellow-300 text-yellow-900"
    : "bg-red-300 text-red-900";

const scoreBorder = (score) =>
  score >= 75 ? "border-green-400" : score >= 50 ? "border-yellow-400" : "border-red-400";

function ScoreBar({ label, score = 0 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = safeScore >= 75 ? "bg-green-400" : safeScore >= 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase">
        <span>{label}</span>
        <span className="font-mono">{safeScore.toFixed(0)}/100</span>
      </div>
      <div className="h-2.5 border border-black bg-gray-100">
        <div
          className={`h-full transition-all duration-700 ${color}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

// ─── Full Report Card ─────────────────────────────────────────────────────────

function ReportCard({ report, compact = false }) {
  const technical = report?.scores?.technical || {};
  const communication = report?.scores?.communication || {};
  const overall = Number(report?.overall_score || 0);
  const positives = [
    ...(report?.positives?.technical?.technical_skills || []),
    ...(report?.positives?.technical?.problem_solving || []),
    ...(report?.positives?.communication?.clarity || []),
    ...(report?.positives?.communication?.answer_structure || []),
  ];

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div
          className={`flex flex-col items-center justify-center border-2 border-black p-5 text-center ${scoreColor(
            overall
          )}`}
        >
          <div className={`text-4xl font-black tabular-nums ${compact ? "text-3xl" : ""}`}>
            {overall.toFixed(0)}
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-widest">Overall Score</div>
          <div
            className={`mt-2 inline-block border px-2 py-0.5 text-[9px] font-black uppercase ${scoreBorder(
              overall
            )} ${scoreColor(overall)}`}
          >
            {overall >= 75 ? "EXCELLENT" : overall >= 50 ? "GOOD" : "NEEDS WORK"}
          </div>
        </div>

        <div className="border-2 border-black bg-white p-4 sm:col-span-2">
          <div className="text-[10px] font-black uppercase text-gray-500">Interview Summary</div>
          <p className="mt-1.5 text-xs font-semibold leading-relaxed text-gray-800">
            {report?.summary || "Your interview report is ready."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {report?.meta?.role && (
              <span className="badge-stark bg-blue-100 text-[9px]">{report.meta.role}</span>
            )}
            <span className="badge-stark bg-gray-100 text-[9px]">
              {report?.meta?.questions_asked || 0} questions
            </span>
            <span className="badge-stark bg-gray-100 text-[9px]">
              {report?.meta?.duration_minutes || 0} min
            </span>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="grid gap-4 border-2 border-black bg-gray-50 p-4 sm:grid-cols-2">
        <div className="space-y-3">
          <ScoreBar label="Technical" score={technical.score} />
          <ScoreBar label="Technical Skills" score={technical.technical_skills} />
          <ScoreBar label="Problem Solving" score={technical.problem_solving} />
        </div>
        <div className="space-y-3">
          <ScoreBar label="Communication" score={communication.score} />
          <ScoreBar label="Clarity" score={communication.clarity} />
          <ScoreBar label="Answer Structure" score={communication.answer_structure} />
        </div>
      </div>

      {/* Topic performance */}
      {report?.topics?.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase">
            <TrendingUp className="h-4 w-4" /> Topic Performance
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.topics.map((topic, i) => (
              <div key={`${topic.topic}-${i}`} className="border-1.5 border-black bg-white p-2">
                <ScoreBar label={topic.topic || "General"} score={topic.score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-black bg-green-50 p-3">
          <div className="mb-2 flex items-center gap-1 text-xs font-black uppercase">
            <CheckCircle2 className="h-4 w-4 text-green-700" /> Strengths
          </div>
          {positives.length ? (
            <ul className="list-disc space-y-1 pl-4 text-[11px] font-semibold text-green-900">
              {positives.slice(0, 6).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-gray-500">Complete more answers to build detailed feedback.</p>
          )}
        </div>
        <div className="border-2 border-black bg-amber-50 p-3">
          <div className="mb-2 text-xs font-black uppercase text-amber-900">Skills to Improve</div>
          {report?.skill_gaps?.length ? (
            <ul className="list-disc space-y-1 pl-4 text-[11px] font-semibold text-amber-900">
              {report.skill_gaps.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-gray-500">No specific skill gaps were reported.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Past Result Mini-Card ────────────────────────────────────────────────────

function HistoryCard({ entry, onExpand, expanded }) {
  const overall = Number(entry?.report?.overall_score || 0);
  const date = entry?.completedAt
    ? new Date(entry.completedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div className="border-1.5 border-black bg-white">
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black text-sm font-black ${scoreColor(
              overall
            )}`}
          >
            {overall.toFixed(0)}
          </div>
          <div>
            <div className="text-xs font-black uppercase">{entry?.report?.meta?.role || "General Interview"}</div>
            <div className="text-[10px] font-semibold text-gray-500">{date}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="badge-stark bg-gray-100 text-[9px]">
            {entry?.report?.meta?.questions_asked || 0} Qs
          </span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t-1.5 border-black p-4">
          <ReportCard report={entry.report} compact />
        </div>
      )}
    </div>
  );
}

// ─── Main Workspace ───────────────────────────────────────────────────────────

export default function InterviewWorkspace() {
  const dispatch = useDispatch();
  const workspace = useSelector(selectInterviewWorkspace);
  const history = useSelector(selectInterviewHistory);
  const loading = useSelector(selectAILoading);
  const [jobLink, setJobLink] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("waiting");
  const [activeTab, setActiveTab] = useState("results"); // "results" | "resources"
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Database jobs picker state
  const [dbJobs, setDbJobs] = useState([]);
  const [loadingDbJobs, setLoadingDbJobs] = useState(false);
  const [dbJobsError, setDbJobsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobSelectionMode, setJobSelectionMode] = useState("db"); // "db" | "url"

  // Fetch jobs from DB whenever the workspace moves into "awaiting-job" state
  useEffect(() => {
    if (workspace.status === "awaiting-job") {
      let isMounted = true;
      const fetchJobsFromBackend = async () => {
        setLoadingDbJobs(true);
        setDbJobsError(null);
        try {
          const res = await api.getJobs();
          const raw = res?.data || res?.jobs || res || [];
          const list = Array.isArray(raw) ? raw : [];
          if (isMounted) {
            setDbJobs(list);
          }
        } catch (err) {
          console.error("Failed to query DB jobs for mock interview:", err);
          if (isMounted) {
            setDbJobsError("Unable to load campus jobs from database.");
          }
        } finally {
          if (isMounted) setLoadingDbJobs(false);
        }
      };

      fetchJobsFromBackend();
      return () => {
        isMounted = false;
      };
    }
  }, [workspace.status]);

  // Handle server-streamed audio responses
  useEffect(() => {
    let activeAudio = null;
    let objectUrl = null;

    const beginAnswerWindow = (questionNumber) => {
      setVoiceStatus("finished");
      window.dispatchEvent(
        new CustomEvent(INTERVIEW_ANSWER_WINDOW_EVENT, {
          detail: { questionNumber },
        })
      );
    };

    const playQuestion = async (payload) => {
      const isQuestion =
        payload?.header_message === "text:mode:interview" && payload.data?.type === "interview_question";
      const isReport = payload?.header_message === "interview:end";
      if (!isQuestion && !isReport) return;
      const questionNumber = payload.data?.question_number || workspace.questionNumber;
      const bytes = payload.audio instanceof ArrayBuffer ? payload.audio : payload.audio?.buffer;
      if (!bytes) return;
      if (activeAudio) activeAudio.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(new Blob([bytes], { type: payload.mimeType || "audio/wav" }));
      activeAudio = new Audio(objectUrl);
      activeAudio.onended = () => {
        if (isQuestion) beginAnswerWindow(questionNumber);
        else setVoiceStatus("finished");
      };
      activeAudio.onerror = () => setVoiceStatus("error");
      setVoiceStatus("playing");
      try {
        await activeAudio.play();
      } catch {
        setVoiceStatus("blocked");
      }
    };

    const handleSpeechError = (payload) => {
      if (payload?.code === "TTS_FAILED" && payload.requestId === workspace.requestId)
        setVoiceStatus("error");
    };

    socket.on("interview:audio:response", playQuestion);
    socket.on("interview:audio:error", handleSpeechError);
    return () => {
      socket.off("interview:audio:response", playQuestion);
      socket.off("interview:audio:error", handleSpeechError);
      if (activeAudio) activeAudio.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [workspace.questionNumber, workspace.requestId]);

  const send = (text, source = "mock-interview-workspace", details = {}) => {
    if (!text.trim() || loading) return;
    dispatch(sendAIMessage({ text, details, modeName: "ai-interviewer", source, feature: "mock-interview" }));
  };

  const handleSelectDbJob = (job) => {
    if (loading) return;
    const title = job.title || job.job_title || "Available Role";
    const companyName =
      job.company?.name || job.companyName || (typeof job.company === "string" ? job.company : "Company");

    dispatch(journeyJobSelected(job));
    send(
      `I want to interview for ${title} at ${companyName}`,
      "mock-interview-db-job-select",
      { selected_job: job }
    );
  };

  const handleRequestResources = () => {
    const gaps = workspace.report?.skill_gaps || [];
    const topics = (workspace.report?.topics || []).map((t) => t.topic || t).join(", ");
    const msg = `Based on my interview, suggest resources to improve: ${gaps.join(", ")}${
      topics ? `, ${topics}` : ""
    }.`;
    send(msg, "mock-interview-resources");
  };

  // Filter DB jobs by search query
  const filteredDbJobs = dbJobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (job.title || job.job_title || "").toLowerCase();
    const company = (
      job.company?.name || job.companyName || (typeof job.company === "string" ? job.company : "")
    ).toLowerCase();
    const location = (job.location || "").toLowerCase();
    const skills = Array.isArray(job.skills) ? job.skills.join(" ").toLowerCase() : "";
    return title.includes(query) || company.includes(query) || location.includes(query) || skills.includes(query);
  });

  const liveReport = workspace.status === "complete" ? workspace.report : null;

  return (
    <div className="card-stark space-y-5 bg-white">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 border-b-2 border-black pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="border-2 border-black bg-black p-2.5 text-white">
            <Mic2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase">AI Mock Interview</h3>
            <p className="text-[11px] font-semibold text-gray-600">
              Choose a setup here, then answer each question in the left chat.
            </p>
          </div>
        </div>
        <span
          className={`badge-stark text-[10px] ${
            workspace.status === "complete"
              ? "bg-green-200"
              : workspace.status === "in-progress"
              ? "bg-yellow-200"
              : "bg-blue-100"
          }`}
        >
          {workspace.status.replaceAll("-", " ")}
        </span>
      </div>

      {/* ── Idle / Starting ── */}
      {(workspace.status === "idle" || workspace.status === "starting") && (
        <div className="border-2 border-dashed border-black bg-gray-50 p-8 text-center">
          <Sparkles className={`mx-auto mb-3 h-8 w-8 ${loading ? "animate-spin" : ""}`} />
          <div className="text-sm font-black uppercase">Preparing your interview</div>
          <p className="mt-1 text-xs text-gray-600">
            The interviewer will ask whether you want job-specific or profile-based practice.
          </p>
          {workspace.status === "idle" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => send("Start a mock interview", "mock-interview-start")}
              className="btn-primary mt-4 px-4 py-2 text-xs"
            >
              <Mic2 className="h-4 w-4" /> START INTERVIEW
            </button>
          )}
        </div>
      )}

      {/* ── Choosing Option ── */}
      {workspace.status === "choosing" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(workspace.options || []).map((option) => {
            const isJob = option.value === "job";
            const Icon = isJob ? BriefcaseBusiness : UserRound;
            return (
              <button
                key={option.value}
                type="button"
                disabled={loading}
                onClick={() => send(option.value)}
                className="group border-2 border-black bg-white p-5 text-left shadow-bold-sm transition-transform hover:-translate-y-0.5 hover:bg-gray-50 disabled:opacity-50"
              >
                <Icon className="mb-4 h-7 w-7" />
                <div className="text-sm font-black uppercase">
                  {isJob ? "Job-specific interview" : "Profile-based interview"}
                </div>
                <p className="mt-1 text-[11px] font-semibold text-gray-600">
                  {isJob
                    ? "Select a placement drive from the database or paste a job link."
                    : "Use your skills, projects, and experience from your student profile."}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Awaiting Job Selection (DB Jobs Picker + URL fallback) ── */}
      {workspace.status === "awaiting-job" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 border-2 border-black bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase flex items-center gap-1.5">
                <BriefcaseBusiness className="h-4 w-4 text-black" />
                Select Job Profile for Interview
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-gray-600">
                Choose an active campus placement drive from the database, or paste a custom job link.
              </p>
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 border border-black shrink-0">
              <button
                type="button"
                onClick={() => setJobSelectionMode("db")}
                className={`px-3 py-1 text-[10px] font-black uppercase transition-colors ${
                  jobSelectionMode === "db" ? "bg-black text-white" : "text-black hover:bg-gray-100"
                }`}
              >
                Campus Drives (DB)
              </button>
              <button
                type="button"
                onClick={() => setJobSelectionMode("url")}
                className={`px-3 py-1 text-[10px] font-black uppercase transition-colors ${
                  jobSelectionMode === "url" ? "bg-black text-white" : "text-black hover:bg-gray-100"
                }`}
              >
                Custom URL Link
              </button>
            </div>
          </div>

          {/* Tab 1: Database Jobs List */}
          {jobSelectionMode === "db" && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drives by role, company, skills, or location..."
                    className="input-stark w-full pl-8 pr-8 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="badge-stark bg-black text-[10px] font-mono font-bold text-white shrink-0">
                  {loadingDbJobs ? "FETCHING..." : `${filteredDbJobs.length} JOBS`}
                </div>
              </div>

              {/* Loading indicator */}
              {loadingDbJobs && (
                <div className="flex items-center justify-center gap-2 border-2 border-dashed border-black bg-gray-50 p-8 text-xs font-bold">
                  <Sparkles className="h-4 w-4 animate-spin text-black" />
                  <span>FETCHING AVAILABLE JOBS FROM DATABASE...</span>
                </div>
              )}

              {/* Error message */}
              {!loadingDbJobs && dbJobsError && (
                <div className="border-2 border-black bg-red-100 p-4 text-xs font-bold text-red-800 flex items-center justify-between">
                  <span>{dbJobsError}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadingDbJobs(true);
                      setDbJobsError(null);
                      api
                        .getJobs()
                        .then((res) => setDbJobs(res?.data || res?.jobs || res || []))
                        .catch(() => setDbJobsError("Unable to load campus jobs."))
                        .finally(() => setLoadingDbJobs(false));
                    }}
                    className="btn-secondary px-2.5 py-1 text-[10px]"
                  >
                    RETRY
                  </button>
                </div>
              )}

              {/* Jobs Cards Grid */}
              {!loadingDbJobs && !dbJobsError && filteredDbJobs.length > 0 && (
                <div className="grid max-h-[460px] gap-3 overflow-y-auto pr-1 sm:grid-cols-1 md:grid-cols-2">
                  {filteredDbJobs.map((job) => {
                    const title = job.title || job.job_title || "Available Role";
                    const companyName =
                      job.company?.name ||
                      job.companyName ||
                      (typeof job.company === "string" ? job.company : "Company");
                    const salary = job.salary || "Not disclosed";
                    const location = job.location || "On-site / Remote";
                    const employmentType = job.employmentType || job.employment_type || "Full-Time";
                    const skills = Array.isArray(job.skills) ? job.skills : [];
                    const id = job._id || job.job_id || job.id;

                    return (
                      <div
                        key={id}
                        className="group flex flex-col justify-between border-2 border-black bg-white p-3.5 shadow-bold-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="badge-stark bg-black text-[9px] text-white">
                                {employmentType.toUpperCase()}
                              </span>
                              <h4 className="mt-1 text-xs font-black uppercase tracking-tight line-clamp-1">
                                {title}
                              </h4>
                              <p className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span>{companyName}</span>
                              </p>
                            </div>
                            <span className="badge-stark bg-green-100 text-[9px] font-mono font-bold shrink-0">
                              {salary}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-600 font-medium">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" /> {location}
                            </span>
                            {job.minimumCgpa !== undefined && job.minimumCgpa !== null && (
                              <span className="badge-stark bg-gray-100 text-[9px]">
                                Min CGPA: {job.minimumCgpa}
                              </span>
                            )}
                          </div>

                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-200">
                              {skills.slice(0, 5).map((skill, sIdx) => (
                                <span key={sIdx} className="badge-stark bg-blue-50 text-[9px]">
                                  {skill}
                                </span>
                              ))}
                              {skills.length > 5 && (
                                <span className="text-[9px] font-bold text-gray-500">
                                  +{skills.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t-1.5 border-black">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleSelectDbJob(job)}
                            className="btn-primary w-full justify-center py-1.5 text-[11px]"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>PRACTICE FOR THIS ROLE</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty Search Result */}
              {!loadingDbJobs && !dbJobsError && filteredDbJobs.length === 0 && (
                <div className="border-2 border-dashed border-black bg-gray-50 p-6 text-center">
                  <BriefcaseBusiness className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                  <div className="text-xs font-black uppercase">No matching jobs in database</div>
                  <p className="mt-1 text-[11px] text-gray-600">
                    Try searching for another keyword, or switch to paste a custom job link URL.
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="btn-secondary mt-2 px-3 py-1 text-[10px]"
                    >
                      CLEAR SEARCH
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Custom URL Paste Form */}
          {jobSelectionMode === "url" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(jobLink, "mock-interview-job-link");
              }}
              className="border-2 border-black bg-white p-4 shadow-bold-sm"
            >
              <label htmlFor="interview-job-link" className="text-xs font-black uppercase flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> Custom Job Posting Link
              </label>
              <p className="mt-1 text-[11px] font-semibold text-gray-600">
                Paste the full URL from LinkedIn, Indeed, or the company careers page. The interviewer will extract
                role requirements before starting.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  id="interview-job-link"
                  type="url"
                  required
                  value={jobLink}
                  onChange={(event) => setJobLink(event.target.value)}
                  placeholder="https://company.com/careers/software-engineer"
                  className="input-stark flex-1 text-xs"
                />
                <button type="submit" disabled={loading || !jobLink.trim()} className="btn-primary px-4 py-2 text-xs">
                  <Send className="h-3.5 w-3.5" /> USE LINK
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Awaiting Name ── */}
      {workspace.status === "awaiting-name" && (
        <div className="border-2 border-black bg-yellow-50 p-5 text-center">
          <UserRound className="mx-auto mb-2 h-7 w-7" />
          <div className="text-sm font-black uppercase">Introduce yourself in chat</div>
          <p className="mt-1 text-xs font-semibold text-gray-600">
            Tell the interviewer your name in the left chat to begin the first question.
          </p>
        </div>
      )}

      {/* ── In Progress ── */}
      {workspace.status === "in-progress" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <span className="badge-stark bg-black text-[10px] text-white">
                QUESTION {workspace.questionNumber || 1}
              </span>
              <span className="badge-stark bg-purple-100 text-[10px]">{workspace.topic || "General"}</span>
            </div>
            {workspace.secondsRemaining > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase">
                <Clock3 className="h-3.5 w-3.5" /> Up to {Math.ceil(workspace.secondsRemaining / 60)} min left
              </span>
            )}
          </div>
          <div className="border-l-8 border-black bg-gray-50 p-5 text-sm font-bold leading-relaxed">
            {workspace.currentQuestion}
          </div>
          <span className="badge-stark flex w-fit items-center gap-1 bg-purple-100 text-[10px]">
            <Volume2 className="h-3.5 w-3.5" />{" "}
            {voiceStatus === "playing"
              ? "INTERVIEWER IS SPEAKING"
              : voiceStatus === "finished"
              ? "ANSWER WINDOW STARTED"
              : "PREPARING INTERVIEWER AUDIO"}
          </span>
          <div className="border-1.5 border-black bg-blue-50 p-3 text-[11px] font-semibold">
            The microphone starts automatically when the server-generated question audio ends. Your answer is sent
            after four seconds of silence, when you click Finish answer, or when the 60-second maximum expires.
          </div>
          {(voiceStatus === "blocked" || voiceStatus === "error") && (
            <button
              type="button"
              onClick={() => {
                setVoiceStatus("finished");
                window.dispatchEvent(
                  new CustomEvent(INTERVIEW_ANSWER_WINDOW_EVENT, {
                    detail: { questionNumber: workspace.questionNumber },
                  })
                );
              }}
              className="btn-secondary px-3 py-2 text-xs"
            >
              <Mic2 className="h-4 w-4" /> START ANSWER WITHOUT AUDIO
            </button>
          )}
        </div>
      )}

      {/* ── Complete: Tab layout ── */}
      {workspace.status === "complete" && workspace.report && (
        <div className="space-y-4">
          {/* Tab Bar */}
          <div className="flex items-center border-b-2 border-black">
            <button
              type="button"
              onClick={() => setActiveTab("results")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase transition-colors ${
                activeTab === "results"
                  ? "border-b-2 border-black bg-white -mb-[2px] text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Results
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("resources")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase transition-colors ${
                activeTab === "resources"
                  ? "border-b-2 border-black bg-white -mb-[2px] text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Recommended Resources
              {workspace.report?.skill_gaps?.length > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[8px] text-white">
                  {workspace.report.skill_gaps.length}
                </span>
              )}
            </button>
          </div>

          {/* Results Tab */}
          {activeTab === "results" && (
            <div className="space-y-4">
              <ReportCard report={workspace.report} />
              <button
                type="button"
                disabled={loading}
                onClick={() => send("Start another mock interview", "mock-interview-restart")}
                className="btn-primary w-full justify-center py-2 text-xs"
              >
                <RotateCcw className="h-4 w-4" /> START ANOTHER INTERVIEW
              </button>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === "resources" && (
            <RecommendedResources
              report={workspace.report}
              loading={loading}
              onRequestResources={handleRequestResources}
            />
          )}
        </div>
      )}

      {/* ── Error ── */}
      {workspace.status === "error" && (
        <div className="border-2 border-black bg-red-100 p-4 text-xs font-bold">
          <p>{workspace.error || "The interview could not continue. Try starting a new mock interview."}</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => send("Start a mock interview", "mock-interview-retry")}
            className="btn-primary mt-3 px-4 py-2 text-xs"
          >
            <RotateCcw className="h-4 w-4" /> TRY AGAIN
          </button>
        </div>
      )}

      {/* ── Interview History (always visible when there's past data) ── */}
      {history.length > 0 && workspace.status !== "in-progress" && (
        <div className="border-t-2 border-black pt-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            <div className="text-xs font-black uppercase">Past Interview Results</div>
            <span className="badge-stark bg-gray-100 text-[9px]">{history.length} stored</span>
          </div>
          <div className="space-y-2">
            {(liveReport ? history.slice(1) : history).map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                expanded={expandedHistoryId === entry.id}
                onExpand={() =>
                  setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)
                }
              />
            ))}
            {!liveReport && history.length === 0 && (
              <p className="text-[11px] text-gray-500">No past interviews found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
