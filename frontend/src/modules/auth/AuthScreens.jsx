import Login from "../../auth/pages/Login";
import AdminOTP from "../../auth/pages/AdminOTP";
import User2FA from "../../auth/pages/User2FA";
import { useAuth } from "../../shared/store/auth-context";
import { navigate } from "../../routes/router";
import { PUBLIC_PATHS, getHomePathForRole, getVerificationPath } from "../../routes/paths";

export const LoginScreen = () => {
  const { login } = useAuth();

  const handleLogin = async credentials => {
    const pendingAuth = await login(credentials);
    navigate(getVerificationPath(pendingAuth.nextStep));
  };

  return <Login onSubmit={handleLogin} />;
};

export const AdminOtpScreen = () => {
  const { pendingAuth, verifyAdminOtp, cancelPendingAuth } = useAuth();

  const handleVerify = async code => {
    const session = await verifyAdminOtp(code);
    navigate(getHomePathForRole(session.user.role), { replace: true });
  };

  const handleCancel = () => {
    cancelPendingAuth();
    navigate(PUBLIC_PATHS.login, { replace: true });
  };

  return (
    <AdminOTP
      tempUser={pendingAuth?.tempUser}
      onVerifyCode={handleVerify}
      onCancel={handleCancel}
    />
  );
};

export const UserTwoFactorScreen = () => {
  const { pendingAuth, verifyUserTwoFactor, cancelPendingAuth } = useAuth();

  const handleVerify = async code => {
    const session = await verifyUserTwoFactor(code);
    navigate(getHomePathForRole(session.user.role), { replace: true });
  };

  const handleCancel = () => {
    cancelPendingAuth();
    navigate(PUBLIC_PATHS.login, { replace: true });
  };

  return (
    <User2FA
      tempUser={pendingAuth?.tempUser}
      onVerifyCode={handleVerify}
      onCancel={handleCancel}
    />
  );
};

