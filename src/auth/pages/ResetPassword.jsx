import { useId, useState } from 'react';
import { useAuthStore } from '../../lib/auth';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import '../auth.css';

const ResetPassword = () => {
  const uid = useId();
  const resetEmail = useAuthStore((state) => state.resetEmail);
  const goToAuthView = useAuthStore((state) => state.goToAuthView);
  const [form, setForm] = useState({ email: resetEmail, code: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); setError(''); };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    if (!/^\d{6}$/.test(form.code.trim())) return setError('Enter the 6-digit reset code.');
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) return setError('Use at least 8 characters with uppercase, lowercase, and a number.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email: form.email.trim(), code: form.code.trim(), password: form.password });
      setSuccess(data.message); notify.success('Password reset successfully.');
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <a href="#reset-password-form" className="auth-skip-link">Skip to form</a>
      <div className="auth-card" role="main" aria-label="Reset your SkillNova password">
        <button type="button" className="auth-back-btn" onClick={() => goToAuthView('forgot-password', { resetEmail: form.email })}>← Back</button>
        <div className="flex justify-center mb-3"><img src="/logo.png" alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} /></div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter the reset code and choose a new password.</p>
        <form id="reset-password-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-group"><label className="auth-label" htmlFor={`${uid}-email`}>Email address <span className="auth-required">*</span></label><input id={`${uid}-email`} name="email" type="email" className="auth-input" value={form.email} onChange={update} autoComplete="email" required /></div>
          <div className="auth-form-group"><label className="auth-label" htmlFor={`${uid}-code`}>Reset code <span className="auth-required">*</span></label><input id={`${uid}-code`} name="code" inputMode="numeric" pattern="[0-9]*" maxLength="6" className="auth-input" value={form.code} onChange={update} autoComplete="one-time-code" required /></div>
          <div className="auth-form-group"><label className="auth-label" htmlFor={`${uid}-password`}>New password <span className="auth-required">*</span></label><input id={`${uid}-password`} name="password" type="password" className="auth-input" value={form.password} onChange={update} autoComplete="new-password" required /></div>
          <div className="auth-form-group"><label className="auth-label" htmlFor={`${uid}-confirm`}>Confirm new password <span className="auth-required">*</span></label><input id={`${uid}-confirm`} name="confirmPassword" type="password" className="auth-input" value={form.confirmPassword} onChange={update} autoComplete="new-password" required /></div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {success && <p className="auth-msg auth-msg-success" role="status">{success}</p>}
          <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading}>{loading ? 'Resetting password…' : 'Reset Password'}</button>
        </form>
        <p className="auth-account-prompt"><button type="button" className="auth-link" onClick={() => goToAuthView('login')}>Back to Sign In</button></p>
      </div>
    </div>
  );
};

export default ResetPassword;
