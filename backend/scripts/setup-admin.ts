import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Creates (or updates) the permanent ADMIN account for contact@plarya.com.
 *
 * Uses a raw SQL upsert so the operation is fully idempotent:
 *   - First run  → inserts the row with role = ADMIN.
 *   - Subsequent → updates role = ADMIN and bumps updatedAt (no-op in practice).
 *
 * The user authenticates via the normal magic-link flow — no password needed.
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

  // Idempotent upsert via raw SQL.
  // gen_random_uuid()::text produces a UUID string that satisfies the TEXT id column.
  // ON CONFLICT (email) ensures a second run simply promotes the role without
  // creating a duplicate row.
  await prisma.$executeRawUnsafe(`
    INSERT INTO users (id, email, role, "updatedAt")
    VALUES (gen_random_uuid()::text, '${email}', 'ADMIN', now())
    ON CONFLICT (email) DO UPDATE
      SET role = 'ADMIN', "updatedAt" = now();
  `);

  // Verify and display the resulting record.
  const rows = await prisma.$queryRawUnsafe<
    { id: string; email: string; role: string; createdAt: Date; updatedAt: Date }[]
  >(`SELECT id, email, role, "createdAt", "updatedAt" FROM users WHERE email = '${email}' LIMIT 1`);

  if (rows.length === 0) {
    console.error("❌  Admin user not found after upsert — something went wrong.");
    process.exit(1);
  }

  const user = rows[0];
  console.log("\n✅  Admin user ready:");
  console.log(`   id        : ${user.id}`);
  console.log(`   email     : ${user.email}`);
  console.log(`   role      : ${user.role}`);
  console.log(`   createdAt : ${user.createdAt.toISOString()}`);
  console.log(`   updatedAt : ${user.updatedAt.toISOString()}`);
  console.log("\nThe admin can sign in via the magic-link flow using this email.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
