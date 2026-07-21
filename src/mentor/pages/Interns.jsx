// ════════════════════════════════════════════════════════════
//  MENTOR — pages/Interns.jsx (daily attendance + weekly ratings)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, Badge } from "../../shared/components/UI";
import api from "../../lib/api";
import notify from "../../lib/toast";

const todayKey = () => new Date().toISOString().slice(0, 10);

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({}); // userId -> status
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null); // userId currently being marked

  const [streaks, setStreaks] = useState({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [internsRes, attendanceRes] = await Promise.all([
        api.get("/users", { params: { role: "INTERN", limit: 100 } }),
        api.get("/attendance", { params: { date: todayKey(), limit: 100 } }),
      ]);
      setInterns(internsRes.data.items);
      const map = {};
      attendanceRes.data.items.forEach((a) => {
        map[a.userId] = a.status;
      });
      setTodayAttendance(map);

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
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          My Interns ({interns.length})
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Mark today's meeting attendance and manage weekly ratings.
        </p>
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
                      {i.name}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Interns;
