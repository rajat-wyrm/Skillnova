import { APP_CONFIG } from "../../config/appConfig";
import { request } from "./request";
import { findAuthUser, getAuthUsers } from "./mockAuthUsers";

const wait = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));
const AUTH_SESSION_STORAGE_KEY = "skillnova-auth-session";

const demoUsers = {
  [APP_CONFIG.demoAuth.admin.email]: {
    email: APP_CONFIG.demoAuth.admin.email,
    password: APP_CONFIG.demoAuth.admin.password,
    role: "admin",
    nextStep: "admin-otp",
    profile: {
      id: "admin-1",
      name: "Admin",
      email: APP_CONFIG.demoAuth.admin.email,
      role: "admin",
      initials: "AD",
      title: "Super Admin",
      department: "Operations",
    },
  },
  [APP_CONFIG.demoAuth.intern.email]: {
    email: APP_CONFIG.demoAuth.intern.email,
    password: APP_CONFIG.demoAuth.intern.password,
    role: "intern",
    nextStep: "user-2fa",
    profile: {
      id: "intern-1",
      name: "Rahul Sharma",
      email: APP_CONFIG.demoAuth.intern.email,
      role: "intern",
      initials: "RS",
      title: "AI/ML Intern",
      department: "AI/ML",
    },
  },
};

const buildSession = profile => ({
  accessToken: `demo-access-${profile.role}-${Date.now()}`,
  refreshToken: `demo-refresh-${profile.role}-${Date.now()}`,
  expiresAt: Date.now() + 1000 * 60 * 60,
  user: profile,
});

const getUserForChallenge = challengeId => {
  const email = challengeId.replace("challenge:", "");
  return demoUsers[email];
};

const readAuthSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      role: parsed.role === "admin" ? "admin" : "intern",
      email: String(parsed.email || "").trim().toLowerCase(),
      token: parsed.token || localStorage.getItem("token") || null,
    };
  } catch {
    return null;
  }
};

const writeAuthSession = session => {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
};

const getAuthUserByEmail = email => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return getAuthUsers().find(user => user.email.toLowerCase() === normalizedEmail) || null;
};

const isMissingAuthEndpointError = error =>
  !error?.status || [404, 405, 501].includes(error.status);

/**
 * Reads the persisted auth session used by the older login flow.
 */
export const getStoredAuthSession = () => {
  return readAuthSession();
};

/**
 * Persists a lightweight auth session and mirrors the token for request-level authorization.
 */
export const persistAuthSession = ({ role, email, token = null }) => {
  const session = {
    role: role === "admin" ? "admin" : "intern",
    email: String(email || "").trim().toLowerCase(),
    token: token || null,
  };

  writeAuthSession(session);

  if (session.token) {
    localStorage.setItem("token", session.token);
  } else {
    localStorage.removeItem("token");
  }

  return session;
};

/**
 * Clears the persisted auth session and removes any mirrored token value.
 */
export const clearStoredAuthSession = () => {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  localStorage.removeItem("token");
};

/**
 * Attempts backend login first, then falls back to demo/local auth users when endpoints are unavailable.
 */
export const loginUser = async (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  try {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    return {
      role: data?.role === "admin" ? "admin" : "intern",
      email: String(data?.email || normalizedEmail).trim().toLowerCase(),
      token: data?.token || null,
    };
  } catch (error) {
    const fallbackUser = findAuthUser(normalizedEmail, password);

    if (fallbackUser) {
      return {
        role: fallbackUser.role,
        email: fallbackUser.email,
        token: null,
        usingFallback: true,
      };
    }

    throw error;
  }
};

/**
 * Requests an admin OTP from the backend, or simulates readiness in demo mode when the endpoint is missing.
 */
export const sendAdminOtp = async email => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  try {
    return await request("/auth/admin/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail }),
    });
  } catch (error) {
    const fallbackUser = getAuthUserByEmail(normalizedEmail);

    if (isMissingAuthEndpointError(error) && fallbackUser?.role === "admin") {
      return { message: "Demo OTP ready" };
    }

    throw error;
  }
};

/**
 * Verifies an admin OTP and provides a demo token fallback when the real endpoint is not available.
 */
export const verifyAdminOtp = async (email, otp) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  try {
    return await request("/auth/admin/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, otp }),
    });
  } catch (error) {
    const fallbackUser = getAuthUserByEmail(normalizedEmail);

    if (isMissingAuthEndpointError(error) && fallbackUser?.role === "admin") {
      if (otp === APP_CONFIG.demoAuth.admin.verificationCode) {
        return { token: `demo-admin-token-${normalizedEmail}` };
      }

      throw new Error(`Invalid OTP code. Use ${APP_CONFIG.demoAuth.admin.verificationCode} for demo.`);
    }

    throw error;
  }
};

/**
 * Verifies a user 2FA code and falls back to the demo authenticator code when needed.
 */
export const verifyUserTwoFactor = async (email, code) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  try {
    return await request("/auth/user/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail, code }),
    });
  } catch (error) {
    const fallbackUser = getAuthUserByEmail(normalizedEmail);

    if (isMissingAuthEndpointError(error) && fallbackUser?.role !== "admin") {
      if (code === APP_CONFIG.demoAuth.intern.verificationCode) {
        return { token: `demo-user-token-${normalizedEmail}` };
      }

      throw new Error(`Invalid authenticator code. Use ${APP_CONFIG.demoAuth.intern.verificationCode} for demo.`);
    }

    throw error;
  }
};

export const createMockAuthApi = () => ({
  async login({ email, password }) {
    await wait();

    const account = demoUsers[email.trim().toLowerCase()];

    if (!account || account.password !== password) {
      throw new Error("Incorrect email or password. Please try again.");
    }

    return {
      challengeId: `challenge:${account.email}`,
      nextStep: account.nextStep,
      tempUser: {
        email: account.profile.email,
        role: account.profile.role,
        name: account.profile.name,
      },
    };
  },

  async verifyAdminOtp({ challengeId, code }) {
    await wait();
    const account = getUserForChallenge(challengeId);

    if (!account || account.role !== "admin" || code !== APP_CONFIG.demoAuth.admin.verificationCode) {
      throw new Error("Invalid OTP code. Use 123456 for demo.");
    }

    return buildSession(account.profile);
  },

  async verifyUserTwoFactor({ challengeId, code }) {
    await wait();
    const account = getUserForChallenge(challengeId);

    if (!account || account.role !== "intern" || code !== APP_CONFIG.demoAuth.intern.verificationCode) {
      throw new Error("Invalid code. Use 654321 for demo.");
    }

    return buildSession(account.profile);
  },

  async logout() {
    await wait(150);
    return { success: true };
  },
});
