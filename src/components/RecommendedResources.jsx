import { useState, useCallback } from "react";
import { BookOpen, ExternalLink, Sparkles, ChevronDown, ChevronUp, Loader2, Code2, Brain, MessageSquare, FileText, Play, Globe, GraduationCap } from "lucide-react";

// ─── Curated static resource library keyed by skill/topic ──────────────────
const RESOURCE_LIBRARY = {
  // Programming Languages
  javascript: [
    { title: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "docs", source: "MDN" },
    { title: "JavaScript.info — The Modern JavaScript Tutorial", url: "https://javascript.info/", type: "article", source: "javascript.info" },
    { title: "You Don't Know JS (book series)", url: "https://github.com/getify/You-Dont-Know-JS", type: "book", source: "GitHub" },
  ],
  python: [
    { title: "Python Official Documentation", url: "https://docs.python.org/3/", type: "docs", source: "python.org" },
    { title: "Real Python — Tutorials", url: "https://realpython.com/", type: "article", source: "Real Python" },
    { title: "Python for Everybody (Coursera)", url: "https://www.coursera.org/specializations/python", type: "course", source: "Coursera" },
  ],
  java: [
    { title: "Java SE Documentation (Oracle)", url: "https://docs.oracle.com/en/java/", type: "docs", source: "Oracle" },
    { title: "Baeldung — Java Tutorials", url: "https://www.baeldung.com/", type: "article", source: "Baeldung" },
    { title: "Effective Java (Google Books Preview)", url: "https://books.google.com/books?id=BIpDDgAAQBAJ", type: "book", source: "Google Books" },
  ],
  // Data Structures & Algorithms
  "data structures": [
    { title: "GeeksForGeeks — Data Structures", url: "https://www.geeksforgeeks.org/data-structures/", type: "article", source: "GFG" },
    { title: "Visualgo — DSA Visualizations", url: "https://visualgo.net/", type: "tool", source: "Visualgo" },
    { title: "LeetCode — Practice Problems", url: "https://leetcode.com/problemset/", type: "practice", source: "LeetCode" },
  ],
  algorithms: [
    { title: "Introduction to Algorithms — MIT OCW", url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", type: "course", source: "MIT OCW" },
    { title: "Algorithmist Wiki", url: "https://www.geeksforgeeks.org/fundamentals-of-algorithms/", type: "article", source: "GFG" },
    { title: "Competitive Programming Handbook", url: "https://cses.fi/book/book.pdf", type: "book", source: "CSES" },
  ],
  // System Design
  "system design": [
    { title: "System Design Primer (GitHub)", url: "https://github.com/donnemartin/system-design-primer", type: "docs", source: "GitHub" },
    { title: "High Scalability Blog", url: "http://highscalability.com/", type: "article", source: "High Scalability" },
    { title: "Designing Data-Intensive Applications (excerpt)", url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/", type: "book", source: "O'Reilly" },
  ],
  // Databases
  sql: [
    { title: "W3Schools SQL Tutorial", url: "https://www.w3schools.com/sql/", type: "article", source: "W3Schools" },
    { title: "PostgreSQL Official Docs", url: "https://www.postgresql.org/docs/", type: "docs", source: "PostgreSQL" },
    { title: "SQLZoo — Interactive SQL", url: "https://sqlzoo.net/", type: "practice", source: "SQLZoo" },
  ],
  database: [
    { title: "CMU Database Systems Course", url: "https://15445.courses.cs.cmu.edu/fall2022/", type: "course", source: "CMU" },
    { title: "MongoDB University", url: "https://university.mongodb.com/", type: "course", source: "MongoDB" },
    { title: "Database Design Fundamentals", url: "https://www.geeksforgeeks.org/dbms/", type: "article", source: "GFG" },
  ],
  // Operating Systems
  "operating systems": [
    { title: "OS: Three Easy Pieces (free book)", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", type: "book", source: "OSTEP" },
    { title: "GeeksForGeeks — OS Concepts", url: "https://www.geeksforgeeks.org/operating-systems/", type: "article", source: "GFG" },
    { title: "MIT 6.004 Computation Structures", url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/", type: "course", source: "MIT OCW" },
  ],
  // Networking
  networking: [
    { title: "Computer Networking: Top-Down Approach", url: "https://gaia.cs.umass.edu/kurose_ross/index.php", type: "book", source: "Kurose & Ross" },
    { title: "Cloudflare Learning — Networking", url: "https://www.cloudflare.com/learning/network-layer/what-is-the-network-layer/", type: "article", source: "Cloudflare" },
    { title: "Cisco Networking Academy", url: "https://www.netacad.com/", type: "course", source: "Cisco" },
  ],
  // Communication & Soft Skills
  communication: [
    { title: "Toastmasters — Public Speaking Tips", url: "https://www.toastmasters.org/resources/public-speaking-tips", type: "article", source: "Toastmasters" },
    { title: "MIT OpenCourseWare — Communication", url: "https://ocw.mit.edu/courses/21g-225j-advanced-essay-workshop-spring-2022/", type: "course", source: "MIT OCW" },
    { title: "HBR — Business Communication", url: "https://hbr.org/topic/subject/communication", type: "article", source: "Harvard BR" },
  ],
  "problem solving": [
    { title: "HackerRank — 30 Days of Code", url: "https://www.hackerrank.com/domains/tutorials/30-days-of-code", type: "practice", source: "HackerRank" },
    { title: "Project Euler — Mathematical Challenges", url: "https://projecteuler.net/", type: "practice", source: "Project Euler" },
    { title: "How to Solve It — Polya Method", url: "https://www.sciencedirect.com/book/9780125730501", type: "book", source: "Science Direct" },
  ],
  // React / Frontend
  react: [
    { title: "React Official Documentation", url: "https://react.dev/", type: "docs", source: "React" },
    { title: "React Patterns — kentcdodds.com", url: "https://kentcdodds.com/blog", type: "article", source: "Kent C Dodds" },
    { title: "Scrimba — Learn React", url: "https://scrimba.com/learn/learnreact", type: "course", source: "Scrimba" },
  ],
  // Node.js
  nodejs: [
    { title: "Node.js Official Docs", url: "https://nodejs.org/en/docs", type: "docs", source: "Node.js" },
    { title: "Node.js Best Practices (GitHub)", url: "https://github.com/goldbergyoni/nodebestpractices", type: "docs", source: "GitHub" },
    { title: "The Node Beginner Book", url: "https://www.nodebeginner.org/", type: "book", source: "nodebeginner.org" },
  ],
  // Cloud / DevOps
  cloud: [
    { title: "AWS Free Tier + Documentation", url: "https://aws.amazon.com/free/", type: "docs", source: "AWS" },
    { title: "Google Cloud Skills Boost", url: "https://cloudskillsboost.google/", type: "course", source: "Google Cloud" },
    { title: "Microsoft Azure Learn", url: "https://learn.microsoft.com/en-us/training/azure/", type: "course", source: "Microsoft" },
  ],
  docker: [
    { title: "Docker Official Get Started", url: "https://docs.docker.com/get-started/", type: "docs", source: "Docker" },
    { title: "Play with Docker — Browser Labs", url: "https://labs.play-with-docker.com/", type: "tool", source: "Docker" },
  ],
  // Interview Prep
  "interview preparation": [
    { title: "Cracking the Coding Interview (GFG)", url: "https://www.geeksforgeeks.org/must-do-coding-questions-for-companies-like-amazon-microsoft-adobe/", type: "article", source: "GFG" },
    { title: "NeetCode — Blind 75 Solutions", url: "https://neetcode.io/", type: "practice", source: "NeetCode" },
    { title: "Pramp — Peer Mock Interviews", url: "https://www.pramp.com/", type: "tool", source: "Pramp" },
  ],
};

const TYPE_META = {
  docs: { label: "Docs", icon: FileText, color: "bg-blue-100 text-blue-800 border-blue-300" },
  article: { label: "Article", icon: Globe, color: "bg-green-100 text-green-800 border-green-300" },
  course: { label: "Course", icon: GraduationCap, color: "bg-purple-100 text-purple-800 border-purple-300" },
  book: { label: "Book", icon: BookOpen, color: "bg-orange-100 text-orange-800 border-orange-300" },
  practice: { label: "Practice", icon: Code2, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  tool: { label: "Tool", icon: Brain, color: "bg-pink-100 text-pink-800 border-pink-300" },
  video: { label: "Video", icon: Play, color: "bg-red-100 text-red-800 border-red-300" },
};

function getResourcesForTopics(skillGaps = [], topics = [], role = "") {
  const keys = new Set();
  const normalize = (s) => s?.toLowerCase().trim() || "";

  // Match skill gaps and topics against library keys
  const allTerms = [
    ...skillGaps.map(normalize),
    ...topics.map((t) => normalize(t?.topic || t)),
    normalize(role),
  ];

  for (const term of allTerms) {
    for (const key of Object.keys(RESOURCE_LIBRARY)) {
      if (term.includes(key) || key.includes(term)) {
        keys.add(key);
      }
    }
  }

  // If nothing matched, fallback to interview-prep defaults
  if (keys.size === 0) {
    keys.add("interview preparation");
    keys.add("problem solving");
    keys.add("communication");
  }

  const sections = [];
  for (const key of keys) {
    sections.push({
      topic: key.charAt(0).toUpperCase() + key.slice(1),
      resources: RESOURCE_LIBRARY[key],
    });
  }
  return sections;
}

function ResourceCard({ resource }) {
  const meta = TYPE_META[resource.type] || TYPE_META.article;
  const Icon = meta.icon;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-start gap-3 border-1.5 border-black bg-white p-3 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-bold-sm"
    >
      <div className="mt-0.5 shrink-0 border border-black bg-gray-100 p-1.5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center border px-1.5 py-0.5 text-[9px] font-black uppercase ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-[9px] font-semibold uppercase text-gray-500">{resource.source}</span>
        </div>
        <p className="mt-1 text-xs font-bold leading-snug group-hover:underline">{resource.title}</p>
      </div>
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-black" />
    </a>
  );
}

function TopicSection({ topic, resources, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-1.5 border-black">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-gray-100 px-3 py-2 text-left"
      >
        <span className="text-[11px] font-black uppercase">{topic}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="divide-y divide-black/10 p-2">
          {resources.map((res) => (
            <div key={res.url} className="py-1 first:pt-0 last:pb-0">
              <ResourceCard resource={res} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecommendedResources({ report, loading, onRequestResources }) {
  const [generating, setGenerating] = useState(false);

  const skillGaps = report?.skill_gaps || [];
  const topics = report?.topics || [];
  const role = report?.meta?.role || "";

  const sections = getResourcesForTopics(skillGaps, topics, role);

  const handleGenerate = useCallback(async () => {
    if (!onRequestResources) return;
    setGenerating(true);
    try {
      await onRequestResources();
    } finally {
      setGenerating(false);
    }
  }, [onRequestResources]);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <BookOpen className="h-8 w-8 text-gray-300" />
        <div className="text-xs font-black uppercase text-gray-400">No Interview Results Yet</div>
        <p className="text-[11px] text-gray-500">Complete a mock interview to get personalised resource recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="border-2 border-black bg-purple-600 p-2 text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-black uppercase">Recommended Resources</div>
            <div className="text-[10px] font-semibold text-gray-500">Personalised to your skill gaps & topics</div>
          </div>
        </div>
        {onRequestResources && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || loading}
            className="btn-primary px-3 py-1.5 text-[10px]"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generating ? "GENERATING..." : "ASK AGENT"}
          </button>
        )}
      </div>

      {/* Skill Gaps Summary */}
      {skillGaps.length > 0 && (
        <div className="border-1.5 border-black bg-yellow-50 p-3">
          <div className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase">
            <Brain className="h-3.5 w-3.5" /> Focus Areas from Your Interview
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillGaps.map((gap, i) => (
              <span key={i} className="badge-stark bg-yellow-100 text-[10px]">{gap}</span>
            ))}
          </div>
        </div>
      )}

      {/* Resource sections */}
      <div className="space-y-2">
        {sections.map((section, i) => (
          <TopicSection
            key={section.topic}
            topic={section.topic}
            resources={section.resources}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {/* General interview prep footer */}
      <div className="border-1.5 border-black bg-blue-50 p-3">
        <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-blue-800">
          <MessageSquare className="h-3.5 w-3.5" /> Tip
        </div>
        <p className="text-[11px] font-semibold text-gray-700">
          You can also ask the <strong>AI Interview Coach</strong> in the left chat for more resources — just type <em>"suggest resources for system design"</em> or similar.
        </p>
      </div>
    </div>
  );
}
