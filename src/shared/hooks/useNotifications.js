// ════════════════════════════════════════════════════════════
//  useNotifications — fetches + subscribes via socket
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../lib/auth';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 50 } });
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

  const markRead = useCallback(async (id) => {
    setItems((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await api.post(`/notifications/${id}/read`); } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await api.post('/notifications/read-all'); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    fetchAll();
    const socket = getSocket();
    if (!socket) return undefined;
    const onNotification = (n) => {
      setItems((arr) => [n, ...arr].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { items, unreadCount, fetchAll, markRead, markAllRead };
}

export default useNotifications;
