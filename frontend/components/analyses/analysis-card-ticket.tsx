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
 * Ticket d'analyse premium.
 *
 * Deux mises en page, MÊME contenu :
 *  - mobile : pile verticale (séparateurs perforés horizontaux).
 *  - desktop : structure "tombola" en deux étages —
 *      • haut, deux colonnes : CORPS éditorial à gauche (n°/date, match
 *        + étoile featured, coup d'envoi, l'analyse) | TALON "verdict" à
 *        droite (le pick + la cote, seuls et agrandis) ;
 *      • bas, pleine largeur : "Meilleures cotes" — les bookmakers en
 *        boutons sobres alignés horizontalement.
 *
 * Anti-AI : le SEUL élément doré est la cote (signal de valeur unique).
 * L'étoile featured est la seconde occurrence dorée, justifiée (statut
 * "analyse du jour").
 *
 * Encoches de bord : vraie découpe via `mask` (le coin du ticket est
 * rogné, laissant voir le fond de page réel derrière — pas un disque
 * gris posé sur la bordure). Dégradation propre : si `mask-composite:
 * intersect` n'est pas supporté, la card s'affiche pleine (sans
 * encoches) plutôt que cassée.
 */

// 4 encoches semi-circulaires (G/D, en haut et en bas). Chaque gradient
// est transparent au centre du trou et opaque (#000) partout ailleurs ;
// `mask-composite: intersect` ne garde visible que ce qui est opaque
// dans TOUS les calques → les trous se cumulent.
const NOTCH = (() => {
  const hole = (at: string) =>
    `radial-gradient(circle 9px at ${at}, transparent 8px, #000 9px)`;
  return [
    hole("0 80px"),
    hole("100% 80px"),
    hole("0 calc(100% - 80px)"),
    hole("100% calc(100% - 80px)"),
  ].join(", ");
})();

const ticketMask: React.CSSProperties = {
  maskImage: NOTCH,
  WebkitMaskImage: NOTCH,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskComposite: "intersect",
};

