# Plarya — État du projet

> Audit effectué le 2026-05-20. Mise à jour à chaque reprise du projet.
> Source : exploration de la codebase + interrogation directe de la DB locale.

---

## 1. Stack et lancement

### Topologie

| Service | Stack | Port | Dossier |
|---|---|---|---|
| Frontend | Next.js 16.2.2 (App Router, Turbopack) + Tailwind v4 + React 19 | **3000** | `frontend/` |
| Backend | Node + Express 5 + Prisma 7 + TypeScript (tsx en dev) | **4000** | `backend/` |
| DB | PostgreSQL **local** (localhost:5432) | 5432 | (externe au repo) |

### État actuel des serveurs (au moment de l'audit)

- ✅ Frontend : **tourne** sur http://localhost:3000 (PID 7236, lancé hors session)
- ✅ Backend : **tourne** sur http://localhost:4000 (`GET /health` → `{status:"ok", db:"connected"}`)
- ✅ DB : **accessible**, schéma migré, données présentes (cf. §3)

### Commandes pour relancer si tout est éteint

```bash
# Backend (dans backend/)
cd backend
npm install            # si jamais
npm run dev            # tsx watch src/server.ts — port 4000

# Frontend (dans frontend/, autre terminal)
cd frontend
npm install            # si jamais
npm run dev            # next dev — port 3000
```

Postgres doit tourner localement (service Windows ou conteneur). Si la DB n'est pas accessible, `/health` répondra `{status:"error", db:"disconnected"}`.

### Scripts utiles (backend)

| Commande | Action |
|---|---|
| `npm run dev` | Lance le serveur Express en watch |
| `npm run db:migrate` | `prisma migrate dev` — applique les migrations en attente |
| `npm run db:generate` | Régénère le client Prisma dans `src/generated/prisma/` |
| `npm run db:studio` | Ouvre Prisma Studio (UI navigateur sur la DB) |
| `npm run db:seed` | Lance `prisma/seed.ts` — recrée les comptes de test + pronos + abonnements + bookmakers |

### Variables d'environnement

**`backend/.env`** (présent, valeurs masquées) :

```
DATABASE_URL=...                  # postgresql://...@localhost:5432/...
PORT=4000
JWT_SECRET=...                    # legacy V1, peut probablement être retiré (auth = magic link maintenant)
JWT_REFRESH_SECRET=...            # idem
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=...                # pour les emails magic-link + emails J+1
```

Variables optionnelles non présentes mais lues par le code :
- `BACKEND_URL` (défaut `http://localhost:4000`) — utilisée pour construire les liens magic-link
- `CORS_ORIGINS` (défaut `http://localhost:3000`) — liste séparée par virgules
- `NODE_ENV` — production-only logic dans `auth.ts` (cookies secure)

**`frontend/.env*`** : **aucun fichier présent**. Le frontend utilise `process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"` (cf. `lib/api.ts`). Pour pointer ailleurs : créer `frontend/.env.local` avec `NEXT_PUBLIC_API_URL=...`.

### Migrations Prisma

4 migrations appliquées dans `backend/prisma/migrations/` :

```
20260410155000_init
20260410160600_add_start_time_to_prono
20260410163930_add_views_and_featured
20260410170930_add_checkout_session_used
```

Le schéma `backend/prisma/schema.prisma` est en phase avec la DB (à confirmer après chaque pull avec `npm run db:migrate`).

---

## 2. Données de test

### Seed

✅ **Présent** : `backend/prisma/seed.ts`, lancé via `npm run db:seed` (dans `backend/`).

Effets du seed :

1. **Comptes** (upsert idempotent) :
   - 1 admin (`admin@test.com`, role `ADMIN`)
   - 1 user "consommateur" (`user@test.com`, role `USER`)
   - 6 tipsters (cf. tableau §3) avec profil `Tipster` (pseudo, bio, sports, `viewsToday` random 0-300, `photoUrl: /profile.jpg`)
