import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Creates (or promotes) the permanent admin account for contact@plarya.com.
 *
 * Idempotent: safe to re-run at any time.
 *   - If the user does not exist it is inserted with role=ADMIN.
 *   - If the user already exists its role is set to ADMIN and updatedAt
 *     is refreshed.
 *
 * Auth: no password. The admin signs in via the normal magic-link flow
 * by entering their email in the "Se connecter" modal — the link lands
 * in their inbox, which proves identity (same trust model as "forgot
 * password"). Session lasts 30 days.
 *
 * Usage:
 *   npm run setup:admin
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌  DATABASE_URL is missing from the environment.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "contact@plarya.com";

  // ── 1. Upsert via raw SQL ────────────────────────────────────────────────
  await prisma.$executeRaw`
    INSERT INTO users (id, email, role, "updatedAt")
    VALUES (gen_random_uuid()::text, ${email}, 'ADMIN', now())
    ON CONFLICT (email) DO UPDATE
      SET role       = 'ADMIN',
          "updatedAt" = now()
  `;

  // ── 2. Verify: SELECT and log the resulting row ──────────────────────────
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  >`
    SELECT id, email, role, "createdAt", "updatedAt"
    FROM   users
    WHERE  email = ${email}
  `;

  if (rows.length === 0) {
    console.error("❌  User was not found after upsert — something went wrong.");
    process.exit(1);
  }

  const user = rows[0];

  console.log("\n✓ Admin user upserted successfully\n");
  console.log("  id        :", user.id);
  console.log("  email     :", user.email);
  console.log("  role      :", user.role);
  console.log("  createdAt :", user.createdAt.toISOString());
  console.log("  updatedAt :", user.updatedAt.toISOString());
  console.log("\nHow to sign in:");
  console.log("  1. Go to the site → « Se connecter »");
  console.log(`  2. Enter ${user.email}`);
  console.log("  3. Click the magic-link received by email → /admin (session 30 days)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
