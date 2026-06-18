// ════════════════════════════════════════════════════════════
//  App.jsx — Root component
//  Hydrates auth, mounts the right app (admin/mentor/intern)
//  based on the authenticated user's role.
// ════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { useAuthStore } from './lib/auth';
import { connectSocket, disconnectSocket } from './lib/socket';
import AuthGate from './AuthGate';
import UserApp from './user/App';
import AdminApp from './admin/App';
import MentorApp from './mentor/App';
import LoaderScreen from './shared/components/LoaderScreen';

const App = () => {
  const { user, step, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user?.id && step === 'authenticated') {
      connectSocket(useAuthStore.getState().accessToken);
    }
    return () => {
      if (step !== 'authenticated') disconnectSocket();
    };
  }, [user, step]);

  if (!hydrated) return <LoaderScreen label="Initialising SkillNova…" />;
  if (!user || step !== 'authenticated') return <AuthGate />;

  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return <AdminApp />;
  if (user.role === 'MENTOR') return <MentorApp />;
  return <UserApp />;
};

export default App;
