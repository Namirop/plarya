import { Router } from "express";
import { prisma } from "../lib/prisma";

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

    res.json(bookmakers);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
