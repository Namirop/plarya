# Déploiement — Plarya

Guide de mise en production. Stack : **frontend Next.js → Vercel**,
**backend Express/Prisma → Railway**, **DB → Neon (Postgres)**,
**emails → Resend**, **paiements → Stripe**.

---

## 1. Topologie & pourquoi

Contrairement à une app Next.js fullstack (où tout est same-origin sur
Vercel), Plarya a un **backend Express séparé**. Conséquences :

- **Le backend ne peut PAS aller sur Vercel.** Les jobs `node-cron`
  in-process (email J+1 à 10h, reset `viewsToday`/`isFeatured` à minuit,
  cleanup RGPD à 03:00/03:15) ont besoin d'un **process long-running**.
  Le serverless Vercel s'endort entre les requêtes → les crons ne
  tournent jamais. → **Railway** (ou Render/Fly), qui gardent le process
  vivant et exécutent les crons nativement.
- **Front et back sont sur des domaines différents** (`*.vercel.app` vs
  `*.up.railway.app`) = **cross-site**. Ça impose 3 réglages :
  `NEXT_PUBLIC_API_URL` absolu côté front, **CORS** `credentials: true`
  côté back (déjà en place via `CORS_ORIGINS`), et cookies de session
  **`SameSite=None; Secure`** côté back (via `COOKIE_SAMESITE=none`).

```
Navigateur
   │  https (HTML, assets)        https (API, cookies cross-site)
   ▼                                          ▼
Vercel (frontend Next.js)  ───── fetch ─────► Railway (backend Express)
                                                   │
                                          Neon (Postgres)  ·  Resend  ·  Stripe
```

> Alternative : si tu mets un **domaine custom** avec le front sur
> `plarya.com` et le back sur `api.plarya.com` (même eTLD+1), tu peux
> rester en `COOKIE_SAMESITE=lax`. Tant que c'est `*.vercel.app` +
> `*.railway.app`, c'est `none`.

---

## 2. Ordre de déploiement

Déployer **la DB d'abord, puis le backend, puis le frontend** (le build
front peut requêter l'API pour le SEO/metadata).

### Étape A — Base de données (Neon)

1. Créer un projet sur [neon.tech](https://neon.tech) (région proche, ex
   `eu-central`).
2. Récupérer **deux** connection strings depuis le dashboard Neon :
   - **Pooled** (avec `-pooler` dans le host) → `DATABASE_URL` (runtime).
   - **Direct** (sans `-pooler`) → `DIRECT_URL` (migrations).
3. Garder ces deux URLs pour l'étape B.

### Étape B — Backend (Railway)

