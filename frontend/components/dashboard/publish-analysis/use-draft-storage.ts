"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Changer cette clé ferait perdre les brouillons en cours.
const DRAFT_KEY = "plarya-analysis-draft";

/**
 * Brouillon conservé en sessionStorage : il survit à un rechargement mais pas
 * à la fermeture de l'onglet. Restauré dans un effet et non à l'initialisation
 * du state, pour éviter un écart d'hydratation avec le rendu serveur.
 */
export function useDraftStorage<T extends object>(
  initialValue: T,
): {
  draft: T;
  setDraft: (value: T | ((prev: T) => T)) => void;
  clearDraft: () => void;
} {
  const [draft, setDraft] = useState<T>(initialValue);
  const hydratedRef = useRef(false);

  // Fusion avec la valeur initiale : un brouillon incomplet ne laisse aucun champ undefined.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<T>;
      // Donnée propre au navigateur, lue après hydratation.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft((prev) => ({ ...prev, ...parsed }));
    } catch {
      /* brouillon illisible : ignoré */
    }
  }, []);

  // Sauvegarde après restauration seulement, pour ne pas écraser le brouillon stocké.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Stockage plein ou bloqué : le brouillon n'est simplement pas conservé.
    }
  }, [draft]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
  }, []);

  return { draft, setDraft, clearDraft };
}
