// ══════════════════════════════════════════════
//  USER — pages/KnowledgeBase.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import {
  Search, BookOpen, Eye, ThumbsUp, ChevronRight,
  ChevronLeft, Clock, User, CheckCircle,
} from "lucide-react";
import { Card, Badge } from "../../shared/components/UI";
import { MOCK_ARTICLES } from "../../shared/utils/constants";

const CATEGORIES = ["All", "Onboarding", "Reports", "Technical", "Templates", "Meetings"];

/* ── Article Detail ─── */
const ArticleDetail = ({ article, onBack }) => (
  <div>
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-5 font-medium max-w-full"
    >
      <ChevronLeft size={15} /> Back to Knowledge Base
    </button>

    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-3">
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
        <p className="text-slate-600 leading-relaxed">
          This is the full content of <strong>{article.title}</strong>. In a live implementation this
          section renders rich text — headings, code blocks, embedded videos, images and more powered
          by a WYSIWYG editor like TipTap or Slate.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Knowledge articles help interns find answers fast, collaborate effectively, and maintain a
          shared source of truth across all departments. Admins can verify articles to mark them as
          authoritative.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          💡 <strong>Pro tip:</strong> Use the search bar at the top to quickly find related articles
          or filter by category.
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6 flex-wrap">
        <p className="text-sm text-slate-500">Was this helpful?</p>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition">
            <ThumbsUp size={14} /> Yes ({article.helpful})
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">
            No
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Main Page ─── */
const KnowledgeBase = () => {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <ArticleDetail article={selected} onBack={() => setSelected(null)} />;
  }

  const filtered = MOCK_ARTICLES.filter(a =>
    (category === "All" || a.category === category) &&
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Hero Search Banner */}
      <div className="kb-hero rounded-xl p-5 sm:p-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Knowledge Base</h1>
        <p className="text-slate-500 text-sm mt-1 mb-5">Find guides, documentation and tutorials</p>
        <div className="relative max-w-lg mx-auto">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search 100+ articles…"
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              category === c
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400">{filtered.length} article{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Articles Grid */}
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
              {article.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{t}</span>
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

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>No articles match your search.</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;