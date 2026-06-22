"use client";

import { analysisNumber, formatDotDate, splitMatch } from "@/lib/analysis-format";
import { isStarted } from "@/lib/date";
import type { PronoData } from "@/lib/experts";
import { getLeague } from "@/lib/sports";
import { cn } from "@/lib/utils";

import { ArgumentBlock } from "./argument-block";
import { BookmakersSection } from "./bookmakers-section";
import { Dashed, DashedV } from "./dashed";
import { HeaderLine } from "./header-line";
import { Kickoff } from "./kickoff";
import { MatchBlock } from "./match-block";
import { ticketMask } from "./notch-mask";
import { PickCote } from "./pick-cote";
import { TeasingMeta } from "./teasing-meta";

/**
 * Ticket d'analyse premium.
 *
 * Deux mises en page, MÊME contenu :
 *  - mobile : pile verticale (séparateurs perforés horizontaux).
 *  - desktop : structure "tombola" en deux étages —
 *      • haut, deux colonnes : CORPS éditorial à gauche | TALON
 *        "verdict" à droite (le pick + la cote, agrandis) ;
 *      • bas, pleine largeur : "Meilleures cotes" (bookmakers).
 *
 * Anti-AI : le SEUL élément doré est la cote (signal de valeur unique) ;
 * l'étoile featured est la seconde occurrence dorée, justifiée.
 *
 * Encoches de bord : vraie découpe via `mask` (cf. notch-mask.ts). Si
 * `mask-composite: intersect` n'est pas supporté, la card s'affiche
 * pleine (sans encoches) plutôt que cassée.
 */
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
        // doré (réservé aux CTA).
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
