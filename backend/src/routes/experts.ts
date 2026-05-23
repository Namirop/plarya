import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { calcWinRate } from "../lib/stats";
import { authMiddleware } from "../middleware/auth";
import { expertMiddleware } from "../middleware/expert";
import { updateExpertSchema } from "../validators/expert-self";

const router = Router();

/**
 * Rate-limit pour POST /experts/:id/view — dédoublonnement compteur
 * de vues.
 *
 * Sans ce limiter, un attaquant peut spammer cet endpoint avec une
 * boucle (curl, F5 répété, bot) pour gonfler artificiellement le
 * `viewsToday` d'un expert et fausser la preuve sociale affichée
 * publiquement.
 *
 * Clé : IP + expertId (issu de req.params.id). 1 incrément par
 * couple par heure → un user légitime qui rafraîchit la page voit
 * le compteur progresser une seule fois sur la fenêtre. Les visites
 * via NAT / IP partagée d'entreprise restent acceptables (1
 * incrément par IP, pas par device — cohérent avec le principe
 * "vues" plutôt que "visiteurs uniques").
 *
 * 1h plutôt qu'1j : reset viewsToday est de toute façon nocturne
 * (cf. cron midnight_reset) ; au pire un user qui revient 3× dans
 * la journée incrémente 3× sur 24h, ce qui est OK.
 */
const viewIncrementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 1,
  // Pas de message d'erreur visible à l'user : les hits throttlés
  // sont silencieux (handler custom → 200 sans incrément), sinon
  // chaque rafraîchissement de page afficherait une erreur.
  skipFailedRequests: false,
  // Standard headers, useful in dev to verify behavior via DevTools.
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // ipKeyGenerator normalise l'IP : pour IPv6 il colle le préfixe
    // /64 (sinon un user IPv6 bouge dans son /64 et contourne le
    // limiter — un seul ISP attribue typiquement le même /64 à un
    // device, donc /64 = "1 device"). Pour IPv4 il renvoie l'IP telle
    // quelle. Sans ce helper, express-rate-limit 8+ refuse de démarrer
    // (ERR_ERL_KEY_GEN_IPV6).
    const ip = ipKeyGenerator(req.ip ?? "unknown");
    return `view:${ip}:${req.params.id}`;
  },
  // Handler custom : on renvoie 200 (throttled silently) plutôt que
  // 429. Le frontend continue à recevoir un succès apparent, juste
  // sans incrément en DB. UX douce.
  handler: (_req, res) => {
    res.json({ ok: true, throttled: true });
  },
});

