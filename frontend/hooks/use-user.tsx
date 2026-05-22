"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiGet, apiPost } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: "USER" | "EXPERT" | "ADMIN";
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  requestMagicLink: (email: string) => Promise<void>;
  logout: () => void;
  /** Re-fetch user from session (e.g. after magic link redirect) */
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // setLoading(false) déplacé dans le finally interne plutôt que dans
  // l'effect (cf. ESLint react-hooks/set-state-in-effect — appeler
  // setState dans .finally d'une promise lancée par l'effet déclenche
  // un re-render en cascade). Idempotent : refreshUser remet aussi
  // loading à false, ce qui est inoffensif (déjà false en steady-state).
  const fetchUser = useCallback(async () => {
    try {
      const data = await apiGet<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: check if session cookie exists by calling /auth/me
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const requestMagicLink = useCallback(async (email: string) => {
    await apiPost<{ message: string }>("/auth/request-magic-link", { email });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost<{ message: string }>("/auth/logout", {});
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, requestMagicLink, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
