import { useSelector } from "react-redux";
import { BarChart3, BookOpen, Lightbulb, AlertTriangle, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

const SEVERITY_STYLES = {
  high: { bg: "bg-red-100", border: "border-red-400", text: "text-red-800", badge: "bg-red-200" },
  medium: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-800", badge: "bg-yellow-200" },
  low: { bg: "bg-green-100", border: "border-green-400", text: "text-green-800", badge: "bg-green-200" },
};

const COVERAGE_LABELS = {
  none: { label: "NOT COVERED", style: "bg-red-200" },
  partial: { label: "PARTIAL", style: "bg-yellow-200" },
  full: { label: "COVERED", style: "bg-green-200" },
};

function ConfidenceBar({ value, label }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">{label}</span>}
      <div className="flex-1 h-2.5 bg-gray-200 border border-black overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-black tabular-nums w-10 text-right">{pct}%</span>
    </div>
  );
}

function GapTable({ gaps }) {
  if (!gaps || gaps.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border-2 border-black text-left">
        <thead>
          <tr className="bg-black text-xs uppercase text-white">
            <th className="border-2 border-black p-2">Skill / Topic</th>
            <th className="border-2 border-black p-2">Coverage</th>
            <th className="border-2 border-black p-2">Severity</th>
            <th className="border-2 border-black p-2">Notes</th>
          </tr>
        </thead>
        <tbody className="text-xs font-medium">
          {gaps.map((gap, idx) => {
            const coverage = COVERAGE_LABELS[gap.coverage] || COVERAGE_LABELS.none;
            const severity = SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.medium;
            return (
              <tr key={`gap-${idx}`} className="hover:bg-gray-50">
                <td className="border-2 border-black p-2 font-extrabold">{gap.skill || "—"}</td>
                <td className="border-2 border-black p-2">
                  <span className={`badge-stark text-[10px] ${coverage.style}`}>{coverage.label}</span>
                </td>
                <td className="border-2 border-black p-2">
                  <span className={`badge-stark text-[10px] ${severity.badge}`}>{(gap.severity || "medium").toUpperCase()}</span>
                </td>
                <td className="border-2 border-black p-2 text-[11px]">{gap.notes || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SuggestionCards({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {suggestions.map((s, idx) => (
        <div key={`suggestion-${idx}`} className="border-2 border-black bg-white p-3 shadow-bold-sm">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <h4 className="text-xs font-black uppercase">{s.elective_name || "Suggested Elective"}</h4>
            </div>
            {s.confidence != null && (
              <span className="badge-stark bg-blue-100 text-[9px] whitespace-nowrap">
                {Math.round(s.confidence * 100)}% MATCH
              </span>
            )}
          </div>

          {s.confidence != null && (
            <div className="mb-2">
              <ConfidenceBar value={s.confidence} />
            </div>
          )}

          {s.bridges_skills && s.bridges_skills.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] font-black uppercase text-gray-500 mb-1">Bridges Skills</div>
              <div className="flex flex-wrap gap-1">
                {s.bridges_skills.map((skill, si) => (
                  <span key={si} className="badge-stark bg-green-100 text-[9px]">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {s.topics && s.topics.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] font-black uppercase text-gray-500 mb-1">Topics Covered</div>
              <div className="flex flex-wrap gap-1">
                {s.topics.map((topic, ti) => (
                  <span key={ti} className="badge-stark bg-gray-100 text-[9px]">{topic}</span>
                ))}
              </div>
            </div>
          )}

          {s.rationale && (
            <p className="text-[10px] font-semibold text-gray-600 mt-1 border-t border-gray-200 pt-1.5">
              {s.rationale}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function GapAnalysisPanel() {
  const workspace = useSelector((state) => state.aiChat.gapAnalysisWorkspace);
  const aiLoading = useSelector((state) =>
    Object.values(state.aiChat.requests).some(
      (r) => r.status === "pending" || r.status === "streaming"
    )
  );

  const { status, gaps, suggestions, error } = workspace;
  const hasGaps = gaps && gaps.length > 0;
  const hasSuggestions = suggestions && suggestions.length > 0;
  const hasData = hasGaps || hasSuggestions;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-stark bg-white">
        <div className="flex flex-col justify-between gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black p-2 text-white"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-black uppercase">AI Curriculum Gap Analyser</h3>
              <p className="text-[11px] font-semibold text-gray-600">
                Compare your curriculum against industry-demanded skills.
              </p>
            </div>
          </div>
          <span className={`badge-stark text-[10px] ${
            status === "error" ? "bg-red-100" :
            status === "analysing" ? "bg-yellow-100" :
            hasData ? "bg-green-200" :
            "bg-gray-100"
          }`}>
            {status === "error" ? "ERROR" :
             status === "analysing" ? "ANALYSING…" :
             hasData ? "ANALYSIS READY" :
             "READY"}
          </span>
        </div>

        {/* Empty State */}
        {!hasData && status !== "error" && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 bg-gray-50 p-7 text-center mt-4">
            <TrendingUp className="mb-2 h-8 w-8" />
            <h4 className="text-xs font-black uppercase">Analyse Curriculum Gaps</h4>
            <p className="mt-1 max-w-md text-[11px] text-gray-600">
              Start a conversation in the chat to analyse gaps between your current curriculum
              and industry-demanded skills. The AI will suggest electives to bridge those gaps.
            </p>
            {aiLoading && (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Analysing curriculum data…</span>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {status === "error" && error && (
          <div className="border-2 border-black bg-red-100 p-3 mt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Gap Analysis Table */}
      {hasGaps && (
        <div className="card-stark bg-white">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="text-xs font-black uppercase">Identified Gaps</h3>
            <span className="badge-stark bg-red-100 text-[10px]">{gaps.length} GAPS</span>
          </div>
          <GapTable gaps={gaps} />
        </div>
      )}

      {/* Elective Suggestions */}
      {hasSuggestions && (
        <div className="card-stark bg-white">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-3">
            <CheckCircle2 className="h-4 w-4" />
            <h3 className="text-xs font-black uppercase">Elective Recommendations</h3>
            <span className="badge-stark bg-green-200 text-[10px]">{suggestions.length} SUGGESTIONS</span>
          </div>
          <SuggestionCards suggestions={suggestions} />
        </div>
      )}

      {/* Overall Confidence */}
      {hasData && workspace.confidenceScore != null && (
        <div className="card-stark bg-white">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-black uppercase">Analysis Confidence</span>
          </div>
          <ConfidenceBar value={workspace.confidenceScore} label="Overall" />
          <p className="mt-2 text-[10px] font-semibold text-gray-500">
            Ask follow-up questions in the chat to refine the analysis.
          </p>
        </div>
      )}
    </div>
  );
}
