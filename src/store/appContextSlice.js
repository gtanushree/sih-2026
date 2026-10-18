import { createSlice } from "@reduxjs/toolkit";

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const storedUser = readStoredUser();
const storedMode = localStorage.getItem("activeMode") || "student";

const appContextSlice = createSlice({
  name: "appContext",
  initialState: {
    user: storedUser,
    userRole: storedUser?.role || "student",
    activeMode: storedMode === "admin" ? "tpo" : storedMode,
    agentMode: null,
    activeFeature: null,
    activeJobsTab: "matched",
    activeResumeTool: null,
    details: {
      name: storedUser?.name || null,
      email: storedUser?.email || null,
      phone: storedUser?.phone || storedUser?.mobileNumber || null,
      college: storedUser?.collegeName || storedUser?.college || null,
      branch: storedUser?.branch || null,
      cgpa: storedUser?.cgpa ?? null,
      skills: storedUser?.skills || [],
      projects: storedUser?.projects || [],
      certifications: storedUser?.certifications || [],
      experience: storedUser?.experience || [],
    },
  },
  reducers: {
    setUserContext(state, action) {
      const user = action.payload || null;
      state.user = user;
      state.userRole = user?.role || "student";
      state.details = {
        ...state.details,
        name: user?.name || null,
        email: user?.email || null,
        phone: user?.phone || user?.mobileNumber || null,
        college: user?.collegeName || user?.college || null,
        branch: user?.branch || null,
        cgpa: user?.cgpa ?? null,
        skills: user?.skills || [],
        projects: user?.projects || [],
        certifications: user?.certifications || [],
        experience: user?.experience || [],
      };
    },
    setUserMode(state, action) {
      state.activeMode = action.payload;
    },
    setAgentMode(state, action) {
      state.agentMode = action.payload || null;
    },
    setActiveFeature(state, action) {
      state.activeFeature = action.payload;
    },
    setActiveJobsTab(state, action) {
      state.activeJobsTab = action.payload === "available" ? "available" : "matched";
    },
    setActiveResumeTool(state, action) {
      state.activeResumeTool = action.payload || null;
    },
    setContextDetails(state, action) {
      state.details = { ...state.details, ...(action.payload || {}) };
    },
    clearAppContext(state) {
      state.user = null;
      state.userRole = "student";
      state.activeMode = "student";
      state.agentMode = null;
      state.activeFeature = null;
      state.activeJobsTab = "matched";
      state.activeResumeTool = null;
      state.details = {};
    },
  },
});

export const { setUserContext, setUserMode, setAgentMode, setActiveFeature, setActiveJobsTab, setActiveResumeTool, setContextDetails, clearAppContext } = appContextSlice.actions;
export const selectAIContext = (state) => state.appContext;
export default appContextSlice.reducer;
