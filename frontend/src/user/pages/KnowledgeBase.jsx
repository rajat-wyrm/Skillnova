// ══════════════════════════════════════════════
//  USER — pages/KnowledgeBase.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Eye,
  ThumbsUp,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  CheckCircle,
  } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { UserKnowledgeBaseSkeleton } from "../../shared/components/PageSkeletons";
import {
  getKnowledgeArticles,
  normalizeKnowledgeArticlesResponse,
  submitKnowledgeArticleFeedback,
} from "../../shared/services/api/knowledgeApi";

const CATEGORIES = ["All", "General", "Onboarding", "Reports", "Technical", "Templates", "Meetings"];

const ArticleDetail = ({ article, onBack, onFeedback, feedbackState }) => (
  <div>
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-5 font-medium max-w-full"
    >
      <ChevronLeft size={15} /> Back to Knowledge Base
    </button>

    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant="default">{article.category}</Badge>
        {article.verified && <Badge variant="success">✓ Verified</Badge>}
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 break-words">{article.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-5 border-b border-slate-200">
        <span className="flex items-center gap-1.5"><User size={13} /> {article.author}</span>
        <span className="flex items-center gap-1.5"><Clock size={13} /> {article.date}</span>
        <span className="flex items-center gap-1.5"><Eye size={13} /> {article.views} views</span>
      </div>

      <Card className="p-6 space-y-4">
        {article.content ? (
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{article.content}</p>
        ) : (
          <p className="text-slate-600 leading-relaxed">
            Full article content will appear here when the knowledge article payload includes a content field.
          </p>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6 flex-wrap">
        <p className="text-sm text-slate-500">Was this helpful?</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFeedback(article.id, true)}
            disabled={feedbackState === "submitting"}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-70"
          >
            <ThumbsUp size={14} /> Yes ({article.helpful})
          </button>
          <button
            onClick={() => onFeedback(article.id, false)}
            disabled={feedbackState === "submitting"}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition disabled:opacity-70"
          >
            No
          </button>
        </div>
      </div>
    </div>
  </div>
);

const KnowledgeBase = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [articles, setArticles] = useState([]);
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [feedbackState, setFeedbackState] = useState("idle");

  const loadArticles = async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await getKnowledgeArticles();
      setArticles(normalizeKnowledgeArticlesResponse(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load articles.");
      setPageState("error");
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const filtered = useMemo(
    () =>
      articles.filter(article => {
        const matchesCategory = category === "All" || article.category === category;
        const searchableText = `${article.title} ${article.content}`.toLowerCase();
        const matchesSearch = searchableText.includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [articles, category, search]
  );

  const handleFeedback = async (articleId, isHelpful) => {
    setFeedbackState("submitting");

    try {
      const response = await submitKnowledgeArticleFeedback(articleId, {
        helpful: isHelpful,
      });

      const payload = response?.data || response;
      if (payload && typeof payload === "object") {
        setArticles(existing =>
          existing.map(article =>
            article.id === articleId
              ? { ...article, helpful: payload.helpful ?? article.helpful }
              : article
          )
        );
      }
    } catch (feedbackError) {
      setError(feedbackError.message || "Failed to submit article feedback.");
      setPageState("error");
    } finally {
      setFeedbackState("idle");
    }
  };

  if (selected) {
    const selectedArticle = articles.find(article => article.id === selected.id) || selected;
    return (
      <ArticleDetail
        article={selectedArticle}
        onBack={() => setSelected(null)}
        onFeedback={handleFeedback}
        feedbackState={feedbackState}
      />
    );
  }

  if (pageState === "loading") {
    return <UserKnowledgeBaseSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Knowledge Base"
          subtitle="Find guides, documentation and tutorials"
        />
        <ErrorState
          title="Could not load articles"
          description={error}
          action={
            <button
              onClick={loadArticles}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="kb-hero rounded-xl p-5 sm:p-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Knowledge Base</h1>
        <p className="text-slate-500 text-sm mt-1 mb-5">Find guides, documentation and tutorials</p>
        <div className="relative max-w-lg mx-auto">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search knowledge articles..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(item => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              category === item
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">{filtered.length} article{filtered.length !== 1 ? "s" : ""} found</p>

      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(article => (
            <Card
              key={article.id}
              hover
              className="p-5 flex flex-col"
              onClick={() => setSelected(article)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <BookOpen size={15} className="text-blue-600" />
                </div>
                {article.verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle size={12} /> Verified
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 leading-snug mb-1 flex-1">{article.title}</h3>
              <p className="text-xs text-slate-400 mb-3">{article.category} · {article.date}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {article.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{tag}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Eye size={11} /> {article.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp size={11} /> {article.helpful}</span>
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  Read <ChevronRight size={11} />
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No articles match your search"
          description="Try a different keyword or category once the user knowledge API starts returning results."
        />
      )}
    </div>
  );
};

export default KnowledgeBase;

