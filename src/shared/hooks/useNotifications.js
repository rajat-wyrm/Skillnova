// Lightweight notifications hook: fetch list + subscribe to socket
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
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 50 } }),
        api.get('/notifications/unread-count'),
      ]);
      setItems(listRes?.data?.items ?? []);
      setUnreadCount(countRes?.data?.unreadCount ?? 0);
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
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      return undefined;
    }

    void fetchAll();

    const socket = getSocket();
    if (!socket) return undefined;

    const onNotification = (n) => {
      setItems((arr) => [n, ...arr].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification', onNotification);
    return () => {
      try { socket.off('notification', onNotification); } catch { /* ignore */ }
    };
  }, [user, fetchAll]);

  return { items, unreadCount, fetchAll, markRead, markAllRead };
}

export default useNotifications;
