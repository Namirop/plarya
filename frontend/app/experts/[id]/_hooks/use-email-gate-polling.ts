"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet } from "@/lib/api";

type GateStatus = "polling" | "ready" | "failed";

/**
 * Polling de /subscriptions/check-stripe-session pour le flow
 * non-loggé (email-gate après Stripe). Démarre quand `enabled` passe à
 * true. Renvoie "ready" dès qu'une Subscription existe pour ce
 * sessionId (= webhook traité). Boucle 15 × 2s = 30s (même rationnel
 * que useCheckoutPolling).
 *
 * Si `sessionId` est null (redirect Stripe manipulé) → "failed"
 * directement, sans poll.
 *
 * `retry()` relance (bouton "Réessayer"). AbortController au cleanup.
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
          /* ignore */
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
