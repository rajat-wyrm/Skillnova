// ════════════════════════════════════════════════════════════
//  USER — pages/Attendance.jsx (mentor marks attendance, intern requests leave)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Flame,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  PauseCircle,
  CalendarPlus,
} from "lucide-react";
import {
  Card,
  StatCard,
  SectionHeader,
  Badge,
  Modal,
  Input,
  PrimaryButton,
} from "../../shared/components/UI";
import api from "../../lib/api";
import notify from "../../lib/toast";
import { formatDate } from "../../lib/utils";

const STATUS_VARIANT = {
  PRESENT: "success",
  ABSENT: "danger",
  LEAVE: "warning",
  HALF_DAY: "warning",
  LATE: "warning",
};

const RISK_META = {
  LOW: {
    label: "Low risk",
    variant: "success",
    icon: ShieldCheck,
    color: "#00bea3",
  },
  MEDIUM: {
    label: "Medium risk",
    variant: "warning",
    icon: ShieldAlert,
    color: "#f59e0b",
  },
  HIGH: {
    label: "High risk",
    variant: "danger",
    icon: ShieldX,
    color: "#dc2626",
  },
};

const Attendance = () => {
  const [summary, setSummary] = useState(null);
  const [streak, setStreak] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [s, st, r] = await Promise.all([
        api.get("/attendance/summary"),
        api.get("/attendance/streak"),
        api.get("/attendance", { params: { limit: 30 } }),
      ]);
      setSummary(s.data);
      setStreak(st.data);
      setRecords(r.data.items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const submitLeave = async () => {
    if (
      !leaveForm.startDate ||
      !leaveForm.endDate ||
      !leaveForm.reason.trim()
    ) {
      notify.error("Fill in start date, end date, and reason.");
      return;
    }
    setLeaveSubmitting(true);
    try {
      const res = await api.post("/attendance/leave", leaveForm);
      notify.success(
        `Leave marked for ${res.data.marked} working day(s). Your streak is paused for these dates.`,
      );
      setLeaveOpen(false);
      setLeaveForm({ startDate: "", endDate: "", reason: "" });
      fetch();
    } catch (err) {
      notify.error(
        err.response?.data?.error || "Could not submit leave request.",
      );
    } finally {
      setLeaveSubmitting(false);
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

  const risk = RISK_META[streak?.risk] || RISK_META.LOW;
  const RiskIcon = risk.icon;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Attendance"
        subtitle="Your mentor marks daily attendance from today's meeting"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Present (30d)"
          value={summary?.present ?? 0}
          icon={CheckCircle}
          color="#00bea3"
        />
        <StatCard
          title="Absent (30d)"
          value={summary?.absent ?? 0}
          icon={XCircle}
          color="#dc2626"
        />
        <StatCard
          title="On Leave"
          value={summary?.leave ?? 0}
          icon={Clock}
          color="#f59e0b"
        />
        <StatCard
          title="Attendance Rate"
          value={`${summary?.rate ?? 0}%`}
          icon={CalendarCheck}
          color="#ff6d34"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-xl"
              style={{ background: "rgba(255,109,52,0.12)", color: "#ff6d34" }}
            >
              <Flame size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                Current streak
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className="text-2xl font-black"
                  style={{ color: "var(--text)" }}
                >
                  {streak?.currentStreak ?? 0}
                </p>
                <span className="text-xs opacity-50">
                  days · best {streak?.longestStreak ?? 0}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak?.onLeaveToday && (
              <Badge variant="gray">
                <span className="flex items-center gap-1">
                  <PauseCircle size={12} /> Paused (on leave)
                </span>
              </Badge>
            )}
            <RiskIcon size={16} style={{ color: risk.color }} />
            <Badge variant={risk.variant}>{risk.label}</Badge>
          </div>
        </div>
        {streak && streak.risk !== "LOW" && (
          <p
            className="text-xs mt-3 pt-3"
            style={{
              color: "var(--muted)",
              borderTop: "1px solid var(--border)",
            }}
          >
            {streak.absences14} unexplained absence
            {streak.absences14 === 1 ? "" : "s"} in the last 14 days. Approved
            leave doesn't count against this — if you're out, submit a leave
            request so your TL sees the real picture.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Attendance is marked by your mentor
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Based on today's meeting. If you're going to be out, submit a
              leave request below.
            </p>
          </div>
          <button
            onClick={() => setLeaveOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
            style={{ color: "#ff6d34" }}
          >
            <CalendarPlus size={14} /> Request leave for a date range
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div
          className="px-5 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            Recent records
          </h3>
        </div>
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr
                style={{
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Date", "Status", "Check-in", "Check-out", "Notes"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                      style={{ color: "var(--muted)" }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12"
                    style={{ color: "var(--muted)" }}
                  >
                    No attendance records yet.
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td
                    className="px-5 py-4 font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {formatDate(r.date)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[r.status]}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td
                    className="px-5 py-4 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {r.checkIn
                      ? new Date(r.checkIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td
                    className="px-5 py-4 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {r.checkOut
                      ? new Date(r.checkOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td
                    className="px-5 py-4 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {r.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Request Leave"
        footer={
          <>
            <button
              onClick={() => setLeaveOpen(false)}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <PrimaryButton onClick={submitLeave} disabled={leaveSubmitting}>
              {leaveSubmitting ? "Submitting…" : "Submit"}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start date"
              type="date"
              value={leaveForm.startDate}
              onChange={(e) =>
                setLeaveForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
            <Input
              label="End date"
              type="date"
              value={leaveForm.endDate}
              onChange={(e) =>
                setLeaveForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reason
            </label>
            <textarea
              rows={3}
              value={leaveForm.reason}
              onChange={(e) =>
                setLeaveForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="e.g. Family function, medical appointment…"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Weekends inside the range are skipped automatically. These days are
            marked LEAVE — your streak pauses instead of resetting.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
