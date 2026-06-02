import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Creates (or promotes) the permanent ADMIN account for contact@plarya.com.
 *
 * Idempotent — safe to run multiple times:
 *   - First run  : inserts the user with role=ADMIN.
 *   - Subsequent : updates role=ADMIN and updatedAt (no-op if already ADMIN).
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

  // Upsert via raw SQL so the exact query is explicit and auditable.
  await prisma.$executeRaw`
    INSERT INTO users (id, email, role, "updatedAt")
    VALUES (gen_random_uuid()::text, ${email}, 'ADMIN', now())
    ON CONFLICT (email) DO UPDATE
      SET role       = 'ADMIN',
          "updatedAt" = now()
  `;

  // Fetch and log the record to confirm the result.
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error("❌  User not found after upsert — something went wrong.");
    process.exit(1);
  }

  console.log("\n✅  Admin user created / verified:");
  console.log({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
  console.log(
    "\nThe admin can sign in via the magic-link flow using this email address.\n"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
