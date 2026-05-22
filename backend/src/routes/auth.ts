import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
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

// POST /auth/request-magic-link
router.post("/request-magic-link", magicLinkRequestLimiter, validate(magicLinkRequestSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const token = await createMagicLink(normalizedEmail);
    const link = `${BACKEND_URL}/auth/verify?token=${token}`;

    // Send email (fire-and-forget)
    sendMagicLinkEmail(normalizedEmail, link);

    // Always return 200 to not leak account existence
    res.json({ message: "Si un compte existe avec cet email, un lien de connexion a été envoyé." });
  } catch (err) {
    logger.error({ err }, "Magic link request error");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

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
      logger.warn(
        { rawRedirect, ip: req.ip },
        "Unsafe redirect param blocked on /auth/verify",
      );
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
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    res.json(user);
  } catch (err) {
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
        const redirectTarget = encodeURIComponent(
          `/experts/${subscription.expert.id}`,
        );
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
        logger.warn(
          { stripeSessionId },
          "Resend access requested for unknown stripeSessionId",
        );
      }

      res.json({
        message:
          "Si un paiement a été enregistré, un nouvel email a été envoyé.",
      });
    } catch (err) {
      logger.error({ err }, "Resend access unlocked failed");
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

export default router;
