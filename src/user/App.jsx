// ════════════════════════════════════════════════════════════
//  USER — App.jsx (lazy-loaded pages for fastest initial paint)
// ════════════════════════════════════════════════════════════
import { useState, Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import { PageLoader } from '../shared/components/Skeleton';

const KnowledgeBase    = lazy(() => import('./pages/KnowledgeBase'));
const Leaderboard      = lazy(() => import('./pages/Leaderboard'));
const QA               = lazy(() => import('./pages/QA'));
const Reports          = lazy(() => import('./pages/Reports'));
const AIAssistant      = lazy(() => import('./pages/AIAssistant'));
const Announcements    = lazy(() => import('./pages/Announcements'));
const Analytics        = lazy(() => import('./pages/Analytics'));
const Profile          = lazy(() => import('./pages/Profile'));
const Settings         = lazy(() => import('./pages/Settings'));
const ProjectFlow      = lazy(() => import('./pages/ProjectFlow'));
const Attendance       = lazy(() => import('./pages/Attendance'));
const KanbanPage       = lazy(() => import('./pages/Kanban'));
const Calendar         = lazy(() => import('./pages/Calendar'));
const Files            = lazy(() => import('./pages/Files'));
const Notifications    = lazy(() => import('./pages/Notifications'));
const Exports          = lazy(() => import('./pages/Exports'));
const SkillGapAnalyzer = lazy(() => import('./pages/SkillGapAnalyzer'));

const PAGES = {
  dashboard:      <Dashboard />,
  leaderboard:    <Suspense fallback={<PageLoader />}><Leaderboard /></Suspense>,
  knowledge:      <Suspense fallback={<PageLoader />}><KnowledgeBase /></Suspense>,
  qa:             <Suspense fallback={<PageLoader />}><QA /></Suspense>,
  project_flow:   <Suspense fallback={<PageLoader />}><ProjectFlow /></Suspense>,
  kanban:         <Suspense fallback={<PageLoader />}><KanbanPage /></Suspense>,
  calendar:       <Suspense fallback={<PageLoader />}><Calendar /></Suspense>,
  files:          <Suspense fallback={<PageLoader />}><Files /></Suspense>,
  reports:        <Suspense fallback={<PageLoader />}><Reports /></Suspense>,
  attendance:     <Suspense fallback={<PageLoader />}><Attendance /></Suspense>,
  ai:             <Suspense fallback={<PageLoader />}><AIAssistant /></Suspense>,
  notifications:  <Suspense fallback={<PageLoader />}><Notifications /></Suspense>,
  announcements:  <Suspense fallback={<PageLoader />}><Announcements /></Suspense>,
  exports:        <Suspense fallback={<PageLoader />}><Exports /></Suspense>,
  skill_gap:      <Suspense fallback={<PageLoader />}><SkillGapAnalyzer /></Suspense>,
  analytics:      <Suspense fallback={<PageLoader />}><Analytics /></Suspense>,
  profile:        <Suspense fallback={<PageLoader />}><Profile /></Suspense>,
  settings:       <Suspense fallback={<PageLoader />}><Settings /></Suspense>,
};

const UserApp = () => {
  const [page, setPage] = useState('dashboard');
  const [fade, setFade] = useState(true);

  const handleNavigate = (p) => {
    if (p === page) return;
    setFade(false);
    setTimeout(() => {
      setPage(p);
      setFade(true);
    }, 150);
  };

  return (
    <MainLayout page={page} onNavigate={handleNavigate}>
      <div style={{
        opacity: fade ? 1 : 0,
        transform: fade ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        {PAGES[page]}
      </div>
    </MainLayout>
  );
};

export default UserApp;
