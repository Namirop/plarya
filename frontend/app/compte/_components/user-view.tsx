"use client";

import { useState } from "react";

import { ConfidentialitySection } from "@/components/account/confidentiality-section";
import { useUser } from "@/hooks/use-user";
import { apiPost } from "@/lib/api";
import type { SubscriptionWithExpert } from "@/lib/types/account";
import { cn } from "@/lib/utils";

import { cardCls, DIVIDER_NEUTRAL_GRADIENT, isActiveSubscription } from "../_helpers";

import { AccountSectionTitle } from "./account-section-title";
import { ActiveSubscriptionCard } from "./active-subscription-card";
import { EmptyState } from "./empty-state";
import { HistoryRow } from "./history-row";
import { IdentityHeader } from "./identity-header";

export function UserView({
  subscriptions: initialSubscriptions,
}: {
  subscriptions: SubscriptionWithExpert[];
}) {
  const { user } = useUser();
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

  async function handleCancel(id: string) {
    await apiPost(`/subscriptions/${id}/cancel`, {});
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, cancelAtPeriodEnd: true, canCancel: false } : s)),
    );
  }

  const monthlyActive = subscriptions.filter(
    (s) => s.type === "MONTHLY" && isActiveSubscription(s),
  );
  const monthlyExpired = subscriptions.filter(
    (s) => s.type === "MONTHLY" && !isActiveSubscription(s),
  );
  const dayPasses = subscriptions.filter((s) => s.type === "DAY_PASS");

  // Historique : pass jour et abonnements terminés, du plus récent au plus ancien.
  const history = [...dayPasses, ...monthlyExpired].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Sports distincts couverts par les experts suivis.
  const uniqueSports = new Set<string>();
  subscriptions.forEach((s) => s.expert.sports.forEach((sp) => uniqueSports.add(sp)));

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8 md:px-6 md:py-14">
      <IdentityHeader
        email={user?.email ?? ""}
        activeCount={monthlyActive.length}
        dayPassCount={dayPasses.length}
        sportsCount={uniqueSports.size}
      />

      {/* ─── Abonnements actifs ─── */}
      <section className="mt-12 md:mt-16">
        <AccountSectionTitle title="Abonnements actifs" />

        {monthlyActive.length === 0 ? (
          <EmptyState
            message="Aucun abonnement actif"
            hint="Trouve un expert qui te correspond et abonne-toi pour suivre toutes ses analyses sur la durée."
            cta={{ label: "Découvrir les experts", href: "/" }}
          />
        ) : (
          <div className="mt-6 space-y-4">
            {monthlyActive.map((sub) => (
              <ActiveSubscriptionCard key={sub.id} sub={sub} onCancel={handleCancel} />
            ))}
          </div>
        )}

        {/* Abonnement sans abonnement Stripe associé : résiliation par email. */}
        {monthlyActive.some((s) => !s.canCancel && !s.cancelAtPeriodEnd) && (
          <p className="mt-6 font-body text-body-16 text-muted-foreground">
            Pour résilier un abonnement sans bouton de résiliation, écris-nous à{" "}
            <a
              href="mailto:contact@plarya.com"
              className="text-foreground transition-colors hover:underline underline-offset-4"
            >
              contact@plarya.com
            </a>
            .
          </p>
        )}
      </section>

      {/* ─── Historique ─── */}
      <section className="mt-12 md:mt-16">
        <AccountSectionTitle title="Historique" />

        {history.length === 0 ? (
          <EmptyState
            message="Aucun achat pour le moment"
            hint="Tes accès journée et abonnements terminés s'afficheront ici."
            cta={{ label: "Voir les experts", href: "/" }}
          />
        ) : (
          <div className={cn(cardCls, "mt-6 overflow-hidden")}>
            {history.map((sub, i) => (
              <div key={sub.id}>
                <HistoryRow sub={sub} />
                {i < history.length - 1 && (
                  <div
                    aria-hidden
                    className="mx-5 h-px opacity-30 md:mx-6"
                    style={{ backgroundImage: DIVIDER_NEUTRAL_GRADIENT }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfidentialitySection />
    </div>
  );
}
