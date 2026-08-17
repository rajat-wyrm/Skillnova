import React, { useEffect, useState } from 'react';
import { Trophy, Loader2, AlertCircle, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { Card, Modal } from '../../shared/components/UI';
import api from '../../lib/api';

const PerformanceStatusCard = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get('/performance/status');
        setPerformance(response.data);
      } catch (err) {
        console.error('Failed to fetch performance status:', err);
        setError('Unable to load performance status.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  let statusColor = 'var(--muted)';
  let statusIconColor = 'var(--muted)';
  let bgStyle = 'var(--bg)';
  
  if (performance) {
    if (performance.status === 'GOOD') {
      statusColor = '#00bea3';
      statusIconColor = '#00bea3';
      bgStyle = 'rgba(0,190,163,0.1)';
    } else if (performance.status === 'AVERAGE') {
      statusColor = '#f59e0b';
      statusIconColor = '#f59e0b';
      bgStyle = 'rgba(245,158,11,0.1)';
    } else if (performance.status === 'NEEDS_IMPROVEMENT') {
      statusColor = '#ff6d34';
      statusIconColor = '#ff6d34';
      bgStyle = 'rgba(255,109,52,0.1)';
    }
  }

  return (
    <>
      <Card 
        className="p-5 flex flex-col justify-between h-full group" 
        hover={true} 
        onClick={() => !loading && !error && setIsModalOpen(true)}
      >
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center justify-between gap-1.5" style={{ color: 'var(--text)' }}>
            <span>Performance Status</span>
            {!loading && !error && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                <Info size={12} /> View Details
              </span>
            )}
          </h3>

          <div className="flex items-center gap-3 py-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110"
              style={{ background: bgStyle, border: '1px solid var(--border)' }}>
              {loading ? (
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--muted)' }} />
              ) : error ? (
                <AlertCircle size={24} style={{ color: '#ff6d34' }} />
              ) : (
                <Trophy size={28} style={{ color: statusIconColor }} />
              )}
            </div>
            <div>
              {loading ? (
                <div className="h-6 w-24 rounded bg-slate-200/20 animate-pulse mb-1"></div>
              ) : error ? (
                <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Status Unavailable
                </p>
              ) : (
                <p className="text-xl font-black truncate" style={{ color: statusColor }}>
                  {performance?.status?.replace('_', ' ')}
                </p>
              )}
              {!loading && !error && (
                <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--muted)' }}>
                  Overall Evaluation
                </p>
              )}
            </div>
          </div>

          <div className="mt-2">
            {loading ? (
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-200/20 animate-pulse"></div>
                <div className="h-3 w-4/5 rounded bg-slate-200/20 animate-pulse"></div>
              </div>
            ) : error ? (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{error}</p>
            ) : (
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text)' }}>
                {performance?.message}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Performance Insights"
        footer={
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: bgStyle, border: '1px solid var(--border)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-sm">
              <Trophy size={28} style={{ color: statusIconColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Current Status</p>
              <h2 className="text-2xl font-black" style={{ color: statusColor }}>{performance?.status?.replace('_', ' ')}</h2>
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-blue-500" />
              Category Breakdown
            </h4>
            <div className="grid gap-3">
              {performance?.insights?.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex items-center gap-3 min-w-[140px]">
                    {insight.status === 'GOOD' ? (
                      <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                    ) : insight.status === 'NEEDS_IMPROVEMENT' ? (
                      <AlertCircle size={20} className="text-orange-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-700">{insight.category}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">{insight.message}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      insight.status === 'GOOD' ? 'bg-emerald-100 text-emerald-700' :
                      insight.status === 'NEEDS_IMPROVEMENT' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {insight.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
              {(!performance?.insights || performance.insights.length === 0) && (
                <p className="text-sm text-slate-500 italic p-2">No detailed insights available yet.</p>
              )}
            </div>
          </div>

          {performance?.recommendation && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <h4 className="text-sm font-bold text-blue-900 mb-1">Recommended Action</h4>
              <p className="text-sm text-blue-800">{performance.recommendation}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default PerformanceStatusCard;
