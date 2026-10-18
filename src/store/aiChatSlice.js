import { createSelector, createSlice } from "@reduxjs/toolkit";

const FALLBACK_ERROR_TEXT = "I am having trouble fetching live DB tool data at the moment. Please try asking again!";

// ─── Local storage helpers ────────────────────────────────────────────────────

const readStoredConversation = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const identity = user?._id || user?.email || "guest";
    const stored = JSON.parse(localStorage.getItem(`placement-ai-chat-history:${identity}`));
    if (Array.isArray(stored)) return { messages: stored };
    if (stored && Array.isArray(stored.messages)) return stored;
  } catch {
    // Start with a new conversation if persisted data is unavailable.
  }
  return {};
};

const storedConversation = readStoredConversation();

const readInterviewHistory = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("interview-history") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const saveInterviewHistory = (history) => {
  try {
    localStorage.setItem("interview-history", JSON.stringify(history.slice(0, 20)));
  } catch { /* ignore storage errors */ }
};

// ─── Empty workspace factories ────────────────────────────────────────────────

const emptyJobCreationWorkspace = () => ({
  status: "idle",
  job: null,
  missingFields: [],
  awaitingConfirmation: false,
  persistedJobId: null,
  error: null,
  requestId: null,
});

const emptyPROutreachWorkspace = () => ({
  to: "",
  subject: "",
  body: "",
  status: "idle",
  agentSatisfied: false,
  confidenceScore: null,
  sendStatus: "idle",
  sendError: null,
  sentAt: null,
  messageId: null,
  error: null,
  requestId: null,
  lastSyncedAt: null,
});

const emptyAlumniWorkspace = () => ({
  matches: [],
  draft: null,
  status: "idle",
  agentReviewed: false,
  sendStatus: "idle",
  sendError: null,
  requestId: null,
  resumeShareDraft: null,
  resumeShareReviewed: false,
  resumeShareStatus: "idle",
  resumeShareError: null,
});

const emptyInterviewWorkspace = () => ({
  status: "idle",
  options: [],
  dbJobs: [],
  selectedJob: null,
  currentQuestion: "",
  questionNumber: 0,
  topic: "",
  secondsRemaining: 0,
  report: null,
  reason: null,
  error: null,
  requestId: null,
  resources: null,
});

const emptyGapAnalysisWorkspace = () => ({
  status: "idle",
  gaps: [],
  suggestions: [],
  confidenceScore: null,
  error: null,
  requestId: null,
});

const emptyLearningWorkspace = () => ({
  status: "idle",
  interviews: [],
  selectedInterview: null,
  recommendations: null,
  error: null,
  requestId: null,
});

const emptyJourney = () => ({ selectedJob: null, resume: "" });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildWelcomeMessage = (name = "Student") => ({
  id: crypto.randomUUID(),
  sender: "bot",
  text: `Hello ${name}! I am your AI Placement Assistant. How can I help you today?`,
  headerMessage: null,
  streaming: false,
  createdAt: new Date().toISOString(),
});

const toSessionRecord = (state) => {
  const firstUserMessage = state.messages.find((message) => message.sender === "user");
  if (!firstUserMessage) return null;
  const lastMessage = state.messages[state.messages.length - 1];
  return {
    sessionId: state.sessionId,
    title: firstUserMessage.text || "Untitled conversation",
    createdAt: firstUserMessage.createdAt || new Date().toISOString(),
    updatedAt: lastMessage?.createdAt || new Date().toISOString(),
    messages: state.messages.map((message) => ({ ...message, streaming: false })),
    prOutreachWorkspace: { ...state.prOutreachWorkspace },
    alumniWorkspace: { ...state.alumniWorkspace },
    interviewWorkspace: { ...state.interviewWorkspace },
    journey: { ...state.journey },
  };
};

const archiveCurrentSession = (state) => {
  const current = toSessionRecord(state);
  if (!current) return;
  state.sessions = [current, ...state.sessions.filter((s) => s.sessionId !== current.sessionId)].slice(0, 30);
};

