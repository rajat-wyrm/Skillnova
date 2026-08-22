// ════════════════════════════════════════════════════════════
//  AuthGate — Login / OTP flow
// ════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import Login from './auth/pages/Login';
import AdminOTP from './auth/pages/AdminOTP';
import User2FA from './auth/pages/User2FA';
import ForgotPassword from './auth/pages/ForgotPassword';
import { useAuthStore } from './lib/auth';

const AuthGate = () => {
  const { step, user, hydrate } = useAuthStore();

  useEffect(() => {
    if (!user && step === 'login') hydrate();
  }, [hydrate, step, user]);

  if (step === 'login') return <Login />;
  if (step === 'forgot_password') return <ForgotPassword />;

  if (step === 'otp') {
    if (user?.role === 'INTERN') return <User2FA />;
    return <AdminOTP />;
  }

  return null;
};

export default AuthGate;
