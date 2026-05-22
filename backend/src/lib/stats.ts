import { prisma } from "./prisma";

/** Calcule le taux de réussite sur les 10 derniers pronos validés.
 *  Usage interne uniquement (dashboard expert, admin) — JAMAIS affiché
 *  sur les pages publiques (CLAUDE.md §6). */
export async function calcWinRate(tipsterId: string): Promise<number> {
  const recent = await prisma.prono.findMany({
    where: { tipsterId, result: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { result: true },
  });

  if (recent.length === 0) return 0;

  const won = recent.filter((p) => p.result === "WON").length;
  return Math.round((won / recent.length) * 100);
}
