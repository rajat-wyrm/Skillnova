// ════════════════════════════════════════════════════════════
//  App.jsx — Root component
//  Hydrates auth, mounts the right app (admin/mentor/intern)
//  based on the authenticated user's role. Mounts the global
//  AIAssistant widget so every logged-in user has access.
// ════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { useAuthStore } from './lib/auth';
import { connectSocket, disconnectSocket } from './lib/socket';
import AuthGate from './AuthGate';
import UserApp from './user/App';
import AdminApp from './admin/App';
import MentorApp from './mentor/App';
import LoaderScreen from './shared/components/LoaderScreen';
import AIAssistant from './shared/components/AIAssistant';

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

  return (
    <>
      {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
        <AdminApp />
      ) : user.role === 'MENTOR' ? (
        <MentorApp />
      ) : (
        <UserApp />
      )}
      <AIAssistant role={user.role} userName={user.name} />
    </>
  );
};

export default App;
