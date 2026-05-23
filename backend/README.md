# Plarya — Backend

Express 5 + Prisma 7 — API REST Plarya.

## Stack

- Express 5
- Prisma 7 + PostgreSQL
- Auth : magic-link (Resend), session cookies httpOnly
- Paiements : Stripe webhooks + Checkout sessions (idempotent, signature-verified)
- Cron : node-cron (en prod : Vercel Cron / cron externe)
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
- `POST /auth/resend-access-unlocked` — Renvoie le mail magic-link post-paiement

### Experts (public)

- `GET /experts` — Liste (cache HTTP 60s)
- `GET /experts/:id` — Profil public, mode Locked si non auth (cache 60s)
- `POST /experts/:id/view` — Incrément vue (rate-limited 1/h/IP/expertId)

### Experts (authentifié)

- `GET /experts/me` — Profile complet expert connecté
- `PATCH /experts/me` — Update profile (EXPERT)
- `GET /experts/:id/pronos` — Pronos complets (auth + sub active OU owner/admin)

### Checkout / Stripe

- `POST /checkout/create-session` — Day pass / abonnement
- `POST /checkout/become-expert` — Candidature expert 39€/trimestre
- `POST /webhooks/stripe` — Webhook signé par Stripe (idempotent au niveau event)

### Subscriptions

- `POST /subscriptions/check` — A l'user un accès actif à cet expert ?
- `GET /subscriptions/check-stripe-session` — Le webhook a-t-il créé la sub ?
- `GET /subscriptions/me` — Mes abonnements + day-passes

### Admin (auth ADMIN)

- `GET /admin/stats`, `/admin/stats/revenue`, `/admin/stats/sales`, `/admin/stats/by-expert`
- `GET /admin/stats/export.csv` — Export CSV ventes
- `GET /admin/experts`, `/admin/users`
- `GET /admin/pronos?limit&offset` — Paginé (default 50, max 200)
- `PATCH /admin/pronos/:id/result` — Override résultat
- `PATCH /admin/experts/:id/warning` — Avertissement profile
- `PATCH /admin/experts/:id/display-order` — Réordonne la homepage
- `POST /admin/send-daily-emails` — Trigger manuel emails J+1

## Sécurité

- **helmet** avec CSP strict (script/style 'self', img + Stripe + SportsDB whitelist)
- **Rate-limiters** par endpoint : auth (5/15min), checkout (5/min), admin (100/min),
  views (1/h/IP/expertId — IPv6 via `ipKeyGenerator`), global fallback (100/min)
- **CSRF** double-submit cookie : `csrf_token` non-httpOnly + header `X-CSRF-Token` requis
  sur toute méthode mutante (POST/PATCH/PUT/DELETE), sauf `/webhooks` (signature Stripe)
- **Sessions** : httpOnly + sameSite=lax + secure (prod), 30j TTL
- **Magic-links** : crypto-random 32 bytes, single-use, 15min TTL, purge cron quotidien
- **Cooldown RGPD** : 7j après suppression de compte, blocage silencieux des magic-links
  pour cet email (cf. table `DeletedEmailCooldown`)

## Setup local

1. Postgres local sur `:5432` avec une DB `plarya`
2. `cp .env.example .env` puis remplir DATABASE_URL, STRIPE_SECRET_KEY, RESEND_API_KEY
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
- `npm run db:generate` — Prisma generate
- `npm run db:studio` — Prisma Studio
- `npm run db:seed` — Reseed scopé (n'efface que les comptes test)
- `npm run db:seed:reset` — Wipe complet + reseed
- `npm run format` / `npm run format:check` — Prettier

## Conventions

- Toutes les routes mutantes (POST/PATCH/DELETE) passent par `csrfValidator` middleware
- Toute donnée user-controlled insérée dans un email HTML est échappée via `escapeHtml()`
- Magic-link tokens + sessions expirés + cooldowns expirés sont auto-cleanés par cron à 03:00
  Europe/Paris ; experts pending-deletion finalisés à 03:15 quand leur dernière sub expire
- Tout `logger.*` qui logge un email passe par `maskEmail()` (cf. `lib/logger.ts`)

## Variables d'environnement

Voir [`.env.example`](.env.example).
