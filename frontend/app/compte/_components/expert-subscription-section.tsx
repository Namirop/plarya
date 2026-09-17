"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { createExpertCheckout } from "@/lib/stripe";
import type { OwnExpertProfile } from "@/lib/types/account";
import { cn } from "@/lib/utils";

import { cardCls, formatDate } from "../_helpers";

import { AccountSectionTitle } from "./account-section-title";
import { CancelSubscriptionButton } from "./cancel-subscription-button";

type ExpertSubscription = OwnExpertProfile["subscription"];

/** Abonnement expert trimestriel : état, résiliation, réactivation. */
export function ExpertSubscriptionSection({ profile }: { profile: OwnExpertProfile }) {
  const [subscription, setSubscription] = useState<ExpertSubscription>(profile.subscription);
  const [reactivating, setReactivating] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    await apiPost("/experts/me/subscription/cancel", {});
    setSubscription((prev) => ({ ...prev, cancelAtPeriodEnd: true, canCancel: false }));
  }

  async function handleReactivate() {
    setError("");
    setReactivating(true);
    try {
      const url = await createExpertCheckout(profile.pseudo, profile.bio ?? "", profile.sports);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ouvrir le paiement. Réessaie.");
      setReactivating(false);
    }
  }

  const endDate = subscription.expiresAt ? formatDate(subscription.expiresAt) : null;

  let status: string;
  if (subscription.status === "FREE") {
    status = "Compte expert offert par la plateforme : aucun abonnement à payer.";
  } else if (!subscription.active) {
    status = "Abonnement arrêté : tes analyses ne sont plus publiées ni vendues.";
  } else if (subscription.cancelAtPeriodEnd) {
    status = endDate
      ? `Résiliation enregistrée : tu peux publier jusqu'au ${endDate}.`
      : "Résiliation enregistrée : l'abonnement s'arrêtera à la fin de la période payée.";
  } else {
    status = endDate
      ? `Abonnement actif · prochain renouvellement le ${endDate}.`
      : "Abonnement actif.";
  }

  return (
    <section className="mt-12 md:mt-16">
      <AccountSectionTitle title="Abonnement expert" />

      <div
        className={cn(
          cardCls,
          "mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6",
        )}
      >
        <div className="min-w-0">
          <p className="font-body text-h5 text-foreground">39 € / trimestre</p>
          <p className="mt-1 font-body text-body-16 text-muted-foreground">{status}</p>
        </div>

        {subscription.canCancel && endDate && (
          <CancelSubscriptionButton endDateLabel={endDate} onConfirm={handleCancel} />
        )}

        {subscription.status !== "FREE" && !subscription.active && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleReactivate}
            disabled={reactivating}
            className="w-full sm:w-auto"
          >
            {reactivating ? "Redirection…" : "Réactiver"}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 font-body text-[14px] text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
