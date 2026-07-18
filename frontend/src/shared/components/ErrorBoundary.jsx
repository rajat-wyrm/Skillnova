import React from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ background: "var(--bg)", color: "var(--text)" }}
        >
          <div
            className="max-w-md w-full rounded-3xl border p-8 text-center"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div
              className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(220,38,38,0.12)", color: "#dc2626" }}
            >
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-lg font-semibold">Application error</h1>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
              The app hit an unexpected problem. Refresh the page and try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

