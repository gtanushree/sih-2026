import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  FileText,
  MessageSquare,
  RefreshCw,
  Send,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { sendAIMessage } from "../services/aiRequestHandler";
import {
  alumniDraftUpdated,
  alumniSelectionStarted,
  alumniSendFailed,
  alumniSendStarted,
  alumniSendSucceeded,
  alumniResumeShareDraftUpdated,
  alumniResumeShareFailed,
  alumniResumeShareDismissed,
  alumniResumeShareStarted,
  alumniResumeShareSucceeded,
  selectAlumniWorkspace,
} from "../store/aiChatSlice";

const REQUEST_TYPES = [
  ["career-guidance", "Career guidance"],
  ["resume-review", "Resume review"],
  ["project-review", "Project review"],
  ["mock-interview", "Mock interview"],
  ["company-insights", "Company insights"],
  ["higher-education", "Higher education"],
];

const responseData = (result, fallback) => result?.data ?? fallback;
const errorText = (error) =>
  error?.response?.data?.message || error.message || "Something went wrong";

function ResumeShareModal({ workspace, onMessageChange, onReview, onShare, onDismiss }) {
  const draft = workspace.resumeShareDraft;
  if (!draft) return null;

  const isSharing = workspace.resumeShareStatus === "sharing";
  const dismiss = () => {
    if (!isSharing) onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-share-title"
        className="card-stark relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-5 shadow-[8px_8px_0_#000]"
      >
        <button
          type="button"
          aria-label="Close resume sharing"
          disabled={isSharing}
          onClick={dismiss}
          className="btn-secondary absolute right-3 top-3 p-1 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-start gap-3 border-b-2 border-black pb-4 pr-9">
          <div className="border-2 border-black bg-purple-100 p-2">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span
              className={`badge-stark ${workspace.resumeShareReviewed ? "bg-green-200" : "bg-yellow-200"}`}
            >
              {workspace.resumeShareReviewed
                ? "AGENT REVIEWED"
                : "CHANGED · REVIEW AGAIN"}
            </span>
            <h2 id="resume-share-title" className="mt-2 text-lg font-black uppercase">
              Share resume with {draft.alumni_name}
            </h2>
            <p className="text-xs font-bold text-gray-600">
              Review the exact resume version and message before sharing.
            </p>
          </div>
        </div>

        <div className="mb-4 border-2 border-black bg-gray-50 p-3">
          <div className="text-[10px] font-black uppercase text-gray-500">
            Protected Resume Bank file
          </div>
          <div className="mt-1 font-black uppercase">{draft.resume_title}</div>
          <div className="text-xs font-bold">Version {draft.resume_version}</div>
        </div>

        <label className="block text-xs font-black uppercase">
          Message to {draft.alumni_name}
          <textarea
            value={draft.message}
            disabled={isSharing}
            onChange={(event) => onMessageChange(event.target.value)}
            className="input-stark mt-1 min-h-28 w-full text-xs disabled:opacity-60"
          />
        </label>

        <p className="mt-3 text-[11px] font-bold text-gray-600">
          Only this selected version will be shared with this accepted mentor.
        </p>
        {workspace.resumeShareError && (
          <p className="mt-3 border-2 border-red-700 bg-red-100 p-2 text-xs font-bold text-red-800">
            {workspace.resumeShareError}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t-2 border-black pt-4">
          <button
            type="button"
            disabled={isSharing}
            onClick={dismiss}
            className="btn-secondary px-4 py-2 text-xs disabled:opacity-40"
          >
            CANCEL
          </button>
          {!workspace.resumeShareReviewed && (
            <button
              type="button"
              disabled={isSharing}
              onClick={onReview}
              className="btn-secondary px-4 py-2 text-xs disabled:opacity-40"
            >
              REVIEW CHANGES
            </button>
          )}
          <button
            type="button"
            disabled={!workspace.resumeShareReviewed || isSharing}
            onClick={onShare}
            className="btn-primary px-4 py-2 text-xs disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> {isSharing ? "SHARING..." : "CONFIRM & SHARE"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Conversation({ connection }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!connection?._id || !["accepted", "closed"].includes(connection.status))
      return;
    try {
      setMessages(
        responseData(await api.getMentorshipMessages(connection._id), []),
      );
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  };

  // Polling synchronizes this local conversation with messages sent by the other account.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection?._id, connection?.status]);

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      await api.sendMentorshipMessage(connection._id, text.trim());
      setText("");
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  };

  const openResume = async (resumeId) => {
    try {
      const result = await api.getResumeAccess(resumeId);
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="border-2 border-black bg-gray-50 p-3">
      <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500">
            No messages yet. Start with a focused question.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message._id}
            className="border border-black bg-white p-2 text-xs"
          >
            <div className="mb-1 font-black uppercase">
              {message.sender?.name || "Member"}
            </div>
            <div className="whitespace-pre-wrap">{message.text}</div>
            {message.type === "resume-share" && message.resumeVersion && (
              <div className="mt-2 flex items-center justify-between gap-3 border-2 border-black bg-green-50 p-2">
                <div>
                  <div className="font-black uppercase">
                    {message.resumeSnapshot?.title ||
                      message.resumeVersion.title}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500">
                    RESUME VERSION{" "}
                    {message.resumeSnapshot?.version ||
                      message.resumeVersion.version}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openResume(message.resumeVersion._id)}
                  className="btn-primary px-3 py-1 text-[10px]"
                >
                  VIEW PDF
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mb-2 text-xs font-bold text-red-700">{error}</p>}
      {connection.status === "accepted" && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a mentorship message..."
            className="input-stark min-w-0 flex-1 text-xs"
          />
          <button className="btn-primary px-3 text-xs">
            <Send className="h-3.5 w-3.5" /> SEND
          </button>
        </form>
      )}
    </div>
  );
}

function AlumniOnboarding({ user, onSaved }) {
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    college: "",
    name: user?.name || "",
    branch: "",
    degree: "B.Tech",
    graduationYear: "",
    company: "",
    currentRole: "",
    location: "",
    bio: "",
    skills: "",
    mentoringTopics: "",
    languages: "English",
    requestTypes: ["career-guidance", "resume-review"],
    availability: "",
    capacity: 3,
    acceptingRequests: true,
  });

  useEffect(() => {
    api
      .getAlumniColleges()
      .then((result) => setColleges(responseData(result, [])))
      .catch((e) => setError(errorText(e)));
  }, []);

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const toggleType = (type) =>
    update(
      "requestTypes",
      form.requestTypes.includes(type)
        ? form.requestTypes.filter((item) => item !== type)
        : [...form.requestTypes, type],
    );
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const list = (value) =>
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      const result = await api.saveAlumniProfile({
        ...form,
        graduationYear: Number(form.graduationYear),
        capacity: Number(form.capacity),
        skills: list(form.skills),
        mentoringTopics: list(form.mentoringTopics),
        languages: list(form.languages),
      });
      onSaved(responseData(result, null));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-stark space-y-5 bg-white p-5">
      <div className="border-b-2 border-black pb-3">
        <span className="badge-stark bg-yellow-200">
          STEP {step} OF 4 · UNVERIFIED V1
        </span>
        <h2 className="mt-2 text-xl font-black uppercase">
          Alumni mentor onboarding
        </h2>
        <p className="text-xs text-gray-600">
          Build the profile students will use to understand your experience.
        </p>
      </div>
      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black uppercase">
            College
            <select
              value={form.college}
              onChange={(e) => update("college", e.target.value)}
              className="input-stark mt-1 w-full"
            >
              <option value="">Choose college</option>
              {colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black uppercase">
            Full name
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="text-xs font-black uppercase">
            Branch
            <input
              value={form.branch}
              onChange={(e) => update("branch", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="text-xs font-black uppercase">
            Graduation year
            <input
              type="number"
              value={form.graduationYear}
              onChange={(e) => update("graduationYear", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black uppercase">
            Company
            <input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="text-xs font-black uppercase">
            Current role
            <input
              value={form.currentRole}
              onChange={(e) => update("currentRole", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="text-xs font-black uppercase">
            Location
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="text-xs font-black uppercase">
            Skills (comma separated)
            <input
              value={form.skills}
              onChange={(e) => update("skills", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase">
            Short bio
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              className="input-stark mt-1 min-h-24 w-full"
            />
          </label>
          <label className="block text-xs font-black uppercase">
            Mentoring topics (comma separated)
            <input
              value={form.mentoringTopics}
              onChange={(e) => update("mentoringTopics", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {REQUEST_TYPES.map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => toggleType(value)}
                className={`border-2 border-black px-2 py-1 text-[10px] font-black uppercase ${form.requestTypes.includes(value) ? "bg-black text-white" : "bg-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black uppercase">
            Availability
            <input
              value={form.availability}
              onChange={(e) => update("availability", e.target.value)}
              placeholder="Saturday, 11 AM–1 PM"
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="text-xs font-black uppercase">
            Concurrent mentees
            <input
              type="number"
              min="1"
              max="20"
              value={form.capacity}
              onChange={(e) => update("capacity", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="text-xs font-black uppercase">
            Languages
            <input
              value={form.languages}
              onChange={(e) => update("languages", e.target.value)}
              className="input-stark mt-1 w-full"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-black uppercase">
            <input
              type="checkbox"
              checked={form.acceptingRequests}
              onChange={(e) => update("acceptingRequests", e.target.checked)}
            />{" "}
            Accepting requests
          </label>
        </div>
      )}
      {error && (
        <p className="border-2 border-red-700 bg-red-100 p-2 text-xs font-bold text-red-800">
          {error}
        </p>
      )}
      <div className="flex justify-between border-t-2 border-black pt-3">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((value) => value - 1)}
          className="btn-secondary px-4 py-2 text-xs disabled:opacity-40"
        >
          BACK
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((value) => value + 1)}
            className="btn-primary px-4 py-2 text-xs"
          >
            CONTINUE
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="btn-primary px-4 py-2 text-xs"
          >
            {saving ? "SAVING..." : "FINISH ONBOARDING"}
          </button>
        )}
      </div>
    </div>
  );
}

function AlumniDashboard({ user }) {
  const [profile, setProfile] = useState(undefined);
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [profileResult, connectionResult] = await Promise.all([
        api.getAlumniProfile(),
        api.getAlumniConnections(),
      ]);
      setProfile(responseData(profileResult, null));
      setConnections(responseData(connectionResult, []));
    } catch (e) {
      setError(errorText(e));
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);
  const update = async (connection, status) => {
    try {
      await api.updateAlumniConnection(connection._id, status);
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  };
  if (profile === undefined)
    return (
      <div className="card-stark bg-white p-10 text-center text-xs font-black">
        LOADING ALUMNI WORKSPACE...
      </div>
    );
  if (!profile) return <AlumniOnboarding user={user} onSaved={setProfile} />;
  return (
    <div className="space-y-4">
      <div className="card-stark bg-white p-4">
        <div className="flex justify-between gap-3">
          <div>
            <span className="badge-stark bg-yellow-200">UNVERIFIED V1</span>
            <h2 className="mt-2 text-xl font-black uppercase">
              {profile.name}
            </h2>
            <p className="text-xs font-bold text-gray-600">
              {profile.currentRole} · {profile.company} · Class of{" "}
              {profile.graduationYear}
            </p>
          </div>
          <div className="text-right text-xs font-black">
            {profile.acceptingRequests ? "ACCEPTING REQUESTS" : "PAUSED"}
            <br />
            CAPACITY {profile.capacity}
          </div>
        </div>
      </div>
      {error && (
        <p className="border-2 border-red-700 bg-red-100 p-2 text-xs font-bold">
          {error}
        </p>
      )}
      <div className="card-stark bg-white p-4">
        <h3 className="mb-3 text-sm font-black uppercase">
          Student requests & mentorships
        </h3>
        <div className="space-y-3">
          {connections.length === 0 && (
            <p className="text-xs text-gray-500">No student requests yet.</p>
          )}
          {connections.map((connection) => (
            <div key={connection._id} className="border-2 border-black p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black uppercase">
                    {connection.student?.name || "Student"}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">
                    {connection.requestType.replaceAll("-", " ")} ·{" "}
                    {connection.status}
                  </div>
                  <p className="mt-2 max-w-xl whitespace-pre-wrap text-xs">
                    {connection.message}
                  </p>
                  {connection.selectedJob && (
                    <p className="mt-2 text-[10px] font-black uppercase">
                      Goal:{" "}
                      {connection.selectedJob.roleTitle ||
                        connection.selectedJob.title}{" "}
                      at{" "}
                      {connection.selectedJob.companyName ||
                        connection.selectedJob.company_name}
                    </p>
                  )}
                  {connection.sharedResume && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer font-black uppercase">
                        Shared resume
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap bg-gray-100 p-2">
                        {connection.sharedResume}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2">
                  {connection.status === "pending" && (
                    <>
                      <button
                        onClick={() => update(connection, "accepted")}
                        className="btn-primary px-3 py-1 text-xs"
                      >
                        ACCEPT
                      </button>
                      <button
                        onClick={() => update(connection, "declined")}
                        className="btn-secondary px-3 py-1 text-xs"
                      >
                        DECLINE
                      </button>
                    </>
                  )}
                  {connection.status === "accepted" && (
                    <button
                      onClick={() =>
                        setSelected(
                          selected?._id === connection._id ? null : connection,
                        )
                      }
                      className="btn-primary px-3 py-1 text-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> CHAT
                    </button>
                  )}
                </div>
              </div>
              {selected?._id === connection._id && (
                <div className="mt-3">
                  <Conversation connection={connection} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentAlumniWorkspace() {
  const dispatch = useDispatch();
  const workspace = useSelector(selectAlumniWorkspace);
  const sessionId = useSelector((state) => state.aiChat.sessionId);
  const [goal, setGoal] = useState("");
  const [requestType, setRequestType] = useState("career-guidance");
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const loadConnections = async () => {
    try {
      setConnections(responseData(await api.getAlumniConnections(), []));
    } catch {
      /* workspace remains usable */
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConnections();
    const timer = setInterval(loadConnections, 10000);
    return () => clearInterval(timer);
  }, []);
  const find = () =>
    dispatch(
      sendAIMessage({
        text:
          goal.trim() ||
          "Find the 3 best alumni mentors for my current job and resume journey.",
        modeName: "alumni-connect",
        source: "alumni-discovery",
      }),
    );
  const prepare = (alumni) => {
    const supportedType = alumni.requestTypes?.includes(requestType)
      ? requestType
      : alumni.requestTypes?.[0] || "career-guidance";
    dispatch(alumniSelectionStarted());
    dispatch(
      sendAIMessage({
        text: `Prepare a ${supportedType.replaceAll("-", " ")} connection request for ${alumni.name}.`,
        modeName: "alumni-connect",
        source: "alumni-selection",
        details: { alumni_id: alumni._id, request_type: supportedType },
      }),
    );
  };
  const review = () =>
    dispatch(
      sendAIMessage({
        text: "Review my edited alumni request and approve the exact final version.",
        modeName: "alumni-connect",
        source: "alumni-review",
      }),
    );
  const send = async () => {
    const draft = workspace.draft;
    if (!draft) return;
    dispatch(alumniSendStarted());
    try {
      await api.createAlumniConnection({
        sessionId,
        alumniId: draft.alumni_id,
        requestType: draft.request_type,
        message: draft.message,
        selectedJob: draft.selected_job,
        shareResume: draft.share_resume,
        resume: draft.share_resume ? draft.resume : "",
      });
      dispatch(alumniSendSucceeded());
      await loadConnections();
      dispatch(
        sendAIMessage({
          text: "The alumni connection request was sent and the reviewed format was accepted.",
          modeName: "alumni-connect",
          source: "alumni-request-sent",
        }),
      );
    } catch (e) {
      dispatch(alumniSendFailed(errorText(e)));
    }
  };
  const reviewResumeShare = () =>
    dispatch(
      sendAIMessage({
        text: "Review my edited resume share and approve the exact version and message.",
        modeName: "alumni-connect",
        source: "resume-share-review",
      }),
    );
  const shareResume = async () => {
    const share = workspace.resumeShareDraft;
    if (!share) return;
    dispatch(alumniResumeShareStarted());
    try {
      await api.shareResumeWithAlumni(share.connection_id, {
        sessionId,
        resumeVersionId: share.resume_version_id,
        message: share.message,
      });
      dispatch(alumniResumeShareSucceeded());
      await loadConnections();
      setSelectedConnection(
        connections.find(
          (connection) => connection._id === share.connection_id,
        ) || { _id: share.connection_id, status: "accepted" },
      );
    } catch (e) {
      dispatch(alumniResumeShareFailed(errorText(e)));
    }
  };
  const close = async (connection) => {
    await api.updateAlumniConnection(connection._id, "closed");
    await loadConnections();
  };
  const draft = workspace.draft;
  return (
    <div className="space-y-4">
      <div className="card-stark bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="badge-stark bg-purple-200">
              AGENTIC MENTORSHIP
            </span>
            <h2 className="mt-2 text-xl font-black uppercase">
              Alumni Connect
            </h2>
            <p className="text-xs text-gray-600">
              Your job and generated resume travel with this journey only when
              you choose to share them.
            </p>
          </div>
          <Users className="h-9 w-9" />
        </div>
      </div>
      <div className="card-stark bg-white p-4">
        <label className="text-xs font-black uppercase">
          What guidance do you need?
        </label>
        <div className="mt-2 flex gap-2">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Example: I want Amazon Python interview guidance and a resume review"
            className="input-stark min-h-20 flex-1 text-xs"
          />
          <button
            onClick={find}
            className="btn-primary self-stretch px-4 text-xs"
          >
            <RefreshCw className="h-4 w-4" /> FIND 3
          </button>
        </div>
      </div>
      {workspace.matches.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {workspace.matches.map((alumni) => (
            <div
              key={alumni._id}
              className="card-stark flex flex-col bg-white p-3"
            >
              <div className="mb-2 flex items-start justify-between">
                <UserRoundCheck className="h-6 w-6" />
                <span className="badge-stark bg-yellow-100">UNVERIFIED</span>
              </div>
              <h3 className="font-black uppercase">{alumni.name}</h3>
              <p className="text-xs font-bold">
                {alumni.currentRole} · {alumni.company}
              </p>
              <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                {alumni.bio || alumni.mentoringTopics?.join(", ")}
              </p>
              <div className="mt-auto pt-3">
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="input-stark mb-2 w-full text-xs"
                >
                  {REQUEST_TYPES.filter(([value]) =>
                    alumni.requestTypes?.includes(value),
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => prepare(alumni)}
                  className="btn-primary w-full justify-center py-2 text-xs"
                >
                  PREPARE REQUEST
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {draft && (
        <div className="card-stark bg-white p-4">
          <div className="mb-3 flex justify-between">
            <div>
              <span
                className={`badge-stark ${workspace.agentReviewed ? "bg-green-200" : "bg-yellow-200"}`}
              >
                {workspace.agentReviewed
                  ? "AGENT REVIEWED"
                  : "CHANGED · REVIEW AGAIN"}
              </span>
              <h3 className="mt-2 text-sm font-black uppercase">
                Request to {draft.alumni_name}
              </h3>
            </div>
            <Check className="h-6 w-6" />
          </div>
          <label className="text-xs font-black uppercase">
            Request type
            <select
              value={draft.request_type}
              onChange={(e) =>
                dispatch(alumniDraftUpdated({ request_type: e.target.value }))
              }
              className="input-stark mt-1 w-full"
            >
              {REQUEST_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs font-black uppercase">
            Message
            <textarea
              value={draft.message}
              onChange={(e) =>
                dispatch(alumniDraftUpdated({ message: e.target.value }))
              }
              className="input-stark mt-1 min-h-36 w-full text-xs"
            />
          </label>
          <p className="mt-3 text-xs font-bold text-gray-600">
            After this connection is accepted, you can share a specific
            protected version from your Resume Bank.
          </p>
          {workspace.sendError && (
            <p className="mt-2 text-xs font-bold text-red-700">
              {workspace.sendError}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            {!workspace.agentReviewed && (
              <button
                onClick={review}
                className="btn-secondary px-4 py-2 text-xs"
              >
                REVIEW CHANGES
              </button>
            )}
            <button
              disabled={
                !workspace.agentReviewed ||
                workspace.sendStatus === "sending" ||
                workspace.sendStatus === "sent"
              }
              onClick={send}
              className="btn-primary px-4 py-2 text-xs disabled:opacity-40"
            >
              <Send className="h-4 w-4" />{" "}
              {workspace.sendStatus === "sent"
                ? "SENT"
                : workspace.sendStatus === "sending"
                  ? "SENDING..."
                  : "SEND REQUEST"}
            </button>
          </div>
        </div>
      )}
      <ResumeShareModal
        workspace={workspace}
        onMessageChange={(message) =>
          dispatch(alumniResumeShareDraftUpdated({ message }))
        }
        onReview={reviewResumeShare}
        onShare={shareResume}
        onDismiss={() => dispatch(alumniResumeShareDismissed())}
      />
      <div className="card-stark bg-white p-4">
        <h3 className="mb-3 text-sm font-black uppercase">
          My alumni connections
        </h3>
        <div className="space-y-2">
          {connections.length === 0 && (
            <p className="text-xs text-gray-500">No requests yet.</p>
          )}
          {connections.map((connection) => (
            <div key={connection._id} className="border-2 border-black p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <b className="uppercase">
                    {connection.alumni?.name || "Alumni"}
                  </b>
                  <p className="text-[10px] font-bold uppercase text-gray-500">
                    {connection.alumni?.currentRole} · {connection.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {connection.status === "accepted" && (
                    <button
                      onClick={() =>
                        setSelectedConnection(
                          selectedConnection?._id === connection._id
                            ? null
                            : connection,
                        )
                      }
                      className="btn-primary px-3 py-1 text-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> CHAT
                    </button>
                  )}
                  {["pending", "accepted"].includes(connection.status) && (
                    <button
                      onClick={() => close(connection)}
                      className="btn-secondary px-3 py-1 text-xs"
                    >
                      CLOSE
                    </button>
                  )}
                </div>
              </div>
              {selectedConnection?._id === connection._id && (
                <div className="mt-3">
                  <Conversation connection={connection} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AlumniConnect({ user, alumniMode = false }) {
  return alumniMode ? (
    <AlumniDashboard user={user} />
  ) : (
    <StudentAlumniWorkspace />
  );
}
