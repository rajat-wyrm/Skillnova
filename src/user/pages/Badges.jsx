// ════════════════════════════════════════════════════════════
//  USER — pages/Badges.jsx
//  Achievement badges earned by the intern, with profile showcase toggle
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Award, Loader2, Eye, EyeOff, Star, Users, Trophy, Target, Sparkles } from 'lucide-react';
import { Card, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const TYPE_ICON = {
  ATTENDANCE: Users,
  PROJECT_COMPLETION: Target,
  SKILL_MASTERY: Star,
  TOP_PERFORMER: Trophy,
  CUSTOM: Sparkles,
};

const TYPE_COLOR = {
  ATTENDANCE: '#3b82f6',
  PROJECT_COMPLETION: '#00bea3',
  SKILL_MASTERY: '#a855f7',
  TOP_PERFORMER: '#f59e0b',
  CUSTOM: '#ff6d34',
};

const Badges = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchAwards = async () => {
    setLoading(true);
    try {
      const r = await api.get('/badges/mine');
      setAwards(r.data.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAwards(); }, []);

  const toggleShowcase = async (id) => {
    setBusyId(id);
    try {
      await api.patch(`/badges/award/${id}/showcase`);
      fetchAwards();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not update badge.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Achievement Badges" subtitle="Badges you've earned — toggle which ones show on your profile" />

      {awards.length === 0 && (
        <Card className="p-8 text-center">
          <Award className="mx-auto mb-3" size={28} style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No badges yet — keep completing tasks, attending, and learning to earn your first one.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {awards.map((award) => {
          const Icon = TYPE_ICON[award.badge.type] || Award;
          const color = TYPE_COLOR[award.badge.type] || '#ff6d34';
          return (
            <Card key={award.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <button
                  onClick={() => toggleShowcase(award.id)}
                  disabled={busyId === award.id}
                  title={award.showcase ? 'Showing on profile' : 'Hidden from profile'}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--muted)' }}
                >
                  {award.showcase ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{award.badge.name}</h3>
              {award.badge.description && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{award.badge.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <Badge variant="gray">{award.badge.type.replace('_', ' ')}</Badge>
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{new Date(award.awardedAt).toLocaleDateString()}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Badges;
