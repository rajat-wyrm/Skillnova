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

const PAGES = {
  dashboard:      <Dashboard />,
  knowledge:      <KnowledgeBase />,
  qa:             <QA />,
  project_flow:   <ProjectFlow />,
  reports:        <Reports />,
  attendance:     <Attendance />,
  ai:             <AIAssistant />,
  announcements:  <Announcements />,
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
