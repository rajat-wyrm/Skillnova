import { Suspense, lazy } from "react";
import { FullPageLoader } from "../shared/components/AppState";
import { useAuth } from "../shared/store/auth-context";
import { Redirect, usePathname } from "./router";
import {
  ADMIN_ROUTES,
  PUBLIC_PATHS,
  USER_ROUTES,
  getHomePathForRole,
  getVerificationPath,
} from "./paths";

const AdminApp = lazy(() => import("../admin/App"));
const UserApp = lazy(() => import("../user/App"));
const LoginScreen = lazy(() =>
  import("../modules/auth/AuthScreens").then(module => ({ default: module.LoginScreen }))
);
const AdminOtpScreen = lazy(() =>
  import("../modules/auth/AuthScreens").then(module => ({ default: module.AdminOtpScreen }))
);
const UserTwoFactorScreen = lazy(() =>
  import("../modules/auth/AuthScreens").then(module => ({ default: module.UserTwoFactorScreen }))
);

const AppChunkFallback = () => (
  <FullPageLoader
    title="Loading workspace"
    subtitle="Preparing the next screen for you..."
  />
);

const LazyScreen = ({ children }) => (
  <Suspense fallback={<AppChunkFallback />}>{children}</Suspense>
);

const RequireAuthenticated = ({ role, children }) => {
  const { status, user, pendingAuth } = useAuth();

  if (status === "checking") {
    return <FullPageLoader />;
  }

  if (status === "pending") {
    return <Redirect to={getVerificationPath(pendingAuth?.nextStep)} />;
  }

  if (status !== "authenticated") {
    return <Redirect to={PUBLIC_PATHS.login} />;
  }

  if (role && user?.role !== role) {
    return <Redirect to={getHomePathForRole(user?.role)} />;
  }

  return children;
};

const RequirePendingAuth = ({ step, children }) => {
  const { status, pendingAuth, user } = useAuth();

  if (status === "checking") {
    return <FullPageLoader />;
  }

  if (status === "authenticated") {
    return <Redirect to={getHomePathForRole(user?.role)} />;
  }

  if (status !== "pending" || pendingAuth?.nextStep !== step) {
    return <Redirect to={PUBLIC_PATHS.login} />;
  }

  return children;
};

const AppRouter = () => {
  const pathname = usePathname();
  const { status, pendingAuth, user, logout } = useAuth();

  if (status === "checking") {
    return <FullPageLoader />;
  }

  if (pathname === PUBLIC_PATHS.home) {
    if (status === "authenticated") {
      return <Redirect to={getHomePathForRole(user?.role)} />;
    }

    if (status === "pending") {
      return <Redirect to={getVerificationPath(pendingAuth?.nextStep)} />;
    }

    return <Redirect to={PUBLIC_PATHS.login} />;
  }

  if (pathname === PUBLIC_PATHS.login) {
    if (status === "authenticated") {
      return <Redirect to={getHomePathForRole(user?.role)} />;
    }

    if (status === "pending") {
      return <Redirect to={getVerificationPath(pendingAuth?.nextStep)} />;
    }

    return (
      <LazyScreen>
        <LoginScreen />
      </LazyScreen>
    );
  }

  if (pathname === PUBLIC_PATHS.adminOtp) {
    return (
      <RequirePendingAuth step="admin-otp">
        <LazyScreen>
          <AdminOtpScreen />
        </LazyScreen>
      </RequirePendingAuth>
    );
  }

  if (pathname === PUBLIC_PATHS.userTwoFactor) {
    return (
      <RequirePendingAuth step="user-2fa">
        <LazyScreen>
          <UserTwoFactorScreen />
        </LazyScreen>
      </RequirePendingAuth>
    );
  }

  if (Object.values(ADMIN_ROUTES).includes(pathname)) {
    return (
      <RequireAuthenticated role="admin">
        <LazyScreen>
          <AdminApp onLogout={logout} />
        </LazyScreen>
      </RequireAuthenticated>
    );
  }

  if (Object.values(USER_ROUTES).includes(pathname)) {
    return (
      <RequireAuthenticated role="intern">
        <LazyScreen>
          <UserApp onLogout={logout} />
        </LazyScreen>
      </RequireAuthenticated>
    );
  }

  if (status === "authenticated") {
    return <Redirect to={getHomePathForRole(user?.role)} />;
  }

  return <Redirect to={PUBLIC_PATHS.login} />;
};

export default AppRouter;
