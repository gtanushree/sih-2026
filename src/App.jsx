import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles } from "lucide-react";
import AccessDeniedView from "./components/AccessDeniedView";
import AuthScreen from "./components/AuthScreen";
import Chat from "./components/Chat";
import HeaderBar from "./components/HeaderBar";
import ProfileModal from "./components/ProfileModal";
import SidebarDrawer from "./components/SidebarDrawer";
import WelcomeModeSelect from "./components/WelcomeModeSelect";
import { api } from "./lib/api";
import { openAIConversation, runAIFeature } from "./services/aiRequestHandler";
import {
  clearAppContext,
  setActiveFeature,
  setActiveJobsTab,
  setActiveResumeTool,
  setAgentMode,
  setUserContext,
  setUserMode,
} from "./store/appContextSlice";
import {
  conversationHydrated,
  ensureWelcomeMessage,
  readConversationForUser,
  resetAIChat,
  selectChatSessions,
  selectInterviewWorkspace,
  selectLatestJobs,
} from "./store/aiChatSlice";

const AdminMode = lazy(() => import("./pages/AdminMode"));
const CompanyMode = lazy(() => import("./pages/CompanyMode"));
const ResumeStudio = lazy(() => import("./pages/ResumeStudio"));
const PROutreach = lazy(() => import("./pages/PROutreach"));
const StudentMode = lazy(() => import("./pages/StudentMode"));
const AlumniConnect = lazy(() => import("./pages/AlumniConnect"));

