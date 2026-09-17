import Link from "next/link";

import type { SubscriptionWithExpert } from "@/lib/types/account";
import { cn } from "@/lib/utils";

import { cardCls, formatDate } from "../_helpers";

import { CancelSubscriptionButton } from "./cancel-subscription-button";
import { ExpertAvatar } from "./expert-avatar";

// La barre de progression porte sur le cycle en cours (30 jours avant
// `expiresAt`), pas sur l'ancienneté de l'abonnement.
const CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function ActiveSubscriptionCard({
  sub,
  onCancel,
}: {
  sub: SubscriptionWithExpert;
  onCancel: (id: string) => Promise<void>;
}) {
  const end = new Date(sub.expiresAt).getTime();
  // Date.now() au rendu : acceptable pour une barre purement indicative.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const remainingMs = Math.max(0, end - now);
  const remainingPct = Math.min(100, (remainingMs / CYCLE_MS) * 100);
  const daysLeft = Math.max(0, Math.ceil(remainingMs / ONE_DAY_MS));

  // Doré au-delà de 7 jours, ambre de 4 à 7, rouge à 3 jours ou moins.
  let barColorCls = "bg-gradient-gold";
  if (daysLeft <= 3) barColorCls = "bg-destructive";
  else if (daysLeft <= 7) barColorCls = "bg-amber-500";

  return (
    <article
      className={cn(
        cardCls,
        "group relative overflow-hidden p-5 transition-all duration-300 md:p-6",
        "hover:border-foreground/20",
      )}
    >
      <div className="flex items-center gap-4">
        <ExpertAvatar expert={sub.expert} />

        <div className="min-w-0 flex-1">
          <Link
            href={`/experts/${sub.expertId}`}
            className="block truncate font-body text-h5 text-foreground transition-colors hover:underline underline-offset-4"
          >
            {sub.expert.pseudo}
          </Link>
          <p className="mt-1 font-body text-body-16 text-muted-foreground">
            {sub.cancelAtPeriodEnd ? (
              <>Abonnement résilié · accès jusqu&apos;au {formatDate(sub.expiresAt)}</>
            ) : (
              <>
                Abonnement mensuel · {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant
                {daysLeft > 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>

        <p className="hidden shrink-0 font-body text-body-16 text-muted-foreground sm:block">
          Échéance {formatDate(sub.expiresAt)}
        </p>
      </div>

      {/* Temps restant : 100 % au renouvellement, 0 % à l'échéance. */}
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface-elevated/40">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColorCls)}
          style={{ width: `${remainingPct}%` }}
        />
      </div>

      {sub.canCancel && (
        <div className="mt-5 flex justify-end">
          <CancelSubscriptionButton
            endDateLabel={formatDate(sub.expiresAt)}
            onConfirm={() => onCancel(sub.id)}
          />
        </div>
      )}
    </article>
  );
}
