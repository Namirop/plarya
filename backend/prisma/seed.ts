import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const DAY = 86400000;
const HOUR = 3600000;

interface ExpertSeed {
  email: string;
  pseudo: string;
  bio: string;
  sports: string[];
  /** Historical pronos: [matchName, league, pick, odds, teasing, result, daysAgo] */
  history: [string, string, string, number, string, string, number][];
  /** Today's pronos: [matchName, league, pick, odds, teasing] */
  today: [string, string, string, number, string][];
}

const EXPERTS: ExpertSeed[] = [
  {
    email: "expert@test.com",
    pseudo: "ExpertTest",
    bio: "Expert Football & Tennis — Analyses pointues",
    sports: ["FOOTBALL", "TENNIS"],
    history: [
      ["PSG - Marseille", "ligue-1", "PSG gagne", 1.85, "PICK_SOLIDE", "WON", 10],
      ["Nadal - Djokovic", "roland-garros", "Nadal en 4 sets", 2.1, "VALUE", "WON", 9],
      ["Lyon - Monaco", "ligue-1", "+2.5 buts", 1.72, "SAFE", "WON", 8],
      ["Liverpool - Arsenal", "premier-league", "Arsenal gagne", 3.2, "OPPORTUNITE", "LOST", 7],
      ["Bayern - Dortmund", "bundesliga", "Bayern gagne", 1.55, "PICK_SOLIDE", "WON", 6],
      ["Alcaraz - Sinner", "atp", "Alcaraz en 3", 2.4, "VALUE", "LOST", 5],
      ["Inter - Milan", "serie-a", "Inter gagne", 1.9, "SAFE", "WON", 4],
      ["Real - Atletico", "la-liga", "Real gagne", 1.7, "PICK_SOLIDE", "WON", 3],
      ["Lille - Lens", "ligue-1", "Lens +0.5", 1.65, "SAFE", "WON", 2],
      ["Medvedev - Rune", "wimbledon", "Medvedev gagne", 1.8, "PICK_SOLIDE", "WON", 1],
    ],
    today: [
      ["PSG - Lyon", "ligue-1", "PSG gagne", 1.75, "PICK_SOLIDE"],
      ["Djokovic - Alcaraz", "us-open-tennis", "Djokovic en 5", 2.8, "VALUE"],
      ["Marseille - Monaco", "ligue-1", "+2.5 buts", 1.9, "PICK_DU_JOUR"],
    ],
  },
  {
    email: "betking@test.com",
    pseudo: "BetKing",
    bio: "Le roi du foot — Ligue 1 & Premier League",
    sports: ["FOOTBALL"],
    history: [
      ["Chelsea - Tottenham", "premier-league", "Chelsea gagne", 2.0, "PICK_SOLIDE", "WON", 10],
      ["Barca - Real", "la-liga", "Barca gagne", 2.3, "VALUE", "LOST", 9],
      ["PSG - Lille", "ligue-1", "PSG gagne", 1.4, "SAFE", "WON", 8],
      ["Man City - Liverpool", "premier-league", "City gagne", 1.85, "PICK_SOLIDE", "WON", 7],
      ["Monaco - Nice", "ligue-1", "+1.5 buts", 1.3, "SAFE", "WON", 6],
      ["Juventus - Roma", "serie-a", "Juve gagne", 1.95, "VALUE", "LOST", 5],
      ["Arsenal - Newcastle", "premier-league", "Arsenal gagne", 1.6, "PICK_SOLIDE", "WON", 4],
      ["Lyon - Marseille", "ligue-1", "Nul", 3.4, "OPPORTUNITE", "LOST", 3],
      ["Aston Villa - West Ham", "premier-league", "Villa gagne", 1.75, "PICK_SOLIDE", "WON", 2],
      ["Rennes - Brest", "ligue-1", "Rennes gagne", 1.9, "SAFE", "WON", 1],
    ],
    today: [
      ["Brighton - Wolves", "premier-league", "Brighton gagne", 1.65, "SAFE"],
      ["Lens - Toulouse", "ligue-1", "+1.5 buts", 1.35, "OPPORTUNITE"],
    ],
  },
  {
    email: "tennisace@test.com",
    pseudo: "TennisAce",
    bio: "Spécialiste ATP & WTA — 90%+ de réussite",
    sports: ["TENNIS"],
    history: [
      ["Djokovic - Nadal", "roland-garros", "Djokovic gagne", 1.7, "PICK_SOLIDE", "WON", 10],
      ["Swiatek - Sabalenka", "wta", "Swiatek gagne", 1.55, "SAFE", "WON", 9],
      ["Sinner - Medvedev", "atp", "Sinner en 3", 2.1, "VALUE", "WON", 8],
      ["Alcaraz - Rune", "wimbledon", "Alcaraz gagne", 1.45, "SAFE", "WON", 7],
      ["Tsitsipas - Zverev", "atp", "Zverev gagne", 2.0, "OPPORTUNITE", "LOST", 6],
      ["Djokovic - Sinner", "atp", "Djokovic gagne", 1.8, "PICK_SOLIDE", "WON", 5],
      ["Gauff - Keys", "wta", "Gauff gagne", 1.6, "PICK_SOLIDE", "WON", 4],
      ["Alcaraz - Djokovic", "us-open-tennis", "Alcaraz gagne", 2.2, "VALUE", "WON", 3],
      ["Sinner - Alcaraz", "atp", "Sinner gagne", 1.9, "PICK_SOLIDE", "WON", 2],
      ["Medvedev - Fritz", "atp", "Medvedev gagne", 1.65, "SAFE", "WON", 1],
    ],
    today: [
      ["Djokovic - Alcaraz", "roland-garros", "Djokovic en 4", 2.4, "A_NE_PAS_RATER"],
    ],
  },
  {
    email: "multisport@test.com",
    pseudo: "MultiSport",
    bio: "Basket, MMA, Foot — Le touche-à-tout",
    sports: ["BASKETBALL", "MMA", "FOOTBALL"],
    history: [
      ["Lakers - Celtics", "nba", "Lakers gagnent", 2.3, "VALUE", "WON", 10],
      ["UFC 300 Main", "ufc", "Jones par KO", 1.8, "PICK_SOLIDE", "LOST", 9],
      ["PSG - Lyon", "ligue-1", "PSG gagne", 1.5, "SAFE", "WON", 8],
      ["Warriors - Bucks", "nba", "Warriors gagnent", 2.5, "OPPORTUNITE", "LOST", 7],
      ["UFC Paris", "ufc", "Gane par TKO", 2.0, "PICK_DU_JOUR", "WON", 6],
      ["Nuggets - Heat", "nba", "Nuggets gagnent", 1.6, "SAFE", "WON", 5],
      ["Man Utd - Chelsea", "premier-league", "Nul", 3.2, "VALUE", "LOST", 4],
      ["UFC 301", "ufc", "Topuria gagne", 1.7, "PICK_SOLIDE", "WON", 3],
      ["Mavs - Thunder", "nba", "Thunder gagnent", 1.85, "PICK_SOLIDE", "LOST", 2],
      ["Barca - Atlético", "la-liga", "Barca gagne", 1.9, "SAFE", "WON", 1],
    ],
    today: [
      ["Celtics - Knicks", "nba", "Celtics gagnent", 1.7, "VALUE"],
      ["UFC Fight Night", "ufc", "Pantoja par sub", 2.5, "PICK_SOLIDE"],
    ],
  },
  {
    email: "rugbypro@test.com",
    pseudo: "RugbyPro",
    bio: "Top 14 & Six Nations — L'expert ovale",
    sports: ["RUGBY"],
    history: [
      ["Toulouse - La Rochelle", "top-14", "Toulouse gagne", 1.5, "SAFE", "WON", 10],
      ["France - Irlande", "six-nations", "France gagne", 2.1, "VALUE", "WON", 9],
      ["Racing - Toulon", "top-14", "Racing gagne", 1.8, "PICK_SOLIDE", "LOST", 8],
      ["Angleterre - Galles", "six-nations", "+40 pts", 1.7, "SAFE", "WON", 7],
      ["Bordeaux - Clermont", "top-14", "Bordeaux gagne", 1.6, "PICK_SOLIDE", "WON", 6],
      ["NZ - Australie", "six-nations", "NZ gagne", 1.3, "SAFE", "WON", 5],
      ["Stade Fr - Lyon", "top-14", "Lyon gagne", 2.4, "OPPORTUNITE", "LOST", 4],
      ["Castres - Pau", "top-14", "+30 pts", 1.55, "SAFE", "LOST", 3],
    ],
    today: [["Toulouse - Racing", "top-14", "Toulouse gagne", 1.45, "SAFE"]],
  },
  {
    email: "esportguru@test.com",
    pseudo: "EsportGuru",
    bio: "LoL, CS2, Valorant — Le guru du gaming",
    sports: ["ESPORT"],
    history: [
      ["T1 - Gen.G", "lck", "T1 gagne", 1.9, "PICK_SOLIDE", "WON", 10],
      ["Navi - FaZe", "cs2", "Navi gagne", 2.1, "VALUE", "WON", 9],
      ["Fnatic - G2", "lec", "Fnatic gagne", 1.7, "PICK_SOLIDE", "WON", 8],
      ["SEN - LOUD", "valorant", "SEN gagne", 2.3, "OPPORTUNITE", "WON", 7],
      ["BLG - JDG", "lpl", "BLG gagne", 1.8, "SAFE", "WON", 6],
      ["Vitality - Spirit", "cs2", "Vitality gagne", 1.6, "PICK_SOLIDE", "WON", 5],
      ["T1 - DRX", "lol-worlds", "T1 gagne", 1.5, "SAFE", "WON", 4],
      ["Navi - Astralis", "cs2", "Navi gagne", 1.4, "SAFE", "WON", 3],
      ["G2 - MAD", "lec", "G2 gagne", 1.75, "PICK_SOLIDE", "WON", 2],
      ["SEN - Paper Rex", "valorant", "SEN gagne", 2.0, "VALUE", "WON", 1],
    ],
    today: [
      ["T1 - HLE", "lck", "T1 gagne", 1.65, "PICK_DU_JOUR"],
      ["Navi - Heroic", "cs2", "Navi 2-0", 2.2, "VALUE"],
    ],
  },
];

