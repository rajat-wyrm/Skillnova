// ════════════════════════════════════════════════════════════
//  USER — components/Header.jsx
// ════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { useNotifications } from '../../shared/hooks/useNotifications';
import { initials } from '../../lib/utils';
import { formatRelative } from '../../lib/utils';

import { motion, AnimatePresence } from 'framer-motion';
import { useRipple, Ripples } from '../../shared/components/AnimatedPage';

const MotionDiv = motion.div;
const MotionSpan = motion.span;

const Header = ({ title, onMenuToggle }) => {
  const { user } = useAuthStore();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showNotif, setShowNotif] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [ringBell, setRingBell] = useState(false);
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const { ripples, addRipple } = useRipple();

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [dark]);

  // Trigger bell ringing effect when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      const timer1 = setTimeout(() => {
        setRingBell(true);
      }, 0);
      const timer2 = setTimeout(() => setRingBell(false), 1000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [unreadCount]);

  return (
    <header className="h-16 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0 relative z-30" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
      <button onClick={onMenuToggle} className="md:hidden p-2 rounded-lg -ml-2 mr-1 transition-transform active:scale-95" style={{ color: 'var(--muted)' }}>
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold truncate" style={{ color: 'var(--text)' }}>{title}</h1>
      </div>

      {/* Expanding Search Bar */}
      <MotionDiv 
        className="relative hidden md:block"
        animate={{ width: isSearchFocused ? 320 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input 
          className="pl-9 pr-4 py-2 text-sm rounded-lg w-full focus:outline-none transition-all duration-300" 
          placeholder="Search knowledge base…"
          style={{ 
            background: 'var(--bg)', 
            border: isSearchFocused ? '1px solid #ff6d34' : '1px solid var(--border)', 
            color: 'var(--text)',
            boxShadow: isSearchFocused ? '0 0 10px rgba(255, 109, 52, 0.15)' : 'none'
          }}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)} 
        />
      </MotionDiv>

      <div className="flex items-center gap-1 relative">
        <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: 'var(--muted)' }}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Ringing Bell and Badge animation */}
        <button 
          onClick={(e) => {
            addRipple(e);
            setShowNotif(!showNotif);
          }} 
          className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ripple-container" 
          style={{ color: 'var(--muted)' }}
        >
          <Ripples ripples={ripples} />
          <div className={ringBell ? "bell-ring-active" : ""}>
            <Bell size={18} />
          </div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <MotionSpan 
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                exit={{ scale: 0 }}
                className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" 
                style={{ background: '#ff6d34', boxShadow: '0 0 8px rgba(255, 109, 52, 0.6)' }}
              >
                {unreadCount}
              </MotionSpan>
            )}
          </AnimatePresence>
        </button>

        {/* Popover Dropdown reveal transitions */}
        <AnimatePresence>
          {showNotif && (
            <MotionDiv 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-12 w-80 max-h-[70vh] overflow-y-auto rounded-2xl shadow-2xl z-50 glass"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
                <button onClick={markAllRead} className="text-xs hover:underline transition-all" style={{ color: '#ff6d34' }}>Mark all read</button>
              </div>
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>You're all caught up 🎉</p>
              ) : items.map((n) => (
                <button key={n.id} onClick={() => markRead(n.id)} className="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#ff6d34' }} />}
                  <div className={n.read ? 'pl-5' : ''}>
                    <p className="text-xs leading-snug font-medium" style={{ color: 'var(--text)' }}>{n.title}</p>
                    {n.body && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{n.body}</p>}
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{formatRelative(n.createdAt)}</p>
                  </div>
                </button>
              ))}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Pulse profile avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3" style={{ borderLeft: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md avatar-pulse-active"
          style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}>
          {initials(user?.name)}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text)' }}>{user?.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{user?.department || user?.role}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;

