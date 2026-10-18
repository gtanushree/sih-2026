import { useState, useRef, useLayoutEffect } from "react";
import { MessageSquare, Send, Bot, User, Zap, Sparkles, Plus, BriefcaseBusiness } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useDispatch, useSelector } from "react-redux";
import { sendAIMessage, startNewAIChat } from "../services/aiRequestHandler";
import { selectAILoading, selectChatMessages, selectInterviewWorkspace } from "../store/aiChatSlice";
import VoiceInterviewInput from "./VoiceInterviewInput";

const markdownComponents = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
};

const parseTableRow = (line) => {
  const placeholder = "__ESCAPED_PIPE__";
  return line
    .trim()
    .replaceAll("\\|", placeholder)
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim().replaceAll(placeholder, "|"));
};

const isTableDivider = (line = "") => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());

function MarkdownWithTables({ text = "" }) {
  const lines = text.split("\n");
  const blocks = [];
  let markdownLines = [];

  const flushMarkdown = () => {
    if (!markdownLines.length) return;
    blocks.push({ type: "markdown", content: markdownLines.join("\n") });
    markdownLines = [];
  };

  for (let index = 0; index < lines.length;) {
    if (lines[index].trim().startsWith("|") && isTableDivider(lines[index + 1])) {
      flushMarkdown();
      const headers = parseTableRow(lines[index]);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }
    markdownLines.push(lines[index]);
    index += 1;
  }
  flushMarkdown();

  return blocks.map((block, blockIndex) => block.type === "markdown" ? (
    <ReactMarkdown key={`markdown-${blockIndex}`} components={markdownComponents}>
      {block.content}
    </ReactMarkdown>
  ) : (
    <div key={`table-${blockIndex}`} className="my-2 max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-[10px]">
        <thead className="bg-black text-white">
          <tr>{block.headers.map((header, index) => (
            <th key={`${header}-${index}`} className="border border-black p-1.5 font-black">
              <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{header}</ReactMarkdown>
            </th>
          ))}</tr>
        </thead>
        <tbody>{block.rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`} className="bg-white even:bg-gray-50">
            {row.map((cell, cellIndex) => (
              <td key={`cell-${cellIndex}`} className="border border-black p-1.5 align-top">
                <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{cell}</ReactMarkdown>
              </td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  ));
}

export default function Chat() {
  const dispatch = useDispatch();
  const messages = useSelector(selectChatMessages);
  const loading = useSelector(selectAILoading);
  const studentName = useSelector((state) => state.appContext.user?.name || "Student");
  const activeMode = useSelector((state) => state.appContext.activeMode);
  const activeFeature = useSelector((state) => state.appContext.activeFeature);
  const interviewWorkspace = useSelector(selectInterviewWorkspace);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const isVoiceTurn = activeFeature === "mock-interview" && interviewWorkspace.status === "in-progress";

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
  }, [messages, loading]);

  const handleSend = (customPrompt) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || loading) return;

    if (!customPrompt) setInput("");
    dispatch(sendAIMessage({ text: promptToSend }));
  };

  return (
    <div className="card-stark bg-white flex flex-col h-full overflow-hidden">
      {/* Chat Title Header */}
      <div className="border-b-2 border-black pb-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h2 className="font-black text-sm uppercase">
            {activeMode === "pr_outreach" ? "PR & OUTREACH ASSISTANT" : activeFeature === "mock-interview" ? "AI INTERVIEW COACH" : "PLACEMENT ASSISTANT AI"}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => dispatch(startNewAIChat(studentName))}
            className="btn-secondary px-2 py-1 text-[10px]"
            title="Start a new chat"
          >
            <Plus className="h-3.5 w-3.5" />
            NEW CHAT
          </button>
        </div>
      </div>



      {/* Message History Window */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 border-2 border-black p-3 bg-gray-50 mb-3">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1 mb-1">
              {msg.sender === "user" ? (
                <>
                  <span className="text-[10px] font-extrabold uppercase">YOU</span>
                  <User className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-black" />
                  <span className="text-[10px] font-extrabold uppercase">AI ASSISTANT</span>
                </>
              )}
            </div>

            <div
              className={`min-w-0 max-w-[85%] overflow-hidden p-2.5 border-2 border-black text-xs font-medium ${msg.sender === "user"
                ? "bg-black text-white shadow-bold-sm"
                : "bg-white text-black shadow-bold-sm"
                } ${msg.streaming ? "animate-pulse" : ""}`}
            >
              {msg.headerMessage && (
                <div className="mb-1.5 p-1 bg-yellow-100 border border-black text-[10px] font-mono font-bold text-black flex items-center gap-1">
                  <Zap className="w-3 h-3 text-black fill-black" />
                  <span>{msg.headerMessage}</span>
                </div>
              )}
              {msg.sender === "user" ? (
                <div className="min-w-0 max-w-full whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">{msg.text}</div>
              ) : (
                <div className="min-w-0 max-w-full break-words leading-relaxed [overflow-wrap:anywhere] [&_h1]:mb-2 [&_h1]:text-sm [&_h1]:font-black [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-black [&_h3]:mb-1 [&_h3]:font-black [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_a]:font-bold [&_a]:underline [&_strong]:font-black [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-black [&_blockquote]:pl-2 [&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-hidden [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:font-mono [&_code]:text-[11px] [&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:table-fixed [&_th]:break-words [&_td]:break-words">
                  <MarkdownWithTables text={msg.text} />
                  {msg.sender !== "user" && msg.headerMessage === "select:job:db" && (
                    <div className="mt-2 p-2 bg-blue-50 border border-black text-[11px] font-semibold text-blue-950 flex items-center gap-1.5">
                      <BriefcaseBusiness className="w-3.5 h-3.5 flex-shrink-0 text-blue-700" />
                      <span>Choose from the active campus drives in the right panel, or paste a custom job link.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive option buttons sent by the backend */}
            {msg.sender === "bot" && Array.isArray(msg.options) && msg.options.length > 0 && !loading && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                {msg.options.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSend(option)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold border-2 border-black bg-white text-black shadow-bold-sm hover:bg-black hover:text-white transition-colors duration-150 cursor-pointer"
                  >
                    <Zap className="w-3 h-3 flex-shrink-0" />
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-bold p-2 bg-yellow-100 border-2 border-black w-fit">
            <Sparkles className="w-4 h-4 animate-spin text-black" />
            <span>QUERYING DATABASE & AI TOOLS...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isVoiceTurn ? (
        <VoiceInterviewInput
          key={interviewWorkspace.questionNumber}
          questionNumber={interviewWorkspace.questionNumber}
          loading={loading}
        />
      ) : (
        /* Standard text input used outside an active interview question. */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-stretch gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeMode === "pr_outreach"
              ? "Tell the agent who you want to reach and why..."
              : activeFeature === "mock-interview"
                ? "Answer the interview question..."
                : "Ask AI assistant about drives, scores, or application status..."}
            className="input-stark flex-1 text-xs"
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary text-xs py-1.5 px-3 cursor-pointer">
            <Send className="w-3.5 h-3.5" />
            <span>SEND</span>
          </button>
        </form>
      )}
    </div>
  );
}
