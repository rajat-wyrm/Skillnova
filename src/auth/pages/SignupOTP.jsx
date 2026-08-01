// ════════════════════════════════════════════════════════════
//  AUTH — SignupOTP.jsx (verify personal email during signup)
// ════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from "react";
import { MailCheck, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../lib/auth";
import { getErrorMessage } from "../../lib/api";
import notify from "../../lib/toast";
import "../auth.css";

const LEN = 6;

const SignupOTP = () => {
  const signupVerify = useAuthStore((s) => s.signupVerify);
  const goBack = useAuthStore((s) => s.goBackToLogin);
  const loading = useAuthStore((s) => s.loading);
  const devCode = useAuthStore((s) => s.devCode);
  const contactHint = useAuthStore((s) => s.contactHint);

  const [digits, setDigits] = useState(Array(LEN).fill(""));
  const [error, setError] = useState("");
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
    if (devCode) {
      const arr = devCode.split("");
      setDigits(arr.concat(Array(LEN - arr.length).fill("")));
    }
  }, [devCode]);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, LEN);
    if (!text) return;
    setDigits(text.split("").concat(Array(LEN - text.length).fill("")));
  };

  const submit = async () => {
    setError("");
    try {
      await signupVerify({ code: digits.join("") });
      notify.success("Account verified — welcome to SkillNova!");
    } catch (err) {
      setError(getErrorMessage(err) || "Invalid code.");
      setDigits(Array(LEN).fill(""));
      inputs.current[0]?.focus();
    }
  };

  const code = digits.join("");
  const ready = code.length === LEN;

  return (
    <div className="auth-container">
      <div className="auth-card" role="main" aria-label="Verify your email">
        <button onClick={goBack} className="auth-back-btn" type="button">
          <ArrowLeft size={14} /> Back to login
        </button>

        <div
          className="auth-icon-hero"
          style={{ background: "linear-gradient(135deg, #00bea3, #2563EB)" }}
        >
          <MailCheck size={26} className="text-white" />
        </div>
        <h1 className="auth-title">Verify Your Email</h1>
        <p className="auth-subtitle">
          Enter the 6-digit code sent to {contactHint || "your email"}.
        </p>

        {devCode && (
          <div className="auth-dev-banner" role="status">
            <strong>Dev mode:</strong> Your code is <code>{devCode}</code>
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
              className={`auth-otp-cell ${d ? "has-value" : ""} ${error ? "has-error" : ""}`}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              aria-label={`Digit ${i + 1}`}
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          className={`auth-button${loading ? " is-loading" : ""}`}
          disabled={!ready || loading}
          style={{ marginTop: 18 }}
        >
          {loading ? (
            <>
              <span className="sn-spinner" /> Verifying…
            </>
          ) : (
            "Verify & Continue"
          )}
        </button>
      </div>
    </div>
  );
};

export default SignupOTP;
