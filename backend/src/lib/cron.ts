import cron from "node-cron";

import { softDeleteUserNow } from "../services/account-service";
import { sendWinningPronoEmail } from "./emails";
import { logger } from "./logger";
import { prisma } from "./prisma";

const cronLogger = logger.child({ context: "cron" });

export function initCronJobs(): void {
  // Tâches planifiées en processus (Europe/Paris). 10h : emails J+1.
  cron.schedule(
    "0 10 * * *",
    async () => {
      cronLogger.info({ job: "daily_winning_emails" }, "Job started");
      try {
        await sendDailyWinningEmails();
      } catch (err) {
        cronLogger.error({ err, job: "daily_winning_emails" }, "Job failed");
      }
    },
    { timezone: "Europe/Paris" },
  );

  // Minuit : remise à zéro de viewsToday et isFeatured.
  cron.schedule(
    "0 0 * * *",
    async () => {
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
    },
    { timezone: "Europe/Paris" },
  );

  // 3h : purge des magic-links, sessions et cooldowns de suppression expirés.
  cron.schedule(
    "0 3 * * *",
    async () => {
      cronLogger.info({ job: "cleanup_expired_auth" }, "Job started");
      try {
        const now = new Date();
        const [deletedMagicLinks, deletedSessions, deletedCooldowns] = await Promise.all([
          prisma.magicLink.deleteMany({ where: { expiresAt: { lt: now } } }),
          prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
          // RGPD : l'email d'un compte supprimé n'est pas conservé au-delà du cooldown.
          prisma.deletedEmailCooldown.deleteMany({
            where: { expiresAt: { lt: now } },
          }),
        ]);
        cronLogger.info(
          {
            job: "cleanup_expired_auth",
            magicLinksDeleted: deletedMagicLinks.count,
            sessionsDeleted: deletedSessions.count,
            deletionCooldownsDeleted: deletedCooldowns.count,
          },
          "Auth tokens cleanup completed",
        );
      } catch (err) {
        cronLogger.error({ err, job: "cleanup_expired_auth" }, "Job failed");
      }
    },
    { timezone: "Europe/Paris" },
  );

  // 3h15 : finalise les suppressions programmées (voir autoDeletePendingExperts).
  cron.schedule(
    "15 3 * * *",
    async () => {
      cronLogger.info({ job: "auto_delete_pending_experts" }, "Job started");
      try {
        await autoDeletePendingExperts();
      } catch (err) {
        cronLogger.error({ err, job: "auto_delete_pending_experts" }, "Job failed");
      }
    },
    { timezone: "Europe/Paris" },
  );

  cronLogger.info("Daily J+1 email job scheduled (10:00 Europe/Paris)");
  cronLogger.info("Midnight reset job scheduled (00:00 Europe/Paris)");
  cronLogger.info("Auth tokens cleanup job scheduled (03:00 Europe/Paris)");
  cronLogger.info("Pending experts auto-delete job scheduled (03:15 Europe/Paris)");
}

/**
 * Un expert dont la suppression est programmée (`pendingDeletionAt`) reste
 * visible de ses abonnés tant qu'une souscription ACTIVE court. Quand il n'en
 * reste plus, on applique le même soft delete que `DELETE /auth/me`.
 */
export async function autoDeletePendingExperts(): Promise<void> {
  const now = new Date();

  const pendingExperts = await prisma.expert.findMany({
    where: { pendingDeletionAt: { not: null }, deletedAt: null },
    select: {
      id: true,
      userId: true,
      user: { select: { email: true } },
    },
  });

  if (pendingExperts.length === 0) {
    cronLogger.info("No experts in pendingDeletion, skipping");
    return;
  }

  // Un seul groupBy pour tous les experts concernés (pas de requête par expert).
  const pendingExpertIds = pendingExperts.map((e) => e.id);

  const subsByExpert = await prisma.subscription.groupBy({
    by: ["expertId"],
    where: {
      expertId: { in: pendingExpertIds },
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    _count: { _all: true },
  });

  const activeCountMap = new Map(subsByExpert.map((row) => [row.expertId, row._count._all]));

  let deletedCount = 0;
  let skippedCount = 0;

  // Séquentiel : une transaction par suppression, sans saturer le pool.
  for (const expert of pendingExperts) {
    const activeCount = activeCountMap.get(expert.id) ?? 0;
    if (activeCount > 0) {
      skippedCount++;
      continue;
    }

    try {
      await softDeleteUserNow({
        userId: expert.userId,
        email: expert.user.email,
        expertId: expert.id,
        now,
      });
      deletedCount++;
      cronLogger.warn(
        { userId: expert.userId, expertId: expert.id },
        "Expert account auto-deleted (RGPD, pending deletion finalized)",
      );
    } catch (err) {
      cronLogger.error(
        { err, expertId: expert.id, userId: expert.userId },
        "Failed to finalize pending deletion for expert",
      );
    }
  }

  cronLogger.info(
    {
      job: "auto_delete_pending_experts",
      deletedCount,
      skippedCount,
      totalPending: pendingExperts.length,
    },
    "Auto-delete pending experts done",
  );
}

export async function sendDailyWinningEmails(): Promise<void> {
  const now = new Date();

  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(now);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  // Pronos WON mis à jour hier (updatedAt sert de date de validation du résultat).
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

  // Un email par couple (abonné, expert), même si l'expert a plusieurs pronos gagnants.
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

  // Abonnements actifs ou échus depuis hier, en une requête. Le distinct porte
  // sur (userId, expertId) pour qu'un abonné à deux experts reçoive deux emails.
  const expertIds = Array.from(expertMap.keys());

  const subscriptions = await prisma.subscription.findMany({
    where: {
      expertId: { in: expertIds },
      OR: [
        { status: "ACTIVE", expiresAt: { gt: new Date() } },
        { status: "ACTIVE", expiresAt: { gte: yesterdayStart } },
        { status: "EXPIRED", expiresAt: { gte: yesterdayStart } },
      ],
    },
    select: {
      expertId: true,
      userId: true,
      user: { select: { email: true } },
    },
    distinct: ["userId", "expertId"],
  });

  const subsByExpert = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions) {
    const arr = subsByExpert.get(sub.expertId) ?? [];
    arr.push(sub);
    subsByExpert.set(sub.expertId, arr);
  }

  let emailsSent = 0;

  for (const [expertId, { pseudo, matchNames }] of expertMap) {
    const subs = subsByExpert.get(expertId) ?? [];

    const matchLabel =
      matchNames.length > 1
        ? `${matchNames[0]} (+${matchNames.length - 1} autre${matchNames.length > 2 ? "s" : ""})`
        : matchNames[0];

    for (const sub of subs) {
      void sendWinningPronoEmail(sub.user.email, pseudo, expertId, matchLabel);
      emailsSent++;
    }
  }

  cronLogger.info({ emailsSent }, "J+1 emails dispatched");
}
