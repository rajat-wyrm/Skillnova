// ══════════════════════════════════════════════
//  USER — Sidebar.jsx  (UptoSkills — Responsive)
// ══════════════════════════════════════════════

import { useState } from "react";
import {
  LayoutDashboard, BookOpen, MessageSquare, FileText,
  Bot, Megaphone, BarChart2, User, Settings, Activity,
  ChevronRight, ChevronLeft, LogOut,
} from "lucide-react";

const USER_MENU = [
  { id: "dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { id: "knowledge",      label: "Knowledge Base", icon: BookOpen        },
  { id: "project_flow",   label: "Project Flow",   icon: Activity        },
  { id: "reports",        label: "My Reports",     icon: FileText        },
  { id: "meetings",       label: "AI Assistant",   icon: Bot             },
  { id: "announcements",  label: "Announcements",  icon: Megaphone       },
  { id: "analytics",      label: "Analytics",      icon: BarChart2       },
  { id: "profile",        label: "Profile",        icon: User            },
  { id: "settings",       label: "Settings",       icon: Settings        },
];

const Sidebar = ({ active, onNavigate, onLogout, forceMobileExpanded }) => {
  const [collapsed, setCollapsed] = useState(false);

  // On mobile overlay, always show expanded
  const isCollapsed = forceMobileExpanded ? false : collapsed;

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-300 flex-shrink-0 ${isCollapsed ? "w-16" : "w-60"}`}
      style={{ background: "#2D3436", borderRight: "1px solid #3d4446" }}
    >
      {/* Logo */}
      <div
        className={`h-20 flex items-center border-b gap-3 flex-shrink-0 ${isCollapsed ? "px-3 justify-center" : "px-4"}`}
        style={{ borderColor: "#3d4446" }}
      >
        {!isCollapsed && (
          <div className="flex items-center flex-1 min-w-0">
            <img
              src="/logo.png"
              alt="UptoSkills"
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

        {/* Hide collapse button when mobile overlay is open */}
        {!forceMobileExpanded && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition flex-shrink-0"
            style={{ color: "#9ca3af" }}
            onMouseEnter={e => e.target.style.background = "#3d4446"}
            onMouseLeave={e => e.target.style.background = "transparent"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
        {USER_MENU.map(item => {
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
                color: isActive ? "#ffffff" : "#9ca3af",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#3d4446"; if (!isActive) e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; if (!isActive) e.currentTarget.style.color = "#9ca3af"; }}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div
                  className="absolute left-full ml-2 px-2 py-1 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg"
                  style={{ background: "#1a1f20" }}
                >
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2" style={{ borderTop: "1px solid #3d4446" }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
          style={{ color: "#9ca3af" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#3d4446"; e.currentTarget.style.color = "#ffffff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;