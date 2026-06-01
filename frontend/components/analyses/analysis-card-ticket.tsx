"use client";

import { Lock, Star } from "@phosphor-icons/react";

import {
  analysisNumber,
  formatDotDate,
  formatOdds,
  formatTime,
  primaryAffiliate,
  splitMatch,
  teasingLabel,
} from "@/lib/analysis-format";
import { isStarted } from "@/lib/date";
import type { BookmakerOddsData, PronoData } from "@/lib/experts";
import { getLeague } from "@/lib/sports";
import { cn } from "@/lib/utils";

import { BookmakerLogo } from "./bookmaker-logo";

/**
 * DIRECTION 1 — Ticket de paris premium.
 *
 * Deux mises en page selon le breakpoint, MÊME contenu :
 *  - mobile : ticket vertical empilé (séparateurs pointillés horizontaux,
 *    perforations sur les bords G/D).
 *  - desktop : structure "tombola" — corps principal + talon (stub)
 *    séparés par une ligne de déchirure verticale pointillée, qui occupe
 *    la largeur et casse l'effet "colonne trop haute".
 *
 * Le SEUL élément doré est la cote (signal de valeur unique, cf. règles
 * anti-AI : l'accent signale, il ne décore pas). L'étoile featured est
 * la seconde occurrence dorée, justifiée (statut "analyse du jour").
 *
 * Note couleurs : `surface-1` (#131212) du DS = fond du body → identiques
 * à l'œil. On prend `surface-2` (#1a1818) pour le corps (un cran plus
 * clair) et `surface` (#131212, = fond de page) pour les perforations,
 * qui lisent alors comme une découpe laissant voir la page derrière.
 */
export function AnalysisCardTicket({
  analysis,
  hasAccess,
  expertPseudo,
  viewsToday,
}: {
  analysis: PronoData;
  hasAccess: boolean;
  expertPseudo: string;
  viewsToday: number;
}) {
  const league = analysis.league ? getLeague(analysis.league) : undefined;
  const teams = splitMatch(analysis.matchName);
  const started = isStarted(analysis.startTime);
  const num = analysisNumber(analysis.id);
  const dotDate = formatDotDate(analysis.matchDate ?? analysis.startTime);
  const ligueLabel = league?.shortName ?? league?.name ?? null;
  const bookmakers = analysis.bookmakerOdds ?? [];
  const hasBookmakers = hasAccess && bookmakers.length > 0;

  return (
    <article
      className={cn(
        "relative w-full rounded-[6px] border border-border bg-surface-2",
        "mx-auto max-w-[480px] p-6 md:mx-0 md:max-w-none md:p-8",
        started && !hasAccess && "opacity-60",
      )}
    >
      {/* Perforations sur les bords G/D — communes aux deux layouts. */}
      <Perforation className="-left-1.5 top-[72px]" />
      <Perforation className="-right-1.5 top-[72px]" />
      <Perforation className="-left-1.5 bottom-[72px]" />
      <Perforation className="-right-1.5 bottom-[72px]" />

      {/* Étoile "analyse du jour" — statut métier, seule autre occurrence
          dorée tolérée avec la cote. */}
      {analysis.isFeatured && (
        <Star
          weight="fill"
          aria-label="Analyse du jour"
          className="absolute right-5 top-5 z-10 size-7 text-accent md:right-7 md:top-7"
        />
      )}

      {/* ═══ MOBILE — pile verticale ═══ */}
      <div className="flex flex-col md:hidden">
        <HeaderLine num={num} date={dotDate} />
        <Dashed />
        <TeasingMeta teasing={analysis.teasing} ligueLabel={ligueLabel} />
        <MatchBlock teams={teams} />
        <Kickoff started={started} startTime={analysis.startTime} />
        <Dashed />
        <PickCote hasAccess={hasAccess} pick={analysis.pick} odds={analysis.odds} />
        <Dashed />
        <ArgumentBlock hasAccess={hasAccess} argument={analysis.argument} />
        {hasBookmakers && (
          <>
            <Dashed />
            <Bookmakers bookmakers={bookmakers} />
          </>
        )}
        <Dashed />
        <Signature expertPseudo={expertPseudo} viewsToday={viewsToday} />
      </div>

      {/* ═══ DESKTOP — corps + talon, ligne de déchirure verticale ═══ */}
      <div className="hidden md:grid md:grid-cols-[1.7fr_1fr]">
        {/* Corps principal */}
        <div className="min-w-0 border-r border-dashed border-border/60 pr-8">
          <HeaderLine num={num} date={dotDate} />
          <Dashed />
          <TeasingMeta teasing={analysis.teasing} ligueLabel={ligueLabel} />
          <MatchBlock teams={teams} />
          <Kickoff started={started} startTime={analysis.startTime} />
          <Dashed />
          <PickCote hasAccess={hasAccess} pick={analysis.pick} odds={analysis.odds} />
          <Dashed />
          <ArgumentBlock hasAccess={hasAccess} argument={analysis.argument} />
        </div>

        {/* Talon (stub) — centré verticalement pour rester équilibré que
            les bookmakers soient présents (débloqué) ou non (verrouillé). */}
        <div className="flex min-w-0 flex-col justify-center pl-8">
          {hasBookmakers && (
            <>
              <Bookmakers bookmakers={bookmakers} />
              <Dashed />
            </>
          )}
          <Signature expertPseudo={expertPseudo} viewsToday={viewsToday} />
        </div>
      </div>
    </article>
  );
}

