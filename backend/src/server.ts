import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
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

// Derrière le proxy de l'hébergeur, `req.ip` serait l'IP du proxy : tous
// les rate limiters partageraient un seul compteur pour tout le site.
app.set("trust proxy", 1);

// En-têtes de sécurité. L'API ne sert que du JSON et un export CSV : la CSP
// n'agit que sur des documents, elle est gardée stricte en défense en
// profondeur (frame-ancestors 'none' contre le clickjacking).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
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
    // "require-corp" bloquerait les images tierces sans en-tête CORP.
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS limité aux origines déclarées, avec cookies.
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000").split(",");
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Monté avant express.json() : la vérification de signature Stripe exige le
// corps brut. Il échappe aussi au contrôle CSRF (requêtes signées par Stripe).
app.use("/webhooks", webhookRoutes);

app.use(express.json());
app.use(cookieParser());

// CSRF (voir lib/csrf.ts), après cookieParser.
app.use(csrfTokenIssuer);
app.use(csrfValidator);

// Limiteurs de débit par IP. Ceux propres à /auth sont dans routes/auth.ts.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});
app.use(globalLimiter);

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});

// Une action admin déclenche plusieurs rechargements (stats, listes).
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    logger.error({ err }, "Health check failed: DB unreachable");
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

app.use("/auth", authRoutes);
app.use("/experts", expertRoutes);
app.use("/pronos", pronoRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/admin", adminLimiter, adminRoutes);
app.use("/checkout", checkoutLimiter, checkoutRoutes);
app.use("/bookmakers", bookmakerRoutes);

// Alias permanent /tipsters/* → /experts/*.
app.use("/tipsters", (req, res) => {
  res.redirect(301, "/experts" + req.url);
});

// Filet final : erreur JSON plutôt que la page HTML d'Express. Les 4
// paramètres sont requis pour qu'Express le traite en gestionnaire d'erreurs.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, method: req.method, path: req.path }, "Unhandled error reached global handler");
  if (res.headersSent) return;
  res.status(500).json({ error: "Erreur serveur" });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server running");
  initCronJobs();
});
