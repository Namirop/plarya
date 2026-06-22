import { formatOdds } from "@/lib/analysis-format";

import { LockedBlock, MiniLabel } from "./primitives";

/**
 * LE PICK / LA COTE — cote en doré (unique accent de valeur).
 *  - `stacked` (talon desktop) : empilé, agrandi, occupe la colonne.
 *  - défaut (mobile) : deux colonnes (labels alignés, valeurs en gros).
 */
export function PickCote({
  hasAccess,
  pick,
  odds,
  stacked = false,
}: {
  hasAccess: boolean;
  pick: string | null;
  odds: number;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <div className="flex flex-col gap-11">
        <div>
          <MiniLabel>Le pick</MiniLabel>
          {hasAccess ? (
            <p className="mt-2.5 font-display text-4xl font-normal leading-[1.1] text-foreground">
              {pick || "—"}
            </p>
          ) : (
            <LockedBlock className="mt-2.5">
              <p className="font-display text-4xl font-normal text-foreground blur-[12px]">
                ●●●●●●
              </p>
            </LockedBlock>
          )}
        </div>
        <div>
          <MiniLabel>La cote</MiniLabel>
          {hasAccess ? (
            <p className="mt-1.5 font-display text-7xl font-normal leading-none tabular-nums text-accent">
              {formatOdds(odds)}
            </p>
          ) : (
            <LockedBlock className="mt-1.5">
              <p className="font-display text-7xl font-normal leading-none text-foreground blur-[16px]">
                ●,●●
              </p>
            </LockedBlock>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6">
        <MiniLabel>Le pick</MiniLabel>
        <MiniLabel>La cote</MiniLabel>
      </div>
      {hasAccess ? (
        <div className="mt-3 flex items-end justify-between gap-6">
          <p className="min-w-0 font-display text-3xl font-normal leading-[1.05] text-foreground md:text-4xl">
            {pick || "—"}
          </p>
          <p className="shrink-0 font-display text-4xl font-normal leading-none tabular-nums text-accent md:text-5xl">
            {formatOdds(odds)}
          </p>
        </div>
      ) : (
        <LockedBlock fullWidth>
          <div className="mt-3 flex items-end justify-between gap-6 blur-[9px]">
            <p className="font-display text-3xl font-normal text-foreground md:text-4xl">●●●●●●</p>
            <p className="shrink-0 font-display text-4xl font-normal leading-none text-foreground md:text-5xl">
              ●,●●
            </p>
          </div>
        </LockedBlock>
      )}
    </div>
  );
}
