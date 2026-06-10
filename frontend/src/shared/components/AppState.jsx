import { AlertTriangle, FileSearch, LoaderCircle } from "lucide-react";

export const FullPageLoader = ({ title = "Loading app", subtitle = "Preparing the workspace..." }) => (
  <div
    className="min-h-screen flex items-center justify-center px-6"
    style={{ background: "var(--bg)", color: "var(--text)" }}
  >
    <div className="text-center max-w-sm">
      <div
        className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(255,109,52,0.12)", color: "#ff6d34" }}
      >
        <LoaderCircle size={24} className="animate-spin" />
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{subtitle}</p>
    </div>
  </div>
);

export const EmptyState = ({ title, description, action }) => (
  <div
    className="rounded-2xl border p-10 text-center"
    style={{ background: "var(--card)", borderColor: "var(--border)" }}
  >
    <div
      className="mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{ background: "rgba(148,163,184,0.14)", color: "var(--muted)" }}
    >
      <FileSearch size={22} />
    </div>
    <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
    <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{description}</p>
    {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
  </div>
);

export const ErrorState = ({
  title = "Something went wrong",
  description = "Please try again.",
  action,
}) => (
  <div
    className="rounded-2xl border p-10 text-center"
    style={{ background: "var(--card)", borderColor: "var(--border)" }}
  >
    <div
      className="mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{ background: "rgba(220,38,38,0.12)", color: "#dc2626" }}
    >
      <AlertTriangle size={22} />
    </div>
    <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
    <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{description}</p>
    {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
  </div>
);

