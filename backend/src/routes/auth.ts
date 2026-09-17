import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";

import { clearCookieOptions, sessionCookieOptions } from "../lib/cookies";
import { isDemoLoginEnabled, isDemoRole, isValidDemoKey } from "../lib/demo-login";
import { handleError } from "../lib/http-errors";
import { logger } from "../lib/logger";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createDemoLoginSession,
  logoutSession,
  requestMagicLink,
  resendAccessUnlocked,
  verifyMagicLinkAndCreateSession,
} from "../services/auth-service";
import {
  cancelScheduledDeletion,
  deleteAccount,
  exportUserData,
  getActiveUser,
  getDeletionStatus,
} from "../services/account-service";
import { magicLinkRequestSchema, resendAccessUnlockedSchema } from "../validators/auth";

/**
 * Routes /auth : cookies, redirections, limiteurs et réponses génériques
 * anti-énumération. La logique métier est dans auth-service (magic-link,
 * sessions) et account-service (profil, suppression, export RGPD).
 */

const router = Router();

// Anti-spam d'emails ; /verify, /me et /logout ne sont pas concernés.
const magicLinkRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes de connexion, réessayez dans quelques minutes" },
});

// Renvoi de l'email post-paiement : usage exceptionnel, limite plus basse.
const resendAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Trop de demandes, réessayez dans quelques minutes" },
});

// L'export RGPD peut être lourd : un par IP toutes les 24 h.
const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  message: { error: "Un seul export par 24h. Réessaie demain." },
});

// Freine le brute-force du secret de connexion démo.
const demoLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Trop de tentatives, réessayez dans une minute" },
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Anti open-redirect : seul un chemin relatif au frontend est accepté.
 * `//evil.com` ou `/\evil.com` seraient interprétés comme un autre domaine.
 */
function isSafeRedirect(target: string): boolean {
  if (typeof target !== "string" || target.length === 0) return false;
  if (!target.startsWith("/")) return false;
  if (target.startsWith("//")) return false;
  if (target.startsWith("/\\") || target.startsWith("\\")) return false;
  return true;
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie("session_token", token, sessionCookieOptions());
}

// GET /auth/csrf : renvoie le token dans le corps, car un frontend hébergé sur
// un autre domaine ne peut pas lire le cookie `csrf_token` de l'API.
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
      await requestMagicLink(req.body.email, { ip: req.ip });
      // Réponse identique quel que soit l'état du compte (anti-énumération).
      res.json({
        message: "Si un compte existe avec cet email, un lien de connexion a été envoyé.",
      });
    } catch (err) {
      handleError(err, res, "POST /auth/request-magic-link");
    }
  },
);

// GET /auth/verify?token=xxx&redirect=/some/path
router.get("/verify", async (req, res) => {
  try {
    const token = (req.query.token as string) || "";
    const rawRedirect = (req.query.redirect as string) || "/";

    let redirect = "/";
    if (rawRedirect !== "/" && isSafeRedirect(rawRedirect)) {
      redirect = rawRedirect;
    } else if (rawRedirect !== "/") {
      logger.warn({ rawRedirect, ip: req.ip }, "Unsafe redirect param blocked on /auth/verify");
    }

    const result = await verifyMagicLinkAndCreateSession(token, { ip: req.ip });
    switch (result.status) {
      case "invalid":
        res.redirect(`${FRONTEND_URL}/auth/verify?error=invalid`);
        return;
      case "expired":
        res.redirect(`${FRONTEND_URL}/auth/verify?error=expired`);
        return;
      case "deleted":
        res.redirect(`${FRONTEND_URL}/auth/verify?error=deleted`);
        return;
      case "ok":
        setSessionCookie(res, result.sessionToken);
        res.redirect(`${FRONTEND_URL}${redirect}`);
        return;
    }
  } catch (err) {
    // Lien ouvert depuis un email : page d'erreur du frontend plutôt qu'un 500 brut.
    logger.error({ err }, "Magic link verify error");
    res.redirect(`${FRONTEND_URL}/auth/verify?error=invalid`);
  }
});