2. **MagicLinks** : 1 token frais 24h pour chaque compte → **les URLs sont imprimées dans la console** (loggées en fin d'exécution).
3. **Pronos** (table `pronos` reset par tipster avant insertion) :
   - 8-10 historiques par tipster avec `result` WON/LOST mixé, `createdAt` -1j à -10j
   - 1-3 du jour avec `startTime` mixé (1 passé pour tester l'état "terminé", reste futur), `isFeatured` sur le 1er
   - **EsportGuru** : *toutes* ses analyses du jour sont passées (`startTime` < now) → utile pour tester l'état "Terminé pour aujourd'hui"
4. **Subscriptions** (`subscriptions` table reset complète) : ~12 abonnements `user@test.com` × tipsters variés (DAY_PASS / MONTHLY), + ~6 entre tipsters
5. **Bookmakers** : Winamax, Betclic, PMU avec affiliateLink et `PronoBookmakerOdds` pour chaque prono

### Comptage actuel en DB

```
users:       9
tipsters:    6
pronos:     69
subs:       19
bookmakers:  3 (pas comptés mais seedés)
```

---

## 3. Comptes de test (en DB actuellement)

| Email | Rôle | Pseudo Tipster |
|---|---|---|
| `admin@test.com` | ADMIN | — |
| `user@test.com` | USER | — |
| `tipster@test.com` | TIPSTER | TipsterTest |
| `betking@test.com` | TIPSTER | BetKing |
| `tennisace@test.com` | TIPSTER | TennisAce |
| `multisport@test.com` | TIPSTER | MultiSport |
| `rugbypro@test.com` | TIPSTER | RugbyPro |
| `esportguru@test.com` | TIPSTER | EsportGuru |
| `romainmaes@outlook.fr` | USER | — (ton compte perso) |

Les 6 tipsters ont leur profil `Tipster` complet (pseudo, bio, sports, photo) + 8-10 historiques + 1-3 du jour.

---

## 4. Routes Next.js

### Routes existantes

| Route | Fichier | Statut HTTP | Note |
|---|---|---|---|
| `/` | `app/page.tsx` | 200 ✅ | Homepage redesignée golden-da |
| `/dashboard` | `app/dashboard/page.tsx` | 200 ✅ | Dashboard expert (refonte Bloc 1 en cours) |
| `/compte` | `app/compte/page.tsx` | 200 ✅ | Mon compte utilisateur |
| `/admin` | `app/admin/page.tsx` | 200 ✅ | Panel admin |
| `/devenir-tipster` | `app/devenir-tipster/page.tsx` | 200 ✅ | Formulaire candidature expert |
| `/tipsters/[id]` | `app/tipsters/[id]/page.tsx` | 200 ✅ | Profil expert (dynamique) |
| `/auth/verify` | `app/auth/verify/page.tsx` | — | Landing page magic-link (redirect côté backend) |
| `/test-button` | `app/test-button/page.tsx` | — | **Test interne — à supprimer après migration** (CLAUDE.md §12) |
| `/test-domain-card` | idem | — | idem |
| `/test-expert-card` | idem | — | idem |
| `/test-header` | idem | — | idem |

### Routes manquantes (404) — référencées depuis l'UI mais non créées

| Route attendue | Référencée par | Impact |
|---|---|---|
| `/experts` | `experts-section.tsx` (bouton "Voir tous les experts") + Header guest `signUpHref` ??  | ⚠️ Cassé |
| `/devenir-expert` | `Header` (default `signUpHref="/devenir-expert"`) | ⚠️ Cassé — la vraie route est `/devenir-tipster` |
| `/domains/sport` | `domains-section.tsx` (DomainCard SPORT) | ⚠️ Cassé |
| `/domains/esport` | idem | ⚠️ Cassé |
| `/confidentialite`, `/mentions-legales`, `/cgu`, `/contact` | `site-footer.tsx` | ⚠️ Tous cassés |

⚠️ La nomenclature interne est `tipster` (code, table Prisma, route) mais CLAUDE.md §1.1 impose le vocabulaire `expert` côté UI. Décalage à gérer :
- soit ajouter une redirection `/devenir-expert` → `/devenir-tipster` + `/experts` → `/tipsters` (Next.js `redirects` dans `next.config.ts`)
- soit renommer les routes (refonte plus large, risque casser les liens magic-link)

---

## 5. Authentification

### Mécanisme

**Magic link uniquement** (pas de mot de passe, conforme CLAUDE.md §1.1 / §5). Flow :

1. User entre son email dans `LoginModal` (composant `frontend/components/auth/login-modal.tsx`) → `POST /auth/request-magic-link` (côté backend)
2. Backend génère un token (32 bytes hex, expiration 15min en prod / 24h pour les liens seed) → upsert dans table `magic_links` → envoi email via Resend (`sendMagicLinkEmail`)
3. User clique sur l'email → `GET /auth/verify?token=xxx&redirect=/path` (côté backend, port 4000)
4. Backend vérifie token (non expiré, non utilisé), marque `usedAt`, crée une `Session` (token random), set cookie `session_token` (httpOnly, sameSite Lax, 30 jours), redirige vers `FRONTEND_URL + redirect`
5. Frontend détecte le cookie via `GET /auth/me` (côté `useUser` hook)

### Resend (envoi des magic-links en prod)

`RESEND_API_KEY` est présent dans `.env`. En **local**, l'email Resend est envoyé pour de vrai si la clé est valide, **MAIS** plus simple :

### Bypass auth pour dev local

✅ **Le seed pré-crée des magic-links valides 24h pour chaque compte** et imprime les URLs en console à la fin du `npm run db:seed`. Format :

```
[ADMIN]    admin@test.com
http://localhost:4000/auth/verify?token=<token>

[USER]     user@test.com
http://localhost:4000/auth/verify?token=<token>

[TIPSTER]  betking@test.com
http://localhost:4000/auth/verify?token=<token>
... etc pour les 6 tipsters
```

→ Pour se logger en local, **relancer `npm run db:seed`** (idempotent), copier l'URL du compte voulu et la coller dans le navigateur. Cela pose le cookie de session pour 30 jours et redirige vers `/`.

### Se connecter en tant qu'expert (pour tester le Dashboard)

1. `cd backend && npm run db:seed`
2. Récupérer dans la console la ligne `[TIPSTER] betking@test.com` (ou autre tipster)
3. Coller l'URL `http://localhost:4000/auth/verify?token=...` dans le navigateur
4. Le navigateur est redirigé vers `http://localhost:3000/` avec le cookie session posé
5. Aller sur `http://localhost:3000/dashboard` → fonctionnel (cf. §4)

La page `/dashboard` redirige vers `/` si `user.role` n'est pas `TIPSTER` ou `ADMIN` (cf. `frontend/app/dashboard/page.tsx` lines 107-110).

### Bypass admin

Idem : utiliser l'URL `[ADMIN] admin@test.com` du seed. Login auto en tant qu'admin, accès `/admin`.

---

## 6. Liens UI cassés / suspects

### Sur la homepage (`/`)

| Élément | Cible | Statut |
|---|---|---|
| Hero CTA "Découvrir les experts" | scroll `#experts` (section id `experts` dans `experts-section.tsx`) | ✅ OK |
| Hero CTA secondaire (scroll vers domaines) | scroll `#domains` (id dans `domains-section.tsx`) | ✅ OK |
| **DomainCard SPORT "Voir les analyses"** | `/domains/sport` | ❌ **404 — route inexistante** |
| **DomainCard ESPORT "Voir les analyses"** | `/domains/esport` | ❌ **404 — route inexistante** |
| DomainCard HIPPIQUE | disabled (state `coming-soon`) | ✅ Volontaire |
| **ExpertCard "Accéder (3,50€)" / "Terminé"** | **aucun onClick, aucun href, card pas wrappée en Link** | ❌ **Bouton inerte** — clic = rien |
| **ExpertsSection "Voir tous les experts"** | `/experts` | ❌ **404 — route inexistante** (devrait être `/tipsters`) |
| DevenirCreateurSection CTA | `/devenir-tipster` | ✅ OK |
| Disclaimer | (aucun lien) | ✅ |

### Sur le Header (toutes les pages)

| Élément | Cible | Statut |
|---|---|---|
| Logo | `/` | ✅ OK |
| Variant connecté → "Dashboard" | `/dashboard` | ✅ OK |
| Variant connecté → "Mon Compte" | `/compte` | ✅ OK |
| Variant connecté → "Déconnexion" | `onLogout` callback (POST `/auth/logout`) | ✅ OK |
| Variant guest → "Se connecter" | ouvre `LoginModal` | ✅ OK |
| **Variant guest → "Créer un compte"** | `/devenir-expert` (default `signUpHref` dans `header.tsx`) | ❌ **404 — la route existe sous `/devenir-tipster`** |

### Sur le Footer (toutes pages publiques, masqué sur `/dashboard` et `/admin` depuis le Bloc 1 Dashboard)

| Élément | Cible | Statut |
|---|---|---|
| `/confidentialite` | — | ❌ 404 |
| `/mentions-legales` | — | ❌ 404 |
| `/cgu` | — | ❌ 404 |
| `/contact` | — | ❌ 404 |

→ Pages légales toutes absentes. À créer (ou stubs "à venir") avant mise en prod.

### Liens cassés — synthèse priorité

| Priorité | Lien cassé | Fix proposé |
|---|---|---|
| **P0** | ExpertCard "Accéder" inerte | Wrapper la card / le bouton en `<Link href={\`/tipsters/${tipsterId}\`}>` (mais l'`ExpertCardProps` n'expose ni `id` ni `href` actuellement — à ajouter) |
| **P0** | Header "Créer un compte" → `/devenir-expert` 404 | Soit changer default `signUpHref` à `/devenir-tipster` dans `header.tsx`, soit ajouter une redirect Next.js |
| **P1** | DomainCard SPORT/ESPORT → `/domains/sport`, `/domains/esport` 404 | Créer ces pages, ou rediriger vers `/tipsters?sport=foot` etc, ou retirer le lien et faire un scroll vers `#experts` |
| **P1** | ExpertsSection "Voir tous les experts" → `/experts` 404 | Créer `/experts` (route publique listant tous les tipsters), ou redirect vers `/tipsters` (qui n'existe pas en tant que route index non plus !) |
| **P2** | Footer pages légales (4 routes) | Créer des pages stub avec contenu minimum, ou retirer les liens du footer en attendant |

---

## 7. Notes architecturales utiles

- **Vocabulaire** : code = `tipster`, UI = `expert` (CLAUDE.md §1.1). La désynchro routes (`/tipsters/[id]` vs CTA `Voir les analyses` qui parle d'experts) est volontaire mais incohérente — à clarifier avant prod.
- **Tokens DS** : tout est dans `frontend/app/globals.css` sous `@theme inline`. Bloc LEGACY conservé tant que tous les composants V1 ne sont pas migrés (cf. CLAUDE.md §9).
- **Pages de test** (`/test-button`, etc.) : à supprimer une fois la migration golden-da terminée (CLAUDE.md §12).
- **Streak / badges** : supprimés du design public (CLAUDE.md §6) mais les champs `Tipster.streak` et `Tipster.streakBadge` restent dans Prisma — fetchés par `/tipsters/me` mais plus affichés.
- **Stripe** : configuré (clés présentes, route `/webhooks` câblée). Pas testé dans cet audit.
- **Cron** : `initCronJobs()` au démarrage du backend — probablement reset `viewsToday`, emails J+1, expire les sessions. À auditer si besoin.

---

## 8. Points ouverts identifiés pendant cet audit

1. Pas de redirection `/devenir-expert` → `/devenir-tipster` (ni `/experts` → `/tipsters`) configurée dans `next.config.ts`.
2. `JWT_SECRET` et `JWT_REFRESH_SECRET` toujours dans `.env` alors que l'auth est passée 100 % magic-link — à confirmer qu'aucune route ne les utilise encore puis retirer.
3. `frontend/.env*` absent — si tu déploies avec un backend distant, il faudra créer `frontend/.env.local` avec `NEXT_PUBLIC_API_URL=...`.
4. Le seed n'inclut pas de mock pour la page `/admin` (stats, etc.) — à vérifier si la page admin charge bien avec les données présentes.