const LazyFallback = () => (
  <div className="card-stark my-auto flex flex-col items-center justify-center gap-3 border-1.5 border-black bg-white p-10 text-center">
    <Sparkles className="h-8 w-8 animate-spin text-black" />
    <div className="text-xs font-black uppercase tracking-wider text-black">LAZY LOADING MODE MODULE...</div>
  </div>
);

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.appContext.user);
  const activeMode = useSelector((state) => state.appContext.activeMode);
  const activeFeature = useSelector((state) => state.appContext.activeFeature);
  const activeJobsTab = useSelector((state) => state.appContext.activeJobsTab);
  const activeResumeTool = useSelector((state) => state.appContext.activeResumeTool);
  const chatSessions = useSelector(selectChatSessions);
  const latestJobs = useSelector(selectLatestJobs);
  const interviewWorkspace = useSelector(selectInterviewWorkspace);

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("isAuthenticated") === "true",
  );
  const [isModeChosen, setIsModeChosen] = useState(
    () => localStorage.getItem("isModeChosen") === "true",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [resumeScoreData, setResumeScoreData] = useState(null);
  const [databaseJobs, setDatabaseJobs] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const setActiveTab = (feature) => dispatch(setActiveFeature(feature));

  const handleAuthSuccess = (authenticatedUser) => {
    const isTpo = authenticatedUser?.role === "tpo" || authenticatedUser?.role === "admin";
    const initialMode = authenticatedUser?.role === "alumni" ? "alumni" : isTpo ? "tpo" : "student";
    dispatch(conversationHydrated(readConversationForUser(authenticatedUser)));
    dispatch(setUserContext(authenticatedUser));
    dispatch(setUserMode(initialMode));
    dispatch(ensureWelcomeMessage(authenticatedUser?.name || "Student"));
    setIsAuthenticated(true);
    setIsModeChosen(isTpo || initialMode === "alumni");
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("isModeChosen", String(isTpo || initialMode === "alumni"));
    localStorage.setItem("activeMode", initialMode);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
  };

  const handleModeSelect = (mode) => {
    dispatch(setUserMode(mode));
    dispatch(setAgentMode(mode === "pr_outreach" ? "pr_outreach" : mode === "alumni_connect" ? "alumni-connect" : null));
    setActiveTab(null);
    setIsModeChosen(true);
    localStorage.setItem("activeMode", mode);
    localStorage.setItem("isModeChosen", "true");
  };

  const handleModeSwitch = (mode) => {
    dispatch(setUserMode(mode));
    dispatch(setAgentMode(mode === "pr_outreach" ? "pr_outreach" : mode === "alumni_connect" ? "alumni-connect" : null));
    setActiveTab(null);
    localStorage.setItem("activeMode", mode);
  };

  const handleOpenInterview = () => {
    dispatch(setUserMode("student"));
    dispatch(setActiveFeature("mock-interview"));
    dispatch(setAgentMode("ai-interviewer"));
    localStorage.setItem("activeMode", "student");
    if (interviewWorkspace.status === "idle" || interviewWorkspace.status === "error") {
      dispatch(runAIFeature("mock-interview"));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("isModeChosen");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setIsModeChosen(false);
    dispatch(clearAppContext());
    dispatch(resetAIChat());
    setResumeScoreData(null);
    setDatabaseJobs([]);
  };

  const fetchStudentDashboardData = async () => {
    setLoadingDrives(true);
    try {
      const [scoreResult, jobsResult] = await Promise.allSettled([
        api.getResumeScore(),
        api.getJobs(),
      ]);

      if (scoreResult.status === "fulfilled") setResumeScoreData(scoreResult.value);
      if (jobsResult.status === "fulfilled") {
        const jobs = jobsResult.value.data || jobsResult.value.jobs || [];
        setDatabaseJobs(jobs.map((job) => ({
          _id: job._id,
          companyName: job.company?.name || job.companyName || "Unknown Company",
          companyLogo: job.companyLogo || null,
          roleTitle: job.title || "Available Role",
          jdText: job.description || "No job description provided.",
          packageLpa: job.packageLpa || job.salary || "Not specified",
          location: job.location || "Not specified",
          skillsRequired: job.skillsRequired || job.skills || [],
          applicationUrl: job.applicationUrl || null,
          isEligible: true,
          deadline: job.deadline || job.applicationDeadline || null,
          driveDate: job.driveDate || null,
        })));
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoadingDrives(false);
    }
  };

  useEffect(() => {
    // Initial remote dashboard hydration intentionally updates local loading/data state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAuthenticated) fetchStudentDashboardData();
  }, [isAuthenticated]);

  const aiMatchedJobs = latestJobs.map((job, index) => ({
    _id: `live-job-${index}`,
    companyName: job["company name"] || job.company_name || job.companyName || "Unknown Company",
    roleTitle: job.title || job.job_type || job.job_domain || "Role",
    packageLpa: job.salary || "N/A",
    isEligible: job.isEligible ?? true,
    eligibilityReason: job.isEligible === false ? "Not Eligible based on profile" : "",
    jdText: job.description || job.requirements || `Experience: ${job.experience || "Not specified"} | Domain: ${job.job_domain || "Not specified"}`,
    requirements: job.requirements || "",
    skillsRequired: Array.isArray(job.skills) && job.skills.length > 0 ? job.skills : job.job_domain ? [job.job_domain] : [],
    location: job.location || "Not specified",
    applicationUrl: job.application_url || job.applicationUrl || null,
    matchPercentage: 100,
  }));

  if (!isAuthenticated) return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

  const userRole = user?.role || "student";
  const allowedModes = {
    student: ["student", "resume", "pr_outreach", "alumni_connect"],
    tpo: ["tpo", "pr_outreach"],
    admin: ["tpo", "pr_outreach"],
    company: ["company"],
    alumni: ["alumni"],
  };
  const isUnauthorizedMode = !(allowedModes[userRole] || ["student"]).includes(activeMode);

  const renderActiveMode = () => {
    if (!isModeChosen) return <WelcomeModeSelect user={user} onModeSelected={handleModeSelect} />;

    if (isUnauthorizedMode) {
      return (
        <AccessDeniedView
          user={user}
          attemptedMode={activeMode}
          onReturnToApprovedMode={() => handleModeSwitch((allowedModes[userRole] || ["student"])[0])}
        />
      );
    }

    if (activeMode === "company") {
      return <CompanyMode user={user} />;
    }
    if (activeMode === "tpo") return <AdminMode />;
    if (activeMode === "resume") {
      return (
        <ResumeStudio
          user={user}
          scoreData={resumeScoreData}
          onResumeUploaded={fetchStudentDashboardData}
          onRunGenerator={() => dispatch(runAIFeature("resume-generator"))}
          activeTool={activeResumeTool}
          onToolChange={(tool) => dispatch(setActiveResumeTool(tool))}
        />
      );
    }
    if (activeMode === "pr_outreach") return <PROutreach />;
    if (activeMode === "alumni_connect" || activeMode === "alumni") {
      return <AlumniConnect user={user} alumniMode={activeMode === "alumni"} />;
    }

    return (
      <StudentMode
        user={user}
        activeFeature={activeFeature}
        activeJobsTab={activeJobsTab}
        onFeatureChange={setActiveTab}
        onJobsTabChange={(tab) => {
          if (tab === "matched" && aiMatchedJobs.length === 0) {
            dispatch(runAIFeature("drives"));
            return;
          }
          dispatch(setActiveJobsTab(tab));
        }}
        aiMatchedJobs={aiMatchedJobs}
        databaseJobs={databaseJobs}
        loading={loadingDrives}
        onRefresh={fetchStudentDashboardData}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAlumni={() => handleModeSwitch("alumni_connect")}
        onOpenInterview={handleOpenInterview}
      />
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8fafc] font-sans text-black">
      <HeaderBar
        activeMode={activeMode}
        setActiveMode={handleModeSwitch}
        user={user}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      <main className="mx-auto h-[calc(100vh-65px)] w-full max-w-7xl flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full grid-cols-1 items-stretch gap-6 overflow-hidden lg:grid-cols-12">
          <div className="flex h-full flex-col overflow-hidden lg:col-span-4"><Chat /></div>
          <div className={`h-full pr-1 lg:col-span-8 ${activeMode === "resume" && activeResumeTool === "generator" ? "overflow-hidden" : "space-y-6 overflow-y-auto"}`}>
            <Suspense fallback={<LazyFallback />}>{renderActiveMode()}</Suspense>
          </div>
        </div>
      </main>

      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
        chatSessions={chatSessions}
        onSelectChat={(sessionId) => dispatch(openAIConversation(sessionId))}
      />

      {showProfileModal && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(updatedUser) => {
            dispatch(setUserContext(updatedUser));
            localStorage.setItem("user", JSON.stringify(updatedUser));
            fetchStudentDashboardData();
          }}
        />
      )}
    </div>
  );
}
