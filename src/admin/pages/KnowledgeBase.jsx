// ════════════════════════════════════════════════════════════
//  ADMIN — pages/KnowledgeBase.jsx (API-driven, full editor)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import { Search, BookOpen, Eye, ThumbsUp, Loader2, Plus, Trash2, ShieldCheck, X } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal, Input } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', categoryId: '', tags: '', status: 'PUBLISHED' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([api.get('/kb/articles', { params: { limit: 100 } }), api.get('/kb/categories')]);
      setArticles(a.data.items);
      setCategories(c.data.items);
      c.data.items.length && setForm((f) => f.categoryId ? f : { ...f, categoryId: c.data.items[0].id });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const filtered = articles.filter((a) =>
    (category === 'all' || a.categoryId === category) &&
    (!search || a.title.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleVerify = async (a) => {
    try { await api.patch(`/kb/articles/${a.id}/verify`, { verified: !a.verified }); notify.success(a.verified ? 'Unverified' : 'Verified ✓'); fetch(); }
    catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try { await api.delete(`/kb/articles/${a.id}`); notify.success('Deleted.'); fetch(); }
    catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
  };

  const create = async () => {
    if (!form.title || !form.content || !form.categoryId) return notify.error('Fill required fields.');
    try {
      await api.post('/kb/articles', {
        title: form.title, content: form.content, excerpt: form.excerpt || undefined,
        categoryId: form.categoryId, status: form.status, tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
      notify.success('Article created.');
      setShowForm(false);
      setForm({ title: '', content: '', excerpt: '', categoryId: categories[0]?.id ?? '', tags: '', status: 'PUBLISHED' });
      fetch();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed.'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Knowledge Base" subtitle="Manage articles, verify content and track engagement"
        action={
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#2563EB' }}>
            <Plus size={15} /> Add Article
          </button>
        } />

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>
          <BookOpen size={14} /> {articles.length} Total
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(0,190,163,0.12)', color: '#059669' }}>
          <ShieldCheck size={14} /> {articles.filter((a) => a.verified).length} Verified
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
          <Eye size={14} /> {articles.reduce((s, a) => s + (a.views || 0), 0)} Views
        </div>
      </div>

      {showForm && (
        <Card className="p-5" style={{ borderColor: 'rgba(37,99,235,0.3)', background: 'rgba(37,99,235,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">New Article</h3>
            <button onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <div className="grid gap-3">
            <Input label="Title" placeholder="Article title…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Excerpt" placeholder="One-line summary" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Input label="Tags (comma-separated)" placeholder="guide, setup" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Content (Markdown)</label>
              <textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="# Title&#10;Write your article…"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={create} className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#2563EB' }}>Publish</button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles…"
            className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategory('all')} className={`px-3 py-2 rounded-lg text-xs font-medium ${category === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)} className={`px-3 py-2 rounded-lg text-xs font-medium ${category === c.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[52rem]">
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['Article', 'Category', 'Author', 'Views', 'Helpful', 'Verified', 'Updated', 'Actions'].map((h) => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'Actions' ? 'text-center' : 'text-left'}`} style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(37,99,235,0.12)' }}>
                        <BookOpen size={13} style={{ color: '#2563eb' }} />
                      </div>
                      <span className="font-medium line-clamp-1" style={{ color: 'var(--text)' }}>{a.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant="gray">{a.category?.name}</Badge></td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{a.author?.name}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{a.views}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}><ThumbsUp size={10} className="inline" /> {a.helpful}</td>
                  <td className="px-5 py-4">{a.verified ? <Badge variant="success">✓ Verified</Badge> : <Badge variant="warning">Pending</Badge>}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{formatDate(a.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => toggleVerify(a)} title={a.verified ? 'Unverify' : 'Verify'} className="p-2 rounded-lg transition" style={{ color: '#059669' }}><ShieldCheck size={14} /></button>
                      <button onClick={() => remove(a)} title="Delete" className="p-2 rounded-lg transition" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>No articles.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default KnowledgeBase;
