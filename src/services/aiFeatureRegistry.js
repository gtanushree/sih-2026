const AI_FEATURES = {
  drives: {
    id: "drives",
    userMode: "student",
    uiFeature: "drives",
    uiTab: "matched",
    agentMode: "jobs-finder",
    defaultPrompt: "Can you help me find some Jobs",
  },
  "resume-generator": {
    id: "resume-generator",
    userMode: "resume",
    uiFeature: null,
    uiTool: "generator",
    agentMode: "resume-generator",
    defaultPrompt: "Help me build my resume from my profile",
  },
  "mock-interview": {
    id: "mock-interview",
    userMode: "student",
    uiFeature: "mock-interview",
    agentMode: "ai-interviewer",
    defaultPrompt: "Start a mock interview",
  },
  "job-creation": {
    id: "job-creation",
    userMode: "tpo",
    uiFeature: "job-creator",
    agentMode: "job-creation",
    defaultPrompt: "Help me create a new placement job",
  },
  "gap-analysis": {
    id: "gap-analysis",
    userMode: "tpo",
    uiFeature: "gap-analysis",
    agentMode: "gap-analysis",
    defaultPrompt: "Perform a gap analysis between our current curriculum and industry-demanded skills",
  },
};

export const getAIFeature = (featureId) => AI_FEATURES[featureId] || null;

export default AI_FEATURES;
