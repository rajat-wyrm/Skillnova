// ══════════════════════════════════════════════
//  ADMIN — Sidebar.jsx  (UptoSkills — Responsive)
// ══════════════════════════════════════════════

import { useState } from "react";
import {
  LayoutDashboard, Users, BookOpen, FileText,
  BarChart2, Megaphone, Settings, Shield,
  ChevronRight, ChevronLeft, LogOut, ScrollText,
  LayoutGrid, Calendar, Folder, Bell, Webhook, Trophy,
} from "lucide-react";
import { useAuthStore } from '../../lib/auth';
import { APP_CONSTANTS } from '../../shared/config/constants';

const ADMIN_MENU = [
  { id: "admin-dashboard",     label: "Overview",          icon: LayoutDashboard },
  { id: "admin-leaderboard",   label: "Leaderboard",       icon: Trophy          },
  { id: "admin-users",         label: "User Management",   icon: Users           },
  { id: "admin-management",    label: "Intern Management", icon: Shield          },
  { id: "admin-knowledge",     label: "Knowledge Base",    icon: BookOpen        },
  { id: "admin-kanban",        label: "Task Board",        icon: LayoutGrid      },
  { id: "admin-reports",       label: "Reports",           icon: FileText        },
  { id: "admin-analytics",     label: "Analytics",         icon: BarChart2       },
  { id: "admin-calendar",      label: "Calendar",          icon: Calendar        },
  { id: "admin-announcements", label: "Announcements",     icon: Megaphone       },
  { id: "admin-files",         label: "Files",             icon: Folder          },
  { id: "admin-webhooks",      label: "Webhooks",          icon: Webhook         },
  { id: "admin-audit",         label: "Audit Log",         icon: ScrollText      },
  { id: "admin-notifications", label: "Notification Prefs", icon: Bell            },
  { id: "admin-settings",      label: "Settings",          icon: Settings        },
];

const Sidebar = ({ active, onNavigate, forceMobileExpanded }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = forceMobileExpanded ? false : collapsed;
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-300 flex-shrink-0 ${isCollapsed ? "w-16" : "w-60"}`}
      style={{ background: "#1a1f20", borderRight: "1px solid #2d3436" }}
    >
      {/* Logo */}
      <div
        className={`h-20 flex items-center gap-3 flex-shrink-0 ${isCollapsed ? "px-3 justify-center" : "px-4"}`}
        style={{ borderBottom: "1px solid #2d3436" }}
      >
        {!isCollapsed && (
          <div className="flex items-center flex-1 min-w-0">
            <img
              src={APP_CONSTANTS.LOGO_PATH}
              alt="UptoSkills"
              loading="lazy"
              style={{
                height: "48px",
                width: "auto",
                objectFit: "contain",
                mixBlendMode: "lighten",
                filter: "brightness(1.1) contrast(1.05)",
              }}
            />
          </div>
        )}

        {isCollapsed && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #ff6d34, #00bea3)" }}
          >
            U
          </div>
        )}

        {!forceMobileExpanded && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition flex-shrink-0"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => e.currentTarget.style.background = "#2d3436"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
        {ADMIN_MENU.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
              style={{
                background: isActive ? "#ff6d34" : "transparent",
                color: isActive ? "#ffffff" : "#6b7280",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#2d3436"; if (!isActive) e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; if (!isActive) e.currentTarget.style.color = "#6b7280"; }}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div
                  className="absolute left-full ml-2 px-2 py-1 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg"
                  style={{ background: "#0d1011" }}
                >
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2" style={{ borderTop: "1px solid #2d3436" }}>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
          style={{ color: "#6b7280" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#2d3436"; e.currentTarget.style.color = "#ffffff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;