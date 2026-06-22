import { cn } from "@/lib/utils";

import { cardCls } from "../_helpers";

interface ExpertIdentityHeaderProps {
  pseudo: string;
  email: string;
  sportsCount: number;
  hasDailyNote: boolean;
}

/**
 * Header de la vue EXPERT : avatar initiale (du pseudo, doré pour
 * signaler le statut) + eyebrow "MON COMPTE EXPERT" + pseudo + email +
 * ligne descriptive.
 */
export function ExpertIdentityHeader({
  pseudo,
  email,
  sportsCount,
  hasDailyNote,
}: ExpertIdentityHeaderProps) {
  const initial = pseudo.charAt(0).toUpperCase() || "—";

  const summaryParts: string[] = ["Compte expert"];
  if (sportsCount > 0) {
    summaryParts.push(
      `${sportsCount} sport${sportsCount > 1 ? "s" : ""} couvert${sportsCount > 1 ? "s" : ""}`,
    );
  }
  summaryParts.push(hasDailyNote ? "Note quotidienne active" : "Aucune note du jour");
  const summary = summaryParts.join(" · ");

  return (
    <header className={cn(cardCls, "relative overflow-hidden p-6 md:p-8")}>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/[0.03] blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left md:gap-6">
        {/* Avatar initiale doré — exception sémantique pour signaler le
            statut Expert (l'eyebrow MON COMPTE EXPERT remplit le rôle du
            badge "EXPERT" textuel). */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-body text-[24px] font-bold text-accent sm:size-16 sm:text-[28px] md:size-20 md:text-[32px]">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body text-body-16 uppercase tracking-[0.15em] text-muted-foreground">
            Mon compte expert
          </p>
          <p className="mt-1 truncate font-body text-[20px] font-bold text-foreground sm:text-[22px] md:text-[28px]">
            {pseudo}
          </p>
          <p className="mt-2 truncate font-body text-body-16 text-muted-foreground">{email}</p>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">{summary}</p>
        </div>
      </div>
    </header>
  );
}
