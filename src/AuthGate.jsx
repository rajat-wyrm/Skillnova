// ════════════════════════════════════════════════════════════
//  AuthGate — Login / Signup / OTP flow
// ════════════════════════════════════════════════════════════
import { useEffect } from "react";
import Login from "./auth/pages/Login";
import Signup from "./auth/pages/Signup";
import SignupOTP from "./auth/pages/SignupOTP";
import AdminOTP from "./auth/pages/AdminOTP";
import User2FA from "./auth/pages/User2FA";
import { useAuthStore } from "./lib/auth";
import { useEffect } from 'react';
import Login from './auth/pages/Login';
import AdminOTP from './auth/pages/AdminOTP';
import User2FA from './auth/pages/User2FA';
import { useAuthStore } from './lib/auth';
import LoaderScreen from './shared/components/LoaderScreen';

const AuthGate = () => {
  const { step, user, hydrate, otpMode } = useAuthStore();

  useEffect(() => {
    if (!user && step === "login") hydrate();
  }, [hydrate, step, user]);

  if (step === 'auth-checking') return <LoaderScreen label="Checking your session…" />;

  if (step === 'login') return <Login />;

  if (step === 'otp') {
    if (otpMode === 'user' || user?.role === 'INTERN') return <User2FA />;
  if (step === "login") return <Login />;
  if (step === "signup") return <Signup />;
  if (step === "signup_otp") return <SignupOTP />;
  if (step === 'login') return <Login />;

  if (step === "otp") {
    if (user?.role === "INTERN") return <User2FA />;
    return <AdminOTP />;
  }

  return null;
};

export default AuthGate;
