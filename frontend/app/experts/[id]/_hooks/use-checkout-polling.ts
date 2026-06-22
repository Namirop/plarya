"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiPost } from "@/lib/api";

type PollStatus = "polling" | "success" | "failed" | null;

/**
 * Polling de /subscriptions/check après un retour Stripe pour un user
 * LOGGÉ. Démarre quand `enabled` passe à true. Boucle 15 × 2s = 30s
 * (couvre le pire cas dev : `stripe listen` qui peut mettre 10-20s à
 * relayer le webhook ; en prod le webhook est quasi-instantané).
 *
 * - `onSuccess` est appelé dès que `/subscriptions/check` renvoie
 *   `hasAccess` (le container y pose `subscriptionAccess`).
 * - Après 30s sans succès → status "failed".
 * - `retry()` relance la boucle (bouton "Réessayer" de la modale).
 *
 * AbortController : annule la requête en vol + stoppe la boucle au
 * unmount ou à un retry.
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
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled || !expertId) return;
    let cancelled = false;
    const controller = new AbortController();
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
          /* ignore — on retentera */
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
