import { formatOdds, primaryAffiliate } from "@/lib/analysis-format";
import type { BookmakerOddsData } from "@/lib/experts";
import { cn } from "@/lib/utils";

import { BookmakerLogo } from "../bookmaker-logo";
import { SectionLabel } from "./primitives";

/**
 * MEILLEURES COTES — bookmakers en boutons sobres.
 *  - mobile : empilés verticalement (pleine largeur).
 *  - desktop : alignés horizontalement, largeurs égales (flex-1).
 */
export function BookmakersSection({ bookmakers }: { bookmakers: BookmakerOddsData[] }) {
  return (
    <div>
      <SectionLabel>Meilleures cotes</SectionLabel>
      <div className="flex flex-col gap-3 md:flex-row">
        {bookmakers.map((bo) => (
          <BookmakerButton key={bo.id} bo={bo} />
        ))}
      </div>
    </div>
  );
}

function BookmakerButton({ bo }: { bo: BookmakerOddsData }) {
  const link = primaryAffiliate(bo);
  const offer = link?.label || null;

  const identity = (
    <span className="flex min-w-0 items-center gap-2.5">
      <BookmakerLogo name={bo.bookmaker.name} logoUrl={bo.bookmaker.logoUrl} />
      <span className="truncate font-body text-sm text-foreground">{bo.bookmaker.name}</span>
    </span>
  );

  const baseClass =
    "flex items-center justify-between gap-3 rounded-[4px] border border-white/10 px-4 py-2.5 md:flex-1";

  if (!link) {
    return (
      <div className={baseClass}>
        {identity}
        <span className="shrink-0 font-body text-sm tabular-nums text-muted-foreground">
          {formatOdds(bo.odds)}
        </span>
      </div>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={offer ?? undefined}
      aria-label={`Accéder à ${bo.bookmaker.name}${offer ? ` (${offer})` : ""}`}
      className={cn(
        baseClass,
        "group transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.04]",
      )}
    >
      {identity}
      <span className="flex shrink-0 items-center gap-2.5">
        <span className="font-body text-sm tabular-nums text-muted-foreground">
          {formatOdds(bo.odds)}
        </span>
        <span
          aria-hidden
          className="font-display text-base text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
        >
          →
        </span>
      </span>
    </a>
  );
}
