import { ensureSocketAuthentication, socket } from "../lib/socket";
import {
  connectionChanged,
  ensureWelcomeMessage,
  conversationOpened,
  newChatStarted,
  requestFailed,
  requestStarted,
  responseReceived,
  interviewTranscriptUpdated,
} from "../store/aiChatSlice";
import { setActiveFeature, setActiveJobsTab, setActiveResumeTool, setAgentMode, setUserMode } from "../store/appContextSlice";
import { getAIFeature } from "./aiFeatureRegistry";

// Collection/generation calls can include more than one Gemini round trip.
// Keep the UI request alive while the Python agent is still processing.
const RESPONSE_TIMEOUT_MS = 90000;
const FALLBACK_ERROR_TEXT = "I am having trouble fetching live DB tool data at the moment. Please try asking again!";
const AGENT_MODE_BY_HEADER = {
  "mode:switch:jobs": "jobs-finder",
  "mode:switch:resume": "resume-generator",
  "mode:switch:job-eligibility": "job-eligibility",
  "mode:switch:job-creation": "job-creation",
  "mode:jobparser:jobslist": "jobs-finder",
  "mode:jobparser:eligibility": "job-eligibility",
  "resume_generator": "resume-generator",
  "resume-generator": "resume-generator",
  "mode:jobCreation:data": "job-creation",
  "mode:jobCreation:ready": "job-creation",
  "mode:jobCreation:post": "job-creation",
  "mode:jobCreation:error": "job-creation",
  "mode:switch:pr-outreach": "pr_outreach",
  "mail:review": "pr_outreach",
  "pr_outreach_satisfied": "pr_outreach",
  "pr_outreach_completed": "pr_outreach",
  "mode:switch:alumni-connect": "alumni-connect",
  "alumni_connect": "alumni-connect",
  "alumni:matches": "alumni-connect",
  "alumni:request-review": "alumni-connect",
  "alumni:resume-share-review": "alumni-connect",
  "alumni_connect_completed": "alumni-connect",
  "mode:switch:ai-interviewer": "ai-interviewer",
  "button:options": "ai-interviewer",
  "select:job:db": "ai-interviewer",
  "text:mode:interview": "ai-interviewer",
  "interview:end": "ai-interviewer",
  // Gap Analysis
  "mode:switch:gap-analysis": "gap-analysis",
  "mode:gapAnalysis:analysis": "gap-analysis",
  "mode:gapAnalysis:suggestions": "gap-analysis",
  "mode:gapAnalysis:error": "gap-analysis",
  // Learning recommendation
  "mode:switch:learning-recommendation": "learning-recommendation",
  "select:interview:db": "learning-recommendation",
  "learning:recommendations": "learning-recommendation",
  "learning:recommendations-error": "learning-recommendation",
};

class AIRequestHandler {
  constructor() {
    this.store = null;
    this.timeouts = new Map();
    this.initialized = false;
  }

  initialize(store) {
    if (this.initialized) return;
    this.store = store;
    this.initialized = true;

    socket.on("connect", () => store.dispatch(connectionChanged(true)));
    socket.on("disconnect", () => store.dispatch(connectionChanged(false)));
    socket.on("response", (payload) => this.handleResponse(payload));
    socket.on("interview:transcript", (payload) => {
      store.dispatch(interviewTranscriptUpdated(payload));
      if (payload?.isFinal) this.armTimeout(payload.requestId);
    });
    socket.on("interview:audio:error", (payload) => {
      if (!payload?.requestId || payload.code === "TTS_FAILED") return;
      const request = store.getState().aiChat.requests[payload.requestId];
      if (request && request.status !== "completed") {
        this.clearTimeout(payload.requestId);
        store.dispatch(requestFailed({ requestId: payload.requestId, message: payload.message }));
      }
    });
    store.dispatch(connectionChanged(socket.connected));
    store.dispatch(ensureWelcomeMessage(store.getState().appContext.user?.name || "Student"));
  }

