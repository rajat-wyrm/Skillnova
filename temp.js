import { useState, useEffect } from "react";
import { Target, TrendingUp, BookOpen, ChevronRight, Loader2, Search, Zap } from "lucide-react";
import { Card, SectionHeader } from "../../shared/components/UI";
import api from "../../lib/api";
import notify from "../../lib/toast";
const COLORS = { green: "#10b981", amber: "#f59e0b", red: "#ef4444", blue: "#3b82f6", purple: "#8b5cf6" };
const readinessColor = (score) => score >= 70 ? COLORS.green : score >= 40 ? COLORS.amber : COLORS.red;
const DonutChart = ({ matched, partial, missing }) => {
  const total = matched + partial + missing;
  if (total === 0) return null;
  const r = 60, cx = 75, cy = 75, strokeW = 20;
  const circ = 2 * Math.PI * r;
  const segments = [
    { value: matched, color: COLORS.green, label: "Matched" },
    { value: partial, color: COLORS.amber, label: "Partial" },
    { value: missing, color: COLORS.red, label: "Missing" }
  ].filter((s) => s.value > 0);
  let offset = 0;
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement("svg", { width: 150, height: 150, viewBox: "0 0 150 150" }, segments.map((seg, i) => {
    const dash = seg.value / total * circ;
    const el = /* @__PURE__ */ React.createElement(
      "circle",
      {
        key: i,
        cx,
        cy,
        r,
        fill: "none",
        stroke: seg.color,
        strokeWidth: strokeW,
        strokeDasharray: `${dash} ${circ - dash}`,
        strokeDashoffset: -offset,
        transform: `rotate(-90 ${cx} ${cy})`
      }
    );
    offset += dash;
    return el;
  }), /* @__PURE__ */ React.createElement("text", { x: cx, y: cy - 5, textAnchor: "middle", fill: "white", fontSize: 22, fontWeight: 800 }, matched), /* @__PURE__ */ React.createElement("text", { x: cx, y: cy + 14, textAnchor: "middle", fill: "rgba(255,255,255,0.5)", fontSize: 11 }, "matched")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.7)" } }, segments.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 } }), s.label, ": ", s.value))));
};
const ScoreBar = ({ label, score, color }) => /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,0.7)" } }, label), /* @__PURE__ */ React.createElement("span", { style: { color: color || "white", fontWeight: 700 } }, score.toFixed(1), "%")), /* @__PURE__ */ React.createElement("div", { style: { height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${score}%`, background: color || readinessColor(score), borderRadius: 4, transition: "width 0.5s ease" } })));
const SkillGapAnalyzer = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fetchingMeta, setFetchingMeta] = useState(true);
  useEffect(() => {
    api.get("/skill-gap/metadata").then(({ data }) => {
      setDomains(data.domains);
      if (data.domains.length) setSelectedDomain(data.domains[0]);
    }).catch(() => notify.error("Failed to load skill gap data")).finally(() => setFetchingMeta(false));
  }, []);
  useEffect(() => {
    if (!selectedDomain) return;
    api.get("/skill-gap/roles", { params: { domain: selectedDomain } }).then(({ data }) => {
      setRoles(data.roles);
      if (data.roles.length) setSelectedRole(data.roles[0]);
    }).catch(() => setRoles([]));
  }, [selectedDomain]);
  const handleAnalyze = async () => {
    const skills = userSkills.split(",").map((s) => s.trim()).filter(Boolean);
    if (!skills.length) {
      notify.error("Enter at least one skill");
      return;
    }
    if (!selectedRole) {
      notify.error("Select a role");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/skill-gap/analyze", { skills, domain: selectedDomain, role: selectedRole });
      setResult(data);
    } catch (err) {
      notify.error(err.response?.data?.error || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };
  if (fetchingMeta) return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center min-h-[40vh]" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 28, style: { color: "var(--muted)" } }));
  return /* @__PURE__ */ React.createElement("div", { className: "max-w-5xl space-y-6 w-full min-w-0" }, /* @__PURE__ */ React.createElement(SectionHeader, { title: "Skill Gap Analyzer", subtitle: "Compare your skills against industry role requirements" }), /* @__PURE__ */ React.createElement(Card, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)" } }, "Domain"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedDomain,
      onChange: (e) => setSelectedDomain(e.target.value),
      style: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontSize: 14 }
    },
    domains.map((d) => /* @__PURE__ */ React.createElement("option", { key: d, value: d }, d))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)" } }, "Role"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedRole,
      onChange: (e) => setSelectedRole(e.target.value),
      style: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontSize: 14 }
    },
    roles.map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r))
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)" } }, "Your Skills (comma-separated)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: userSkills,
      onChange: (e) => setUserSkills(e.target.value),
      rows: 3,
      placeholder: "e.g. Python, SQL, Machine Learning, Excel, Git",
      style: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontSize: 14, resize: "vertical" }
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleAnalyze,
      disabled: loading,
      style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", background: loading ? "#6b7280" : "#ff6d34", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", width: "100%" }
    },
    loading ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { size: 16, className: "animate-spin" }), " Analyzing...") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Target, { size: 16 }), " Analyze Skill Gap")
  )), result && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 } }, [
    { label: "Skills Entered", value: result.summary.skillsEntered, icon: "\u{1F4DD}", color: "white" },
    { label: "Matched", value: result.summary.matched, icon: "\u2705", color: COLORS.green },
    { label: "Missing", value: result.summary.missing, icon: "\u274C", color: COLORS.red },
    { label: "Readiness", value: `${result.scores.weightedScore.toFixed(1)}%`, icon: "\u{1F3AF}", color: readinessColor(result.scores.weightedScore) }
  ].map((kpi) => /* @__PURE__ */ React.createElement(Card, { key: kpi.label, className: "p-4 text-center" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, marginBottom: 4 } }, kpi.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.05 } }, kpi.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 800, color: kpi.color } }, kpi.value), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, kpi.label === "Readiness" ? result.scores.label : "")))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "p-6" }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text)" } }, "Skill Distribution"), /* @__PURE__ */ React.createElement(DonutChart, { matched: result.summary.matched, partial: result.summary.partial, missing: result.summary.missing })), /* @__PURE__ */ React.createElement(Card, { className: "p-6" }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text)" } }, "Score Breakdown"), /* @__PURE__ */ React.createElement(ScoreBar, { label: "Weighted Score", score: result.scores.weightedScore }), /* @__PURE__ */ React.createElement(ScoreBar, { label: "Core Score", score: result.scores.coreScore, color: COLORS.blue }), /* @__PURE__ */ React.createElement(ScoreBar, { label: "Secondary Score", score: result.scores.secondaryScore, color: COLORS.purple }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 8 } }, "Unweighted baseline: ", result.scores.naiveScore.toFixed(1), "%"))), result.gap.missing.length > 0 && /* @__PURE__ */ React.createElement(Card, { className: "p-6" }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text)" } }, /* @__PURE__ */ React.createElement(Zap, { size: 16, style: { display: "inline", verticalAlign: "middle", marginRight: 6 } }), "Missing Skills (", result.gap.missing.length, ")"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, result.gap.missing.map((s) => /* @__PURE__ */ React.createElement("span", { key: s.skill, style: {
    padding: "5px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background: s.category === "core" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
    color: s.category === "core" ? COLORS.red : COLORS.amber,
    border: `1px solid ${s.category === "core" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`
  } }, s.category === "core" ? "\u26A0\uFE0F" : "\u{1F4CC}", " ", s.skill)))), result.gap.matched.length > 0 && /* @__PURE__ */ React.createElement(Card, { className: "p-6" }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text)" } }, "\u2705 Matched Skills (", result.gap.matched.length, ")"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, result.gap.matched.map((s) => /* @__PURE__ */ React.createElement("span", { key: s.skill, style: { padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: "rgba(16,185,129,0.15)", color: COLORS.green, border: "1px solid rgba(16,185,129,0.3)" } }, "\u2705 ", s.skill)))), result.top5.length > 0 && /* @__PURE__ */ React.createElement(Card, { className: "p-6" }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text)" } }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 16, style: { display: "inline", verticalAlign: "middle", marginRight: 6 } }), "Best Fit Alternative Roles"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 } }, result.top5.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: r.role, style: { textAlign: "center", padding: "16px 8px", borderRadius: 12, background: "var(--card)", border: r.role === selectedRole ? "2px solid #ff6d34" : "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20 } }, ["\u{1F947}", "\u{1F948}", "\u{1F949}", "4\uFE0F\u20E3", "5\uFE0F\u20E3"][i]), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, marginTop: 4, color: "var(--text)" } }, r.role), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, r.domain), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 800, marginTop: 6, color: readinessColor(r.weightedScore) } }, r.weightedScore.toFixed(1), "%"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, r.matchedCount, "/", r.totalCount, " skills"))))), result.recommendations.length > 0 && /* @__PURE__ */ React.createElement(Card, { className: "p-6" }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text)" } }, /* @__PURE__ */ React.createElement(BookOpen, { size: 16, style: { display: "inline", verticalAlign: "middle", marginRight: 6 } }), "Learning Recommendations"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 12 } }, result.recommendations.filter((r) => r.courses.length > 0).slice(0, 8).map((rec) => /* @__PURE__ */ React.createElement("div", { key: rec.skill, style: { padding: "12px 16px", borderRadius: 10, background: "var(--input-bg)", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, rec.skill), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 12, background: rec.category === "core" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: rec.category === "core" ? COLORS.red : COLORS.amber } }, rec.category)), rec.courses.slice(0, 2).map((c) => /* @__PURE__ */ React.createElement(
    "a",
    {
      key: c.url,
      href: c.url,
      target: "_blank",
      rel: "noopener noreferrer",
      style: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: COLORS.blue, fontSize: 13, textDecoration: "none" }
    },
    /* @__PURE__ */ React.createElement(ChevronRight, { size: 12 }),
    c.title,
    " ",
    /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)" } }, "\xB7 ", c.platform)
  ))))))));
};
export default SkillGapAnalyzer;
