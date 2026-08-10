// ════════════════════════════════════════════════════════════
//  Axios client with auth interceptor + CSRF + refresh
// ════════════════════════════════════════════════════════════
import axios from 'axios';
import { APP_CONSTANTS } from '../shared/config/constants';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getStoredAccessToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('skillnova.auth');
    return raw ? JSON.parse(raw)?.accessToken : null;
  } catch {
    return null;
  }
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  const token = getStoredAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrf = getCookie(APP_CONSTANTS.CSRF_COOKIE);
  if (csrf && ['post', 'put', 'patch', 'delete'].includes((config.method || '').toLowerCase())) {
    config.headers[APP_CONSTANTS.CSRF_HEADER] = csrf;
  }

  return config;
});

let refreshing = null;
const REFRESH_EXCLUDED_URLS = new Set(['/auth/refresh', '/auth/login', '/auth/verify-otp']);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !REFRESH_EXCLUDED_URLS.has(original.url)
    ) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const refreshRes = await refreshing;
        refreshing = null;

        try {
          const newToken = refreshRes.data?.accessToken;
          if (newToken) {
            const raw = localStorage.getItem('skillnova.auth');
            const stored = raw ? JSON.parse(raw) : {};
            localStorage.setItem('skillnova.auth', JSON.stringify({ ...stored, accessToken: newToken }));
          }
        } catch {
          /* ignore */
        }

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
  },
);

export function getErrorMessage(err) {
  if (!err) return 'Something went wrong';
  const validationErrors = err.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return (
      validationErrors[0]?.message ||
      err.response?.data?.error ||
      'Validation failed'
    );
  }
  if (err.response?.data?.error) return err.response.data.error;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message) return err.message;
  return 'Network error — please try again';
}

export default api;
