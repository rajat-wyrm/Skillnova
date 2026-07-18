// ══════════════════════════════════════════════
//  USER — pages/Profile.jsx  (Improved Form Design)
//  Task: Better input styles, validation, accessibility
// ══════════════════════════════════════════════

import { useState, useId } from "react";
import { Edit, Save, X, User, Mail, Briefcase, GraduationCap, Link, Building, Calendar } from "lucide-react";
import { Card, SectionHeader } from "../../shared/components/UI";

/* ── Field definitions ───────────────────────── */
const FIELDS = [
  { label: "Full Name",     key: "name",       type: "text",  icon: User,          required: true,  maxLen: 80,
    validate: v => !v.trim() ? "Full name is required." : v.trim().length < 2 ? "Name must be at least 2 characters." : "" },
  { label: "Email",         key: "email",      type: "email", icon: Mail,          required: true,
    validate: v => !v.trim() ? "Email is required." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address." : "" },
  { label: "Role",          key: "role",       type: "text",  icon: Briefcase,     required: false, maxLen: 60 },
  { label: "Department",    key: "department", type: "text",  icon: Building,      required: false, maxLen: 60 },
  { label: "College",       key: "college",    type: "text",  icon: GraduationCap, required: false, maxLen: 100 },
  { label: "Year of Study", key: "year",       type: "text",  icon: null,          required: false },
  { label: "Date of Birth", key: "dob",        type: "date",  icon: Calendar,      required: false },
  { label: "LinkedIn",      key: "linkedin",   type: "url",   icon: Link,          required: false,
    validate: v => v && !/^https?:\/\/.+/.test(v) ? "Enter a valid URL starting with https://" : "" },
];

/* ── Inline icons ────────────────────────────── */
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Input styles via CSS-in-JS tokens ──────────
   We keep all colour values from the existing
   design system (--card, --border, --text etc.)  */

const inputBase = {
  width: "100%",
  padding: "9px 12px",
  fontSize: "14px",
  borderRadius: "8px",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s, background 0.15s",
  lineHeight: "1.5",
};

const stateStyles = {
  default: {
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  },
  focus: {
    border: "1px solid #2563eb",
    boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
  },
  error: {
    background: "rgba(220,38,38,0.04)",
    border: "1px solid #ef4444",
  },
  errorFocus: {
    boxShadow: "0 0 0 3px rgba(239,68,68,0.12)",
  },
  success: {
    border: "1px solid #10b981",
    background: "rgba(16,185,129,0.04)",
  },
  disabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};

/* ── FormField ───────────────────────────────── */
const FormField = ({ field, value, editing, onChange, touched, error }) => {
  const uid = useId();
  const [focused, setFocused] = useState(false);

  const { label, key, type, icon: Icon, required, maxLen } = field;
  const hasError   = touched && !!error;
  const hasSuccess = touched && !error && value;

  const inputStyle = {
    ...inputBase,
    ...stateStyles.default,
    ...(hasError   ? stateStyles.error   : {}),
    ...(hasSuccess ? stateStyles.success : {}),
    ...(focused && !hasError   ? stateStyles.focus      : {}),
    ...(focused && hasError    ? stateStyles.errorFocus  : {}),
    ...(!editing               ? stateStyles.disabled   : {}),
    paddingLeft: Icon ? "36px" : "12px",
    paddingRight: (hasError || hasSuccess) ? "36px" : "12px",
  };

  return (
    <div>
      {/* Label */}
      <label
        htmlFor={uid}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "12px",
          fontWeight: 500,
          marginBottom: "5px",
          color: "var(--muted)",
        }}
      >
        {label}
        {required && editing && (
          <span style={{ color: "#ff6d34", fontSize: "13px", lineHeight: 1 }} aria-label="required">*</span>
        )}
      </label>

      {/* Input wrapper */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {Icon && (
          <Icon
            size={14}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: hasError ? "#ef4444" : hasSuccess ? "#10b981" : "var(--muted)",
              pointerEvents: "none",
              transition: "color 0.2s",
              flexShrink: 0,
            }}
          />
        )}

        <input
          id={uid}
          type={type}
          name={key}
          value={value}
          disabled={!editing}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxLen}
          aria-required={required || undefined}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? `${uid}-err` : undefined}
          style={inputStyle}
          autoComplete={type === "email" ? "email" : type === "url" ? "url" : "off"}
        />

        {/* Status icon */}
        {editing && (hasError || hasSuccess) && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "10px",
              display: "flex",
              alignItems: "center",
              color: hasError ? "#ef4444" : "#10b981",
              pointerEvents: "none",
            }}
          >
            {hasSuccess ? <CheckIcon /> : <AlertIcon />}
          </span>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p
          id={`${uid}-err`}
          role="alert"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "4px",
            fontSize: "11.5px",
            color: "#ef4444",
            marginTop: "4px",
            lineHeight: 1.4,
          }}
        >
          <AlertIcon />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

