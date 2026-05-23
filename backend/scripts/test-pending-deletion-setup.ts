/**
 * Script de setup pour tester le flow pendingDeletion.
 *
 * - Liste les experts en DB avec leur nombre de subs actives.
 * - Génère un magic-link frais pour un expert ayant >=1 sub active
 *   (pour tester la branche "scheduled") et pour un expert sans sub
 *   active (pour tester la branche "immediate").
 *
 * Usage : npx tsx scripts/test-pending-deletion-setup.ts
 */
import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function createMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.magicLink.create({
    data: {
      token,
      email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

async function main() {
  const experts = await prisma.expert.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      pseudo: true,
      pendingDeletionAt: true,
      user: { select: { id: true, email: true } },
      subscriptions: {
        where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
        select: { id: true, expiresAt: true, type: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  console.log("\n=== EXPERTS ===\n");
  for (const e of experts) {
    const activeCount = e.subscriptions.length;
    const lastExp =
      activeCount > 0
        ? e.subscriptions
            .map((s) => s.expiresAt)
            .sort((a, b) => b.getTime() - a.getTime())[0]
            .toISOString()
            .slice(0, 10)
        : "—";
    console.log(
      `${e.pseudo.padEnd(12)} (${e.user.email.padEnd(24)}) ` +
        `subs actives=${activeCount}  lastSubExpiresAt=${lastExp}  ` +
        `pendingDeletionAt=${e.pendingDeletionAt ? e.pendingDeletionAt.toISOString().slice(0, 10) : "—"}`,
    );
  }

  const withSubs = experts.find((e) => e.subscriptions.length > 0);
  const withoutSubs = experts.find((e) => e.subscriptions.length === 0);

  console.log("\n=== MAGIC LINKS ===\n");

  if (withSubs) {
    const t = await createMagicLink(withSubs.user.email);
    console.log(
      `[Expert AVEC subs actives → branche scheduled]\n` +
        `  Pseudo : ${withSubs.pseudo}\n` +
        `  Email  : ${withSubs.user.email}\n` +
        `  Login  : ${BACKEND_URL}/auth/verify?token=${t}&redirect=/compte\n`,
    );
  } else {
    console.log("(aucun expert avec sub active — skip)\n");
  }

  if (withoutSubs) {
    const t = await createMagicLink(withoutSubs.user.email);
    console.log(
      `[Expert SANS sub active → branche immediate]\n` +
        `  Pseudo : ${withoutSubs.pseudo}\n` +
        `  Email  : ${withoutSubs.user.email}\n` +
        `  Login  : ${BACKEND_URL}/auth/verify?token=${t}&redirect=/compte\n`,
    );
  } else {
    console.log("(aucun expert sans sub active — skip)\n");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
