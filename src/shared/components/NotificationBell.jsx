// ════════════════════════════════════════════════════════════
//  NotificationBell — live dropdown, unread count
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../../lib/api';
import { getSocket, connectSocket } from '../../lib/socket';
import { useAuthStore } from '../../lib/auth';
import { formatRelative } from '../../lib/utils';

const NotificationBell = () => {
  const { accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 20 } });
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Live updates over the existing socket connection
  useEffect(() => {
    const socket = getSocket() || connectSocket(accessToken);
    if (!socket) return;

    const onNotification = (notif) => {
      setItems((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [accessToken]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 340;
      // Keep the panel on-screen horizontally
      let left = rect.right - panelWidth;
      if (left < 8) left = 8;
      if (left + panelWidth > window.innerWidth - 8) {
        left = window.innerWidth - panelWidth - 8;
      }
      setCoords({ top: rect.bottom + 8, left });
    }
    setOpen((v) => !v);
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  };

  const markOneRead = async (notif) => {
    if (notif.readAt) return;
    try {
      await api.patch(`/notifications/${notif.id}/read`);
      setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 8,
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: '#ff6d34',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              position: 'sticky',
              top: 0,
              background: 'var(--card)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ff6d34', fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
              No notifications yet.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => markOneRead(n)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: n.readAt ? 'transparent' : 'rgba(255,109,52,0.06)',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: 13, fontWeight: n.readAt ? 500 : 700, color: 'var(--text)', margin: 0 }}>
                  {n.title}
                </p>
                {n.body && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{n.body}</p>
                )}
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
                  {formatRelative(n.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default NotificationBell;