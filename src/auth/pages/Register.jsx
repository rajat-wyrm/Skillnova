import { useId, useState } from 'react';
import { useAuthStore } from '../../lib/auth';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import '../auth.css';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const passwordError = (value) => {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) return 'Use uppercase, lowercase, and a number.';
  return '';
};

const Register = () => {
  const uid = useId();
  const goToAuthView = useAuthStore((state) => state.goToAuthView);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError('Enter your full name.');
    if (!isValidEmail(form.email)) return setError('Enter a valid email address.');
    const pwdError = passwordError(form.password);
    if (pwdError) return setError(pwdError);
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(), email: form.email.trim(), password: form.password,
      });
      setSuccess(data.message);
      notify.success('Your SkillNova account has been created.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <a href="#register-form" className="auth-skip-link">Skip to form</a>
      <div className="auth-card" role="main" aria-label="Create a SkillNova account">
        <button type="button" className="auth-back-btn" onClick={() => goToAuthView('login')}>← Back to sign in</button>
        <div className="flex justify-center mb-3"><img src="/logo.png" alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} /></div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Start your SkillNova journey as an intern.</p>
        <form id="register-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor={`${uid}-name`}>Full name <span className="auth-required">*</span></label>
            <input id={`${uid}-name`} name="name" className="auth-input" value={form.name} onChange={update} autoComplete="name" required />
          </div>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor={`${uid}-email`}>Email address <span className="auth-required">*</span></label>
            <input id={`${uid}-email`} name="email" type="email" className="auth-input" value={form.email} onChange={update} autoComplete="email" required />
          </div>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor={`${uid}-role`}>Account type</label>
            <select id={`${uid}-role`} className="auth-select" value="INTERN" disabled aria-describedby={`${uid}-role-help`}><option value="INTERN">Intern</option></select>
            <p id={`${uid}-role-help`} className="auth-helper">Mentor and administrator accounts are provisioned by an administrator.</p>
          </div>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor={`${uid}-password`}>Password <span className="auth-required">*</span></label>
            <input id={`${uid}-password`} name="password" type="password" className="auth-input" value={form.password} onChange={update} autoComplete="new-password" required />
            <p className="auth-helper">At least 8 characters with uppercase, lowercase, and a number.</p>
          </div>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor={`${uid}-confirm`}>Confirm password <span className="auth-required">*</span></label>
            <input id={`${uid}-confirm`} name="confirmPassword" type="password" className="auth-input" value={form.confirmPassword} onChange={update} autoComplete="new-password" required />
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {success && <p className="auth-msg auth-msg-success" role="status">{success}</p>}
          <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
        </form>
        <p className="auth-account-prompt">Already have an account? <button type="button" className="auth-link" onClick={() => goToAuthView('login')}>Sign In</button></p>
      </div>
    </div>
  );
};

export default Register;
