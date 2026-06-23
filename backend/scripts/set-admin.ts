import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Promeut (ou crée) le compte ADMIN réel — par défaut contact@plarya.com.
 *
 * Pourquoi un script dédié (et pas le seed) : c'est l'admin PERMANENT
 * de la plateforme, il ne doit pas dépendre du cycle de vie des fausses
 * données.
 *  - Idempotent : ré-exécutable sans risque.
 *  - Survit à `npm run db:seed` (le seed soft ne touche que ses propres
 *    emails de test, cf. SEEDED_EMAILS).
 *  - ⚠️ `npm run db:seed:reset` (--reset) vide TOUTE la base : re-lancer
 *    ce script après un reset.
 *
 * Auth : aucun mot de passe. L'admin se connecte via le flow magic-link
 * normal en saisissant son email dans la modale « Se connecter » — le
 * lien part dans sa boîte (qu'il contrôle), ce qui prouve son identité
 * (même modèle de confiance que « mot de passe oublié »). Session 30j.
 *
 * Usage :
 *   npm run db:set-admin                  # contact@plarya.com
 *   npm run db:set-admin -- autre@x.com   # autre email
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL manquant dans l'environnement.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.argv[2] || "contact@plarya.com").toLowerCase();

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, role: "ADMIN" },
  });

  console.log(`\n✓ ${email} → rôle ADMIN (userId: ${user.id})`);
  console.log("\nÉtapes de connexion :");
  console.log(`  1. Aller sur le site → « Se connecter »`);
  console.log(`  2. Saisir ${email}`);
  console.log(`  3. Cliquer le magic-link reçu dans la boîte → /admin (session 30j)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
