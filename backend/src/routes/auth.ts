import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { registerSchema, loginSchema, refreshSchema, changePasswordSchema } from "../validators/auth";
import { sendWelcomeEmail } from "../lib/emails";

const router = Router();

// POST /auth/register
router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { email, password, pseudo } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email déjà utilisé" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, ...(pseudo && { tipster: undefined }) },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    // Fire-and-forget welcome email
    sendWelcomeEmail(email);

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /auth/login
router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /auth/refresh
router.post("/refresh", validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);

    // Re-fetch user to get current role
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      res.status(401).json({ error: "Utilisateur introuvable" });
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Refresh token invalide" });
  }
});

// PATCH /auth/password — Change password
router.patch("/password", authMiddleware, validate(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Mot de passe actuel incorrect" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
