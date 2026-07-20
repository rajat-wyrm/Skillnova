// ════════════════════════════════════════════════════════════
//  AUTH — Login.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useState, useId, useEffect } from 'react';
import { useAuthStore } from '../../lib/auth';
import notify from '../../lib/toast';
import { APP_CONSTANTS } from '../../shared/config/constants';
import '../auth.css';

const Icon = {
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Lock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: ({ open }) => open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  Alert: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const Login = () => {
  const uid = useId();
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/demo-accounts`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setDemoAccounts(Array.isArray(d.accounts) ? d.accounts : []))
      .catch(() => setDemoAccounts([]));
  }, []);

  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;

  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [formError, setFormError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      window.history.replaceState({}, '', window.location.pathname);
      return decodeURIComponent(error);
    }
    return '';
  });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldError, setFieldError] = useState({ email: '', password: '' });

  const validateField = (name, value) => {
    let err = '';
    if (name === 'email') {
      if (!value.trim()) err = 'Email address is required.';
      else if (!isValidEmail(value)) err = 'Enter a valid email address.';
    }
    if (name === 'password') {
      if (!value) err = 'Password is required.';
    }
    setFieldError((prev) => ({ ...prev, [name]: err }));
    return err;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    validateField(name, value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    setFormError('');
    if (touched[name]) validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setTouched({ email: true, password: true });
    const emailErr = validateField('email', email);
    const pwdErr = validateField('password', password);
    if (emailErr || pwdErr) return;

    try {
      const result = await login({ email: email.trim(), password });
      if (result.step === 'otp') {
        notify.success('Code sent — check your email.');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  const emailState = touched.email && !formError
    ? (fieldError.email ? 'error' : email ? 'success' : '')
    : '';
  const pwdState = touched.password && !formError
    ? (fieldError.password ? 'error' : password ? 'success' : '')
    : '';

  return (
    <div className="auth-container">
      <a href="#main-form" className="auth-skip-link">Skip to form</a>

      <div className="auth-card" role="main" aria-label="Sign in to SkillNova">
        <div className="flex justify-center mb-3">
          <img src={APP_CONSTANTS.LOGO_PATH} alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} />
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your SkillNova account to continue.</p>
        <p className="auth-footer-text" style={{ marginTop: -12, marginBottom: 18 }}>
          New to SkillNova? <a className="auth-link" href="/register">Create Account</a>
        </p>

        <form id="main-form" onSubmit={handleSubmit} noValidate aria-label="Login form">
          <div className={`auth-form-group ${emailState === 'error' ? 'is-error' : emailState === 'success' ? 'is-success' : ''}`}>
            <label className="auth-label" htmlFor={emailId}>
              Email address <span className="auth-required" aria-label="required">*</span>
            </label>
            <div className="auth-input-wrap has-icon has-status">
              <span className="auth-input-icon" aria-hidden="true"><Icon.Mail /></span>
              <input
                id={emailId}
                type="email"
                name="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                aria-required="true"
                aria-label="Email address"
                aria-describedby={`${emailId}-error`}
                aria-invalid={emailState === 'error' ? 'true' : undefined}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {emailState === 'success' && <span className="auth-input-status"><Icon.Check /></span>}
              {emailState === 'error' && <span className="auth-input-status"><Icon.X /></span>}
            </div>
            {emailState === 'error' && <p id={`${emailId}-error`} className="auth-msg auth-msg-error" role="alert"><Icon.Alert /> {fieldError.email}</p>}
            {emailState === 'success' && <p className="auth-msg auth-msg-success"><Icon.Check /> Email looks good.</p>}
          </div>

          <div className={`auth-form-group ${pwdState === 'error' ? 'is-error' : pwdState === 'success' ? 'is-success' : ''}`}>
            <div className="auth-label-row">
              <label className="auth-label" htmlFor={passwordId}>
                Password <span className="auth-required" aria-label="required">*</span>
              </label>
              <a className="auth-link auth-small-link" href="/forgot-password">Forgot Password?</a>
            </div>
            <div className="auth-input-wrap has-icon">
              <span className="auth-input-icon"><Icon.Lock /></span>
              <input
                id={passwordId}
                type={showPwd ? 'text' : 'password'}
                name="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                aria-required="true"
                aria-label="Password"
                aria-describedby={`${passwordId}-error`}
                style={{ paddingRight: '42px' }}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <button type="button" className="auth-pwd-toggle" aria-label={showPwd ? 'Hide password' : 'Show password'} onClick={() => setShowPwd((v) => !v)}>
                <Icon.Eye open={showPwd} />
              </button>
            </div>
            {pwdState === 'error' && <p id={`${passwordId}-error`} className="auth-msg auth-msg-error" role="alert"><Icon.Alert /> {fieldError.password}</p>}
          </div>

          {formError && (
            <div className="auth-error" role="alert"><Icon.Alert /><span>{formError}</span></div>
          )}

          <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading} style={{ marginTop: 22 }}>
            {loading ? (<><span className="sn-spinner" /> Signing in…</>) : 'Sign In'}
          </button>
        </form>

        <GoogleSignInButton />

        <div className="auth-divider"><span>Demo Accounts</span></div>

        <div className="auth-demo-grid">
          {demoAccounts.map((d) => (
            <button
              key={d.email}
              type="button"
              className="auth-demo-card"
              onClick={() => { setEmail(d.email); setPassword(d.pwd); }}
            >
              <span className="auth-demo-dot" style={{ background: d.color }} />
              <div>
                <p className="auth-demo-label">{d.label}</p>
                <p className="auth-demo-email">{d.email}</p>
              </div>
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 18 }}>
          By signing in you agree to our{' '}
          <a href="#" style={{ color: '#ff6d34' }}>Terms</a> and{' '}
          <a href="#" style={{ color: '#ff6d34' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

// ── Google Sign-In Button ────────────────────────────────
const GoogleSignInButton = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google/status`)
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled))
      .catch(() => {});
  }, []);

  if (!enabled) return null;

  return (
    <button
      type="button"
      className="auth-button"
      style={{
        marginTop: 14,
        background: '#fff',
        border: '1px solid #dadce0',
        color: '#3c4043',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontWeight: 500,
      }}
      onClick={() => {
        window.location.href = `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google?returnTo=/`;
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continue with Google
    </button>
  );
};

export default Login;
