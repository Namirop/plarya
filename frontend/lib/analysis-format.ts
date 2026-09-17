import { TEASING_LABELS } from "@/lib/constants";
import type { BookmakerOddsData } from "@/lib/experts";

// Fonctions de formatage (sans JSX) des cartes d'analyse.

/** Cote "1,45" : virgule décimale, toujours 2 décimales. */
export function formatOdds(odds: number): string {
  return odds.toFixed(2).replace(".", ",");
}

/**
 * Numéro décoratif 100–999 (« ANALYSE №142 »), hash déterministe de l'id :
 * stable d'un rendu à l'autre, sans compteur en base.
 */
export function analysisNumber(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 900) + 100;
}

/** Date "12.03.2026". */
export function formatDotDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Heure "21h36". */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Libellé de teasing sans son emoji de tête, en majuscules ("🔒 Safe" → "SAFE"). */
export function teasingLabel(teasing: string): string {
  return (TEASING_LABELS[teasing] || teasing).replace(/^\S+\s+/u, "").toUpperCase();
}

export interface MatchTeams {
  home: string;
  away: string | null;
}

/**
 * "PSG vs OM" / "Lens — Rennes" → { home, away }, coupé au premier séparateur
 * (tirets ou "vs"). Sans séparateur (course, combat…) : away = null.
 */
export function splitMatch(name: string): MatchTeams {
  const m = name.match(/^(.*?)\s+(?:—|–|-|vs)\s+(.*)$/i);
  if (m) {
    return { home: m[1].trim(), away: m[2].trim() };
  }
  return { home: name.trim(), away: null };
}

export function primaryAffiliate(bo: BookmakerOddsData) {
  return bo.bookmaker.affiliateLinks[0] ?? null;
}
