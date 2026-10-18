import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { api } from "../lib/api";

export default function ResumeScoreCard({ scoreData, onResumeUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file (.pdf)");
      return;
    }
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await api.uploadResume(formData);
      if (onResumeUploaded) onResumeUploaded(res);
    } catch (err) {
      setError("Failed to upload and score resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleSampleResumeScore = async () => {
    setUploading(true);
    try {
      const sampleText = `Alex Rivera
Computer Science Student | CGPA 8.5 | alex.cs2026@college.edu
SKILLS: React, TypeScript, Node.js, Python, PostgreSQL, Data Structures, System Design, REST APIs, Git, Docker.
PROJECTS:
- Placement Automation Engine: Built full stack React + Node.js portal with ATS resume scoring and drive matching.
- Realtime AI Assistant: Implemented tool-scoped AI chat agent using Anthropic Claude API.
EXPERIENCE: Software Engineering Intern at TechLabs (Summer 2025). Optimized DB query performance by 35%.`;
      
      const formData = new FormData();
      formData.append("text", sampleText);
      const res = await api.uploadResume(formData);
      if (onResumeUploaded) onResumeUploaded(res);
    } catch (e) {
      setError("Sample evaluation failed");
    } finally {
      setUploading(false);
    }
  };

  const score = scoreData?.score || 0;
  const feedback = scoreData?.feedback || {};
  const rubric = feedback.rubricBreakdown || feedback["rubric Breakdown"] || {
    skillsMatch: 80,
    projectDepth: 75,
    quantifiedImpact: 70,
    clarityAndFormatting: 85
  };

  return (
    <div className="card-stark bg-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h2 className="text-base font-black uppercase">AUTOMATED RESUME SCORE</h2>
        </div>
        <span className="badge-stark bg-yellow-200">ATS RUBRIC V1</span>
      </div>

      {error && (
        <div className="mb-4 p-2.5 bg-red-100 border-2 border-black text-xs font-bold text-red-900">
          {error}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Score Display (Column 1) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-2 border-black bg-gray-50 shadow-bold-sm text-center">
          <div className="text-xs font-black uppercase text-gray-600 mb-1">CUMULATIVE ATS SCORE</div>
          <div className="text-5xl font-black tracking-tight my-2">
            {score}<span className="text-xl font-bold text-gray-500">/100</span>
          </div>
          <div className="w-full bg-white border-2 border-black h-3 mb-3 p-0.5">
            <div
              className="bg-black h-full transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 border-2 border-black bg-white">
            {score >= 80 ? "STRONG RESUME" : score >= 60 ? "AVERAGE FIT" : "NEEDS IMPROVEMENT"}
          </span>
        </div>

        {/* Rubric Breakdown Progress (Column 2) */}
        <div className="md:col-span-8 space-y-2.5">
          <div className="text-xs font-extrabold uppercase mb-2">RUBRIC METRIC BREAKDOWN</div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>SKILLS MATCH & RELEVANCE</span>
              <span>{rubric.skillsMatch}%</span>
            </div>
            <div className="w-full bg-gray-100 border-2 border-black h-2.5">
              <div className="bg-black h-full" style={{ width: `${rubric.skillsMatch}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>PROJECT DEPTH & TECHNICALITY</span>
              <span>{rubric.projectDepth}%</span>
            </div>
            <div className="w-full bg-gray-100 border-2 border-black h-2.5">
              <div className="bg-black h-full" style={{ width: `${rubric.projectDepth}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>QUANTIFIED IMPACT & METRICS</span>
              <span>{rubric.quantifiedImpact}%</span>
            </div>
            <div className="w-full bg-gray-100 border-2 border-black h-2.5">
              <div className="bg-black h-full" style={{ width: `${rubric.quantifiedImpact}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>CLARITY & FORMATTING</span>
              <span>{rubric.clarityAndFormatting}%</span>
            </div>
            <div className="w-full bg-gray-100 border-2 border-black h-2.5">
              <div className="bg-black h-full" style={{ width: `${rubric.clarityAndFormatting}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* Strengths & Improvements */}
      {feedback.strengths && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-black pt-4">
          <div>
            <h4 className="text-xs font-extrabold uppercase text-green-900 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-black" />
              KEY STRENGTHS
            </h4>
            <ul className="text-xs font-medium space-y-1">
              {feedback.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase text-amber-900 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-4 h-4 text-black" />
              RECOMMENDED IMPROVEMENTS
            </h4>
            <ul className="text-xs font-medium space-y-1">
              {(feedback.improvements || []).map((imp, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* PDF Upload Dropzone */}
      <div className="mt-5 border-t-2 border-black pt-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed border-black p-4 text-center transition-all ${
            dragOver ? "bg-yellow-100" : "bg-gray-50"
          }`}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-black" />
          <p className="text-xs font-bold uppercase mb-1">
            {uploading ? "PARSING PDF & SCORING WITH AI..." : "DRAG & DROP RESUME PDF HERE"}
          </p>
          <p className="text-[11px] font-semibold text-gray-600 mb-3">
            Or select a PDF file from your computer for instant ATS scoring
          </p>

          <div className="flex justify-center gap-3">
            <label className="btn-primary text-xs py-1.5 px-3 cursor-pointer">
              <span>SELECT RESUME PDF</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
            </label>

            <button
              onClick={handleSampleResumeScore}
              disabled={uploading}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>TEST SAMPLE RESUME</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
