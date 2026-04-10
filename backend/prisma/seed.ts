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

interface TipsterSeed {
  email: string;
  pseudo: string;
  bio: string;
  sports: string[];
  /** Historical pronos: [matchName, league, pick, odds, teasing, result, daysAgo] */
  history: [string, string, string, number, string, string, number][];
  /** Today's pronos: [matchName, league, pick, odds, teasing] */
  today: [string, string, string, number, string][];
}

const TIPSTERS: TipsterSeed[] = [
  {
    email: "tipster@test.com",
    pseudo: "TipsterTest",
    bio: "Expert Football & Tennis — Analyses pointues",
    sports: ["FOOTBALL", "TENNIS"],
    history: [
      ["PSG - Marseille", "Ligue 1", "PSG gagne", 1.85, "PICK_SOLIDE", "WON", 10],
      ["Nadal - Djokovic", "Roland Garros", "Nadal en 4 sets", 2.1, "VALUE", "WON", 9],
      ["Lyon - Monaco", "Ligue 1", "+2.5 buts", 1.72, "SAFE", "WON", 8],
      ["Liverpool - Arsenal", "Premier League", "Arsenal gagne", 3.2, "OPPORTUNITE", "LOST", 7],
      ["Bayern - Dortmund", "Bundesliga", "Bayern gagne", 1.55, "PICK_SOLIDE", "WON", 6],
      ["Alcaraz - Sinner", "ATP Finals", "Alcaraz en 3", 2.4, "VALUE", "LOST", 5],
      ["Inter - Milan", "Serie A", "Inter gagne", 1.9, "SAFE", "WON", 4],
      ["Real - Atletico", "La Liga", "Real gagne", 1.7, "PICK_SOLIDE", "WON", 3],
      ["Lille - Lens", "Ligue 1", "Lens +0.5", 1.65, "SAFE", "WON", 2],
      ["Medvedev - Rune", "Wimbledon", "Medvedev gagne", 1.8, "PICK_SOLIDE", "WON", 1],
    ],
    today: [
      ["PSG - Lyon", "Ligue 1", "PSG gagne", 1.75, "PICK_SOLIDE"],
      ["Djokovic - Alcaraz", "US Open", "Djokovic en 5", 2.8, "VALUE"],
      ["Marseille - Monaco", "Ligue 1", "+2.5 buts", 1.9, "PICK_DU_JOUR"],
    ],
  },
  {
    email: "betking@test.com",
    pseudo: "BetKing",
    bio: "Le roi du foot — Ligue 1 & Premier League",
    sports: ["FOOTBALL"],
    history: [
      ["Chelsea - Tottenham", "Premier League", "Chelsea gagne", 2.0, "PICK_SOLIDE", "WON", 10],
      ["Barca - Real", "La Liga", "Barca gagne", 2.3, "VALUE", "LOST", 9],
      ["PSG - Lille", "Ligue 1", "PSG gagne", 1.4, "SAFE", "WON", 8],
      ["Man City - Liverpool", "Premier League", "City gagne", 1.85, "PICK_SOLIDE", "WON", 7],
      ["Monaco - Nice", "Ligue 1", "+1.5 buts", 1.3, "SAFE", "WON", 6],
      ["Juventus - Roma", "Serie A", "Juve gagne", 1.95, "VALUE", "LOST", 5],
      ["Arsenal - Newcastle", "Premier League", "Arsenal gagne", 1.6, "PICK_SOLIDE", "WON", 4],
      ["Lyon - Marseille", "Ligue 1", "Nul", 3.4, "OPPORTUNITE", "LOST", 3],
      ["Aston Villa - West Ham", "Premier League", "Villa gagne", 1.75, "PICK_SOLIDE", "WON", 2],
      ["Rennes - Brest", "Ligue 1", "Rennes gagne", 1.9, "SAFE", "WON", 1],
    ],
    today: [
      ["Brighton - Wolves", "Premier League", "Brighton gagne", 1.65, "SAFE"],
      ["Lens - Toulouse", "Ligue 1", "+1.5 buts", 1.35, "OPPORTUNITE"],
    ],
  },
  {
    email: "tennisace@test.com",
    pseudo: "TennisAce",
    bio: "Spécialiste ATP & WTA — 90%+ de réussite",
    sports: ["TENNIS"],
    history: [
      ["Djokovic - Nadal", "RG", "Djokovic gagne", 1.7, "PICK_SOLIDE", "WON", 10],
      ["Swiatek - Sabalenka", "WTA", "Swiatek gagne", 1.55, "SAFE", "WON", 9],
      ["Sinner - Medvedev", "ATP", "Sinner en 3", 2.1, "VALUE", "WON", 8],
      ["Alcaraz - Rune", "Wimbledon", "Alcaraz gagne", 1.45, "SAFE", "WON", 7],
      ["Tsitsipas - Zverev", "ATP", "Zverev gagne", 2.0, "OPPORTUNITE", "LOST", 6],
      ["Djokovic - Sinner", "ATP Finals", "Djokovic gagne", 1.8, "PICK_SOLIDE", "WON", 5],
      ["Gauff - Keys", "WTA", "Gauff gagne", 1.6, "PICK_SOLIDE", "WON", 4],
      ["Alcaraz - Djokovic", "US Open", "Alcaraz gagne", 2.2, "VALUE", "WON", 3],
      ["Sinner - Alcaraz", "ATP", "Sinner gagne", 1.9, "PICK_SOLIDE", "WON", 2],
      ["Medvedev - Fritz", "ATP", "Medvedev gagne", 1.65, "SAFE", "WON", 1],
    ],
    today: [
      ["Djokovic - Alcaraz", "Roland Garros", "Djokovic en 4", 2.4, "A_NE_PAS_RATER"],
    ],
  },
  {
    email: "multisport@test.com",
    pseudo: "MultiSport",
    bio: "Basket, MMA, Foot — Le touche-à-tout",
    sports: ["BASKETBALL", "MMA", "FOOTBALL"],
    history: [
      ["Lakers - Celtics", "NBA", "Lakers gagnent", 2.3, "VALUE", "WON", 10],
      ["UFC 300 Main", "UFC", "Jones par KO", 1.8, "PICK_SOLIDE", "LOST", 9],
      ["PSG - Lyon", "Ligue 1", "PSG gagne", 1.5, "SAFE", "WON", 8],
      ["Warriors - Bucks", "NBA", "Warriors gagnent", 2.5, "OPPORTUNITE", "LOST", 7],
      ["UFC Paris", "UFC", "Gane par TKO", 2.0, "PICK_DU_JOUR", "WON", 6],
      ["Nuggets - Heat", "NBA", "Nuggets gagnent", 1.6, "SAFE", "WON", 5],
      ["Man Utd - Chelsea", "PL", "Nul", 3.2, "VALUE", "LOST", 4],
      ["UFC 301", "UFC", "Topuria gagne", 1.7, "PICK_SOLIDE", "WON", 3],
      ["Mavs - Thunder", "NBA", "Thunder gagnent", 1.85, "PICK_SOLIDE", "LOST", 2],
      ["Barca - Atlético", "La Liga", "Barca gagne", 1.9, "SAFE", "WON", 1],
    ],
    today: [
      ["Celtics - Knicks", "NBA", "Celtics gagnent", 1.7, "VALUE"],
      ["UFC Fight Night", "UFC", "Pantoja par sub", 2.5, "PICK_SOLIDE"],
    ],
  },
  {
    email: "rugbypro@test.com",
    pseudo: "RugbyPro",
    bio: "Top 14 & Six Nations — L'expert ovale",
    sports: ["RUGBY"],
    history: [
      ["Toulouse - La Rochelle", "Top 14", "Toulouse gagne", 1.5, "SAFE", "WON", 10],
      ["France - Irlande", "6 Nations", "France gagne", 2.1, "VALUE", "WON", 9],
      ["Racing - Toulon", "Top 14", "Racing gagne", 1.8, "PICK_SOLIDE", "LOST", 8],
      ["Angleterre - Galles", "6 Nations", "+40 pts", 1.7, "SAFE", "WON", 7],
      ["Bordeaux - Clermont", "Top 14", "Bordeaux gagne", 1.6, "PICK_SOLIDE", "WON", 6],
      ["NZ - Australie", "RC", "NZ gagne", 1.3, "SAFE", "WON", 5],
      ["Stade Fr - Lyon", "Top 14", "Lyon gagne", 2.4, "OPPORTUNITE", "LOST", 4],
      ["Castres - Pau", "Top 14", "+30 pts", 1.55, "SAFE", "LOST", 3],
    ],
    today: [["Toulouse - Racing", "Top 14", "Toulouse gagne", 1.45, "SAFE"]],
  },
  {
    email: "esportguru@test.com",
    pseudo: "EsportGuru",
    bio: "LoL, CS2, Valorant — Le guru du gaming",
    sports: ["ESPORT"],
    history: [
      ["T1 - Gen.G", "LCK", "T1 gagne", 1.9, "PICK_SOLIDE", "WON", 10],
      ["Navi - FaZe", "CS2 Major", "Navi gagne", 2.1, "VALUE", "WON", 9],
      ["Fnatic - G2", "LEC", "Fnatic gagne", 1.7, "PICK_SOLIDE", "WON", 8],
      ["SEN - LOUD", "Valorant", "SEN gagne", 2.3, "OPPORTUNITE", "WON", 7],
      ["BLG - JDG", "LPL", "BLG gagne", 1.8, "SAFE", "WON", 6],
      ["Vitality - Spirit", "CS2", "Vitality gagne", 1.6, "PICK_SOLIDE", "WON", 5],
      ["T1 - DRX", "Worlds", "T1 gagne", 1.5, "SAFE", "WON", 4],
      ["Navi - Astralis", "CS2", "Navi gagne", 1.4, "SAFE", "WON", 3],
      ["G2 - MAD", "LEC", "G2 gagne", 1.75, "PICK_SOLIDE", "WON", 2],
      ["SEN - Paper Rex", "Valorant", "SEN gagne", 2.0, "VALUE", "WON", 1],
    ],
    today: [
      ["T1 - HLE", "LCK Spring", "T1 gagne", 1.65, "PICK_DU_JOUR"],
      ["Navi - Heroic", "CS2 Blast", "Navi 2-0", 2.2, "VALUE"],
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

async function main() {
  console.log("Seeding database...\n");

  const now = Date.now();
  const testLinks: { email: string; role: string; url: string }[] = [];

  // Admin user
  const admin = await prisma.user.upsert({
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

  for (const t of TIPSTERS) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        role: "TIPSTER",
      },
    });

    // Create test magic link
    const token = await createTestMagicLink(t.email);
    testLinks.push({
      email: t.email,
      role: "TIPSTER",
      url: `${BACKEND_URL}/auth/verify?token=${token}`,
    });

    // Upsert tipster profile
    const tipster = await prisma.tipster.upsert({
      where: { userId: user.id },
      update: { dayPassPrice: 350, viewsToday: Math.floor(Math.random() * 300) },
      create: {
        userId: user.id,
        pseudo: t.pseudo,
        bio: t.bio,
        sports: t.sports,
        subStatus: "FREE",
        viewsToday: Math.floor(Math.random() * 300),
      },
    });

    // Delete existing pronos and recreate with fresh dates
    await prisma.prono.deleteMany({ where: { tipsterId: tipster.id } });

    // Historical pronos — startTime = createdAt (already past)
    const historyData = t.history.map(
      ([matchName, league, pick, odds, teasing, result, daysAgo]) => {
        const createdAt = new Date(now - daysAgo * DAY);
        return {
          tipsterId: tipster.id,
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
    // EsportGuru (last tipster): all analyses in the past (to test "terminated" state)
    const allPast = t.email === "esportguru@test.com";
    // startTime offsets from now: alternate between past and future
    // For most tipsters: first prono in the past (-1h), rest in the future (+2h, +6h, etc.)
    const startTimeOffsets = allPast
      ? t.today.map((_, i) => -(i + 1) * HOUR) // all in the past
      : t.today.map((_, i) => (i === 0 ? -1 * HOUR : (i * 3 + 1) * HOUR)); // first past, rest future

    const todayData = t.today.map(
      ([matchName, league, pick, odds, teasing], i) => ({
        tipsterId: tipster.id,
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
        createdAt: new Date(now - (t.today.length - i) * HOUR),
      }),
    );

    await prisma.prono.createMany({ data: [...historyData, ...todayData] });
    console.log(
      `  ${t.pseudo}: ${historyData.length} history + ${todayData.length} today`,
    );
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
