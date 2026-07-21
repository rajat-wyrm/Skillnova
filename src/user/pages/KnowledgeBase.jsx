// ════════════════════════════════════════════════════════════
//  USER — pages/KnowledgeBase.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from 'react';
import {
  Search, BookOpen, Eye, ThumbsUp, ChevronRight, ChevronLeft, Clock, User, CheckCircle, Loader2,
} from 'lucide-react';
import { Card, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

const ArticleDetail = ({ article, onBack, onFeedback }) => (
  <div>
    <button onClick={onBack} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-5 font-medium max-w-full">
      <ChevronLeft size={15} /> Back to Knowledge Base
    </button>

    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="default">{article.category?.name}</Badge>
        {article.verified && <Badge variant="success">✓ Verified</Badge>}
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 dark:text-white break-words">{article.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-5 border-b border-slate-200 dark:border-slate-700">
        <span className="flex items-center gap-1.5"><User size={13} /> {article.author?.name}</span>
        <span className="flex items-center gap-1.5"><Clock size={13} /> {formatDate(article.publishedAt ?? article.createdAt)}</span>
        <span className="flex items-center gap-1.5"><Eye size={13} /> {article.views} views</span>
      </div>

      <Card className="p-6">
        <article className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </article>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6 flex-wrap">
        <p className="text-sm text-slate-500 dark:text-slate-400">Was this helpful?</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onFeedback(article.id, true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition">
            <ThumbsUp size={14} /> Yes ({article.helpful})
          </button>
          <button onClick={() => onFeedback(article.id, false)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            No
          </button>
        </div>
      </div>
    </div>
  </div>
);

const KnowledgeBase = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const [category, setCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [arts, cats] = await Promise.all([
          api.get('/kb/articles', { params: { limit: 100 } }),
          api.get('/kb/categories'),
        ]);
        setArticles(arts.data.items);
        setCategories([{ id: 'all', name: 'All' }, ...cats.data.items]);
      } catch {
        notify.error('Failed to load knowledge base.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const filtered = articles.filter((a) =>
    (category === 'all' || a.categoryId === category) &&
    (!debouncedSearch || a.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const onFeedback = async (id, helpful) => {
    try {
      await api.post(`/kb/articles/${id}/feedback`, { helpful });
      notify.success('Thanks for the feedback!');
      setArticles((arr) => arr.map((a) => a.id === id ? { ...a, helpful: a.helpful + (helpful ? 1 : 0) } : a));
    } catch {
      notify.error('Could not save feedback.');
    }
  };

  const open = async (a) => {
    try {
      const { data } = await api.get(`/kb/articles/${a.id}`);
      setSelected(data.article);
    } catch {
      setSelected(a);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  if (selected) {
    return <ArticleDetail article={selected} onBack={() => setSelected(null)} onFeedback={onFeedback} />;
  }

  return (
    <div className="space-y-6">
      <div className="kb-hero rounded-xl p-5 sm:p-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Knowledge Base</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-5">Find guides, documentation and tutorials</p>
        <div className="relative max-w-lg mx-auto">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${articles.length} articles…`}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${category === c.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'}`}>
            {c.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((article) => (
          <Card key={article.id} hover className="p-5 flex flex-col" onClick={() => open(article)}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30"><BookOpen size={15} className="text-blue-600 dark:text-blue-400" /></div>
              {article.verified && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle size={12} /> Verified
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white leading-snug mb-1 flex-1">{article.title}</h3>
            <p className="text-xs text-slate-400 mb-3">{article.category?.name} · {formatDate(article.publishedAt ?? article.createdAt)}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {(article.tags ?? []).slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs">{t}</span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Eye size={11} /> {article.views}</span>
              <span className="flex items-center gap-1"><ThumbsUp size={11} /> {article.helpful}</span>
              <span className="text-blue-600 font-medium flex items-center gap-1">Read <ChevronRight size={11} /></span>
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