/* ════════════════ BLOCS DE CONTENU (partagés mobile/desktop) ════════════════ */

function HeaderLine({ num, date }: { num: number; date: string }) {
  return (
    <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      <span className="tabular-nums">
        Analyse №{num} · {date}
      </span>
    </p>
  );
}

function TeasingMeta({ teasing, ligueLabel }: { teasing: string; ligueLabel: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tampon teasing — encart fin façon "classe" imprimée sur le ticket :
          ressort par le contraste (filet + texte blanc) sans pill ni or. */}
      <span className="inline-flex items-center rounded-[2px] border border-foreground/30 px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.18em] text-foreground">
        {teasingLabel(teasing)}
      </span>
      {ligueLabel && (
        <span className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {ligueLabel}
        </span>
      )}
    </div>
  );
}

function MatchBlock({ teams }: { teams: { home: string; away: string | null } }) {
  return (
    <div className="mt-5 font-display text-3xl font-normal uppercase leading-none text-foreground md:text-4xl">
      <span className="block">{teams.home}</span>
      {teams.away && (
        <>
          <span className="my-1.5 block text-xl italic normal-case text-muted-foreground">vs</span>
          <span className="block">{teams.away}</span>
        </>
      )}
    </div>
  );
}

function Kickoff({ started, startTime }: { started: boolean; startTime: string }) {
  return (
    <p className="mt-5 font-body text-sm text-muted-foreground">
      {started ? (
        <span className="text-destructive">Match commencé</span>
      ) : (
        <>Coup d&apos;envoi · {formatTime(startTime)}</>
      )}
    </p>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * LE PICK / LA COTE — structure deux colonnes reprise de la fiche
 * (labels alignés en haut, valeurs en gros dessous), cote en doré.
 */
function PickCote({
  hasAccess,
  pick,
  odds,
}: {
  hasAccess: boolean;
  pick: string | null;
  odds: number;
}) {
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
        <LockedBlock>
          <div className="mt-3 flex items-end justify-between gap-6 blur-[7px]">
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

function ArgumentBlock({ hasAccess, argument }: { hasAccess: boolean; argument: string | null }) {
  return (
    <>
      <SectionLabel>L&apos;analyse</SectionLabel>
      {hasAccess ? (
        <p className="font-body text-base leading-[1.65] text-foreground/90">
          {argument || "Argumentaire non communiqué."}
        </p>
      ) : (
        <LockedBlock>
          <p className="font-body text-base leading-[1.65] text-foreground blur-[7px]">
            ●●●●●●●●●● ●●●●●●●● ●●●●●●●●●●●● ●●●●●● ●●●●●●●●● ●●●● ●●●●●●●●●● ●●●●●●●.
          </p>
        </LockedBlock>
      )}
    </>
  );
}

function Bookmakers({ bookmakers }: { bookmakers: BookmakerOddsData[] }) {
  return (
    <div>
      <SectionLabel>Où parier</SectionLabel>
      <div>
        {bookmakers.map((bo, i) => {
          const link = primaryAffiliate(bo);
          const offer = link?.label || null;
          return (
            <div
              key={bo.id}
              className={cn(
                "grid grid-cols-[1fr_auto_2rem] items-center gap-4 py-[7px]",
                i > 0 && "border-t border-border/40",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <BookmakerLogo name={bo.bookmaker.name} logoUrl={bo.bookmaker.logoUrl} />
                <span className="truncate font-body text-sm text-foreground">
                  {bo.bookmaker.name}
                </span>
              </div>
              <span className="font-body text-sm tabular-nums text-muted-foreground">
                {formatOdds(bo.odds)}
              </span>
              {link ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={offer ?? undefined}
                  aria-label={`Accéder à ${bo.bookmaker.name}${offer ? ` (${offer})` : ""}`}
                  className="justify-self-end font-display text-xl text-foreground transition-all duration-200 hover:translate-x-1 hover:text-accent"
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
    </div>
  );
}

function Signature({ expertPseudo, viewsToday }: { expertPseudo: string; viewsToday: number }) {
  return (
    <div>
      <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Plarya · @{expertPseudo}
      </p>
      {viewsToday > 0 && (
        <p className="mt-1 font-body text-xs text-muted-foreground/70">
          <span className="tabular-nums">{viewsToday}</span> vues aujourd&apos;hui
        </p>
      )}
    </div>
  );
}

/* ════════════════ PRIMITIVES ════════════════ */

function Perforation({ className }: { className: string }) {
  return <span aria-hidden className={cn("absolute z-10 size-3 rounded-full bg-surface", className)} />;
}

function Dashed() {
  return <div aria-hidden className="my-6 border-t border-dashed border-border/60" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function LockedBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Cadenas = signal de statut métier (contenu gaté), pas une
            décoration → usage d'icône légitime (cf. anti-AI §6). */}
        <Lock className="size-6 text-foreground" aria-label="Contenu verrouillé" />
      </div>
    </div>
  );
}
