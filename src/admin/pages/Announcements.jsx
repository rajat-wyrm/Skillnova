// ════════════════════════════════════════════════════════════
//  ADMIN — pages/Announcements.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Plus, Pin, Trash2, Megaphone, X, Loader2 } from 'lucide-react';
import { Card, Badge, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const VARIANT = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };

const Announcements = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', priority: 'MEDIUM', pinned: false });
  const [filter, setFilter] = useState('All');

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get('/announcements', { params: { limit: 50 } }); setItems(data.items); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const post = async () => {
    if (!form.title || !form.body) return notify.error('Fill required fields.');
    try { await api.post('/announcements', form); notify.success('Announcement posted.'); setShowForm(false); setForm({ title: '', body: '', priority: 'MEDIUM', pinned: false }); fetch(); }
    catch { notify.error('Failed.'); }
  };
  const togglePin = async (a) => {
    try { await api.patch(`/announcements/${a.id}/pin`); fetch(); } catch { notify.error('Failed'); }
  };
  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try { await api.delete(`/announcements/${a.id}`); notify.success('Deleted.'); fetch(); } catch { notify.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const filtered = items.filter((a) => filter === 'All' || a.priority === filter).sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="space-y-6">
      <SectionHeader title="Announcements" subtitle="Create and manage platform-wide announcements"
        action={
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#2563EB' }}>
            <Plus size={15} /> New Announcement
          </button>
        } />

      {showForm && (
        <Card className="p-5" style={{ borderColor: 'rgba(37,99,235,0.3)', background: 'rgba(37,99,235,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Create Announcement</h3>
            <button onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <Input label="Title" placeholder="Announcement title…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Body</label>
              <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the announcement…"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white resize-none" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Priority:</label>
              {['HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button key={p} onClick={() => setForm({ ...form, priority: p })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${form.priority === p
                    ? p === 'HIGH' ? 'bg-red-500 text-white' : p === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'}`}>
                  {p}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
                Pin to top
              </label>
              <button onClick={post} className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#2563EB' }}>Post</button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {['All', 'HIGH', 'MEDIUM', 'LOW'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id} className={`p-5 ${a.pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {a.pinned && <span className="text-xs font-semibold text-blue-600 flex items-center gap-1"><Pin size={11} /> Pinned</span>}
                  <Badge variant={VARIANT[a.priority]}>{a.priority}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{a.body}</p>
                <p className="text-xs text-slate-400 mt-2">{a.author?.name} · {formatDate(a.publishedAt)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => togglePin(a)} title={a.pinned ? 'Unpin' : 'Pin'} className={`p-2 rounded-lg transition ${a.pinned ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}><Pin size={14} /></button>
                <button onClick={() => remove(a)} title="Delete" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><Megaphone size={40} className="mx-auto mb-3 opacity-30 mx-auto" /><p>No announcements.</p></div>}
      </div>
    </div>
  );
};

export default Announcements;
