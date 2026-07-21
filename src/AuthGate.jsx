// ════════════════════════════════════════════════════════════
//  AuthGate — Login / OTP flow
// ════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import Login from './auth/pages/Login';
import Register from './auth/pages/Register';
import ForgotPassword from './auth/pages/ForgotPassword';
import ResetPassword from './auth/pages/ResetPassword';
import AdminOTP from './auth/pages/AdminOTP';
import User2FA from './auth/pages/User2FA';
import { useAuthStore } from './lib/auth';

const AuthGate = () => {
  const { step, user, hydrate } = useAuthStore();

  useEffect(() => {
    if (!user && step === 'login') hydrate();
  }, [hydrate, step, user]);

  if (step === 'login') {
    const path = window.location.pathname;
    if (path === '/register') return <Register />;
    if (path === '/forgot-password') return <ForgotPassword />;
    if (path === '/reset-password') return <ResetPassword />;
    return <Login />;
  }

  if (step === 'otp') {
    if (user?.role === 'INTERN') return <User2FA />;
    return <AdminOTP />;
  }

  return null;
};

export default AuthGate;