  send({ text, details = {}, modeName, source = "chat", feature = null }) {
    if (!this.store) throw new Error("AI request handler has not been initialized");

    const cleanText = String(text || "").trim();
    if (!cleanText) return null;

    const state = this.store.getState();
    const requestId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const user = state.appContext.user;
    const effectiveModeName = modeName || (
      state.appContext.activeMode === "pr_outreach" ? "pr_outreach" :
        state.appContext.activeMode === "alumni_connect" ? "alumni-connect" : state.appContext.agentMode
    );
    const payload = {
      requestId,
      sessionId: state.aiChat.sessionId,
      user_query: cleanText,
      user_role: state.appContext.userRole,
      user_mode: state.appContext.activeMode,
      mode_name: effectiveModeName,
      source,
      feature,
      user: user ? {
        id: user._id || user.id || null,
        name: user.name || null,
        email: user.email || null,
        role: state.appContext.userRole,
        branch: user.branch || null,
        skills: Array.isArray(user.skills) ? user.skills : [],
      } : null,
      details: {
        ...state.appContext.details,
        selected_job: state.aiChat.journey.selectedJob,
        resume: state.aiChat.journey.resume,
        ...details,
      },
      past_messages: state.aiChat.messages.slice(-8).map((message) => ({
        role: message.sender === "user" ? "user" : "assistant",
        content: message.text || "",
      })),
    };
    if (
      (effectiveModeName === "pr_outreach" || effectiveModeName === "pr-outreach") &&
      state.aiChat.prOutreachWorkspace.sendStatus !== "sent"
    ) {
      const draft = state.aiChat.prOutreachWorkspace;
      payload.mail_draft = {
        to: draft.to,
        subject: draft.subject,
        body: draft.body,
        status: draft.status,
        confidence_score: draft.confidenceScore,
      };
    }
    if (
      (effectiveModeName === "alumni-connect" || effectiveModeName === "alumni_connect") &&
      state.aiChat.alumniWorkspace.draft &&
      state.aiChat.alumniWorkspace.sendStatus !== "sent"
    ) {
      const draft = state.aiChat.alumniWorkspace.draft;
      payload.alumni_request_draft = {
        alumni_id: draft.alumni_id,
        alumni_name: draft.alumni_name,
        request_type: draft.request_type,
        message: draft.message,
        selected_job: draft.selected_job,
        share_resume: Boolean(draft.share_resume),
        resume: draft.share_resume ? draft.resume : "",
        status: draft.status,
      };
    }
    if (
      (effectiveModeName === "alumni-connect" || effectiveModeName === "alumni_connect") &&
      state.aiChat.alumniWorkspace.resumeShareDraft &&
      state.aiChat.alumniWorkspace.resumeShareStatus !== "shared"
    ) {
      payload.resume_share_draft = state.aiChat.alumniWorkspace.resumeShareDraft;
    }

    this.store.dispatch(requestStarted({
      requestId,
      userMessageId: crypto.randomUUID(),
      assistantMessageId: crypto.randomUUID(),
      text: cleanText,
      createdAt,
      payload,
    }));

    if (modeName) this.store.dispatch(setAgentMode(modeName));

    ensureSocketAuthentication();
    socket.emit("query", payload);
    this.armTimeout(requestId);

    return { requestId, sessionId: payload.sessionId };
  }

