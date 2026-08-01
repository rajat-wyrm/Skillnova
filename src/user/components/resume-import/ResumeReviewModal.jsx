// ════════════════════════════════════════════════════════════
//  Resume Import — review / merge modal
//  Nothing here saves to the profile. onConfirm hands the caller
//  a fully-resolved { skills, education, experience } object;
//  the caller (ResumeImportSection) is responsible for the actual
//  PATCH /users/:id save, reusing the existing profile save flow.
// ════════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import { Modal } from '../../../shared/components/UI';
import { Check, X as XIcon } from 'lucide-react';

const chipStyle = (active) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  border: `1px solid ${active ? '#2563EB' : 'var(--border)'}`,
  background: active ? 'rgba(37,99,235,0.08)' : 'var(--input-bg)',
  color: active ? '#2563EB' : 'var(--muted)',
  userSelect: 'none',
});

const sectionLabel = { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.04, color: 'var(--muted)', marginBottom: 8 };

const MergeToggle = ({ value, onChange, disabled }) => {
  if (disabled) return null;
  return (
    <div className="flex gap-1 mb-2">
      {[
        { key: 'append', label: 'Add to existing' },
        { key: 'replace', label: 'Replace existing' },
      ].map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className="px-2.5 py-1 text-[11px] font-medium rounded-md transition"
          style={{
            border: `1px solid ${value === opt.key ? '#2563EB' : 'var(--border)'}`,
            background: value === opt.key ? 'rgba(37,99,235,0.08)' : 'transparent',
            color: value === opt.key ? '#2563EB' : 'var(--muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const ResumeReviewModal = ({ isOpen, onClose, extracted, currentProfile, onConfirm, confirming }) => {
  const existingSkillsSet = useMemo(
    () => new Set((currentProfile.skills || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)),
    [currentProfile.skills]
  );
  const newSkills = useMemo(
    () => (extracted?.skills || []).filter((s) => !existingSkillsSet.has(s.toLowerCase())),
    [extracted, existingSkillsSet]
  );

  const [selectedSkills, setSelectedSkills] = useState(() => new Set(newSkills));
  const [selectedEducation, setSelectedEducation] = useState(() => new Set((extracted?.education || []).map((_, i) => i)));
  const [selectedExperience, setSelectedExperience] = useState(() => new Set((extracted?.experience || []).map((_, i) => i)));
  const [educationMode, setEducationMode] = useState('append');
  const [experienceMode, setExperienceMode] = useState('append');

  const hasExistingEducation = (currentProfile.education || []).length > 0;
  const hasExistingExperience = (currentProfile.experience || []).length > 0;

  const toggle = (set, setSet, key) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleConfirm = () => {
    const skills = Array.from(selectedSkills);
    const mergedSkills = Array.from(new Set([
      ...(currentProfile.skills ? currentProfile.skills.split(',').map((s) => s.trim()).filter(Boolean) : []),
      ...skills,
    ]));

    const pickedEducation = (extracted.education || []).filter((_, i) => selectedEducation.has(i));
    const pickedExperience = (extracted.experience || []).filter((_, i) => selectedExperience.has(i));

    const mergedEducation = educationMode === 'replace'
      ? pickedEducation
      : [...(currentProfile.education || []), ...pickedEducation];

    const mergedExperience = experienceMode === 'replace'
      ? pickedExperience
      : [...(currentProfile.experience || []), ...pickedExperience];

    onConfirm({
      skills: mergedSkills.join(', '),
      education: mergedEducation,
      experience: mergedExperience,
    });
  };

  const nothingToImport =
    selectedSkills.size === 0 && selectedEducation.size === 0 && selectedExperience.size === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review resume import"
      footer={(
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={nothingToImport || confirming}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2"
            style={{ background: nothingToImport ? '#6b7280' : '#059669', opacity: nothingToImport || confirming ? 0.7 : 1 }}
          >
            <Check size={14} /> {confirming ? 'Applying…' : 'Apply to profile'}
          </button>
        </>
      )}
    >
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Here's what we found in your resume. Nothing is saved yet — pick what you'd like to add,
          then confirm below.
        </p>

        {/* ── Skills ───────────────────────────────────── */}
        <div>
          <div style={sectionLabel}>Skills {newSkills.length === 0 && '(no new skills found)'}</div>
          {newSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {newSkills.map((skill) => (
                <span key={skill} style={chipStyle(selectedSkills.has(skill))} onClick={() => toggle(selectedSkills, setSelectedSkills, skill)}>
                  {selectedSkills.has(skill) ? <Check size={12} /> : <XIcon size={12} />} {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Your profile already has all the skills we detected.</p>
          )}
        </div>

        {/* ── Education ────────────────────────────────── */}
        <div>
          <div style={sectionLabel}>Education</div>
          <MergeToggle value={educationMode} onChange={setEducationMode} disabled={!hasExistingEducation || (extracted.education || []).length === 0} />
          {(extracted.education || []).length > 0 ? (
            <div className="space-y-2">
              {extracted.education.map((edu, i) => (
                <label key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-sm cursor-pointer" style={{ border: '1px solid var(--border)', background: selectedEducation.has(i) ? 'rgba(37,99,235,0.04)' : 'transparent' }}>
                  <input type="checkbox" checked={selectedEducation.has(i)} onChange={() => toggle(selectedEducation, setSelectedEducation, i)} className="mt-1" />
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{edu.degree || 'Degree'}{edu.field ? ` · ${edu.field}` : ''}</strong>
                    <br />
                    <span style={{ color: 'var(--muted)' }}>
                      {edu.institution || 'Institution'} {(edu.startYear || edu.endYear) && `· ${edu.startYear || '?'}–${edu.endYear || '?'}`}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No education section detected in this resume.</p>
          )}
        </div>

        {/* ── Experience ───────────────────────────────── */}
        <div>
          <div style={sectionLabel}>Experience</div>
          <MergeToggle value={experienceMode} onChange={setExperienceMode} disabled={!hasExistingExperience || (extracted.experience || []).length === 0} />
          {(extracted.experience || []).length > 0 ? (
            <div className="space-y-2">
              {extracted.experience.map((exp, i) => (
                <label key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-sm cursor-pointer" style={{ border: '1px solid var(--border)', background: selectedExperience.has(i) ? 'rgba(37,99,235,0.04)' : 'transparent' }}>
                  <input type="checkbox" checked={selectedExperience.has(i)} onChange={() => toggle(selectedExperience, setSelectedExperience, i)} className="mt-1" />
                  <span>
                    <strong style={{ color: 'var(--text)' }}>{exp.title || 'Role'} {exp.company ? `@ ${exp.company}` : ''}</strong>
                    <br />
                    <span style={{ color: 'var(--muted)' }}>
                      {(exp.startDate || exp.endDate) && `${exp.startDate || '?'} – ${exp.endDate || 'Present'}`}
                    </span>
                    {exp.description && <><br /><span style={{ color: 'var(--muted)' }}>{exp.description}</span></>}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No experience section detected in this resume.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ResumeReviewModal;
