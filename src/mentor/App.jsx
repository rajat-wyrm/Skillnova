// ════════════════════════════════════════════════════════════
//  Mentor App — assigned interns, reports review, projects
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Interns from './pages/Interns';
import Reports from './pages/Reports';
import Projects from './pages/Projects';
import KnowledgeBase from './pages/KnowledgeBase';
import QnA from './pages/QnA';
import Announcements from './pages/Announcements';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const PAGES = {
  dashboard:      <Dashboard />,
  interns:        <Interns />,
  reports:        <Reports />,
  projects:       <Projects />,
  knowledge:      <KnowledgeBase />,
  qa:             <QnA />,
  announcements:  <Announcements />,
  ai:             <AIAssistant />,
  profile:        <Profile />,
  settings:       <Settings />,
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
