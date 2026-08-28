// ════════════════════════════════════════════════════════════
//  AUTH — ResetPassword.jsx
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import '../auth.css';

const ResetPassword = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!token) {
      setFormError('Missing or invalid reset link.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setDone(true);
    } catch (err) {
      setFormError(getErrorMessage(err));
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
        <p className="auth-subtitle">Enter your new password below.</p>

        {done ? (
          <div className="auth-msg auth-msg-success" style={{ marginTop: 20 }}>
            Password reset successfully. <a href="/login" style={{ color: '#ff6d34' }}>Sign in now</a>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="newPassword">
                New Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrap has-icon">
                <input
                  id="newPassword"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="confirmPassword">
                Confirm Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrap has-icon">
                <input
                  id="confirmPassword"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <div className="auth-error" role="alert"><span>{formError}</span></div>
            )}

            <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading} style={{ marginTop: 22 }}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;