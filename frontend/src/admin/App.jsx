import { Suspense, lazy } from "react";
import MainLayout from "./components/MainLayout";
import {
  AdminAnalyticsSkeleton,
  AdminAnnouncementsSkeleton,
  AdminDashboardSkeleton,
  AdminKnowledgeBaseSkeleton,
  AdminManagementSkeleton,
  AdminPanelSkeleton,
  AdminReportsSkeleton,
  AdminSettingsSkeleton,
} from "../shared/components/PageSkeletons";
import { ADMIN_ROUTES, getPageIdFromPath, getPathFromPageId } from "../routes/paths";
import { navigate, usePathname } from "../routes/router";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Management = lazy(() => import("./pages/Management"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Settings = lazy(() => import("./pages/Settings"));

const PAGE_REGISTRY = {
  "admin-dashboard": {
    component: Dashboard,
    fallback: <AdminDashboardSkeleton />,
  },
  "admin-users": {
    component: AdminPanel,
    fallback: <AdminPanelSkeleton />,
  },
  "admin-management": {
    component: Management,
    fallback: <AdminManagementSkeleton />,
  },
  "admin-knowledge": {
    component: KnowledgeBase,
    fallback: <AdminKnowledgeBaseSkeleton />,
  },
  "admin-reports": {
    component: Reports,
    fallback: <AdminReportsSkeleton />,
  },
  "admin-analytics": {
    component: Analytics,
    fallback: <AdminAnalyticsSkeleton />,
  },
  "admin-announcements": {
    component: Announcements,
    fallback: <AdminAnnouncementsSkeleton />,
  },
  "admin-settings": {
    component: Settings,
    fallback: <AdminSettingsSkeleton />,
  },
};

const DEFAULT_PAGE = "admin-dashboard";

const AdminApp = ({ onLogout }) => {
  const pathname = usePathname();
  const page = getPageIdFromPath(pathname, ADMIN_ROUTES, DEFAULT_PAGE);
  const activePage = PAGE_REGISTRY[page] || PAGE_REGISTRY[DEFAULT_PAGE];
  const ActivePage = activePage.component;

  const handleNavigate = pageId => {
    navigate(getPathFromPageId(ADMIN_ROUTES, pageId, ADMIN_ROUTES[DEFAULT_PAGE]));
  };

  return (
    <MainLayout page={page} onNavigate={handleNavigate} onLogout={onLogout}>
      <Suspense fallback={activePage.fallback}>
        <ActivePage onNavigate={handleNavigate} />
      </Suspense>
    </MainLayout>
  );
};

export default AdminApp;
