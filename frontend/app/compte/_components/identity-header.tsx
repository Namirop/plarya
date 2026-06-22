import { cn } from "@/lib/utils";

import { cardCls } from "../_helpers";

interface IdentityHeaderProps {
  email: string;
  activeCount: number;
  dayPassCount: number;
  sportsCount: number;
}

/**
 * Header de la vue USER : avatar initiale + eyebrow "MON COMPTE" +
 * email + ligne descriptive en prose (remplace les KPI vanity cards).
 */
export function IdentityHeader({ email, activeCount, dayPassCount, sportsCount }: IdentityHeaderProps) {
  // Initiale de fallback. Email vide possible si useUser pas encore
  // résolu — on rend "—" plutôt qu'une chaîne vide.
  const initial = email.charAt(0).toUpperCase() || "—";

  // Ligne descriptive adaptative : chaque item n'apparaît que s'il a une
  // valeur > 0. Fallback si tout est à 0 (user sans aucun achat).
  const summaryParts: string[] = [];
  if (activeCount > 0) {
    summaryParts.push(
      `${activeCount} abonnement${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""}`,
    );
  }
  if (dayPassCount > 0) {
    summaryParts.push(`${dayPassCount} achat${dayPassCount > 1 ? "s" : ""} au total`);
  }
  if (sportsCount > 0) {
    summaryParts.push(`${sportsCount} sport${sportsCount > 1 ? "s" : ""} suivi${sportsCount > 1 ? "s" : ""}`);
  }
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "Aucun achat pour l'instant";

  return (
    <header className={cn(cardCls, "relative overflow-hidden p-6 md:p-8")}>
      {/* Glow subtil top-left : casse la platitude du fond noir. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/[0.03] blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left md:gap-6">
        {/* Avatar initiale neutre — l'eyebrow + l'email suffisent à
            identifier la page. */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-elevated font-body text-[24px] font-bold text-foreground sm:size-16 sm:text-[28px] md:size-20 md:text-[32px]">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body text-body-16 uppercase tracking-[0.15em] text-muted-foreground">
            Mon compte
          </p>
          <p className="mt-1 truncate font-body text-[20px] font-bold text-foreground sm:text-[22px] md:text-[28px]">
            {email}
          </p>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">{summary}</p>
        </div>
      </div>
    </header>
  );
}
