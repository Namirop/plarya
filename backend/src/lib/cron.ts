import cron from "node-cron";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { sendWinningPronoEmail } from "./emails";

const cronLogger = logger.child({ context: "cron" });

export function initCronJobs(): void {
  // Tous les jours à 10h00
  cron.schedule("0 10 * * *", async () => {
    cronLogger.info({ job: "daily_winning_emails" }, "Job started");
    try {
      await sendDailyWinningEmails();
    } catch (err) {
      cronLogger.error({ err, job: "daily_winning_emails" }, "Job failed");
    }
  });

  // Chaque jour à minuit : reset viewsToday + isFeatured
  cron.schedule("0 0 * * *", async () => {
    cronLogger.info({ job: "midnight_reset" }, "Job started");
    try {
      await prisma.expert.updateMany({ data: { viewsToday: 0 } });
      await prisma.prono.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
      cronLogger.info({ job: "midnight_reset" }, "Job done (viewsToday + isFeatured)");
    } catch (err) {
      cronLogger.error({ err, job: "midnight_reset" }, "Job failed");
    }
  });

  cronLogger.info("Daily J+1 email job scheduled (10:00 AM)");
  cronLogger.info("Midnight reset job scheduled (00:00)");
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
      expertId: true,
      expert: { select: { id: true, pseudo: true } },
    },
  });

  if (winningPronos.length === 0) {
    cronLogger.info("No winning pronos yesterday, skipping emails");
    return;
  }

  cronLogger.info({ count: winningPronos.length }, "Found winning pronos yesterday");

  // Grouper par expert (1 email/user/expert)
  const expertMap = new Map<string, { pseudo: string; matchNames: string[] }>();
  for (const prono of winningPronos) {
    const existing = expertMap.get(prono.expertId);
    if (existing) {
      existing.matchNames.push(prono.matchName);
    } else {
      expertMap.set(prono.expertId, {
        pseudo: prono.expert.pseudo,
        matchNames: [prono.matchName],
      });
    }
  }

  let emailsSent = 0;

  for (const [expertId, { pseudo, matchNames }] of expertMap) {
    // Users avec un abonnement actif ou expiré depuis hier
    const subscriptions = await prisma.subscription.findMany({
      where: {
        expertId,
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
      sendWinningPronoEmail(sub.user.email, pseudo, expertId, matchLabel);
      emailsSent++;
    }
  }

  cronLogger.info({ emailsSent }, "J+1 emails dispatched");
}
