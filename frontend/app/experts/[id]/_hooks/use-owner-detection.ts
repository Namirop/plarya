"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/lib/types/auth";

/**
 * Vrai si l'utilisateur connecté est l'expert de la page (accès sans achat).
 * /experts/me n'est appelé que pour le rôle EXPERT.
 */
export function useOwnerDetection(user: AuthUser | null, expertId: string): boolean {
  const [ownExpertId, setOwnExpertId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "EXPERT") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOwnExpertId(null);
      return;
    }
    const controller = new AbortController();
    apiGet<{ id: string }>("/experts/me", { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setOwnExpertId(data.id);
      })
      .catch(() => {
        if (!controller.signal.aborted) setOwnExpertId(null);
      });
    return () => controller.abort();
  }, [user]);

  return !!user && !!ownExpertId && ownExpertId === expertId;
}
