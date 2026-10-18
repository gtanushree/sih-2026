import axios from "axios";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
export const API_BASE = `${API_ORIGIN}/api/v1`;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Gmail & Password Login/Register (Checks DB -> logs in if exists, registers if new)
  loginOrRegister: async (payload) => {
    const res = await axios.post(`${API_BASE}/auth/login-or-register`, payload);
    return res.data;
  },

  getMe: async () => {
    const res = await axios.get(`${API_BASE}/auth/me`, { headers: getAuthHeader() });
    return res.data;
  },

  updateProfile: async (payload) => {
    const res = await axios.patch(`${API_BASE}/auth/me`, payload, { headers: getAuthHeader() });
    return res.data;
  },

  // GGSIPU Exam Portal Sync (fetches real name/branch/marks via enrollment + password + captcha)
  getGgsipuCaptcha: async () => {
    const res = await axios.get(`${API_BASE}/ggsipu/captcha`, {
      headers: getAuthHeader(),
      responseType: "blob",
      withCredentials: true,
    });
    return URL.createObjectURL(res.data);
  },

  connectGgsipu: async ({ enrollment, password, captcha }) => {
    const res = await axios.post(
      `${API_BASE}/ggsipu/connect`,
      { enrollment, password, captcha },
      { headers: getAuthHeader(), withCredentials: true }
    );
    return res.data;
  },

  // Resume Upload & Scoring
  uploadResume: async (fileOrFormData) => {
    const headers = { ...getAuthHeader(), "Content-Type": "multipart/form-data" };
    const res = await axios.post(`${API_BASE}/resume/upload`, fileOrFormData, { headers });
    return res.data;
  },

  getResumeScore: async () => {
    const res = await axios.get(`${API_BASE}/resume/score`, { headers: getAuthHeader() });
    return res.data;
  },

  // Mock Interviews History
  getMyInterviews: async () => {
    const res = await axios.get(`${API_BASE}/interviews/my`, { headers: getAuthHeader() });
    return res.data;
  },

  getInterviewById: async (interviewId) => {
    const res = await axios.get(`${API_BASE}/interviews/${interviewId}`, { headers: getAuthHeader() });
    return res.data;
  },

  // Placement Drives
  getJobs: async () => {
    const res = await axios.get(`${API_BASE}/jobs`, { headers: getAuthHeader() });
    return res.data;
  },

  getAllDrives: async () => {
    const res = await axios.get(`${API_BASE}/jobs`, { headers: getAuthHeader() });
    return res.data;
  },

  getMatchedDrives: async () => {
    const res = await axios.get(`${API_BASE}/drives/matched`, { headers: getAuthHeader() });
    return res.data;
  },

  createDrive: async (payload) => {
    const res = await axios.post(`${API_BASE}/jobs`, payload, { headers: getAuthHeader() });
    return res.data;
  },

  applyToDrive: async (driveId) => {
    const res = await axios.post(`${API_BASE}/drives/${driveId}/apply`, {}, { headers: getAuthHeader() });
    return res.data;
  },

  // Training Programs
  getTrainingPrograms: async () => {
    const res = await axios.get(`${API_BASE}/training`, { headers: getAuthHeader() });
    return res.data;
  },

  getMyTrainingPrograms: async () => {
    const res = await axios.get(`${API_BASE}/training/my`, { headers: getAuthHeader() });
    return res.data;
  },

  registerForTraining: async (programId) => {
    const res = await axios.post(`${API_BASE}/training/${programId}/register`, {}, { headers: getAuthHeader() });
    return res.data;
  },

  // Offer Lifecycle
  getMyOffers: async () => {
    const res = await axios.get(`${API_BASE}/offers/my`, { headers: getAuthHeader() });
    return res.data;
  },

  acceptOffer: async (offerId) => {
    const res = await axios.post(`${API_BASE}/offers/${offerId}/accept`, {}, { headers: getAuthHeader() });
    return res.data;
  },

  rejectOffer: async (offerId, reason = "") => {
    const res = await axios.post(`${API_BASE}/offers/${offerId}/reject`, { reason }, { headers: getAuthHeader() });
    return res.data;
  },

  withdrawOffer: async (offerId, reason = "") => {
    const res = await axios.post(`${API_BASE}/offers/${offerId}/withdraw`, { reason }, { headers: getAuthHeader() });
    return res.data;
  },

  // TPO Offer Management
  getAllOffers: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/offers`, { headers: getAuthHeader(), params });
    return res.data;
  },

  createOffer: async (payload) => {
    const res = await axios.post(`${API_BASE}/offers`, payload, { headers: getAuthHeader() });
    return res.data;
  },

  markOfferPlaced: async (offerId) => {
    const res = await axios.post(`${API_BASE}/offers/${offerId}/place`, {}, { headers: getAuthHeader() });
    return res.data;
  },

  tpoOverrideOffer: async (offerId, payload) => {
    const res = await axios.post(`${API_BASE}/offers/${offerId}/override`, payload, { headers: getAuthHeader() });
    return res.data;
  },

  // Placement Policy
  getPlacementPolicy: async () => {
    const res = await axios.get(`${API_BASE}/offers/policy`, { headers: getAuthHeader() });
    return res.data;
  },

  savePlacementPolicy: async (payload) => {
    const res = await axios.post(`${API_BASE}/offers/policy`, payload, { headers: getAuthHeader() });
    return res.data;
  },

  sendPROutreachEmail: async (payload) => {
    const res = await axios.post(`${API_BASE}/pr-outreach/send-email`, payload, { headers: getAuthHeader() });
    return res.data;
  },

  getGmailAuthorizeUrl: async () => {
    const res = await axios.get(`${API_BASE}/auth/google/gmail/authorize-url`, { headers: getAuthHeader() });
    return res.data;
  },

  disconnectGmail: async () => {
    const res = await axios.post(`${API_BASE}/auth/google/gmail/disconnect`, {}, { headers: getAuthHeader() });
    return res.data;
  },

  // Alumni mentorship
  getAlumniColleges: async () => {
    const res = await axios.get(`${API_BASE}/alumni/colleges`, { headers: getAuthHeader() });
    return res.data;
  },
  getAlumniProfile: async () => {
    const res = await axios.get(`${API_BASE}/alumni/profile`, { headers: getAuthHeader() });
    return res.data;
  },
  saveAlumniProfile: async (payload) => {
    const res = await axios.put(`${API_BASE}/alumni/profile`, payload, { headers: getAuthHeader() });
    return res.data;
  },
  discoverAlumni: async () => {
    const res = await axios.get(`${API_BASE}/alumni/discover`, { headers: getAuthHeader() });
    return res.data;
  },
  getAlumniConnections: async () => {
    const res = await axios.get(`${API_BASE}/alumni/connections`, { headers: getAuthHeader() });
    return res.data;
  },
  createAlumniConnection: async (payload) => {
    const res = await axios.post(`${API_BASE}/alumni/connections`, payload, { headers: getAuthHeader() });
    return res.data;
  },
  updateAlumniConnection: async (id, status) => {
    const res = await axios.patch(`${API_BASE}/alumni/connections/${id}`, { status }, { headers: getAuthHeader() });
    return res.data;
  },
  getMentorshipMessages: async (id) => {
    const res = await axios.get(`${API_BASE}/alumni/connections/${id}/messages`, { headers: getAuthHeader() });
    return res.data;
  },
  sendMentorshipMessage: async (id, text) => {
    const res = await axios.post(`${API_BASE}/alumni/connections/${id}/messages`, { text }, { headers: getAuthHeader() });
    return res.data;
  },
  shareResumeWithAlumni: async (id, payload) => {
    const res = await axios.post(`${API_BASE}/alumni/connections/${id}/share-resume`, payload, { headers: getAuthHeader() });
    return res.data;
  },
  getResumeBank: async () => {
    const res = await axios.get(`${API_BASE}/resume-bank`, { headers: getAuthHeader() });
    return res.data;
  },
  saveGeneratedResume: async (payload) => {
    const res = await axios.post(`${API_BASE}/resume-bank/generated`, payload, { headers: getAuthHeader() });
    return res.data;
  },
  getResumeAccess: async (id) => {
    const res = await axios.get(`${API_BASE}/resume-bank/${id}/access`, { headers: getAuthHeader() });
    return res.data;
  },
};
