import { useState } from "react";
import { X } from "lucide-react";
import api from "../../lib/api";
import notify from "../../lib/toast";

const ScheduleMeetingModal = ({ intern, allInterns = [], onClose, onScheduled }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("TRAINING");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [description, setDescription] = useState("");
  const [attendeeIds, setAttendeeIds] = useState(
    intern ? [intern.id] : allInterns.map((i) => i.id)
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      notify.error("Title is required");
      return;
    }
    if (!date) {
      notify.error("Date is required");
      return;
    }
    if (!startTime) {
      notify.error("Start time is required");
      return;
    }
    if (!endTime) {
      notify.error("End time is required");
      return;
    }
    if (attendeeIds.length === 0) {
      notify.error("At least one attendee must be selected");
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

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

    setLoading(true);

    try {
      await api.post("/meetings", {
        title,
        type,
        startsAt: startDateTime.toISOString(),
        endsAt: endDateTime.toISOString(),
        location,
        meetingLink: meetingLink.trim() || null,
        description,
        attendeeIds,
      });
      notify.success("Meeting scheduled successfully");
      onScheduled();
    } catch (err) {
      notify.error(err.response?.data?.error || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, width: "min(90vw, 560px)", maxHeight: "90vh", overflow: "auto", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Schedule Meeting</h3>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {intern ? `With ${intern.name}` : "Schedule a meeting for multiple interns"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Java Doubt Session"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
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
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Google Meet"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Meeting Link</label>
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="e.g. https://meet.google.com/..."
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. OOP concepts discussion"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--muted)" }}>Attendees</label>
            <div className="max-h-40 overflow-y-auto p-3 rounded-lg space-y-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {allInterns.length > 0 && (
                <label className="flex items-center gap-2 pb-2 border-b cursor-pointer text-sm font-semibold select-none" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={attendeeIds.length === allInterns.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAttendeeIds(allInterns.map((i) => i.id));
                      } else {
                        setAttendeeIds([]);
                      }
                    }}
                  />
                  <span>Select All Interns</span>
                </label>
              )}
              {allInterns.map((i) => (
                <label key={i.id} className="flex items-center gap-2 cursor-pointer text-sm select-none" style={{ color: "var(--text)" }}>
                  <input
                    type="checkbox"
                    checked={attendeeIds.includes(i.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAttendeeIds([...attendeeIds, i.id]);
                      } else {
                        setAttendeeIds(attendeeIds.filter((id) => id !== i.id));
                      }
                    }}
                  />
                  <span>{i.name}</span>
                  {i.department && <span className="text-xs" style={{ color: "var(--muted)" }}>({i.department})</span>}
                </label>
              ))}
              {allInterns.length === 0 && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>No interns available.</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ border: "1px solid var(--border)", color: "var(--text)" }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
              disabled={loading}
            >
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;
