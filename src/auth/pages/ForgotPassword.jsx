import { useId, useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import '../auth.css';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const ForgotPassword = () => {
  const emailId = `${useId()}-email`;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setDevUrl('');
    if (!email.trim()) return setError('Email address is required.');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(data.message || 'Reset link generated.');
      setDevUrl(data.resetUrl || '');
      notify.success('Password reset link generated.');
    } catch (err) {
      setError(getErrorMessage(err));
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
        <p className="auth-subtitle">Enter your email to generate a secure reset link.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`auth-form-group ${error ? 'is-error' : ''}`}>
            <label className="auth-label" htmlFor={emailId}>Email <span className="auth-required">*</span></label>
            <input id={emailId} className="auth-input" type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} />
            {error && <p className="auth-msg auth-msg-error">{error}</p>}
          </div>

          {message && <div className="auth-success" role="status">{message}</div>}
          {devUrl && <a className="auth-dev-link" href={devUrl}>Open development reset link</a>}

          <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading}>
            {loading ? <><span className="sn-spinner" /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer-text">
          <a className="auth-link" href="/login">Back to Login</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
