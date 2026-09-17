"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet } from "@/lib/api";

type GateStatus = "polling" | "ready" | "failed";

/**
 * Équivalent de useCheckoutPolling pour un acheteur anonyme : "ready" dès que
 * le webhook a créé l'abonnement lié à `sessionId`. Sans `sessionId` (URL de
 * retour incomplète ou modifiée) : "failed" immédiatement.
 */
export function useEmailGatePolling({
  enabled,
  sessionId,
}: {
  enabled: boolean;
  sessionId: string | null;
}): { status: GateStatus; retry: () => void } {
  const [status, setStatus] = useState<GateStatus>("polling");
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("failed");
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setStatus("polling");

    void (async () => {
      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const data = await apiGet<{ ready: boolean }>(
            `/subscriptions/check-stripe-session?stripe_session_id=${encodeURIComponent(sessionId)}`,
            { signal: controller.signal },
          );
          if (cancelled) return;
          if (data.ready) {
            setStatus("ready");
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
  }, [enabled, sessionId, nonce]);

  return { status, retry };
}
