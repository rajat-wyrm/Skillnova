import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function Attendance() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonalSummary();
  }, []);

  const fetchPersonalSummary = async () => {
    try {
      const { data } = await api.get('/attendance/summary');
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch personal attendance summary", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Track your daily platform activity and active session telemetry.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase">Present (30D)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : (stats?.presentCount ?? 1)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase">Absent (30D)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : (stats?.absentCount ?? 0)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase">On Leave</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : (stats?.leaveCount ?? 0)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase">Attendance Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : (stats?.attendanceRate ?? '100%')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Today's Live Tracking</h2>
        <p className="text-sm text-gray-500 mb-4">Your background telemetry is active on the platform. (Requirement: 2 hours/day)</p>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Active telemetry session running</span>
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Telemetry Active
          </span>
        </div>
      </div>
    </div>
  );
}