// GET /experts/me — Expert's own profile + stats (must be before /:id)
router.get("/me", authMiddleware, expertMiddleware, async (req, res) => {
  try {
    const expert = await prisma.expert.findUnique({
      where: { userId: req.user!.userId },
    });

    // 404 si pas de profile OU si soft-deleted (cohérence RGPD :
    // un expert qui a supprimé son compte ne doit plus pouvoir
    // accéder à son ancien profile via /experts/me même si une
    // session orpheline subsistait).
    if (!expert || expert.deletedAt) {
      res.status(404).json({ error: "Profil expert introuvable" });
      return;
    }

    const winRate = await calcWinRate(expert.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pronosToday = await prisma.prono.count({
      where: { expertId: expert.id, createdAt: { gte: today } },
    });

    res.json({
      id: expert.id,
      pseudo: expert.pseudo,
      bio: expert.bio,
      dailyNote: expert.dailyNote,
      dailyNoteDate: expert.dailyNoteDate,
      photoUrl: expert.photoUrl,
      sports: expert.sports,
      dayPassPrice: expert.dayPassPrice,
      monthlyPrice: expert.monthlyPrice,
      warningMessage: expert.warningMessage,
      winRate,
      pronosToday,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /experts/me — Update expert profile
router.patch("/me", authMiddleware, expertMiddleware, async (req, res) => {
  try {
    const parsed = updateExpertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const expert = await prisma.expert.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!expert) {
      res.status(404).json({ error: "Profil expert introuvable" });
      return;
    }

    const { pseudo, bio, dailyNote, sports } = parsed.data;

    // Check pseudo uniqueness if changed
    if (pseudo && pseudo !== expert.pseudo) {
      const existing = await prisma.expert.findUnique({ where: { pseudo } });
      if (existing) {
        res.status(400).json({ error: "Ce pseudo est déjà pris" });
        return;
      }
    }

    // Prisma.ExpertUpdateInput — type strict pour le patch partiel
    // (Sprint Polish B2.6). Avant on utilisait `Record<string, unknown>`
    // qui laissait passer n'importe quel champ (silent ignore Prisma
    // si nom invalide, mais aucun type-check à la rédaction). Avec
    // ExpertUpdateInput, toute typo (`dailyNotes` au lieu de
    // `dailyNote`) crashe le tsc.
    const updateData: Prisma.ExpertUpdateInput = {};
    if (pseudo !== undefined) updateData.pseudo = pseudo;
    if (bio !== undefined) updateData.bio = bio;
    if (sports !== undefined) updateData.sports = sports;
    if (dailyNote !== undefined) {
      updateData.dailyNote = dailyNote;
      updateData.dailyNoteDate = new Date();
    }

    const updated = await prisma.expert.update({
      where: { id: expert.id },
      data: updateData,
    });

    res.json({
      id: updated.id,
      pseudo: updated.pseudo,
      bio: updated.bio,
      dailyNote: updated.dailyNote,
      dailyNoteDate: updated.dailyNoteDate,
      sports: updated.sports,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /experts — Experts sorted by displayOrder ASC, createdAt DESC.
//
// Performance : avant Sprint Polish A.6, on faisait 2 queries
// supplémentaires PAR expert (count + findMany pronosToday) → O(N)
// avec N = nombre d'experts. Refacto avec `include` Prisma : on
// récupère expert + ses pronos du jour en UNE seule query (Prisma
// génère un JOIN ou prefetch). pronosToday se calcule ensuite côté
// JS (length de l'array). Total : 1 query au lieu de 1 + 2N.
//
// Champs sélectionnés sur pronos : uniquement les champs publics
// (matchName/league/odds/teasing/result/startTime/isFeatured/
// matchDate/createdAt). PAS `pick` ni `argument` qui sont gated
// derrière la sub active — on ne veut pas les exposer ici via une
// query non-authentifiée.
router.get("/", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const experts = await prisma.expert.findMany({
      // Filtrer :
      //  - deletedAt: les experts soft-deleted (RGPD).
      //  - pendingDeletionAt: les experts en suppression programmée
      //    (n'acceptent plus de nouveaux abonnés → pas de raison de
      //    les pousser sur la homepage). Les abonnés existants
      //    accèdent toujours au profile via /experts/:id direct.
      where: { deletedAt: null, pendingDeletionAt: null },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        pronos: {
          where: { createdAt: { gte: today } },
          select: {
            id: true,
            matchName: true,
            league: true,
            odds: true,
            teasing: true,
            result: true,
            startTime: true,
            isFeatured: true,
            matchDate: true,
            createdAt: true,
          },
        },
      },
    });

    const enriched = experts.map((e) => ({
      id: e.id,
      pseudo: e.pseudo,
      bio: e.bio,
      dailyNote: e.dailyNote,
      photoUrl: e.photoUrl,
      sports: e.sports,
      dayPassPrice: e.dayPassPrice,
      monthlyPrice: e.monthlyPrice,
      warningMessage: e.warningMessage,
      viewsToday: e.viewsToday,
      pronosToday: e.pronos.length,
      todayPronos: e.pronos,
    }));

    const limit = req.query.all === "true" ? enriched.length : 6;
    // Cache public (Sprint Polish A.9) : la homepage est servie au
    // même contenu à tous les visiteurs anonymes ; 60s max-age est
    // un compromis fraîcheur (un expert publie une nouvelle analyse
    // → visible en <1 min) / charge (60s × N visiteurs = 1 hit
    // backend au lieu de N). stale-while-revalidate=600 → si Vercel/
    // Cloudflare front-cache, ils peuvent re-servir l'ancienne valeur
    // jusqu'à 10 min en revalidant en arrière-plan.
    res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=600");
    res.json(enriched.slice(0, limit));
  } catch (err) {
    logger.error({ err, route: "GET /experts" }, "List experts failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /experts/:id — Expert profile with blurred pronos
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const expert = await prisma.expert.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    // 404 si l'expert n'existe pas OU s'il est soft-deleted (RGPD).
    if (!expert || expert.deletedAt) {
      res.status(404).json({ error: "Expert introuvable" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pronosToday = await prisma.prono.count({
      where: { expertId: expert.id, createdAt: { gte: today } },
    });

    // Past pronos: show pick (public track record). Pending: hide pick (blurred).
    const rawPronos = await prisma.prono.findMany({
      where: { expertId: expert.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        matchName: true,
        league: true,
        pick: true,
        odds: true,
        teasing: true,
        result: true,
        startTime: true,
        isFeatured: true,
        matchDate: true,
        createdAt: true,
      },
    });

    // Strip pick from PENDING pronos
    const pronos = rawPronos.map((p) => ({
      ...p,
      pick: p.result === "PENDING" ? null : p.pick,
    }));

    // Cache public (Sprint Polish A.9) — même rationnel que GET /experts.
    // Note : pas d'effet pour les visiteurs LOGGÉS qui ont une sub
    // active (ils fetchent /experts/:id/pronos en plus, gated). On
    // cache la version masquée (pick=null sur PENDING) ; pas de fuite.
    res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=600");
    res.json({
      id: expert.id,
      pseudo: expert.pseudo,
      bio: expert.bio,
      dailyNote: expert.dailyNote,
      photoUrl: expert.photoUrl,
      sports: expert.sports,
      dayPassPrice: expert.dayPassPrice,
      monthlyPrice: expert.monthlyPrice,
      warningMessage: expert.warningMessage,
      viewsToday: expert.viewsToday,
      // Flag exposé publiquement pour que le frontend désactive les
      // CTA d'achat et affiche un banner explicite. On ne 404 PAS le
      // profile : les abonnés existants doivent pouvoir continuer à
      // accéder à leurs analyses jusqu'à expiration de leur sub.
      pendingDeletion: !!expert.pendingDeletionAt,
      pronosToday,
      pronos,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /experts/:id/view — Increment view counter
// Le limiter passe AVANT le handler : si le couple (IP, expertId) a
// déjà incrémenté dans la fenêtre, le handler custom renvoie
// { ok: true, throttled: true } sans toucher la DB.
router.post("/:id/view", viewIncrementLimiter, async (req, res) => {
  try {
    await prisma.expert.update({
      where: { id: req.params.id as string },
      data: { viewsToday: { increment: 1 } },
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Expert introuvable" });
  }
});

// GET /experts/:id/pronos — Full pronos (requires active subscription)
router.get("/:id/pronos", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const expertId = req.params.id as string;

    // Check if user has active subscription to this expert
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        expertId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    // Allow expert to see their own pronos, or admin
    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
      select: { userId: true },
    });

    const isOwner = expert?.userId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (!subscription && !isOwner && !isAdmin) {
      res.status(403).json({ error: "Abonnement requis pour voir les pronos" });
      return;
    }

    const pronos = await prisma.prono.findMany({
      where: { expertId },
      orderBy: { createdAt: "desc" },
      include: {
        bookmakerOdds: {
          include: {
            bookmaker: {
              include: { affiliateLinks: true },
            },
          },
        },
      },
    });

    res.json(pronos);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