/* ── Profile page ────────────────────────────── */
const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]     = useState(false);

  const [profile, setProfile] = useState({
    name:       "Rahul Sharma",
    email:      "rahul@skillnova.com",
    role:       "AI/ML Intern",
    department: "Artificial Intelligence",
    college:    "ABC Engineering College",
    dob:        "2003-05-12",
    year:       "Final Year",
    linkedin:   "https://linkedin.com/in/rahul",
    skills:     "Python, Machine Learning, Data Analysis",
  });

  // Snapshot for cancel
  const [snapshot, setSnapshot] = useState(null);

  // Per-field touched + error
  const [touched, setTouched]     = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (key, value) => {
    const f = FIELDS.find(f => f.key === key);
    if (!f?.validate) return "";
    return f.validate(value);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setSaved(false);
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const startEditing = () => {
    setSnapshot({ ...profile });
    setEditing(true);
    setSaved(false);
    setTouched({});
    setFieldErrors({});
  };

  const cancelEditing = () => {
    if (snapshot) setProfile(snapshot);
    setEditing(false);
    setTouched({});
    setFieldErrors({});
  };

  const handleSave = () => {
    // Touch all required fields
    const newTouched = {};
    const newErrors  = {};
    let hasError = false;
    FIELDS.forEach(f => {
      newTouched[f.key] = true;
      const err = validateField(f.key, profile[f.key]);
      newErrors[f.key] = err;
      if (err) hasError = true;
    });
    setTouched(newTouched);
    setFieldErrors(newErrors);
    if (hasError) return;

    setEditing(false);
    setSnapshot(null);
    setSaved(true);
  };

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  return (
    <div className="max-w-3xl space-y-6 w-full min-w-0">
      <SectionHeader title="My Profile" subtitle="Manage your profile information" />

      <Card className="overflow-hidden">
        {/* Cover */}
        <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }} />

        <div className="px-6 pb-6">
          {/* Avatar + name row */}
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 -mt-10 mb-6 text-center sm:text-left">
            <div
              className="w-20 h-20 rounded-xl border-4 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", borderColor: "var(--card)" }}
              aria-hidden="true"
            >
              {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>

            <div className="pb-1 flex-1 min-w-0">
              <h2 className="text-lg font-bold break-words" style={{ color: "var(--text)" }}>{profile.name}</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{profile.role} · {profile.department}</p>
            </div>

            <div className="pb-1 w-full sm:w-auto flex-shrink-0 flex gap-2">
              {!editing ? (
                <button
                  onClick={startEditing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm transition"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text)",
                    background: "var(--card)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  aria-label="Edit profile"
                >
                  <Edit size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelEditing}
                    aria-label="Cancel editing"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm transition"
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--muted)",
                      background: "var(--card)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={hasErrors}
                    aria-label="Save profile changes"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition"
                    style={{
                      background: hasErrors ? "#6b7280" : "#059669",
                      border: "none",
                      borderRadius: "8px",
                      cursor: hasErrors ? "not-allowed" : "pointer",
                      opacity: hasErrors ? 0.7 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Save confirmation */}
          {saved && !editing && (
            <div
              role="status"
              aria-live="polite"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "rgba(5,150,105,0.1)",
                border: "1px solid rgba(5,150,105,0.25)",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#059669",
              }}
            >
              <CheckIcon /> Profile saved successfully.
            </div>
          )}

          {/* Fields grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
            role={editing ? "form" : undefined}
            aria-label={editing ? "Edit profile form" : undefined}
          >
            {FIELDS.map(field => (
              <FormField
                key={field.key}
                field={field}
                value={profile[field.key]}
                editing={editing}
                onChange={handleChange}
                onBlur={handleBlur}
                touched={touched[field.key]}
                error={fieldErrors[field.key]}
              />
            ))}

            {/* Skills – full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  marginBottom: "5px",
                  color: "var(--muted)",
                }}
              >
                Skills
              </label>
              <textarea
                name="skills"
                value={profile.skills}
                disabled={!editing}
                onChange={handleChange}
                rows={2}
                aria-label="Skills"
                style={{
                  ...inputBase,
                  ...stateStyles.default,
                  ...(!editing ? stateStyles.disabled : {}),
                  resize: "vertical",
                  minHeight: "68px",
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
