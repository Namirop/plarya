import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { logger, maskEmail } from "../lib/logger";
import { createMagicLink, verifyMagicLink, createSession, deleteSession } from "../lib/magic-link";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { magicLinkRequestSchema, resendAccessUnlockedSchema } from "../validators/auth";
import { sendMagicLinkEmail, sendAccessUnlockedEmail } from "../lib/emails";

const router = Router();

// Limiteur ciblé : 5 demandes d'envoi de magic-link par IP / 15 min.
// Appliqué UNIQUEMENT à POST /request-magic-link (anti-spam d'emails).
// Ne couvre PAS /verify (GET cliqué depuis l'email — 1 seul appel
// légitime par token) ni /me / /logout (utilisés en boucle par le hook
// useUser à chaque navigation).
const magicLinkRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes de connexion, réessayez dans quelques minutes" },
});

// Limiteur pour /resend-access-unlocked : 3 demandes par IP / 15 min.
// Plus restrictif que magic-link car ce flow ne devrait être utilisé
// qu'en cas de non-réception d'email post-checkout (cas rare).
const resendAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Trop de demandes, réessayez dans quelques minutes" },
});

// Limiteur pour /me/export : 1 export / 24h / IP. RGPD permet
// l'export à la demande mais sans cap c'est un vecteur DOS (export
// d'un user avec 10k pronos = JSON lourd à générer).
const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  message: {
    error: "Un seul export par 24h. Réessaie demain.",
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Valide qu'un param `redirect` est sûr à concaténer après FRONTEND_URL :
 *  - DOIT commencer par "/" (chemin relatif au domaine frontend)
 *  - NE DOIT PAS commencer par "//" (sinon URL protocol-relative qui
 *    permettrait `//evil.com` → `https://evil.com` après normalisation
 *    browser → vecteur de phishing post-magic-link)
 *  - NE DOIT PAS contenir un schéma absolu type "javascript:" / "data:"
 *    (déjà bloqué par la règle "/" mais double-check par défense en
 *    profondeur)
 *
 * Tout redirect invalide tombe vers "/" (home) + log warn pour
 * tracer d'éventuelles tentatives malicieuses.
 */
function isSafeRedirect(target: string): boolean {
  if (typeof target !== "string" || target.length === 0) return false;
  if (!target.startsWith("/")) return false;
  if (target.startsWith("//")) return false;
  // \ peut être interprété comme / par certains browsers → bloque aussi.
  if (target.startsWith("/\\") || target.startsWith("\\")) return false;
  return true;
}

function setSessionCookie(res: import("express").Response, token: string) {
  res.cookie("session_token", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
}

/**
 * GET /auth/csrf
 *
 * Endpoint utilitaire pour le frontend : forcer le set du cookie
 * `csrf_token` en cas où aucune requête n'a encore été faite à l'API
 * (rare en pratique — la home appelle déjà GET /experts au mount).
 * Le middleware csrfTokenIssuer pose le cookie si absent, on renvoie
 * juste le token en JSON pour que le caller puisse confirmer.
 */
router.get("/csrf", (req, res) => {
  res.json({ token: req.cookies?.csrf_token ?? null });
});

// POST /auth/request-magic-link
router.post(
  "/request-magic-link",
  magicLinkRequestLimiter,
  validate(magicLinkRequestSchema),
  async (req, res) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase();

      // Cooldown post-suppression : si cet email a été soft-deleted
      // dans la fenêtre de cooldown (cf. table DeletedEmailCooldown),
      // on n'envoie PAS de magic-link. On reste sur la même réponse
      // 200 générique pour éviter d'énumérer les comptes (l'attaquant
      // ne doit pas pouvoir distinguer "email inconnu" de "email
      // récemment supprimé").
      const cooldown = await prisma.deletedEmailCooldown.findFirst({
        where: { email: normalizedEmail, expiresAt: { gt: new Date() } },
        select: { id: true, expiresAt: true },
      });

      if (cooldown) {
        logger.warn(
          {
            email: maskEmail(normalizedEmail),
            cooldownExpiresAt: cooldown.expiresAt,
            ip: req.ip,
          },
          "Magic-link request blocked: email in deletion cooldown",
        );
      } else {
        const token = await createMagicLink(normalizedEmail);
        const link = `${BACKEND_URL}/auth/verify?token=${token}`;
        // Send email (fire-and-forget)
        sendMagicLinkEmail(normalizedEmail, link);
      }

      // Always return 200 to not leak account existence (et état du cooldown).
      res.json({
        message: "Si un compte existe avec cet email, un lien de connexion a été envoyé.",
      });
    } catch (err) {
      logger.error({ err }, "Magic link request error");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// GET /auth/verify?token=xxx&redirect=/some/path
router.get("/verify", async (req, res) => {
  try {
    const token = req.query.token as string;
    const rawRedirect = (req.query.redirect as string) || "/";

    // Validation anti-open-redirect : tout chemin qui ne respecte
    // pas le pattern "/path-relatif" est fallback vers "/" et loggé.
    let redirect = "/";
    if (rawRedirect !== "/" && isSafeRedirect(rawRedirect)) {
      redirect = rawRedirect;
    } else if (rawRedirect !== "/") {
      logger.warn({ rawRedirect, ip: req.ip }, "Unsafe redirect param blocked on /auth/verify");
    }

    if (!token) {
      res.redirect(`${FRONTEND_URL}/auth/verify?error=invalid`);
      return;
    }

    const result = await verifyMagicLink(token);
    if (!result) {
      res.redirect(`${FRONTEND_URL}/auth/verify?error=expired`);
      return;
    }

    // Garde-fou cooldown post-suppression : même si un magic-link a
    // pu être créé avant ou pendant la suppression (race), on refuse
    // sa consommation tant que la fenêtre de cooldown n'est pas
    // expirée. Sinon un user qui a un lien encore valide en cache
    // (15 min) pourrait recréer un compte juste après suppression.
    const cooldown = await prisma.deletedEmailCooldown.findFirst({
      where: { email: result.email, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (cooldown) {
      logger.warn(
        { email: maskEmail(result.email), ip: req.ip },
        "Magic-link verify blocked: email in deletion cooldown",
      );
      res.redirect(`${FRONTEND_URL}/auth/verify?error=deleted`);
      return;
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: result.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: result.email },
      });
    }

    // Create session
    const sessionToken = await createSession(user.id);
    setSessionCookie(res, sessionToken);

    res.redirect(`${FRONTEND_URL}${redirect}`);
  } catch (err) {
    logger.error({ err }, "Magic link verify error");
    res.redirect(`${FRONTEND_URL}/auth/verify?error=invalid`);
  }
});

// POST /auth/logout
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.session_token;
    if (token) {
      await deleteSession(token);
    }
    res.clearCookie("session_token", { path: "/" });
    res.json({ message: "Déconnecté" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, role: true, deletedAt: true },
    });

    // En pratique impossible (la suppression de compte wipe les
    // sessions du user) mais defensive : un User soft-deleted ne
    // doit pas être exposé via /auth/me.
    if (!user || user.deletedAt) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /auth/me/deletion-status
 *
 * Pour piloter l'UI "Zone dangereuse" sur /compte. Trois états :
 *
 *  1. `canDelete: true` — soft delete immédiat possible (USER lambda
 *     OU EXPERT sans subs actives).
 *  2. `canDelete: false, reason: "active_subscriptions"` — EXPERT
 *     avec subs ACTIVE en cours. L'user peut programmer la suppression
 *     (DELETE /auth/me posera `pendingDeletionAt`). On renvoie
 *     `activeSubscriptions` (nb) et `lastSubExpiresAt` (date max) pour
 *     que l'UI puisse afficher "Effective au plus tôt le X".
 *  3. `canDelete: false, reason: "scheduled"` — EXPERT qui a déjà
 *     programmé la suppression. On renvoie `pendingDeletionAt` (date
 *     du flag) + `lastSubExpiresAt`. L'UI affiche un banner + bouton
 *     "Annuler" (POST /auth/me/cancel-deletion).
 */
router.get("/me/deletion-status", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        role: true,
        expert: {
          select: { id: true, pendingDeletionAt: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    if (user.role === "EXPERT" && user.expert) {
      const expertId = user.expert.id;

      // Date d'expiration la plus tardive parmi les subs actives —
      // sert au moment où la suppression sera effectivement
      // applicable (cron auto-delete).
      const lastActiveSub = await prisma.subscription.findFirst({
        where: {
          expertId,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "desc" },
        select: { expiresAt: true },
      });
      const activeSubsCount = await prisma.subscription.count({
        where: {
          expertId,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      });

      if (user.expert.pendingDeletionAt) {
        res.json({
          canDelete: false,
          reason: "scheduled",
          pendingDeletionAt: user.expert.pendingDeletionAt,
          activeSubscriptions: activeSubsCount,
          lastSubExpiresAt: lastActiveSub?.expiresAt ?? null,
        });
        return;
      }

      if (activeSubsCount > 0) {
        res.json({
          canDelete: false,
          reason: "active_subscriptions",
          activeSubscriptions: activeSubsCount,
          lastSubExpiresAt: lastActiveSub?.expiresAt ?? null,
        });
        return;
      }
    }

    res.json({ canDelete: true });
  } catch (err) {
    logger.error({ err }, "Deletion status check failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * DELETE /auth/me
 *
 * Suppression de compte RGPD. Deux comportements selon le contexte :
 *
 *  A. USER lambda OU EXPERT sans subs actives → soft delete immédiat
 *     (200 + message "Compte supprimé"). Étapes :
 *       1. Soft delete Expert si applicable (deletedAt = now).
 *       2. Soft delete User + anonymisation email →
 *          `deleted-{id}@plarya.local`.
 *       3. Wipe toutes les sessions (cookie caller cleared).
 *
 *  B. EXPERT avec ≥1 sub ACTIVE en cours → suppression PROGRAMMÉE
 *     (202 + message "Suppression programmée"). On pose
 *     `pendingDeletionAt = now` sur Expert :
 *       - Le profile est retiré des listings publics (cf. /experts)
 *       - Tout nouveau paiement vers ce profile est refusé (cf.
 *         /checkout/create-session).
 *       - Les subs en cours restent actives jusqu'à leur expiresAt.
 *       - Le cron quotidien "auto_delete_pending_experts" (cf.
 *         lib/cron.ts) exécute le soft delete réel quand la dernière
 *         sub a expiré.
 *     L'expert peut annuler tant que le cron n'a pas tourné via
 *     POST /auth/me/cancel-deletion.
 *
 *  C. EXPERT déjà en pendingDeletion → 400 (action déjà programmée).
 *
 * Note : on conserve les FK Subscriptions (obligation comptable 10 ans
 * en France). Stripe Customer reste lié à l'ancien email côté Stripe
 * — info conservée pour audit Stripe Dashboard, normal.
 */
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        expert: {
          select: { id: true, pendingDeletionAt: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    const now = new Date();

    // Branche EXPERT : vérifier subs actives + état pending.
    if (user.role === "EXPERT" && user.expert) {
      if (user.expert.pendingDeletionAt) {
        res.status(400).json({
          error: "Une suppression est déjà programmée pour ton compte.",
        });
        return;
      }

      const lastActiveSub = await prisma.subscription.findFirst({
        where: {
          expertId: user.expert.id,
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: "desc" },
        select: { expiresAt: true },
      });

      if (lastActiveSub) {
        await prisma.expert.update({
          where: { id: user.expert.id },
          data: { pendingDeletionAt: now },
        });

        logger.warn(
          {
            userId,
            expertId: user.expert.id,
            lastSubExpiresAt: lastActiveSub.expiresAt,
          },
          "Expert account deletion scheduled (pending — active subs)",
        );

        res.status(202).json({
          status: "scheduled",
          pendingDeletionAt: now.toISOString(),
          lastSubExpiresAt: lastActiveSub.expiresAt.toISOString(),
          message:
            "Ta suppression est programmée. Elle deviendra effective à la fin du dernier abonnement actif.",
        });
        return;
      }
    }

    // Branche soft delete immédiat (USER ou EXPERT sans sub active).
    const anonymizedEmail = `deleted-${userId}@plarya.local`;
    // Cooldown 7 jours avant qu'un magic-link puisse à nouveau être
    // émis sur cet email (cf. table DeletedEmailCooldown). Évite la
    // recréation immédiate de compte qui donnerait l'impression
    // trompeuse d'une "reconnexion".
    const cooldownExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      if (user.expert) {
        await tx.expert.update({
          where: { id: user.expert.id },
          data: { deletedAt: now, pendingDeletionAt: null },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          email: anonymizedEmail,
        },
      });
      await tx.deletedEmailCooldown.create({
        data: {
          email: user.email,
          deletedAt: now,
          expiresAt: cooldownExpiresAt,
        },
      });
      // Invalide aussi les magic-links pending pour cet email :
      // sans ça un lien créé juste avant la suppression resterait
      // valide 15 min et tomberait sur la garde cooldown au verify
      // — mieux vaut le supprimer franchement.
      await tx.magicLink.deleteMany({ where: { email: user.email } });
      // Invalide toutes les sessions du user supprimé. Le caller
      // est inclus → son cookie devient orphelin et sera rejeté
      // au prochain authMiddleware.
      await tx.session.deleteMany({ where: { userId } });
    });

    res.clearCookie("session_token", { path: "/" });

    logger.warn(
      { userId, role: user.role, hadExpert: !!user.expert },
      "User account deleted (RGPD)",
    );

    res.json({ message: "Compte supprimé" });
  } catch (err) {
    logger.error({ err }, "Account deletion failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * POST /auth/me/cancel-deletion
 *
 * Annule une suppression de compte programmée (Expert.pendingDeletionAt).
 * Réservé aux EXPERT qui ont déjà déclenché DELETE /auth/me avec des
 * subs actives. N'a aucun effet si le cron auto-delete a déjà tourné
 * (Expert.deletedAt set) — dans ce cas on renvoie 404 (sessions wipe
 * + cookie orphelin l'auront déjà éjecté).
 */
router.post("/me/cancel-deletion", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        expert: {
          select: { id: true, pendingDeletionAt: true, deletedAt: true },
        },
      },
    });

    if (!user || !user.expert || user.expert.deletedAt) {
      res.status(404).json({ error: "Aucune suppression à annuler" });
      return;
    }

    if (!user.expert.pendingDeletionAt) {
      res.status(400).json({ error: "Aucune suppression programmée" });
      return;
    }

    await prisma.expert.update({
      where: { id: user.expert.id },
      data: { pendingDeletionAt: null },
    });

    logger.info({ userId, expertId: user.expert.id }, "Expert account deletion cancelled");

    res.json({ message: "Suppression annulée" });
  } catch (err) {
    logger.error({ err }, "Cancel deletion failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /auth/me/export
 *
 * Export RGPD des données personnelles de l'user en JSON
 * téléchargeable. Inclut le profil utilisateur, le profil expert
 * éventuel, les subscriptions (sans champs Stripe sensibles
 * au-delà du customerId), et les pronos publiés si EXPERT.
 *
 * Rate-limit 1/24h/IP (exportLimiter) pour éviter le DOS.
 */
router.get("/me/export", exportLimiter, authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        deletedAt: true,
        stripeCustomerId: true,
        expert: {
          select: {
            id: true,
            pseudo: true,
            bio: true,
            photoUrl: true,
            sports: true,
            dayPassPrice: true,
            monthlyPrice: true,
            subStatus: true,
            subExpiresAt: true,
            displayOrder: true,
            viewsToday: true,
            createdAt: true,
            updatedAt: true,
            pronos: {
              select: {
                id: true,
                matchName: true,
                league: true,
                pick: true,
                odds: true,
                teasing: true,
                result: true,
                argument: true,
                startTime: true,
                matchDate: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        subscriptions: {
          select: {
            id: true,
            type: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            expert: { select: { id: true, pseudo: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user || user.deletedAt) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        stripeCustomerId: user.stripeCustomerId,
      },
      expertProfile: user.expert ?? null,
      subscriptions: user.subscriptions,
    };

    const dateSlug = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="plarya-export-${user.id}-${dateSlug}.json"`,
    );
    res.send(JSON.stringify(exportData, null, 2));

    logger.info({ userId }, "User data exported (RGPD)");
  } catch (err) {
    logger.error({ err }, "User export failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// NB : l'ancien endpoint GET /auth/session-from-checkout a été retiré
// (sprint refonte 2 phase 2). Il posait un cookie session basé sur
// un `stripe_session_id` visible en URL → vecteur d'élévation si
// l'URL fuitait (logs, screenshare). Le nouveau flow exige le
// magic-link envoyé par email pour authentifier l'acheteur — cf.
// frontend/app/experts/[id]/page.tsx handleCheckoutReturn.

/**
 * POST /auth/resend-access-unlocked
 * Body: { stripeSessionId: string }
 *
 * Fallback si l'email post-paiement (sendAccessUnlockedEmail
 * envoyé automatiquement depuis le webhook checkout.session.completed)
 * n'arrive pas chez l'acheteur (spam Resend, erreur réseau Resend
 * après les 3 retries, etc.).
 *
 * Le frontend appelle cet endpoint depuis la modale email-gate
 * (`/experts/[id]?checkout=success` quand user non-loggé) avec le
 * stripeSessionId présent dans l'URL.
 *
 * Sécurité : ne pose AUCUNE session côté serveur (vs l'ancien
 * /auth/session-from-checkout supprimé). Renvoie juste un nouveau
 * magic-link par email. La session ne sera posée qu'après clic
 * effectif sur le magic-link → /auth/verify.
 *
 * Toujours 200 pour ne pas leaker l'existence d'une session
 * (anti-énumération).
 */
router.post(
  "/resend-access-unlocked",
  resendAccessLimiter,
  validate(resendAccessUnlockedSchema),
  async (req, res) => {
    try {
      const { stripeSessionId } = req.body;

      const subscription = await prisma.subscription.findFirst({
        where: { stripeSessionId },
        include: {
          user: { select: { email: true } },
          expert: { select: { id: true, pseudo: true } },
        },
      });

      // 200 silencieux si pas trouvé — évite de leaker quelles
      // sessions Stripe ont créé une Subscription en DB.
      if (subscription) {
        const magicToken = await createMagicLink(subscription.user.email);
        const redirectTarget = encodeURIComponent(`/experts/${subscription.expert.id}`);
        const magicLinkUrl = `${BACKEND_URL}/auth/verify?token=${magicToken}&redirect=${redirectTarget}`;
        // fire-and-forget — le wrapper sendEmailWithRetry log déjà
        // les échecs en error structuré
        sendAccessUnlockedEmail(
          subscription.user.email,
          subscription.expert.pseudo,
          subscription.expert.id,
          magicLinkUrl,
        );
        logger.info(
          { stripeSessionId, subscriptionId: subscription.id },
          "Access unlocked email re-sent",
        );
      } else {
        logger.warn({ stripeSessionId }, "Resend access requested for unknown stripeSessionId");
      }

      res.json({
        message: "Si un paiement a été enregistré, un nouvel email a été envoyé.",
      });
    } catch (err) {
      logger.error({ err }, "Resend access unlocked failed");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

export default router;
