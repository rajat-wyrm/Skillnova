// ════════════════════════════════════════════════════════════
//  USER — App.jsx
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import QA from './pages/QA';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import Announcements from './pages/Announcements';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProjectFlow from './pages/ProjectFlow';
import Attendance from './pages/Attendance';
import KanbanPage from './pages/Kanban';
import Calendar from './pages/Calendar';
import Files from './pages/Files';
import Notifications from './pages/Notifications';
import Exports from './pages/Exports';

const PAGES = {
  dashboard:      <Dashboard />,
  knowledge:      <KnowledgeBase />,
  qa:             <QA />,
  project_flow:   <ProjectFlow />,
  kanban:         <KanbanPage />,
  calendar:       <Calendar />,
  files:          <Files />,
  reports:        <Reports />,
  attendance:     <Attendance />,
  ai:             <AIAssistant />,
  notifications:  <Notifications />,
  announcements:  <Announcements />,
  exports:        <Exports />,
  analytics:      <Analytics />,
  profile:        <Profile />,
  settings:       <Settings />,
};

const UserApp = () => {
  const [page, setPage] = useState('dashboard');
  return (
    <MainLayout page={page} onNavigate={setPage}>
      {PAGES[page]}
    </MainLayout>
  );
};

export default UserApp;
