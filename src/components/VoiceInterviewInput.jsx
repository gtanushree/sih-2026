import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock3, Mic, RotateCcw, Send, Square } from "lucide-react";
import { useDispatch } from "react-redux";
import { socket } from "../lib/socket";
import { cancelInterviewAudio, endInterviewAudio, startInterviewAudio } from "../services/aiRequestHandler";

export const INTERVIEW_ANSWER_WINDOW_EVENT = "tnp:interview-answer-window";
const ANSWER_WINDOW_SECONDS = 60;

export default function VoiceInterviewInput({ questionNumber }) {
  const dispatch = useDispatch();
  const [transcript, setTranscript] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(ANSWER_WINDOW_SECONDS);
  const [phase, setPhase] = useState("waiting");
  const [error, setError] = useState("");
  const captureRef = useRef(null);

  const closeCapture = useCallback(async ({ submit = false, cancel = false } = {}) => {
    const capture = captureRef.current;
    if (!capture || capture.closing) return;
    capture.closing = true;
    window.clearInterval(capture.countdown);
    window.clearTimeout(capture.deadline);
    capture.source?.disconnect();
    if (submit) {
      capture.worklet?.port.postMessage({ type: "flush" });
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    captureRef.current = null;
    capture.worklet?.disconnect();
    capture.silentGain?.disconnect();
    capture.stream?.getTracks().forEach((track) => track.stop());
    if (capture.audioContext?.state !== "closed") await capture.audioContext?.close();
    if (submit) dispatch(endInterviewAudio(capture.requestId));
    if (cancel) dispatch(cancelInterviewAudio(capture.requestId));
  }, [dispatch]);

  const startCapture = useCallback(async () => {
    await closeCapture({ cancel: true });
    setTranscript("");
    setError("");
    setSecondsLeft(ANSWER_WINDOW_SECONDS);
    setPhase("starting");

    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
        throw new Error("This browser does not support realtime microphone streaming.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const audioContext = new AudioContext({ sampleRate: 16000 });
      await audioContext.audioWorklet.addModule("/interview-pcm-worklet.js");
      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "interview-pcm-capture");
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;

      const result = dispatch(startInterviewAudio({
        sampleRate: audioContext.sampleRate,
        questionNumber,
        onAcknowledged: (acknowledgement) => {
          if (acknowledgement?.ok) return;
          setPhase("error");
          setError(acknowledgement?.message || "The speech service could not start.");
          closeCapture({ cancel: true });
        },
      }));

      const capture = {
        requestId: result.requestId,
        audioContext,
        stream,
        source,
        worklet,
        silentGain,
        countdown: null,
        deadline: null,
        closing: false,
      };
      captureRef.current = capture;
      worklet.port.onmessage = ({ data }) => {
        if (captureRef.current?.requestId !== result.requestId || !(data instanceof ArrayBuffer)) return;
        socket.emit("interview:audio:chunk", { requestId: result.requestId, audio: data });
      };
      source.connect(worklet).connect(silentGain).connect(audioContext.destination);
      await audioContext.resume();

      const startedAt = Date.now();
      capture.countdown = window.setInterval(() => {
        setSecondsLeft(Math.max(0, Math.ceil(ANSWER_WINDOW_SECONDS - (Date.now() - startedAt) / 1000)));
      }, 250);
      capture.deadline = window.setTimeout(async () => {
        setSecondsLeft(0);
        setPhase("submitting");
        await closeCapture({ submit: true });
      }, ANSWER_WINDOW_SECONDS * 1000);
      setPhase("listening");
    } catch (captureError) {
      await closeCapture({ cancel: true });
      setPhase("error");
      setError(captureError?.message || "The microphone could not start.");
    }
  }, [closeCapture, dispatch, questionNumber]);

  useEffect(() => {
    const beginAnswerWindow = (event) => {
      if (event.detail?.questionNumber === questionNumber) startCapture();
    };
    const updateTranscript = (payload) => {
      if (payload?.requestId !== captureRef.current?.requestId) return;
      setTranscript(payload.text || "");
      if (payload.isFinal) {
        setPhase("submitted");
        closeCapture();
      }
    };
    const handleError = (payload) => {
      if (payload?.requestId !== captureRef.current?.requestId) return;
      setPhase("error");
      setError(payload.message || "Speech processing failed. Please retry.");
      closeCapture({ cancel: true });
    };

    window.addEventListener(INTERVIEW_ANSWER_WINDOW_EVENT, beginAnswerWindow);
    socket.on("interview:transcript", updateTranscript);
    socket.on("interview:audio:error", handleError);
    return () => {
      window.removeEventListener(INTERVIEW_ANSWER_WINDOW_EVENT, beginAnswerWindow);
      socket.off("interview:transcript", updateTranscript);
      socket.off("interview:audio:error", handleError);
      closeCapture({ cancel: true });
    };
  }, [closeCapture, questionNumber, startCapture]);

  const retry = () => window.dispatchEvent(new CustomEvent(INTERVIEW_ANSWER_WINDOW_EVENT, {
    detail: { questionNumber },
  }));
  const finishAnswer = async () => {
    if (phase !== "listening") return;
    setPhase("submitting");
    await closeCapture({ submit: true });
  };

  return (
    <div className={`space-y-2 border-2 border-black p-3 ${phase === "listening" ? "bg-red-50" : "bg-blue-50"}`} aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase">
          {phase === "listening" ? <Mic className="h-4 w-4 text-red-600" /> : phase === "submitting" || phase === "submitted" ? <Send className="h-4 w-4" /> : <Square className="h-3.5 w-3.5" />}
          {phase === "waiting" && "Question audio is playing"}
          {phase === "starting" && "Connecting secure audio stream"}
          {phase === "listening" && "Recording · server transcription"}
          {phase === "submitting" && "Finishing server transcript"}
          {phase === "submitted" && "Transcript sent to interviewer"}
          {phase === "error" && "Voice answer needs attention"}
        </div>
        {["waiting", "starting", "listening"].includes(phase) && (
          <span className="flex items-center gap-1 border border-black bg-white px-2 py-1 text-[10px] font-black"><Clock3 className="h-3.5 w-3.5" /> {secondsLeft}s</span>
        )}
      </div>
      <div className="border-1.5 border-black bg-white p-2.5">
        <div className="mb-1 text-[9px] font-black uppercase text-gray-500">Live server transcript</div>
        <div className="min-h-20 whitespace-pre-wrap text-xs font-semibold leading-relaxed">
          {transcript || (phase === "waiting" ? "Recording starts after the interviewer finishes speaking." : "Start speaking—your server transcript will appear here.")}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase text-gray-600">
        <span>Audio is streamed, not stored</span><span>Sends after 4s silence or at 0s</span>
      </div>
      {phase === "listening" && (
        <button type="button" onClick={finishAnswer} className="btn-primary w-full justify-center py-2 text-xs">
          <Square className="h-3.5 w-3.5 fill-current" /> FINISH ANSWER & SEND
        </button>
      )}
      {error && (
        <div className="border-1.5 border-black bg-red-100 p-2 text-[10px] font-bold">
          <p className="flex gap-1"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}</p>
          <button type="button" onClick={retry} className="btn-secondary mt-2 px-2 py-1 text-[10px]"><RotateCcw className="h-3.5 w-3.5" /> RETRY ANSWER</button>
        </div>
      )}
    </div>
  );
}
