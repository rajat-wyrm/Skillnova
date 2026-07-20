import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Badge, Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatDate } from '../../lib/utils';

const LeaveApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leave-requests', { params: { limit: 50, status: 'PENDING' } });
      setRequests(data.items);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const reviewRequest = async (id, status) => {
    setBusyId(`${id}-${status}`);
    try {
      await api.patch(`/leave-requests/${id}/review`, { status });
      notify.success(`Leave request ${status.toLowerCase()}.`);
      await fetchRequests();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to review leave request.');
    } finally {
      setBusyId('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Leave Approvals" subtitle="Review pending leave requests from your interns" />

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{request.user?.name}</h3>
                  <Badge variant="warning">{request.status}</Badge>
                </div>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  {request.leaveType} - {formatDate(request.startDate)} to {formatDate(request.endDate)}
                </p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{request.reason}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => reviewRequest(request.id, 'APPROVED')}
                  disabled={!!busyId}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ background: '#00bea3', opacity: busyId && busyId !== `${request.id}-APPROVED` ? 0.6 : 1 }}
                >
                  <CheckCircle size={15} />
                  {busyId === `${request.id}-APPROVED` ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => reviewRequest(request.id, 'REJECTED')}
                  disabled={!!busyId}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ background: '#dc2626', opacity: busyId && busyId !== `${request.id}-REJECTED` ? 0.6 : 1 }}
                >
                  <XCircle size={15} />
                  {busyId === `${request.id}-REJECTED` ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </Card>
        ))}

        {requests.length === 0 && (
          <Card className="p-10 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No pending leave requests.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LeaveApprovals;
