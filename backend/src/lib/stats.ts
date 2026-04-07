import { prisma } from "./prisma";

/** Calcule le taux de réussite sur les 10 derniers pronos validés */
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

/** Calcule la streak de pronos consécutifs gagnés */
export async function calcStreak(tipsterId: string): Promise<number> {
  const pronos = await prisma.prono.findMany({
    where: { tipsterId, result: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    select: { result: true },
  });

  let streak = 0;
  for (const p of pronos) {
    if (p.result === "WON") streak++;
    else break;
  }
  return streak;
}

/** Retourne le badge streak emoji */
export function streakBadge(streak: number): string {
  if (streak >= 10) return "🔥🔥🔥";
  if (streak >= 5) return "🔥🔥";
  if (streak >= 3) return "🔥";
  return "";
}
