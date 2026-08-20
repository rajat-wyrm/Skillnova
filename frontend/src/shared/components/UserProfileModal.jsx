import { useEffect, useState } from 'react';
import { Loader2, UserCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { Modal } from './UI';

const formatDateValue = (value) => {
  if (!value) return '—';

  let date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '—';
    date = new Date(trimmed);
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else {
    return '—';
  }

  if (Number.isNaN(date.getTime())) return '—';
  return date.toISOString().slice(0, 10);
};

const DetailRow = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</p>
    <p className="text-sm" style={{ color: 'var(--text)' }}>{value || '—'}</p>
  </div>
);

const UserProfileModal = ({ isOpen, onClose, userId }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      return;
    }

    let mounted = true;

    api.get(`/users/${userId}`)
      .then(({ data }) => {
        if (mounted) {
          setUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, userId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={loading ? 'Loading profile' : user?.name || 'Profile'}
      footer={(
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
          Close
        </button>
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--muted)' }} />
        </div>
      ) : !user ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>Unable to load this profile right now.</div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              {user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || <UserCircle2 size={18} />}
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{user.name}</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{user.role?.replace('_', ' ')} • {user.department || 'No department'}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Status" value={user.status} />
            <DetailRow label="College" value={user.college} />
            <DetailRow label="Year of Study" value={user.yearOfStudy} />
            <DetailRow label="Date of Birth" value={formatDateValue(user.dateOfBirth)} />
            <DetailRow label="LinkedIn" value={user.linkedinUrl} />
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Skills</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>{user.skills || '—'}</p>
          </div>

          {user.internProfile?.mentor && (
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Assigned Mentor</p>
              <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{user.internProfile.mentor.name}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default UserProfileModal;