export function AnalysisCardTicket({
  analysis,
  hasAccess,
}: {
  analysis: PronoData;
  hasAccess: boolean;
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
      style={ticketMask}
      className={cn(
        "relative mx-auto w-full max-w-[480px] rounded-[6px] border border-white/10 bg-surface-2",
        "px-6 pb-6 pt-5 md:mx-0 md:max-w-none md:px-8 md:pb-8 md:pt-6",
        // Élévation sobre : hairline clair + ombre douce. Pas de glow
        // doré (réservé aux CTA — règle anti-AI).
        "shadow-[0_2px_6px_rgba(0,0,0,0.45),0_24px_48px_-22px_rgba(0,0,0,0.9)]",
        started && !hasAccess && "opacity-60",
      )}
    >
      {/* ═══ MOBILE — pile verticale ═══ */}
      <div className="flex flex-col md:hidden">
        <HeaderLine num={num} date={dotDate} />
        <Dashed />
        <TeasingMeta teasing={analysis.teasing} ligueLabel={ligueLabel} />
        <MatchBlock teams={teams} featured={analysis.isFeatured} />
        <Kickoff started={started} startTime={analysis.startTime} />
        <Dashed />
        <PickCote hasAccess={hasAccess} pick={analysis.pick} odds={analysis.odds} />
        <Dashed />
        <ArgumentBlock hasAccess={hasAccess} argument={analysis.argument} />
        {hasBookmakers && (
          <>
            <Dashed />
            <BookmakersSection bookmakers={bookmakers} />
          </>
        )}
      </div>

      {/* ═══ DESKTOP — deux étages ═══ */}
      <div className="hidden md:flex md:flex-col">
        {/* Étage 1 — corps éditorial | talon verdict */}
        <div className="grid grid-cols-[1.5fr_1fr]">
          {/* CORPS — l'histoire du match. */}
          <div className="relative min-w-0 pr-9">
            <HeaderLine num={num} date={dotDate} />
            <Dashed />
            <TeasingMeta teasing={analysis.teasing} ligueLabel={ligueLabel} />
            <MatchBlock teams={teams} featured={analysis.isFeatured} />
            <Kickoff started={started} startTime={analysis.startTime} />
            <Dashed />
            <ArgumentBlock hasAccess={hasAccess} argument={analysis.argument} />
            {/* Ligne de déchirure verticale perforée. */}
            <DashedV className="absolute right-0 top-1 bottom-1" />
          </div>

          {/* TALON — le verdict, seul et mis en avant, centré verticalement. */}
          <div className="flex min-w-0 flex-col justify-center pl-9">
            <PickCote hasAccess={hasAccess} pick={analysis.pick} odds={analysis.odds} stacked />
          </div>
        </div>

        {/* Étage 2 — bookmakers en longueur, pleine largeur. */}
        {hasBookmakers && (
          <>
            <Dashed />
            <BookmakersSection bookmakers={bookmakers} />
          </>
        )}
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

function MatchBlock({
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
      {/* Étoile "analyse du jour" — statut métier, juste à droite du match.
          Seule autre occurrence dorée tolérée avec la cote. */}
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

function Kickoff({ started, startTime }: { started: boolean; startTime: string }) {
  return (
    <p className="mt-4 font-body text-sm text-muted-foreground">
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
 * LE PICK / LA COTE — cote en doré (unique accent de valeur).
 *  - `stacked` (talon desktop) : empilé, agrandi, occupe la colonne.
 *  - défaut (mobile) : deux colonnes (labels alignés, valeurs en gros).
 */
function PickCote({
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
      <div className="flex flex-col gap-7">
        <div>
          <MiniLabel>Le pick</MiniLabel>
          {hasAccess ? (
            <p className="mt-2 font-display text-3xl font-normal leading-[1.1] text-foreground">
              {pick || "—"}
            </p>
          ) : (
            <LockedBlock className="mt-2">
              <p className="font-display text-3xl font-normal text-foreground blur-[10px]">
                ●●●●●●
              </p>
            </LockedBlock>
          )}
        </div>
        <div>
          <MiniLabel>La cote</MiniLabel>
          {hasAccess ? (
            <p className="mt-1 font-display text-6xl font-normal leading-none tabular-nums text-accent">
              {formatOdds(odds)}
            </p>
          ) : (
            <LockedBlock className="mt-1">
              <p className="font-display text-6xl font-normal leading-none text-foreground blur-[14px]">
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

function ArgumentBlock({ hasAccess, argument }: { hasAccess: boolean; argument: string | null }) {
  return (
    <>
      <SectionLabel>L&apos;analyse</SectionLabel>
      {hasAccess ? (
        <p className="font-body text-base leading-[1.65] text-foreground/90">
          {argument || "Argumentaire non communiqué."}
        </p>
      ) : (
        <LockedBlock fullWidth>
          <p className="font-body text-base leading-[1.65] text-foreground blur-[7px]">
            ●●●●●●●●●● ●●●●●●●● ●●●●●●●●●●●● ●●●●●● ●●●●●●●●● ●●●● ●●●●●●●●●● ●●●●●●●.
          </p>
        </LockedBlock>
      )}
    </>
  );
}

/**
 * MEILLEURES COTES — bookmakers en boutons sobres.
 *  - mobile : empilés verticalement (pleine largeur).
 *  - desktop : alignés horizontalement, largeurs égales (flex-1).
 * Bouton au repos discret (hairline) ; le hover éclaire la bordure +
 * fond léger et passe la flèche en doré.
 */
function BookmakersSection({ bookmakers }: { bookmakers: BookmakerOddsData[] }) {
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

/* ════════════════ PRIMITIVES ════════════════ */

/** Perforation horizontale — dashes contrôlés (≈5px trait / 6px vide),
 *  blanc ~22 % : visible mais sobre. */
function Dashed({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "my-5 h-px w-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.22)_0,rgba(255,255,255,0.22)_5px,transparent_5px,transparent_11px)]",
        className,
      )}
    />
  );
}

/** Perforation verticale — ligne de déchirure du talon (desktop). */
function DashedV({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-px bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.22)_0,rgba(255,255,255,0.22)_5px,transparent_5px,transparent_11px)]",
        className,
      )}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * Enveloppe un contenu gaté : le rend flou + superpose un cadenas centré.
 *  - défaut (`w-fit`) : block (donc sur sa propre ligne, sous le label)
 *    mais largeur rétrécie au contenu → cadenas centré SUR le contenu
 *    (pick / cote, courts et alignés à gauche).
 *  - `fullWidth` : pleine largeur (analyse, ligne pick+cote mobile) →
 *    cadenas centré sur toute la largeur.
 */
function LockedBlock({
  children,
  className,
  fullWidth = false,
}: {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("relative max-w-full", fullWidth ? "w-full" : "w-fit", className)}>
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
