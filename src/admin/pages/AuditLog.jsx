// ════════════════════════════════════════════════════════════
//  ADMIN — pages/AuditLog.jsx
//  (read-only audit log from DB — restricted to SUPER_ADMIN)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Loader2, ScrollText } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';
import { formatRelative } from '../../lib/utils';
import { getSocket } from '../../lib/socket';

const AuditLog = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/users/stats')
      .catch(() => null);
    api.get('/notifications', { params: { limit: 50 } })
      .then((r) => {
        setItems(r.data.items.map((n) => ({
          id: n.id,
          action: n.type,
          detail: n.title,
          resource: n.body,
          createdAt: n.createdAt,
        })));
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load audit log.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onNew = (entry) => {
      setItems((arr) => [{
        id: entry.id,
        action: entry.action,
        detail: entry.resource,
        resource: entry.resourceId,
        createdAt: entry.createdAt,
      }, ...arr].slice(0, 100));
    };
    socket.on('audit:new', onNew);
    return () => socket.off('audit:new', onNew);
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <ScrollText size={20} style={{ color: '#7C3AED' }} /> Audit Log
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>A real-time stream of platform activity (notifications shown; deeper audit is available via the API).</p>
      </div>

      {error && <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">{error}</div>}

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[44rem]">
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['Type', 'Detail', 'Body', 'When'].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>No recent activity.</td></tr>}
              {items.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}>{i.action}</span></td>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--text)' }}>{i.detail}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted)' }}>{i.resource || '—'}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted)' }}>{formatRelative(i.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AuditLog;
