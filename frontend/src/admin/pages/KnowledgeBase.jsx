// ══════════════════════════════════════════════
//  ADMIN — pages/KnowledgeBase.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Eye,
  ThumbsUp,
  CheckCircle,
  Plus,
  Trash2,
  ShieldCheck,
  X,
  } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { AdminKnowledgeBaseSkeleton } from "../../shared/components/PageSkeletons";
import {
  getAdminKnowledgeArticles,
  createAdminKnowledgeArticle,
  updateAdminKnowledgeArticle,
  deleteAdminKnowledgeArticle,
  normalizeKnowledgeArticle,
  normalizeKnowledgeArticlesResponse,
} from "../../shared/services/api/knowledgeApi";

const CATEGORIES = ["All", "General", "Onboarding", "Reports", "Technical", "Templates", "Meetings"];

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ title: "", category: "General" });

  const loadArticles = async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await getAdminKnowledgeArticles();
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

  const toggleVerify = async id => {
    const article = articles.find(item => item.id === id);
    if (!article) return;

    try {
      const response = await updateAdminKnowledgeArticle(id, {
        verified: !article.verified,
      });

      const updatedArticle = normalizeKnowledgeArticle(response?.data || response);
      setArticles(existing =>
        existing.map(item => (item.id === id ? updatedArticle : item))
      );
    } catch (updateError) {
      setError(updateError.message || "Failed to update article.");
      setPageState("error");
    }
  };

  const handleDelete = async id => {
    try {
      await deleteAdminKnowledgeArticle(id);
      setArticles(existing => existing.filter(article => article.id !== id));
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete article.");
      setPageState("error");
    }
  };

  const handleAdd = async () => {
    if (!form.title.trim()) {
      setFormError("Article title is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await createAdminKnowledgeArticle({
        title: form.title.trim(),
        category: form.category,
      });

      setArticles(existing => [normalizeKnowledgeArticle(response?.data || response), ...existing]);
      setForm({ title: "", category: "General" });
      setShowForm(false);
    } catch (createError) {
      setFormError(createError.message || "Failed to create article.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(
    () =>
      articles.filter(article =>
        (category === "All" || article.category === category) &&
        article.title.toLowerCase().includes(search.toLowerCase())
      ),
    [articles, category, search]
  );

  if (pageState === "loading") {
    return <AdminKnowledgeBaseSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Knowledge Base"
          subtitle="Manage articles, verify content and track engagement"
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
      <SectionHeader
        title="Knowledge Base"
        subtitle="Manage articles, verify content and track engagement"
        action={
          <button
            onClick={() => setShowForm(current => !current)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={15} /> Add Article
          </button>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <BookOpen size={14} /> {articles.length} Total Articles
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
          <CheckCircle size={14} /> {articles.filter(article => article.verified).length} Verified
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
          <Eye size={14} /> {articles.reduce((sum, article) => sum + article.views, 0)} Total Views
        </div>
      </div>

      {showForm && (
        <Card className="p-5 border-blue-200 bg-blue-50/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">New Article</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={form.title}
              onChange={event => setForm({ ...form, title: event.target.value })}
              placeholder="Article title..."
              className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <select
              value={form.category}
              onChange={event => setForm({ ...form, category: event.target.value })}
              className="px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            >
              {CATEGORIES.filter(item => item !== "All").map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-70"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
          {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(item => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                category === item
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[52rem]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Article", "Category", "Author", "Views", "Helpful", "Verified", "Actions"].map(header => (
                  <th
                    key={header}
                    className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${header === "Actions" ? "text-center" : "text-left"}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(article => (
                <tr key={article.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-blue-50 flex-shrink-0">
                        <BookOpen size={13} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-slate-900 line-clamp-1">{article.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant="gray">{article.category}</Badge></td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{article.author}</td>
                  <td className="px-5 py-4 text-slate-500">
                    <span className="flex items-center gap-1"><Eye size={12} /> {article.views}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    <span className="flex items-center gap-1"><ThumbsUp size={12} /> {article.helpful}</span>
                  </td>
                  <td className="px-5 py-4">
                    {article.verified ? (
                      <Badge variant="success">✓ Verified</Badge>
                    ) : (
                      <Badge variant="warning">Unverified</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => toggleVerify(article.id)}
                        title={article.verified ? "Unverify" : "Verify"}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <ShieldCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        title="Delete"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && articles.length > 0 && (
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

      {articles.length === 0 && (
        <EmptyState
          title="No articles found"
          description="Create the first knowledge article once the admin knowledge API starts returning records."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
            >
              Add First Article
            </button>
          }
        />
      )}
    </div>
  );
};

export default KnowledgeBase;

