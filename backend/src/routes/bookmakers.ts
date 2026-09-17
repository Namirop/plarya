import { Router } from "express";

import { handleError } from "../lib/http-errors";
import { listBookmakersWithAffiliateLinks } from "../services/bookmaker-service";

const router = Router();

// GET /bookmakers : bookmakers et liens d'affiliation.
router.get("/", async (_req, res) => {
  try {
    const bookmakers = await listBookmakersWithAffiliateLinks();

    // Liste quasi statique : cache HTTP long.
    res.set("Cache-Control", "public, max-age=600, s-maxage=1200, stale-while-revalidate=3600");
    res.json(bookmakers);
  } catch (err) {
    handleError(err, res, "GET /bookmakers");
  }
});

export default router;