export const readConversationForUser = (user) => {
  try {
    const identity = user?._id || user?.email || "guest";
    const stored = JSON.parse(localStorage.getItem(`placement-ai-chat-history:${identity}`));
    if (Array.isArray(stored)) return { sessionId: crypto.randomUUID(), messages: stored };
    if (stored && Array.isArray(stored.messages)) return stored;
  } catch {
    // Return a fresh conversation when stored history cannot be read.
  }
  return { sessionId: crypto.randomUUID(), messages: [] };
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const aiChatSlice = createSlice({
  name: "aiChat",
  initialState: {
    sessionId: storedConversation.sessionId || crypto.randomUUID(),
    messages: storedConversation.messages || [],
    sessions: storedConversation.sessions || [],
    requests: {},
    connected: false,
    latestJobs: [],
    latestAgentData: null,
    latestUiTarget: null,
    resumeWorkspace: {
      latexCode: "",
      status: "idle",
      pdfUrl: null,
      error: null,
      requestId: null,
      analysis: null,
    },
    jobCreationWorkspace: emptyJobCreationWorkspace(),
    prOutreachWorkspace: {
      ...emptyPROutreachWorkspace(),
      ...(storedConversation.prOutreachWorkspace || {}),
    },
    alumniWorkspace: {
      ...emptyAlumniWorkspace(),
      ...(storedConversation.alumniWorkspace || {}),
    },
    interviewWorkspace: {
      ...emptyInterviewWorkspace(),
      ...(storedConversation.interviewWorkspace || {}),
    },
    gapAnalysisWorkspace: emptyGapAnalysisWorkspace(),
    learningWorkspace: emptyLearningWorkspace(),
    interviewHistory: readInterviewHistory(),
    journey: {
      ...emptyJourney(),
      ...(storedConversation.journey || {}),
    },
  },
  reducers: {
    connectionChanged(state, action) {
      state.connected = Boolean(action.payload);
    },

    conversationHydrated(state, action) {
      state.sessionId = action.payload?.sessionId || crypto.randomUUID();
      state.messages = action.payload?.messages || [];
      state.sessions = action.payload?.sessions || [];
      state.requests = {};
      state.latestJobs = [];
      state.latestAgentData = null;
      state.latestUiTarget = null;
      state.resumeWorkspace = { latexCode: "", status: "idle", pdfUrl: null, error: null, requestId: null, analysis: null };
      state.jobCreationWorkspace = emptyJobCreationWorkspace();
      state.prOutreachWorkspace = {
        ...emptyPROutreachWorkspace(),
        ...(action.payload?.prOutreachWorkspace || {}),
      };
      state.alumniWorkspace = {
        ...emptyAlumniWorkspace(),
        ...(action.payload?.alumniWorkspace || {}),
      };
      state.interviewWorkspace = {
        ...emptyInterviewWorkspace(),
        ...(action.payload?.interviewWorkspace || {}),
      };
      state.gapAnalysisWorkspace = emptyGapAnalysisWorkspace();
      state.learningWorkspace = emptyLearningWorkspace();
      state.journey = { ...emptyJourney(), ...(action.payload?.journey || {}) };
    },

    ensureWelcomeMessage(state, action) {
      if (state.messages.length > 0) return;
      state.messages.push(buildWelcomeMessage(action.payload));
    },

    requestStarted(state, action) {
      const { requestId, userMessageId, assistantMessageId, text, createdAt, payload } = action.payload;
      state.requests[requestId] = {
        requestId,
        assistantMessageId,
        feature: payload?.feature || null,
        source: payload?.source || "chat",
        modeName: payload?.mode_name || null,
        status: "pending",
        error: null,
      };
      state.messages.push({ id: userMessageId, requestId, sender: "user", text, createdAt, streaming: false });
      state.messages.push({
        id: assistantMessageId,
        requestId,
        sender: "bot",
        text: "",
        headerMessage: null,
        createdAt,
        streaming: true,
      });
      if (payload?.mode_name === "resume-generator") {
        state.resumeWorkspace.status = "collecting";
        state.resumeWorkspace.error = null;
        state.resumeWorkspace.requestId = requestId;
      }
      if (payload?.mode_name === "job-creation") {
        state.jobCreationWorkspace.status = "collecting";
        state.jobCreationWorkspace.error = null;
        state.jobCreationWorkspace.requestId = requestId;
      }
      if (payload?.mode_name === "pr_outreach" || payload?.mode_name === "pr-outreach") {
        if (payload?.source !== "pr-outreach-mail-sent") {
          state.prOutreachWorkspace.status = "drafting";
          state.prOutreachWorkspace.agentSatisfied = false;
        }
        state.prOutreachWorkspace.error = null;
        state.prOutreachWorkspace.requestId = requestId;
      }
      if (payload?.mode_name === "alumni-connect" || payload?.mode_name === "alumni_connect") {
        state.alumniWorkspace.status = "working";
        state.alumniWorkspace.sendError = null;
        state.alumniWorkspace.requestId = requestId;
      }
      if (payload?.mode_name === "ai-interviewer") {
        state.interviewWorkspace.status =
          state.interviewWorkspace.status === "complete" || state.interviewWorkspace.status === "idle"
            ? "starting"
            : state.interviewWorkspace.status;
        state.interviewWorkspace.error = null;
        state.interviewWorkspace.requestId = requestId;
      }
      if (payload?.mode_name === "gap-analysis") {
        state.gapAnalysisWorkspace.status = "analysing";
        state.gapAnalysisWorkspace.error = null;
        state.gapAnalysisWorkspace.requestId = requestId;
      }
      if (payload?.mode_name === "learning-recommendation") {
        state.learningWorkspace.status =
          state.learningWorkspace.selectedInterview ? "generating" : "idle";
        state.learningWorkspace.error = null;
        state.learningWorkspace.requestId = requestId;
      }
    },

    responseReceived(state, action) {
      const payload = action.payload;
      const request = state.requests[payload.requestId];
      if (!request) return;

      const message = state.messages.find((item) => item.id === request.assistantMessageId);
      if (message) {
        const isResumeResponse =
          request.modeName === "resume-generator" ||
          payload.header_message === "resume_generator" ||
          payload.header_message === "resume-generator";
        if (isResumeResponse && payload.data?.type === "text") {
          message.text += payload.response || "";
        } else if (!isResumeResponse || payload.response) {
          message.text = payload.response || message.text || FALLBACK_ERROR_TEXT;
        }
        message.headerMessage = payload.header_message || null;
        message.streaming = !payload.isEnd;
        if (Array.isArray(payload.options) && payload.options.length > 0) {
          message.options = payload.options;
        } else if (payload.header_message === "button:options" && Array.isArray(payload.data?.options)) {
          message.options = payload.data.options.map((opt) =>
            typeof opt === "string" ? opt : opt.label || opt.value || String(opt)
          );
        }
      }

      request.status = payload.isEnd ? "completed" : "streaming";
      request.error = null;

      if (payload.data !== undefined) {
        state.latestAgentData = payload.data;
      }

      // ── Resume generator ──
      if (payload.header_message === "resume_generator" || payload.header_message === "resume-generator") {
        state.latestUiTarget = "resume.generator";
        if (payload.data?.type === "latex") {
          if (state.resumeWorkspace.status !== "streaming") state.resumeWorkspace.latexCode = "";
          state.resumeWorkspace.latexCode += payload.data.content || "";
          state.resumeWorkspace.status = payload.data.status === "complete" ? "complete" : "streaming";
          state.resumeWorkspace.requestId = payload.requestId;
          if (payload.data.status === "complete") {
            state.journey.resume = state.resumeWorkspace.latexCode;
            if (payload.data.target_job) state.journey.selectedJob = payload.data.target_job;
          }
        } else if (payload.data?.type === "text" && payload.isEnd) {
          state.resumeWorkspace.status = "collecting";
        } else if (payload.data?.type === "analysis") {
          state.resumeWorkspace.analysis = payload.data;
          state.resumeWorkspace.status = "analysis";
          state.latestUiTarget =
            payload.data.analysis_type === "gap" ? "resume.skill-gap" : "resume.ats-score";
        }
        if (payload.pdfUrl) state.resumeWorkspace.pdfUrl = payload.pdfUrl;
      }

      // ── Job creation ──
      if (payload.header_message?.startsWith("mode:jobCreation:")) {
        const headerStatus = payload.header_message.split(":").at(-1);
        state.latestUiTarget = "tpo.job-creator";
        state.jobCreationWorkspace.status =
          payload.data?.status ||
          (payload.data?.type === "confirmation" ? "confirmation" : headerStatus);
        state.jobCreationWorkspace.job = payload.data?.job || state.jobCreationWorkspace.job;
        state.jobCreationWorkspace.missingFields = payload.data?.missing_fields || [];
        state.jobCreationWorkspace.awaitingConfirmation = payload.data?.type === "confirmation";
        state.jobCreationWorkspace.persistedJobId =
          payload.data?.persisted_job_id || state.jobCreationWorkspace.persistedJobId;
        state.jobCreationWorkspace.error = headerStatus === "error" ? payload.response : null;
        state.jobCreationWorkspace.requestId = payload.requestId;
      }

      // ── PR Outreach ──
      if (payload.header_message === "mail:review" || payload.header_message === "pr_outreach_satisfied") {
        const draft = payload.data?.email || payload.data || {};
        state.latestUiTarget = "pr-outreach.composer";
        if (typeof draft.to === "string") state.prOutreachWorkspace.to = draft.to;
        if (typeof draft.subject === "string") state.prOutreachWorkspace.subject = draft.subject;
        if (typeof draft.body === "string") state.prOutreachWorkspace.body = draft.body;
        if (payload.header_message === "pr_outreach_satisfied") {
          state.prOutreachWorkspace.agentSatisfied = true;
          state.prOutreachWorkspace.status = "satisfied";
        } else {
          state.prOutreachWorkspace.status = "review";
          state.prOutreachWorkspace.sendStatus = "idle";
          state.prOutreachWorkspace.sendError = null;
          state.prOutreachWorkspace.sentAt = null;
          state.prOutreachWorkspace.messageId = null;
        }
        if (Number.isFinite(payload.confidence_score)) {
          state.prOutreachWorkspace.confidenceScore = payload.confidence_score;
        }
        state.prOutreachWorkspace.error = null;
        state.prOutreachWorkspace.requestId = payload.requestId;
        state.prOutreachWorkspace.lastSyncedAt = new Date().toISOString();
      }

      // ── Jobs list ──
      if (
        payload.header_message === "mode:jobparser:jobslist" &&
        Array.isArray(payload.data) &&
        payload.data.length > 0
      ) {
        state.latestJobs = payload.data;
        state.latestUiTarget = "student.jobs";
      }
      if (payload.header_message === "mode:jobparser:jobdetails" && payload.data?.selected_job) {
        state.journey.selectedJob = payload.data.selected_job;
      }

      // ── Alumni ──
      if (payload.header_message === "alumni:matches" && Array.isArray(payload.data)) {
        state.latestUiTarget = "alumni.matches";
        state.alumniWorkspace.matches = payload.data;
        state.alumniWorkspace.status = "matches";
        state.alumniWorkspace.requestId = payload.requestId;
      }
      if (payload.header_message === "alumni:request-review") {
        state.latestUiTarget = "alumni.request";
        state.alumniWorkspace.draft = payload.data || null;
        state.alumniWorkspace.status = "review";
        state.alumniWorkspace.agentReviewed = true;
        state.alumniWorkspace.sendStatus = "idle";
        state.alumniWorkspace.sendError = null;
        state.alumniWorkspace.requestId = payload.requestId;
      }
      if (payload.header_message === "alumni:resume-share-review") {
        state.latestUiTarget = "alumni.resume-share";
        state.alumniWorkspace.resumeShareDraft = payload.data || null;
        state.alumniWorkspace.resumeShareReviewed = true;
        state.alumniWorkspace.resumeShareStatus = "review";
        state.alumniWorkspace.resumeShareError = null;
        state.alumniWorkspace.requestId = payload.requestId;
      }
      if (payload.header_message === "alumni_connect_completed") {
        state.alumniWorkspace = emptyAlumniWorkspace();
      }

      // ── Interview ──
      if (payload.header_message === "button:options" && payload.data?.type === "options") {
        state.latestUiTarget = "student.mock-interview";
        state.interviewWorkspace = {
          ...emptyInterviewWorkspace(),
          status: "choosing",
          options: Array.isArray(payload.data.options) ? payload.data.options : [],
          requestId: payload.requestId,
        };
      }
      if (payload.header_message === "select:job:db") {
        state.latestUiTarget = "student.mock-interview";
        state.interviewWorkspace.status = "awaiting-job";
        state.interviewWorkspace.error = null;
        state.interviewWorkspace.requestId = payload.requestId;
        if (Array.isArray(payload.data?.jobs)) {
          state.interviewWorkspace.dbJobs = payload.data.jobs;
        }
      }
      if (payload.header_message === "text:mode:interview") {
        state.latestUiTarget = "student.mock-interview";
        state.interviewWorkspace.requestId = payload.requestId;
        if (payload.data?.type === "interview_intro") {
          state.interviewWorkspace.status = "awaiting-name";
          state.interviewWorkspace.currentQuestion = "";
        } else if (payload.data?.type === "interview_question") {
          state.interviewWorkspace.status = "in-progress";
          state.interviewWorkspace.currentQuestion = payload.response || "";
          state.interviewWorkspace.questionNumber = payload.data.question_number || 0;
          state.interviewWorkspace.topic = payload.data.topic || "General";
          state.interviewWorkspace.secondsRemaining = payload.data.seconds_remaining || 0;
        } else if (payload.data?.type === "error") {
          state.interviewWorkspace.status = "error";
          state.interviewWorkspace.error = payload.response || FALLBACK_ERROR_TEXT;
        }
      }
      if (payload.header_message === "interview:end" && payload.data?.type === "interview_report") {
        state.latestUiTarget = "student.mock-interview";
        state.interviewWorkspace.status = "complete";
        state.interviewWorkspace.report = payload.data.report || null;
        state.interviewWorkspace.reason = payload.data.reason || null;
        state.interviewWorkspace.currentQuestion = "";
        state.interviewWorkspace.requestId = payload.requestId;
        // Persist to interview history
        if (payload.data.report) {
          const historyEntry = {
            id: crypto.randomUUID(),
            completedAt: new Date().toISOString(),
            report: payload.data.report,
          };
          state.interviewHistory = [historyEntry, ...state.interviewHistory].slice(0, 20);
          saveInterviewHistory(state.interviewHistory);
        }
      }
      // ── Gap Analysis workspace ─────────────────────────────────────
      if (
        payload.header_message === "mode:gapAnalysis:analysis" ||
        payload.header_message === "mode:gapAnalysis:suggestions"
      ) {
        state.latestUiTarget = "tpo.gap-analysis";
        state.gapAnalysisWorkspace.status = "ready";
        state.gapAnalysisWorkspace.requestId = payload.requestId;
        if (Array.isArray(payload.data?.gaps) && payload.data.gaps.length > 0) {
          state.gapAnalysisWorkspace.gaps = payload.data.gaps;
        }
        if (Array.isArray(payload.data?.suggestions) && payload.data.suggestions.length > 0) {
          state.gapAnalysisWorkspace.suggestions = payload.data.suggestions;
        }
        if (Number.isFinite(payload.confidence_score)) {
          state.gapAnalysisWorkspace.confidenceScore = payload.confidence_score;
        }
        state.gapAnalysisWorkspace.error = null;
      }
      if (payload.header_message === "mode:gapAnalysis:error") {
        state.latestUiTarget = "tpo.gap-analysis";
        state.gapAnalysisWorkspace.status = "error";
        state.gapAnalysisWorkspace.error = payload.response || "Something went wrong.";
        state.gapAnalysisWorkspace.requestId = payload.requestId;
      }

      // ── Learning Recommendation workspace ────────────────────────
      if (payload.header_message === "select:interview:db") {
        state.latestUiTarget = "student.learning-recommendation";
        state.learningWorkspace.status = "select-interview";
        state.learningWorkspace.requestId = payload.requestId;
        state.learningWorkspace.error = null;
        if (Array.isArray(payload.data?.interviews)) {
          state.learningWorkspace.interviews = payload.data.interviews;
        }
      }
      if (payload.header_message === "learning:recommendations") {
        state.latestUiTarget = "student.learning-recommendation";
        state.learningWorkspace.status = "complete";
        state.learningWorkspace.recommendations = payload.data || null;
        state.learningWorkspace.requestId = payload.requestId;
        state.learningWorkspace.error = null;
      }
      if (payload.header_message === "learning:recommendations-error") {
        state.latestUiTarget = "student.learning-recommendation";
        state.learningWorkspace.status = "error";
        state.learningWorkspace.error = payload.response || "Unable to generate recommendations.";
        state.learningWorkspace.requestId = payload.requestId;
      }
    },

    interviewTranscriptUpdated(state, action) {
      const { requestId, text } = action.payload || {};
      if (!requestId || typeof text !== "string") return;
      const message = state.messages.find((item) => item.requestId === requestId && item.sender === "user");
      if (message) message.text = text.trim() || "🎙️ Listening…";
    },

    interviewResourcesUpdated(state, action) {
      state.interviewWorkspace.resources = action.payload || null;
    },

    requestFailed(state, action) {
      const { requestId, message: errorMessage } = action.payload;
      const request = state.requests[requestId];
      if (!request) return;
      request.status = "failed";
      request.error = errorMessage || FALLBACK_ERROR_TEXT;
      const message = state.messages.find((item) => item.id === request.assistantMessageId);
      if (message) {
        message.text = request.error;
        message.headerMessage = null;
        message.streaming = false;
      }
      if (request.modeName === "resume-generator") {
        state.resumeWorkspace.status = "error";
        state.resumeWorkspace.error = request.error;
      }
      if (request.modeName === "job-creation") {
        state.jobCreationWorkspace.status = "error";
        state.jobCreationWorkspace.error = request.error;
      }
      if (request.modeName === "pr_outreach" || request.modeName === "pr-outreach") {
        state.prOutreachWorkspace.status = "error";
        state.prOutreachWorkspace.error = request.error;
      }
      if (request.modeName === "alumni-connect" || request.modeName === "alumni_connect") {
        state.alumniWorkspace.status = "error";
        state.alumniWorkspace.sendError = request.error;
      }
      if (request.modeName === "ai-interviewer") {
        state.interviewWorkspace.status = "error";
        state.interviewWorkspace.error = request.error;
      }
      if (request.modeName === "gap-analysis") {
        state.gapAnalysisWorkspace.status = "error";
        state.gapAnalysisWorkspace.error = request.error;
      }
      if (request.modeName === "learning-recommendation") {
        state.learningWorkspace.status = "error";
        state.learningWorkspace.error = request.error;
      }
    },

    prOutreachDraftUpdated(state, action) {
      const changes = action.payload || {};
      for (const field of ["to", "subject", "body"]) {
        if (typeof changes[field] === "string") state.prOutreachWorkspace[field] = changes[field];
      }
      if (typeof changes.status === "string") {
        state.prOutreachWorkspace.status = changes.status;
      } else if (["review", "satisfied", "sent"].includes(state.prOutreachWorkspace.status)) {
        state.prOutreachWorkspace.status = "editing";
        state.prOutreachWorkspace.agentSatisfied = false;
        state.prOutreachWorkspace.sendStatus = "idle";
        state.prOutreachWorkspace.sentAt = null;
        state.prOutreachWorkspace.messageId = null;
      }
      state.prOutreachWorkspace.error = null;
      state.prOutreachWorkspace.sendError = null;
    },

    prOutreachSendStarted(state) {
      state.prOutreachWorkspace.sendStatus = "sending";
      state.prOutreachWorkspace.sendError = null;
    },

    prOutreachSendSucceeded(state, action) {
      state.prOutreachWorkspace.status = "sent";
      state.prOutreachWorkspace.sendStatus = "sent";
      state.prOutreachWorkspace.sendError = null;
      state.prOutreachWorkspace.sentAt = new Date().toISOString();
      state.prOutreachWorkspace.messageId = action.payload?.messageId || null;
    },

    prOutreachSendFailed(state, action) {
      state.prOutreachWorkspace.sendStatus = "error";
      state.prOutreachWorkspace.sendError = action.payload || "Unable to send mail";
    },

    journeyJobSelected(state, action) {
      state.journey.selectedJob = action.payload || null;
    },

    alumniSelectionStarted(state) {
      state.alumniWorkspace.draft = null;
      state.alumniWorkspace.status = "working";
      state.alumniWorkspace.agentReviewed = false;
      state.alumniWorkspace.sendStatus = "idle";
      state.alumniWorkspace.sendError = null;
    },

    alumniDraftUpdated(state, action) {
      if (!state.alumniWorkspace.draft) return;
      state.alumniWorkspace.draft = { ...state.alumniWorkspace.draft, ...(action.payload || {}) };
      state.alumniWorkspace.status = "editing";
      state.alumniWorkspace.agentReviewed = false;
      state.alumniWorkspace.sendStatus = "idle";
      state.alumniWorkspace.sendError = null;
    },

    alumniSendStarted(state) {
      state.alumniWorkspace.sendStatus = "sending";
      state.alumniWorkspace.sendError = null;
    },

    alumniSendSucceeded(state) {
      state.alumniWorkspace.status = "sent";
      state.alumniWorkspace.sendStatus = "sent";
      state.alumniWorkspace.sendError = null;
    },

    alumniSendFailed(state, action) {
      state.alumniWorkspace.sendStatus = "error";
      state.alumniWorkspace.sendError = action.payload || "Unable to send connection request";
    },

    alumniResumeShareDraftUpdated(state, action) {
      if (!state.alumniWorkspace.resumeShareDraft) return;
      state.alumniWorkspace.resumeShareDraft = {
        ...state.alumniWorkspace.resumeShareDraft,
        ...(action.payload || {}),
      };
      state.alumniWorkspace.resumeShareReviewed = false;
      state.alumniWorkspace.resumeShareStatus = "editing";
      state.alumniWorkspace.resumeShareError = null;
    },

    alumniResumeShareStarted(state) {
      state.alumniWorkspace.resumeShareStatus = "sharing";
      state.alumniWorkspace.resumeShareError = null;
    },

    alumniResumeShareSucceeded(state) {
      state.alumniWorkspace.resumeShareStatus = "shared";
      state.alumniWorkspace.resumeShareError = null;
      state.alumniWorkspace.resumeShareDraft = null;
      state.alumniWorkspace.resumeShareReviewed = false;
    },

    alumniResumeShareFailed(state, action) {
      state.alumniWorkspace.resumeShareStatus = "error";
      state.alumniWorkspace.resumeShareError = action.payload || "Unable to share resume";
    },

    alumniResumeShareDismissed(state) {
      state.alumniWorkspace.resumeShareDraft = null;
      state.alumniWorkspace.resumeShareReviewed = false;
      state.alumniWorkspace.resumeShareStatus = "idle";
      state.alumniWorkspace.resumeShareError = null;
    },

    newChatStarted(state, action) {
      archiveCurrentSession(state);
      state.sessionId = crypto.randomUUID();
      state.messages = [buildWelcomeMessage(action.payload || "Student")];
      state.requests = {};
      state.latestJobs = [];
      state.latestAgentData = null;
      state.latestUiTarget = null;
      state.resumeWorkspace = { latexCode: "", status: "idle", pdfUrl: null, error: null, requestId: null, analysis: null };
      state.jobCreationWorkspace = emptyJobCreationWorkspace();
      state.prOutreachWorkspace = emptyPROutreachWorkspace();
      state.alumniWorkspace = emptyAlumniWorkspace();
      state.interviewWorkspace = emptyInterviewWorkspace();
      state.gapAnalysisWorkspace = emptyGapAnalysisWorkspace();
      state.journey = emptyJourney();
    },

    conversationOpened(state, action) {
      const targetSessionId = action.payload;
      if (!targetSessionId || targetSessionId === state.sessionId) return;
      const target = state.sessions.find((session) => session.sessionId === targetSessionId);
      if (!target) return;

      archiveCurrentSession(state);
      state.sessions = state.sessions.filter((session) => session.sessionId !== targetSessionId);
      state.sessionId = target.sessionId;
      state.messages = target.messages.map((message) => ({ ...message, streaming: false }));
      state.requests = {};
      state.latestJobs = [];
      state.latestAgentData = null;
      state.latestUiTarget = null;
      state.resumeWorkspace = { latexCode: "", status: "idle", pdfUrl: null, error: null, requestId: null, analysis: null };
      state.jobCreationWorkspace = emptyJobCreationWorkspace();
      state.prOutreachWorkspace = {
        ...emptyPROutreachWorkspace(),
        ...(target.prOutreachWorkspace || {}),
      };
      state.alumniWorkspace = {
        ...emptyAlumniWorkspace(),
        ...(target.alumniWorkspace || {}),
      };
      state.interviewWorkspace = {
        ...emptyInterviewWorkspace(),
        ...(target.interviewWorkspace || {}),
      };
      state.gapAnalysisWorkspace = emptyGapAnalysisWorkspace();
      state.journey = { ...emptyJourney(), ...(target.journey || {}) };
    },

    resetAIChat(state) {
      state.sessionId = crypto.randomUUID();
      state.messages = [];
      state.sessions = [];
      state.requests = {};
      state.latestJobs = [];
      state.latestAgentData = null;
      state.latestUiTarget = null;
      state.resumeWorkspace = { latexCode: "", status: "idle", pdfUrl: null, error: null, requestId: null, analysis: null };
      state.jobCreationWorkspace = emptyJobCreationWorkspace();
      state.prOutreachWorkspace = emptyPROutreachWorkspace();
      state.alumniWorkspace = emptyAlumniWorkspace();
      state.interviewWorkspace = emptyInterviewWorkspace();
      state.gapAnalysisWorkspace = emptyGapAnalysisWorkspace();
      state.learningWorkspace = emptyLearningWorkspace();
      state.journey = emptyJourney();
    },

    setLearningSelectedInterview(state, action) {
      state.learningWorkspace.selectedInterview = action.payload || null;
    },

    resetLearningWorkspace(state) {
      state.learningWorkspace = emptyLearningWorkspace();
    },
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const {
  connectionChanged,
  conversationHydrated,
  ensureWelcomeMessage,
  requestStarted,
  responseReceived,
  interviewTranscriptUpdated,
  interviewResourcesUpdated,
  requestFailed,
  prOutreachDraftUpdated,
  prOutreachSendStarted,
  prOutreachSendSucceeded,
  prOutreachSendFailed,
  journeyJobSelected,
  alumniSelectionStarted,
  alumniDraftUpdated,
  alumniSendStarted,
  alumniSendSucceeded,
  alumniSendFailed,
  alumniResumeShareDraftUpdated,
  alumniResumeShareStarted,
  alumniResumeShareSucceeded,
  alumniResumeShareFailed,
  alumniResumeShareDismissed,
  setLearningSelectedInterview,
  resetLearningWorkspace,
  newChatStarted,
  conversationOpened,
  resetAIChat,
} = aiChatSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectChatMessages = (state) => state.aiChat.messages;
export const selectAIConnected = (state) => state.aiChat.connected;
export const selectAILoading = (state) =>
  Object.values(state.aiChat.requests).some(
    (request) => request.status === "pending" || request.status === "streaming"
  );
export const selectLatestJobs = (state) => state.aiChat.latestJobs;
export const selectLatestUiTarget = (state) => state.aiChat.latestUiTarget;
export const selectResumeWorkspace = (state) => state.aiChat.resumeWorkspace;
export const selectJobCreationWorkspace = (state) => state.aiChat.jobCreationWorkspace;
export const selectPROutreachWorkspace = (state) => state.aiChat.prOutreachWorkspace;
export const selectAlumniWorkspace = (state) => state.aiChat.alumniWorkspace;
export const selectInterviewWorkspace = (state) => state.aiChat.interviewWorkspace;
export const selectGapAnalysisWorkspace = (state) => state.aiChat.gapAnalysisWorkspace;
export const selectLearningWorkspace = (state) => state.aiChat.learningWorkspace;
export const selectInterviewHistory = (state) => state.aiChat.interviewHistory;
export const selectStudentJourney = (state) => state.aiChat.journey;

export const selectChatSessions = createSelector(
  [(state) => state.aiChat],
  (aiChat) => {
    const current = toSessionRecord(aiChat);
    const sessions = current
      ? [current, ...aiChat.sessions.filter((session) => session.sessionId !== current.sessionId)]
      : aiChat.sessions;
    return sessions.slice(0, 30);
  }
);

export default aiChatSlice.reducer;
