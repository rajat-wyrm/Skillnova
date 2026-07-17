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
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const QnA = lazy(() => import('./pages/QnA'));
const Announcements = lazy(() => import('./pages/Announcements'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const InternWorkflow = lazy(() => import('./pages/InternWorkflow'));

const MentorApp = () => {
  const [page, setPage] = useState('dashboard')
  const [selectedIntern, setSelectedIntern] = useState(null)

  const PAGES = {
    dashboard: (
      <Dashboard
        onNavigate={setPage}
        onSelectIntern={setSelectedIntern}
      />
    ),

    interns: (
      <Suspense fallback={<PageLoader />}>
        <Interns />
      </Suspense>
    ),

    reports: (
      <Suspense fallback={<PageLoader />}>
        <Reports />
      </Suspense>
    ),

    projects: (
      <Suspense fallback={<PageLoader />}>
        <Projects />
      </Suspense>
    ),

    knowledge: (
      <Suspense fallback={<PageLoader />}>
        <KnowledgeBase />
      </Suspense>
    ),

    qa: (
      <Suspense fallback={<PageLoader />}>
        <QnA />
      </Suspense>
    ),

    announcements: (
      <Suspense fallback={<PageLoader />}>
        <Announcements />
      </Suspense>
    ),

    ai: (
      <Suspense fallback={<PageLoader />}>
        <AIAssistant />
      </Suspense>
    ),

    profile: (
      <Suspense fallback={<PageLoader />}>
        <Profile />
      </Suspense>
    ),

    settings: (
      <Suspense fallback={<PageLoader />}>
        <Settings />
      </Suspense>
    ),

    'mentor-workflow': (
      <Suspense fallback={<PageLoader />}>
        <InternWorkflow data={selectedIntern} />
      </Suspense>
    ),
  }

  return (
    <MainLayout page={page} onNavigate={setPage}>
      {PAGES[page]}
    </MainLayout>
  )
}

export default MentorApp