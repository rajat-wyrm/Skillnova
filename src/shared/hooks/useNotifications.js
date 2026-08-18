import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../../lib/auth";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";

export function useNotifications() {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      const [{ data: listData }, { data: countData }] = await Promise.all([
        api.get("/notifications", { params: { limit: 50 } }),
        api.get("/notifications/unread-count"),
      ]);
      setItems(listData.items || []);
      setUnreadCount(countData.unreadCount ?? 0);
    } catch (e) {
      void e; // Notifications are non-critical.
    }
  }, []);

  const markRead = useCallback(async (id) => {
    setItems((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
    try { await api.post(`/notifications/${id}/read`); } catch (e) { void e; }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await api.post("/notifications/read-all"); } catch (e) { void e; }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    // Call fetchAll in an async IIFE to avoid synchronous setState within effect
    (async () => { await fetchAll(); })();
    const socket = getSocket();
    if (!socket) return undefined;

    const onNotification = (notification) => {
      setItems((arr) => [notification, ...arr].slice(0, 50));
      setUnreadCount((count) => count + 1);
    };

    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [user, fetchAll]);

  return { items, unreadCount, fetchAll, markRead, markAllRead };
}

export default useNotifications;
