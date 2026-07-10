import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../lib/auth';
import api from '../../lib/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState([]);
  const socketRef = useRef(null);

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

    const socket = io(SOCKET_URL || '/', {
      transports: ['websocket', 'polling'],
      auth: { token: useAuthStore.getState().accessToken || undefined },
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    const onNotification = (n) => {
      setItems((arr) => [n, ...arr].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };
    const onBroadcast = (n) => {
      setBroadcasts((arr) => [n, ...arr].slice(0, 50));
    };

    socket.on('notification', onNotification);
    socket.on('broadcast', onBroadcast);

    socket.on('connect', () => {
      socket.on('notification', onNotification);
      socket.on('broadcast', onBroadcast);
    });

    return () => {
      socket.off('notification', onNotification);
      socket.off('broadcast', onBroadcast);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { items, unreadCount, broadcasts, fetchAll, markRead, markAllRead };
}

export default useNotifications;
