import { Router } from "express";

import { handleError } from "../lib/http-errors";
import { listBookmakersWithAffiliateLinks } from "../services/bookmaker-service";

const router = Router();

// GET /bookmakers — List all bookmakers with affiliate links
router.get("/", async (_req, res) => {
  try {
    const bookmakers = await listBookmakersWithAffiliateLinks();

    // Cache long (Sprint Polish A.9) : la liste des bookmakers
    // bouge rarement (édition admin ponctuelle). 10 min max-age =
    // 99% des visiteurs hittent le cache.
    res.set("Cache-Control", "public, max-age=600, s-maxage=1200, stale-while-revalidate=3600");
    res.json(bookmakers);
  } catch (err) {
    handleError(err, res, "GET /bookmakers");
  }
});

export default router;
