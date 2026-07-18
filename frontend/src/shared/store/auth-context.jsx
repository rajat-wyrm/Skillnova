/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useReducer } from "react";
import { api } from "../services/api";
import { removeItem, readJSON, STORAGE_KEYS, writeJSON } from "../services/storage";

const AuthContext = createContext(null);

const initialState = {
  status: "checking",
  user: null,
  session: null,
  pendingAuth: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "HYDRATE_AUTHENTICATED":
      return {
        ...state,
        status: "authenticated",
        user: action.payload.user,
        session: action.payload,
        pendingAuth: null,
      };
    case "HYDRATE_PENDING":
      return {
        ...state,
        status: "pending",
        pendingAuth: action.payload,
      };
    case "HYDRATE_ANONYMOUS":
      return {
        ...state,
        status: "anonymous",
        user: null,
        session: null,
        pendingAuth: null,
      };
    case "SET_PENDING":
      return {
        ...state,
        status: "pending",
        pendingAuth: action.payload,
      };
    case "SET_AUTHENTICATED":
      return {
        ...state,
        status: "authenticated",
        session: action.payload,
        user: action.payload.user,
        pendingAuth: null,
      };
    case "LOGOUT":
      return {
        ...state,
        status: "anonymous",
        user: null,
        session: null,
        pendingAuth: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const savedSession = readJSON(STORAGE_KEYS.authSession, null);
    const pendingAuth = readJSON(STORAGE_KEYS.pendingAuth, null);

    if (savedSession?.user) {
      dispatch({ type: "HYDRATE_AUTHENTICATED", payload: savedSession });
      return;
    }

    if (pendingAuth?.challengeId) {
      dispatch({ type: "HYDRATE_PENDING", payload: pendingAuth });
      return;
    }

    dispatch({ type: "HYDRATE_ANONYMOUS" });
  }, []);

  const clearPersistedAuth = () => {
    removeItem(STORAGE_KEYS.authSession);
    removeItem(STORAGE_KEYS.pendingAuth);
  };

  const login = async credentials => {
    const pendingAuth = await api.auth.login(credentials);
    writeJSON(STORAGE_KEYS.pendingAuth, pendingAuth);
    dispatch({ type: "SET_PENDING", payload: pendingAuth });
    return pendingAuth;
  };

  const authenticate = session => {
    writeJSON(STORAGE_KEYS.authSession, session);
    removeItem(STORAGE_KEYS.pendingAuth);
    dispatch({ type: "SET_AUTHENTICATED", payload: session });
    return session;
  };

  const verifyAdminOtp = async code => {
    const session = await api.auth.verifyAdminOtp({
      challengeId: state.pendingAuth?.challengeId,
      code,
    });
    return authenticate(session);
  };

  const verifyUserTwoFactor = async code => {
    const session = await api.auth.verifyUserTwoFactor({
      challengeId: state.pendingAuth?.challengeId,
      code,
    });
    return authenticate(session);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      clearPersistedAuth();
      dispatch({ type: "LOGOUT" });
    }
  };

  const cancelPendingAuth = () => {
    clearPersistedAuth();
    dispatch({ type: "LOGOUT" });
  };

  const value = {
    ...state,
    isAuthenticated: state.status === "authenticated",
    login,
    logout,
    cancelPendingAuth,
    verifyAdminOtp,
    verifyUserTwoFactor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};
