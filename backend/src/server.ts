import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth";
import tipsterRoutes from "./routes/tipsters";
import pronoRoutes from "./routes/pronos";
import subscriptionRoutes from "./routes/subscriptions";
import adminRoutes from "./routes/admin";
import checkoutRoutes from "./routes/checkout";
import webhookRoutes from "./routes/webhooks";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Webhook route MUST be before express.json() (needs raw body for signature verification)
app.use("/webhooks", webhookRoutes);

app.use(express.json());

// Rate limiting on auth routes (10 req/min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
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
app.use("/auth", authLimiter, authRoutes);
app.use("/tipsters", tipsterRoutes);
app.use("/pronos", pronoRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/admin", adminRoutes);
app.use("/checkout", checkoutRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
