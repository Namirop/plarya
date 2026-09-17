import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Promeut (ou crée) le compte ADMIN permanent, indépendant des données du seed.
 * Idempotent ; à relancer après `npm run db:seed:reset`, qui vide la base.
 * Connexion ensuite par magic-link, sans mot de passe.
 *
 * Usage : `npm run db:set-admin` (adresse par défaut ci-dessous)
 *         `npm run db:set-admin -- autre@example.com`
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
