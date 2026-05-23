import { LEAGUE_BADGES } from "./league-logo";

const SPORT_NAMES: Record<string, string> = {
  FOOTBALL: "Football",
  TENNIS: "Tennis",
  BASKETBALL: "Basketball",
  RUGBY: "Rugby",
  HOCKEY: "Hockey",
  MMA: "MMA",
  BOXE: "Boxe",
  ESPORT: "Esport",
  AUTRE: "Autre",
};

// ── League system ──

export interface League {
  id: string;
  name: string;
  shortName: string;
  sport: string;
  /**
   * URL du badge SportsDB pour cette ligue (cf. lib/league-logo.ts).
   * `null` quand SportsDB ne référence pas la ligue (tennis grand slams,
   * MMA, F1, esport) → l'UI doit fallback sur le SportIcon générique.
   */
  logo: string | null;
  country: string;
}

interface LeagueMeta {
  id: string;
  name: string;
  shortName: string;
  sport: string;
  country: string;
}

const LEAGUES_META: LeagueMeta[] = [
  // Football
  { id: "ligue-1", name: "Ligue 1", shortName: "LIGUE 1", sport: "FOOTBALL", country: "🇫🇷" },
  { id: "ligue-2", name: "Ligue 2", shortName: "LIGUE 2", sport: "FOOTBALL", country: "🇫🇷" },
  {
    id: "premier-league",
    name: "Premier League",
    shortName: "PREMIER LEAGUE",
    sport: "FOOTBALL",
    country: "🇬🇧",
  },
  { id: "la-liga", name: "La Liga", shortName: "LA LIGA", sport: "FOOTBALL", country: "🇪🇸" },
  { id: "serie-a", name: "Serie A", shortName: "SERIE A", sport: "FOOTBALL", country: "🇮🇹" },
  {
    id: "bundesliga",
    name: "Bundesliga",
    shortName: "BUNDESLIGA",
    sport: "FOOTBALL",
    country: "🇩🇪",
  },
  {
    id: "champions-league",
    name: "Champions League",
    shortName: "CHAMPIONS LEAGUE",
    sport: "FOOTBALL",
    country: "🇪🇺",
  },

  // Tennis
  {
    id: "roland-garros",
    name: "Roland-Garros",
    shortName: "ROLAND-GARROS",
    sport: "TENNIS",
    country: "🇫🇷",
  },
  { id: "wimbledon", name: "Wimbledon", shortName: "WIMBLEDON", sport: "TENNIS", country: "🇬🇧" },
  { id: "us-open-tennis", name: "US Open", shortName: "US OPEN", sport: "TENNIS", country: "🇺🇸" },
  { id: "atp", name: "ATP Tour", shortName: "ATP", sport: "TENNIS", country: "🌍" },
  { id: "wta", name: "WTA Tour", shortName: "WTA", sport: "TENNIS", country: "🌍" },

  // Basketball
  { id: "nba", name: "NBA", shortName: "NBA", sport: "BASKETBALL", country: "🇺🇸" },
  {
    id: "euroleague",
    name: "EuroLeague",
    shortName: "EUROLEAGUE",
    sport: "BASKETBALL",
    country: "🇪🇺",
  },

  // Rugby
  { id: "top-14", name: "Top 14", shortName: "TOP 14", sport: "RUGBY", country: "🇫🇷" },
  {
    id: "six-nations",
    name: "Six Nations",
    shortName: "SIX NATIONS",
    sport: "RUGBY",
    country: "🌍",
  },

  // MMA / Combat
  { id: "ufc", name: "UFC", shortName: "UFC", sport: "MMA", country: "🇺🇸" },

  // Hockey
  { id: "nhl", name: "NHL", shortName: "NHL", sport: "HOCKEY", country: "🇺🇸" },

  // Sports auto
  { id: "f1", name: "Formule 1", shortName: "F1", sport: "AUTRE", country: "🌍" },

  // Esport
  { id: "lck", name: "LCK", shortName: "LCK", sport: "ESPORT", country: "🇰🇷" },
  { id: "lec", name: "LEC", shortName: "LEC", sport: "ESPORT", country: "🇪🇺" },
  { id: "lpl", name: "LPL", shortName: "LPL", sport: "ESPORT", country: "🇨🇳" },
  { id: "lol-worlds", name: "LoL Worlds", shortName: "WORLDS", sport: "ESPORT", country: "🌍" },
  { id: "valorant", name: "Valorant (VCT)", shortName: "VALORANT", sport: "ESPORT", country: "🌍" },
  { id: "cs2", name: "CS2", shortName: "CS2", sport: "ESPORT", country: "🌍" },
];

// LEAGUES enrichi à l'import avec les badges SportsDB. Pas de fetch
// live — tout est résolu en synchrone depuis le mapping hardcoded.
export const LEAGUES: League[] = LEAGUES_META.map((m) => ({
  ...m,
  logo: LEAGUE_BADGES[m.id] ?? null,
}));

const LEAGUE_MAP = new Map(LEAGUES.map((l) => [l.id, l]));

export function getLeague(id: string): League | undefined {
  return LEAGUE_MAP.get(id);
}

export function getLeaguesGroupedBySport(): Record<string, League[]> {
  const grouped: Record<string, League[]> = {};
  for (const league of LEAGUES) {
    if (!grouped[league.sport]) grouped[league.sport] = [];
    grouped[league.sport].push(league);
  }
  return grouped;
}

// ── Helpers ──

export function getSportLabel(sport: string): string {
  return SPORT_NAMES[sport] || sport;
}

export const SPORT_DOMAIN = [
  "FOOTBALL",
  "TENNIS",
  "BASKETBALL",
  "RUGBY",
  "HOCKEY",
  "MMA",
  "BOXE",
  "AUTRE",
];

export const ESPORT_DOMAIN = ["ESPORT"];
