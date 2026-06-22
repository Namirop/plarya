import Link from "next/link";

import type { SubscriptionWithExpert } from "@/lib/types/account";
import { cn } from "@/lib/utils";

import { cardCls, formatDate } from "../_helpers";
import { ExpertAvatar } from "./expert-avatar";

// Durée d'un cycle de facturation mensuel (en ms). Source de vérité
// pour la barre de progression : elle reflète le CYCLE COURANT (= 30
// derniers jours avant `expiresAt`), pas la durée totale depuis le 1er
// abonnement. Sans ça, un user abonné depuis 6 mois verrait sa barre à
// 95 % alors qu'il vient de renouveler.
const CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function ActiveSubscriptionCard({ sub }: { sub: SubscriptionWithExpert }) {
  const end = new Date(sub.expiresAt).getTime();
  // Date.now() au render = impur (lint warning) mais accepté ici : la
  // barre de progression est cosmétique, une variation au re-render (ms
  // d'écart) est invisible. Pas de useEffect/state nécessaire.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const remainingMs = Math.max(0, end - now);
  const remainingPct = Math.min(100, (remainingMs / CYCLE_MS) * 100);
  const daysLeft = Math.max(0, Math.ceil(remainingMs / ONE_DAY_MS));

  // Couleur de la barre selon l'urgence : > 7j doré (nominal), 4-7j
  // amber (heads-up), ≤ 3j destructive (alerte).
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
          {/* Pseudo seul — pas d'éclair décoratif (bruit visuel sans
              signification métier, retiré pour la finition anti-IA). */}
          <Link
            href={`/experts/${sub.expertId}`}
            className="block truncate font-body text-h5 text-foreground transition-colors hover:underline underline-offset-4"
          >
            {sub.expert.pseudo}
          </Link>
          <p className="mt-1 font-body text-body-16 text-muted-foreground">
            Abonnement mensuel · {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant
            {daysLeft > 1 ? "s" : ""}
          </p>
        </div>

        <p className="hidden shrink-0 font-body text-body-16 text-muted-foreground sm:block">
          Échéance {formatDate(sub.expiresAt)}
        </p>
      </div>

      {/* Barre "temps restant" — rétrécit au fil du cycle (100 % juste
          après renouvellement, 0 % à expiration). */}
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface-elevated/40">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColorCls)}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
    </article>
  );
}
