import { useState, Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import { PageLoader } from '../shared/components/Skeleton';
import Attendance from '../user/pages/Attendance';
import AttendanceVerification from './pages/AttendanceVerification';

const Interns        = lazy(() => import('./pages/Interns'));
const Reports        = lazy(() => import('./pages/Reports'));
const Projects       = lazy(() => import('./pages/Projects'));
const KnowledgeBase  = lazy(() => import('./pages/KnowledgeBase'));
const QnA            = lazy(() => import('./pages/QnA'));
const Announcements  = lazy(() => import('./pages/Announcements'));
const AIAssistant    = lazy(() => import('./pages/AIAssistant'));
const Profile        = lazy(() => import('./pages/Profile'));
const Settings       = lazy(() => import('./pages/Settings'));

const PAGES = {
  dashboard:      <Dashboard />,
  interns:        <Suspense fallback={<PageLoader />}><Interns /></Suspense>,
  reports:        <Suspense fallback={<PageLoader />}><Reports /></Suspense>,
  projects:       <Suspense fallback={<PageLoader />}><Projects /></Suspense>,
  knowledge:      <Suspense fallback={<PageLoader />}><KnowledgeBase /></Suspense>,
  attendance:     <Attendance />,
  'attendance-verify': <AttendanceVerification />, 
  qa:             <Suspense fallback={<PageLoader />}><QnA /></Suspense>,
  announcements:  <Suspense fallback={<PageLoader />}><Announcements /></Suspense>,
  ai:             <Suspense fallback={<PageLoader />}><AIAssistant /></Suspense>,
  profile:        <Suspense fallback={<PageLoader />}><Profile /></Suspense>,
  settings:       <Suspense fallback={<PageLoader />}><Settings /></Suspense>,
};

const MentorApp = () => {
  const [page, setPage] = useState('dashboard');
  
  return (
    <MainLayout page={page} onNavigate={setPage}>
      {PAGES[page] || (
        <div className="p-8 m-8 bg-red-50 text-red-700 border-2 border-red-500 rounded font-bold text-center">
          ROUTER ERROR: The route "{page}" is not mapped in the PAGES object.
        </div>
      )}
    </MainLayout>
  );
};

export default MentorApp;