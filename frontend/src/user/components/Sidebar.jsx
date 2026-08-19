// ════════════════════════════════════════════════════════════
//  USER — components/Sidebar.jsx
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, MessageSquare, FileText,
  CalendarCheck, Bot, Megaphone, BarChart2, User, Settings, Activity,
  LayoutGrid, Calendar, Folder, Bell, Download, ChevronRight, ChevronLeft, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

const MENU = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
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
  { id: 'profile',        label: 'Profile',        icon: User            },
  { id: 'settings',       label: 'Settings',       icon: Settings        },
];

import { motion, AnimatePresence } from 'framer-motion';
import { useRipple, Ripples } from '../../shared/components/AnimatedPage';

const MotionDiv = motion.div;
const MotionImg = motion.img;
const MotionSpan = motion.span;

const Sidebar = ({ active, onNavigate, forceMobileExpanded }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = forceMobileExpanded ? false : collapsed;
  const logout = useAuthStore((s) => s.logout);
  const { ripples, addRipple } = useRipple();

  return (
    <aside
      className={`h-screen flex flex-col flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'} relative`}
      style={{ 
        background: '#1e2426', 
        borderRight: '1px solid #2d3436',
        boxShadow: isCollapsed ? '2px 0 10px rgba(0,0,0,0.1)' : '4px 0 20px rgba(0,0,0,0.15)'
      }}
    >
      <div className={`h-20 flex items-center gap-3 flex-shrink-0 ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`} style={{ borderBottom: '1px solid #2d3436' }}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <MotionDiv
              key="full-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <MotionImg 
                src="/logo.png" 
                alt="SkillNova" 
                style={{ height: 48, mixBlendMode: 'lighten', filter: 'brightness(1.1) contrast(1.05)' }} 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </MotionDiv>
          ) : (
            <MotionDiv
              key="mini-logo"
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}
            >
              U
            </MotionDiv>
          )}
        </AnimatePresence>
        {!forceMobileExpanded && (
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1.5 rounded-lg flex-shrink-0 hover:bg-[#2d3436] transition-colors ml-auto" 
            style={{ color: '#9ca3af' }}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 no-scrollbar">
        {MENU.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => {
                addRipple(e);
                onNavigate(item.id);
              }}
              title={isCollapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group overflow-hidden ripple-container"
              style={{
                color: isActive ? '#ffffff' : '#9ca3af',
              }}
              onMouseEnter={(e) => { 
                if (!isActive) { 
                  e.currentTarget.style.background = '#2d3436'; 
                  e.currentTarget.style.color = '#ffffff'; 
                } 
              }}
              onMouseLeave={(e) => { 
                if (!isActive) { 
                  e.currentTarget.style.background = 'transparent'; 
                  e.currentTarget.style.color = '#9ca3af'; 
                } 
              }}
            >
              {/* Active Indicator Sliding Background */}
              {isActive && (
                <MotionDiv
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-[#ff6d34] z-0 rounded-lg shadow-[0_0_15px_rgba(255,109,52,0.4)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* MD3 Ripple Effect */}
              <Ripples ripples={ripples} />

              <MotionDiv
                className="z-10 flex-shrink-0"
                whileHover={{ rotate: 15 }}
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon size={17} />
              </MotionDiv>
              
              {!isCollapsed && (
                <MotionSpan 
                  className="truncate z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </MotionSpan>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-200"
                  style={{ background: '#1a1f20' }}>{item.label}</div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2" style={{ borderTop: '1px solid #2d3436' }}>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition relative overflow-hidden ripple-container"
          style={{ color: '#9ca3af' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2d3436'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
          <LogOut size={17} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

