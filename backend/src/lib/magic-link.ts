import crypto from "crypto";
import { prisma } from "./prisma";

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createMagicLink(email: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);

  await prisma.magicLink.create({
    data: { token, email: email.toLowerCase(), expiresAt },
  });

  return token;
}

export async function verifyMagicLink(token: string): Promise<{ email: string } | null> {
  const magicLink = await prisma.magicLink.findUnique({ where: { token } });

  if (!magicLink) return null;
  if (magicLink.usedAt) return null;
  if (magicLink.expiresAt < new Date()) return null;

  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  return { email: magicLink.email };
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function verifySession(
  token: string,
): Promise<{ userId: string; role: string } | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, role: true } } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return { userId: session.user.id, role: session.user.role };
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}
