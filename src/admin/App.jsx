// ════════════════════════════════════════════════════════════
//  ADMIN — App.jsx
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Management from './pages/Management';
import KnowledgeBase from './pages/KnowledgeBase';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Announcements from './pages/Announcements';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import Kanban from './pages/Kanban';
import CalendarView from './pages/Calendar';
import FilesPage from './pages/Files';
import NotificationPreferences from './pages/NotificationPreferences';
import WebhooksPage from './pages/Webhooks';

const PAGES = {
  'admin-dashboard':     <Dashboard />,
  'admin-users':         <AdminPanel />,
  'admin-management':    <Management />,
  'admin-knowledge':     <KnowledgeBase />,
  'admin-reports':       <Reports />,
  'admin-analytics':     <Analytics />,
  'admin-announcements': <Announcements />,
  'admin-kanban':        <Kanban />,
  'admin-calendar':      <CalendarView />,
  'admin-files':         <FilesPage />,
  'admin-webhooks':      <WebhooksPage />,
  'admin-audit':         <AuditLog />,
  'admin-notifications': <NotificationPreferences />,
  'admin-settings':      <Settings />,
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
