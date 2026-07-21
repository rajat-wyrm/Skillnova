// ════════════════════════════════════════════════════════════
//  AuthCallback — handles /auth/callback after Google login
//  Router-agnostic: uses URLSearchParams, not useSearchParams
// ════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { useAuthStore } from '../../lib/auth';

const ERROR_MESSAGES = {
  access_denied: 'Access was denied. You can try again.',
  invalid_state: 'Session expired. Please try signing in again.',
  missing_code: 'No authorization code received.',
  exchange_failed: 'Failed to verify with Google. Please try again.',
  email_not_verified: 'Your Google email is not verified.',
  no_account_match: 'No SkillNova account found for this Google account.',
};

const AuthCallback = () => {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      const msg = ERROR_MESSAGES[error] || 'Sign-in failed. Please try again.';
      window.location.replace(`/login?error=${encodeURIComponent(msg)}`);
      return;
    }

    // Cookies are set by the backend redirect — just hydrate
    hydrate().then(() => {
      window.location.replace('/');
    });
  }, [hydrate]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: 'system-ui, sans-serif', color: '#666',
    }}>
      <p>Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