  startInterviewAudio({ sampleRate, questionNumber, onAcknowledged }) {
    if (!this.store) throw new Error("AI request handler has not been initialized");

    const state = this.store.getState();
    const requestId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const user = state.appContext.user;
    const payload = {
      requestId,
      sessionId: state.aiChat.sessionId,
      user_role: state.appContext.userRole,
      user_mode: "student",
      mode_name: "ai-interviewer",
      source: "interview-voice-stream",
      feature: "mock-interview",
      sampleRate,
      language: "en-IN",
      questionNumber,
      user: user ? {
        id: user._id || user.id || null,
        name: user.name || null,
        email: user.email || null,
        role: state.appContext.userRole,
        branch: user.branch || null,
        skills: Array.isArray(user.skills) ? user.skills : [],
      } : null,
      details: {
        ...state.appContext.details,
        selected_job: state.aiChat.journey.selectedJob,
        resume: state.aiChat.journey.resume,
        input_type: "voice",
        speech_language: "en-IN",
      },
      past_messages: state.aiChat.messages.slice(-8).map((message) => ({
        role: message.sender === "user" ? "user" : "assistant",
        content: message.text || "",
      })),
    };

    this.store.dispatch(requestStarted({
      requestId,
      userMessageId: crypto.randomUUID(),
      assistantMessageId: crypto.randomUUID(),
      text: "🎙️ Listening…",
      createdAt,
      payload,
    }));
    this.store.dispatch(setAgentMode("ai-interviewer"));
    ensureSocketAuthentication();
    socket.emit("interview:audio:start", payload, (result) => onAcknowledged?.(result));
    return { requestId, sessionId: payload.sessionId };
  }

  endInterviewAudio(requestId) {
    if (requestId) socket.emit("interview:audio:end", { requestId });
  }

  cancelInterviewAudio(requestId) {
    if (requestId) socket.emit("interview:audio:cancel", { requestId });
  }

  runFeature(featureId) {
    if (!this.store) throw new Error("AI request handler has not been initialized");

    const feature = getAIFeature(featureId);
    if (!feature) return null;

    const state = this.store.getState();
    const activeRequest = Object.values(state.aiChat.requests).find((request) =>
      request.feature === feature.id &&
      (request.status === "pending" || request.status === "streaming")
    );

    this.store.dispatch(setUserMode(feature.userMode));
    this.store.dispatch(setActiveFeature(feature.uiFeature));
    if (feature.uiTab) this.store.dispatch(setActiveJobsTab(feature.uiTab));
    if (feature.uiTool) this.store.dispatch(setActiveResumeTool(feature.uiTool));
    localStorage.setItem("activeMode", feature.userMode);

    if (activeRequest) return { requestId: activeRequest.requestId, sessionId: state.aiChat.sessionId };

    return this.send({
      text: feature.defaultPrompt,
      modeName: feature.agentMode,
      source: "feature-card",
      feature: feature.id,
    });
  }

