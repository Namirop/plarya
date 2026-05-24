import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";
import authRoutes from "./routes/auth";
import expertRoutes from "./routes/experts";
import pronoRoutes from "./routes/pronos";
import subscriptionRoutes from "./routes/subscriptions";
import adminRoutes from "./routes/admin";
import checkoutRoutes from "./routes/checkout";
import webhookRoutes from "./routes/webhooks";
import bookmakerRoutes from "./routes/bookmakers";
import { initCronJobs } from "./lib/cron";
import { csrfTokenIssuer, csrfValidator } from "./lib/csrf";

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers + CSP strict (cf. audit Polish A.8).
//
// On configure helmet manuellement plutôt qu'en defaults pour pouvoir
// définir une Content-Security-Policy adaptée au projet :
//  - script-src 'self' + 'unsafe-inline' : nécessaire pour Next dev
//    (HMR injecte des scripts inline). En prod on durcira via nonce
//    quand on aura une étape de build dédiée — pour l'instant accepté
//    car le risque XSS reste limité par les autres mitigations.
//  - style-src 'self' + 'unsafe-inline' : Tailwind v4 + Next CSS-in-JS
//    posent des styles inline nécessaires pour l'hydratation.
//  - img-src 'self' + data: + SportsDB (badges ligues) + hôtes
//    images whitelistés (cf. next.config.ts remotePatterns).
//  - connect-src 'self' + api.stripe.com (Stripe.js fetch) + r.stripe.com
//    (Stripe Radar) + api.resend.com (envoi mails).
//  - frame-src js.stripe.com + hooks.stripe.com : Stripe Checkout
//    embed iframe.
//  - frame-ancestors 'none' : empêche le clickjacking (iframe Plarya
//    depuis un autre site).
//  - object-src 'none' : pas de Flash/applets.
//  - upgrade-insecure-requests : force https si headers passent en
//    prod.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          "data:",
          "https://r2.thesportsdb.com",
          "https://www.thesportsdb.com",
          "https://i.imgur.com",
          "https://res.cloudinary.com",
          "https://www.gravatar.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://r.stripe.com",
          "https://api.resend.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // crossOriginEmbedderPolicy par défaut "require-corp" casse le
    // chargement des badges SportsDB qui n'exposent pas CORP. On
    // désactive — la CSP img-src couvre déjà le risque.
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS — restrict to allowed origins
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000").split(",");
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Webhook route MUST be before express.json() (needs raw body for signature verification)
app.use("/webhooks", webhookRoutes);

app.use(express.json());
app.use(cookieParser());

// CSRF — double-submit cookie pattern (cf. lib/csrf.ts). Issuer pose le
// cookie csrf_token si absent ; validator bloque les requêtes mutantes
// sans header X-CSRF-Token correspondant. Monté APRÈS cookieParser
// (requis pour lire le cookie) et APRÈS le mount /webhooks (Stripe ne
// connaît évidemment pas notre token — il signe ses requêtes via le
// secret webhook).
app.use(csrfTokenIssuer);
app.use(csrfValidator);

// --- Rate limiters ---

// Global: 100 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});
app.use(globalLimiter);

// Auth : le rate limit pour /auth/request-magic-link est défini dans
// routes/auth.ts et appliqué uniquement à cette route (anti-spam emails).
// /verify, /me, /logout ne doivent PAS être rate-limités au niveau auth.

// Checkout: 5 req/min
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});

// Admin: 100 req/min — un admin légitime enchaîne facilement plusieurs
// actions (PATCH override résultat → refetch stats → refetch listes) ;
// 20/min était sous-dimensionné (cap hit en ~6 actions normales).
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});

// Health check
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    // Log explicite : un health check qui flap est un signal opérationnel
    // (DB down, pool épuisé, etc.) qu'on ne veut pas perdre. Le `err`
    // typé `unknown` est passé tel quel à pino qui sérialise via son
    // err-serializer intégré (stack + name + message).
    logger.error({ err }, "Health check failed: DB unreachable");
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// Routes
app.use("/auth", authRoutes);
app.use("/experts", expertRoutes);
app.use("/pronos", pronoRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/admin", adminLimiter, adminRoutes);
app.use("/checkout", checkoutLimiter, checkoutRoutes);
app.use("/bookmakers", bookmakerRoutes);

// Backward-compat : anciennes URLs /tipsters/* → /experts/* en 301.
// Couvre les magic-links générés avant le rename (cf. CLAUDE.md §1.1
// renommage produit). À retirer après 6 mois si aucun hit sur ces routes.
app.use("/tipsters", (req, res) => {
  res.redirect(301, "/experts" + req.url);
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server running");
  initCronJobs();
});
