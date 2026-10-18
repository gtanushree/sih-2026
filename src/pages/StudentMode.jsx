import { lazy, Suspense, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  RefreshCw,
  Sliders,
  Sparkles,
  User,
  BookOpen,
  Package,
  Users,
  Mic2,
  GraduationCap,
} from "lucide-react";

const DriveGrid = lazy(() => import("../components/DriveGrid"));
const PlacementCalendar = lazy(() => import("../components/PlacementCalendar"));
const TrainingHub = lazy(() => import("../components/TrainingHub"));
const StudentOffers = lazy(() => import("../components/StudentOffers"));
const InterviewWorkspace = lazy(() => import("../components/InterviewWorkspace"));
const LearningRecommendationWorkspace = lazy(() => import("../components/LearningRecommendationWorkspace"));

const LazyFallback = () => (
  <div className="card-stark my-auto flex flex-col items-center justify-center gap-3 border-1.5 border-black bg-white p-10 text-center">
    <Sparkles className="h-8 w-8 animate-spin text-black" />
    <div className="text-xs font-black uppercase tracking-wider text-black">
      LAZY LOADING STUDENT MODULE...
    </div>
  </div>
);

function FeatureCard({ icon: Icon, title, description, badge, badgeClass, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card-stark group flex min-h-48 cursor-pointer flex-col items-center justify-between bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-gray-50"
    >
      <div className="mb-2 bg-black p-3.5 text-white">
        <Icon className="h-8 w-8" />
      </div>
      <div className="my-auto space-y-1">
        <h3 className="text-sm font-black uppercase tracking-tight group-hover:underline">{title}</h3>
        <p className="line-clamp-2 text-[11px] font-medium text-gray-600">{description}</p>
      </div>
      <div className="mt-auto flex w-full items-center justify-between border-t-1.5 border-black pt-2">
        <span className={`badge-stark text-[10px] ${badgeClass}`}>{badge}</span>
        <div className="btn-primary px-2 py-1 text-[10px]">
          <span>OPEN</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

export default function StudentMode({
  user,
  activeFeature,
  activeJobsTab,
  onFeatureChange,
  onJobsTabChange,
  aiMatchedJobs,
  databaseJobs,
  loading,
  onRefresh,
  onOpenProfile,
  onOpenAlumni,
  onOpenInterview,
}) {
  const applications = databaseJobs.filter((job) => job.applicationStatus);
  const featureNames = {
    drives: "JOBS FOR ME",
    portfolio: "MY PORTFOLIO",
    applications: "APPLICATION TRACKING",
    calendar: "PLACEMENT CALENDAR",
    training: "TRAINING PROGRAMS",
    offers: "MY OFFERS",
    "mock-interview": "AI MOCK INTERVIEW",
    "learning-recommendation": "AI LEARNING ROADMAP",
  };

  const [portfolioTab, setPortfolioTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div className="card-stark flex flex-col items-start justify-between gap-4 bg-white sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight">
            WELCOME BACK, {user?.name || "Alex Rivera"}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-gray-600">
            Branch: <span className="font-bold text-black">{user?.branch || "Computer Science"}</span> | CGPA:{" "}
            <span className="font-bold text-black">{user?.cgpa || 0.0}</span> | Email:{" "}
            <span className="font-mono font-bold text-black">{user?.email || "alex.cs2026@ipu.ac.in"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="btn-secondary cursor-pointer px-3 py-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>REFRESH DATA</span>
          </button>
          <button onClick={onOpenProfile} className="btn-primary cursor-pointer px-3 py-1.5 text-xs">
            EDIT PROFILE & SKILLS
          </button>
        </div>
      </div>

      {activeFeature === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            icon={Building}
            title="JOBS FOR ME"
            description="Placement drives & skill match % fit."
            badge={`${aiMatchedJobs.length} AI MATCHES`}
            badgeClass="bg-green-200"
            onClick={() => {
              onJobsTabChange("available");
              onFeatureChange("drives");
            }}
          />
          <FeatureCard
            icon={User}
            title="MY PORTFOLIO"
            description="Manage your Profile, Skills, Projects & Experience in one place."
            badge="YOUR RESUME"
            badgeClass="bg-purple-200"
            onClick={() => {
              setPortfolioTab("profile");
              onFeatureChange("portfolio");
            }}
          />
          <FeatureCard
            icon={Users}
            title="ALUMNI CONNECT"
            description="Find mentors matched to your job, resume, and guidance goal."
            badge="3 BEST MATCHES"
            badgeClass="bg-purple-100"
            onClick={onOpenAlumni}
          />
          <FeatureCard
            icon={Mic2}
            title="MOCK INTERVIEW"
            description="Practise a job-specific or profile-based interview with AI feedback."
            badge="AI INTERVIEWER"
            badgeClass="bg-yellow-200"
            onClick={onOpenInterview}
          />
          <FeatureCard
            icon={GraduationCap}
            title="LEARNING ROADMAP"
            description="Study guides, revision cheat-sheets & practice plans from your mock interviews."
            badge="AI RECOMMENDER"
            badgeClass="bg-purple-200"
            onClick={() => onFeatureChange("learning-recommendation")}
          />
          <FeatureCard
            icon={ClipboardList}
            title="APPLICATION TRACKING"
            description="Follow submitted applications and hiring progress."
            badge={`${applications.length} ACTIVE`}
            badgeClass="bg-green-100"
            onClick={() => onFeatureChange("applications")}
          />
          <FeatureCard
            icon={CalendarDays}
            title="PLACEMENT CALENDAR"
            description="See company campus drives and application deadlines by date."
            badge={`${databaseJobs.filter((job) => job.driveDate || job.deadline).length} DATED DRIVES`}
            badgeClass="bg-yellow-100"
            onClick={() => onFeatureChange("calendar")}
          />
          <FeatureCard
            icon={BookOpen}
            title="TRAINING PROGRAMS"
            description="Aptitude, soft skills, and tech certifications."
            badge="UPCOMING SESSIONS"
            badgeClass="bg-blue-100"
            onClick={() => onFeatureChange("training")}
          />
          <FeatureCard
            icon={Package}
            title="MY OFFERS"
            description="View, accept, or reject placement offers. Dream offer upgrades."
            badge="OFFER INBOX"
            badgeClass="bg-green-100"
            onClick={() => onFeatureChange("offers")}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-1.5 border-black bg-white p-2.5 shadow-bold-sm">
            <button
              onClick={() => onFeatureChange(null)}
              className="btn-secondary flex cursor-pointer items-center gap-1.5 px-3 py-1 text-xs font-black"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>BACK TO SQUARE CARDS MENU</span>
            </button>
            <span className="badge-stark bg-black text-xs font-extrabold uppercase text-white">
              {featureNames[activeFeature] || "STUDENT TOOL"}
            </span>
          </div>

          <Suspense fallback={<LazyFallback />}>
            {activeFeature === "drives" && (
              <DriveGrid
                aiMatchedJobs={aiMatchedJobs}
                databaseJobs={databaseJobs}
                activeTab={activeJobsTab}
                onTabChange={onJobsTabChange}
                onApplicationSubmitted={onRefresh}
              />
            )}

            {activeFeature === "portfolio" && (
              <div className="card-stark space-y-4 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-3 gap-3">
                  <div className="flex w-full sm:w-auto items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {["profile", "projects", "experience"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setPortfolioTab(tab)}
                        className={`px-3 py-1.5 text-xs font-black uppercase transition-colors whitespace-nowrap ${portfolioTab === tab ? "bg-black text-white" : "bg-gray-100 text-black hover:bg-gray-200"}`}
                      >
                        {tab === "profile" ? "Skills & Profile" : tab}
                      </button>
                    ))}
                  </div>
                  <button onClick={onOpenProfile} className="btn-primary cursor-pointer px-3 py-1.5 text-xs shrink-0">
                    <Sliders className="h-3.5 w-3.5 inline-block mr-1" />
                    <span>EDIT PORTFOLIO</span>
                  </button>
                </div>

                {portfolioTab === "profile" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                      {[
                        ["FULL NAME", user?.name],
                        ["COLLEGE", user?.collegeName],
                        ["PASSING YEAR", user?.passingYear],
                        ["BRANCH", user?.branch],
                        ["CUMULATIVE CGPA", user?.cgpa],
                      ].map(([label, value]) => (
                        <div key={label} className="border-1.5 border-black bg-gray-50 p-3">
                          <div className="text-[10px] font-extrabold uppercase text-gray-500">{label}</div>
                          <div className="text-sm font-black">{value || "Not Set"}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-extrabold uppercase flex items-center gap-1"><User className="h-4 w-4" /> RECORDED TECHNICAL SKILLS</div>
                      <div className="flex flex-wrap gap-1.5">
                        {user?.skills?.length ? (
                          user.skills.map((skill) => (
                            <span key={skill} className="badge-stark bg-gray-100 px-2 py-1 text-xs">{skill}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No skills added yet.</span>
                        )}
                      </div>
                    </div>

                    <section className="mt-6 border-t-1.5 border-black pt-4">
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase"><Award className="h-4 w-4" /> Certifications</h4>
                      {user?.certifications?.length ? (
                        <div className="space-y-2">
                          {user.certifications.map((certificate, index) => (
                            <div key={certificate._id || index} className="flex items-center justify-between border border-black p-2.5 text-xs bg-gray-50">
                              <span className="font-bold">{certificate.name || certificate.title}</span>
                              <span className="text-[10px] text-gray-500">{certificate.issuer || "Issuer not added"}</span>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState text="No certifications added yet." />}
                    </section>
                  </div>
                )}

                {portfolioTab === "projects" && (
                  <div className="space-y-5 animate-in fade-in">
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase"><FolderKanban className="h-4 w-4" /> Projects</h4>
                      {user?.projects?.length ? (
                        <div className="flex flex-col gap-3">
                          {user.projects.map((project, index) => (
                            <div key={project._id || index} className="border-2 border-black bg-gray-50 p-4">
                              <div className="text-sm font-black uppercase">{project.title || project.name}</div>
                              <p className="mt-2 text-[12px] font-medium text-gray-600 whitespace-pre-wrap">{project.description || "No description added."}</p>
                              <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-gray-300">
                                {(project.skills || []).map((skill) => <span key={skill} className="badge-stark bg-white text-[10px]">{skill}</span>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <EmptyState text="No projects added yet." />}
                    </section>
                  </div>
                )}

                {portfolioTab === "experience" && (
                  <div className="space-y-4 animate-in fade-in">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase"><BriefcaseBusiness className="h-4 w-4" /> Work History</h4>
                    {user?.experience?.length ? user.experience.map((item, index) => (
                      <div key={item._id || index} className="border-l-4 border-black bg-gray-50 p-3">
                        <div className="flex flex-col justify-between gap-1 sm:flex-row">
                          <div><h4 className="text-xs font-black uppercase">{item.title || "Role"}</h4><div className="text-[11px] font-bold text-gray-600">{item.company || "Company"}</div></div>
                          <span className="text-[10px] font-bold text-gray-500">{item.duration || "Duration not added"}</span>
                        </div>
                        {item.description && <p className="mt-2 text-[12px] font-medium text-gray-700 whitespace-pre-wrap">{item.description}</p>}
                      </div>
                    )) : <EmptyState icon={BriefcaseBusiness} title="No experience added yet" text="Internships, employment and volunteer work will appear here." />}
                  </div>
                )}
              </div>
            )}

            {activeFeature === "applications" && (
              <div className="card-stark space-y-4 bg-white">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /><h3 className="text-sm font-black uppercase">APPLICATION TRACKING</h3></div>
                  <span className="badge-stark bg-green-100 text-[10px]">LIVE STATUS</span>
                </div>
                {applications.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead><tr className="bg-black text-white"><th className="p-2">COMPANY</th><th className="p-2">ROLE</th><th className="p-2">STATUS</th></tr></thead>
                      <tbody>{applications.map((drive) => <tr key={drive._id} className="border-b border-black"><td className="p-2 font-bold">{drive.companyName}</td><td className="p-2">{drive.roleTitle}</td><td className="p-2"><span className="badge-stark bg-green-200 text-[9px]">{String(drive.applicationStatus).toUpperCase()}</span></td></tr>)}</tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-8 text-center">
                    <ClipboardList className="mx-auto mb-2 h-7 w-7 text-gray-400" />
                    <div className="text-xs font-black uppercase">No applications yet</div>
                    <p className="mt-1 text-[11px] text-gray-500">Apply to a placement drive and its progress will appear here.</p>
                    <button type="button" onClick={() => onFeatureChange("drives")} className="btn-primary mt-3 px-3 py-1.5 text-xs">EXPLORE JOBS</button>
                  </div>
                )}
              </div>
            )}

            {activeFeature === "calendar" && (
              <PlacementCalendar drives={databaseJobs} />
            )}
            {activeFeature === "training" && (
              <TrainingHub />
            )}
            {activeFeature === "offers" && (
              <StudentOffers />
            )}
            {activeFeature === "mock-interview" && (
              <InterviewWorkspace />
            )}
            {activeFeature === "learning-recommendation" && (
              <LearningRecommendationWorkspace />
            )}
          </Suspense>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-5 text-center">
      {Icon && <Icon className="mx-auto mb-2 h-7 w-7 text-gray-400" />}
      {title && <div className="text-xs font-black uppercase">{title}</div>}
      <p className="text-[11px] font-semibold text-gray-500">{text}</p>
    </div>
  );
}