async function createTestMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h for test links

  await prisma.magicLink.create({
    data: { token, email, expiresAt },
  });

  return token;
}

// Liste des emails contrôlés par le seed. Toutes les opérations de
// nettoyage en mode "soft" (default) sont scopées à ces emails →
// les comptes réels créés via paiement Stripe (ex: romainmaes@…) ne
// sont JAMAIS effacés par `npm run db:seed`.
const SEEDED_EMAILS = [
  "admin@test.com",
  "user@test.com",
  ...EXPERTS.map((e) => e.email),
];

// Flag --reset : wipe COMPLET de la DB avant re-seed. Pour repartir
// 100 % from scratch (utile quand les schemas ont divergé, ou pour
// reset un environnement de test pollué).
// Usage : `npm run db:seed:reset`
const RESET_DB = process.argv.includes("--reset");

async function wipeAll(): Promise<void> {
  // Ordre FK-aware : enfants → parents (les FK Cascade gèreraient
  // mais on est explicite pour la lisibilité).
  await prisma.stripeWebhookEvent.deleteMany({});
  await prisma.pronoBookmakerOdds.deleteMany({});
  await prisma.affiliateLink.deleteMany({});
  await prisma.bookmaker.deleteMany({});
  await prisma.prono.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.magicLink.deleteMany({});
  await prisma.expert.deleteMany({});
  await prisma.user.deleteMany({});
}

