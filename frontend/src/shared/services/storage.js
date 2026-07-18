export const STORAGE_KEYS = {
  authSession: "skillnova.auth.session",
  pendingAuth: "skillnova.auth.pending",
  mockDatabase: "skillnova.mock.db",
};

const isBrowser = typeof window !== "undefined";

export const readJSON = (key, fallback = null) => {
  if (!isBrowser) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeItem = key => {
  if (!isBrowser) return;
  window.localStorage.removeItem(key);
};

