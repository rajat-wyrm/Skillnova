// ══════════════════════════════════════════════
//  AUTH — Login.jsx  (Improved Form Design)
//  Task: Better input styles, validation, accessibility
// ══════════════════════════════════════════════

import { useId, useState } from "react";
import { APP_CONFIG } from "../../shared/config/appConfig";
import "../auth.css";

/* ── Inline SVG icons (no extra dep) ─────────── */
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEye = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Validation helpers ───────────────────────── */
const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/* ── Component ───────────────────────────────── */
const Login = ({ onSubmit }) => {
  const uid = useId();
  const emailId   = `${uid}-email`;
  const passwordId = `${uid}-password`;

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [formError, setFormError] = useState('');

  // Per-field touched + error state
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldError, setFieldError] = useState({ email: '', password: '' });

  /* Validate a single field and update state */
  const validateField = (name, value) => {
    let err = '';
    if (name === 'email') {
      if (!value.trim()) err = 'Email address is required.';
      else if (!isValidEmail(value)) err = 'Enter a valid email address.';
    }
    if (name === 'password') {
      if (!value) err = 'Password is required.';
      else if (value.length < 3) err = 'Password is too short.';
    }
    setFieldError(prev => ({ ...prev, [name]: err }));
    return err;
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'email')    setEmail(value);
    if (name === 'password') setPassword(value);
    setFormError('');
    if (touched[name]) validateField(name, value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');

    // Touch all fields so errors show
    setTouched({ email: true, password: true });
    const emailErr = validateField('email', email);
    const pwdErr   = validateField('password', password);
    if (emailErr || pwdErr) return;

    setLoading(true);

    try {
      await onSubmit({
        email,
        password,
      });
    } catch (error) {
      setFormError(error.message || "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  /* Derive per-field visual state */
  const emailState = touched.email
    ? (fieldError.email ? 'error' : email ? 'success' : '')
    : '';
  const pwdState = touched.password
    ? (fieldError.password ? 'error' : password ? 'success' : '')
    : '';

  return (
    <div className="auth-container">
      {/* Accessible skip link */}
      <a href="#main-form" className="auth-skip-link">Skip to form</a>

      <div
        className="auth-card"
        role="main"
        aria-label="Sign in to SkillNova"
      >
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">
          Sign in to your SkillNova account to continue.
        </p>

        <form
          id="main-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Login form"
        >
          {/* Email */}
          <div className={`auth-form-group ${emailState === 'error' ? 'is-error' : emailState === 'success' ? 'is-success' : ''}`}>
            <label className="auth-label" htmlFor={emailId}>
              Email address <span className="auth-required" aria-label="required">*</span>
            </label>
            <div className="auth-input-wrap has-icon has-status">
              <span className="auth-input-icon" aria-hidden="true"><IconMail /></span>
              <input
                id={emailId}
                type="email"
                name="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                aria-required="true"
                aria-describedby={`${emailId}-error ${emailId}-success`}
                aria-invalid={emailState === 'error' ? 'true' : undefined}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {emailState === 'success' && (
                <span className="auth-input-status" aria-hidden="true"><IconCheck /></span>
              )}
              {emailState === 'error' && (
                <span className="auth-input-status" aria-hidden="true"><IconX /></span>
              )}
            </div>
            {emailState === 'error' && (
              <p
                id={`${emailId}-error`}
                className="auth-msg auth-msg-error"
                role="alert"
                aria-live="polite"
              >
                <IconAlert /> {fieldError.email}
              </p>
            )}
            {emailState === 'success' && (
              <p
                id={`${emailId}-success`}
                className="auth-msg auth-msg-success"
                aria-live="polite"
              >
                <IconCheck /> Email looks good.
              </p>
            )}
          </div>

          {/* Password */}
          <div className={`auth-form-group ${pwdState === 'error' ? 'is-error' : pwdState === 'success' ? 'is-success' : ''}`}>
            <label className="auth-label" htmlFor={passwordId}>
              Password <span className="auth-required" aria-label="required">*</span>
            </label>
            <div className="auth-input-wrap has-icon">
              <span className="auth-input-icon" aria-hidden="true"><IconLock /></span>
              <input
                id={passwordId}
                type={showPwd ? 'text' : 'password'}
                name="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                aria-required="true"
                aria-describedby={`${passwordId}-error`}
                aria-invalid={pwdState === 'error' ? 'true' : undefined}
                style={{ paddingRight: '42px' }}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                onClick={() => setShowPwd(v => !v)}
              >
                <IconEye open={showPwd} />
              </button>
            </div>
            {pwdState === 'error' && (
              <p
                id={`${passwordId}-error`}
                className="auth-msg auth-msg-error"
                role="alert"
                aria-live="polite"
              >
                <IconAlert /> {fieldError.password}
              </p>
            )}
          </div>

          {/* General error */}
          {formError && (
            <div className="auth-error" role="alert" aria-live="assertive">
              <IconAlert />
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            className={`auth-button${loading ? ' is-loading' : ''}`}
            aria-busy={loading}
            disabled={loading}
            style={{ marginTop: '22px' }}
          >
            {loading ? (
              <>
                <span className="sn-spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider"><span>Demo Credentials</span></div>

        <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', lineHeight: '1.7', marginBottom: '16px' }}>
          <strong style={{ color: '#d1d5db' }}>Admin:</strong> {APP_CONFIG.demoAuth.admin.email} / {APP_CONFIG.demoAuth.admin.password}<br />
          <strong style={{ color: '#d1d5db' }}>User:</strong> {APP_CONFIG.demoAuth.intern.email} / {APP_CONFIG.demoAuth.intern.password}
        </p>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>
          Don&rsquo;t have an account?{' '}
          <button className="auth-link" type="button" aria-label="Go to sign up page">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
