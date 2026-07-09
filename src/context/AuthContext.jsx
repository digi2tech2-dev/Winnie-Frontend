import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, logoutLocalOnly, register as registerRequest } from "../api/auth";
import { normalizeApiError } from "../api/errors";
import { getCurrentUser } from "../api/me";
import { getDefaultRouteForRole, isActiveUser, normalizeUser } from "../utils/authRoles";

const AuthContext = createContext(null);

export const AUTH_TOKEN_KEY = "winnie-auth-token";
export const AUTH_USER_CACHE_KEY = "winnie-auth-user";
export const LEGACY_SESSION_KEY = "winnie-session";

const ADMIN_TOOLS_UNLOCKED_KEY = "winnie-admin-tools-unlocked";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Auth state still works in memory when localStorage is unavailable.
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage restrictions.
  }
}

function clearSessionStorageKey(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage restrictions.
  }
}

function readStoredToken() {
  return readStorage(AUTH_TOKEN_KEY);
}

function readCachedUser() {
  const raw = readStorage(AUTH_USER_CACHE_KEY);
  if (!raw) return null;

  try {
    return normalizeUser(JSON.parse(raw));
  } catch {
    removeStorage(AUTH_USER_CACHE_KEY);
    return null;
  }
}

function persistToken(token) {
  if (token) {
    writeStorage(AUTH_TOKEN_KEY, token);
  } else {
    removeStorage(AUTH_TOKEN_KEY);
  }
}

function persistUser(user) {
  if (user) {
    writeStorage(AUTH_USER_CACHE_KEY, JSON.stringify(user));
  } else {
    removeStorage(AUTH_USER_CACHE_KEY);
  }
}

function clearStoredAuth() {
  removeStorage(AUTH_TOKEN_KEY);
  removeStorage(AUTH_USER_CACHE_KEY);
  removeStorage(LEGACY_SESSION_KEY);
  clearSessionStorageKey(ADMIN_TOOLS_UNLOCKED_KEY);
}

function getInactiveMessage(user) {
  const status = String(user?.status || "").toUpperCase();
  if (status === "PENDING") {
    return "Your account is awaiting admin approval. Please check back later.";
  }
  if (status === "REJECTED") {
    return "Your account was rejected by an administrator. Please contact support.";
  }
  return "Your account is inactive. Please contact support.";
}

function mapAuthFailure(error, fallbackMessage) {
  const normalized = normalizeApiError(error, fallbackMessage);
  return {
    ok: false,
    code: normalized.code,
    status: normalized.status,
    message: normalized.userMessage,
    fieldErrors: normalized.fieldErrors,
    details: normalized.details,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(readCachedUser);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const persistAuth = useCallback((nextToken, nextUser) => {
    const safeUser = normalizeUser(nextUser);
    persistToken(nextToken);
    persistUser(safeUser);
    removeStorage(LEGACY_SESSION_KEY);
    setToken(nextToken || null);
    setUser(safeUser);
  }, []);

  const clearAuth = useCallback(() => {
    logoutLocalOnly();
    clearStoredAuth();
    setToken(null);
    setUser(null);
    setAuthError("");
  }, []);

  const refreshCurrentUser = useCallback(async (overrideToken) => {
    const activeToken = overrideToken || readStoredToken();
    if (!activeToken) {
      clearAuth();
      return { ok: false, message: "No active session." };
    }

    try {
      const currentUser = normalizeUser(await getCurrentUser(activeToken));
      if (!currentUser || !isActiveUser(currentUser)) {
        clearAuth();
        const message = getInactiveMessage(currentUser);
        setAuthError(message);
        return { ok: false, message };
      }

      persistAuth(activeToken, currentUser);
      setAuthError("");
      return { ok: true, user: currentUser };
    } catch (error) {
      const failure = mapAuthFailure(error, "Unable to refresh your session.");
      clearAuth();
      setAuthError(failure.message);
      return failure;
    }
  }, [clearAuth, persistAuth]);

  useEffect(() => {
    let cancelled = false;
    removeStorage(LEGACY_SESSION_KEY);

    const bootSession = async () => {
      const storedToken = readStoredToken();
      if (!storedToken) {
        if (!cancelled) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const currentUser = normalizeUser(await getCurrentUser(storedToken));
        if (!currentUser || !isActiveUser(currentUser)) {
          throw new Error(getInactiveMessage(currentUser));
        }
        if (!cancelled) {
          persistAuth(storedToken, currentUser);
          setAuthError("");
        }
      } catch (error) {
        const failure = mapAuthFailure(error, "Your session has expired. Please log in again.");
        if (!cancelled) {
          clearStoredAuth();
          setToken(null);
          setUser(null);
          setAuthError(failure.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    bootSession();

    return () => {
      cancelled = true;
    };
  }, [persistAuth]);

  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    setAuthError("");
    clearStoredAuth();
    setToken(null);
    setUser(null);

    try {
      const result = await loginRequest({ email, password });

      if (result.requires2FA) {
        const message = "Two-factor verification is required. This frontend does not include the 2FA verification screen yet.";
        setAuthError(message);
        return {
          ok: false,
          requires2FA: true,
          message,
          challenge: {
            tempToken: result.tempToken,
            requestId: result.requestId,
            maskedEmail: result.maskedEmail,
            expiresIn: result.expiresIn,
          },
        };
      }

      const nextUser = normalizeUser(result.user);
      if (!result.token || !nextUser) {
        const message = "Login did not return an active session. Please try again.";
        setAuthError(message);
        return { ok: false, message };
      }

      if (!isActiveUser(nextUser)) {
        const message = getInactiveMessage(nextUser);
        setAuthError(message);
        return { ok: false, message, user: nextUser };
      }

      persistAuth(result.token, nextUser);
      setAuthError("");

      return {
        ok: true,
        token: result.token,
        user: nextUser,
        message: result.message || "Logged in successfully.",
        redirectTo: getDefaultRouteForRole(nextUser.role),
      };
    } catch (error) {
      const failure = mapAuthFailure(error, "Login failed. Please try again.");
      setAuthError(failure.message);
      return failure;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuth]);

  const register = useCallback(async (payload) => {
    setIsLoading(true);
    setAuthError("");

    try {
      const result = await registerRequest(payload);
      const nextUser = normalizeUser(result.user);

      if (result.token && nextUser && isActiveUser(nextUser)) {
        persistAuth(result.token, nextUser);
        return {
          ok: true,
          authenticated: true,
          token: result.token,
          user: nextUser,
          message: result.message || "Registration completed.",
          redirectTo: getDefaultRouteForRole(nextUser.role),
        };
      }

      return {
        ok: true,
        authenticated: false,
        user: nextUser,
        message: result.message || "Registration successful. Please verify your email to activate your account.",
      };
    } catch (error) {
      const failure = mapAuthFailure(error, "Registration failed. Please try again.");
      setAuthError(failure.message);
      return failure;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuth]);

  const loginWithGoogle = useCallback(() => ({
    ok: false,
    message: "Google login is not configured in this frontend flow yet.",
  }), []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      authError,
      clearAuth,
      isAuthenticated: Boolean(token && user),
      isLoading,
      loading: isLoading,
      login,
      loginWithGoogle,
      logout,
      refreshCurrentUser,
      register,
      token,
      user,
    }),
    [authError, clearAuth, isLoading, login, loginWithGoogle, logout, refreshCurrentUser, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
