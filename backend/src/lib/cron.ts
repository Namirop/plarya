import cron from "node-cron";
import { prisma } from "./prisma";
import { sendWinningPronoEmail } from "./emails";

export function initCronJobs(): void {
  // Tous les jours à 10h00
  cron.schedule("0 10 * * *", async () => {
    console.log("[CRON] J+1 email job started");
    try {
      await sendDailyWinningEmails();
    } catch (err) {
      console.error("[CRON] J+1 email job failed:", err);
    }
  });

  // Chaque jour à minuit : reset viewsToday + isFeatured
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Midnight reset job started");
    try {
      await prisma.tipster.updateMany({ data: { viewsToday: 0 } });
      await prisma.prono.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
      console.log("[CRON] Midnight reset done (viewsToday + isFeatured)");
    } catch (err) {
      console.error("[CRON] Midnight reset failed:", err);
    }
  });

  console.log("[CRON] Daily J+1 email job scheduled (10:00 AM)");
  console.log("[CRON] Midnight reset job scheduled (00:00)");
}

export async function sendDailyWinningEmails(): Promise<void> {
  const now = new Date();

  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(now);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  // Pronos marqués WON hier (updatedAt = moment où le résultat a été validé)
  const winningPronos = await prisma.prono.findMany({
    where: {
      result: "WON",
      updatedAt: { gte: yesterdayStart, lte: yesterdayEnd },
    },
    select: {
      id: true,
      matchName: true,
      tipsterId: true,
      tipster: { select: { id: true, pseudo: true } },
    },
  });

  if (winningPronos.length === 0) {
    console.log("[CRON] No winning pronos yesterday, skipping emails");
    return;
  }

  console.log(`[CRON] Found ${winningPronos.length} winning pronos yesterday`);

  // Grouper par tipster (1 email/user/tipster)
  const tipsterMap = new Map<string, { pseudo: string; matchNames: string[] }>();
  for (const prono of winningPronos) {
    const existing = tipsterMap.get(prono.tipsterId);
    if (existing) {
      existing.matchNames.push(prono.matchName);
    } else {
      tipsterMap.set(prono.tipsterId, {
        pseudo: prono.tipster.pseudo,
        matchNames: [prono.matchName],
      });
    }
  }

  let emailsSent = 0;

  for (const [tipsterId, { pseudo, matchNames }] of tipsterMap) {
    // Users avec un abonnement actif ou expiré depuis hier
    const subscriptions = await prisma.subscription.findMany({
      where: {
        tipsterId,
        OR: [
          { status: "ACTIVE", expiresAt: { gt: new Date() } },
          { status: "ACTIVE", expiresAt: { gte: yesterdayStart } },
          { status: "EXPIRED", expiresAt: { gte: yesterdayStart } },
        ],
      },
      select: {
        userId: true,
        user: { select: { email: true } },
      },
      distinct: ["userId"],
    });

    const matchLabel =
      matchNames.length > 1
        ? `${matchNames[0]} (+${matchNames.length - 1} autre${matchNames.length > 2 ? "s" : ""})`
        : matchNames[0];

    for (const sub of subscriptions) {
      sendWinningPronoEmail(sub.user.email, pseudo, tipsterId, matchLabel);
      emailsSent++;
    }
  }

  console.log(`[CRON] J+1 emails dispatched: ${emailsSent} total`);
}
