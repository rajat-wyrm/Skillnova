// ══════════════════════════════════════════════
//  AUTH — AdminOTP.jsx  (Improved Form Design)
//  Task: Better input styles, validation, accessibility
// ══════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import '../auth.css';

const OTP_LENGTH = 6;

const IconShield = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
    stroke="#ff6d34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', margin: '0 auto 14px' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
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

const AdminOTP = ({ tempUser, onVerify, onCancel }) => {
  const [otp, setOtp]           = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  /* Focus first input on mount */
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  /* Resend countdown */
  useEffect(() => {
    if (canResend) return;
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [canResend]);

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setCanResend(false);
    setCountdown(30);
    inputRefs.current[0]?.focus();
    // In production: trigger resend API call here
  };

  /* Verify OTP */
  const verifyOTP = useCallback(async (otpString) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500)); // simulate async
    setLoading(false);

    if (otpString === '123456') {
      onVerify();
    } else {
      setError('Invalid OTP code. Use 123456 for demo.');
      setOtp(Array(OTP_LENGTH).fill(''));
      // Apply error class then clear
      inputRefs.current.forEach(el => {
        if (el) { el.classList.add('is-error'); }
      });
      setTimeout(() => {
        inputRefs.current.forEach(el => {
          if (el) el.classList.remove('is-error');
        });
      }, 600);
      inputRefs.current[0]?.focus();
    }
  }, [onVerify]);

  /* Handle digit input */
  const handleChange = (index, value) => {
    // Accept only digits; handle paste of multiple digits
    const digits = value.replace(/\D/g, '');
    if (!digits && value !== '') return;

    const newOtp = [...otp];

    if (digits.length > 1) {
      // Paste: distribute across boxes
      const pasted = digits.slice(0, OTP_LENGTH - index);
      pasted.split('').forEach((d, i) => { newOtp[index + i] = d; });
      const nextEmpty = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextEmpty]?.focus();
    } else {
      newOtp[index] = digits;
      if (digits && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setOtp(newOtp);
    setError('');

    // Update filled visual class
    newOtp.forEach((d, i) => {
      const el = inputRefs.current[i];
      if (el) el.classList.toggle('is-filled', !!d);
    });

    if (newOtp.every(d => d !== '')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        const el = inputRefs.current[index - 1];
        if (el) el.classList.remove('is-filled');
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        const el = inputRefs.current[index];
        if (el) el.classList.remove('is-filled');
      }
      setError('');
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (e.key === 'Enter' && otp.every(d => d)) verifyOTP(otp.join(''));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (otp.some(d => !d)) {
      setError('Please enter all 6 digits.');
      return;
    }
    verifyOTP(otp.join(''));
  };

  const filled = otp.filter(Boolean).length;

  return (
    <div className="auth-container">
      <a href="#otp-form" className="auth-skip-link">Skip to OTP form</a>

      <div className="auth-card" role="main" aria-label="Admin OTP verification">

        <IconShield />
        <h1 className="auth-title">Admin Verification</h1>
        <p className="auth-subtitle">
          Enter the 6-digit OTP sent to{' '}
          <strong style={{ color: '#d1d5db' }}>{tempUser?.email}</strong>.
        </p>

        <form id="otp-form" onSubmit={handleSubmit} noValidate>
          {/* Screen-reader group label */}
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="auth-label" style={{ marginBottom: '12px' }}>
              One-time password — enter each digit
            </legend>

            <div
              className="otp-input-group"
              role="group"
              aria-label="OTP digits"
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={OTP_LENGTH} /* allow paste */
                  className="otp-input"
                  value={digit}
                  aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onFocus={e => e.target.select()}
                  ref={el => (inputRefs.current[index] = el)}
                  disabled={loading}
                />
              ))}
            </div>
          </fieldset>

          {/* Progress indicator */}
          <div
            style={{
              height: '3px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '2px',
              marginBottom: '16px',
              overflow: 'hidden',
            }}
            aria-hidden="true"
          >
            <div
              style={{
                height: '100%',
                width: `${(filled / OTP_LENGTH) * 100}%`,
                background: filled === OTP_LENGTH ? '#00bea3' : '#ff6d34',
                borderRadius: '2px',
                transition: 'width 0.2s, background 0.3s',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="auth-error"
              role="alert"
              aria-live="assertive"
              style={{ marginBottom: '14px' }}
            >
              <IconAlert /><span>{error}</span>
            </div>
          )}

          {/* Resend */}
          <p className="auth-resend" aria-live="polite">
            Didn&rsquo;t receive it?{' '}
            <button
              type="button"
              className="auth-resend-btn"
              onClick={handleResend}
              disabled={!canResend}
              aria-disabled={!canResend}
            >
              {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
            </button>
          </p>

          <button
            type="submit"
            className={`auth-button${loading ? ' is-loading' : ''}`}
            aria-busy={loading}
            disabled={loading || otp.some(d => !d)}
          >
            {loading ? (
              <><span className="sn-spinner" aria-hidden="true" /> Verifying…</>
            ) : 'Verify OTP'}
          </button>

          <button
            type="button"
            className="auth-button auth-secondary-btn"
            onClick={onCancel}
          >
            Cancel Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminOTP;
