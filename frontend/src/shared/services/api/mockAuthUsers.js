import { APP_CONFIG } from "../../config/appConfig";

const AUTH_USERS_STORAGE_KEY = "skillnova-auth-users";

const DEFAULT_AUTH_USERS = [
  {
    name: "SkillNova Admin",
    email: APP_CONFIG.demoAuth.admin.email,
    password: APP_CONFIG.demoAuth.admin.password,
    role: "admin",
  },
  {
    name: "SkillNova User",
    email: APP_CONFIG.demoAuth.intern.email,
    password: APP_CONFIG.demoAuth.intern.password,
    role: "intern",
  },
];

const readCustomUsers = () => {
  try {
    const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCustomUsers = users => {
  localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
};

/**
 * Returns the built-in demo users plus any locally created signup users.
 */
export const getAuthUsers = () => [...DEFAULT_AUTH_USERS, ...readCustomUsers()];

/**
 * Finds a matching demo or locally persisted auth user for fallback login flows.
 */
export const findAuthUser = (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  return (
    getAuthUsers().find(
      user =>
        user.email.toLowerCase() === normalizedEmail && user.password === password
    ) || null
  );
};

/**
 * Stores a new local fallback auth user so signup can work even without a live backend.
 */
export const createAuthUser = ({ name, email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const customUsers = readCustomUsers();

  const alreadyExists = getAuthUsers().some(
    user => user.email.toLowerCase() === normalizedEmail
  );

  if (alreadyExists) {
    throw new Error("An account with this email already exists.");
  }

  const nextUser = {
    name: String(name || "").trim(),
    email: normalizedEmail,
    password,
    role: "intern",
  };

  writeCustomUsers([...customUsers, nextUser]);
  return nextUser;
};

