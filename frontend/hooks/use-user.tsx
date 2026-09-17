"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { AuthUser } from "@/lib/types/auth";

interface UserContextValue {
  user: AuthUser | null;
  loading: boolean;
  requestMagicLink: (email: string) => Promise<void>;
  logout: () => void;
  /** Recharge l'utilisateur depuis la session (ex. après un magic-link). */
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // setLoading dans fetchUser plutôt que dans l'effet (règle
  // react-hooks/set-state-in-effect) ; inoffensif lors d'un refreshUser.
  const fetchUser = useCallback(async () => {
    try {
      const data = await apiGet<AuthUser>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Au montage : session valide ou non (cookie httpOnly, invisible en JS).
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
      // Déconnexion locale même si l'appel échoue.
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
