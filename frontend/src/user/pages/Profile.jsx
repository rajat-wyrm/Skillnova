// ══════════════════════════════════════════════
//  USER — pages/Profile.jsx
// ══════════════════════════════════════════════

import { useEffect, useId, useState } from "react";
import {
  Edit,
  Save,
  X,
  User,
  Mail,
  Briefcase,
  GraduationCap,
  Link,
  Building,
  Calendar,
  } from "lucide-react";
import { Card, SectionHeader } from "../../shared/components/UI";
import { ErrorState } from "../../shared/components/AppState";
import { UserProfileSkeleton } from "../../shared/components/PageSkeletons";
import { getCurrentUser, updateCurrentUser } from "../../shared/services/api/usersApi";

const FIELDS = [
  {
    label: "Full Name",
    key: "name",
    type: "text",
    icon: User,
    required: true,
    maxLen: 80,
    validate: value =>
      !value.trim()
        ? "Full name is required."
        : value.trim().length < 2
          ? "Name must be at least 2 characters."
          : "",
  },
  {
    label: "Email",
    key: "email",
    type: "email",
    icon: Mail,
    required: true,
    validate: value =>
      !value.trim()
        ? "Email is required."
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Enter a valid email address."
          : "",
  },
  {
    label: "Role",
    key: "role",
    type: "text",
    icon: Briefcase,
    required: false,
    maxLen: 60,
  },
  {
    label: "Department",
    key: "department",
    type: "text",
    icon: Building,
    required: false,
    maxLen: 60,
  },
  {
    label: "College",
    key: "college",
    type: "text",
    icon: GraduationCap,
    required: false,
    maxLen: 100,
  },
  {
    label: "Year of Study",
    key: "year",
    type: "text",
    icon: null,
    required: false,
  },
  {
    label: "Date of Birth",
    key: "dob",
    type: "date",
    icon: Calendar,
    required: false,
  },
  {
    label: "LinkedIn",
    key: "linkedin",
    type: "url",
    icon: Link,
    required: false,
    validate: value =>
      value && !/^https?:\/\/.+/.test(value)
        ? "Enter a valid URL starting with https://"
        : "",
  },
];

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

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

const normalizeProfile = response => {
  const profile = response?.data || response || {};

  return {
    name: profile?.name || "",
    email: profile?.email || "",
    role: profile?.role || "",
    department: profile?.department || profile?.dept || "",
    college: profile?.college || "",
    dob: profile?.dob || "",
    year: profile?.year || "",
    linkedin: profile?.linkedin || "",
    skills: Array.isArray(profile?.skills)
      ? profile.skills.join(", ")
      : profile?.skills || "",
  };
};

const FormField = ({
  field,
  value,
  editing,
  onChange,
  onBlur,
  touched,
  error,
}) => {
  const uid = useId();
  const [focused, setFocused] = useState(false);

  const { label, key, type, icon: Icon, required, maxLen } = field;
  const hasError = touched && !!error;
  const hasSuccess = touched && !error && value;

  const inputStyle = {
    ...inputBase,
    ...stateStyles.default,
    ...(hasError ? stateStyles.error : {}),
    ...(hasSuccess ? stateStyles.success : {}),
    ...(focused && !hasError ? stateStyles.focus : {}),
    ...(focused && hasError ? stateStyles.errorFocus : {}),
    ...(!editing ? stateStyles.disabled : {}),
    paddingLeft: Icon ? "36px" : "12px",
    paddingRight: hasError || hasSuccess ? "36px" : "12px",
  };

  return (
    <div>
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
          <span
            style={{ color: "#ff6d34", fontSize: "13px", lineHeight: 1 }}
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

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
          value={value || ""}
          disabled={!editing}
          onChange={onChange}
          onBlur={event => {
            setFocused(false);
            onBlur(event);
          }}
          onFocus={() => setFocused(true)}
          maxLength={maxLen}
          aria-required={required || undefined}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? `${uid}-err` : undefined}
          style={inputStyle}
          autoComplete={type === "email" ? "email" : type === "url" ? "url" : "off"}
        />

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

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    college: "",
    dob: "",
    year: "",
    linkedin: "",
    skills: "",
  });
  const [snapshot, setSnapshot] = useState(null);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await getCurrentUser();
      const normalizedProfile = normalizeProfile(response);

      if (!normalizedProfile.name && !normalizedProfile.email && !normalizedProfile.role) {
        throw new Error("Profile response did not include any user details.");
      }

      setProfile(normalizedProfile);
    } catch (error) {
      setPageError(error.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateField = (key, value) => {
    const field = FIELDS.find(item => item.key === key);
    if (!field?.validate) return "";
    return field.validate(value || "");
  };

  const handleChange = event => {
    const { name, value } = event.target;

    setProfile(previous => ({
      ...previous,
      [name]: value,
    }));
    setSaved(false);
    setSaveError("");

    if (touched[name]) {
      setFieldErrors(previous => ({
        ...previous,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = event => {
    const { name, value } = event.target;

    setTouched(previous => ({
      ...previous,
      [name]: true,
    }));
    setFieldErrors(previous => ({
      ...previous,
      [name]: validateField(name, value),
    }));
  };

  const startEditing = () => {
    setSnapshot({ ...profile });
    setEditing(true);
    setSaved(false);
    setSaveError("");
    setTouched({});
    setFieldErrors({});
  };

  const cancelEditing = () => {
    if (snapshot) {
      setProfile(snapshot);
    }

    setEditing(false);
    setSaveError("");
    setTouched({});
    setFieldErrors({});
  };

  const handleSave = async () => {
    const nextTouched = {};
    const nextErrors = {};
    let hasError = false;

    FIELDS.forEach(field => {
      nextTouched[field.key] = true;
      const error = validateField(field.key, profile[field.key]);
      nextErrors[field.key] = error;
      if (error) {
        hasError = true;
      }
    });

    setTouched(nextTouched);
    setFieldErrors(nextErrors);
    if (hasError) return;

    try {
      setSaveError("");
      await updateCurrentUser(profile);
      setEditing(false);
      setSnapshot(null);
      setSaved(true);
    } catch (error) {
      setSaveError(error.message || "Failed to update profile.");
    }
  };

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  if (loading) {
    return <UserProfileSkeleton />;
  }

  if (pageError) {
    return (
      <div className="max-w-3xl space-y-6 w-full min-w-0">
        <SectionHeader
          title="My Profile"
          subtitle="Manage your profile information"
        />
        <ErrorState
          title="Could not load profile"
          description={pageError}
          action={
            <button
              onClick={fetchProfile}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 w-full min-w-0">
      <SectionHeader
        title="My Profile"
        subtitle="Manage your profile information"
      />

      <Card className="overflow-hidden">
        <div
          className="h-24 w-full"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
        />

        <div className="px-6 pb-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 -mt-10 mb-6 text-center sm:text-left">
            <div
              className="w-20 h-20 rounded-xl border-4 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                borderColor: "var(--card)",
              }}
              aria-hidden="true"
            >
              {(profile.name || "User")
                .split(" ")
                .map(name => name[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="pb-1 flex-1 min-w-0">
              <h2
                className="text-lg font-bold break-words"
                style={{ color: "var(--text)" }}
              >
                {profile.name || "User"}
              </h2>

              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {[profile.role, profile.department].filter(Boolean).join(" · ") || "Profile details"}
              </p>
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

          {saveError && (
            <div
              role="alert"
              aria-live="polite"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#dc2626",
              }}
            >
              <AlertIcon /> {saveError}
            </div>
          )}

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
                value={profile.skills || ""}
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


