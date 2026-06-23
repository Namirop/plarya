"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Clé conservée à l'identique de l'ancienne implémentation pour ne pas
// invalider les brouillons déjà en cours dans sessionStorage.
const DRAFT_KEY = "plarya-analysis-draft";

/**
 * Hook de persistence du brouillon d'analyse dans sessionStorage.
 *
 * Restauration en `useEffect` (pas dans l'initializer de useState) : le
 * composant est SSR-rendu par Next, et lire sessionStorage à l'init
 * provoquerait un mismatch d'hydratation (serveur = valeur initiale,
 * client = valeur stockée). On initialise donc avec `initialValue` sur
 * les deux, puis on restaure côté client après le mount.
 *
 * sessionStorage (et pas localStorage) : le draft survit à un reload
 * accidentel mais disparaît à la fermeture de l'onglet (pas de
 * brouillons abandonnés persistés indéfiniment).
 */
export function useDraftStorage<T extends object>(initialValue: T): {
  draft: T;
  setDraft: (value: T | ((prev: T) => T)) => void;
  clearDraft: () => void;
} {
  const [draft, setDraft] = useState<T>(initialValue);
  const hydratedRef = useRef(false);

  // Restaure le draft stocké une seule fois, après le mount. Merge avec
  // initialValue → un draft partiel / d'un ancien format ne laisse pas
  // de champs `undefined` (robustesse, comme l'ancien code qui ne posait
  // que les champs présents).
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<T>;
      // Restauration browser-only après hydratation (cf. en-tête) : non
      // dérivable en render sans mismatch SSR. Cas légitime, identique à
      // cookie-banner.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft((prev) => ({ ...prev, ...parsed }));
    } catch {
      /* draft corrompu → on ignore */
    }
  }, []);

  // Persiste à chaque mutation, mais seulement après l'hydratation (sinon
  // on écraserait le draft stocké avec la valeur initiale au 1er render).
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // sessionStorage plein ou bloqué → on tolère silencieusement,
      // le draft n'est pas critique.
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
