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

  // Tous les jours à 3h : cleanup des magic-links et sessions
  // expirés. Sans ce job, ces 2 tables grossissent linéairement
  // avec le trafic (cf. audit-final.md §B).
  cron.schedule(
    "0 3 * * *",
    async () => {
      cronLogger.info({ job: "cleanup_expired_auth" }, "Job started");
      try {
        const now = new Date();
        const [deletedMagicLinks, deletedSessions, deletedCooldowns] = await Promise.all([
          prisma.magicLink.deleteMany({ where: { expiresAt: { lt: now } } }),
          prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
          // Cooldowns post-suppression expirés : on supprime la
          // trace de l'email. Conforme à l'esprit RGPD (on ne garde
          // pas indéfiniment un email lié à un user supprimé).
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

  // Tous les jours à 3h15 : finalise les suppressions de compte des
  // experts en pendingDeletionAt dont la dernière sub active a
  // expiré. Cf. DELETE /auth/me — quand un expert avec subs en
  // cours demande la suppression, on flag pendingDeletionAt au lieu
  // de bloquer indéfiniment. Ce cron exécute le soft delete réel
  // quand plus aucune sub ne le retient.
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

  cronLogger.info("Daily J+1 email job scheduled (10:00 AM)");
  cronLogger.info("Midnight reset job scheduled (00:00)");
  cronLogger.info("Auth tokens cleanup job scheduled (03:00 Europe/Paris)");
  cronLogger.info("Pending experts auto-delete job scheduled (03:15 Europe/Paris)");
}

/**
 * Pour chaque Expert en pendingDeletionAt (non encore deletedAt),
 * vérifie s'il reste des Subscriptions ACTIVE non expirées :
 *   - oui → on n'y touche pas (sub en cours, le buyer paie pour
 *           du contenu, l'expert reste accessible aux abonnés).
 *   - non → on exécute le soft delete réel (identique à la branche
 *           immédiate de DELETE /auth/me) : Expert.deletedAt,
 *           User.deletedAt + anonymisation email, wipe sessions.
 *
 * Exportée pour permettre un trigger manuel admin si besoin de
 * débloquer un cas particulier (ex : restart du serveur juste après
 * l'expiration d'une sub, on n'attend pas le prochain run cron).
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

  let deletedCount = 0;
  let skippedCount = 0;

  for (const expert of pendingExperts) {
    const activeSubsCount = await prisma.subscription.count({
      where: {
        expertId: expert.id,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
    });

    if (activeSubsCount > 0) {
      skippedCount++;
      continue;
    }

    const anonymizedEmail = `deleted-${expert.userId}@plarya.local`;
    // Même cooldown 7j que la branche immediate de DELETE /auth/me —
    // empêche la recréation rapide d'un compte avec cet email après
    // que le cron a finalisé la suppression.
    const cooldownExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.expert.update({
          where: { id: expert.id },
          data: { deletedAt: now, pendingDeletionAt: null },
        });
        await tx.user.update({
          where: { id: expert.userId },
          data: { deletedAt: now, email: anonymizedEmail },
        });
        await tx.deletedEmailCooldown.create({
          data: {
            email: expert.user.email,
            deletedAt: now,
            expiresAt: cooldownExpiresAt,
          },
        });
        await tx.magicLink.deleteMany({
          where: { email: expert.user.email },
        });
        await tx.session.deleteMany({ where: { userId: expert.userId } });
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
