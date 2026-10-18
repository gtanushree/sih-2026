import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  CheckCircle2,
  Mail,
  PenLine,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { api } from "../lib/api";
import { sendAIMessage } from "../services/aiRequestHandler";
import { setUserContext } from "../store/appContextSlice";
import {
  prOutreachDraftUpdated,
  prOutreachSendFailed,
  prOutreachSendStarted,
  prOutreachSendSucceeded,
  selectAILoading,
  selectPROutreachWorkspace,
} from "../store/aiChatSlice";

const STATUS_COPY = {
  idle: "Waiting for your brief",
  drafting: "Agent is drafting",
  review: "Ready for review",
  editing: "Your edits are included",
  satisfied: "Agent is satisfied",
  sent: "Mail sent",
  error: "Drafting interrupted",
};

export default function PROutreach() {
  const dispatch = useDispatch();
  const draft = useSelector(selectPROutreachWorkspace);
  const sessionId = useSelector((state) => state.aiChat.sessionId);
  const loading = useSelector(selectAILoading);
  const user = useSelector((state) => state.appContext.user);
  const isSatisfied = Boolean(draft.agentSatisfied);
  const hasDraft = Boolean(draft.to || draft.subject || draft.body);
  const isSending = draft.sendStatus === "sending";
  const isSent = draft.sendStatus === "sent";

  const gmailConnected = Boolean(user?.gmailConnection?.connectedEmail);
  const [gmailBannerError, setGmailBannerError] = useState(null);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);

  const refreshUser = async () => {
    const response = await api.getMe();
    const updatedUser = response.data;
    dispatch(setUserContext(updatedUser));
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailConnectedParam = params.get("gmail_connected");
    const gmailErrorParam = params.get("gmail_error");

    if (gmailConnectedParam) {
      refreshUser();
    } else if (gmailErrorParam) {
      // One-time sync from the OAuth redirect's query param, not a state cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGmailBannerError(
        gmailErrorParam === "denied"
          ? "Gmail connection was cancelled."
          : "Could not connect Gmail. Please try again."
      );
    }

    if (gmailConnectedParam || gmailErrorParam) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confidence = useMemo(() => {
    const value = Number(draft.confidenceScore);
    if (!Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value)));
  }, [draft.confidenceScore]);
  const canSend = Boolean(
    gmailConnected && isSatisfied && confidence !== null && confidence > 85 &&
    draft.to.trim() && draft.subject.trim() && draft.body.trim() && !loading
  );

  const updateField = (field, value) => {
    dispatch(prOutreachDraftUpdated({ [field]: value }));
  };

  const askAgent = (text) => dispatch(sendAIMessage({
    text,
    modeName: "pr_outreach",
    source: "pr-outreach-composer",
  }));

  const handleConnectGmail = async () => {
    setGmailBannerError(null);
    setIsConnectingGmail(true);
    try {
      const { data } = await api.getGmailAuthorizeUrl();
      window.location.href = data.url;
    } catch (error) {
      setIsConnectingGmail(false);
      setGmailBannerError(
        error.response?.data?.message || error.message || "Unable to start Gmail connection"
      );
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await api.disconnectGmail();
      await refreshUser();
    } catch (error) {
      setGmailBannerError(
        error.response?.data?.message || error.message || "Unable to disconnect Gmail"
      );
    }
  };

  const handleSendEmail = async () => {
    if (!canSend || isSending || isSent) return;
    dispatch(prOutreachSendStarted());
    try {
      const response = await api.sendPROutreachEmail({
        sessionId,
        to: draft.to.trim(),
        subject: draft.subject.trim(),
        body: draft.body.trim(),
      });
      dispatch(prOutreachSendSucceeded(response.data));
      dispatch(sendAIMessage({
        text: "Yeah, I have sent the mail and accepted the mail format and everything.",
        modeName: "pr_outreach",
        source: "pr-outreach-mail-sent",
      }));
    } catch (error) {
      const errorCodes = error.response?.data?.errors || [];
      if (errorCodes.includes("GMAIL_NOT_CONNECTED") || errorCodes.includes("GMAIL_RECONNECT_REQUIRED")) {
        await refreshUser();
        dispatch(prOutreachSendFailed(
          errorCodes.includes("GMAIL_RECONNECT_REQUIRED")
            ? "Your Gmail authorization expired. Please reconnect Gmail."
            : "Connect your Gmail account before sending."
        ));
        return;
      }
      dispatch(prOutreachSendFailed(
        error.response?.data?.message || error.message || "Unable to send mail"
      ));
    }
  };

  return (
    <section className="card-stark flex h-full min-h-[560px] flex-col overflow-hidden bg-white p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-black px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="border border-white/50 bg-white p-2 text-black">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">AI Mail Workspace</div>
            <h2 className="text-base font-black uppercase tracking-tight">PR & Outreach Composer</h2>
          </div>
        </div>
        <div className={`flex items-center gap-2 border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${isSatisfied ? "border-green-300 bg-green-200 text-black" : "border-white/50 bg-white/10 text-white"
          }`}>
          {isSatisfied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
          {STATUS_COPY[draft.status] || STATUS_COPY.idle}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-[#f6f8fc] p-4 sm:p-6">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between bg-[#eef3f8] px-4 py-2.5">
            <span className="text-xs font-semibold text-gray-700">New outreach message</span>
          </div>

          {gmailConnected ? (
            <div className="flex items-center justify-between border-b border-gray-200 bg-green-50 px-4 py-2 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-green-900">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sending as {user.gmailConnection.connectedEmail}
              </span>
              <button
                type="button"
                onClick={handleDisconnectGmail}
                className="font-semibold text-green-800 underline hover:text-green-900"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-amber-50 px-4 py-2.5 text-xs">
              <span className="font-semibold text-amber-900">
                Connect your Gmail account to send outreach email as yourself
              </span>
              <button
                type="button"
                onClick={handleConnectGmail}
                disabled={isConnectingGmail}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {isConnectingGmail ? "Redirecting..." : "Connect Gmail"}
              </button>
            </div>
          )}
          {gmailBannerError && (
            <div className="mx-4 mt-2 border border-red-400 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
              {gmailBannerError}
            </div>
          )}

          <label className="flex items-center border-b border-gray-200 px-4 text-sm">
            <span className="w-14 flex-none text-gray-500">To</span>
            <input
              aria-label="Recipient email"
              type="email"
              value={draft.to}
              onChange={(event) => updateField("to", event.target.value)}
              placeholder="recipient@company.com"
              className="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-sm font-medium outline-none"
            />
          </label>

          <label className="flex items-center border-b border-gray-200 px-4 text-sm">
            <span className="w-14 flex-none text-gray-500">Subject</span>
            <input
              aria-label="Email subject"
              type="text"
              value={draft.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="Add a clear subject"
              className="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-sm font-medium outline-none"
            />
          </label>

          <textarea
            aria-label="Email body"
            value={draft.body}
            onChange={(event) => updateField("body", event.target.value)}
            placeholder="Your AI-drafted email will appear here after the assistant has enough context. You can edit every field before approval."
            className="min-h-[260px] flex-1 resize-none border-0 bg-white p-4 text-sm leading-6 text-gray-800 outline-none sm:min-h-[320px]"
          />

          {draft.error && (
            <div className="mx-4 mb-3 border border-red-400 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
              {draft.error}
            </div>
          )}
          {draft.sendError && (
            <div className="mx-4 mb-3 border border-red-400 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
              {draft.sendError}
            </div>
          )}
          {isSent && (
            <div className="mx-4 mb-3 flex items-center gap-2 border border-green-500 bg-green-50 px-3 py-2 text-xs font-bold text-green-900">
              <CheckCircle2 className="h-4 w-4" /> Mail sent successfully to {draft.to}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canSend || isSending || isSent}
                onClick={handleSendEmail}
                title={
                  canSend
                    ? "Send this outreach email"
                    : !gmailConnected
                      ? "Connect your Gmail account to send"
                      : "Requires agent confidence above 85%"
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#0b57d0] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#0842a0] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSending ? <Sparkles className="h-4 w-4 animate-spin" /> : isSent ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {isSending ? "Sending mail..." : isSent ? "Mail sent" : "Send email"}
              </button>
              {hasDraft && !isSatisfied && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => askAgent("Please polish the current draft while preserving its meaning.")}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#0b57d0] hover:bg-blue-50 disabled:opacity-40"
                >
                  <Wand2 className="h-4 w-4" /> Polish with AI
                </button>
              )}
              {!isSent && !gmailConnected && (
                <span className="text-[10px] font-semibold text-gray-500">Connect Gmail to enable sending</span>
              )}
              {!isSent && gmailConnected && (!isSatisfied || confidence === null || confidence <= 85) && (
                <span className="text-[10px] font-semibold text-gray-500">Unlocks above 85% confidence</span>
              )}
            </div>

            {isSatisfied && confidence !== null ? (
              <div className="flex items-center gap-3" aria-label={`Agent confidence ${confidence}%`}>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">Agent confidence</div>
                  <div className="text-xs font-bold text-gray-900">Agent is satisfied</div>
                </div>
                <div
                  className="grid h-12 w-12 place-items-center rounded-full p-1"
                  style={{ background: `conic-gradient(#16a34a ${confidence * 3.6}deg, #e5e7eb 0deg)` }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-white text-[11px] font-black text-gray-900">
                    {confidence}%
                  </div>
                </div>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
                <Check className="h-3.5 w-3.5" /> RHS edits are shared with the agent on your next message
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
