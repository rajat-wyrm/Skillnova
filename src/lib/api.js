// ════════════════════════════════════════════════════════════
//  Axios client with auth interceptor + CSRF + refresh
// ════════════════════════════════════════════════════════════
import axios from "axios";
import { APP_CONSTANTS } from "../shared/config/constants";

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: APP_CONSTANTS.API_TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// ── Helpers ──────────────────────────────────────────────
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^|;)\\s*" + name + "=([^;]+)"),
  );
  return match ? decodeURIComponent(match[2]) : null;
};

const getStoredAccessToken = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.accessToken ?? null : null;
  } catch {
    return null;
  }
};

const persistRefreshedAuth = ({ user, accessToken }) => {
  if (typeof localStorage === 'undefined' || !accessToken) return;
  try {
    const current = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}');
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        ...current,
        user: user ?? current.user,
        accessToken,
      })
    );
  } catch {
    /* ignore */
  }
};

// ── Request interceptor — CSRF + auth header echo ────────
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrf = getCookie('sn_csrf');
  const csrf = getCookie(APP_CONSTANTS.CSRF_COOKIE);
  if (csrf && ["post", "put", "patch", "delete"].includes(config.method)) {
    config.headers[APP_CONSTANTS.CSRF_HEADER] = csrf;
  }
  return config;
});

// ── Response interceptor — auto refresh on 401 ───────────
let refreshing = null;
const AUTH_REFRESH_EXCLUDED = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      !original._retry &&
      original.url !== "/auth/refresh" &&
      original.url !== "/auth/login"
    ) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        await refreshing;
        refreshing = null;
        return api(original);
      } catch (refreshErr) {
        refreshing = null;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("skillnova:logout"));
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

// ── Error normalisation ──────────────────────────────────
export function getErrorMessage(err) {
  if (!err) return "Something went wrong";
  const validationErrors = err.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return (
      validationErrors[0]?.message ||
      err.response?.data?.error ||
      "Validation failed"
    );
  }
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message) return err.message;
  return "Network error — please try again";
}

export default api;
