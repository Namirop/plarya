const SPORT_EMOJIS: Record<string, string> = {
  FOOTBALL: "⚽",
  TENNIS: "🎾",
  BASKETBALL: "🏀",
  RUGBY: "🏉",
  HOCKEY: "🏒",
  MMA: "🥊",
  BOXE: "🥊",
  ESPORT: "🎮",
  AUTRE: "🏅",
};

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
  logo: string | null;
  country: string;
}

export const LEAGUES: League[] = [
  // Football
  {
    id: "ligue-1",
    name: "Ligue 1",
    shortName: "LIGUE 1",
    sport: "FOOTBALL",
    logo: "/leagues/ligue-1.svg",
    country: "🇫🇷",
  },
  {
    id: "ligue-2",
    name: "Ligue 2",
    shortName: "LIGUE 2",
    sport: "FOOTBALL",
    logo: null,
    country: "🇫🇷",
  },
  {
    id: "premier-league",
    name: "Premier League",
    shortName: "PREMIER LEAGUE",
    sport: "FOOTBALL",
    logo: "/leagues/premier-league.svg",
    country: "🇬🇧",
  },
  {
    id: "la-liga",
    name: "La Liga",
    shortName: "LA LIGA",
    sport: "FOOTBALL",
    logo: "/leagues/la-liga.svg",
    country: "🇪🇸",
  },
  {
    id: "serie-a",
    name: "Serie A",
    shortName: "SERIE A",
    sport: "FOOTBALL",
    logo: "/leagues/serie-a.svg",
    country: "🇮🇹",
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    shortName: "BUNDESLIGA",
    sport: "FOOTBALL",
    logo: "/leagues/bundesliga.svg",
    country: "🇩🇪",
  },
  {
    id: "champions-league",
    name: "Champions League",
    shortName: "CHAMPIONS LEAGUE",
    sport: "FOOTBALL",
    logo: "/leagues/champions-league.png",
    country: "🇪🇺",
  },

  // Tennis
  {
    id: "roland-garros",
    name: "Roland-Garros",
    shortName: "ROLAND-GARROS",
    sport: "TENNIS",
    logo: "/leagues/roland-garros.svg",
    country: "🇫🇷",
  },
  {
    id: "wimbledon",
    name: "Wimbledon",
    shortName: "WIMBLEDON",
    sport: "TENNIS",
    logo: "/leagues/wimbledon.png",
    country: "🇬🇧",
  },
  {
    id: "us-open-tennis",
    name: "US Open",
    shortName: "US OPEN",
    sport: "TENNIS",
    logo: "/leagues/us-open-tennis.svg",
    country: "🇺🇸",
  },
  {
    id: "atp",
    name: "ATP Tour",
    shortName: "ATP",
    sport: "TENNIS",
    logo: "/leagues/atp.svg",
    country: "🌍",
  },
  {
    id: "wta",
    name: "WTA Tour",
    shortName: "WTA",
    sport: "TENNIS",
    logo: "/leagues/wta.svg",
    country: "🌍",
  },

  // Basketball
  {
    id: "nba",
    name: "NBA",
    shortName: "NBA",
    sport: "BASKETBALL",
    logo: "/leagues/nba.svg",
    country: "🇺🇸",
  },
  {
    id: "euroleague",
    name: "EuroLeague",
    shortName: "EUROLEAGUE",
    sport: "BASKETBALL",
    logo: "/leagues/euroleague.svg",
    country: "🇪🇺",
  },

  // Rugby
  {
    id: "top-14",
    name: "Top 14",
    shortName: "TOP 14",
    sport: "RUGBY",
    logo: "/leagues/top-14.png",
    country: "🇫🇷",
  },
  {
    id: "six-nations",
    name: "Six Nations",
    shortName: "SIX NATIONS",
    sport: "RUGBY",
    logo: "/leagues/six-nations.png",
    country: "🌍",
  },

  // MMA / Combat
  {
    id: "ufc",
    name: "UFC",
    shortName: "UFC",
    sport: "MMA",
    logo: "/leagues/ufc.svg",
    country: "🇺🇸",
  },

  // Hockey
  {
    id: "nhl",
    name: "NHL",
    shortName: "NHL",
    sport: "HOCKEY",
    logo: "/leagues/nhl.png",
    country: "🇺🇸",
  },

  // Sports auto
  {
    id: "f1",
    name: "Formule 1",
    shortName: "F1",
    sport: "AUTRE",
    logo: "/leagues/f1.svg",
    country: "🌍",
  },

  // Esport
  {
    id: "lck",
    name: "LCK",
    shortName: "LCK",
    sport: "ESPORT",
    logo: null,
    country: "🇰🇷",
  },
  {
    id: "lec",
    name: "LEC",
    shortName: "LEC",
    sport: "ESPORT",
    logo: null,
    country: "🇪🇺",
  },
  {
    id: "lpl",
    name: "LPL",
    shortName: "LPL",
    sport: "ESPORT",
    logo: null,
    country: "🇨🇳",
  },
  {
    id: "lol-worlds",
    name: "LoL Worlds",
    shortName: "WORLDS",
    sport: "ESPORT",
    logo: "/leagues/lol-worlds.svg",
    country: "🌍",
  },
  {
    id: "valorant",
    name: "Valorant (VCT)",
    shortName: "VALORANT",
    sport: "ESPORT",
    logo: "/leagues/valorant.png",
    country: "🌍",
  },
  {
    id: "cs2",
    name: "CS2",
    shortName: "CS2",
    sport: "ESPORT",
    logo: "/leagues/cs2.svg",
    country: "🌍",
  },
];

