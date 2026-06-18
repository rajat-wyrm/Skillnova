// ════════════════════════════════════════════════════════════
//  USER — pages/Announcements.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Pin, Megaphone, Loader2 } from 'lucide-react';
import { Card, Badge, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';

const PRIORITY_VARIANTS = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };
const FILTERS = ['All', 'HIGH', 'MEDIUM', 'LOW'];

const Announcements = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements', { params: { limit: 50 } })
      .then((r) => setItems(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items
    .filter((a) => filter === 'All' || a.priority === filter)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Announcements"
        subtitle="Stay updated with platform and internship news"
        action={<span className="text-sm text-slate-400">{items.filter((a) => a.pinned).length} pinned</span>}
      />

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id} className={`p-5 ${a.pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {a.pinned && (
                    <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Pin size={11} /> Pinned
                    </span>
                  )}
                  <Badge variant={PRIORITY_VARIANTS[a.priority]}>{a.priority}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">{a.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{a.body}</p>
                <p className="text-xs text-slate-400 mt-2">{a.author?.name} · {formatDate(a.publishedAt)}</p>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
            <p>No announcements found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
