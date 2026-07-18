// ══════════════════════════════════════════════
//  USER — MainLayout.jsx (Responsive)
// ══════════════════════════════════════════════

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header  from "./Header";

const PAGE_TITLES = {
  "dashboard":      "Dashboard",
  "knowledge":      "Knowledge Base",
  "qa":             "Q&A Forum",
  "reports":        "My Reports",
  "meetings":       "AI Assistant",
  "announcements":  "Announcements",
  "analytics":      "Analytics",
  "profile":        "My Profile",
  "settings":       "Settings",
};

const MainLayout = ({ page, onNavigate, children, onLogout }) => {
  const title = PAGE_TITLES[page] ?? "Dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setMobileOpen(false); }, [page]);

  // Close sidebar on resize past mobile breakpoint
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200" style={{ background: "var(--bg)" }}>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar active={page} onNavigate={onNavigate} onLogout={onLogout} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar active={page} onNavigate={onNavigate} onLogout={onLogout} forceMobileExpanded />
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