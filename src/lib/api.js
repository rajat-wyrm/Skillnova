// ════════════════════════════════════════════════════════════
//  Axios client with auth interceptor + CSRF + refresh
// ════════════════════════════════════════════════════════════
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Helpers ──────────────────────────────────────────────
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

// ── Request interceptor — CSRF + auth header echo ────────
api.interceptors.request.use((config) => {
  const csrf = getCookie('sn_csrf');
  if (csrf && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});

// ── Response interceptor — auto refresh on 401 ───────────
let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && original.url !== '/auth/refresh' && original.url !== '/auth/login') {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        await refreshing;
        refreshing = null;
        return api(original);
      } catch (refreshErr) {
        refreshing = null;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('skillnova:logout'));
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// ── Error normalisation ──────────────────────────────────
export function getErrorMessage(err) {
  if (!err) return 'Something went wrong';
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message) return err.message;
  return 'Network error — please try again';
}

export default api;
