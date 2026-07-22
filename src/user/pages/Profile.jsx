// ════════════════════════════════════════════════════════════
//  USER — pages/Profile.jsx (API-driven + AI Resume Parser)
// ════════════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Edit, Save, X, Loader2, FileText, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Upload, Brain } from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import notify from '../../lib/toast';
import { ResumeImportSection } from '../components/resume-import';

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

// Fields the AI parser can fill
const PARSEABLE_FIELDS = ['skills', 'college', 'department', 'yearOfStudy', 'linkedinUrl'];

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
      <input id={uid} type={field.type} value={value || ''} disabled={!editing || field.disabled}
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

// ── AI Resume Parser Card ─────────────────────────────────────
const ResumeParser = ({ onApply }) => {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [parsed, setParsed] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [applied, setApplied] = useState(false);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setStatus('error');
      setErrorMsg('Please upload a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('error');
      setErrorMsg('File is too large. Maximum size is 5 MB.');
      return;
    }

    setStatus('uploading');
    setErrorMsg('');
    setParsed(null);
    setApplied(false);

    const form = new FormData();
    form.append('resume', file);

    try {
      const { data } = await api.post('/resume/parse', form, {
        timeout: 60_000,
      });
      setParsed(data.parsed);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Failed to parse resume. Please try again.');
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }, [processFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleApply = () => {
    if (!parsed) return;
    onApply(parsed);
    setApplied(true);
    notify.success('Profile fields filled from resume!');
  };

  const reset = () => {
    setStatus('idle');
    setParsed(null);
    setErrorMsg('');
    setApplied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filled fields count
  const filledCount = parsed ? PARSEABLE_FIELDS.filter((k) => parsed[k]?.trim()).length : 0;

  return (
    <Card style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Animated gradient top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 3s linear infinite',
      }} />

      <style>{`
        @keyframes shimmer { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ padding: '20px 24px 16px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}>
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>AI Resume Parser</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase',
                }}>NEW</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                Drop your PDF resume to auto-fill your profile
              </p>
            </div>
          </div>
          <button onClick={() => setExpanded((v) => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {expanded && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            {/* Drop Zone */}
            {(status === 'idle' || status === 'error') && (
              <div
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#6366f1' : 'var(--border)'}`,
                  borderRadius: 14,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragging ? 'rgba(99,102,241,0.06)' : 'var(--input-bg)',
                  transition: 'all 0.2s ease',
                  animation: dragging ? 'pulse-ring 1.5s infinite' : 'none',
                  position: 'relative',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => processFile(e.target.files?.[0])}
                />

                {/* Icon cluster */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}>
                    <FileText size={26} color="#6366f1" />
                  </div>
                </div>

                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 4px' }}>
                  {dragging ? '📂 Drop it here!' : 'Drag & Drop your Resume'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
                  or click to browse · PDF only · max 5 MB
                </p>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                  <Upload size={14} /> Browse File
                </div>

                {/* AI chips */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                  {['✦ Skills', '✦ Education', '✦ Experience', '✦ LinkedIn', '✦ Department'].map((chip) => (
                    <span key={chip} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)' }}>
                      {chip}
                    </span>
                  ))}
                </div>

                {status === 'error' && (
                  <p style={{ marginTop: 12, fontSize: 13, color: '#ef4444', fontWeight: 500 }}>
                    ⚠ {errorMsg}
                  </p>
                )}
              </div>
            )}

            {/* Uploading / Parsing */}
            {status === 'uploading' && (
              <div style={{ textAlign: 'center', padding: '36px 20px', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(99,102,241,0.3)',
                    animation: 'pulse-ring 1.5s infinite',
                  }}>
                    <Brain size={28} color="#6366f1" style={{ animation: 'spin-slow 3s linear infinite' }} />
                  </div>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 4px' }}>
                  AI is reading your resume…
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Extracting skills, education and experience
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#6366f1',
                      animation: `pulse-ring 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Success — Preview parsed data */}
            {status === 'success' && parsed && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                    Resume parsed! {filledCount} field{filledCount !== 1 ? 's' : ''} ready to fill.
                  </span>
                  <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <X size={14} /> Try another
                  </button>
                </div>

                {/* Parsed field preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Skills', key: 'skills', icon: '⚡' },
                    { label: 'College', key: 'college', icon: '🎓' },
                    { label: 'Department', key: 'department', icon: '📚' },
                    { label: 'Year of Study', key: 'yearOfStudy', icon: '📅' },
                    { label: 'LinkedIn', key: 'linkedinUrl', icon: '🔗' },
                    { label: 'Education', key: 'education', icon: '🏫' },
                    { label: 'Experience', key: 'experience', icon: '💼' },
                  ].map(({ label, key, icon }) => {
                    const val = parsed[key];
                    const isEmpty = !val?.trim();
                    return (
                      <div key={key} style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: isEmpty ? 'var(--input-bg)' : 'rgba(16,185,129,0.06)',
                        border: `1px solid ${isEmpty ? 'var(--border)' : 'rgba(16,185,129,0.2)'}`,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.04, marginBottom: 3 }}>
                          {icon} {label}
                        </div>
                        <div style={{ fontSize: 13, color: isEmpty ? 'var(--muted)' : 'var(--text)', fontStyle: isEmpty ? 'italic' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isEmpty ? 'Not found' : val}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {applied ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                      Fields applied! Review and save your profile below.
                    </span>
                  </div>
                ) : (
                  <button onClick={handleApply} style={{
                    width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)'; }}
                  >
                    <Sparkles size={16} /> Apply to Profile
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// ── Main Profile Page ─────────────────────────────────────────
function safeParseJsonArray(json) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
      education: safeParseJsonArray(user.educationJson),
      experience: safeParseJsonArray(user.experienceJson),
    });
  }, [user]);

  if (!profile) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    setSaved(false);
    if (touched[name]) {
      const f = FIELDS.find((x) => x.key === name);
      setErrors((prev) => ({ ...prev, [name]: f?.validate ? f.validate(value) : '' }));
    }
  };

  // Called by ResumeParser when user clicks "Apply to Profile"
  const handleResumeApply = (parsed) => {
    setProfile((prev) => ({
      ...prev,
      skills:      parsed.skills      || prev.skills,
      college:     parsed.college     || prev.college,
      department:  parsed.department  || prev.department,
      yearOfStudy: parsed.yearOfStudy || prev.yearOfStudy,
      linkedinUrl: parsed.linkedinUrl || prev.linkedinUrl,
    }));
    setSaved(false);
    // Auto-enter editing mode so user can review & save
    setEditing(true);
    setSnapshot((prev) => prev ?? { ...profile });
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

  const [importing, setImporting] = useState(false);
  const handleResumeImportSaved = async ({ skills, education, experience }) => {
    setImporting(true);
    try {
      await api.patch(`/users/${user.id}`, {
        skills,
        educationJson: JSON.stringify(education),
        experienceJson: JSON.stringify(experience),
      });
      setProfile((p) => ({ ...p, skills, education, experience }));
      notify.success('Profile updated from your resume!');
      hydrate();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not apply resume import.');
    } finally {
      setImporting(false);
    }
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="max-w-3xl space-y-6 w-full min-w-0">
      <SectionHeader title="My Profile" subtitle="Manage your profile information" />

      <ResumeImportSection
        currentProfile={profile}
        onSaved={handleResumeImportSaved}
        saving={importing}
      />

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }} />

        <div className="px-6 pb-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 -mt-10 mb-6 text-center sm:text-left">
            <div className="w-20 h-20 rounded-xl border-4 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', borderColor: 'var(--card)' }}>
              {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
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

            {profile.education?.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.04 }}>Education</label>
                <div className="space-y-2">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="text-sm p-2.5 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <strong style={{ color: 'var(--text)' }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</strong>
                      <div style={{ color: 'var(--muted)' }}>{edu.institution} {(edu.startYear || edu.endYear) && `· ${edu.startYear || '?'}–${edu.endYear || '?'}`}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.experience?.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.04 }}>Experience</label>
                <div className="space-y-2">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="text-sm p-2.5 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <strong style={{ color: 'var(--text)' }}>{exp.title} {exp.company ? `@ ${exp.company}` : ''}</strong>
                      <div style={{ color: 'var(--muted)' }}>{(exp.startDate || exp.endDate) && `${exp.startDate || '?'} – ${exp.endDate || 'Present'}`}</div>
                      {exp.description && <div style={{ color: 'var(--muted)' }}>{exp.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
