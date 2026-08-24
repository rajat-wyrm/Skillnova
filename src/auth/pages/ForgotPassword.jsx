import { useId, useState } from 'react';
import { useAuthStore } from '../../lib/auth';
import api, { getErrorMessage } from '../../lib/api';
import '../auth.css';

const ForgotPassword = () => {
  const emailId = useId();
  const goToAuthView = useAuthStore((state) => state.goToAuthView);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(data.message);
      setDevCode(data.devCode || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <a href="#forgot-password-form" className="auth-skip-link">Skip to form</a>
      <div className="auth-card" role="main" aria-label="Request a password reset">
        <button type="button" className="auth-back-btn" onClick={() => goToAuthView('login')}>← Back to sign in</button>
        <div className="flex justify-center mb-3"><img src="/logo.png" alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} /></div>
        <h1 className="auth-title">Forgot Password?</h1>
        <p className="auth-subtitle">Enter your email and we’ll send a reset code.</p>
        <form id="forgot-password-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor={emailId}>Email address <span className="auth-required">*</span></label>
            <input id={emailId} type="email" className="auth-input" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} autoComplete="email" required />
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {message && <p className="auth-msg auth-msg-success" role="status">{message}</p>}
          {devCode && <p className="auth-dev-banner">Development reset code: <code>{devCode}</code></p>}
          <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading}>{loading ? 'Sending code…' : 'Request Password Reset'}</button>
        </form>
        {message && <p className="auth-account-prompt"><button type="button" className="auth-link" onClick={() => goToAuthView('reset-password', { resetEmail: email.trim() })}>Enter reset code</button></p>}
      </div>
    </div>
  );
};

export default ForgotPassword;
