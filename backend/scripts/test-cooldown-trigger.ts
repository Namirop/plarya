import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
async function main() {
  const email = `test-cooldown-${Date.now()}@example.com`;
  const u = await prisma.user.create({ data: { email } });
  const sessionToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { token: sessionToken, userId: u.id, expiresAt: new Date(Date.now() + 86400000) },
  });
  const res = await fetch("http://localhost:4000/auth/me", {
    method: "DELETE",
    headers: { Cookie: `session_token=${sessionToken}` },
  });
  console.log("DELETE status:", res.status, "body:", await res.text());
  const cooldown = await prisma.deletedEmailCooldown.findFirst({ where: { email } });
  console.log("Cooldown row:", cooldown);
  if (cooldown) await prisma.deletedEmailCooldown.delete({ where: { id: cooldown.id } });
  await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
