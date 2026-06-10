import { Suspense, lazy } from "react";
import MainLayout from "./components/MainLayout";
import {
  AIAssistantSkeleton,
  UserAnalyticsSkeleton,
  UserAnnouncementsSkeleton,
  UserDashboardSkeleton,
  UserKnowledgeBaseSkeleton,
  UserProfileSkeleton,
  UserProjectFlowSkeleton,
  UserQASkeleton,
  UserReportsSkeleton,
  UserSettingsSkeleton,
} from "../shared/components/PageSkeletons";
import { USER_ROUTES, getPageIdFromPath, getPathFromPageId } from "../routes/paths";
import { navigate, usePathname } from "../routes/router";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const QA = lazy(() => import("./pages/QA"));
const ProjectFlow = lazy(() => import("./pages/ProjectFlow"));
const Reports = lazy(() => import("./pages/Reports"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

const PAGE_REGISTRY = {
  dashboard: {
    component: Dashboard,
    fallback: <UserDashboardSkeleton />,
  },
  knowledge: {
    component: KnowledgeBase,
    fallback: <UserKnowledgeBaseSkeleton />,
  },
  qa: {
    component: QA,
    fallback: <UserQASkeleton />,
  },
  project_flow: {
    component: ProjectFlow,
    fallback: <UserProjectFlowSkeleton />,
  },
  reports: {
    component: Reports,
    fallback: <UserReportsSkeleton />,
  },
  assistant: {
    component: AIAssistant,
    fallback: <AIAssistantSkeleton />,
  },
  announcements: {
    component: Announcements,
    fallback: <UserAnnouncementsSkeleton />,
  },
  analytics: {
    component: Analytics,
    fallback: <UserAnalyticsSkeleton />,
  },
  profile: {
    component: Profile,
    fallback: <UserProfileSkeleton />,
  },
  settings: {
    component: Settings,
    fallback: <UserSettingsSkeleton />,
  },
};

const DEFAULT_PAGE = "dashboard";

const UserApp = ({ onLogout }) => {
  const pathname = usePathname();
  const page = getPageIdFromPath(pathname, USER_ROUTES, DEFAULT_PAGE);
  const activePage = PAGE_REGISTRY[page] || PAGE_REGISTRY[DEFAULT_PAGE];
  const ActivePage = activePage.component;

  const handleNavigate = pageId => {
    navigate(getPathFromPageId(USER_ROUTES, pageId, USER_ROUTES[DEFAULT_PAGE]));
  };

  return (
    <MainLayout page={page} onNavigate={handleNavigate} onLogout={onLogout}>
      <Suspense fallback={activePage.fallback}>
        <ActivePage onNavigate={handleNavigate} />
      </Suspense>
    </MainLayout>
  );
};

export default UserApp;
