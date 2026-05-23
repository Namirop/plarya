import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
async function main() {
  const recent = await prisma.subscription.findFirst({
    where: { stripeSessionId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { id: true, stripeSessionId: true, createdAt: true },
  });
  console.log("Most recent sub:", recent);
  if (recent?.stripeSessionId) {
    const res = await fetch(
      `http://localhost:4000/subscriptions/check-stripe-session?stripe_session_id=${encodeURIComponent(recent.stripeSessionId)}`,
    );
    console.log("Endpoint response:", res.status, await res.text());
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
