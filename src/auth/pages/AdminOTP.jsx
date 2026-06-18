// ════════════════════════════════════════════════════════════
//  AUTH — AdminOTP.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import { Shield, ArrowLeft, RefreshCw, Mail } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import notify from '../../lib/toast';
import '../auth.css';

const LEN = 6;

const AdminOTP = () => {
  const verify = useAuthStore((s) => s.verifyOtp);
  const goBack = useAuthStore((s) => s.goBackToLogin);
  const loading = useAuthStore((s) => s.loading);
  const devCode = useAuthStore((s) => s.devCode);
  const contactHint = useAuthStore((s) => s.user?.email) || '';

  const [digits, setDigits] = useState(Array(LEN).fill(''));
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const inputs = useRef([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    inputs.current[0]?.focus();
    if (devCode) {
      const arr = devCode.split('');
      setDigits(arr.concat(Array(LEN - arr.length).fill('')));
    }
  }, [devCode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, LEN);
    if (!text) return;
    const arr = text.split('').concat(Array(LEN - text.length).fill(''));
    setDigits(arr);
    inputs.current[Math.min(text.length, LEN - 1)]?.focus();
  };

  const submit = async (code) => {
    setError('');
    try {
      await verify({ code, useTotp: false });
      notify.success('Verified — welcome back!');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code.');
      setDigits(Array(LEN).fill(''));
      inputs.current[0]?.focus();
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setError('');
    try {
      // For dev: just refire login to get a fresh devCode via notify
      notify.info('Code re-sent (dev: check server logs)');
      setResendIn(30);
    } catch {
      notify.error('Failed to resend');
    }
  };

  const code = digits.join('');
  const ready = code.length === LEN;

  return (
    <div className="auth-container">
      <div className="auth-card" role="main" aria-label="Verify your identity">
        <button onClick={goBack} className="auth-back-btn" type="button" aria-label="Back to login">
          <ArrowLeft size={14} /> Back to login
        </button>

        <div className="auth-icon-hero" style={{ background: 'linear-gradient(135deg, #ff6d34, #ff8c5f)' }}>
          <Shield size={26} className="text-white" />
        </div>
        <h1 className="auth-title">Admin Verification</h1>
        <p className="auth-subtitle">Enter the 6-digit code we sent to your registered email to continue.</p>

        {devCode && (
          <div className="auth-dev-banner" role="status">
            <Mail size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            <strong>Dev mode:</strong> Your code is <code style={{ userSelect: 'all' }}>{devCode}</code>
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
              (In production, the code is sent to {contactHint.replace(/(.{2}).+(@.+)/, '$1***$2')})
            </div>
          </div>
        )}

        <div className="auth-otp-grid" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              className={`auth-otp-cell ${d ? 'has-value' : ''} ${error ? 'has-error' : ''}`}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              aria-label={`Digit ${i + 1}`}
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <div className="auth-error" role="alert">{error}</div>
        )}

        <button
          onClick={() => submit(code)}
          className={`auth-button${loading ? ' is-loading' : ''}`}
          disabled={!ready || loading}
          style={{ marginTop: 18 }}
        >
          {loading ? (<><span className="sn-spinner" /> Verifying…</>) : 'Verify & Continue'}
        </button>

        <div className="flex items-center justify-between mt-4" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <button onClick={goBack} type="button" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <RefreshCw size={12} /> Use a different account
          </button>
          <button onClick={resend} type="button" className="auth-link" disabled={resendIn > 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: resendIn > 0 ? 0.5 : 1 }}>
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOTP;
