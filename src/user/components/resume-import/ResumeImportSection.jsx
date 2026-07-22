// ════════════════════════════════════════════════════════════
//  Resume Import — top-level section
//  Drop this into any profile page. It owns its own upload/parse/
//  review state and only calls back out via onSaved(mergedFields)
//  once the user has confirmed what to import. The actual PATCH
//  to /users/:id stays in the caller (Profile.jsx), reusing the
//  page's existing save/hydrate flow instead of duplicating it.
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import { FileText } from 'lucide-react';
import notify from '../../../lib/toast';
import ResumeDropzone from './ResumeDropzone';
import ResumeReviewModal from './ResumeReviewModal';
import { parseResume } from './resumeImport.api';
import { calculateProfileCompletion } from './profileCompletion';

const ResumeImportSection = ({ currentProfile, onSaved, saving }) => {
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const completion = calculateProfileCompletion(currentProfile);

  const handleFile = async (file) => {
    setBusy(true);
    try {
      const { preview } = await parseResume(file);
      const nothingFound =
        preview.skills.length === 0 && preview.education.length === 0 && preview.experience.length === 0;
      if (nothingFound) {
        notify.info("We couldn't find any skills, education, or experience in that resume.");
        return;
      }
      setExtracted(preview);
      setReviewOpen(true);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not read that resume. Please try another file.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = (merged) => {
    onSaved(merged);
    setReviewOpen(false);
    setExtracted(null);
  };

  return (
    <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: '#2563EB' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Profile completion</span>
        </div>
        <span className="text-sm font-bold" style={{ color: completion >= 100 ? '#059669' : '#2563EB' }}>{completion}%</span>
      </div>
      <div className="w-full h-2 rounded-full mb-4" style={{ background: 'var(--border)' }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${completion}%`, background: completion >= 100 ? '#059669' : 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
        />
      </div>

      {completion < 100 && (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Drag & drop your resume to fill in your skills, education, and experience automatically.
          </p>
          <ResumeDropzone onFileAccepted={handleFile} busy={busy} />
        </>
      )}

      {extracted && (
        <ResumeReviewModal
          isOpen={reviewOpen}
          onClose={() => setReviewOpen(false)}
          extracted={extracted}
          currentProfile={currentProfile}
          onConfirm={handleConfirm}
          confirming={saving}
        />
      )}
    </div>
  );
};

export default ResumeImportSection;
