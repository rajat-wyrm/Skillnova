import ErrorBoundary from "../shared/components/ErrorBoundary";
import { AuthProvider } from "../shared/store/auth-context";
import AppRouter from "../routes/AppRouter";

const AppRoot = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </ErrorBoundary>
);

export default AppRoot;

