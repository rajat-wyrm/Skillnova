// ════════════════════════════════════════════════════════════
//  Mentor — Sidebar.jsx
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import {
  LayoutDashboard, Users, FileText, Activity, BookOpen, MessageSquare,
  Megaphone, Bot, User, Settings, ChevronLeft, ChevronRight, LogOut, Trophy,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { APP_CONSTANTS } from '../../shared/config/constants';

const MENU = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'leaderboard',   label: 'Leaderboard',    icon: Trophy          },
  { id: 'interns',       label: 'My Interns',     icon: Users           },
  { id: 'reports',       label: 'Report Reviews', icon: FileText        },
  { id: 'projects',      label: 'Projects',       icon: Activity        },
  { id: 'knowledge',     label: 'Knowledge Base', icon: BookOpen        },
  { id: 'qa',            label: 'Q&A Forum',      icon: MessageSquare   },
  { id: 'announcements', label: 'Announcements',  icon: Megaphone       },
  { id: 'ai',            label: 'AI Assistant',   icon: Bot             },
  { id: 'profile',       label: 'Profile',        icon: User            },
  { id: 'settings',      label: 'Settings',       icon: Settings        },
];

const Sidebar = ({ active, onNavigate, forceMobileExpanded }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = forceMobileExpanded ? false : collapsed;
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside
      className={`h-screen flex flex-col flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'}`}
      style={{ background: '#1f2937', borderRight: '1px solid #2d3436' }}
    >
      <div className={`h-20 flex items-center gap-3 flex-shrink-0 ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`} style={{ borderBottom: '1px solid #2d3436' }}>
        {!isCollapsed && (
          <img src={APP_CONSTANTS.LOGO_PATH} alt="SkillNova" loading="lazy" style={{ height: 48, mixBlendMode: 'lighten' }} />
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>M</div>
        )}
        {!forceMobileExpanded && (
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg transition flex-shrink-0"
            style={{ color: '#9ca3af' }}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
              style={{
                background: isActive ? '#7C3AED' : 'transparent',
                color: isActive ? '#ffffff' : '#9ca3af',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = '#2d3436'; e.currentTarget.style.color = '#ffffff'; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-2" style={{ borderTop: '1px solid #2d3436' }}>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
          style={{ color: '#9ca3af' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2d3436'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          <LogOut size={17} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
