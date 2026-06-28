import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { demoUsers, sha256 } from "../data/demoUsers";

const AuthContext = createContext(null);
const SESSION_KEY = "winnie-session";
const ADMIN_TOOLS_UNLOCKED_KEY = "winnie-admin-tools-unlocked";

function getStoredUser() {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = demoUsers.find((item) => item.email === normalizedEmail);
    if (!foundUser) {
      return { ok: false, message: "Invalid email or password." };
    }

    const passwordHash = await sha256(password);
    if (passwordHash !== foundUser.passwordHash) {
      return { ok: false, message: "Invalid email or password." };
    }

    const safeUser = publicUser(foundUser);
    if (safeUser.role === "admin") {
      try {
        sessionStorage.removeItem(ADMIN_TOOLS_UNLOCKED_KEY);
      } catch {
        // Session storage may be unavailable in restricted browser contexts.
      }
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    return { ok: true, user: safeUser };
  }, []);

  const loginWithGoogle = useCallback((details = {}) => {
    const googleUser = {
      id: "usr_google_customer",
      name: "Winnie Google User",
      email: "google.user@winniefun.com",
      role: "customer",
      tier: "Premium Member",
      avatar: "G",
      ...details,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(googleUser));
    setUser(googleUser);
    return { ok: true, user: googleUser };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    try {
      sessionStorage.removeItem(ADMIN_TOOLS_UNLOCKED_KEY);
    } catch {
      // Session storage may be unavailable in restricted browser contexts.
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogle,
      logout,
    }),
    [user, login, loginWithGoogle, logout],
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
