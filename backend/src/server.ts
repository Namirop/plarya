import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth";
import tipsterRoutes from "./routes/tipsters";
import pronoRoutes from "./routes/pronos";
import subscriptionRoutes from "./routes/subscriptions";
import adminRoutes from "./routes/admin";
import checkoutRoutes from "./routes/checkout";
import webhookRoutes from "./routes/webhooks";
import bookmakerRoutes from "./routes/bookmakers";
import { initCronJobs } from "./lib/cron";

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet());

// CORS — restrict to allowed origins
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000").split(",");
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Webhook route MUST be before express.json() (needs raw body for signature verification)
app.use("/webhooks", webhookRoutes);

app.use(express.json());
app.use(cookieParser());

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

// Admin: 20 req/min
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});

// Health check
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// Routes
app.use("/auth", authRoutes);
app.use("/tipsters", tipsterRoutes);
app.use("/pronos", pronoRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/admin", adminLimiter, adminRoutes);
app.use("/checkout", checkoutLimiter, checkoutRoutes);
app.use("/bookmakers", bookmakerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initCronJobs();
});
