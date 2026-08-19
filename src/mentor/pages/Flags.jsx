import { useState, useEffect } from "react";
import api from "../../lib/api";

const FLAG_TYPES = [
  { value: "ATTENDANCE_DROPPING", label: "Attendance Dropping", color: "red", emoji: "🔴" },
  { value: "MISSED_DEADLINE", label: "Missed Deadline", color: "yellow", emoji: "🟡" },
  { value: "NEEDS_SUPPORT", label: "Needs Support", color: "blue", emoji: "🔵" },
  { value: "BEHAVIOUR_CONCERN", label: "Behaviour Concern", color: "orange", emoji: "⚠️" },
  { value: "OTHER", label: "Other", color: "gray", emoji: "⚪" },
];

export default function Flags() {
  const [flags, setFlags] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ internId: "", type: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFlags();
    fetchInterns();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await api.get("/flags/my-flags");
      setFlags(res.data.flags);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    try {
      const res = await api.get("/analytics/interns");
      setInterns(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!form.internId || !form.type) return;
    setSubmitting(true);
    try {
      await api.post("/flags", form);
      setShowForm(false);
      setForm({ internId: "", type: "", reason: "" });
      fetchFlags();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/flags/${id}/resolve`);
      fetchFlags();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/flags/${id}`);
      fetchFlags();
    } catch (err) {
      console.error(err);
    }
  };

  const getFlagType = (type) =>
    FLAG_TYPES.find((f) => f.value === type) || FLAG_TYPES[4];

  const activeFlags = flags.filter((f) => f.status === "ACTIVE");
  const resolvedFlags = flags.filter((f) => f.status === "RESOLVED");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Flag & Alert System</h1>
          <p className="text-gray-400 text-sm mt-1">
            Flag interns who need attention
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + Raise Flag
        </button>
      </div>

      {/* Flag Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Raise a New Flag</h2>
          <div className="grid grid-cols-1 gap-4">
            <select
              value={form.internId}
              onChange={(e) => setForm({ ...form, internId: e.target.value })}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none"
            >
              <option value="">Select Intern</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.name}
                </option>
              ))}
            </select>

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none"
            >
              <option value="">Select Flag Type</option>
              {FLAG_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>

            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason (optional)"
              rows={3}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                {submitting ? "Submitting..." : "Submit Flag"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Flags</p>
          <p className="text-white text-2xl font-bold">{flags.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-red-900">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-red-400 text-2xl font-bold">{activeFlags.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-green-900">
          <p className="text-gray-400 text-sm">Resolved</p>
          <p className="text-green-400 text-2xl font-bold">{resolvedFlags.length}</p>
        </div>
      </div>

      {/* Active Flags */}
      <h2 className="text-white font-semibold mb-3">🔴 Active Flags</h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : activeFlags.length === 0 ? (
        <p className="text-gray-400 mb-6">No active flags. All interns are doing well! 🎉</p>
      ) : (
        <div className="space-y-3 mb-6">
          {activeFlags.map((flag) => {
            const flagType = getFlagType(flag.type);
            return (
              <div
                key={flag.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{flagType.emoji}</span>
                    <span className="text-white font-medium">
                      {flag.intern.name}
                    </span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                      {flagType.label}
                    </span>
                  </div>
                  {flag.reason && (
                    <p className="text-gray-400 text-sm">{flag.reason}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(flag.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve(flag.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved Flags */}
      {resolvedFlags.length > 0 && (
        <>
          <h2 className="text-white font-semibold mb-3">✅ Resolved Flags</h2>
          <div className="space-y-3">
            {resolvedFlags.map((flag) => {
              const flagType = getFlagType(flag.type);
              return (
                <div
                  key={flag.id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700 opacity-60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{flagType.emoji}</span>
                      <span className="text-white font-medium">
                        {flag.intern.name}
                      </span>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                        {flagType.label}
                      </span>
                      <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">
                        Resolved
                      </span>
                    </div>
                    {flag.reason && (
                      <p className="text-gray-400 text-sm">{flag.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}