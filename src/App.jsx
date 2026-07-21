import ForgotPassword from './auth/pages/ForgotPassword';
import ResetPassword from './auth/pages/ResetPassword';
import { useEffect, useState } from 'react';
import { useAuthStore } from './lib/auth';
import { connectSocket, disconnectSocket } from './lib/socket';
import AuthGate from './AuthGate';
import AuthCallback from './auth/pages/AuthCallback';
import UserApp from './user/App';
import AdminApp from './admin/App';
import MentorApp from './mentor/App';
import LoaderScreen from './shared/components/LoaderScreen';
import AIAssistant from './shared/components/AIAssistant';

const App = () => {
  const { user, step, hydrated, hydrate } = useAuthStore();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user?.id && step === 'authenticated') {
      connectSocket(useAuthStore.getState().accessToken);
    }
    return () => {
      if (step!== 'authenticated') disconnectSocket();
    };
  }, [user, step]);

  const path = window.location.pathname;
  
  if (path === '/forgot-password') {
    return <ForgotPassword />;
  }
  if (path.startsWith('/reset-password/')) {
    return <ResetPassword />;
  }
  if (path === '/auth/callback') {
    return <AuthCallback />;
  }

  if (!hydrated) return <LoaderScreen label="Initialising SkillNova…" />;
  if (!user || step!== 'authenticated') return <AuthGate />;

  return (
    <>
      {!online && (
        <div className="fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium text-white"
          style={{ background: '#dc2626' }}>
          ⚠️ You are offline. Some features may be unavailable.
        </div>
      )}
      {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'? (
        <AdminApp />
      ) : user.role === 'MENTOR'? (
        <MentorApp />
      ) : (
        <UserApp />
      )}
      <AIAssistant role={user.role} userName={user.name} />
    </>
  );
};

export default App;