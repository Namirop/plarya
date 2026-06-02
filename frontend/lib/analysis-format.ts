import { TEASING_LABELS } from "@/lib/constants";
import type { BookmakerOddsData } from "@/lib/experts";

/**
 * Helpers de présentation partagés par les deux directions de card
 * analyse (ticket + fiche). Logique pure, testable, sans JSX — le
 * rendu vit dans les composants, le format ici.
 */

/** Cote "1,45" — virgule décimale FR, toujours 2 décimales. */
export function formatOdds(odds: number): string {
  return odds.toFixed(2).replace(".", ",");
}

/**
 * Numéro pseudo-stable 100–999 dérivé de l'id de l'analyse. Purement
 * cosmétique (header ticket "ANALYSE №142") — ancre l'identité "objet"
 * du ticket sans dépendre d'un vrai compteur en DB. Hash déterministe
 * sur tout l'id (les cuid ne sont pas hex → pas de parseInt base 16).
 */
export function analysisNumber(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 900) + 100;
}

/** Date "12.03.2026" — séparateur point, look "machine" (ticket). */
export function formatDotDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** Heure seule "21h36" (coup d'envoi). */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Teasing en kicker uppercase sans emoji ("🔒 Safe" → "SAFE"). Réutilise
 * le mapping TEASING_LABELS puis strippe l'emoji de tête.
 */
export function teasingLabel(teasing: string): string {
  return (TEASING_LABELS[teasing] || teasing).replace(/^\S+\s+/u, "").toUpperCase();
}

export interface MatchTeams {
  home: string;
  away: string | null;
}

/**
 * Découpe "Toulouse - Racing" / "PSG vs OM" / "Lens — Rennes" en
 * { home, away }. Sépare sur le PREMIER séparateur rencontré (tiret,
 * em/en-dash, ou "vs", insensible à la casse). Si aucun séparateur :
 * away = null (un seul intitulé, ex: course, combat).
 */
export function splitMatch(name: string): MatchTeams {
  const m = name.match(/^(.*?)\s+(?:—|–|-|vs)\s+(.*)$/i);
  if (m) {
    return { home: m[1].trim(), away: m[2].trim() };
  }
  return { home: name.trim(), away: null };
}

/** Premier lien d'affiliation d'un bookmaker (ou null). */
export function primaryAffiliate(bo: BookmakerOddsData) {
  return bo.bookmaker.affiliateLinks[0] ?? null;
}
