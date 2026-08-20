// ════════════════════════════════════════════════════════════
//  Mentor — Header.jsx
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { useNotifications } from '../../shared/hooks/useNotifications';
import { useSearchStore } from '../../lib/searchStore';
import { initials } from '../../lib/utils';

const Header = ({ title, onMenuToggle, onNavigate }) => {
  const { user } = useAuthStore();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { items, unreadCount, markAllRead } = useNotifications();
  const { query: searchQuery, results: searchResults, setQuery: setSearchQuery } = useSearchStore();

  const searchRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [dark]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearch(value.length > 0);
  };

  const handleResultClick = (result) => {
    setShowSearch(false);
    setSearchQuery('');
    onNavigate?.(result.type === 'report' ? 'reports' : 'dashboard');
  };

  return (
    <header className="h-16 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
      <button onClick={onMenuToggle} className="md:hidden p-2 rounded-lg -ml-2 mr-1" style={{ color: 'var(--muted)' }}>
        <Menu size={20} />
      </button>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="p-1.5 rounded-lg flex-shrink-0 hidden sm:flex" style={{ background: 'rgba(124,58,237,0.15)' }}>
          <span className="w-3.5 h-3.5 rounded-full" style={{ background: '#7C3AED' }} />
        </div>
        <h1 className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>{title}</h1>
      </div>

      <div className="relative hidden md:block" ref={searchRef}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input
          className="pl-9 pr-4 py-2 text-sm rounded-lg w-60 focus:outline-none"
          placeholder="Search interns, reports…"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setShowSearch(searchQuery.length > 0)}
        />
        {showSearch && (
          <div className="absolute top-full left-0 mt-1 w-60 rounded-lg shadow-xl z-50 overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {searchResults.length === 0 ? (
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>No results found</div>
            ) : searchResults.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleResultClick(r)}
                className="w-full px-3 py-2 flex items-center gap-2 text-left hover:opacity-80"
                style={{ color: 'var(--text)' }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                  {r.type === 'intern' ? initials(r.name) : '📄'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.type === 'intern' ? r.name : r.title}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.type === 'intern' ? r.department : (r.user?.name || 'No intern')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 relative">
        <button onClick={() => setDark(!dark)} className="p-2 rounded-lg" style={{ color: 'var(--muted)' }}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg" style={{ color: 'var(--muted)' }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#7C3AED' }}>
              {unreadCount}
            </span>
          )}
        </button>
        {showNotif && (
          <div className="absolute right-0 top-12 w-80 max-h-[70vh] overflow-y-auto rounded-2xl shadow-xl z-50"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
              <button onClick={markAllRead} className="text-xs" style={{ color: '#7C3AED' }}>Mark all read</button>
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>No notifications yet.</p>
            ) : items.map((n) => (
              <div key={n.id} className="px-4 py-3 flex gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#7C3AED' }} />}
                <div className={n.read ? 'pl-5' : ''}>
                  <p className="text-xs leading-snug" style={{ color: 'var(--text)' }}>{n.title}</p>
                  {n.body && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{n.body}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-2 pl-3 cursor-pointer"
        style={{ borderLeft: '1px solid var(--border)' }}
        onClick={() => onNavigate?.('profile')}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
          {initials(user?.name)}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text)' }}>{user?.name}</p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: '#7C3AED' }}>Mentor</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
