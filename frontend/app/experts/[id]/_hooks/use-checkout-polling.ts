"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiPost } from "@/lib/api";

type PollStatus = "polling" | "success" | "failed" | null;

/**
 * Après un retour de Stripe (utilisateur connecté), interroge
 * /subscriptions/check toutes les 2 s pendant 30 s, le temps que le webhook
 * crée l'abonnement (en local, `stripe listen` peut mettre 10 à 20 s).
 * `retry()` relance la boucle ; démontage et relance annulent la requête en cours.
 */
export function useCheckoutPolling({
  enabled,
  expertId,
  onSuccess,
}: {
  enabled: boolean;
  expertId: string;
  onSuccess: () => void;
}): { status: PollStatus; retry: () => void } {
  const [status, setStatus] = useState<PollStatus>(null);
  const [nonce, setNonce] = useState(0);
  // Dernière version de `onSuccess`, sans relancer la boucle quand elle change.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled || !expertId) return;
    let cancelled = false;
    const controller = new AbortController();
    // Remis à "polling" à chaque (re)démarrage de la boucle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("polling");

    void (async () => {
      const maxAttempts = 15;
      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        try {
          const data = await apiPost<{ hasAccess: boolean }>(
            "/subscriptions/check",
            { expertId },
            { signal: controller.signal },
          );
          if (cancelled) return;
          if (data.hasAccess) {
            onSuccessRef.current();
            setStatus("success");
            return;
          }
        } catch {
          if (cancelled) return;
          /* nouvel essai au tour suivant */
        }
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
      }
      if (!cancelled) setStatus("failed");
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, expertId, nonce]);

  return { status, retry };
}
