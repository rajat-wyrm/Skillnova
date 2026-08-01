// ════════════════════════════════════════════════════════════
//  AUTH — Signup.jsx (OTP-based)
// ════════════════════════════════════════════════════════════
import { useState } from "react";
import { useAuthStore } from "../../lib/auth";
import { getErrorMessage } from "../../lib/api";
import notify from "../../lib/toast";
import { APP_CONSTANTS } from "../../shared/config/constants";
import "../auth.css";

const Signup = () => {
  const signupStart = useAuthStore((s) => s.signupStart);
  const signupVerify = useAuthStore((s) => s.signupVerify);
  const goBackToLogin = useAuthStore((s) => s.goBackToLogin);
  const loading = useAuthStore((s) => s.loading);
  const step = useAuthStore((s) => s.step);
  const contactHint = useAuthStore((s) => s.contactHint);
  const devCode = useAuthStore((s) => s.devCode);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    isIntern: true,
    internStartDate: "",
    internEndDate: "",
  });
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.email || !form.password) {
      setFormError("Fill in required fields.");
      return;
    }

    // Validate dates if intern dates provided
    if (form.isIntern && form.internStartDate) {
      const startDate = new Date(form.internStartDate);
      if (isNaN(startDate.getTime())) {
        setFormError("Invalid start date.");
        return;
      }
      if (form.internEndDate) {
        const endDate = new Date(form.internEndDate);
        if (isNaN(endDate.getTime())) {
          setFormError("Invalid end date.");
          return;
        }
        if (endDate < startDate) {
          setFormError("End date must be after start date.");
          return;
        }
      }
    }

    try {
      const result = await signupStart(form);
      if (result.step === "otp_required")
        notify.success("OTP sent — check your email.");
    } catch (err) {
      setFormError(getErrorMessage(err) || "Signup failed. Please try again.");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!otp || otp.length !== 6) {
      setFormError("Enter a valid 6-digit OTP.");
      return;
    }

    try {
      const result = await signupVerify({ code: otp });
      notify.success("Account created successfully!");
      return result;
    } catch (err) {
      setFormError(getErrorMessage(err) || "OTP verification failed. Try again.");
    }
  };

  const handleBackToForm = () => {
    setOtp("");
    setFormError("");
    setForm({
      name: "",
      email: "",
      password: "",
      isIntern: true,
      internStartDate: "",
      internEndDate: "",
    });
  };

  return (
    <div className="auth-container">
      <div
        className="auth-card"
        role="main"
        aria-label={step === "signup_otp" ? "Enter OTP" : "Create your SkillNova account"}
      >
        <div className="flex justify-center mb-3">
          <img
            src={APP_CONSTANTS.LOGO_PATH}
            alt="SkillNova"
            style={{ height: 44, mixBlendMode: "multiply" }}
          />
        </div>

        {step !== "signup_otp" ? (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">
              Join SkillNova and start your learning journey.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-form-group">
                <label className="auth-label">
                  Full name <span className="auth-required">*</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input"
                    placeholder="e.g. Ketki Gaikwad"
                    value={form.name}
                    onChange={update("name")}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  Email <span className="auth-required">*</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@gmail.com"
                    value={form.email}
                    onChange={update("email")}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  Password <span className="auth-required">*</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={update("password")}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isIntern}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isIntern: e.target.checked }))
                    }
                  />
                  <span>I am joining as an intern</span>
                </label>
              </div>

              {form.isIntern && (
                <>
                  <div className="auth-form-group">
                    <label className="auth-label">Internship Start Date</label>
                    <div className="auth-input-wrap">
                      <input
                        className="auth-input"
                        type="datetime-local"
                        value={form.internStartDate}
                        onChange={update("internStartDate")}
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-label">Internship End Date</label>
                    <div className="auth-input-wrap">
                      <input
                        className="auth-input"
                        type="datetime-local"
                        value={form.internEndDate}
                        onChange={update("internEndDate")}
                      />
                    </div>
                  </div>
                </>
              )}

              {formError && (
                <div className="auth-error" role="alert">
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                className={`auth-button${loading ? " is-loading" : ""}`}
                disabled={loading}
                style={{ marginTop: 22 }}
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 13, marginTop: 18 }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={goBackToLogin}
                style={{
                  color: "#ff6d34",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Verify Email</h1>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to <strong>{contactHint}</strong>
            </p>

            <form onSubmit={handleOtpSubmit} noValidate>
              <div className="auth-form-group">
                <label className="auth-label">
                  One-Time Password <span className="auth-required">*</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    className="auth-input"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    maxLength="6"
                    inputMode="numeric"
                    style={{ letterSpacing: "0.5em", fontSize: "1.5em", textAlign: "center" }}
                  />
                </div>
              </div>

              {devCode && (
                <div className="auth-info" style={{ background: "#f0f0f0", padding: "12px", borderRadius: "6px", marginBottom: "16px", textAlign: "center", fontSize: "13px" }}>
                  <strong>Dev Mode:</strong> OTP: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: "3px" }}>{devCode}</code>
                </div>
              )}

              {formError && (
                <div className="auth-error" role="alert">
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                className={`auth-button${loading ? " is-loading" : ""}`}
                disabled={loading}
                style={{ marginTop: 22 }}
              >
                {loading ? "Verifying…" : "Verify & Create Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 13, marginTop: 18 }}>
              <button
                type="button"
                onClick={handleBackToForm}
                disabled={loading}
                style={{
                  color: "#ff6d34",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ← Back
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
