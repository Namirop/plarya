import { Star } from "@phosphor-icons/react";

export function MatchBlock({
  teams,
  featured,
}: {
  teams: { home: string; away: string | null };
  featured: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 font-display text-[26px] uppercase leading-[1.05] text-foreground md:text-3xl">
      <span>{teams.home}</span>
      {teams.away && (
        <>
          <span className="text-base italic normal-case text-muted-foreground">vs</span>
          <span>{teams.away}</span>
        </>
      )}
      {/* Étoile "analyse du jour" — statut métier, juste à droite du
          match. Seule autre occurrence dorée tolérée avec la cote. */}
      {featured && (
        <Star
          weight="fill"
          aria-label="Analyse du jour"
          className="size-5 self-center text-accent md:size-6"
        />
      )}
    </div>
  );
}
