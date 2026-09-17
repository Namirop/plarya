/**
 * Slug de ligue → URL du badge TheSportsDB, figé ici plutôt que récupéré à
 * chaque rendu (liste stable, pas de dépendance réseau à l'API). `null` =
 * ligue absente de l'offre gratuite de TheSportsDB (Grand Chelem et Worlds
 * indexés comme événements, rugby européen, F1, Valorant, CS2) : l'UI
 * affiche alors l'icône du sport.
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

  // Tennis
  "roland-garros": null,
  wimbledon: null,
  "us-open-tennis": null,
  atp: "https://r2.thesportsdb.com/images/media/league/badge/q7aej51769857150.png",
  wta: "https://r2.thesportsdb.com/images/media/league/badge/bddhun1768230678.png",

  // Basketball
  nba: "https://r2.thesportsdb.com/images/media/league/badge/frdjqy1536585083.png",
  euroleague: "https://r2.thesportsdb.com/images/media/league/badge/lk795c1545411843.png",

  // Rugby
  "top-14": null,
  "six-nations": null,

  // MMA
  ufc: "https://r2.thesportsdb.com/images/media/league/badge/bewnz31717531281.png",

  // Hockey
  nhl: "https://r2.thesportsdb.com/images/media/league/badge/4cem2k1619616539.png",

  // Sport automobile
  f1: null,

  // Esport (LCK : LoL Champions Korea, pas la Challengers League)
  lck: "https://r2.thesportsdb.com/images/media/league/badge/llpp2i1705953103.png",
  lec: "https://r2.thesportsdb.com/images/media/league/badge/djubyo1705150930.png",
  lpl: "https://r2.thesportsdb.com/images/media/league/badge/fqgzgl1706041210.png",
  "lol-worlds": null,
  valorant: null,
  cs2: null,
};
