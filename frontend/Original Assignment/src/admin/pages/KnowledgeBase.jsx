// ══════════════════════════════════════════════
//  ADMIN — pages/KnowledgeBase.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import {
  Search, BookOpen, Eye, ThumbsUp, CheckCircle,
  Plus, Trash2, ShieldCheck, X,
} from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { MOCK_ARTICLES } from "../../shared/utils/constants";

const CATEGORIES = ["All", "Onboarding", "Reports", "Technical", "Templates", "Meetings"];

const KnowledgeBase = () => {
  const [articles,  setArticles]  = useState(MOCK_ARTICLES);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ title: "", category: "General" });

  const toggleVerify = id =>
    setArticles(as => as.map(a => a.id === id ? { ...a, verified: !a.verified } : a));

  const deleteArticle = id =>
    setArticles(as => as.filter(a => a.id !== id));

  const handleAdd = () => {
    if (!form.title.trim()) return;
    setArticles([{
      id:       Date.now(),
      title:    form.title,
      category: form.category,
      views:    0,
      helpful:  0,
      author:   "Admin",
      date:     "Mar 18, 2026",
      tags:     [],
      verified: false,
    }, ...articles]);
    setForm({ title: "", category: "General" });
    setShowForm(false);
  };

  const filtered = articles.filter(a =>
    (category === "All" || a.category === category) &&
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <SectionHeader
        title="Knowledge Base"
        subtitle="Manage articles, verify content and track engagement"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={15} /> Add Article
          </button>
        }
      />

      {/* Stats Row */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <BookOpen size={14} /> {articles.length} Total Articles
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
          <CheckCircle size={14} /> {articles.filter(a => a.verified).length} Verified
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
          <Eye size={14} /> {articles.reduce((s, a) => s + a.views, 0)} Total Views
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="p-5 border-blue-200 bg-blue-50/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">New Article</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-3">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Article title…"
              className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            >
              {["General","Onboarding","Reports","Technical","Templates","Meetings"].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>
        </Card>
      )}

      {/* Search + Category */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                category === c
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Article Table */}
      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
        <table className="w-full text-sm min-w-[52rem]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Article","Category","Author","Views","Helpful","Verified","Actions"].map(h => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-center" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-50 flex-shrink-0">
                      <BookOpen size={13} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-slate-900 line-clamp-1">{a.title}</span>
                  </div>
                </td>
                <td className="px-5 py-4"><Badge variant="gray">{a.category}</Badge></td>
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{a.author}</td>
                <td className="px-5 py-4 text-slate-500">
                  <span className="flex items-center gap-1"><Eye size={12} /> {a.views}</span>
                </td>
                <td className="px-5 py-4 text-slate-500">
                  <span className="flex items-center gap-1"><ThumbsUp size={12} /> {a.helpful}</span>
                </td>
                <td className="px-5 py-4">
                  {a.verified
                    ? <Badge variant="success">✓ Verified</Badge>
                    : <Badge variant="warning">Unverified</Badge>
                  }
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toggleVerify(a.id)}
                      title={a.verified ? "Unverify" : "Verify"}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <ShieldCheck size={14} />
                    </button>
                    <button
                      onClick={() => deleteArticle(a.id)}
                      title="Delete"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                  No articles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>

    </div>
  );
};

export default KnowledgeBase;