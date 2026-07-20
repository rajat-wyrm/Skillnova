// ══════════════════════════════════════════════
//  ADMIN — MainLayout.jsx (Responsive)
// ══════════════════════════════════════════════

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header  from "./Header";

const PAGE_TITLES = {
  "admin-dashboard":     "Admin Overview",
  "admin-leaderboard":   "Leaderboard",
  "admin-users":         "User Management",
  "admin-management":    "Intern Management",
  "admin-knowledge":     "Knowledge Base",
  "admin-kanban":        "Task Board",
  "admin-reports":       "Reports",
  "admin-analytics":     "Analytics",
  "admin-calendar":      "Calendar",
  "admin-announcements": "Announcements",
  "admin-files":         "Files",
  "admin-webhooks":      "Webhooks",
  "admin-audit":         "Audit Log",
  "admin-notifications": "Notification Preferences",
  "admin-settings":      "Admin Settings",
};

const MainLayout = ({ page, onNavigate, children }) => {
  const title = PAGE_TITLES[page] ?? "Admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { setMobileOpen(false); }, [page]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200" style={{ background: "var(--bg)" }}>
      <div className="hidden md:block">
        <Sidebar active={page} onNavigate={onNavigate} />
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar active={page} onNavigate={onNavigate} forceMobileExpanded />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;