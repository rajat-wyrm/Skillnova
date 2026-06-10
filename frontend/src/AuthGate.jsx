// src/AuthGate.jsx
import { useState } from 'react';
import UserApp  from "./user/App";
import AdminApp from "./admin/App";
import Login from "./auth/pages/Login";
import AdminOTP from "./auth/pages/AdminOTP";
import User2FA from "./auth/pages/User2FA";

const AuthGate = () => {
  // role: null | 'admin' | 'intern'
  const [role, setRole] = useState(null); 
  
  // auth step: 'LOGIN' | 'OTP' | '2FA' | 'AUTHENTICATED'
  const [authStep, setAuthStep] = useState('LOGIN');
  
  // temporary user details
  const [tempUser, setTempUser] = useState(null);

  const handleLoginSuccess = (userRole, email) => {
    setTempUser({ role: userRole, email });
    if (userRole === "admin") {
      setAuthStep("OTP");
    } else {
      setAuthStep("2FA");
    }
  };

  const handleVerificationSuccess = () => {
    setRole(tempUser.role);
    setAuthStep("AUTHENTICATED");
  };

  const handleLogout = () => {
    setRole(null);
    setAuthStep("LOGIN");
    setTempUser(null);
  };

  if (authStep === 'LOGIN') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  if (authStep === 'OTP') {
    return (
      <AdminOTP 
        tempUser={tempUser} 
        onVerify={handleVerificationSuccess} 
        onCancel={handleLogout} 
      />
    );
  }
  
  if (authStep === '2FA') {
    return (
      <User2FA 
        tempUser={tempUser} 
        onVerify={handleVerificationSuccess} 
        onCancel={handleLogout} 
      />
    );
  }

  if (authStep === 'AUTHENTICATED') {
    // In a real app we'd pass `handleLogout` to these apps, but they may handle their own top-bar logout.
    if (role === "admin")  return <AdminApp onLogout={handleLogout} />;
    if (role === "intern") return <UserApp onLogout={handleLogout} />;
  }

  return null;
};

export default AuthGate;