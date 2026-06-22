import cron from "node-cron";

import { softDeleteUserNow } from "../services/account-service";
import { sendWinningPronoEmail } from "./emails";
import { logger } from "./logger";
import { prisma } from "./prisma";

const cronLogger = logger.child({ context: "cron" });

export function initCronJobs(): void {
  // Tous les jours à 10h00 (Europe/Paris)
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

  // Chaque jour à minuit (Europe/Paris) : reset viewsToday + isFeatured
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

  // Tous les jours à 3h : cleanup des magic-links et sessions
  // expirés. Sans ce job, ces 2 tables grossissent linéairement
  // avec le trafic.
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

  cronLogger.info("Daily J+1 email job scheduled (10:00 Europe/Paris)");
  cronLogger.info("Midnight reset job scheduled (00:00 Europe/Paris)");
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

  // N+1 éliminé : un seul groupBy compte les subs actives de TOUS les
  // experts pending d'un coup, au lieu d'un count par expert dans la
  // boucle.
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

  const activeCountMap = new Map(
    subsByExpert.map((row) => [row.expertId, row._count._all]),
  );

  let deletedCount = 0;
  let skippedCount = 0;

  // softDeleteUserNow reste séquentiel dans la boucle : chaque
  // suppression est une transaction Prisma indépendante — paralléliser
  // saturerait le pool de connexions et compliquerait le log par expert.
  for (const expert of pendingExperts) {
    const activeCount = activeCountMap.get(expert.id) ?? 0;
    if (activeCount > 0) {
      skippedCount++;
      continue;
    }

    try {
      // Réutilise softDeleteUserNow (account-service) : MÊME logique
      // que la branche immédiate de DELETE /auth/me. Sans cette
      // dédup, les deux chemins divergent au fil des refactos.
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

  // N+1 éliminé : un seul findMany récupère les subs de TOUS les
  // experts concernés, puis on groupe par expertId côté JS. Le distinct
  // porte sur le couple (userId, expertId) — sans expertId, un user
  // abonné à 2 experts gagnants n'apparaîtrait qu'une fois au total.
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
