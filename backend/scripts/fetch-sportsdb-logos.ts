/**
 * One-off : interroge SportsDB pour chaque league utilisée dans Plarya
 * et dump les URLs de badge dans une console-readable structure.
 *
 * Copy-paste le résultat dans frontend/lib/league-logo.ts en mode
 * mapping hardcoded (vs fetch live à chaque rendu).
 *
 * Usage : npx tsx scripts/fetch-sportsdb-logos.ts
 */

interface LeagueQuery {
  id: string; // notre slug
  searchName: string; // nom utilisé pour la query SportsDB
  sportsDbId?: number; // si on connaît l'ID (plus fiable)
}

const QUERIES: LeagueQuery[] = [
  // Football — IDs connus de SportsDB
  { id: "ligue-1", searchName: "French Ligue 1", sportsDbId: 4334 },
  { id: "ligue-2", searchName: "French Ligue 2", sportsDbId: 4339 },
  { id: "premier-league", searchName: "English Premier League", sportsDbId: 4328 },
  { id: "la-liga", searchName: "Spanish La Liga", sportsDbId: 4335 },
  { id: "serie-a", searchName: "Italian Serie A", sportsDbId: 4332 },
  { id: "bundesliga", searchName: "German Bundesliga", sportsDbId: 4331 },
  { id: "champions-league", searchName: "UEFA Champions League", sportsDbId: 4480 },
  // Tennis (recherche par nom)
  { id: "roland-garros", searchName: "Roland Garros" },
  { id: "wimbledon", searchName: "Wimbledon" },
  { id: "us-open-tennis", searchName: "US Open" },
  { id: "atp", searchName: "ATP" },
  { id: "wta", searchName: "WTA" },
  // Basketball
  { id: "nba", searchName: "NBA", sportsDbId: 4387 },
  { id: "euroleague", searchName: "EuroLeague", sportsDbId: 4495 },
  // Rugby
  { id: "top-14", searchName: "Top 14" },
  { id: "six-nations", searchName: "Six Nations" },
  // MMA / Combat
  { id: "ufc", searchName: "UFC" },
  // Hockey
  { id: "nhl", searchName: "NHL", sportsDbId: 4380 },
  // Auto
  { id: "f1", searchName: "Formula 1" },
  // Esport
  { id: "lck", searchName: "League of Legends Champions Korea" },
  { id: "lec", searchName: "League of Legends EMEA Championship" },
  { id: "lpl", searchName: "League of Legends Pro League" },
  { id: "lol-worlds", searchName: "League of Legends World Championship" },
  { id: "valorant", searchName: "Valorant Champions Tour" },
  { id: "cs2", searchName: "Counter-Strike 2" },
];

interface SportsDbLeague {
  idLeague: string;
  strLeague: string;
  strBadge: string | null;
}
interface SportsDbResponse {
  leagues: SportsDbLeague[] | null;
}

async function lookup(q: LeagueQuery): Promise<string | null> {
  const url = q.sportsDbId
    ? `https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id=${q.sportsDbId}`
    : `https://www.thesportsdb.com/api/v1/json/3/searchleagues.php?l=${encodeURIComponent(q.searchName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as SportsDbResponse;
    if (!data.leagues || data.leagues.length === 0) return null;
    // Si on a passé un sportsDbId, on prend la première. Sinon on
    // tente une recherche de match approximatif sur le nom.
    return data.leagues[0]?.strBadge ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const results: Record<string, string | null> = {};
  for (const q of QUERIES) {
    const badge = await lookup(q);
    results[q.id] = badge;
    console.error(`${q.id.padEnd(25)} → ${badge ?? "NOT FOUND"}`);
    // Throttle pour ne pas se faire flagger
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log("\n\n// Copy-paste dans frontend/lib/league-logo.ts :\n");
  console.log(JSON.stringify(results, null, 2));
}

main();
