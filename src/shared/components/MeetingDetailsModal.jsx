import { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, Edit2, Trash2, Check } from "lucide-react";
import api from "../../lib/api";
import notify from "../../lib/toast";
import { Badge } from "./UI";

const MeetingDetailsModal = ({ intern, onClose, onUpdated }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("TRAINING");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editMeetingLink, setEditMeetingLink] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      // Fetch all meetings organized by the mentor
      const res = await api.get("/meetings/organized");
      // Filter meetings where this intern is an attendee
      const filtered = res.data.items.filter((m) =>
        m.attendees.some((a) => a.userId === intern.id)
      );
      setMeetings(filtered);
    } catch (err) {
      notify.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [intern.id]);

  const handleStartEdit = (m) => {
    setEditingId(m.id);
    setEditTitle(m.title || "");
    setEditType(m.type || "TRAINING");
    
    // Parse startsAt and endsAt to inputs
    const startObj = new Date(m.startsAt);
    const dateStr = startObj.toISOString().slice(0, 10);
    const startStr = startObj.toTimeString().slice(0, 5); // "HH:MM"
    
    setEditDate(dateStr);
    setEditStartTime(startStr);

    if (m.endsAt) {
      const endObj = new Date(m.endsAt);
      setEditEndTime(endObj.toTimeString().slice(0, 5));
    } else {
      setEditEndTime("");
    }
    setEditLocation(m.location || "");
    setEditMeetingLink(m.meetingLink || "");
    setEditDescription(m.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (mId) => {
    if (!editTitle.trim()) {
      notify.error("Title is required");
      return;
    }
    if (!editDate) {
      notify.error("Date is required");
      return;
    }
    if (!editStartTime) {
      notify.error("Start time is required");
      return;
    }
    if (!editEndTime) {
      notify.error("End time is required");
      return;
    }

    const startDateTime = new Date(`${editDate}T${editStartTime}:00`);
    const endDateTime = new Date(`${editDate}T${editEndTime}:00`);

    if (isNaN(startDateTime.getTime())) {
      notify.error("Invalid start date/time");
      return;
    }
    if (isNaN(endDateTime.getTime())) {
      notify.error("Invalid end date/time");
      return;
    }
    if (endDateTime <= startDateTime) {
      notify.error("End time must be after start time");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/meetings/${mId}`, {
        title: editTitle,
        type: editType,
        startsAt: startDateTime.toISOString(),
        endsAt: endDateTime.toISOString(),
        location: editLocation,
        meetingLink: editMeetingLink.trim() || null,
        description: editDescription,
      });
      notify.success("Meeting updated");
      setEditingId(null);
      fetchMeetings();
      onUpdated();
    } catch (err) {
      notify.error(err.response?.data?.error || "Failed to update meeting");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mId) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) return;

    try {
      await api.delete(`/meetings/${mId}`);
      notify.success("Meeting cancelled");
      fetchMeetings();
      onUpdated();
    } catch (err) {
      notify.error("Failed to cancel meeting");
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTimeRange = (startIso, endIso) => {
    const s = new Date(startIso);
    const startStr = s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (!endIso) return startStr;
    const e = new Date(endIso);
    const endStr = e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, width: "min(90vw, 650px)", maxHeight: "90vh", overflow: "auto", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Scheduled Meetings</h3>
            <p className="text-xs" style={{ color: "var(--muted)" }}>With {intern.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
            Loading meetings...
          </div>
        ) : meetings.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
            No meetings scheduled with this intern.
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((m) => {
              const internAttendee = m.attendees.find((a) => a.userId === intern.id);
              const rsvp = internAttendee?.response || "PENDING";
              const isEditing = editingId === m.id;

              const totalCount = m.attendees.length;
              const acceptedCount = m.attendees.filter((a) => a.response === "ACCEPTED").length;
              const declinedCount = m.attendees.filter((a) => a.response === "DECLINED").length;
              const pendingCount = m.attendees.filter((a) => a.response === "PENDING").length;

              return (
                <div key={m.id} className="p-4 rounded-xl border transition" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                  {isEditing ? (
                    // EDIT MODE
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                          style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>Type</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                          >
                            <option value="TRAINING">Training</option>
                            <option value="REVIEW">Review</option>
                            <option value="STANDUP">Standup</option>
                            <option value="ONE_ON_ONE">One-on-One</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>Start Time</label>
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>End Time</label>
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>Location</label>
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>Meeting Link</label>
                          <input
                            type="text"
                            value={editMeetingLink}
                            onChange={(e) => setEditMeetingLink(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                            placeholder="https://meet.google.com/..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "var(--muted)" }}>Description</label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={1}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs resize-none"
                            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1 rounded-lg text-xs font-medium"
                          style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(m.id)}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-1"
                          style={{ background: "#ff6d34" }}
                          disabled={saving}
                        >
                          <Check size={12} /> {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{m.title}</span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40" style={{ color: "#ff6d34" }}>{m.type}</span>
                            <Badge
                              variant={
                                rsvp === "ACCEPTED" ? "success" :
                                rsvp === "DECLINED" ? "danger" : "warning"
                              }
                            >
                              RSVP: {rsvp}
                            </Badge>
                          </div>
                          {m.description && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{m.description}</p>}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleStartEdit(m)}
                            className="p-1 rounded hover:bg-white/5"
                            style={{ color: "var(--muted)" }}
                            title="Edit Meeting"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1 rounded hover:bg-white/5 text-red-500"
                            title="Cancel Meeting"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs" style={{ color: "var(--muted)" }}>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(m.startsAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {formatTimeRange(m.startsAt, m.endsAt)}
                        </span>
                        {m.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {m.location}
                          </span>
                        )}
                        {m.meetingLink && (
                          <span className="flex items-center gap-1">
                            <a
                              href={m.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-500 hover:underline font-semibold"
                            >
                              Join Meeting
                            </a>
                          </span>
                        )}
                      </div>

                      {/* Attendee Responses Matrix */}
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
                          Attendees RSVP Status ({totalCount} total):
                        </div>
                        <div className="flex gap-3 text-xs mb-2" style={{ color: "var(--text)" }}>
                          <span className="text-emerald-500">Accepted: {acceptedCount}</span>
                          <span className="text-rose-500">Declined: {declinedCount}</span>
                          <span className="text-amber-500">Pending: {pendingCount}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.attendees.map((a) => (
                            <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border text-xs" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                              {a.user?.name}
                              <span className={`text-[10px] font-bold ${
                                a.response === "ACCEPTED" ? "text-emerald-500" :
                                a.response === "DECLINED" ? "text-rose-500" : "text-amber-500"
                              }`}>
                                ({a.response})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetailsModal;
