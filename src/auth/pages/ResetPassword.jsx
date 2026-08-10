import { useId, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import '../auth.css';

const isStrongPassword = (value) => (
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value)
);

const ResetPassword = () => {
  const uid = useId();
  const ids = useMemo(() => ({
    password: `${uid}-password`,
    confirmPassword: `${uid}-confirm-password`,
  }), [uid]);
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!token) next.form = 'Reset token is missing. Request a new reset link.';
    if (!password) next.password = 'New password is required.';
    else if (!isStrongPassword(password)) next.password = 'Use 8+ characters with uppercase, lowercase, and a number.';
    if (!confirmPassword) next.confirmPassword = 'Confirm your new password.';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password, confirmPassword });
      setMessage(data.message || 'Password reset successfully.');
      notify.success('Password reset successfully.');
    } catch (err) {
      setErrors({ form: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="main" aria-label="Reset password">
        <div className="flex justify-center mb-3">
          <img src="/logo.png" alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} />
        </div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Choose a strong new password for your account.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`auth-form-group ${errors.password ? 'is-error' : ''}`}>
            <label className="auth-label" htmlFor={ids.password}>New Password <span className="auth-required">*</span></label>
            <input id={ids.password} className="auth-input" type="password" value={password} autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} />
            {errors.password && <p className="auth-msg auth-msg-error">{errors.password}</p>}
          </div>

          <div className={`auth-form-group ${errors.confirmPassword ? 'is-error' : ''}`}>
            <label className="auth-label" htmlFor={ids.confirmPassword}>Confirm Password <span className="auth-required">*</span></label>
            <input id={ids.confirmPassword} className="auth-input" type="password" value={confirmPassword} autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} />
            {errors.confirmPassword && <p className="auth-msg auth-msg-error">{errors.confirmPassword}</p>}
          </div>

          {errors.form && <div className="auth-error" role="alert">{errors.form}</div>}
          {message && <div className="auth-success" role="status">{message}</div>}

          <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading || Boolean(message)}>
            {loading ? <><span className="sn-spinner" /> Resetting...</> : 'Reset Password'}
          </button>
        </form>

        <p className="auth-footer-text">
          <a className="auth-link" href="/login">Back to Login</a>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
