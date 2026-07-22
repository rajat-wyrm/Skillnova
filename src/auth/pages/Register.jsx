import { useId, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import notify from '../../lib/toast';
import '../auth.css';

const roles = [
  { label: 'Intern', value: 'INTERN' },
  { label: 'Mentor', value: 'MENTOR' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
];

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'INTERN',
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isStrongPassword = (value) => (
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value)
);

const Register = () => {
  const uid = useId();
  const ids = useMemo(() => ({
    name: `${uid}-name`,
    email: `${uid}-email`,
    password: `${uid}-password`,
    confirmPassword: `${uid}-confirm-password`,
    role: `${uid}-role`,
  }), [uid]);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email address is required.';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (!isStrongPassword(form.password)) next.password = 'Use 8+ characters with uppercase, lowercase, and a number.';
    if (!form.confirmPassword) next.confirmPassword = 'Confirm your password.';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    if (!form.role) next.role = 'Select a role.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFormError('');
    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });
      notify.success('Account created. You can sign in now.');
      window.location.assign('/login');
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide" role="main" aria-label="Create SkillNova account">
        <div className="flex justify-center mb-3">
          <img src="/logo.png" alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} />
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Set up your SkillNova access with the right role.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`auth-form-group ${errors.name ? 'is-error' : ''}`}>
            <label className="auth-label" htmlFor={ids.name}>Full Name <span className="auth-required">*</span></label>
            <input id={ids.name} className="auth-input" name="name" value={form.name} autoComplete="name" onChange={handleChange} />
            {errors.name && <p className="auth-msg auth-msg-error">{errors.name}</p>}
          </div>

          <div className={`auth-form-group ${errors.email ? 'is-error' : ''}`}>
            <label className="auth-label" htmlFor={ids.email}>Email <span className="auth-required">*</span></label>
            <input id={ids.email} className="auth-input" type="email" name="email" value={form.email} autoComplete="email" onChange={handleChange} />
            {errors.email && <p className="auth-msg auth-msg-error">{errors.email}</p>}
          </div>

          <div className="auth-grid-2">
            <div className={`auth-form-group ${errors.password ? 'is-error' : ''}`}>
              <label className="auth-label" htmlFor={ids.password}>Password <span className="auth-required">*</span></label>
              <input id={ids.password} className="auth-input" type="password" name="password" value={form.password} autoComplete="new-password" onChange={handleChange} />
              {errors.password && <p className="auth-msg auth-msg-error">{errors.password}</p>}
            </div>

            <div className={`auth-form-group ${errors.confirmPassword ? 'is-error' : ''}`}>
              <label className="auth-label" htmlFor={ids.confirmPassword}>Confirm Password <span className="auth-required">*</span></label>
              <input id={ids.confirmPassword} className="auth-input" type="password" name="confirmPassword" value={form.confirmPassword} autoComplete="new-password" onChange={handleChange} />
              {errors.confirmPassword && <p className="auth-msg auth-msg-error">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className={`auth-form-group ${errors.role ? 'is-error' : ''}`}>
            <label className="auth-label" htmlFor={ids.role}>Role <span className="auth-required">*</span></label>
            <select id={ids.role} className="auth-input" name="role" value={form.role} onChange={handleChange}>
              {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
            {errors.role && <p className="auth-msg auth-msg-error">{errors.role}</p>}
          </div>

          {formError && <div className="auth-error" role="alert">{formError}</div>}

          <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading}>
            {loading ? <><span className="sn-spinner" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <a className="auth-link" href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
