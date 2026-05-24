import { Router } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

const router = Router();

// GET /bookmakers — List all bookmakers with affiliate links
router.get("/", async (_req, res) => {
  try {
    const bookmakers = await prisma.bookmaker.findMany({
      include: {
        affiliateLinks: {
          select: { id: true, url: true, label: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Cache long (Sprint Polish A.9) : la liste des bookmakers
    // bouge rarement (édition admin ponctuelle). 10 min max-age =
    // 99% des visiteurs hittent le cache.
    res.set("Cache-Control", "public, max-age=600, s-maxage=1200, stale-while-revalidate=3600");
    res.json(bookmakers);
  } catch (err) {
    logger.error({ err, route: "GET /bookmakers" }, "List bookmakers failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
