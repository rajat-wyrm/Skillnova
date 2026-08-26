// ════════════════════════════════════════════════════════════
//  AuthGate — Login / OTP / Forgot Password flow
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import Login from './auth/pages/Login';
import AdminOTP from './auth/pages/AdminOTP';
import User2FA from './auth/pages/User2FA';
import ForgotPassword from './auth/pages/ForgotPassword';
import { useAuthStore } from './lib/auth';

const AuthGate = () => {
  const { step, user, tempRole, hydrate } = useAuthStore();
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (!user && step === 'login') hydrate();
  }, [hydrate, step, user]);

  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;

  if (step === 'login') return <Login onForgotPassword={() => setShowForgot(true)} />;

  if (step === 'otp') {
    const role = user?.role || tempRole;
    if (role === 'INTERN') return <User2FA />;
    return <AdminOTP />;
  }

  return null;
};

export default AuthGate;