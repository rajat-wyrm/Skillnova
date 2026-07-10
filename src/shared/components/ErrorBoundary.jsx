// ════════════════════════════════════════════════════════════
//  ErrorBoundary — React 19 error boundary
// ════════════════════════════════════════════════════════════
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  state = { error: null, info: null, retryCount: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState((s) => ({ error: null, info: null, retryCount: s.retryCount + 1 }));

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
          <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: 'rgba(220,38,38,0.15)' }}>
              <AlertTriangle size={28} style={{ color: '#dc2626' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Something went wrong</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
            <details className="mt-4 text-left">
              <summary className="text-xs cursor-pointer" style={{ color: 'var(--muted)' }}>Stack trace</summary>
              <pre className="text-xs mt-2 p-3 rounded overflow-auto max-h-48" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                {this.state.error.stack}
              </pre>
            </details>
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              Attempt {this.state.retryCount + 1} of 3
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={this.reset} disabled={this.state.retryCount >= 3}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ background: '#ff6d34' }}>
                <RefreshCw size={14} /> Retry
              </button>
              <button onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
