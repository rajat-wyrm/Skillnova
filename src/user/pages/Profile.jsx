// ════════════════════════════════════════════════════════════
//  USER — pages/Profile.jsx (API-driven)
// ════════════════════════════════════════════════════════════
import { useEffect, useId, useState } from 'react';
import { Edit, Save, X, Loader2, Camera, CheckCircle, UploadCloud, Globe, Star, FileText, Share2 } from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import notify from '../../lib/toast';

const FIELDS = [
  { label: 'Full Name', key: 'name', type: 'text', required: true, maxLen: 80,
    validate: (v) => !v?.trim() ? 'Full name is required.' : v.trim().length < 2 ? 'Name must be at least 2 characters.' : '' },
  { label: 'Email', key: 'email', type: 'email', disabled: true },
  { label: 'Phone Number', key: 'phone', type: 'tel' },
  { label: 'Department', key: 'department', type: 'text' },
  { label: 'College', key: 'college', type: 'text' },
  { label: 'Year of Study', key: 'yearOfStudy', type: 'text' },
  { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
  { label: 'LinkedIn Link', key: 'linkedinUrl', type: 'url',
    validate: (v) => v && !/^https?:\/\/.+/.test(v) ? 'Enter a valid URL starting with https://' : '' },
  { label: 'GitHub Link', key: 'githubUrl', type: 'url',
    validate: (v) => v && !/^https?:\/\/.+/.test(v) ? 'Enter a valid URL starting with https://' : '' },
  { label: 'Portfolio Website', key: 'portfolioUrl', type: 'url',
    validate: (v) => v && !/^https?:\/\/.+/.test(v) ? 'Enter a valid URL' : '' },
  { label: 'Location (City, Country)', key: 'location', type: 'text' },
];

// Activity Heatmap logic moved inside component to make it dynamic

// Mock Data for Endorsements
const endorsements = [
  { id: 1, author: 'Dr. Sarah Jenkins', role: 'Mentor', text: 'Exceptional problem-solving skills and great team player during the backend scaling project.' },
  { id: 2, author: 'Alex Rivera', role: 'Senior Developer', text: 'Picked up React extremely quickly. Wrote clean and maintainable UI components.' },
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

const Profile = () => {
  const { user, hydrate } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  
  // New UI states
  const [isPublic, setIsPublic] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [heatmapData, setHeatmapData] = useState(new Array(90).fill(0));

  useEffect(() => {
    if (!user) return;
    
    // Fetch actual user activity for heatmap
    api.get('/tasks', { params: { limit: 200 } })
      .then((res) => {
        const tasks = res.data.items || [];
        const days = new Array(90).fill(0);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        tasks.forEach(t => {
          if (!t.updatedAt && !t.createdAt) return;
          const date = new Date(t.updatedAt || t.createdAt);
          date.setHours(0,0,0,0);
          const diffTime = Math.abs(today - date);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 90) {
            days[89 - diffDays] += 1;
          }
        });
        
        // Normalize intensity
        const max = Math.max(...days, 1);
        setHeatmapData(days.map(val => val === 0 ? 0 : Math.ceil((val / max) * 4)));
      })
      .catch(() => setHeatmapData(new Array(90).fill(0)));

  }, [user]);

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      department: user.department ?? '',
      college: user.college ?? '',
      yearOfStudy: user.yearOfStudy ?? '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '',
      linkedinUrl: user.linkedinUrl ?? '',
      githubUrl: user.githubUrl ?? '',
      portfolioUrl: user.portfolioUrl ?? '',
      location: user.location ?? '',
      bio: user.bio ?? '',
      skills: user.skills ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
  }, [user]);

  if (!profile) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const sanitize = (name, value) => {
    if (typeof value !== 'string') return value;
    let v = value.trim();
    if (name === 'name') v = v.replace(/[<>'"&]/g, '').slice(0, 80);
    if (name === 'department' || name === 'college') v = v.replace(/[<>'"&]/g, '').slice(0, 100);
    if (name === 'yearOfStudy') v = v.replace(/[^0-9-]/g, '').slice(0, 10);
    if (name === 'linkedinUrl' || name === 'githubUrl' || name === 'portfolioUrl') v = v.replace(/[<>"&]/g, '').slice(0, 255);
    if (name === 'location') v = v.replace(/[<>'"&]/g, '').slice(0, 100);
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

  const handlePhotoUpload = (e) => {
    if (!editing) return;
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile((p) => ({ ...p, avatarUrl: url }));
      notify.success('Profile photo updated locally. Save to confirm.');
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeUploaded(true);
      notify.success('Resume uploaded successfully!');
    }
  };

  const togglePublic = () => {
    setIsPublic(!isPublic);
    notify.success(isPublic ? 'Profile is now private' : 'Profile is now public');
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
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        location: profile.location,
        phone: profile.phone,
        bio: profile.bio,
        skills: profile.skills,
        avatarUrl: profile.avatarUrl,
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
  const allFields = ['name', 'email', 'phone', 'department', 'college', 'yearOfStudy', 'dateOfBirth', 'linkedinUrl', 'githubUrl', 'portfolioUrl', 'location', 'bio', 'skills'];
  const filledFields = allFields.filter(f => !!profile[f]);
  const completionPercentage = Math.round((filledFields.length / allFields.length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6 w-full min-w-0 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader title="Professional Profile" subtitle="Showcase your skills, experience, and platform activity" />
        
        <div className="flex flex-col items-end min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Profile Strength</span>
            <span className="text-lg font-bold" style={{ color: completionPercentage === 100 ? '#10b981' : '#3b82f6' }}>{completionPercentage}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border border-[var(--border)]">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ 
                width: `${completionPercentage}%`, 
                background: completionPercentage === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
              }}
            >
               <div className="absolute inset-0 bg-white/20" style={{ transform: 'skewX(-20deg) translateX(-150%)', animation: 'shimmer 2s infinite' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* LEFT COLUMN - Main Info */}
         <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden shadow-xl border border-[var(--border)] relative">
               <div className="h-36 w-full relative" style={{ background: 'linear-gradient(135deg, #0f172a, #312e81, #1e1b4b)' }}>
                  <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
                  
                  {/* Public Toggle */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                     <Globe size={14} className={isPublic ? "text-emerald-400" : "text-gray-400"} />
                     <span className="text-xs font-bold text-white uppercase tracking-wider">{isPublic ? 'Public' : 'Private'}</span>
                     <button onClick={togglePublic} className={`w-8 h-4 rounded-full relative transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-4' : ''}`}></div>
                     </button>
                  </div>
               </div>

               <div className="px-6 pb-8">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-8 text-center sm:text-left relative z-10">
                     <div className="relative group">
                     <div className="w-32 h-32 rounded-2xl border-4 flex items-center justify-center text-4xl font-bold text-white shadow-2xl flex-shrink-0 overflow-hidden bg-[var(--card)]"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderColor: 'var(--card)' }}>
                        {profile.avatarUrl ? (
                           <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                           ((profile.name || '').split(' ').map((n) => n[0]).join('').slice(0, 2) || '?').toUpperCase()
                        )}
                     </div>
                     {editing && (
                        <label className="absolute bottom-2 right-2 p-2 bg-black/70 rounded-lg cursor-pointer hover:bg-black/90 transition text-white backdrop-blur-sm shadow-lg">
                           <Camera size={18} />
                           <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                     )}
                     </div>
                     
                     <div className="pb-2 flex-1 min-w-0">
                     <h2 className="text-3xl font-black break-words flex items-center justify-center sm:justify-start gap-2" style={{ color: 'var(--text)' }}>
                        {profile.name}
                        {completionPercentage === 100 && <CheckCircle size={22} className="text-emerald-500" title="Profile Complete" />}
                     </h2>
                     <p className="text-md mt-1 font-medium" style={{ color: 'var(--muted)' }}>
                        {user?.role} {profile.department ? `· ${profile.department}` : ''} 
                        {profile.location ? ` · 📍 ${profile.location}` : ''}
                     </p>
                     </div>
                     
                     <div className="pb-2 w-full sm:w-auto flex flex-col gap-3">
                     {!editing ? (
                        <>
                           <button onClick={startEditing} className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold transition hover:shadow-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                           <Edit size={16} /> Edit Profile
                           </button>
                           {isPublic && (
                              <button className="w-full flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold transition rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--input-bg)]">
                                 <Share2 size={16} /> Share Link
                              </button>
                           )}
                        </>
                     ) : (
                        <div className="flex gap-2">
                           <button onClick={cancel} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition rounded-xl border border-[var(--border)] hover:bg-[var(--input-bg)] text-[var(--text)]">
                           <X size={16} />
                           </button>
                           <button onClick={save} disabled={hasErrors || saving}
                           className="flex-2 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white transition hover:shadow-lg rounded-xl"
                           style={{ background: hasErrors ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)', opacity: hasErrors ? 0.7 : 1 }}>
                           {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
                           </button>
                        </div>
                     )}
                     </div>
                  </div>

                  {saved && (
                     <div className="flex items-center gap-3 px-5 py-3 mb-6 text-sm font-medium rounded-xl shadow-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                     <CheckCircle size={18} /> Profile saved successfully.
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                     <h3 className="text-xs font-black uppercase tracking-widest border-b pb-2 text-[var(--muted)] border-[var(--border)]">Personal Details</h3>
                     {FIELDS.slice(0, 5).map((field) => (
                        <FormField key={field.key} field={field} value={profile[field.key]}
                           editing={editing && !field.disabled} onChange={(e) => handleChange({ target: { name: field.key, value: e.target.value } })}
                           touched={touched[field.key]} error={errors[field.key]} />
                     ))}
                     </div>

                     <div className="space-y-4">
                     <h3 className="text-xs font-black uppercase tracking-widest border-b pb-2 text-[var(--muted)] border-[var(--border)]">Professional Info</h3>
                     {FIELDS.slice(5).map((field) => (
                        <FormField key={field.key} field={field} value={profile[field.key]}
                           editing={editing && !field.disabled} onChange={(e) => handleChange({ target: { name: field.key, value: e.target.value } })}
                           touched={touched[field.key]} error={errors[field.key]} />
                     ))}
                     </div>

                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                     <div>
                        <label className="block text-xs font-black mb-2 uppercase tracking-widest text-[var(--muted)]">Bio & Summary</label>
                        <textarea name="bio" value={profile.bio} disabled={!editing}
                           onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                           placeholder="Tell us about your career goals and what you are learning..."
                           rows={5} className="w-full p-4 text-sm rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition disabled:opacity-70 resize-none shadow-inner" />
                     </div>
                     
                     <div>
                        <label className="block text-xs font-black mb-2 uppercase tracking-widest text-[var(--muted)]">Technical Skills</label>
                        {!editing ? (
                           <div className="flex flex-wrap gap-2 p-4 min-h-[120px] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-inner">
                           {profile.skills ? profile.skills.split(',').map((skill, idx) => (
                              <span key={idx} className="px-3 py-1 text-xs font-bold rounded-lg shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}>
                                 {skill.trim()}
                              </span>
                           )) : <span className="text-sm text-[var(--muted)] opacity-70">No skills added yet. Click edit to add them.</span>}
                           </div>
                        ) : (
                           <textarea name="skills" value={profile.skills} disabled={!editing}
                           onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                           placeholder="E.g., React, Node.js, Python (comma separated)"
                           rows={5} className="w-full p-4 text-sm rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition disabled:opacity-70 resize-none shadow-inner" />
                        )}
                     </div>
                     </div>
                  </div>
               </div>
            </Card>

            {/* Activity Heatmap */}
            <Card className="p-6 shadow-xl border border-[var(--border)]">
               <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-[var(--muted)]">
                  <Star size={16} className="text-yellow-500" /> Platform Activity (Last 90 Days)
               </h3>
               <div className="flex flex-wrap gap-1">
                  {heatmapData.map((intensity, i) => (
                     <div key={i} className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-colors duration-300"
                        style={{
                           background: intensity === 0 ? 'var(--input-bg)' : 
                                      intensity === 1 ? '#a7f3d0' : 
                                      intensity === 2 ? '#34d399' : 
                                      intensity === 3 ? '#10b981' : '#059669',
                           border: '1px solid rgba(0,0,0,0.05)'
                        }}
                        title={`${intensity} contributions`}
                     ></div>
                  ))}
               </div>
               <div className="flex items-center gap-2 mt-4 justify-end text-xs font-semibold text-[var(--muted)]">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-[var(--input-bg)]"></div>
                  <div className="w-3 h-3 rounded-sm bg-[#a7f3d0]"></div>
                  <div className="w-3 h-3 rounded-sm bg-[#34d399]"></div>
                  <div className="w-3 h-3 rounded-sm bg-[#10b981]"></div>
                  <div className="w-3 h-3 rounded-sm bg-[#059669]"></div>
                  <span>More</span>
               </div>
            </Card>
         </div>

         {/* RIGHT COLUMN - Extras */}
         <div className="space-y-6">
            {/* Resume Upload */}
            <Card className="p-6 shadow-xl border border-[var(--border)] flex flex-col items-center justify-center text-center">
               <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-[var(--muted)] w-full text-left">Resume / CV</h3>
               {resumeUploaded ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 flex flex-col items-center w-full">
                     <FileText size={48} className="text-blue-500 mb-3" />
                     <p className="text-sm font-bold text-[var(--text)]">resume_updated.pdf</p>
                     <p className="text-xs text-[var(--muted)] mt-1">Uploaded just now</p>
                     <div className="flex gap-2 mt-4 w-full">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition">View</button>
                        <button onClick={() => setResumeUploaded(false)} className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-xs font-bold py-2 rounded-lg transition">Remove</button>
                     </div>
                  </div>
               ) : (
                  <label className="w-full border-2 border-dashed border-[var(--border)] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--input-bg)] hover:border-blue-500/50 transition group">
                     <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} className="text-blue-500" />
                     </div>
                     <p className="text-sm font-bold text-[var(--text)]">Upload your Resume</p>
                     <p className="text-xs text-[var(--muted)] mt-2">PDF, DOCX up to 5MB</p>
                     <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                  </label>
               )}
            </Card>

            {/* Endorsements */}
            <Card className="p-6 shadow-xl border border-[var(--border)]">
               <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-[var(--muted)] flex items-center gap-2">
                  <Star size={16} className="text-yellow-500" /> Peer Endorsements
               </h3>
               {endorsements.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] text-center py-4">No endorsements yet.</p>
               ) : (
                  <div className="space-y-4">
                     {endorsements.map((end) => (
                        <div key={end.id} className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] relative">
                           <div className="absolute top-4 right-4 text-4xl text-gray-300 dark:text-gray-700 font-serif leading-none opacity-50">"</div>
                           <p className="text-sm text-[var(--text)] italic relative z-10">"{end.text}"</p>
                           <div className="mt-4 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                                 {end.author.split(' ').map(n=>n[0]).join('')}
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-[var(--text)]">{end.author}</p>
                                 <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{end.role}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </Card>
         </div>
      </div>
    </div>
  );
};

export default Profile;
