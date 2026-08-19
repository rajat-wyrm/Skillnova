// ════════════════════════════════════════════════════════════
//  AuthGate — Login / Signup / OTP flow
// ════════════════════════════════════════════════════════════
import { useEffect } from "react";
import Login from "./auth/pages/Login";
import Signup from "./auth/pages/Signup";
import SignupOTP from "./auth/pages/SignupOTP";
import AdminOTP from "./auth/pages/AdminOTP";
import User2FA from "./auth/pages/User2FA";
import LoaderScreen from './shared/components/LoaderScreen';
import { useAuthStore } from "./lib/auth";

const AuthGate = () => {
  const { step, user, hydrate, otpMode } = useAuthStore();

  useEffect(() => {
    if (!user && step === "login") hydrate();
  }, [hydrate, step, user]);

  if (step === 'auth-checking') return <LoaderScreen label="Checking your session…" />;

  if (step === 'login') return <Login />;
  if (step === "signup") return <Signup />;
  if (step === "signup_otp") return <SignupOTP />;

  if (step === 'otp') {
    if (otpMode === 'user' || user?.role === 'INTERN') {
      return <User2FA />;
    }
    return <AdminOTP />;
  }

  return null;
};

export default AuthGate;
