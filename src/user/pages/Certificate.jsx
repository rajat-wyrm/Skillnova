// ════════════════════════════════════════════════════════════
//  User — Certificate page
//  View mentor feedback received + download completion certificate
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Loader2, Award, Download, Star } from 'lucide-react';
import { Card, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';

const Certificate = () => {
  const [feedback, setFeedback] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/feedback', { params: { limit: 50 } }),
      api.get('/certificates', { params: { limit: 50 } }),
    ]).then(([fbRes, certRes]) => {
      setFeedback(fbRes.data.items);
      setCertificates(certRes.data.items);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Feedback & Certificate" subtitle="Your mentor feedback and completion certificates" />

      {/* Certificates */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Certificates</h3>
        {certificates.length === 0 && (
          <Card className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No certificate issued yet. Your certificate will appear here once your mentor marks your internship as completed.
          </Card>
        )}
        {certificates.map((c) => (
          <Card key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                <Award size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>{c.role || 'Internship'} Certificate</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Issued {formatDate(c.issuedAt)}</div>
              </div>
            </div>
            {c.fileAsset && (
              <a
                href={`/api/v1/files/${c.fileAsset.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-purple-600 text-white"
              >
                <Download size={14} /> Download PDF
              </a>
            )}
          </Card>
        ))}
      </div>

      {/* Feedback history */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Mentor Feedback</h3>
        {feedback.length === 0 && (
          <Card className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No feedback received yet.
          </Card>
        )}
        {feedback.map((f) => (
          <Card key={f.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>From {f.mentor?.name}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(f.createdAt)}</div>
                {f.comments && <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{f.comments}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {f.rating}/5
                </span>
                <Badge variant={f.completionStatus === 'COMPLETED' ? 'success' : 'default'}>
                  {f.completionStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Certificate;
