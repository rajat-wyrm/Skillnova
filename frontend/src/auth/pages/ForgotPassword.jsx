// ════════════════════════════════════════════════════════════
//  AUTH — ForgotPassword.jsx
// ════════════════════════════════════════════════════════════
import { useState, useId } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import '../auth.css';

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const ForgotPassword = ({ onBack }) => {
  const uid = useId();
  const emailId = `${uid}-email`;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isValidEmail(email)) {
      setFormError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="main" aria-label="Forgot password">
        <div className="flex justify-center mb-3">
          <img src="/logo.png" alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} />
        </div>
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

        {sent ? (
          <div className="auth-msg auth-msg-success" style={{ marginTop: 20 }}>
            If that email exists, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor={emailId}>
                Email address <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrap has-icon">
                <input
                  id={emailId}
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <div className="auth-error" role="alert"><span>{formError}</span></div>
            )}

            <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading} style={{ marginTop: 22 }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

                <p style={{ textAlign: 'center', fontSize: 13, marginTop: 18 }}>
          <button type="button" onClick={onBack} style={{ color: '#ff6d34', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;