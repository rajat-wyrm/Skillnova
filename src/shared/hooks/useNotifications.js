import { useEffect, useState, useCallback } from 'react';
import { connectSocket } from '../../lib/socket';
import { useAuthStore } from '../../lib/auth';
import api from '../../lib/api';

export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id);
  const token = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState([]);

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
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      /* ignore */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.post('/notifications/read-all');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!userId) return undefined;

    const loadTimer = window.setTimeout(() => {
      void fetchAll();
    }, 0);

    const socket = connectSocket(token);

    const onNotification = (n) => {
      setItems((arr) => [n, ...arr].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };

    const onBroadcast = (n) => {
      setBroadcasts((arr) => [n, ...arr].slice(0, 50));
    };

    socket.on('notification', onNotification);
    socket.on('broadcast', onBroadcast);

    return () => {
      window.clearTimeout(loadTimer);
      socket.off('notification', onNotification);
      socket.off('broadcast', onBroadcast);
    };
  }, [fetchAll, token, userId]);

  return { items, unreadCount, broadcasts, fetchAll, markRead, markAllRead };
}

export default useNotifications;
