"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Résiliation en deux temps (« Résilier » puis confirmation), pour éviter un
 * clic malheureux sur une action qui arrête le renouvellement.
 */
export function CancelSubscriptionButton({
  endDateLabel,
  onConfirm,
}: {
  endDateLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setError("");
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "La résiliation a échoué. Réessaie.");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="md" onClick={() => setConfirming(true)}>
        Résilier
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <p className="font-body text-body-16 text-muted-foreground">
        Plus de renouvellement : ton accès reste actif jusqu&apos;au {endDateLabel}.
      </p>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Garder
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={handleConfirm} disabled={loading}>
          {loading ? "Résiliation…" : "Confirmer la résiliation"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="font-body text-[14px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
