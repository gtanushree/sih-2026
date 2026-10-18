import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Code2, Download, FileOutput, LoaderCircle, PanelRight, Play } from "lucide-react";

const STATUS_LABELS = {
  idle: "WAITING TO START",
  collecting: "COLLECTING DETAILS",
  streaming: "GENERATING LATEX",
  complete: "LATEX COMPLETE",
  error: "GENERATION FAILED",
};

export default function ResumeGeneratorWorkspace({ workspace, onStart }) {
  const codeEndRef = useRef(null);
  const [loadedPdfUrl, setLoadedPdfUrl] = useState(null);
  const latexCode = workspace?.latexCode || "";
  const status = workspace?.status || "idle";
  const lines = latexCode ? latexCode.split("\n") : [];
  const generatedPdfUrl = useMemo(() => {
    if (status !== "complete" || !latexCode.trim()) return null;

    const params = new URLSearchParams({
      command: "pdflatex",
      text: latexCode,
    });
    return `https://latexonline.cc/compile?${params.toString()}`;
  }, [latexCode, status]);
  const pdfUrl = workspace?.pdfUrl || generatedPdfUrl;
  const previewStatus = !pdfUrl ? "idle" : loadedPdfUrl === pdfUrl ? "ready" : "compiling";

  useLayoutEffect(() => {
    if (status === "streaming") codeEndRef.current?.scrollIntoView({ block: "end" });
  }, [latexCode, status]);

  const downloadTex = () => {
    if (!latexCode) return;
    const url = URL.createObjectURL(new Blob([latexCode], { type: "application/x-tex" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume.tex";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-2 border-black bg-[#eef1f4] shadow-bold-sm">
      <div className="shrink-0 flex flex-col justify-between gap-3 border-b-2 border-black bg-white px-3 py-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="bg-black p-1.5 text-white"><Code2 className="h-4 w-4" /></div>
          <div>
            <h2 className="text-xs font-black uppercase">Resume Generator Workspace</h2>
            <p className="text-[10px] font-semibold text-gray-500">main.tex · AI-assisted LaTeX workspace</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge-stark text-[9px] ${status === "complete" ? "bg-green-200" : status === "error" ? "bg-red-100" : "bg-yellow-100"}`}>
            {status === "streaming" && <LoaderCircle className="h-3 w-3 animate-spin" />}
            {status === "complete" && <Check className="h-3 w-3" />}
            {STATUS_LABELS[status] || STATUS_LABELS.idle}
          </span>
          <button type="button" onClick={downloadTex} disabled={!latexCode} className="btn-secondary px-2 py-1 text-[10px] disabled:cursor-not-allowed disabled:opacity-40">
            <Download className="h-3 w-3" /> DOWNLOAD .TEX
          </button>
          <button type="button" onClick={onStart} disabled={status === "streaming" || status === "collecting"} className="btn-primary px-2 py-1 text-[10px] disabled:cursor-not-allowed disabled:opacity-50">
            <Play className="h-3 w-3" /> {latexCode ? "CONTINUE IN CHAT" : "START GENERATOR"}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-2 xl:overflow-hidden">
        <section className="flex min-h-[560px] flex-col overflow-hidden border-b-2 border-black bg-[#17191c] text-gray-100 xl:min-h-0 xl:border-b-0 xl:border-r-2">
          <div className="shrink-0 flex items-center justify-between border-b border-gray-600 bg-[#24272b] px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase"><Code2 className="h-3.5 w-3.5" /> LaTeX Source</div>
            <span className="font-mono text-[9px] text-gray-400">{lines.length || 0} LINES</span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto font-mono text-[11px] leading-5">
            {latexCode ? (
              <div className="grid min-w-max grid-cols-[auto_1fr] py-3">
                <div className="select-none border-r border-gray-700 px-3 text-right text-gray-600">
                  {lines.map((_, index) => <div key={index}>{index + 1}</div>)}
                </div>
                <pre className="m-0 whitespace-pre px-4 text-gray-100">{latexCode}<span ref={codeEndRef} /></pre>
              </div>
            ) : (
              <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-8 text-center">
                <Code2 className="mb-3 h-9 w-9 text-gray-600" />
                <p className="text-xs font-bold text-gray-300">LaTeX will stream here incrementally.</p>
                <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-gray-500">Start the generator, answer the assistant’s questions, and the final document source will appear token by token.</p>
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-[560px] flex-col overflow-hidden bg-[#d9dde2] xl:min-h-0">
          <div className="shrink-0 flex items-center justify-between border-b-2 border-black bg-white px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase"><PanelRight className="h-3.5 w-3.5" /> PDF Preview</div>
            <span className="text-[9px] font-bold text-gray-500">
              {previewStatus === "ready" ? "PDF READY" : previewStatus === "compiling" ? "COMPILING PDF" : "COMPILES AFTER LATEX COMPLETES"}
            </span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5">
            {pdfUrl ? (
              <div className="relative h-full min-h-[500px] w-full xl:min-h-0">
                {previewStatus === "compiling" && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center border-2 border-black bg-white">
                    <div className="text-center">
                      <LoaderCircle className="mx-auto mb-3 h-9 w-9 animate-spin" />
                      <h3 className="text-xs font-black uppercase">Compiling Resume</h3>
                      <p className="mt-1 text-[10px] text-gray-500">Turning the completed LaTeX into a PDF preview.</p>
                    </div>
                  </div>
                )}
                <iframe
                  key={pdfUrl}
                  title="Compiled resume PDF"
                  src={pdfUrl}
                  onLoad={() => setLoadedPdfUrl(pdfUrl)}
                  className="block h-full min-h-[500px] w-full border-2 border-black bg-white xl:min-h-0"
                />
              </div>
            ) : (
              <div className="flex min-h-[470px] w-full max-w-md flex-col items-center justify-center border-2 border-black bg-white p-8 text-center shadow-[6px_6px_0_0_#9ca3af]">
                {status === "streaming" ? (
                  <><LoaderCircle className="mb-3 h-9 w-9 animate-spin" /><h3 className="text-xs font-black uppercase">Generating LaTeX</h3><p className="mt-1 text-[10px] text-gray-500">PDF compilation starts only after the complete document is received.</p></>
                ) : (
                  <><FileOutput className="mb-3 h-9 w-9 text-gray-400" /><h3 className="text-xs font-black uppercase">No PDF Generated Yet</h3><p className="mt-1 text-[10px] text-gray-500">Your compiled resume will appear here after generation finishes.</p></>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
