# Plarya — Backend

Express 5 + Prisma 7 — API REST Plarya.

## Stack

- Express 5
- Prisma 7 + PostgreSQL
- Auth : magic-link (Resend), session cookies httpOnly
- Paiements : Stripe webhooks + Checkout sessions (idempotent, signature-verified)
- Cron : node-cron (jobs récurrents dans le process backend long-running)
- Logs : pino structuré + masquage PII
- Validation : Zod (schémas partagés via `validators/shared.ts`)

## Endpoints principaux

### Auth

- `POST /auth/request-magic-link` — Demande un magic-link (anti-spam : 5/15min/IP)
- `GET /auth/verify` — Valide un magic-link → pose la session cookie
- `POST /auth/logout` — Détruit la session
- `GET /auth/me` — Profile session courante
- `DELETE /auth/me` — Supprime le compte (soft delete + anonymise + cooldown 7j)
- `POST /auth/me/cancel-deletion` — Annule une suppression programmée (EXPERT avec subs)
- `GET /auth/me/export` — Export RGPD JSON (rate-limited 1/24h)
- `GET /auth/me/deletion-status` — Pilote l'UI Zone dangereuse
- `GET /auth/csrf` — Force le set du cookie csrf_token
- `POST /auth/resend-access-unlocked` — Renvoie le mail magic-link post-paiement (3/15min)
- `GET /auth/demo-login?role=expert|user&key=…` — Connexion démo 1-clic aux comptes seedés, jamais ADMIN
  (inactive tant que `ENABLE_DEMO_LOGIN` ≠ `true` ; clé comparée à `DEMO_LOGIN_SECRET`)

### Experts (public)

- `GET /experts` — Liste (cache HTTP 60s)
- `GET /experts/:id` — Profil public : analyses du jour sans pick, pour tout le monde (cache 60s)
- `POST /experts/:id/view` — Incrément vue (rate-limited 1/h/IP/expertId)

### Experts (authentifié)

- `GET /experts/me` — Profile complet expert connecté
- `PATCH /experts/me` — Update profile (EXPERT)
- `GET /experts/:id/pronos` — Pronos complets (auth + sub active OU owner/admin)

### Analyses (authentifié)

- `POST /pronos` — Publier une analyse (EXPERT)
- `GET /pronos/mine` — Mes analyses (EXPERT)
- `PATCH /pronos/:id/result` — Déclarer le résultat (auteur ou admin)
- `GET /pronos/:id` — Détail d'une analyse (accès actif requis)

### Bookmakers

- `GET /bookmakers` — Bookmakers et liens d'affiliation (bloc « Meilleures cotes »)

### Checkout / Stripe

- `POST /checkout/create-session` — Day pass / abonnement
- `POST /checkout/become-expert` — Abonnement expert trimestriel (rôle EXPERT attribué au webhook)
- `POST /webhooks/stripe` — Webhook signé par Stripe (idempotent au niveau event)

### Subscriptions

- `POST /subscriptions/check` — A l'user un accès actif à cet expert ?
- `GET /subscriptions/check-stripe-session` — Le webhook a-t-il créé la sub ?
- `GET /subscriptions/me` — Mes abonnements + day-passes

### Admin (auth ADMIN)

- `GET /admin/stats`, `/admin/stats/revenue`, `/admin/stats/sales`, `/admin/stats/by-expert`
- `GET /admin/stats/export.csv` — Export CSV ventes
- `GET /admin/experts`, `/admin/users`
- `POST /admin/experts` — Création d'un expert (prix bornés côté validation)
- `GET /admin/pronos?limit&offset` — Paginé (default 50, max 200)
- `PATCH /admin/pronos/:id/result` — Override résultat
- `PATCH /admin/experts/:id/warning` — Avertissement profile
- `PATCH /admin/experts/:id/display-order` — Réordonne la homepage
- `POST /admin/send-daily-emails` — Trigger manuel emails J+1

### Santé

- `GET /health` — Vérifie la connexion à la base

## Sécurité

- **helmet** avec CSP strict (script/style 'self' ; img-src SportsDB, imgur, Cloudinary, Gravatar ;
  Stripe en connect-src / frame-src)
- **Rate-limiters** par endpoint : magic-link (5/15min), renvoi d'accès (3/15min), export RGPD (1/24h),
  demo-login (20/min), checkout (5/min), check-stripe-session (60/min), admin (100/min),
  views (1/h/IP/expertId — IPv6 via `ipKeyGenerator`), global fallback (100/min)
- **CSRF** double-submit cookie : `csrf_token` non-httpOnly + header `X-CSRF-Token` requis
  sur toute méthode mutante (POST/PATCH/PUT/DELETE), sauf `/webhooks` (signature Stripe)
- **Sessions** : httpOnly, SameSite via `COOKIE_SAMESITE` (défaut `lax`, `none` force Secure),
  domaine via `COOKIE_DOMAIN` (ex. `.plarya.com` pour partager apex et sous-domaine API), secure en prod, 30j TTL
- **Magic-links** : crypto-random 32 bytes, single-use, 15min TTL, purge cron quotidien
- **Cooldown RGPD** : 7j après suppression de compte, blocage silencieux des magic-links
  pour cet email (cf. table `DeletedEmailCooldown`)

## Setup local

1. Postgres local sur `:5432` avec une DB `plarya`
2. `cp .env.example .env` puis remplir DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run db:seed` (crée 6 experts test + magic-links 24h dans les logs console)
6. `npm run dev` → port 4000
7. (Optionnel) `stripe listen --forward-to localhost:4000/webhooks/stripe` pour les paiements test

## Scripts

- `npm run dev` — Dev (tsx watch)
- `npm run build` — Compile TypeScript → `dist/`
- `npm run start` — Start prod (depuis `dist/`)
- `npm run db:migrate` — Prisma migrate dev
- `npm run db:deploy` — Prisma migrate deploy (migrations en prod)
- `npm run db:generate` — Prisma generate
- `npm run db:studio` — Prisma Studio
- `npm run db:seed` — Reseed des comptes test ; ⚠ régénère aussi les cotes bookmakers de toutes les analyses
- `npm run db:seed:reset` — Wipe complet + reseed
- `npm run db:set-admin` — Crée ou promeut le compte ADMIN réel (idempotent, à relancer après un reset)
- `npm run format` / `npm run format:check` — Prettier

## Conventions

- Toutes les routes mutantes (POST/PATCH/DELETE) passent par `csrfValidator` middleware
- Toute donnée user-controlled insérée dans un email HTML est échappée via `escapeHtml()`
- Magic-link tokens + sessions expirés + cooldowns expirés sont auto-cleanés par cron à 03:00
  Europe/Paris ; experts pending-deletion finalisés à 03:15 quand leur dernière sub expire
- Tout `logger.*` qui logge un email passe par `maskEmail()` (cf. `lib/logger.ts`)

## Variables d'environnement

Voir [`.env.example`](.env.example).
