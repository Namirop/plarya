import { Router } from "express";
import { prisma } from "../lib/prisma";
import { createMagicLink, verifyMagicLink, createSession, deleteSession } from "../lib/magic-link";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { magicLinkRequestSchema } from "../validators/auth";
import { sendMagicLinkEmail } from "../lib/emails";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const IS_PROD = process.env.NODE_ENV === "production";

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
router.post("/request-magic-link", validate(magicLinkRequestSchema), async (req, res) => {
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
    console.error("Magic link request error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /auth/verify?token=xxx&redirect=/some/path
router.get("/verify", async (req, res) => {
  try {
    const token = req.query.token as string;
    const redirect = (req.query.redirect as string) || "/";

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
    console.error("Magic link verify error:", err);
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

export default router;
