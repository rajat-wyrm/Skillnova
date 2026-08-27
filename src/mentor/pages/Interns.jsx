// ════════════════════════════════════════════════════════════
// MENTOR — pages/Interns.jsx
// Daily attendance + weekly ratings + meeting scheduling
// ════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

import { Card, Badge, Modal, Input, SectionHeader } from "../../shared/components/UI";
import UserProfileModal from "../../shared/components/UserProfileModal";
import ScheduleMeetingModal from "../../shared/components/ScheduleMeetingModal";
import MeetingDetailsModal from "../../shared/components/MeetingDetailsModal";

import api, { getErrorMessage } from "../../lib/api";
import notify from "../../lib/toast";

const todayKey = () => new Date().toISOString().slice(0, 10);

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [marking, setMarking] = useState(null);
  const [streaks, setStreaks] = useState({});

  // Existing intern management
  const [filterTab, setFilterTab] = useState("my");
  const [modalOpen, setModalOpen] = useState(false);
  const [ratingModal, setRatingModal] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [ratingVal, setRatingVal] = useState(8.5);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "User#2026",
    department: "",
    role: "INTERN",
  });
  const [assignedInterns, setAssignedInterns] = useState([]);

  // Meeting feature
  const [meetings, setMeetings] = useState([]);
  const [schedulingIntern, setSchedulingIntern] = useState(null);
  const [detailsIntern, setDetailsIntern] = useState(null);
  const [showMultiSchedule, setShowMultiSchedule] = useState(false);

  const fetchAll = async () => {
    try {
      const [internsRes, attendanceRes, assignedRes, meetingsRes] =
        await Promise.all([
          api.get("/users", {
            params: {
              role: "INTERN",
              myInterns: filterTab === "my",
              limit: 100,
            },
          }),

          api.get("/attendance", {
            params: {
              date: todayKey(),
              limit: 100,
            },
          }),

          api.get("/users", {
            params: {
              role: "INTERN",
              myInterns: true,
              limit: 100,
            },
          }),

          api.get("/meetings/organized"),
        ]);

      const currentList = internsRes.data.items || [];
      const assignedList = assignedRes.data.items || [];

      setInterns(currentList);
      setAssignedInterns(assignedList);

      const map = {};

      (attendanceRes.data.items || []).forEach((a) => {
        map[a.userId] = a.status;
      });

      setTodayAttendance(map);
      setMeetings(meetingsRes.data.items || []);

      const streakResults = await Promise.all(
        currentList.map((i) =>
          api
            .get("/attendance/streak", {
              params: { userId: i.id },
            })
            .then((r) => [i.id, r.data])
            .catch(() => [i.id, null])
        )
      );

      setStreaks(Object.fromEntries(streakResults));
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingMeetingForIntern = (internId) => {
    const internMeetings = meetings.filter((m) =>
      m.attendees?.some((a) => a.userId === internId)
    );

    const now = new Date();

    const upcoming = internMeetings.filter(
      (m) => new Date(m.startsAt) >= now
    );

    upcoming.sort(
      (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
    );

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

    const interval = setInterval(fetchAll, 6000);

    return () => clearInterval(interval);
  }, [filterTab]);

  const addIntern = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      return notify.error("Name and email are required.");
    }

    try {
      await api.post("/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password || "User#2026",
        department: form.department.trim() || undefined,
        role: "INTERN",
      });

      notify.success(`Intern "${form.name}" added successfully.`);

      setModalOpen(false);

      setForm({
        name: "",
        email: "",
        password: "User#2026",
        department: "",
        role: "INTERN",
      });

      fetchAll();
    } catch (err) {
      notify.error(getErrorMessage(err));
    }
  };

  const toggleTeamLead = async (user) => {
    const nextTL = !user.isTL;

    try {
      await api.post(`/auth/intern/${user.id}/set-tl`, {
        isTL: nextTL,
      });

      notify.success(
        `${user.name} is now ${nextTL ? "a" : "not a"
        } Team Lead.`
      );

      fetchAll();
    } catch (err) {
      notify.error(getErrorMessage(err));
    }
  };

  const markAttendance = async (userId, status) => {
    setMarking(userId);

    try {
      await api.post("/attendance/mark", {
        userId,
        status,
      });

      setTodayAttendance((m) => ({
        ...m,
        [userId]: status,
      }));

      notify.success(`Attendance marked as ${status}.`);
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setMarking(null);
    }
  };

  const markAllPresent = async () => {
    const targets =
      assignedInterns.length > 0
        ? assignedInterns
        : filterTab === "my"
          ? interns
          : [];

    if (targets.length === 0) {
      return notify.error(
        "No assigned interns found to mark present."
      );
    }

    try {
      await Promise.all(
        targets.map((i) =>
          api.post("/attendance/mark", {
            userId: i.id,
            status: "PRESENT",
          })
        )
      );

      notify.success(
        `Marked all ${targets.length} assigned intern(s) PRESENT for today!`
      );

      fetchAll();
    } catch (err) {
      notify.error(getErrorMessage(err));
    }
  };

  const updateRating = async () => {
    if (!editingIntern) return;

    try {
      await api.patch(`/users/${editingIntern.id}`, {
        rating: Number(ratingVal),
      });

      notify.success(
        `Rating updated for ${editingIntern.name}.`
      );

      setRatingModal(false);
      setEditingIntern(null);

      fetchAll();
    } catch (err) {
      notify.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: "var(--muted)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <SectionHeader
        title={`Interns & Attendance (${interns.length})`}
        subtitle="Mark today's meeting attendance, review streaks and manage intern performance."
        action={
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">

            <button
              onClick={markAllPresent}
              className="flex items-center gap-2 px-3.5 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              style={{ background: "#00bea3" }}
            >
              <CheckCircle size={14} />
              Mark All Present
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              style={{ background: "#ff6d34" }}
            >
              + Add Intern
            </button>

            <button
              onClick={() => setShowMultiSchedule(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              style={{ background: "#ff6d34" }}
            >
              Schedule Meeting
            </button>

          </div>
        }
      />

      {/* Intern filters */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">

        <button
          onClick={() => setFilterTab("my")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${filterTab === "my"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
        >
          My Interns
        </button>

        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${filterTab === "all"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
        >
          All Platform Interns
        </button>

      </div>

      {/* Intern table */}
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
                  "Name & Email",
                  "Department",
                  "Today's Attendance",
                  "Streak & Risk",
                  "Rating",
                  "Status",
                  "Actions",
                  "Meeting",
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
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                  >

                    {/* Name */}
                    <td
                      className="px-5 py-4 font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserId(i.id)
                          }
                          className="font-semibold text-left hover:underline"
                          style={{ color: "var(--text)" }}
                        >
                          {i.name}
                        </button>

                        <p className="text-xs opacity-60 font-normal">
                          {i.email}
                        </p>
                      </div>
                    </td>

                    {/* Department */}
                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {i.department || "—"}
                    </td>

                    {/* Attendance */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">

                        {status && (
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
                        )}

                        <select
                          value={status || ""}
                          onChange={(e) =>
                            markAttendance(
                              i.id,
                              e.target.value
                            )
                          }
                          disabled={marking === i.id}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          <option value="" disabled>
                            Mark status...
                          </option>

                          <option value="PRESENT">
                            PRESENT
                          </option>

                          <option value="ABSENT">
                            ABSENT
                          </option>

                          <option value="LEAVE">
                            LEAVE
                          </option>

                          <option value="HALF_DAY">
                            HALF DAY
                          </option>

                          <option value="LATE">
                            LATE
                          </option>
                        </select>

                      </div>
                    </td>

                    {/* Streak */}
                    <td className="px-5 py-4">

                      {streaks[i.id] ? (
                        <div className="flex items-center gap-1.5 text-xs">

                          <span
                            className="font-bold"
                            style={{
                              color: "var(--text)",
                            }}
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
                        <span className="text-xs opacity-40">
                          —
                        </span>
                      )}

                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4">

                      <button
                        onClick={() => {
                          setEditingIntern(i);
                          setRatingVal(
                            i.rating || 8.5
                          );
                          setRatingModal(true);
                        }}
                        className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full hover:underline"
                      >
                        ⭐{" "}
                        {i.rating?.toFixed?.(1) ??
                          i.rating ??
                          0}
                        /10
                      </button>

                    </td>

                    {/* Team Lead */}
                    <td className="px-5 py-4">

                      <button
                        onClick={() =>
                          toggleTeamLead(i)
                        }
                        className="text-xs font-semibold text-purple-600 hover:underline"
                      >
                        {i.isTL
                          ? "Unset TL"
                          : "Set TL"}
                      </button>

                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-xs uppercase font-medium">
                      {i.status}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUserId(i.id)
                        }
                        className="hover:underline"
                        style={{ color: "#ff6d34" }}
                      >
                        View
                      </button>
                    </td>

                    {/* Meeting */}
                    <td className="px-5 py-4">

                      {(() => {
                        const upcoming =
                          getUpcomingMeetingForIntern(
                            i.id
                          );

                        if (upcoming) {
                          const internAttendee =
                            upcoming.attendees?.find(
                              (a) =>
                                a.userId === i.id
                            );

                          const rsvp =
                            internAttendee?.response ||
                            "PENDING";

                          return (
                            <div className="flex flex-col gap-1 text-[11px] font-normal">

                              <span
                                className="font-semibold truncate max-w-[120px]"
                                style={{
                                  color: "var(--text)",
                                }}
                                title={upcoming.title}
                              >
                                {upcoming.title}
                              </span>

                              <span
                                style={{
                                  color: "var(--muted)",
                                }}
                              >
                                {formatUpcomingDate(
                                  upcoming.startsAt
                                )}
                              </span>

                              <div>
                                <Badge
                                  variant={
                                    rsvp === "ACCEPTED"
                                      ? "success"
                                      : rsvp === "DECLINED"
                                        ? "danger"
                                        : "warning"
                                  }
                                >
                                  {rsvp}
                                </Badge>
                              </div>

                              <div className="flex gap-2 mt-1">

                                <button
                                  onClick={() =>
                                    setDetailsIntern(i)
                                  }
                                  className="hover:underline text-[10px] font-medium"
                                  style={{
                                    color: "#ff6d34",
                                  }}
                                >
                                  View
                                </button>

                                <button
                                  onClick={() =>
                                    setSchedulingIntern(i)
                                  }
                                  className="hover:underline text-[10px] font-medium"
                                  style={{
                                    color: "var(--muted)",
                                  }}
                                >
                                  Schedule
                                </button>

                              </div>

                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={() =>
                              setSchedulingIntern(i)
                            }
                            className="px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                            style={{
                              background: "#ff6d34",
                            }}
                          >
                            Schedule
                          </button>
                        );
                      })()}

                    </td>

                  </tr>
                );
              })}

              {interns.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    No interns found under this filter.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </Card>

      {/* User profile */}
      <UserProfileModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
      />

      {/* Add Intern Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Intern"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={addIntern}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg"
              style={{
                background: "#ff6d34",
              }}
            >
              Create Intern
            </button>
          </>
        }
      >
        <div className="space-y-4">

          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <Input
            label="Email *"
            type="email"
            placeholder="intern@skillnova.com"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <Input
            label="Initial Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <Input
            label="Department"
            placeholder="e.g. AI / ML"
            value={form.department}
            onChange={(e) =>
              setForm({
                ...form,
                department: e.target.value,
              })
            }
          />

        </div>
      </Modal>

      {/* Edit Rating Modal */}
      <Modal
        isOpen={ratingModal}
        onClose={() => setRatingModal(false)}
        title={`Update Rating — ${editingIntern?.name || ""
          }`}
        footer={
          <>
            <button
              onClick={() =>
                setRatingModal(false)
              }
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={updateRating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg"
            >
              Save Rating
            </button>
          </>
        }
      >
        <div className="space-y-4">

          <Input
            label="Intern Rating (0 to 10) *"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={ratingVal}
            onChange={(e) =>
              setRatingVal(e.target.value)
            }
          />

        </div>
      </Modal>

      {/* Schedule Meeting Modal */}
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

      {/* Meeting Details Modal */}
      {detailsIntern && (
        <MeetingDetailsModal
          intern={detailsIntern}
          onClose={() =>
            setDetailsIntern(null)
          }
          onUpdated={() => {
            fetchAll();
          }}
        />
      )}

    </div>
  );
};

export default Interns;