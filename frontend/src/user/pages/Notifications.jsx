import { useEffect, useState } from 'react';
import { Bell, Loader2, Trash2, Check, CheckCheck } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';
import { useNotifications } from '../../shared/hooks/useNotifications';
import { formatRelative } from '../../lib/utils';

const TYPE_ICON = {
  announcement: '📣',
  report: '📄',
  task: '✅',
  meeting: '📅',
  qa: '❓',
  security: '🔒',
  role: '👤',
  status: '⚙️',
  welcome: '👋',
};

const Notifications = () => {
  const { items, unreadCount, markRead, markAllRead, fetchAll } = useNotifications();
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = filter === 'unread' ? items.filter((i) => !i.read) : items;

  const remove = async (n) => {
    try {
      await api.delete(`/notifications/${n.id}/read`);
      fetchAll();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Notifications</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>All</button>
          <button onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>Unread</button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell size={32} className="mx-auto opacity-30" style={{ color: 'var(--muted)' }} />
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>No notifications.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className="p-4" style={{ borderLeft: n.read ? '1px solid var(--border)' : '4px solid #ff6d34' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{n.title}</p>
                  {n.body && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{n.body}</p>}
                  <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{formatRelative(n.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} title="Mark as read" className="p-2 rounded-lg transition" style={{ color: '#059669' }}>
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => remove(n)} title="Dismiss" className="p-2 rounded-lg transition" style={{ color: '#dc2626' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
