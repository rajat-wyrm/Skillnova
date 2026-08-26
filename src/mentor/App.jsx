// ════════════════════════════════════════════════════════════
//  Mentor — App.jsx (lazy-loaded pages)
// ════════════════════════════════════════════════════════════
import { useState, Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import { PageLoader } from '../shared/components/Skeleton';

const Interns        = lazy(() => import('./pages/Interns'));
const Attendance     = lazy(() => import('./pages/Attendance'));
const Reports        = lazy(() => import('./pages/Reports'));
const Projects       = lazy(() => import('./pages/Projects'));
const KnowledgeBase  = lazy(() => import('./pages/KnowledgeBase'));
const QnA            = lazy(() => import('./pages/QnA'));
const Announcements  = lazy(() => import('./pages/Announcements'));
const AIAssistant    = lazy(() => import('./pages/AIAssistant'));
const Profile        = lazy(() => import('./pages/Profile'));
const Settings       = lazy(() => import('./pages/Settings'));
const RoadmapManage  = lazy(() => import('./pages/RoadmapManage'));

const MentorApp = () => {
  const [page, setPage] = useState('dashboard');
  const pages = {
    dashboard:      <Dashboard onNavigate={setPage} />,
    interns:        <Suspense fallback={<PageLoader />}><Interns /></Suspense>,
    attendance:     <Suspense fallback={<PageLoader />}><Attendance /></Suspense>,
    reports:        <Suspense fallback={<PageLoader />}><Reports /></Suspense>,
    projects:       <Suspense fallback={<PageLoader />}><Projects /></Suspense>,
    roadmap:        <Suspense fallback={<PageLoader />}><RoadmapManage /></Suspense>,
    knowledge:      <Suspense fallback={<PageLoader />}><KnowledgeBase /></Suspense>,
    qa:             <Suspense fallback={<PageLoader />}><QnA /></Suspense>,
    announcements:  <Suspense fallback={<PageLoader />}><Announcements /></Suspense>,
    ai:             <Suspense fallback={<PageLoader />}><AIAssistant /></Suspense>,
    profile:        <Suspense fallback={<PageLoader />}><Profile /></Suspense>,
    settings:       <Suspense fallback={<PageLoader />}><Settings /></Suspense>,
  };
  return (
    <MainLayout page={page} onNavigate={setPage}>
      {pages[page]}
    </MainLayout>
  );
};

export default MentorApp;
