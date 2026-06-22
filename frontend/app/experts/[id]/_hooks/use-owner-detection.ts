"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/lib/types/auth";

/**
 * Détecte si l'utilisateur connecté est le PROPRIÉTAIRE de la page
 * profil affichée (bypass paywall). Fetch /experts/me uniquement si
 * l'user est un EXPERT (endpoint gated pour USER/ADMIN → on skip).
 *
 * AbortController : annule le fetch en vol si l'user change ou si le
 * composant unmount (navigation rapide entre profils).
 */
export function useOwnerDetection(user: AuthUser | null, expertId: string): boolean {
  const [ownExpertId, setOwnExpertId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "EXPERT") {
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
