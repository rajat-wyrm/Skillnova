// ══════════════════════════════════════════════
//  USER — Sidebar.jsx  (UptoSkills — Responsive)
// ══════════════════════════════════════════════

import { useState } from "react";
import {
  Activity,
  BarChart2,
  BookOpen,
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
} from "lucide-react";

const USER_MENU = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "project_flow", label: "Project Flow", icon: Activity },
  { id: "reports", label: "My Reports", icon: FileText },
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ active, onNavigate, onLogout, forceMobileExpanded }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const isCollapsed = forceMobileExpanded ? false : collapsed;

  const showTooltip = (label, event) => {
    if (!isCollapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 12 });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <div className="relative h-screen flex-shrink-0 overflow-visible">
      <aside
        className="h-full flex flex-col overflow-x-hidden transition-all duration-300 ease-in-out"
        style={{
          width: isCollapsed ? "64px" : "240px",
          background: "#2D3436",
          borderRight: "1px solid #3d4446",
        }}
      >
        <div
          className="h-20 flex items-center flex-shrink-0 px-4"
          style={{ borderBottom: "1px solid #3d4446" }}
        >
          {isCollapsed ? (
            <div className="relative flex items-center justify-center w-full">
              <button
                onClick={() => setCollapsed(false)}
                aria-label="Open sidebar"
                className="group w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #ff6d34, #00bea3)" }}
                onMouseEnter={e => {
                  showTooltip("Open sidebar", e);
                  e.currentTarget.style.scale = 1.2;
                  e.currentTarget.style.background = "#ffffff3d";
                }}
                onMouseLeave={e => {
                  hideTooltip();
                  e.currentTarget.style.scale = 1;
                  e.currentTarget.style.background = "linear-gradient(135deg, #ff6d34, #00bea3)";
                }}
              >
                <span className="group-hover:hidden transition-all duration-200">U</span>
                <PanelLeftOpen size={20} className="hidden group-hover:block transition-all duration-200" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center w-full"
              style={{ justifyContent: forceMobileExpanded ? "center" : "space-between" }}
            >
              <div
                className="flex items-center"
                style={{
                  width: forceMobileExpanded ? "100%" : "auto",
                  justifyContent: forceMobileExpanded ? "center" : "flex-start",
                }}
              >
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

              {!forceMobileExpanded && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-all duration-200"
                  style={{ color: "#9ca3af" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.scale = 1.2;
                    e.currentTarget.style.background = "#3d4446";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.scale = 1;
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }}
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={20} />
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 no-scrollbar">
          {USER_MENU.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
                style={{
                  background: isActive ? "#ff6d34" : "transparent",
                  color: isActive ? "#ffffff" : "#9ca3af",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                }}
                onMouseEnter={e => {
                  showTooltip(item.label, e);
                  if (!isActive) {
                    e.currentTarget.style.background = "#3d4446";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={e => {
                  hideTooltip();
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                  }
                }}
                type="button"
              >
                <Icon size={17} className="flex-shrink-0" />
                <span
                  className="truncate transition-all duration-200"
                  style={{
                    display: isCollapsed ? "none" : "block",
                    opacity: isCollapsed ? 0 : 1,
                    width: isCollapsed ? 0 : "auto",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-2 overflow-x-hidden" style={{ borderTop: "1px solid #3d4446" }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
            style={{
              color: "#9ca3af",
              justifyContent: isCollapsed ? "center" : "flex-start",
            }}
            onMouseEnter={e => {
              showTooltip("Sign Out", e);
              e.currentTarget.style.background = "#3d4446";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={e => {
              hideTooltip();
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9ca3af";
            }}
            type="button"
          >
            <LogOut size={17} className="flex-shrink-0" />
            <span
              className="transition-all duration-200"
              style={{
                display: isCollapsed ? "none" : "block",
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {isCollapsed && tooltip && (
        <div
          className="pointer-events-none fixed z-[100] px-2.5 py-1.5 text-xs text-white rounded-md whitespace-nowrap shadow-xl -translate-y-1/2"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            background: "#1a1f20",
            border: "1px solid #3d4446",
          }}
        >
          {tooltip.label}
          <span
            className="absolute top-1/2 -left-1 w-2 h-2 rotate-45 -translate-y-1/2"
            style={{
              background: "#1a1f20",
              borderLeft: "1px solid #3d4446",
              borderBottom: "1px solid #3d4446",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
