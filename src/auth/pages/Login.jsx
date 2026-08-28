import { useId, useState } from "react";
import { useAuthStore } from "../../lib/auth";
import { APP_CONSTANTS } from "../../shared/config/constants";
import "../auth.css";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const Login = () => {
  const uid = useId();
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const login = useAuthStore((state) => state.login);
  const goToSignup = useAuthStore((state) => state.goToSignup);
  const loading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");

  const validate = (name, value) => {
    const message = name === "email"
      ? (!value.trim() ? "Email address is required." : !isValidEmail(value) ? "Enter a valid email address." : "")
      : (!value.trim() ? "Password is required." : "");
    setErrors((current) => ({ ...current, [name]: message }));
    return message;
  };

  const handleChange = ({ target: { name, value } }) => {
    if (name === "email") setEmail(value);
    else setPassword(value);
    setFormError("");
    if (touched[name]) validate(name, value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    const emailError = validate("email", email);
    const codeError = validate("password", password);
    if (emailError || codeError) return;
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      setFormError(error.response?.data?.error || "Unable to start sign in. Please try again.");
    }
  };

  const fieldState = (name, value) => touched[name] && (errors[name] ? "is-error" : value ? "is-success" : "");
  const blur = (name) => (event) => {
    setTouched((current) => ({ ...current, [name]: true }));
    validate(name, event.target.value);
  };

  return (
    <div className="auth-container">
      <a href="#main-form" className="auth-skip-link">Skip to form</a>
      <main className="auth-card" aria-label="Intern sign in to SkillNova">
        <div className="flex justify-center mb-3">
          <img src={APP_CONSTANTS.LOGO_PATH} alt="SkillNova" style={{ height: 44, mixBlendMode: "multiply" }} />
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Enter your email and password to receive a secure sign-in code.</p>

        <form id="main-form" onSubmit={handleSubmit} noValidate>
          <div className={`auth-form-group ${fieldState("email", email)}`}>
            <label className="auth-label" htmlFor={emailId}>Email address <span className="auth-required">*</span></label>
            <div className="auth-input-wrap has-icon">
              <span className="auth-input-icon" aria-hidden="true">✉</span>
              <input id={emailId} className="auth-input" type="email" name="email" value={email} placeholder="you@example.com" autoComplete="email" onChange={handleChange} onBlur={blur("email")} aria-invalid={Boolean(errors.email)} />
            </div>
            {touched.email && errors.email && <p className="auth-msg auth-msg-error" role="alert">{errors.email}</p>}
          </div>

          <div className={`auth-form-group ${fieldState("password", password)}`}>
            <label className="auth-label" htmlFor={passwordId}>Password / Intern Code <span className="auth-required">*</span></label>
            <div className="auth-input-wrap has-icon">
              <span className="auth-input-icon" aria-hidden="true">🔒</span>
              <input id={passwordId} className="auth-input" type={showCode ? "text" : "password"} name="password" value={password} placeholder="Enter your password" autoComplete="off" onChange={handleChange} onBlur={blur("password")} aria-invalid={Boolean(errors.password)} style={{ paddingRight: 42 }} />
              <button type="button" className="auth-pwd-toggle" onClick={() => setShowCode((current) => !current)} aria-label={showCode ? "Hide password" : "Show password"}>{showCode ? "◉" : "◌"}</button>
            </div>
            {touched.password && errors.password && <p className="auth-msg auth-msg-error" role="alert">{errors.password}</p>}
          </div>

          {formError && <div className="auth-error" role="alert">{formError}</div>}
          <button type="submit" className={`auth-button${loading ? " is-loading" : ""}`} disabled={loading} style={{ marginTop: 22 }}>
            {loading ? <><span className="sn-spinner" /> Sending OTP…</> : "Send OTP"}
          </button>
        </form>

        <div className="auth-divider"><span>Demo Accounts</span></div>

        <div className="auth-demo-grid">
          {[
            { label: 'Super Admin', email: 'superadmin@skillnova.com', pwd: 'SuperAdmin#2026', color: '#7C3AED' },
            { label: 'Admin', email: 'admin@skillnova.com', pwd: 'Admin#2026', color: '#ff6d34' },
            { label: 'Mentor', email: 'mentor@skillnova.com', pwd: 'Mentor#2026', color: '#7C3AED' },
            { label: 'Intern', email: 'rahul@skillnova.com', pwd: 'User#2026', color: '#00bea3' },
          ].map((d) => (
            <button
              key={d.email}
              type="button"
              className="auth-demo-card"
              onClick={() => { setEmail(d.email); setPassword(d.pwd); setFormError(""); }}
            >
              <span className="auth-demo-dot" style={{ background: d.color }} />
              <div>
                <p className="auth-demo-label">{d.label}</p>
                <p className="auth-demo-email">{d.email}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="auth-otp-note" role="status">After your details are validated, we’ll send a one-time code to your email.</p>
        <p style={{ textAlign: "center", fontSize: 13, marginTop: 16 }}>
          New intern with an invite code? {" "}
          <button type="button" onClick={goToSignup} className="auth-link">Create your account</button>
        </p>
      </main>
    </div>
  );
};

export default Login;
