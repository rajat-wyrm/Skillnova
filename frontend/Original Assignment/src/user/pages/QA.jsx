// ══════════════════════════════════════════════
//  USER — pages/QA.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import { ThumbsUp, MessageCircle, Search, Plus, MessageSquare } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";

const INITIAL_QUESTIONS = [
  { id: 1, title: "How do I submit my weekly internship report?",  category: "Reports",        votes: 14, answers: 4, author: "Rahul Sharma", time: "2h ago"  },
  { id: 2, title: "Where can I find project documentation?",        category: "Knowledge Base", votes: 9,  answers: 3, author: "Priya Patel",  time: "5h ago"  },
  { id: 3, title: "How do I schedule a meeting with my mentor?",    category: "Meetings",       votes: 6,  answers: 2, author: "Amit Verma",   time: "1d ago"  },
  { id: 4, title: "What format should my weekly report be in?",     category: "Reports",        votes: 4,  answers: 1, author: "Sneha Reddy",  time: "2d ago"  },
];

const CATEGORIES = ["All", "Projects", "Reports", "Meetings", "Knowledge Base", "Internship"];

const QA = () => {
  const [questions,         setQuestions]         = useState(INITIAL_QUESTIONS);
  const [newQuestion,       setNewQuestion]        = useState("");
  const [search,            setSearch]             = useState("");
  const [selectedCategory,  setSelectedCategory]   = useState("All");

  const handleAdd = () => {
    if (!newQuestion.trim()) return;
    setQuestions([{
      id:       Date.now(),
      title:    newQuestion,
      category: "Projects",
      votes:    0,
      answers:  0,
      author:   "You",
      time:     "Just now",
    }, ...questions]);
    setNewQuestion("");
  };

  const handleUpvote = id =>
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, votes: q.votes + 1 } : q));

  const filtered = questions.filter(q =>
    (selectedCategory === "All" || q.category === selectedCategory) &&
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div 
        className="relative rounded-2xl overflow-hidden p-5 sm:p-8 text-white shadow-xl mb-6"
        style={{ background: "linear-gradient(135deg, #ff6d34 0%, #ff8c5f 100%)" }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,#fff_1px,transparent_1px),radial-gradient(circle_at_80%_20%,#00bea3_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Intern Management Q&A</h1>
            <p className="opacity-90 mt-2 text-sm">
              Ask questions related to projects, meetings and internship tasks.
            </p>
          </div>
          <Badge variant="default" className="text-sm px-4 py-1 self-start sm:self-auto">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Ask a Question */}
      <Card className="p-5" delay={0.1}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Ask a Question</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-lg focus:outline-none transition"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto justify-center px-4 py-2.5 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition flex-shrink-0"
            style={{ background: "#ff6d34" }}
            onMouseEnter={e => e.currentTarget.style.background = "#e85d25"}
            onMouseLeave={e => e.currentTarget.style.background = "#ff6d34"}
          >
            <Plus size={15} /> Post
          </button>
        </div>
      </Card>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-9 py-2.5 text-sm rounded-lg focus:outline-none transition"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                selectedCategory === c
                  ? "text-white"
                  : ""
              }`}
              style={{
                background: selectedCategory === c ? "#ff6d34" : "var(--card)",
                border: selectedCategory === c ? "1px solid #ff6d34" : "1px solid var(--border)",
                color: selectedCategory === c ? "#ffffff" : "var(--text)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {filtered.map((q, i) => (
          <Card key={q.id} hover className="p-5" delay={0.2 + (i * 0.1)}>
            <div className="flex items-start gap-4">

              {/* Vote */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleUpvote(q.id)}
                  className="p-1.5 rounded-lg transition"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#ff6d34"; e.currentTarget.style.background = "rgba(255,109,52,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <ThumbsUp size={15} />
                </button>
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{q.votes}</span>
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold cursor-pointer leading-snug" style={{ color: "var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#ff6d34"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text)"}
                >
                  {q.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                  <Badge variant="gray">{q.category}</Badge>
                  <span>{q.author}</span>
                  <span>{q.time}</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={11} /> {q.answers} answer{q.answers !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: "var(--muted)" }}>
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p>No questions found.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default QA;