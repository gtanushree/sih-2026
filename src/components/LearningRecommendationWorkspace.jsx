import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  Layers,
  Mic2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api } from "../lib/api";
import { runAIFeature, sendAIMessage } from "../services/aiRequestHandler";
import {
  resetLearningWorkspace,
  selectInterviewHistory,
  selectLearningWorkspace,
  setLearningSelectedInterview,
} from "../store/aiChatSlice";
import { setActiveFeature, setAgentMode, setUserMode } from "../store/appContextSlice";

const formatDate = (isoString) => {
  if (!isoString) return "Recent";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getScoreBadgeClass = (score) => {
  const num = Number(score) || 0;
  if (num >= 8) return "bg-green-100 text-green-800 border-green-700";
  if (num >= 6) return "bg-yellow-100 text-yellow-800 border-yellow-700";
  return "bg-red-100 text-red-800 border-red-700";
};

const getFormatBadge = (format) => {
  const fmt = String(format || "").toLowerCase();
  if (fmt.includes("cheat")) return { label: "CHEAT-SHEET", bg: "bg-purple-100 text-purple-900 border-purple-700" };
  if (fmt.includes("guide") || fmt.includes("written")) return { label: "STUDY GUIDE", bg: "bg-blue-100 text-blue-900 border-blue-700" };
  if (fmt.includes("doc")) return { label: "DOCUMENTATION", bg: "bg-cyan-100 text-cyan-900 border-cyan-700" };
  if (fmt.includes("case")) return { label: "CASE STUDY", bg: "bg-amber-100 text-amber-900 border-amber-700" };
  return { label: "RESOURCE", bg: "bg-gray-100 text-gray-900 border-gray-700" };
};

export default function LearningRecommendationWorkspace() {
  const dispatch = useDispatch();
  const learningWorkspace = useSelector(selectLearningWorkspace);
  const localInterviewHistory = useSelector(selectInterviewHistory);

  const [dbInterviews, setDbInterviews] = useState([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbError, setDbError] = useState(null);

  const fetchPastInterviews = async () => {
    setLoadingDb(true);
    setDbError(null);
    try {
      const res = await api.getMyInterviews();
      const loaded = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setDbInterviews(loaded);
    } catch (err) {
      console.warn("Unable to load interviews from backend API, using local history if available:", err);
      if (localInterviewHistory?.length > 0) {
        setDbInterviews(
          localInterviewHistory.map((h) => ({
            _id: h.id,
            role: h.report?.meta?.role || "Mock Interview",
            candidateName: h.report?.meta?.candidate_name || "Candidate",
            overallScore: h.report?.overall_score || 0,
            generatedAt: h.completedAt,
            skillGaps: h.report?.skill_gaps || [],
            scores: h.report?.scores || {},
            rawReport: h.report,
          }))
        );
      } else {
        setDbError("Unable to fetch saved mock interviews.");
      }
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchPastInterviews();
  }, []);

  const handleSelectInterview = (interview) => {
    dispatch(setLearningSelectedInterview(interview));
    dispatch(
      sendAIMessage({
        modeName: "learning-recommendation",
        feature: "learning-recommendation",
        source: "learning-workspace",
        text: `Generate personalized learning recommendations and improvement plan based on my ${interview.role || "mock"} interview performance.`,
        details: {
          selected_interview: interview.rawReport || interview,
          latest_interview: interview.rawReport || interview,
        },
      })
    );
  };

  const handleStartFollowUpInterview = (topic) => {
    dispatch(setUserMode("student"));
    dispatch(setActiveFeature("mock-interview"));
    dispatch(setAgentMode("ai-interviewer"));
    dispatch(
      sendAIMessage({
        modeName: "ai-interviewer",
        feature: "mock-interview",
        source: "learning-workspace",
        text: `I want to practice an interview on ${topic}`,
      })
    );
  };

  const handleStartNewMockInterview = () => {
    dispatch(setUserMode("student"));
    dispatch(setActiveFeature("mock-interview"));
    dispatch(setAgentMode("ai-interviewer"));
    dispatch(runAIFeature("mock-interview"));
  };

  const handleChooseAnother = () => {
    dispatch(resetLearningWorkspace());
    fetchPastInterviews();
  };

  const recommendations = learningWorkspace.recommendations;
  const isGenerating = learningWorkspace.status === "generating";
  const hasReport = learningWorkspace.status === "complete" && recommendations?.priorities;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="card-stark bg-white p-5 border-2 border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-3 border-2 border-black shadow-bold-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black uppercase tracking-tight">AI LEARNING ROADMAP & RECOMMENDATIONS</h2>
              <span className="badge-stark bg-purple-100 text-purple-900 text-[10px] font-bold">
                POST-INTERVIEW COACH
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">
              Personalized study guides, revision cheat-sheets & structured practice goals from your recorded mock interviews.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasReport ? (
            <button
              type="button"
              onClick={handleChooseAnother}
              className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>SELECT ANOTHER INTERVIEW</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={fetchPastInterviews}
              disabled={loadingDb}
              className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingDb ? "animate-spin" : ""}`} />
              <span>REFRESH INTERVIEWS</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── STATE 1: GENERATING IN PROGRESS ─── */}
      {isGenerating && (
        <div className="card-stark bg-white p-8 border-2 border-black text-center space-y-4 animate-pulse">
          <div className="mx-auto w-12 h-12 bg-yellow-100 border-2 border-black flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-black animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase">SYNTHESIZING IMPROVEMENT PLAN...</h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
              Analyzing recorded question responses, scoring factors, and isolating technical gaps to curate actionable study guides.
            </p>
          </div>
          <div className="flex justify-center gap-3 text-[11px] font-bold text-gray-700 pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-black">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Factor Scoring
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 border border-black">
              <Sparkles className="w-3.5 h-3.5 text-black" /> Resource Curation
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-black">
              <Target className="w-3.5 h-3.5 text-gray-400" /> Practice Roadmap
            </span>
          </div>
        </div>
      )}

      {/* ─── STATE 2: ACTIVE RECOMMENDATION PLAN VIEW ─── */}
      {hasReport && (
        <div className="space-y-6">
          {/* Summary Overview Card */}
          <div className="card-stark bg-gradient-to-r from-yellow-50 via-white to-purple-50 p-5 border-2 border-black space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="badge-stark bg-black text-white text-xs font-black uppercase">
                  TARGET ROLE: {recommendations.role || "Software Engineer"}
                </span>
                {recommendations.overall_score !== null && recommendations.overall_score !== undefined && (
                  <span
                    className={`badge-stark text-xs font-black border ${getScoreBadgeClass(
                      recommendations.overall_score
                    )}`}
                  >
                    INTERVIEW SCORE: {recommendations.overall_score}/10
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold text-gray-500">
                GENERATED: {formatDate(recommendations.generated_at)}
              </div>
            </div>

            <p className="text-xs font-medium text-gray-800 leading-relaxed">
              {recommendations.overview}
            </p>
          </div>

          {/* Priorities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <Target className="h-4 w-4 text-black" />
                <span>KEY IMPROVEMENT PRIORITIES ({recommendations.priorities?.length || 0})</span>
              </h3>
              <span className="text-[11px] font-bold text-gray-600">
                Work through these topics sequentially
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {recommendations.priorities.map((item, idx) => (
                <div
                  key={idx}
                  className="card-stark bg-white border-2 border-black p-5 space-y-4 hover:shadow-bold-md transition-all duration-150"
                >
                  {/* Priority Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b-1.5 border-black pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-black text-white font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-black">{item.area}</h4>
                        <div className="text-[11px] font-bold text-gray-500">
                          Priority Focus Area
                        </div>
                      </div>
                    </div>

                    {item.current_score !== null && item.current_score !== undefined && (
                      <span
                        className={`badge-stark text-xs font-black border ${getScoreBadgeClass(
                          item.current_score
                        )}`}
                      >
                        RECORDED SCORE: {item.current_score}/10
                      </span>
                    )}
                  </div>

                  {/* Why this matters */}
                  <div className="bg-gray-50 border border-black p-3 text-xs font-medium text-gray-800">
                    <span className="font-black uppercase text-black block mb-1">Why This Matters:</span>
                    {item.why}
                  </div>

                  {/* Evidence from interview */}
                  {Array.isArray(item.evidence) && item.evidence.length > 0 && (
                    <div className="border-l-4 border-amber-500 bg-amber-50/70 p-3 space-y-1">
                      <div className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Evidence from your interview:
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-xs text-amber-900 font-medium">
                        {item.evidence.map((ev, eIdx) => (
                          <li key={eIdx}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Reading & Guides */}
                  {Array.isArray(item.recommended_reading) && item.recommended_reading.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> Recommended Reading & Study Guides:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.recommended_reading.map((reading, rIdx) => {
                          const badge = getFormatBadge(reading.format);
                          return (
                            <div
                              key={rIdx}
                              className="border-1.5 border-black bg-white p-3.5 flex flex-col justify-between space-y-2 shadow-bold-sm hover:bg-gray-50 transition-colors"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`badge-stark text-[9px] font-black border ${badge.bg}`}>
                                    {badge.label}
                                  </span>
                                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                                </div>
                                <h5 className="text-xs font-black uppercase text-black line-clamp-2">
                                  {reading.title}
                                </h5>
                                <p className="text-[11px] text-gray-600 font-medium leading-snug">
                                  {reading.focus}
                                </p>
                              </div>

                              {reading.reading_goal && (
                                <div className="border-t border-gray-200 pt-2 text-[10px] text-purple-950 font-bold bg-purple-50/80 -mx-3.5 -mb-3.5 p-2 px-3.5">
                                  🎯 Goal: {reading.reading_goal}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Practice Task & Criteria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t-1.5 border-black">
                    <div className="p-3 bg-blue-50/60 border border-blue-900/30 space-y-1">
                      <div className="text-[11px] font-black uppercase text-blue-950 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-blue-700" /> Practice Task:
                      </div>
                      <p className="text-xs font-medium text-blue-950 leading-relaxed">
                        {item.practice_task}
                      </p>
                    </div>

                    <div className="p-3 bg-green-50/60 border border-green-900/30 space-y-1">
                      <div className="text-[11px] font-black uppercase text-green-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-700" /> Ready When:
                      </div>
                      <p className="text-xs font-medium text-green-950 leading-relaxed">
                        {item.success_criteria}
                      </p>
                    </div>
                  </div>

                  {/* Follow-up Interview Button */}
                  {item.follow_up_interview_topic && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleStartFollowUpInterview(item.follow_up_interview_topic)}
                        className="btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-bold-sm"
                      >
                        <Mic2 className="w-3.5 h-3.5" />
                        <span>TEST MYSELF ON &quot;{item.follow_up_interview_topic}&quot;</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STATE 3: INTERVIEW SELECTION VIEW ─── */}
      {!hasReport && !isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>YOUR COMPLETED MOCK INTERVIEWS IN DATABASE</span>
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Choose an interview report to generate targeted reading materials & practice roadmaps.
              </p>
            </div>
            <span className="badge-stark bg-black text-white text-[10px] font-bold">
              {dbInterviews.length} FOUND
            </span>
          </div>

          {loadingDb ? (
            <div className="card-stark bg-white p-12 border-2 border-black text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black" />
              <div className="text-xs font-black uppercase">FETCHING INTERVIEWS FROM DATABASE...</div>
            </div>
          ) : dbInterviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbInterviews.map((interview, index) => {
                const role = interview.role || interview.candidateName || "Mock Interview";
                const overallScore = interview.overallScore ?? interview.rawReport?.overall_score ?? 0;
                const skillGaps = interview.skillGaps || interview.rawReport?.skill_gaps || [];
                const techScore = interview.scores?.technical?.score ?? interview.rawReport?.scores?.technical?.score;
                const commScore = interview.scores?.communication?.score ?? interview.rawReport?.scores?.communication?.score;

                return (
                  <div
                    key={interview._id || index}
                    className="card-stark bg-white border-2 border-black p-4 flex flex-col justify-between space-y-4 hover:shadow-bold-md transition-all duration-150"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b-1.5 border-black pb-2.5">
                        <div>
                          <span className="badge-stark bg-yellow-100 text-[10px] font-bold uppercase mb-1">
                            {interview.source === "job" ? "JOB DRIVE INTERVIEW" : "PROFILE INTERVIEW"}
                          </span>
                          <h4 className="text-sm font-black uppercase text-black leading-tight">
                            {role}
                          </h4>
                          <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(interview.generatedAt || interview.createdAt)}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`badge-stark text-xs font-black border ${getScoreBadgeClass(
                              overallScore
                            )}`}
                          >
                            {overallScore}/10
                          </span>
                          <div className="text-[9px] font-extrabold text-gray-500 mt-1 uppercase">
                            OVERALL
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown Pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <div className="p-2 bg-gray-50 border border-black flex items-center justify-between">
                          <span className="text-gray-600 uppercase text-[10px]">Technical:</span>
                          <span className="font-black text-black">
                            {techScore !== undefined && techScore !== null ? `${techScore}/10` : "N/A"}
                          </span>
                        </div>
                        <div className="p-2 bg-gray-50 border border-black flex items-center justify-between">
                          <span className="text-gray-600 uppercase text-[10px]">Comm:</span>
                          <span className="font-black text-black">
                            {commScore !== undefined && commScore !== null ? `${commScore}/10` : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Skill Gaps Tags */}
                      {Array.isArray(skillGaps) && skillGaps.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-extrabold uppercase text-gray-500">
                            Identified Skill Gaps:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {skillGaps.slice(0, 4).map((gap, gIdx) => (
                              <span
                                key={gIdx}
                                className="badge-stark bg-red-50 text-red-900 border-red-300 text-[10px] font-bold"
                              >
                                {gap}
                              </span>
                            ))}
                            {skillGaps.length > 4 && (
                              <span className="badge-stark bg-gray-100 text-gray-700 text-[10px] font-bold">
                                +{skillGaps.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectInterview(interview)}
                      className="btn-primary w-full py-2 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-bold-sm hover:shadow-bold transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GENERATE LEARNING ROADMAP</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="card-stark bg-white p-10 border-2 border-black text-center space-y-4">
              <div className="w-14 h-14 bg-gray-100 border-2 border-black flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7 text-gray-700" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase">NO SAVED MOCK INTERVIEWS YET</h4>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  Complete your first mock interview with our AI Interviewer to get deep performance analytics, identified weaknesses, and tailored reading lists.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNewMockInterview}
                className="btn-primary px-4 py-2 text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-bold-sm"
              >
                <Mic2 className="w-4 h-4" />
                <span>TAKE A MOCK INTERVIEW NOW</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
