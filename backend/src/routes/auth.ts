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
 * Routes /auth — orchestration HTTP. Logique métier répartie sur
 * deux services :
 *  - auth-service     : magic-link, sessions, fallback Stripe
 *  - account-service  : profil, suppression compte, export RGPD
 *
 * Cette route reste responsable de :
 *  - Cookies (set / clear session_token)
 *  - Redirects HTTP (verify magic-link)
 *  - Rate-limiters
 *  - Réponses 200 génériques anti-énumération
 */

const router = Router();

// Limiteur ciblé : 5 demandes d'envoi de magic-link par IP / 15 min.
// Anti-spam d'emails. Ne couvre PAS /verify (cliqué depuis l'email) ni
// /me / /logout (utilisés en boucle par le hook useUser).
const magicLinkRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes de connexion, réessayez dans quelques minutes" },
});

// /resend-access-unlocked plus restrictif : ce flow ne devrait être
// utilisé qu'en cas de non-réception d'email post-checkout (cas rare).
const resendAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Trop de demandes, réessayez dans quelques minutes" },
});

// /me/export : 1/24h/IP. RGPD permet l'export à la demande mais sans
// cap c'est un vecteur DOS (user avec 10k pronos = JSON lourd).
const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  message: { error: "Un seul export par 24h. Réessaie demain." },
});

// /demo-login : hygiène anti-bruteforce du secret. Déjà gated par flag +
// secret, ce limiteur est une ceinture supplémentaire (20/min/IP).
const demoLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Trop de tentatives, réessayez dans une minute" },
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Valide qu'un param `redirect` est sûr à concaténer après FRONTEND_URL :
 *  - DOIT commencer par "/" (chemin relatif au domaine frontend)
 *  - NE DOIT PAS commencer par "//" (URL protocol-relative qui
 *    permettrait `//evil.com` → `https://evil.com` après normalisation
 *    browser → phishing post-magic-link)
 *  - NE DOIT PAS contenir un schéma absolu type "javascript:" / "data:"
 *
 * Tout redirect invalide tombe vers "/" + log warn.
 */
function isSafeRedirect(target: string): boolean {
  if (typeof target !== "string" || target.length === 0) return false;
  if (!target.startsWith("/")) return false;
  if (target.startsWith("//")) return false;
  // \ peut être interprété comme / par certains browsers
  if (target.startsWith("/\\") || target.startsWith("\\")) return false;
  return true;
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie("session_token", token, sessionCookieOptions());
}

/**
 * GET /auth/csrf
 *
 * Endpoint utilitaire pour forcer le set du cookie csrf_token au cas
 * où aucune requête n'a encore été faite à l'API. Le middleware
 * csrfTokenIssuer pose le cookie si absent, on renvoie juste le token
 * en JSON pour confirmation côté caller.
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
      await requestMagicLink(req.body.email, { ip: req.ip });
      // 200 générique anti-énumération — même réponse si cooldown actif
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
    // En cas d'erreur inattendue (DB down), redirect vers la page
    // d'erreur frontend plutôt qu'une 500 nue — l'utilisateur a cliqué
    // depuis un email, on doit l'envoyer quelque part de visible.
    logger.error({ err }, "Magic link verify error");
    res.redirect(`${FRONTEND_URL}/auth/verify?error=invalid`);
  }
});

// GET /auth/demo-login?role=expert|user&key=<secret>
//
// ⚠️ Connexion démo 1-clic — phase démo client UNIQUEMENT (cf.
// lib/demo-login.ts). Réservée aux espaces EXPERT et USER ; ne donne
// JAMAIS l'ADMIN (compte sérieux → magic-link sur contact@plarya.com).
// À couper avant le launch : ENABLE_DEMO_LOGIN=false sur Railway.
router.get("/demo-login", demoLoginLimiter, async (req, res) => {
  try {
    // Désactivé ou clé invalide → 404 nu : on ne révèle pas l'existence
    // de la route (elle n'apparaît dans aucune UI).
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

    // status === "deleted" : on clear le cookie immédiatement (le
    // service a déjà wipé les sessions DB-side).
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

// NB : l'ancien endpoint GET /auth/session-from-checkout a été retiré
// (sprint refonte 2 phase 2). Il posait un cookie session basé sur un
// `stripe_session_id` visible en URL → vecteur d'élévation si l'URL
// fuitait (logs, screenshare). Le nouveau flow exige le magic-link
// envoyé par email — cf. frontend/app/experts/[id]/page.tsx.

// POST /auth/resend-access-unlocked — Fallback email post-checkout
router.post(
  "/resend-access-unlocked",
  resendAccessLimiter,
  validate(resendAccessUnlockedSchema),
  async (req, res) => {
    try {
      await resendAccessUnlocked(req.body.stripeSessionId);
      // Toujours 200 anti-énumération
      res.json({
        message: "Si un paiement a été enregistré, un nouvel email a été envoyé.",
      });
    } catch (err) {
      handleError(err, res, "POST /auth/resend-access-unlocked");
    }
  },
);

export default router;
