/**
 * Récupère TOUTES les ligues SportsDB (all_leagues.php) et grep
 * agressivement pour chaque target. Le but : être SÛR qu'on a couvert
 * tout ce que SportsDB indexe, vs se contenter du dump par sport qui
 * peut renvoyer une sous-liste truncée.
 */

interface AllLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
}

const TARGETS: Array<{ slug: string; terms: string[] }> = [
  { slug: "roland-garros", terms: ["roland", "french open"] },
  { slug: "wimbledon", terms: ["wimbledon"] },
  { slug: "us-open-tennis", terms: ["us open"] },
  { slug: "top-14", terms: ["top 14", "top14"] },
  { slug: "six-nations", terms: ["six nations", "6 nations"] },
  { slug: "f1", terms: ["formula 1", "formula one", "f1 ", "grand prix"] },
  { slug: "lol-worlds", terms: ["world championship", "lol worlds"] },
  { slug: "valorant", terms: ["valorant"] },
  { slug: "cs2", terms: ["counter-strike", "counter strike", "cs:go", "csgo", " cs2"] },
];

async function main() {
  const res = await fetch("https://www.thesportsdb.com/api/v1/json/3/all_leagues.php");
  const data = (await res.json()) as { leagues: AllLeague[] };
  console.error(`Total leagues in SportsDB: ${data.leagues.length}\n`);

  for (const t of TARGETS) {
    const matches = data.leagues.filter((l) =>
      t.terms.some((term) => l.strLeague.toLowerCase().includes(term.toLowerCase())),
    );
    if (matches.length === 0) {
      console.error(`${t.slug.padEnd(20)} : NO MATCH in entire SportsDB index`);
    } else {
      console.error(`${t.slug.padEnd(20)} : ${matches.length} match(es)`);
      for (const m of matches) {
        console.error(`    [${m.idLeague}] ${m.strLeague} (${m.strSport})`);
      }
    }
  }

  // Bonus : dump tous les sports pour vérifier si F1 / esport spécifique
  // sont catégorisés ailleurs
  const sportsCount = new Map<string, number>();
  for (const l of data.leagues) {
    sportsCount.set(l.strSport, (sportsCount.get(l.strSport) ?? 0) + 1);
  }
  console.error("\n\n=== Sport categories ===");
  for (const [sport, count] of Array.from(sportsCount.entries()).sort()) {
    console.error(`  ${sport.padEnd(25)} : ${count} leagues`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
