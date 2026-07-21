// ════════════════════════════════════════════════════════════
//  USER — components/Sidebar.jsx
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, MessageSquare, FileText,
  CalendarCheck, Bot, Megaphone, BarChart2, User, Settings, Activity,
  LayoutGrid, Calendar, Folder, Bell, Download, ChevronRight, ChevronLeft, LogOut, Target, Trophy,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { APP_CONSTANTS } from '../../shared/config/constants';

const MENU = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'leaderboard',    label: 'Leaderboard',    icon: Trophy          },
  { id: 'knowledge',      label: 'Knowledge Base', icon: BookOpen        },
  { id: 'project_flow',   label: 'Project Flow',   icon: Activity        },
  { id: 'kanban',         label: 'Task Board',     icon: LayoutGrid      },
  { id: 'reports',        label: 'My Reports',     icon: FileText        },
  { id: 'attendance',     label: 'Attendance',     icon: CalendarCheck   },
  { id: 'calendar',       label: 'Calendar',       icon: Calendar        },
  { id: 'files',          label: 'Files',          icon: Folder          },
  { id: 'ai',             label: 'AI Assistant',   icon: Bot             },
  { id: 'qa',             label: 'Q&A Forum',      icon: MessageSquare   },
  { id: 'notifications',  label: 'Notifications',  icon: Bell            },
  { id: 'announcements',  label: 'Announcements',  icon: Megaphone       },
  { id: 'analytics',      label: 'Analytics',      icon: BarChart2       },
  { id: 'exports',        label: 'Data Export',    icon: Download        },
  { id: 'skill_gap',      label: 'Skill Gap',      icon: Target          },
  { id: 'profile',        label: 'Profile',        icon: User            },
  { id: 'settings',       label: 'Settings',       icon: Settings        },
];

const Sidebar = ({ active, onNavigate, forceMobileExpanded }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = forceMobileExpanded ? false : collapsed;
  const logout = useAuthStore((s) => s.logout);

  const handleKeyDown = (e, index) => {
    let nextIndex = index;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % MENU.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + MENU.length) % MENU.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate(MENU[index].id);
      return;
    } else {
      return;
    }
    const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
    if (buttons?.[nextIndex]) buttons[nextIndex].focus();
  };

  return (
    <aside
      className={`h-screen flex flex-col flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'}`}
      style={{ background: '#2D3436', borderRight: '1px solid #3d4446' }}
    >
      <div className={`h-20 flex items-center gap-3 flex-shrink-0 ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`} style={{ borderBottom: '1px solid #3d4446' }}>
        {!isCollapsed && (
          <img src={APP_CONSTANTS.LOGO_PATH} alt="SkillNova" loading="lazy" style={{ height: 48, mixBlendMode: 'lighten', filter: 'brightness(1.1) contrast(1.05)' }} />
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}>U</div>
        )}
        {!forceMobileExpanded && (
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg flex-shrink-0" style={{ color: '#9ca3af' }}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar" role="navigation" aria-label="Main menu">
        {MENU.map((item, index) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="menuitem"
              title={isCollapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
              style={{
                background: isActive ? '#ff6d34' : 'transparent',
                color: isActive ? '#ffffff' : '#9ca3af',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = '#3d4446'; e.currentTarget.style.color = '#ffffff'; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg"
                  style={{ background: '#1a1f20' }}>{item.label}</div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2" style={{ borderTop: '1px solid #3d4446' }}>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
          style={{ color: '#9ca3af' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#3d4446'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
          <LogOut size={17} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
