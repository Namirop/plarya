import { prisma } from "./prisma";

/** Taux de réussite (%) sur les 10 derniers pronos tranchés. Réservé au
 *  tableau de bord de l'expert (`GET /experts/me`), jamais exposé publiquement. */
export async function calcWinRate(expertId: string): Promise<number> {
  const recent = await prisma.prono.findMany({
    where: { expertId, result: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { result: true },
  });

  if (recent.length === 0) return 0;

  const won = recent.filter((p) => p.result === "WON").length;
  return Math.round((won / recent.length) * 100);
}