// GET /auth/demo-login?role=expert|user&key=<secret> (voir lib/demo-login.ts)
router.get("/demo-login", demoLoginLimiter, async (req, res) => {
  try {
    // 404 si désactivée ou clé invalide : la route ne révèle pas son existence.
    if (!isDemoLoginEnabled() || !isValidDemoKey(req.query.key as string | undefined)) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const role = req.query.role;
    if (!isDemoRole(role)) {
      res.status(400).json({ error: "Paramètre 'role' attendu : 'expert' ou 'user'." });
      return;
    }

    const outcome = await createDemoLoginSession(role);
    if (outcome.status === "account_missing") {
      res.status(503).json({
        error: "Compte démo introuvable — lance le seed (npm run db:seed) puis réessaie.",
      });
      return;
    }
    if (outcome.status === "refused") {
      res.status(403).json({ error: "Connexion démo refusée pour ce compte." });
      return;
    }

    setSessionCookie(res, outcome.sessionToken);
    logger.info({ role }, "Demo login session created");
    res.redirect(`${FRONTEND_URL}${outcome.redirectPath}`);
  } catch (err) {
    handleError(err, res, "GET /auth/demo-login");
  }
});

// POST /auth/logout
router.post("/logout", async (req, res) => {
  try {
    await logoutSession(req.cookies?.session_token);
    res.clearCookie("session_token", clearCookieOptions());
    res.json({ message: "Déconnecté" });
  } catch (err) {
    handleError(err, res, "POST /auth/logout");
  }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const me = await getActiveUser(authReq.user.userId);
    res.json(me);
  } catch (err) {
    handleError(err, res, "GET /auth/me");
  }
});

// GET /auth/me/deletion-status
router.get("/me/deletion-status", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const status = await getDeletionStatus(authReq.user.userId);
    res.json(status);
  } catch (err) {
    handleError(err, res, "GET /auth/me/deletion-status");
  }
});

// DELETE /auth/me — suppression RGPD (immédiate ou programmée)
router.delete("/me", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const result = await deleteAccount(authReq.user.userId);

    if (result.status === "scheduled") {
      res.status(202).json({
        status: "scheduled",
        pendingDeletionAt: result.pendingDeletionAt.toISOString(),
        lastSubExpiresAt: result.lastSubExpiresAt.toISOString(),
        message:
          "Ta suppression est programmée. Elle deviendra effective à la fin du dernier abonnement actif.",
      });
      return;
    }

    // Suppression immédiate : les sessions sont déjà effacées en base.
    res.clearCookie("session_token", clearCookieOptions());
    res.json({ message: "Compte supprimé" });
  } catch (err) {
    handleError(err, res, "DELETE /auth/me");
  }
});

// POST /auth/me/cancel-deletion
router.post("/me/cancel-deletion", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    await cancelScheduledDeletion(authReq.user.userId);
    res.json({ message: "Suppression annulée" });
  } catch (err) {
    handleError(err, res, "POST /auth/me/cancel-deletion");
  }
});

// GET /auth/me/export — Export RGPD JSON
router.get("/me/export", exportLimiter, authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const exportData = await exportUserData(authReq.user.userId);
    const dateSlug = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="plarya-export-${exportData.user.id}-${dateSlug}.json"`,
    );
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    handleError(err, res, "GET /auth/me/export");
  }
});

// POST /auth/resend-access-unlocked : renvoie l'email post-paiement. Aucune
// session n'est posée à partir du `stripe_session_id` (visible dans l'URL,
// donc susceptible de fuiter) : la connexion passe par le magic-link.
router.post(
  "/resend-access-unlocked",
  resendAccessLimiter,
  validate(resendAccessUnlockedSchema),
  async (req, res) => {
    try {
      await resendAccessUnlocked(req.body.stripeSessionId);
      // Toujours 200 (anti-énumération).
      res.json({
        message: "Si un paiement a été enregistré, un nouvel email a été envoyé.",
      });
    } catch (err) {
      handleError(err, res, "POST /auth/resend-access-unlocked");
    }
  },
);

export default router;
