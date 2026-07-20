// ════════════════════════════════════════════════════════════
//  Mentor — App.jsx (lazy-loaded pages)
// ════════════════════════════════════════════════════════════
import { useState, Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import { PageLoader } from '../shared/components/Skeleton';

const Interns = lazy(() => import('./pages/Interns'));
const Reports = lazy(() => import('./pages/Reports'));
const Projects = lazy(() => import('./pages/Projects'));
const Assignments = lazy(() => import('./pages/Assignments'));   // NEW
const TaskDashboard = lazy(() => import('./pages/TaskDashboard')); // NEW
const LeaveApprovals = lazy(() => import('./pages/LeaveApprovals'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const QnA = lazy(() => import('./pages/QnA'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Announcements = lazy(() => import('./pages/Announcements'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

const PAGES = {
  dashboard: <Dashboard />,
  interns: <Suspense fallback={<PageLoader />}><Interns /></Suspense>,
  reports: <Suspense fallback={<PageLoader />}><Reports /></Suspense>,
  projects: <Suspense fallback={<PageLoader />}><Projects /></Suspense>,
  assignments: <Suspense fallback={<PageLoader />}><Assignments /></Suspense>,    // NEW
  taskdashboard: <Suspense fallback={<PageLoader />}><TaskDashboard /></Suspense>,  // NE
  'leave-approvals': <Suspense fallback={<PageLoader />}><LeaveApprovals /></Suspense>,
  knowledge: <Suspense fallback={<PageLoader />}><KnowledgeBase /></Suspense>,
  qa: <Suspense fallback={<PageLoader />}><QnA /></Suspense>,
  feedback: <Suspense fallback={<PageLoader />}><Feedback /></Suspense>,
  announcements: <Suspense fallback={<PageLoader />}><Announcements /></Suspense>,
  ai: <Suspense fallback={<PageLoader />}><AIAssistant /></Suspense>,
  profile: <Suspense fallback={<PageLoader />}><Profile /></Suspense>,
  settings: <Suspense fallback={<PageLoader />}><Settings /></Suspense>,
};

const MentorApp = () => {
  const [page, setPage] = useState('dashboard');
  return (
    <MainLayout page={page} onNavigate={setPage}>
      {PAGES[page]}
    </MainLayout>
  );
};

export default MentorApp;
