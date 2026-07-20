// ════════════════════════════════════════════════════════════
//  USER — components/MainLayout.jsx
// ════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  dashboard:      'Dashboard',
  leaderboard:    'Leaderboard',
  knowledge:      'Knowledge Base',
  qa:             'Q&A Forum',
  project_flow:   'Project Flow',
  kanban:         'Task Board',
  calendar:       'Calendar',
  files:          'Files',
  reports:        'My Reports',
  attendance:     'Attendance',
  ai:             'AI Assistant',
  notifications:  'Notifications',
  announcements:  'Announcements',
  exports:        'Data Export',
  analytics:      'Analytics',
  profile:        'My Profile',
  settings:       'Settings',
};

const MainLayout = ({ page, onNavigate, children }) => {
  const title = PAGE_TITLES[page] ?? 'SkillNova';
  const [mobileOpen, setMobileOpen] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { setMobileOpen(false); }, [page]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="hidden md:block">
        <Sidebar active={page} onNavigate={onNavigate} />
      </div>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar active={page} onNavigate={onNavigate} forceMobileExpanded />
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
