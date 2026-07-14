// ════════════════════════════════════════════════════════════
//  ADMIN — App.jsx (lazy-loaded pages for fastest initial paint)
// ════════════════════════════════════════════════════════════
import { useState, Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import { PageLoader } from '../shared/components/Skeleton';

const AdminPanel         = lazy(() => import('./pages/AdminPanel'));
const Management         = lazy(() => import('./pages/Management'));
const KnowledgeBase      = lazy(() => import('./pages/KnowledgeBase'));
const Reports            = lazy(() => import('./pages/Reports'));
const Analytics          = lazy(() => import('./pages/Analytics'));
const Announcements      = lazy(() => import('./pages/Announcements'));
const Settings           = lazy(() => import('./pages/Settings'));
const AuditLog           = lazy(() => import('./pages/AuditLog'));
const Kanban             = lazy(() => import('./pages/Kanban'));
const CalendarView       = lazy(() => import('./pages/Calendar'));
const FilesPage          = lazy(() => import('./pages/Files'));
const Leaderboard        = lazy(() => import('../user/pages/Leaderboard'));
const NotificationPrefs  = lazy(() => import('./pages/NotificationPreferences'));
const WebhooksPage       = lazy(() => import('./pages/Webhooks'));

const PAGES = {
  'admin-dashboard':     <Dashboard />,
  'admin-leaderboard':   <Suspense fallback={<PageLoader />}><Leaderboard /></Suspense>,
  'admin-users':         <Suspense fallback={<PageLoader />}><AdminPanel /></Suspense>,
  'admin-management':    <Suspense fallback={<PageLoader />}><Management /></Suspense>,
  'admin-knowledge':     <Suspense fallback={<PageLoader />}><KnowledgeBase /></Suspense>,
  'admin-reports':       <Suspense fallback={<PageLoader />}><Reports /></Suspense>,
  'admin-analytics':     <Suspense fallback={<PageLoader />}><Analytics /></Suspense>,
  'admin-announcements': <Suspense fallback={<PageLoader />}><Announcements /></Suspense>,
  'admin-kanban':        <Suspense fallback={<PageLoader />}><Kanban /></Suspense>,
  'admin-calendar':      <Suspense fallback={<PageLoader />}><CalendarView /></Suspense>,
  'admin-files':         <Suspense fallback={<PageLoader />}><FilesPage /></Suspense>,
  'admin-webhooks':      <Suspense fallback={<PageLoader />}><WebhooksPage /></Suspense>,
  'admin-audit':         <Suspense fallback={<PageLoader />}><AuditLog /></Suspense>,
  'admin-notifications': <Suspense fallback={<PageLoader />}><NotificationPrefs /></Suspense>,
  'admin-settings':      <Suspense fallback={<PageLoader />}><Settings /></Suspense>,
};

const AdminApp = () => {
  const [page, setPage] = useState('admin-dashboard');
  return (
    <MainLayout page={page} onNavigate={setPage}>
      {PAGES[page]}
    </MainLayout>
  );
};

export default AdminApp;