  handleResponse(payload) {
    if (!payload?.requestId || !this.store) return;
    const request = this.store.getState().aiChat.requests[payload.requestId];
    if (!request || request.status === "failed") return;

    this.store.dispatch(responseReceived(payload));
    const routedAgentMode = AGENT_MODE_BY_HEADER[payload.header_message];
    if (routedAgentMode) this.store.dispatch(setAgentMode(routedAgentMode));
    if (
      payload.header_message === "mode:jobparser:jobslist" &&
      Array.isArray(payload.data) &&
      payload.data.length > 0
    ) {
      this.store.dispatch(setUserMode("student"));
      this.store.dispatch(setActiveFeature("drives"));
      this.store.dispatch(setActiveJobsTab("matched"));
      localStorage.setItem("activeMode", "student");
    }
    if (payload.header_message === "mode:jobparser:eligibility") {
      this.store.dispatch(setUserMode("student"));
      this.store.dispatch(setActiveFeature("drives"));
      this.store.dispatch(setActiveJobsTab("available"));
      localStorage.setItem("activeMode", "student");
    }
    if (payload.header_message === "resume_generator" || payload.header_message === "resume-generator") {
      this.store.dispatch(setUserMode("resume"));
      const analysisTool = payload.data?.type === "analysis"
        ? payload.data.analysis_type === "gap" ? "skill-gap" : "ats"
        : "generator";
      this.store.dispatch(setActiveResumeTool(analysisTool));
      localStorage.setItem("activeMode", "resume");
    }
    if (payload.header_message?.startsWith("mode:jobCreation:")) {
      this.store.dispatch(setUserMode("tpo"));
      this.store.dispatch(setActiveFeature("job-creator"));
      localStorage.setItem("activeMode", "tpo");
    }
    if (
      payload.header_message === "mode:switch:pr-outreach" ||
      payload.header_message === "mail:review" ||
      payload.header_message === "pr_outreach_satisfied"
    ) {
      this.store.dispatch(setUserMode("pr_outreach"));
      localStorage.setItem("activeMode", "pr_outreach");
    }
    if (
      payload.header_message === "mode:switch:alumni-connect" ||
      payload.header_message === "alumni:matches" ||
      payload.header_message === "alumni:request-review"
      || payload.header_message === "alumni:resume-share-review"
    ) {
      this.store.dispatch(setUserMode("alumni_connect"));
      localStorage.setItem("activeMode", "alumni_connect");
    }
    if (
      payload.header_message === "mode:switch:ai-interviewer" ||
      payload.header_message === "button:options" ||
      payload.header_message === "select:job:db" ||
      payload.header_message === "text:mode:interview" ||
      payload.header_message === "interview:end"
    ) {
      this.store.dispatch(setUserMode("student"));
      this.store.dispatch(setActiveFeature("mock-interview"));
      localStorage.setItem("activeMode", "student");
    }
    if (
      payload.header_message === "mode:switch:gap-analysis" ||
      payload.header_message === "mode:gapAnalysis:analysis" ||
      payload.header_message === "mode:gapAnalysis:suggestions" ||
      payload.header_message === "mode:gapAnalysis:error"
    ) {
      this.store.dispatch(setUserMode("tpo"));
      this.store.dispatch(setActiveFeature("gap-analysis"));
      localStorage.setItem("activeMode", "tpo");
    }
    if (
      payload.header_message === "mode:switch:learning-recommendation" ||
      payload.header_message === "select:interview:db" ||
      payload.header_message === "learning:recommendations" ||
      payload.header_message === "learning:recommendations-error"
    ) {
      this.store.dispatch(setUserMode("student"));
      this.store.dispatch(setActiveFeature("learning-recommendation"));
      localStorage.setItem("activeMode", "student");
    }
    if (payload.isEnd) this.clearTimeout(payload.requestId);
    else this.armTimeout(payload.requestId);
  }

  armTimeout(requestId) {
    this.clearTimeout(requestId);
    const timeout = setTimeout(() => {
      this.timeouts.delete(requestId);
      this.store.dispatch(requestFailed({ requestId, message: FALLBACK_ERROR_TEXT }));
    }, RESPONSE_TIMEOUT_MS);
    this.timeouts.set(requestId, timeout);
  }

  clearTimeout(requestId) {
    const timeout = this.timeouts.get(requestId);
    if (timeout) clearTimeout(timeout);
    this.timeouts.delete(requestId);
  }

  clearAllTimeouts() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }

  startNewChat(name) {
    if (!this.store) return;
    this.clearAllTimeouts();
    this.store.dispatch(setAgentMode(null));
    this.store.dispatch(setActiveJobsTab("matched"));
    this.store.dispatch(newChatStarted(name));
  }

  openConversation(sessionId) {
    if (!this.store) return;
    this.clearAllTimeouts();
    this.store.dispatch(setAgentMode(null));
    this.store.dispatch(conversationOpened(sessionId));
  }
}

export const aiRequestHandler = new AIRequestHandler();

export const sendAIMessage = (payload) => () => aiRequestHandler.send(payload);
export const startInterviewAudio = (payload) => () => aiRequestHandler.startInterviewAudio(payload);
export const endInterviewAudio = (requestId) => () => aiRequestHandler.endInterviewAudio(requestId);
export const cancelInterviewAudio = (requestId) => () => aiRequestHandler.cancelInterviewAudio(requestId);
export const runAIFeature = (featureId) => () => aiRequestHandler.runFeature(featureId);
export const startNewAIChat = (name) => () => aiRequestHandler.startNewChat(name);
export const openAIConversation = (sessionId) => () => aiRequestHandler.openConversation(sessionId);