async function main() {
  console.log("Seeding database...\n");

  if (RESET_DB) {
    console.log("⚠️  --reset : wiping ALL data before seed\n");
    await wipeAll();
    console.log("✓ All tables wiped\n");
  }

  const now = Date.now();
  const testLinks: { email: string; role: string; url: string }[] = [];

  // Admin user
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@test.com",
      role: "ADMIN",
    },
  });
  const adminToken = await createTestMagicLink("admin@test.com");
  testLinks.push({
    email: "admin@test.com",
    role: "ADMIN",
    url: `${BACKEND_URL}/auth/verify?token=${adminToken}`,
  });

  // Regular test user
  await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: { email: "user@test.com" },
  });
  const userToken = await createTestMagicLink("user@test.com");
  testLinks.push({
    email: "user@test.com",
    role: "USER",
    url: `${BACKEND_URL}/auth/verify?token=${userToken}`,
  });

  for (const e of EXPERTS) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        email: e.email,
        role: "EXPERT",
      },
    });

    // Create test magic link
    const token = await createTestMagicLink(e.email);
    testLinks.push({
      email: e.email,
      role: "EXPERT",
      url: `${BACKEND_URL}/auth/verify?token=${token}`,
    });

    // Upsert expert profile
    const expert = await prisma.expert.upsert({
      where: { userId: user.id },
      update: { dayPassPrice: 350, viewsToday: Math.floor(Math.random() * 300), photoUrl: "/profile.jpg" },
      create: {
        userId: user.id,
        pseudo: e.pseudo,
        bio: e.bio,
        sports: e.sports,
        subStatus: "FREE",
        viewsToday: Math.floor(Math.random() * 300),
        photoUrl: "/profile.jpg",
      },
    });

    // Delete existing pronos and recreate with fresh dates
    await prisma.prono.deleteMany({ where: { expertId: expert.id } });

    // Historical pronos — startTime = createdAt (already past)
    const historyData = e.history.map(
      ([matchName, league, pick, odds, teasing, result, daysAgo]) => {
        const createdAt = new Date(now - daysAgo * DAY);
        return {
          expertId: expert.id,
          matchName,
          league,
          pick,
          odds,
          teasing: teasing as
            | "PICK_SOLIDE"
            | "VALUE"
            | "SAFE"
            | "OPPORTUNITE"
            | "PICK_DU_JOUR"
            | "A_NE_PAS_RATER",
          argument: `Analyse détaillée pour ${matchName}.`,
          result: result as "WON" | "LOST",
          startTime: createdAt,
          createdAt,
        };
      },
    );

    // Today's pronos — varied startTime
    // EsportGuru (last expert): all analyses in the past (to test "terminated" state)
    const allPast = e.email === "esportguru@test.com";
    // startTime offsets from now : on génère des fenêtres de test
    // confortables (+6 h, +12 h, +18 h) pour qu'un seed lancé le matin
    // reste valable toute la journée. Pour les experts qui ont au
    // moins 2 pronos du jour, on garde le premier dans le passé
    // (-1 h) pour démontrer le rendu "match commencé" (opacity-50).
    // TennisAce n'a qu'un seul prono → forcé futur pour rester
    // testable (sinon "Toutes les analyses sont terminées").
    const startTimeOffsets = allPast
      ? e.today.map((_, i) => -(i + 1) * HOUR) // all in the past
      : e.today.length === 1
        ? [6 * HOUR]
        : e.today.map((_, i) => (i === 0 ? -1 * HOUR : i * 6 * HOUR));

    const todayData = e.today.map(
      ([matchName, league, pick, odds, teasing], i) => ({
        expertId: expert.id,
        matchName,
        league,
        pick,
        odds,
        teasing: teasing as
          | "PICK_SOLIDE"
          | "VALUE"
          | "SAFE"
          | "OPPORTUNITE"
          | "PICK_DU_JOUR"
          | "A_NE_PAS_RATER",
        argument: `Argumentaire pour ${matchName}.`,
        result: "PENDING" as const,
        startTime: new Date(now + startTimeOffsets[i]),
        isFeatured: i === 0,
        createdAt: new Date(now - (e.today.length - i) * HOUR),
      }),
    );

    await prisma.prono.createMany({ data: [...historyData, ...todayData] });
    console.log(
      `  ${e.pseudo}: ${historyData.length} history + ${todayData.length} today`,
    );
  }

  // ── Seed Test Subscriptions ──
  console.log("\nSeeding test subscriptions...");

  // Delete existing test subscriptions. SCOPED aux users seedés
  // uniquement : un user réel (ex: romainmaes@outlook.fr qui aurait
  // acheté un day pass) garde ses subscriptions. En mode --reset
  // c'est un no-op (table déjà vidée par wipeAll()).
  await prisma.subscription.deleteMany({
    where: { user: { email: { in: SEEDED_EMAILS } } },
  });

  // Get all experts and the test user
  const allExperts = await prisma.expert.findMany({ select: { id: true, pseudo: true, dayPassPrice: true, monthlyPrice: true } });
  const testUser = await prisma.user.findUnique({ where: { email: "user@test.com" } });

  if (testUser && allExperts.length >= 3) {
    const subData = [
      // Recent day passes (varying dates over the last 30 days)
      { userId: testUser.id, expertId: allExperts[0].id, type: "DAY_PASS" as const, daysAgo: 1 },
      { userId: testUser.id, expertId: allExperts[1].id, type: "DAY_PASS" as const, daysAgo: 3 },
      { userId: testUser.id, expertId: allExperts[0].id, type: "DAY_PASS" as const, daysAgo: 5 },
      { userId: testUser.id, expertId: allExperts[2].id, type: "MONTHLY" as const, daysAgo: 7 },
      { userId: testUser.id, expertId: allExperts[0].id, type: "DAY_PASS" as const, daysAgo: 10 },
      { userId: testUser.id, expertId: allExperts[1].id, type: "DAY_PASS" as const, daysAgo: 12 },
      { userId: testUser.id, expertId: allExperts[3].id, type: "DAY_PASS" as const, daysAgo: 15 },
      { userId: testUser.id, expertId: allExperts[2].id, type: "DAY_PASS" as const, daysAgo: 18 },
      { userId: testUser.id, expertId: allExperts[0].id, type: "DAY_PASS" as const, daysAgo: 20 },
      { userId: testUser.id, expertId: allExperts[4].id, type: "MONTHLY" as const, daysAgo: 22 },
      { userId: testUser.id, expertId: allExperts[1].id, type: "DAY_PASS" as const, daysAgo: 25 },
      { userId: testUser.id, expertId: allExperts[0].id, type: "DAY_PASS" as const, daysAgo: 28 },
    ];

    // Also add purchases from expert accounts (simulating other users buying)
    for (const e of allExperts.slice(0, 3)) {
      const expertUser = await prisma.user.findFirst({
        where: { expert: { id: e.id } },
        select: { id: true },
      });
      if (!expertUser) continue;
      // Each expert buys from other experts
      for (const other of allExperts.filter((o) => o.id !== e.id).slice(0, 2)) {
        subData.push({
          userId: expertUser.id,
          expertId: other.id,
          type: "DAY_PASS" as const,
          daysAgo: Math.floor(Math.random() * 25) + 1,
        });
      }
    }

    for (const sub of subData) {
      const createdAt = new Date(now - sub.daysAgo * DAY);
      const expiresAt = sub.type === "DAY_PASS"
        ? new Date(createdAt.getTime() + DAY)
        : new Date(createdAt.getTime() + 30 * DAY);
      const isActive = expiresAt > new Date();

      await prisma.subscription.create({
        data: {
          userId: sub.userId,
          expertId: sub.expertId,
          type: sub.type,
          status: isActive ? "ACTIVE" : "EXPIRED",
          expiresAt,
          createdAt,
        },
      });
    }

    console.log(`  Created ${subData.length} test subscriptions`);
  }

  // ── Seed Bookmakers ──
  console.log("\nSeeding bookmakers...");

  const bookmakerData = [
    {
      name: "Winamax",
      logoUrl: "/bookmakers/winamax.svg",
      affiliateUrl: "https://www.winamax.fr/?ref=plarya",
      label: "Accéder +100€",
    },
    {
      name: "Betclic",
      logoUrl: "/bookmakers/betclic.svg",
      affiliateUrl: "https://www.betclic.fr/?ref=plarya",
      label: "Accéder +100€",
    },
    {
      name: "PMU",
      logoUrl: "/bookmakers/pmu.svg",
      affiliateUrl: "https://www.pmu.fr/?ref=plarya",
      label: "Accéder +100€",
    },
  ];

  const bookmakers = [];
  for (const bm of bookmakerData) {
    const bookmaker = await prisma.bookmaker.upsert({
      where: { name: bm.name },
      update: { logoUrl: bm.logoUrl },
      create: { name: bm.name, logoUrl: bm.logoUrl },
    });

    await prisma.affiliateLink.deleteMany({
      where: { bookmakerId: bookmaker.id },
    });
    await prisma.affiliateLink.create({
      data: {
        bookmakerId: bookmaker.id,
        url: bm.affiliateUrl,
        label: bm.label,
      },
    });

    bookmakers.push(bookmaker);
    console.log(`  Bookmaker: ${bm.name}`);
  }

  // ── Seed PronoBookmakerOdds for all existing pronos ──
  console.log("\nSeeding bookmaker odds...");

  const allPronos = await prisma.prono.findMany({
    select: { id: true, odds: true },
  });
  await prisma.pronoBookmakerOdds.deleteMany({});

  const oddsVariations = [0.02, -0.03, -0.05]; // Winamax slightly higher, others lower
  for (const prono of allPronos) {
    for (let i = 0; i < bookmakers.length; i++) {
      await prisma.pronoBookmakerOdds.create({
        data: {
          pronoId: prono.id,
          bookmakerId: bookmakers[i].id,
          odds: Math.round((prono.odds + oddsVariations[i]) * 100) / 100,
        },
      });
    }
  }

  console.log(`  Added bookmaker odds for ${allPronos.length} pronos`);

  // ── Print test login links ──
  console.log("\n════════════════════════════════════════════════");
  console.log("  TEST LOGIN LINKS (valid 24h, single use)");
  console.log("════════════════════════════════════════════════\n");
  for (const link of testLinks) {
    console.log(`  [${link.role}] ${link.email}`);
    console.log(`  ${link.url}\n`);
  }
  console.log("════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
