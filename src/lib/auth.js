// ════════════════════════════════════════════════════════════
//  Auth Store — Zustand
// ════════════════════════════════════════════════════════════
import { create } from 'zustand';
import api, { getErrorMessage } from './api';
import { APP_CONSTANTS } from '../shared/config/constants';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(APP_CONSTANTS.AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persist = (state) => {
  try {
    if (state.user && state.accessToken) {
      localStorage.setItem(
        APP_CONSTANTS.AUTH_STORAGE_KEY,
        JSON.stringify({ user: state.user, accessToken: state.accessToken })
      );
    } else {
      localStorage.removeItem(APP_CONSTANTS.AUTH_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  permissions: [],
  step: 'login', // 'login' | 'otp'
  challengeToken: null,
  devCode: null,
  loading: false,
  error: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    // Always try /auth/me first — validates httpOnly cookies (Google OAuth uses these)
    try {
      const { data } = await api.get('/auth/me');
      set({
        user: data.user,
        permissions: data.permissions ?? derivePermissions(data.user.role),
        step: 'authenticated',
        hydrated: true,
      });
      persist(get());
      return;
    } catch {
      // No valid cookie — fall back to localStorage
    }
    const persisted = loadFromStorage();
    if (persisted?.user && persisted?.accessToken) {
      set({ user: persisted.user, accessToken: persisted.accessToken, hydrated: true });
      persist(get());
    } else {
      set({ hydrated: true });
    }
  },

  login: async ({ email, password, rememberMe = true }) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password, rememberMe });
      if (data.step === 'otp_required') {
        set({
          step: 'otp',
          challengeToken: data.challengeToken,
          devCode: data.devCode ?? null,
          contactHint: data.contactHint,
          loading: false,
        });
        return { step: 'otp' };
      }
      set({
        user: data.user,
        accessToken: data.accessToken,
        permissions: derivePermissions(data.user.role),
        step: 'authenticated',
        loading: false,
      });
      persist(get());
      return { step: 'authenticated' };
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
      throw err;
    }
  },

  verifyOtp: async ({ code, useTotp = false }) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/verify-otp', {
        challengeToken: get().challengeToken,
        code,
        useTotp,
      });
      set({
        user: data.user,
        accessToken: data.accessToken,
        permissions: derivePermissions(data.user.role),
        step: 'authenticated',
        loading: false,
      });
      persist(get());
      return data;
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err) });
      throw err;
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    set({ user: null, accessToken: null, permissions: [], step: 'login', challengeToken: null });
    persist(get());
  },

  reset: () => {
    set({ user: null, accessToken: null, permissions: [], step: 'login', challengeToken: null, error: null });
    persist(get());
  },

  goBackToLogin: () => set({ step: 'login', error: null, challengeToken: null, devCode: null }),

  hasPermission: (perm) => get().permissions.includes(perm),
  hasRole: (...roles) => roles.includes(get().user?.role),

  isAdmin: () => ['SUPER_ADMIN', 'ADMIN'].includes(get().user?.role),
  isIntern: () => get().user?.role === 'INTERN',
  isMentor: () => get().user?.role === 'MENTOR',
}));

// Role → permission list (mirrors backend PERMISSIONS map)
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'users:read','users:create','users:update','users:delete','users:role:change',
    'reports:read','reports:create','reports:update','reports:review','reports:delete',
    'kb:read','kb:create','kb:update','kb:verify','kb:delete',
    'announcements:read','announcements:create','announcements:update','announcements:delete',
    'attendance:read','attendance:mark','attendance:self',
    'projects:read','projects:create','projects:update','projects:delete',
    'tasks:read','tasks:create','tasks:update','tasks:delete',
    'qa:read','qa:create','qa:update','qa:delete',
    'ai:use',
    'settings:read','settings:update','audit:read',
  ],
  ADMIN: [
    'users:read','users:create','users:update',
    'reports:read','reports:create','reports:update','reports:review','reports:delete',
    'kb:read','kb:create','kb:update','kb:verify','kb:delete',
    'announcements:read','announcements:create','announcements:update','announcements:delete',
    'attendance:read','attendance:mark','attendance:self',
    'projects:read','projects:create','projects:update','projects:delete',
    'tasks:read','tasks:create','tasks:update','tasks:delete',
    'qa:read','qa:create','qa:update','qa:delete',
    'ai:use','settings:read',
  ],
  MENTOR: [
    'users:read',
    'reports:read','reports:create','reports:update','reports:review',
    'kb:read','kb:create','kb:update',
    'announcements:read',
    'attendance:read','attendance:mark','attendance:self',
    'projects:read','projects:create','projects:update',
    'tasks:read','tasks:create','tasks:update','tasks:delete',
    'qa:read','qa:create','qa:update',
    'ai:use',
  ],
  INTERN: [
    'reports:read','reports:create','reports:update',
    'kb:read',
    'announcements:read',
    'attendance:self',
    'projects:read',
    'tasks:read','tasks:update',
    'qa:read','qa:create','qa:update',
    'ai:use',
  ],
};

function derivePermissions(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}
