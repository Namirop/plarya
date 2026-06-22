import { prisma } from "../lib/prisma";

export async function listBookmakersWithAffiliateLinks() {
  return prisma.bookmaker.findMany({
    include: {
      affiliateLinks: {
        select: { id: true, url: true, label: true },
      },
    },
    orderBy: { name: "asc" },
  });
}
