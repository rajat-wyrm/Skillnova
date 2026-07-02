// ════════════════════════════════════════════════════════════
//  USER — pages/Profile.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useId, useState } from 'react';
import { Edit, Save, X, Loader2 } from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import notify from '../../lib/toast';

const FIELDS = [
  { label: 'Full Name', key: 'name', type: 'text', required: true, maxLen: 80,
    validate: (v) => !v?.trim() ? 'Full name is required.' : v.trim().length < 2 ? 'Name must be at least 2 characters.' : '' },
  { label: 'Email', key: 'email', type: 'email', disabled: true },
  { label: 'Department', key: 'department', type: 'text' },
  { label: 'College', key: 'college', type: 'text' },
  { label: 'Year of Study', key: 'yearOfStudy', type: 'text' },
  { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
  { label: 'LinkedIn', key: 'linkedinUrl', type: 'url',
    validate: (v) => v && !/^https?:\/\/.+/.test(v) ? 'Enter a valid URL starting with https://' : '' },
];

const FormField = ({ field, value, editing, onChange, touched, error }) => {
  const uid = useId();
  const [focused, setFocused] = useState(false);
  const hasError = touched && !!error;
  const hasSuccess = touched && !error && value;

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    borderRadius: 10,
    outline: 'none',
    fontFamily: 'inherit',
    border: `1px solid ${hasError ? '#ef4444' : hasSuccess ? '#10b981' : 'var(--border)'}`,
    background: hasError ? 'rgba(239,68,68,0.04)' : hasSuccess ? 'rgba(16,185,129,0.04)' : 'var(--input-bg)',
    color: 'var(--text)',
    boxShadow: focused ? `0 0 0 4px ${hasError ? 'rgba(239,68,68,0.12)' : hasSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(37,99,235,0.12)'}` : 'none',
    opacity: editing ? 1 : 0.6,
  };

  return (
    <div>
      <label htmlFor={uid} style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.04 }}>
        {field.label}
        {field.required && editing && <span style={{ color: '#ff6d34' }}> *</span>}
      </label>
      <input id={uid} type={field.type} value={value ? new Date(value).toISOString?.().slice(0, 10) === value.slice(0, 10) && field.type === 'date' ? value : value : ''} disabled={!editing || field.disabled}
        onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        maxLength={field.maxLen}
        style={inputStyle}
        aria-invalid={hasError ? 'true' : undefined}
      />
      {hasError && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  );
};

const Profile = () => {
  const { user, hydrate } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name ?? '',
      email: user.email ?? '',
      department: user.department ?? '',
      college: user.college ?? '',
      yearOfStudy: user.yearOfStudy ?? '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '',
      linkedinUrl: user.linkedinUrl ?? '',
      skills: user.skills ?? '',
    });
  }, [user]);

  if (!profile) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const sanitize = (name, value) => {
    if (typeof value !== 'string') return value;
    let v = value.trim();
    if (name === 'name') v = v.replace(/[<>'"&]/g, '').slice(0, 80);
    if (name === 'department' || name === 'college') v = v.replace(/[<>'"&]/g, '').slice(0, 100);
    if (name === 'yearOfStudy') v = v.replace(/[^0-9-]/g, '').slice(0, 10);
    if (name === 'linkedinUrl') v = v.replace(/[<>"&]/g, '').slice(0, 255);
    return v;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: sanitize(name, value) }));
    setSaved(false);
    if (touched[name]) {
      const f = FIELDS.find((x) => x.key === name);
      setErrors((prev) => ({ ...prev, [name]: f?.validate ? f.validate(sanitize(name, value)) : '' }));
    }
  };

  const startEditing = () => {
    setSnapshot({ ...profile });
    setEditing(true);
    setSaved(false);
    setTouched({});
    setErrors({});
  };

  const cancel = () => {
    if (snapshot) setProfile(snapshot);
    setEditing(false);
    setTouched({});
    setErrors({});
  };

  const save = async () => {
    const newTouched = {}, newErrors = {};
    let hasError = false;
    FIELDS.forEach((f) => {
      newTouched[f.key] = true;
      const err = f.validate ? f.validate(profile[f.key]) : '';
      newErrors[f.key] = err;
      if (err) hasError = true;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    if (hasError) return;

    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, {
        name: profile.name,
        department: profile.department,
        college: profile.college,
        yearOfStudy: profile.yearOfStudy,
        dateOfBirth: profile.dateOfBirth || null,
        linkedinUrl: profile.linkedinUrl,
        skills: profile.skills,
      });
      notify.success('Profile saved!');
      setEditing(false);
      setSaved(true);
      hydrate();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="max-w-3xl space-y-6 w-full min-w-0">
      <SectionHeader title="My Profile" subtitle="Manage your profile information" />

      <Card className="overflow-hidden">
        <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }} />

        <div className="px-6 pb-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 -mt-10 mb-6 text-center sm:text-left">
            <div className="w-20 h-20 rounded-xl border-4 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', borderColor: 'var(--card)' }}>
              {((profile.name || '').split(' ').map((n) => n[0]).join('').slice(0, 2) || '?').toUpperCase()}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h2 className="text-lg font-bold break-words" style={{ color: 'var(--text)' }}>{profile.name}</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{user?.role} · {profile.department}</p>
            </div>
            <div className="pb-1 w-full sm:w-auto flex gap-2">
              {!editing ? (
                <button onClick={startEditing} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm transition"
                  style={{ border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', background: 'var(--card)' }}>
                  <Edit size={14} /> Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={cancel} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm transition"
                    style={{ border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', background: 'var(--card)' }}>
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={save} disabled={hasErrors || saving}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition"
                    style={{ background: hasErrors ? '#6b7280' : '#059669', borderRadius: 8, opacity: hasErrors ? 0.7 : 1 }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {saved && (
            <div className="flex items-center gap-2 px-4 py-2 mb-4 text-sm rounded-lg" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: '#059669' }}>
              ✓ Profile saved successfully.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {FIELDS.map((field) => (
              <FormField key={field.key} field={field} value={profile[field.key]}
                editing={editing && !field.disabled} onChange={(e) => handleChange({ target: { name: field.key, value: e.target.value } })}
                touched={touched[field.key]} error={errors[field.key]} />
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.04 }}>Skills</label>
              <textarea name="skills" value={profile.skills} disabled={!editing}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                rows={2} style={{ width: '100%', padding: '9px 12px', fontSize: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', resize: 'vertical', opacity: editing ? 1 : 0.6 }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
