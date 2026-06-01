import {
  analysisNumber,
  formatLongDate,
  formatOdds,
  formatTime,
  primaryAffiliate,
  splitMatch,
} from "@/lib/analysis-format";
import type { PronoData } from "@/lib/experts";
import { getLeague } from "@/lib/sports";

import { BookmakerLogo } from "./bookmaker-logo";

/**
 * DIRECTION 2 — Fiche d'analyse formelle.
 *
 * Document éditorial premium (rapport d'analyse) : filets horizontaux
 * épais entre sections, numérotation classique des bookmakers, look
 * "fiche officielle". AUCUN doré — toute la hiérarchie passe par la
 * typo (taille + weight + filets). Rendue sur la page de preview dev
 * uniquement (`/dev/fiche-preview/[id]`).
 */
export function AnalysisCardFiche({
  analysis,
  expertPseudo,
}: {
  analysis: PronoData;
  expertPseudo: string;
}) {
  const league = analysis.league ? getLeague(analysis.league) : undefined;
  const teams = splitMatch(analysis.matchName);
  const matchTitle = teams.away ? `${teams.home} — ${teams.away}` : teams.home;

  const subInfo = [league?.name ?? null, `Coup d'envoi ${formatTime(analysis.startTime)}`]
    .filter(Boolean)
    .join(" · ");

  const bookmakers = analysis.bookmakerOdds ?? [];

  return (
    <article className="mx-auto w-full max-w-[720px] rounded-[4px] border border-border bg-surface-2 p-6 md:p-12">
      {/* ── Header : N° + date ── */}
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-body text-sm tabular-nums text-muted-foreground">
          N° {analysisNumber(analysis.id)}
        </span>
        <span className="font-body text-sm tabular-nums text-muted-foreground">
          {formatLongDate(analysis.matchDate ?? analysis.startTime)}
        </span>
      </div>

      {/* ── Titre + filet court ── */}
      <h2 className="mt-8 font-display text-2xl uppercase tracking-[0.05em] text-foreground">
        Analyse
      </h2>
      <div aria-hidden className="mt-2 h-0.5 w-10 bg-foreground" />

      {/* ── Match + sous-info ── */}
      <p className="mt-6 font-display text-3xl font-normal text-foreground md:text-4xl">
        {matchTitle}
      </p>
      {subInfo && <p className="mt-2 font-body text-sm text-muted-foreground">{subInfo}</p>}

      <ThickRule />

      {/* ── LE VERDICT / LA COTE ── */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <SectionLabel>Le verdict</SectionLabel>
          <p className="font-display text-3xl font-normal leading-none text-foreground md:text-5xl">
            {analysis.pick || "—"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <SectionLabel>La cote</SectionLabel>
          <p className="font-display text-3xl font-normal leading-none tabular-nums text-foreground md:text-5xl">
            {formatOdds(analysis.odds)}
          </p>
        </div>
      </div>

      <ThickRule />

      {/* ── L'ARGUMENTAIRE ── */}
      <SectionLabel>L&apos;argumentaire</SectionLabel>
      <p className="max-w-[600px] font-body text-base leading-[1.7] text-foreground/90">
        {analysis.argument || "Argumentaire non communiqué."}
      </p>

      {/* ── OÙ PARIER ── */}
      {bookmakers.length > 0 && (
        <>
          <ThickRule />
          <SectionLabel>Où parier</SectionLabel>
          <div className="space-y-4">
            {bookmakers.map((bo, i) => {
              const link = primaryAffiliate(bo);
              const offer = link?.label || null;
              return (
                <div
                  key={bo.id}
                  className="grid grid-cols-[40px_1fr_64px_32px] items-center gap-4 md:grid-cols-[64px_1fr_80px_32px]"
                >
                  <span className="font-display text-xl tabular-nums text-muted-foreground/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 items-center gap-3">
                    <BookmakerLogo
                      name={bo.bookmaker.name}
                      logoUrl={bo.bookmaker.logoUrl}
                      heightClass="h-5"
                    />
                    <span className="truncate font-body text-base text-foreground">
                      {bo.bookmaker.name}
                    </span>
                  </div>
                  <span className="font-body text-base tabular-nums text-muted-foreground">
                    {formatOdds(bo.odds)}
                  </span>
                  {link ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={offer ?? undefined}
                      aria-label={`Accéder à ${bo.bookmaker.name}${offer ? ` (${offer})` : ""}`}
                      className="justify-self-end font-body text-lg text-foreground transition-transform duration-200 hover:translate-x-1"
                    >
                      →
                    </a>
                  ) : (
                    <span aria-hidden className="justify-self-end" />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <ThickRule />

      {/* ── Signature ── */}
      <p className="font-body text-sm italic text-muted-foreground">Signé · {expertPseudo}</p>
    </article>
  );
}

/* ── Primitives internes de la fiche ── */

function ThickRule() {
  return <div aria-hidden className="my-10 border-t-2 border-border" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </p>
  );
}
