import { useState, useId } from 'react';
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
  Key: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Alert: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const ForgotPassword = () => {
  const uid = useId();
  const {
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    goBackToLogin,
    loading,
    devCode,
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [stage, setStage] = useState(1); // 1 = Request, 2 = Verify & Reset
  
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const emailId = `${uid}-email`;
  const codeId = `${uid}-code`;
  const newPasswordId = `${uid}-new-pwd`;
  const confirmPasswordId = `${uid}-confirm-pwd`;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email.trim()) return setFormError('Email address is required.');

    try {
      await forgotPassword(email.trim());
      notify.success('Verification code sent to your email.');
      setStage(2);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to request reset. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFormError('');

    if (code.trim().length !== 6) return setFormError('Please enter a valid 6-digit verification code.');
    if (newPassword.length < 8) return setFormError('Password must be at least 8 characters long.');
    if (newPassword !== confirmPassword) return setFormError('Passwords do not match.');

    try {
      // 1. Verify code and fetch reset session token
      await verifyResetOtp(code.trim());
      // 2. Perform the actual password reset using that session token
      await resetPassword(newPassword);
      notify.success('Password updated successfully! Please sign in.');
    } catch (err) {
      setFormError(err.response?.data?.error || 'Reset failed. Incorrect code or expired session.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="main" aria-label="Password recovery">
        <div className="flex justify-center mb-3">
          <img src={APP_CONSTANTS.LOGO_PATH} alt="SkillNova" style={{ height: 44, mixBlendMode: 'multiply' }} />
        </div>
        
        <h1 className="auth-title">Password Recovery</h1>
        <p className="auth-subtitle">
          {stage === 1 
            ? 'Enter your email address to receive a verification code.' 
            : 'Enter the 6-digit verification code and set your new password.'
          }
        </p>

        {stage === 1 ? (
          <form onSubmit={handleRequestOtp} noValidate>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor={emailId}>Email address</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon" aria-hidden="true"><Icon.Mail /></span>
                <input
                  id={emailId}
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
                />
              </div>
            </div>

            {formError && (
              <div className="auth-error" role="alert"><Icon.Alert /><span>{formError}</span></div>
            )}

            <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading} style={{ marginTop: 20 }}>
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} noValidate>
            {devCode && (
              <div style={{ background: 'rgba(255,109,52,0.1)', color: '#ff6d34', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', marginBottom: 16, border: '1px dashed #ff6d34' }}>
                🔑 [Dev Mode] Reset Verification Code: {devCode}
              </div>
            )}

            <div className="auth-form-group">
              <label className="auth-label" htmlFor={codeId}>6-Digit Code</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon" aria-hidden="true"><Icon.Key /></span>
                <input
                  id={codeId}
                  type="text"
                  maxLength={6}
                  className="auth-input"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setFormError(''); }}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor={newPasswordId}>New Password</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon" aria-hidden="true"><Icon.Lock /></span>
                <input
                  id={newPasswordId}
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFormError(''); }}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor={confirmPasswordId}>Confirm New Password</label>
              <div className="auth-input-wrap has-icon">
                <span className="auth-input-icon" aria-hidden="true"><Icon.Lock /></span>
                <input
                  id={confirmPasswordId}
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFormError(''); }}
                />
              </div>
            </div>

            {formError && (
              <div className="auth-error" role="alert"><Icon.Alert /><span>{formError}</span></div>
            )}

            <button type="submit" className={`auth-button${loading ? ' is-loading' : ''}`} disabled={loading} style={{ marginTop: 20 }}>
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <button 
          type="button" 
          onClick={goBackToLogin}
          className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold mt-4 transition hover:text-orange-500"
          style={{ background: 'none', border: 'none', color: '#ff6d34', cursor: 'pointer', padding: 0 }}
        >
          <Icon.ArrowLeft /> Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