1. Sur [railway.app](https://railway.app) → New Project → Deploy from
   GitHub repo (`Plarya`).
2. **Settings → Root Directory = `backend`** (le repo est un monorepo ;
   `railway.json` + `Dockerfile` vivent dans `backend/`).
3. Railway lit `backend/railway.json` : build via Dockerfile, migrations
   en **pre-deploy** (`npm run db:deploy`), start `node dist/server.js`,
   healthcheck `/health`.
4. **Variables d'environnement** (Settings → Variables) :

   | Variable | Valeur prod |
   |---|---|
   | `DATABASE_URL` | URL Neon **pooled** |
   | `DIRECT_URL` | URL Neon **directe** |
   | `NODE_ENV` | `production` |
   | `PORT` | (laisser Railway l'injecter) |
   | `CORS_ORIGINS` | URL Vercel du front, ex `https://plarya.vercel.app` |
   | `FRONTEND_URL` | idem (URL front) |
   | `BACKEND_URL` | URL publique Railway de l'API |
   | `COOKIE_SAMESITE` | `none` (front/back domaines ≠) |
   | `STRIPE_SECRET_KEY` | clé **live** `sk_live_…` |
   | `STRIPE_WEBHOOK_SECRET` | secret du webhook **prod** (étape C) |
   | `RESEND_API_KEY` | clé Resend prod |
   | `EMAIL_FROM` | `Plarya <noreply@ton-domaine>` (étape D) |
   | `LOG_LEVEL` | `info` |

5. **Settings → Networking → Generate Domain** pour exposer l'API
   publiquement. Reporter cette URL dans `BACKEND_URL` (et plus tard dans
   `NEXT_PUBLIC_API_URL` côté Vercel).
6. Vérifier après deploy : `GET https://<api>/health` → `{"status":"ok"}`.

> La 1re migration crée tout le schéma sur la DB Neon vide via le
> pre-deploy `prisma migrate deploy`. Ne **jamais** lancer `migrate dev`
> en prod. Ne **pas** lancer le seed (`db:seed`) en prod : ce sont des
> données de démo.

### Étape C — Webhook Stripe (prod)

1. Dashboard Stripe (mode **Live**) → Developers → Webhooks → Add
   endpoint : `https://<api-railway>/webhooks/stripe`.
2. Événements : `checkout.session.completed`, `invoice.paid`,
   `customer.subscription.deleted` (et tout event déjà géré dans
   `routes/webhooks.ts`).
3. Copier le **Signing secret** `whsec_…` → variable
   `STRIPE_WEBHOOK_SECRET` sur Railway (redeploy).

### Étape D — Emails (Resend)

1. Resend → Domains → ajouter ton domaine, configurer **SPF + DKIM +
   DMARC** dans la zone DNS (sans toucher aux MX racine).
2. Une fois vérifié, poser `EMAIL_FROM="Plarya <noreply@ton-domaine>"`
   sur Railway. Sans domaine vérifié, seul `onboarding@resend.dev`
   fonctionne (non délivrable au grand public).

### Étape E — Frontend (Vercel)

1. [vercel.com](https://vercel.com) → New Project → importer `Plarya`.
2. **Root Directory = `frontend`**. Framework détecté : Next.js (rien à
   configurer côté build).
3. **Environment Variables** :

   | Variable | Valeur |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | URL publique Railway de l'API |
   | `NEXT_PUBLIC_SITE_URL` | URL du front Vercel (ou domaine custom) |

   ⚠️ Ces vars `NEXT_PUBLIC_*` sont **bakées au build** : si l'URL d'API
   change, il faut **redéployer** le front.
4. Déployer. Vérifier que la home charge les experts (= le front parle
   bien au back → CORS + cookies OK).

### Étape F — Boucler le cross-domain

Une fois les deux URLs connues, re-vérifier sur Railway :
- `CORS_ORIGINS` = URL exacte Vercel (https, sans slash final).
- `FRONTEND_URL` = idem.
- `COOKIE_SAMESITE=none`.

Puis tester un login magic-link de bout en bout (l'email doit arriver,
le clic doit connecter et la session persister au refresh).

---

## 3. Checklist de lancement

- [ ] Neon : `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) posées.
- [ ] Railway : root dir = `backend`, toutes les vars, domaine généré.
- [ ] `GET /health` répond `ok`.
- [ ] Migrations appliquées (pre-deploy vert au 1er déploiement).
- [ ] **Pas** de seed démo lancé en prod.
- [ ] Stripe : clés **live**, webhook prod créé, `whsec_` posé.
- [ ] Resend : domaine vérifié (SPF/DKIM/DMARC), `EMAIL_FROM` posé.
- [ ] Vercel : root dir = `frontend`, `NEXT_PUBLIC_*` posées.
- [ ] `COOKIE_SAMESITE=none` + `CORS_ORIGINS` = URL front exacte.
- [ ] Test E2E : achat day pass (carte test puis live), réception email,
      session persistante, page expert débloquée.
- [ ] Mentions légales complétées (`app/mentions-legales/page.tsx`).

---

## 4. Récap variables d'environnement

**Backend (Railway)** — cf. `backend/.env.example` :
`DATABASE_URL`, `DIRECT_URL`, `NODE_ENV`, `PORT`, `CORS_ORIGINS`,
`FRONTEND_URL`, `BACKEND_URL`, `COOKIE_SAMESITE`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `LOG_LEVEL`.

**Frontend (Vercel)** — cf. `frontend/.env.example` :
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`.

---

## 5. Notes & durcissements post-launch (non bloquants)

- **CSP `'unsafe-inline'`** (script/style) reste actif pour la
  compat Next dev. À durcir via nonce une fois en prod stable.
- **`remotePatterns` next/image** (`frontend/next.config.ts`) whiteliste
  des hôtes d'avatars (imgur, gravatar…). À resserrer vers un service
  d'upload contrôlé quand les vraies photos arriveront (cf. TODO V2).
- **Résiliation d'abonnement in-app** : MVP = opt-out par email
  (cf. TODO V2 dans `app/compte/CompteClient.tsx`).
- Migrer les crons vers un scheduler externe seulement si tu passes un
  jour le backend en serverless (pas le cas avec Railway).
