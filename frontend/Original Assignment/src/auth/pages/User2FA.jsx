// ══════════════════════════════════════════════
//  AUTH — User2FA.jsx  (Improved Form Design)
//  Task: Better input styles, validation, accessibility
// ══════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import '../auth.css';

const CODE_LENGTH = 6;

const IconKey = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
    stroke="#00bea3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', margin: '0 auto 14px' }}>
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="m21 2-9.6 9.6"/>
    <path d="m15.5 7.5 3 3L22 7l-3-3"/>
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

const User2FA = ({ tempUser, onVerify, onCancel }) => {
  const [code, setCode]         = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const verify2FA = useCallback(async (codeString) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);

    if (codeString === '654321') {
      onVerify();
    } else {
      setError('Invalid code. Use 654321 for demo.');
      setCode(Array(CODE_LENGTH).fill(''));
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

  const handleChange = (index, value) => {
    const digits = value.replace(/\D/g, '');
    if (!digits && value !== '') return;

    const newCode = [...code];

    if (digits.length > 1) {
      const pasted = digits.slice(0, CODE_LENGTH - index);
      pasted.split('').forEach((d, i) => { newCode[index + i] = d; });
      const nextEmpty = Math.min(index + pasted.length, CODE_LENGTH - 1);
      inputRefs.current[nextEmpty]?.focus();
    } else {
      newCode[index] = digits;
      if (digits && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setCode(newCode);
    setError('');

    newCode.forEach((d, i) => {
      const el = inputRefs.current[i];
      if (el) el.classList.toggle('is-filled', !!d);
    });

    if (newCode.every(d => d !== '')) verify2FA(newCode.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.classList.remove('is-filled');
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
        inputRefs.current[index]?.classList.remove('is-filled');
      }
      setError('');
    }
    if (e.key === 'ArrowLeft'  && index > 0)             inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (e.key === 'Enter' && code.every(d => d))          verify2FA(code.join(''));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (code.some(d => !d)) { setError('Please enter all 6 digits.'); return; }
    verify2FA(code.join(''));
  };

  const filled = code.filter(Boolean).length;

  return (
    <div className="auth-container">
      <a href="#twofa-form" className="auth-skip-link">Skip to 2FA form</a>

      <div className="auth-card" role="main" aria-label="Two-factor authentication">

        <IconKey />
        <h1 className="auth-title">Two-Factor Authentication</h1>
        <p className="auth-subtitle">
          Enter the 6-digit code from your Authenticator app for{' '}
          <strong style={{ color: '#d1d5db' }}>{tempUser?.email}</strong>.
        </p>

        <form id="twofa-form" onSubmit={handleSubmit} noValidate>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="auth-label" style={{ marginBottom: '12px' }}>
              Authenticator code — enter each digit
            </legend>

            <div className="otp-input-group" role="group" aria-label="2FA code digits">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={CODE_LENGTH}
                  className="otp-input"
                  value={digit}
                  aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
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

          {/* Fill progress */}
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
                width: `${(filled / CODE_LENGTH) * 100}%`,
                background: filled === CODE_LENGTH ? '#00bea3' : '#ff6d34',
                borderRadius: '2px',
                transition: 'width 0.2s, background 0.3s',
              }}
            />
          </div>

          {error && (
            <div className="auth-error" role="alert" aria-live="assertive" style={{ marginBottom: '14px' }}>
              <IconAlert /><span>{error}</span>
            </div>
          )}

          <p className="auth-hint" style={{ textAlign: 'center', marginBottom: '18px' }}>
            Open your authenticator app to view your 6-digit code.
          </p>

          <button
            type="submit"
            className={`auth-button${loading ? ' is-loading' : ''}`}
            aria-busy={loading}
            disabled={loading || code.some(d => !d)}
          >
            {loading
              ? <><span className="sn-spinner" aria-hidden="true" /> Verifying…</>
              : 'Verify Code'}
          </button>

          <button
            type="button"
            className="auth-button auth-secondary-btn"
            onClick={onCancel}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default User2FA;