const LEAGUE_MAP = new Map(LEAGUES.map((l) => [l.id, l]));

export function getLeague(id: string): League | undefined {
  return LEAGUE_MAP.get(id);
}

export function getLeaguesBySport(sport: string): League[] {
  return LEAGUES.filter((l) => l.sport === sport);
}

export function getLeaguesGroupedBySport(): Record<string, League[]> {
  const grouped: Record<string, League[]> = {};
  for (const league of LEAGUES) {
    if (!grouped[league.sport]) grouped[league.sport] = [];
    grouped[league.sport].push(league);
  }
  return grouped;
}

// ── Legacy compat ──

const LEGACY_LEAGUE_FLAGS: Record<string, string> = {
  "ligue 1": "🇫🇷",
  "ligue 2": "🇫🇷",
  "premier league": "🇬🇧",
  "la liga": "🇪🇸",
  "serie a": "🇮🇹",
  bundesliga: "🇩🇪",
  eredivisie: "🇳🇱",
  "liga portugal": "🇵🇹",
  "super lig": "🇹🇷",
  "top 14": "🇫🇷",
  "6 nations": "🏴",
  "roland garros": "🇫🇷",
  wimbledon: "🇬🇧",
  "us open": "🇺🇸",
  atp: "🎾",
  "atp finals": "🎾",
  wta: "🎾",
  nba: "🇺🇸",
  ufc: "🇺🇸",
  lck: "🇰🇷",
  "lck spring": "🇰🇷",
  lec: "🇪🇺",
  lpl: "🇨🇳",
  worlds: "🌍",
  valorant: "🎮",
  cs2: "🎮",
  "cs2 major": "🎮",
  "cs2 blast": "🎮",
};

// ── Helpers ──

export function getSportEmoji(sport: string): string {
  // Also check if it's a league id and return the sport emoji
  const league = LEAGUE_MAP.get(sport);
  if (league) return SPORT_EMOJIS[league.sport] || "🏅";
  return SPORT_EMOJIS[sport] || "🏅";
}

export function getSportLabel(sport: string): string {
  return SPORT_NAMES[sport] || sport;
}

/** Get flag for a league. Checks new LEAGUES by id first, then legacy mapping. */
export function getLeagueFlag(league: string): string {
  const found = LEAGUE_MAP.get(league);
  if (found) return found.country;
  return LEGACY_LEAGUE_FLAGS[league.toLowerCase().trim()] || "";
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
