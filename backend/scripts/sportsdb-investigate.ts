/**
 * Investigation exhaustive SportsDB pour les ligues manquantes.
 * Dump complet (sans tronquer) de tous les endpoints utiles, sortie
 * structurée pour identifier les badges des ligues que CC a loupé
 * au premier passage.
 *
 * Usage : npx tsx scripts/sportsdb-investigate.ts
 */

interface SportsDbLeague {
  idLeague: string;
  strLeague: string;
  strBadge: string | null;
  strSport?: string;
}

interface SportsDbResponse {
  leagues?: SportsDbLeague[] | null;
  // Quirk de l'API : search_all_leagues.php renvoie les ligues sous
  // la clé `countries` (legacy naming), pas `leagues`. lookupleague.php
  // renvoie `leagues`. On lit les deux par sécurité.
  countries?: SportsDbLeague[] | null;
}

async function fetchJson(url: string): Promise<SportsDbResponse> {
  const res = await fetch(url);
  if (!res.ok) return {};
  return res.json() as Promise<SportsDbResponse>;
}

async function dumpSport(sport: string): Promise<SportsDbLeague[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=${encodeURIComponent(sport)}`;
  const data = await fetchJson(url);
  return data.countries ?? data.leagues ?? [];
}

function matchesAny(name: string, terms: string[]): boolean {
  const n = name.toLowerCase();
  return terms.some((t) => n.includes(t.toLowerCase()));
}

interface Target {
  slug: string;
  searchTerms: string[]; // termes à matcher dans strLeague
  sports: string[]; // sports SportsDB où chercher
  knownId?: number; // si on a un ID confirmé
}

const TARGETS: Target[] = [
  // Tennis Grand Slams + tours
  { slug: "roland-garros", searchTerms: ["roland", "french open"], sports: ["Tennis"] },
  { slug: "wimbledon", searchTerms: ["wimbledon"], sports: ["Tennis"] },
  { slug: "us-open-tennis", searchTerms: ["us open"], sports: ["Tennis"] },
  { slug: "atp", searchTerms: ["atp"], sports: ["Tennis"] },
  { slug: "wta", searchTerms: ["wta"], sports: ["Tennis"] },
  // Rugby
  { slug: "top-14", searchTerms: ["top 14"], sports: ["Rugby"] },
  { slug: "six-nations", searchTerms: ["six nations", "6 nations"], sports: ["Rugby"] },
  // MMA
  { slug: "ufc", searchTerms: ["ufc"], sports: ["Fighting"], knownId: 4443 },
  // Motorsport
  { slug: "f1", searchTerms: ["formula 1", "f1", "formula one"], sports: ["Motorsport"] },
  // Esport
  { slug: "lck", searchTerms: ["champions korea", "lck"], sports: ["ESports"] },
  { slug: "lec", searchTerms: ["emea championship", "lec"], sports: ["ESports"] },
  { slug: "lpl", searchTerms: ["pro league", "lpl"], sports: ["ESports"] },
  { slug: "lol-worlds", searchTerms: ["world championship", "worlds"], sports: ["ESports"] },
  { slug: "valorant", searchTerms: ["valorant"], sports: ["ESports"] },
  { slug: "cs2", searchTerms: ["counter", "cs:go", "cs2"], sports: ["ESports"] },
];

async function main() {
  // 1. Dump complet de chaque sport pertinent. Cache local pour
  //    ne pas re-frapper pour chaque target.
  const sportsToScan = Array.from(new Set(TARGETS.flatMap((t) => t.sports)));
  const sportLeagues = new Map<string, SportsDbLeague[]>();
  for (const sport of sportsToScan) {
    console.error(`\n=== Dump sport "${sport}" ===`);
    const leagues = await dumpSport(sport);
    sportLeagues.set(sport, leagues);
    console.error(`  ${leagues.length} ligues trouvées`);
    for (const l of leagues) {
      console.error(
        `    [${l.idLeague.padStart(4)}] ${l.strLeague.padEnd(50)} ${l.strBadge ? "✓" : "—"}`,
      );
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  // 2. Pour chaque target, on cherche la meilleure correspondance.
  console.error("\n\n=== Matching ===");
  const found: Record<string, { id: string; name: string; badge: string | null } | null> = {};
  for (const t of TARGETS) {
    if (t.knownId) {
      // ID connu : on lookup direct
      const data = await fetchJson(
        `https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id=${t.knownId}`,
      );
      const l = data.leagues?.[0];
      if (l) {
        found[t.slug] = { id: l.idLeague, name: l.strLeague, badge: l.strBadge };
        console.error(
          `${t.slug.padEnd(25)} → [knownId=${t.knownId}] ${l.strLeague} | ${l.strBadge ?? "no badge"}`,
        );
        continue;
      }
    }
    // Recherche dans les sports déclarés
    const candidates: SportsDbLeague[] = [];
    for (const sport of t.sports) {
      const leagues = sportLeagues.get(sport) ?? [];
      candidates.push(...leagues.filter((l) => matchesAny(l.strLeague, t.searchTerms)));
    }
    if (candidates.length === 0) {
      found[t.slug] = null;
      console.error(`${t.slug.padEnd(25)} → NOT FOUND`);
    } else if (candidates.length === 1) {
      const l = candidates[0];
      found[t.slug] = { id: l.idLeague, name: l.strLeague, badge: l.strBadge };
      console.error(`${t.slug.padEnd(25)} → ${l.strLeague} | ${l.strBadge ?? "no badge"}`);
    } else {
      console.error(`${t.slug.padEnd(25)} → ${candidates.length} candidates :`);
      for (const c of candidates) {
        console.error(`    [${c.idLeague}] ${c.strLeague} | ${c.strBadge ?? "no badge"}`);
      }
      // Best heuristic : la 1re avec un badge non null
      const best = candidates.find((c) => c.strBadge) ?? candidates[0];
      found[t.slug] = { id: best.idLeague, name: best.strLeague, badge: best.strBadge };
      console.error(`   → chosen: [${best.idLeague}] ${best.strLeague}`);
    }
  }

  // 3. Validation HTTP des badges retenus
  console.error("\n\n=== Badge HTTP probe ===");
  for (const [slug, f] of Object.entries(found)) {
    if (!f?.badge) {
      console.error(`${slug.padEnd(25)} : no badge`);
      continue;
    }
    try {
      const res = await fetch(f.badge, { method: "HEAD" });
      console.error(`${slug.padEnd(25)} : HTTP ${res.status} (${f.badge.slice(-20)})`);
    } catch (err) {
      console.error(`${slug.padEnd(25)} : FETCH ERROR ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  // 4. Fallback : pour chaque target encore NOT FOUND, on tente
  //    searchleagues.php?l=<terme> qui fait une fuzzy search globale.
  console.error("\n\n=== Fallback searchleagues.php ===");
  for (const t of TARGETS) {
    if (found[t.slug]?.badge) continue; // déjà trouvé
    for (const term of t.searchTerms) {
      const url = `https://www.thesportsdb.com/api/v1/json/3/searchleagues.php?l=${encodeURIComponent(term)}`;
      const data = await fetchJson(url);
      const leagues = data.leagues ?? data.countries ?? [];
      if (leagues.length === 0) {
        console.error(`${t.slug.padEnd(25)} [${term}] → 0 result`);
        continue;
      }
      console.error(`${t.slug.padEnd(25)} [${term}] → ${leagues.length} result(s):`);
      for (const l of leagues) {
        console.error(
          `    [${l.idLeague}] ${l.strLeague} (${l.strSport ?? "?"}) | ${l.strBadge ?? "no badge"}`,
        );
      }
      // Si on trouve un match propre (substring case-insensitive
      // dans le bon sport), on l'enregistre.
      const match = leagues.find(
        (l) =>
          matchesAny(l.strLeague, t.searchTerms) &&
          (t.sports.length === 0 ||
            t.sports.some((s) => (l.strSport ?? "").toLowerCase().includes(s.toLowerCase()))),
      );
      if (match && match.strBadge) {
        found[t.slug] = {
          id: match.idLeague,
          name: match.strLeague,
          badge: match.strBadge,
        };
        console.error(`    → kept ${match.strLeague}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  // 5. Output JSON final
  console.log("\n\n// Mapping JSON à fusionner dans LEAGUE_BADGES :\n");
  console.log(
    JSON.stringify(
      Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v?.badge ?? null])),
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
