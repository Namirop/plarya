/**
 * Mapping leagueSlug → URL du badge SportsDB.
 *
 * Stratégie : fetch one-off effectué via les scripts d'investigation
 * dans `backend/scripts/sportsdb-investigate.ts` + `sportsdb-grep-all.ts`,
 * résultats hardcodés ici (vs fetch live à chaque rendu). Pourquoi :
 *  - ~25 ligues qui ne bougent pas du tout (pas de nouvelle ligue par
 *    mois). Source-of-truth maintenue à la main.
 *  - Évite un fetch externe à chaque rendu (latence, dépendance réseau,
 *    risque que SportsDB tombe → tous les logos disparaissent côté user).
 *  - next/image cache les images CDN → la 1re visite paie la latence,
 *    les suivantes hitent le cache Next.
 *
 * Ligues sans badge SportsDB → `null` → l'UI fallback sur SportIcon
 * (cf. ExpertProfile.client.tsx). Investigations exhaustives effectuées
 * via `search_all_leagues.php`, `searchleagues.php` ET `all_leagues.php`
 * du tier free SportsDB : ces 9 ligues ne sont PAS dans l'index libre.
 * Détail des non-trouvés :
 *   - tennis Grand Slams (roland-garros, wimbledon, us-open-tennis) :
 *     stockés comme "events" SportsDB, pas comme leagues — pas de badge
 *     dédié dans l'API leagues.
 *   - top-14, six-nations : SportsDB indexe surtout le rugby
 *     australien (NRL, NRC, URBA Top 13) — Europe absente du tier free.
 *   - f1 : absent de Motorsport (le tier free liste V8 Supercars,
 *     BTCC, British GT, Rallycross, WorldSSP — pas la F1 elle-même).
 *   - lol-worlds, valorant, cs2 : SportsDB esport free se limite à
 *     LoL Pro/EMEA/LCK + Rocket League. Pas de Worlds (= event), pas
 *     de Valorant ni Counter-Strike.
 *
 * Si on veut couvrir ces ligues plus tard :
 *   - upgrade Patreon SportsDB ($3/mo) qui débloque l'index complet
 *   - OU intégrer une autre API (à ne PAS faire sans validation produit :
 *     les logos de marques type Wimbledon / F1 sont protégés).
 *
 * Pour rafraîchir le mapping : relancer
 * `npx tsx backend/scripts/sportsdb-investigate.ts` et fusionner le
 * JSON imprimé en fin d'exécution.
 */
export const LEAGUE_BADGES: Record<string, string | null> = {
  // Football
  "ligue-1": "https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png",
  "ligue-2": "https://r2.thesportsdb.com/images/media/league/badge/h7xx231601671132.png",
  "premier-league": "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",
  "la-liga": "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png",
  "serie-a": "https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png",
  bundesliga: "https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png",
  "champions-league": "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png",

  // Tennis — tours ATP/WTA trouvés via search_all_leagues.php?s=Tennis.
  // Grand Slams (roland-garros, wimbledon, us-open) indexés comme
  // events côté SportsDB → fallback SportIcon.
  "roland-garros": null,
  wimbledon: null,
  "us-open-tennis": null,
  atp: "https://r2.thesportsdb.com/images/media/league/badge/q7aej51769857150.png",
  wta: "https://r2.thesportsdb.com/images/media/league/badge/bddhun1768230678.png",

  // Basketball
  nba: "https://r2.thesportsdb.com/images/media/league/badge/frdjqy1536585083.png",
  euroleague: "https://r2.thesportsdb.com/images/media/league/badge/lk795c1545411843.png",

  // Rugby (Europe absente de SportsDB free → fallback)
  "top-14": null,
  "six-nations": null,

  // MMA — UFC trouvé via lookupleague.php?id=4443 (ID connu, l'audit
  // utilisateur l'avait pointé).
  ufc: "https://r2.thesportsdb.com/images/media/league/badge/bewnz31717531281.png",

  // Hockey
  nhl: "https://r2.thesportsdb.com/images/media/league/badge/4cem2k1619616539.png",

  // Auto — Formula 1 absente du tier free → fallback
  f1: null,

  // Esport — LCK/LEC/LPL trouvés via search_all_leagues.php?s=ESports.
  // Pour LCK, on prend l'id 4529 (Champions Korea) plutôt que 5875
  // (Challengers League) — c'est la division pro principale.
  lck: "https://r2.thesportsdb.com/images/media/league/badge/llpp2i1705953103.png",
  lec: "https://r2.thesportsdb.com/images/media/league/badge/djubyo1705150930.png",
  lpl: "https://r2.thesportsdb.com/images/media/league/badge/fqgzgl1706041210.png",
  // Worlds = event (pas une league), Valorant + CS2 absents de
  // l'esport tier free SportsDB → fallback
  "lol-worlds": null,
  valorant: null,
  cs2: null,
};

export function getLeagueLogo(leagueId: string): string | null {
  return LEAGUE_BADGES[leagueId] ?? null;
}
