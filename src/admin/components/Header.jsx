// ════════════════════════════════════════════════════════════
//  ADMIN — Header.jsx
// ════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { Bell, Search, Shield, Sun, Moon, Menu } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { useNotifications } from '../../shared/hooks/useNotifications';
import { formatRelative, initials } from '../../lib/utils';
import { APP_CONSTANTS } from '../../shared/config/constants';

const Header = ({ title, onMenuToggle }) => {
  const { user } = useAuthStore();
  const [showNotif, setShowNotif] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem(APP_CONSTANTS.THEME_STORAGE_KEY) === 'dark');
  const { items, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem(APP_CONSTANTS.THEME_STORAGE_KEY, 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem(APP_CONSTANTS.THEME_STORAGE_KEY, 'light'); }
  }, [dark]);

  return (
    <header className="h-16 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
      <button onClick={onMenuToggle} className="md:hidden p-2 rounded-lg -ml-2 mr-1" style={{ color: 'var(--muted)' }}>
        <Menu size={20} />
      </button>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="p-1.5 rounded-lg flex-shrink-0 hidden sm:flex" style={{ background: 'rgba(255,109,52,0.15)' }}>
          <Shield size={14} style={{ color: '#ff6d34' }} />
        </div>
        <h1 className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>{title}</h1>
      </div>

      <div className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input className="pl-9 pr-4 py-2 text-sm rounded-lg w-60 focus:outline-none" placeholder="Search users, reports…"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          onFocus={(e) => (e.target.style.borderColor = '#ff6d34')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
      </div>

      <div className="flex items-center gap-1 relative">
        <button onClick={() => setDark(!dark)} className="p-2 rounded-lg" style={{ color: 'var(--muted)' }}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={dark}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg" style={{ color: 'var(--muted)' }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#ff6d34' }}>
              {unreadCount}
            </span>
          )}
        </button>
        {showNotif && (
          <div className="absolute right-0 top-12 w-80 max-h-[70vh] overflow-y-auto rounded-2xl shadow-xl z-50" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
              <button onClick={markAllRead} className="text-xs" style={{ color: '#ff6d34' }}>Mark all read</button>
            </div>
            {items.length === 0 ? <p className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>No notifications yet.</p> : items.map((n) => (
              <button key={n.id} onClick={() => markRead(n.id)} className="w-full text-left px-4 py-3 flex gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#ff6d34' }} />}
                <div className={n.read ? 'pl-5' : ''}>
                  <p className="text-xs leading-snug font-medium" style={{ color: 'var(--text)' }}>{n.title}</p>
                  {n.body && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{n.body}</p>}
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{formatRelative(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3" style={{ borderLeft: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md"
          style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}>
          {initials(user?.name)}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text)' }}>{user?.name}</p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: '#ff6d34' }}>{user?.role}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
