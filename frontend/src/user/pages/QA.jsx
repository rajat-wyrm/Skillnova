// ══════════════════════════════════════════════
//  USER — pages/QA.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Search,
  Plus,
  MessageSquare,
  } from "lucide-react";
import { Card, Badge } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { UserQASkeleton } from "../../shared/components/PageSkeletons";
import { createQaQuestion, getQaQuestions, upvoteQaQuestion } from "../../shared/services/api/qaApi";

const CATEGORIES = ["All", "Projects", "Reports", "Meetings", "Knowledge Base", "Internship"];

const normalizeQaQuestion = question => ({
  id: question?.id,
  title: question?.title || "Untitled question",
  category: question?.category || "Projects",
  votes: Number(question?.votes) || 0,
  answers: Number(question?.answers) || 0,
  author: question?.author || "Unknown",
  time: question?.time || "Recently",
});

const normalizeQaQuestionsResponse = response => {
  const items = response?.data || response?.items || response || [];
  return Array.isArray(items) ? items.map(normalizeQaQuestion) : [];
};

const QA = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  const fetchQuestions = async () => getQaQuestions();

  useEffect(() => {
    let isActive = true;

    const initializeQuestions = async () => {
      try {
        const response = await fetchQuestions();
        if (!isActive) return;

        setQuestions(normalizeQaQuestionsResponse(response));
        setPageState("ready");
      } catch (loadError) {
        if (!isActive) return;

        setError(loadError.message || "Failed to load questions.");
        setPageState("error");
      }
    };

    initializeQuestions();

    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await fetchQuestions();
      setQuestions(normalizeQaQuestionsResponse(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load questions.");
      setPageState("error");
    }
  };

  const handleAdd = async () => {
    if (!newQuestion.trim()) {
      setFormError("Question text is required.");
      return;
    }

    setFormError("");

    try {
      const response = await createQaQuestion({
        title: newQuestion.trim(),
        category: "Projects",
        author: "You",
      });

      setQuestions(existing => [normalizeQaQuestion(response?.data || response), ...existing]);
      setNewQuestion("");
    } catch (createError) {
      setFormError(createError.message || "Failed to create question.");
    }
  };

  const handleUpvote = async id => {
    setActiveQuestionId(id);

    try {
      const response = await upvoteQaQuestion(id);
      const updated = normalizeQaQuestion(response?.data || response);
      setQuestions(existing => existing.map(question => (question.id === id ? updated : question)));
    } catch (voteError) {
      setError(voteError.message || "Failed to upvote question.");
      setPageState("error");
    } finally {
      setActiveQuestionId(null);
    }
  };

  const filtered = useMemo(
    () =>
      questions.filter(question =>
        (selectedCategory === "All" || question.category === selectedCategory) &&
        question.title.toLowerCase().includes(search.toLowerCase())
      ),
    [questions, search, selectedCategory]
  );

  if (pageState === "loading") {
    return <UserQASkeleton />;
  }

  if (pageState === "error") {
    return (
      <ErrorState
        title="Could not load Q&A"
        description={error}
        action={
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#ff6d34" }}
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
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

      <Card className="p-5" delay={0.1}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Ask a Question</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newQuestion}
            onChange={event => setNewQuestion(event.target.value)}
            onKeyDown={event => event.key === "Enter" && handleAdd()}
            className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-lg focus:outline-none transition"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto justify-center px-4 py-2.5 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition flex-shrink-0"
            style={{ background: "#ff6d34" }}
          >
            <Plus size={15} /> Post
          </button>
        </div>
        {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 py-2.5 text-sm rounded-lg focus:outline-none transition"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition"
              style={{
                background: selectedCategory === category ? "#ff6d34" : "var(--card)",
                border: selectedCategory === category ? "1px solid #ff6d34" : "1px solid var(--border)",
                color: selectedCategory === category ? "#ffffff" : "var(--text)",
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((question, index) => (
            <Card key={question.id} hover className="p-5" delay={0.2 + index * 0.1}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleUpvote(question.id)}
                    disabled={activeQuestionId === question.id}
                    className="p-1.5 rounded-lg transition"
                    style={{ color: "var(--muted)" }}
                  >
                    <ThumbsUp size={15} />
                  </button>
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{question.votes}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold cursor-pointer leading-snug" style={{ color: "var(--text)" }}>
                    {question.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                    <Badge variant="gray">{question.category}</Badge>
                    <span>{question.author}</span>
                    <span>{question.time}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={11} /> {question.answers} answer{question.answers !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No questions found"
          description="Post the first question or try a different search term to explore the discussion board."
          action={
            <button
              onClick={() => setSelectedCategory("All")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
            >
              Show All
            </button>
          }
        />
      )}
    </div>
  );
};

export default QA;


