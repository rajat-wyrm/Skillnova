// ════════════════════════════════════════════════════════════
//  MENTOR — pages/Interns.jsx (daily attendance + weekly ratings)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, Badge } from "../../shared/components/UI";
import UserProfileModal from '../../shared/components/UserProfileModal';
import ScheduleMeetingModal from "../../shared/components/ScheduleMeetingModal";
import MeetingDetailsModal from "../../shared/components/MeetingDetailsModal";
import api from "../../lib/api";
import notify from "../../lib/toast";

const todayKey = () => new Date().toISOString().slice(0, 10);

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({}); // userId -> status
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [marking, setMarking] = useState(null); // userId currently being marked
  const [streaks, setStreaks] = useState({});
  const [meetings, setMeetings] = useState([]);
  const [schedulingIntern, setSchedulingIntern] = useState(null);
  const [detailsIntern, setDetailsIntern] = useState(null);
  const [showMultiSchedule, setShowMultiSchedule] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [internsRes, attendanceRes, meetingsRes] = await Promise.all([
        api.get("/users", { params: { role: "INTERN", limit: 100 } }),
        api.get("/attendance", { params: { date: todayKey(), limit: 100 } }),
        api.get("/meetings/organized"),
      ]);
      setInterns(internsRes.data.items);
      const map = {};
      attendanceRes.data.items.forEach((a) => {
        map[a.userId] = a.status;
      });
      setTodayAttendance(map);
      setMeetings(meetingsRes.data.items || []);

      const streakResults = await Promise.all(
        internsRes.data.items.map((i) =>
          api
            .get("/attendance/streak", { params: { userId: i.id } })
            .then((r) => [i.id, r.data])
            .catch(() => [i.id, null]),
        ),
      );
      setStreaks(Object.fromEntries(streakResults));
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingMeetingForIntern = (internId) => {
    const internMeetings = meetings.filter((m) =>
      m.attendees.some((a) => a.userId === internId)
    );
    const now = new Date();
    const upcoming = internMeetings.filter((m) => new Date(m.startsAt) >= now);
    upcoming.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return upcoming[0];
  };

  const formatUpcomingDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const markAttendance = async (userId, status) => {
    setMarking(userId);
    try {
      await api.post("/attendance/mark", { userId, status });
      setTodayAttendance((m) => ({ ...m, [userId]: status }));
      notify.success(`Marked ${status.toLowerCase()}.`);
    } catch (err) {
      notify.error(err.response?.data?.error || "Could not mark attendance.");
    } finally {
      setMarking(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: "var(--muted)" }}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            My Interns ({interns.length})
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Mark today's meeting attendance and manage weekly ratings.
          </p>
        </div>
        <button
          onClick={() => setShowMultiSchedule(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
          style={{ background: "#ff6d34" }}
        >
          Schedule Meeting
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[48rem]">
            <thead>
              <tr
                style={{
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  "Name",
                  "Email",
                  "Department",
                  "Today's meeting",
                  "Streak",
                  "Rating",
                  "Status",
                  "Meeting"
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                    style={{ color: "var(--muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interns.map((i) => {
                const status = todayAttendance[i.id];
                return (
                  <tr
                    key={i.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td
                      className="px-5 py-4 font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(i.id)}
                        className="text-left hover:underline"
                        style={{ color: 'var(--text)' }}
                      >
                        {i.name}
                      </button>
                    </td>
                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {i.email}
                    </td>
                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {i.department}
                    </td>
                    <td className="px-5 py-4">
                      {status ? (
                        <Badge
                          variant={
                            status === "PRESENT"
                              ? "success"
                              : status === "LEAVE"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {status}
                        </Badge>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => markAttendance(i.id, "PRESENT")}
                            disabled={marking === i.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                            style={{ background: "#00bea3" }}
                          >
                            <CheckCircle size={12} /> Present
                          </button>
                          <button
                            onClick={() => markAttendance(i.id, "ABSENT")}
                            disabled={marking === i.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                            style={{ background: "#dc2626" }}
                          >
                            <XCircle size={12} /> Absent
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {streaks[i.id] ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className="font-bold"
                            style={{ color: "var(--text)" }}
                          >
                            🔥 {streaks[i.id].currentStreak}
                          </span>

                          <Badge
                            variant={
                              streaks[i.id].risk === "HIGH"
                                ? "danger"
                                : streaks[i.id].risk === "MEDIUM"
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {streaks[i.id].risk}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        ⭐ {i.rating?.toFixed?.(1) ?? i.rating ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs uppercase font-medium">
                      {i.status}
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const upcoming = getUpcomingMeetingForIntern(i.id);
                        if (upcoming) {
                          const internAttendee = upcoming.attendees?.find((a) => a.userId === i.id);
                          const rsvp = internAttendee?.response || "PENDING";
                          return (
                            <div className="flex flex-col gap-1 text-[11px] font-normal">
                              <span className="font-semibold truncate max-w-[120px]" style={{ color: "var(--text)" }} title={upcoming.title}>
                                {upcoming.title}
                              </span>
                              <span style={{ color: "var(--muted)" }}>
                                {formatUpcomingDate(upcoming.startsAt)}
                              </span>
                              <div>
                                <Badge
                                  variant={
                                    rsvp === "ACCEPTED" ? "success" :
                                    rsvp === "DECLINED" ? "danger" : "warning"
                                  }
                                >
                                  {rsvp}
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => setDetailsIntern(i)}
                                  className="hover:underline text-[10px] font-medium"
                                  style={{ color: "#ff6d34" }}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => setSchedulingIntern(i)}
                                  className="hover:underline text-[10px] font-medium"
                                  style={{ color: "var(--muted)" }}
                                >
                                  Schedule
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => setSchedulingIntern(i)}
                              className="px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                              style={{ background: "#ff6d34" }}
                            >
                              Schedule
                            </button>
                          );
                        }
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <UserProfileModal isOpen={!!selectedUserId} onClose={() => setSelectedUserId(null)} userId={selectedUserId} />

      {(schedulingIntern || showMultiSchedule) && (
        <ScheduleMeetingModal
          intern={schedulingIntern}
          allInterns={interns}
          onClose={() => {
            setSchedulingIntern(null);
            setShowMultiSchedule(false);
          }}
          onScheduled={() => {
            setSchedulingIntern(null);
            setShowMultiSchedule(false);
            fetchAll();
          }}
        />
      )}

      {detailsIntern && (
        <MeetingDetailsModal
          intern={detailsIntern}
          onClose={() => setDetailsIntern(null)}
          onUpdated={() => {
            fetchAll();
          }}
        />
      )}
    </div>
  );
};

export default Interns;
