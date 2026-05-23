# Audit final Plarya — État du code avant production

**Date :** 2026-05-22
**Auditeur :** Claude Code (auto-audit)
**Périmètre :** intégralité du repo (frontend + backend), branche `redesign/golden-da` à jour avec `origin/redesign/golden-da` (commit `232af10`)

---

## Cartographie initiale

### Structure haute

```
Plarya/
├── frontend/          Next.js 15.16 / React 19.2 / Tailwind v4 / TypeScript 5
├── backend/           Express 5.2 / Prisma 7.6 / Node / TypeScript 6
├── docs/              (créé par cet audit)
├── screenshots/       (untracked — screenshots locaux non versionnés)
├── CLAUDE.md          Brief produit + design system (530 lignes)
├── design-system.md   Spec DS détaillée (1015 lignes)
├── project-state.md   État au démarrage refonte (361 lignes)
├── mobile-homepage-spec.md  Spec mobile homepage (untracked)
└── .gitignore         Minimal (root), sub-projects ont leur propre .gitignore
```

### Frontend — `frontend/`

| Dossier       | Fichiers TS/TSX | Sous-dossiers notables                                                                                                                                           |
| ------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`        | 20              | `admin/`, `auth/verify/`, `cgu/`, `compte/`, `confidentialite/`, `contact/`, `dashboard/`, `devenir-tipster/`, `experts/`, `mentions-legales/`, `tipsters/[id]/` |
| `components/` | 32              | `admin/`, `auth/`, `checkout/`, `dashboard/`, `domains/`, `experts/`, `home/`, `layout/`, `legal/`, `ui/`                                                        |
| `hooks/`      | 1               | `use-user.tsx` (seul hook)                                                                                                                                       |
| `lib/`        | 8               | `api.ts`, `constants.ts`, `date.ts`, `sports.ts`, `sports-icons.tsx`, `stripe.ts`, `utils.ts`, `types/`                                                          |
| **Total**     | **61**          | **~5 200 lignes TS/TSX** (hors next-env)                                                                                                                         |

### Backend — `backend/`

| Dossier                 | Fichiers TS  | Contenu                                                                                      |
| ----------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `src/routes/`           | 8            | `auth`, `tipsters`, `pronos`, `subscriptions`, `admin`, `checkout`, `webhooks`, `bookmakers` |
| `src/middleware/`       | 4            | `auth`, `admin`, `tipster`, `validate`                                                       |
| `src/lib/`              | 8            | `prisma`, `stripe`, `jwt`, `magic-link`, `emails`, `resend`, `stats`, `cron`                 |
| `src/validators/`       | 5            | `auth`, `checkout`, `prono`, `tipster`, `tipsters`                                           |
| `src/server.ts`         | 1            | Entry point                                                                                  |
| `src/generated/prisma/` | (générés)    | Client Prisma (ignoré)                                                                       |
| `prisma/migrations/`    | 4 migrations | `init`, `add_start_time_to_prono`, `add_views_and_featured`, `add_checkout_session_used`     |
| **Total source**        | **26**       | **~2 300 lignes**                                                                            |

### Conventions

| Convention          | État                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| TypeScript `strict` | ✅ frontend + backend                                                                       |
| ESLint              | ⚠️ frontend uniquement (config Next par défaut, aucune règle custom, **pas d'a11y plugin**) |
| Prettier            | ❌ **non configuré** (ni `.prettierrc`, ni dans `package.json`)                             |
| Tests               | ❌ **zéro test** (unit, integration, e2e)                                                   |
| README              | ❌ **aucun README** à la racine ni dans `frontend/` ou `backend/`                           |
| CLAUDE.md           | ✅ très complet (530 lignes, spec produit + DS)                                             |
| `.env.example`      | ❌ **absent** (root, frontend, backend) — onboarding difficile                              |
| Validation Zod      | ✅ sur la plupart des endpoints critiques (auth, checkout, prono, tipster)                  |
| Magic-link auth     | ✅ table `MagicLink` + `Session` propres, tokens crypto-secure                              |

---

## Résumé exécutif

Plarya est dans un état **BETA fonctionnel mais imparfait**. La majorité du parcours utilisateur (homepage → profil expert → checkout Stripe → débloquage des analyses) est implémentée et testée localement. L'architecture est saine (Express + Prisma + Next App Router), l'auth magic-link est correctement faite, et la refonte design `golden-da` est aboutie sur les pages critiques (homepage, profil, dashboard, admin, légales). Le code respecte les conventions modernes (TypeScript strict partout, validation Zod sur la majorité des endpoints, helmet/rate-limit sur le backend, magic links unique-use + session cookies httpOnly).

**Mais le projet n'est pas prod-ready.** Il subsiste 4 catégories de problèmes bloquants : (1) **incohérence de pricing** entre la DB seed (19€/mois), les CGU publiques (29€), et les emails (19€) — risque légal direct ; (2) **flow "devenir tipster" toujours basé sur un paiement Stripe 39€/trimestre** alors que CLAUDE.md §5 indique "candidature soumise → validation admin manuelle, pas de paiement pour le MVP" — feature out-of-spec ; (3) **vestiges interdits par le brief** : badges streak (`stats.ts`), helpers JWT non-utilisés (`jwt.ts`), tokens `--color-or-*` legacy CSS, références à "gagner de l'argent" dans `sendWelcomeEmail` ; (4) **gaps sécurité / observabilité prod** : pas d'idempotence Stripe au niveau event, webhook retourne toujours 200 même en erreur, pas d'apiVersion Stripe pinné, EMAIL_FROM = sandbox `onboarding@resend.dev`, zéro test, zéro logging structuré, zéro alerting.

**Niveau global : BETA fonctionnel imparfait** — on est plus proche de RC1 que d'ALPHA grâce à la propreté du flux principal, mais on n'est pas RC1 tant que les CRITICAL pricing/vocabulaire/sécurité ne sont pas traités.

**Findings totaux : 87**

- CRITICAL : **14** (à corriger avant prod absolument)
- IMPORTANT : **34** (qualité du produit, à traiter dans la foulée)
- NICE_TO_HAVE : **27** (dette technique, à planifier)
- IGNORABLE : **12** (cosmétique, peut attendre une V2)

**Top 3 trous critiques :**

1. **Pricing désynchronisé entre DB / CGU / emails (19€ vs 29€ vs 19€)** — risque légal et conversion ratée.
2. **Flow `/devenir-tipster` charge 39€/trimestre via Stripe** alors que la spec produit veut une candidature gratuite validée par admin.
3. **Webhook Stripe avale toutes les erreurs (200 systématique)** — perte silencieuse de paiements si la création de Subscription échoue après que Stripe ait débité.

---

## Forces du code

1. **Authentification magic-link propre et complète.**
   - Token crypto-sécurisé (`crypto.randomBytes(32)`), expire 15 min, usage unique (`usedAt`), session cookie `httpOnly + secure + sameSite=lax`, 30 jours.
   - Cleanup auto des sessions expirées au moment du `verifySession`.
   - Endpoint `request-magic-link` renvoie toujours 200 pour ne pas leaker l'existence d'un compte.
   - Fichiers : `backend/src/lib/magic-link.ts`, `backend/src/routes/auth.ts`.

2. **Validation Zod systématique sur les endpoints d'écriture.**
   - `validate(schema)` middleware réutilisable (`backend/src/middleware/validate.ts`).
   - Schémas spécifiques par route (auth, checkout, prono, tipster) avec messages d'erreur FR.
   - Côté frontend, la validation est laxiste (juste `includes("@")` pour l'email), mais le backend rattrape.

3. **Architecture Next App Router cohérente.**
   - Séparation propre `app/` (routes) / `components/` (UI) / `hooks/` (logique) / `lib/` (utilitaires).
   - Layouts serveur pour exporter `metadata` (`tipsters/[id]/layout.tsx`, `devenir-tipster/layout.tsx`) qui contournent l'impossibilité d'exporter `metadata` depuis une page `"use client"`.
   - Redirects propres pour le décalage vocabulaire UI vs URL interne (`/devenir-expert` → `/devenir-tipster`).

4. **Design system unifié et bien tokenisé.**
   - `@theme inline` Tailwind v4 dans `globals.css` avec tokens sémantiques (`--color-accent`, `--text-h2`, `--shadow-shine`, `--container-content`).
   - Cohérence visuelle forte sur tout le site (cards `bg-black/40 rounded-2xl border-surface-elevated`, focus accent doré, boutons primary/secondary unifiés).
   - Polices Google Fonts via `next/font` (Work Sans + DM Serif Display) — OK perf.

5. **Sécurité backend de base bien faite.**
   - `helmet()` pour les headers, `cookie-parser`, `cors` avec `CORS_ORIGINS` env + `credentials: true`.
   - Rate-limit global (100 req/min/IP), rate-limit ciblé `/checkout` (5/min), `/admin` (20/min), `/auth/request-magic-link` (5/15min).
   - Webhook Stripe : signature vérifiée, raw body avant `express.json()`.
   - Middlewares de rôle (`authMiddleware`, `adminMiddleware`, `tipsterMiddleware`) appliqués correctement.

6. **Idempotence applicative sur la création de Subscription Stripe.**
   - `webhooks.ts` vérifie `existingSubscription` par `stripeSessionId` avant de créer.
   - Tipster creation idempotente par `findUnique({ userId })`.
   - Flag `checkoutSessionUsed` empêche la réutilisation d'un même `stripe_session_id` pour ouvrir une session frontend.

7. **Accessibilité de bon niveau sur les modales critiques.**
   - `LoginModal` et `ConfirmModal` : focus trap correct, `Escape` géré, `role="dialog"` + `aria-modal` + `aria-labelledby`.
   - `scroll-lock` propre (restore au cleanup), `noValidate` sur les forms pour éviter les popups natifs et utiliser les states d'erreur custom.
   - Pattern modale réutilisable, design cohérent.

8. **Pages légales encadrées par un `LegalShell` réutilisable.**
   - `LegalWarning` explicite : "ces conditions doivent être validées par un juriste avant prod" — pose le bon framing.
   - Structure homogène : `LegalSection`, `LegalList` factorisés (`components/legal/legal-shell.tsx`).

9. **Migration LEGACY consciente et documentée.**
   - CLAUDE.md §9 documente la stratégie ("Quand TOUS les composants sont migrés, supprimer le bloc LEGACY").
   - Le bloc LEGACY est isolé dans `globals.css` (lignes 93-152) — facile à retirer en un commit.
   - Seul `app/auth/verify/page.tsx` (ErrorState) référence encore des classes LEGACY.

10. **Cron jobs initiaux corrects.**
    - 2 jobs cron : email J+1 à 10h, reset `viewsToday` + `isFeatured` à minuit.
    - Try/catch global, logs préfixés `[CRON]`, déclenchement manuel exposé via `/admin/send-daily-emails`.

---

## Findings par catégorie

### A. Architecture globale

- **IMPORTANT** Décalage vocabulaire URL ↔ UI assumé mais incomplet.
  - Constat : CLAUDE.md §1.1 interdit "tipster" en UI, mais les URLs publiques `/tipsters/[id]` et `/devenir-tipster` exposent encore ce mot. `next.config.ts` redirige `/experts/:id` → `/tipsters/:id` (interne) au lieu de l'inverse. Un utilisateur partageant l'URL d'un profil verra `/tipsters/` dans son lien.
  - Impact : SEO (mots-clés "tipster" indexés), partage social moche, contradiction avec brief.
  - Fix recommandé : promouvoir `/experts/[id]` et `/devenir-expert` comme routes canoniques et inverser la redirection (`permanent: true` une fois stable).
  - Effort : M (rename routes + update tous les liens internes + update metadata).
  - Fichiers : `frontend/next.config.ts`, `frontend/app/tipsters/`, `frontend/app/devenir-tipster/`.

- **IMPORTANT** `app/page.tsx` (homepage) est `"use client"` → 0 SSR.
  - Constat : la home et toutes les pages critiques sont en `"use client"` au top-level. Le state `activeDomain` n'est utilisé que pour scroller — l'usage de `useState` aurait pu rester local à un `DomainSelector` client tandis que le shell reste serveur.
  - Impact : pas de pré-rendering du HTML initial, FCP/LCP dégradés, SEO moins efficace (Google indexe le rendu mais le score Core Web Vitals tombe).
  - Fix : extraire la logique de filtrage dans un sous-composant `<DomainsClient />`, garder `app/page.tsx` server. Idem `tipsters/[id]/page.tsx`.
  - Effort : L (refacto par page).
  - Fichiers : `frontend/app/page.tsx`, `frontend/app/tipsters/[id]/page.tsx`, `frontend/app/compte/page.tsx`, `frontend/app/admin/page.tsx`, `frontend/app/dashboard/page.tsx`, `frontend/app/devenir-tipster/page.tsx`.

- **IMPORTANT** `app/admin/page.tsx` = 1053 lignes monolithiques.
  - Constat : 6 sous-sections (`RevenueSection`, `SalesSection`, `ByTipsterSection`, `TipstersSection`, `PronosSection`, `UsersSection`) + `AdminPage` + 7 helpers/badges dans un seul fichier client.
  - Impact : bundle initial admin lourd, difficulté de relecture, risque de re-render global au moindre changement de state (tous les `useState` sont dans `AdminPage`).
  - Fix : éclater en `app/admin/_components/{Revenue,Sales,ByTipster,Tipsters,Pronos,Users}.tsx` + extraire les patterns DS (`badgeBaseCls`, `tableWrapperCls`, etc.) dans `lib/admin-styles.ts`.
  - Effort : M.
  - Fichier : `frontend/app/admin/page.tsx:1-1053`.

- **NICE_TO_HAVE** Fichiers > 300 lignes.
  - `frontend/app/admin/page.tsx` 1053, `frontend/app/compte/page.tsx` 730, `frontend/app/tipsters/[id]/page.tsx` 722, `frontend/components/dashboard/publish-analysis-form.tsx` 522, `frontend/lib/sports.ts` 337, `frontend/app/devenir-tipster/page.tsx` 304.
  - Fix : split par responsabilité.
  - Effort : M.

- **IMPORTANT** Backend : dépendances qui ne devraient pas être là.
  - Constat : `bcryptjs` et `jsonwebtoken` listés dans `backend/package.json:22,29` mais **non utilisés** (auth = magic-link, pas de password). `lib/jwt.ts` existe mais aucun import dans le code.
  - Impact : surface d'attaque inutile, confusion pour les nouveaux dev, env vars `JWT_SECRET` + `JWT_REFRESH_SECRET` requises pour rien.
  - Fix : `npm uninstall bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken`, supprimer `lib/jwt.ts`, retirer ces vars du déploiement.
  - Effort : S.
  - Fichiers : `backend/src/lib/jwt.ts`, `backend/package.json:22,29,37,42`.

- **NICE_TO_HAVE** Backend : `forceConsistentCasingInFileNames: true` mais frontend ne l'a pas.
  - Fix : ajouter au `frontend/tsconfig.json`.
  - Effort : S.

- **NICE_TO_HAVE** Aucun README à la racine ni dans frontend/backend.
  - Constat : un dev fraîchement onboardé doit lire CLAUDE.md (530 lignes) pour savoir comment lancer le projet.
  - Fix : `README.md` court avec "how to install / run / migrate / seed / env vars requises", lien vers CLAUDE.md pour le contexte produit.
  - Effort : S.

- **IGNORABLE** Validators `tipster.ts` (admin) et `tipsters.ts` (self) sont nommés au pluriel/singulier de façon confuse.
  - Constat : `validators/tipster.ts` = `createTipsterSchema` (admin crée un tipster), `validators/tipsters.ts` = `updateTipsterSchema` (tipster met à jour son profil). Nommer par action plutôt que par modèle.
  - Fix : renommer `tipsters.ts` → `tipster-self.ts` ou regrouper.
  - Effort : S.

---

### B. Code mort / inutilisé / obsolète

- **CRITICAL** Vestiges du système streak/badges interdit par le brief.
  - Constat : `backend/src/lib/stats.ts` exporte `calcStreak()` et `streakBadge()` (retourne 🔥 / 🔥🔥 / 🔥🔥🔥). Utilisé dans `routes/tipsters.ts:43-45` (`/tipsters/me`) → renvoyé au frontend dans le payload. Le type `TipsterProfile` frontend (`lib/types/dashboard.ts:13-14`) déclare `streak` et `streakBadge`. CLAUDE.md §6 et §5 sont catégoriques : "Les badges 🔥 🔥🔥 🔥🔥🔥 sont supprimés. Pas de compétition entre experts."
  - Impact : si un nouveau dev câble ces champs dans une page, on viole le brief sans s'en rendre compte. Le calcul tourne pour rien à chaque appel `/tipsters/me`.
  - Fix : supprimer `calcStreak`/`streakBadge` de `stats.ts`, retirer du payload `/tipsters/me`, retirer du type frontend.
  - Effort : S.
  - Fichiers : `backend/src/lib/stats.ts:19-40`, `backend/src/routes/tipsters.ts:3,22-23,43-45`, `frontend/lib/types/dashboard.ts:13-14`.

- **CRITICAL** `backend/src/lib/jwt.ts` = code mort intégral.
  - Constat : fichier expose `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, `verifyRefreshToken`. Aucun import nulle part. Fait référence à `JWT_SECRET` et `JWT_REFRESH_SECRET` (non-null assertion `!`) → si ces vars ne sont pas dans `.env`, **toute importation du fichier crash au démarrage** même si les fonctions ne sont jamais appelées. Risque d'erreur prod si quelqu'un import par erreur.
  - Fix : supprimer le fichier entier + retirer `jsonwebtoken` + `@types/jsonwebtoken` du `package.json`.
  - Effort : S.

- **IMPORTANT** Bloc LEGACY CSS (`globals.css:97-152`) presque entièrement mort.
  - Constat : aucune utility ou variable LEGACY n'est utilisée dans le code TSX, **sauf** `app/auth/verify/page.tsx:82,90,98,99` qui utilise encore `text-texte-secondaire`, `border-bordure`, `bg-fond-principal`, `text-blanc`, `text-or-principal/30` etc. (la page n'a jamais été migrée vers les nouveaux tokens).
  - Impact : bundle CSS ~3KB superflu, dette qui bloque la "suppression LEGACY" prévue dans CLAUDE.md §9.
  - Fix : migrer `app/auth/verify/page.tsx` vers les tokens DA dorés, puis supprimer le bloc LEGACY de `globals.css`.
  - Effort : S.
  - Fichiers : `frontend/app/auth/verify/page.tsx:62-106`, `frontend/app/globals.css:97-152`.

- **IMPORTANT** Utility classes CSS jamais utilisées dans `globals.css`.
  - `.text-gradient-or`, `.glow-or`, `.glow-or-hover` (l.251-264) — 0 référence dans le code TSX.
  - `@keyframes` + `.navbar-enter` (l.288-301), `.marquee-loop` (l.303-316), `.hero-reveal` (l.318-332), `.scroll-reveal` + `.scroll-pop` + `pop-in` (l.334-369) — 0 référence.
  - Fix : supprimer toutes ces classes.
  - Effort : S.

- **IMPORTANT** Dépendance `framer-motion` ^12.38.0 listée mais 0 import dans le code.
  - Constat : `frontend/package.json:16` déclare `framer-motion`. `grep -r "framer-motion"` dans `app/`, `components/`, `hooks/`, `lib/` → 0 résultat.
  - Impact : ~70 KB gzipped potentiellement dans le bundle (selon tree-shaking).
  - Fix : `npm uninstall framer-motion`.
  - Effort : S.

- **IMPORTANT** Helpers `lib/sports.ts` jamais importés.
  - `getLeaguesBySport(sport)` (`lib/sports.ts:260`) et `getSportEmoji(sport)` (`lib/sports.ts:308`) exportés, 0 import ailleurs.
  - Fix : supprimer.
  - Effort : S.

- **NICE_TO_HAVE** `frontend/components/home/trust-row.tsx` untracked dans git.
  - Constat : le fichier est référencé dans `app/page.tsx` et `components/home/hero.tsx`, mais `git status` le liste en untracked.
  - Fix : `git add` + commit.
  - Effort : S.

- **IGNORABLE** Pages de test absentes — cleanup déjà fait.
  - Les `test-button`, `test-expert-card`, `test-domain-card`, `test-header` mentionnés dans CLAUDE.md §12 ne sont plus dans `app/`. ✅
  - Action : retirer le §12 de CLAUDE.md.

- **NICE_TO_HAVE** Aucune table de nettoyage des magic links / sessions expirés.
  - Constat : `magic_links` et `sessions` accumulent les rows expirés indéfiniment. Pas de cron de purge.
  - Impact : grossissement DB linéaire avec le trafic, attaque déni de service par flooding de demandes magic-link.
  - Fix : ajouter un cron `0 3 * * *` qui supprime `magicLink.deleteMany({ where: { expiresAt: { lt: now } } })` + idem sessions.
  - Effort : S.

---

### C. TypeScript et types

- **NICE_TO_HAVE** Types backend non partagés avec le frontend.
  - Constat : chaque page frontend redéclare ses interfaces (`TipsterProfile`, `PronoData`, `Sale`, etc.) en doublon des modèles backend. Ex : `frontend/app/tipsters/[id]/page.tsx:48-61` redéclare un `TipsterProfile` qui doit rester synchronisé manuellement avec `backend/src/routes/tipsters.ts:214-227`.
  - Impact : drift entre frontend et backend non détectable au build.
  - Fix : extraire un package `@plarya/shared-types` ou simplement un dossier `shared/` symliké, avec les DTOs Zod inferrés.
  - Effort : L (mais simple par étape : commencer par les types de la response `/tipsters/:id`).

- **IMPORTANT** Usage de `any` dans le webhook handler.
  - Constat : `backend/src/routes/webhooks.ts:62` (`sports: sports as any`) et `webhooks.ts:148` (`invoice.subscription` cast). Le `any` désactive la vérification de cohérence avec le `Sport[]` enum Prisma.
  - Fix : utiliser le type `Sport[]` importé depuis Prisma + Zod parse pour valider les sports désérialisés du `metadata` JSON Stripe.
  - Effort : S.

- **IMPORTANT** Validation incohérente entre les schémas Zod.
  - Constat : `validators/tipster.ts:7-21` impose `z.enum([FOOTBALL, TENNIS, ...])` pour les sports, mais `validators/tipsters.ts:7` accepte `z.array(z.string())` sans contrainte. Un tipster peut donc set un sport arbitraire ("yoga") via PATCH `/tipsters/me`.
  - Impact : DB pollution (sports inattendus échappent à la validation enum).
  - Fix : utiliser le même enum partout, factoriser dans un `validators/shared.ts`.
  - Effort : S.

- **NICE_TO_HAVE** Cast `Record<string, unknown>` au lieu de types Prisma.
  - Constat : `backend/src/routes/tipsters.ts:82-89` et `routes/admin.ts:257` construisent dynamiquement un objet `updateData` typé `Record<string, unknown>`. La sécu de type Prisma est perdue.
  - Fix : utiliser `Prisma.TipsterUpdateInput` pour le type.
  - Effort : S.

- **IGNORABLE** `target: ES2017` côté frontend mais `ES2020` backend.
  - Constat : `frontend/tsconfig.json:3`. Avec React 19 + Next 16 le bundler transpile de toute façon. Aucun impact réel.
  - Fix : harmoniser à `ES2020` ou `ES2022`.
  - Effort : S.

---

### D. Conventions et lisibilité

- **NICE_TO_HAVE** ESLint sans règles custom.
  - Constat : `frontend/eslint.config.mjs` charge juste `nextVitals` et `nextTs`. Pas de `eslint-plugin-jsx-a11y`, pas de règle `import/order`, pas de `unused-imports`.
  - Impact : pas de détection des bugs a11y, ordre d'import variable selon les fichiers, imports inutilisés laissés en place.
  - Fix : ajouter `eslint-plugin-jsx-a11y` (compatible avec next-config-eslint), `eslint-plugin-unused-imports`, configurer `import/order` strict.
  - Effort : S.

- **NICE_TO_HAVE** Aucun Prettier configuré.
  - Constat : ni `.prettierrc`, ni `prettier.config.js`, ni section `prettier` dans `package.json`. Le formatting actuel est cohérent mais repose sur l'éditeur de chaque dev.
  - Fix : ajouter `prettier` + `eslint-config-prettier` + `.prettierrc` minimal (`{ "semi": true, "singleQuote": false, "trailingComma": "all" }`).
  - Effort : S.

- **IGNORABLE** Aucun `console.log`/`console.warn`/`console.debug` orphelin côté frontend.
  - Vérifié par grep : 0 occurrence dans `app/`, `components/`, `hooks/`, `lib/`. ✅
  - Côté backend : `console.log`/`console.error` utilisés comme logging structuré de fortune. Pas une dette mais voir catégorie K.

- **IGNORABLE** Aucun `TODO`/`FIXME`/`XXX`/`HACK` dans le code.
  - Vérifié par grep : 0 occurrence (sauf hash d'intégrité dans `package-lock.json`). ✅

- **NICE_TO_HAVE** Pattern `Record<string, ClassName>` dupliqué pour les badges/tones.
  - Constat : `app/admin/page.tsx:120-129` (BADGE_TONES) répété mentalement dans plein de pages. Factoriser dans `components/ui/badge.tsx` ou `lib/badge-tones.ts`.
  - Effort : S.

- **NICE_TO_HAVE** `eslint-disable-next-line react-hooks/exhaustive-deps` dans deux modales.
  - `components/auth/login-modal.tsx:130` + `components/admin/confirm-modal.tsx:111`. Justifié par commentaire mais à surveiller.

---

### E. Sécurité

- **CRITICAL** Webhook Stripe avale toutes les erreurs (200 systématique).
  - Constat : `backend/src/routes/webhooks.ts:215-219` — try/catch global autour du switch logge l'erreur et retombe sur `res.json({ received: true })`. Stripe interprète 200 comme "événement traité, ne pas retry". Si la création de Subscription échoue (DB down, connexion timeout, contrainte unique violée), **Stripe ne retry pas et l'utilisateur a payé mais n'a pas accès**.
  - Impact : perte de paiements silencieuse, support client manuel, perte de confiance.
  - Fix : ne pas attraper l'exception du `switch` — laisser remonter pour que Express renvoie 500 et que Stripe retry (3 jours par défaut). Garder un try/catch fin uniquement autour des sous-blocs où on a vraiment géré l'erreur (ex : pour ne pas re-traiter un événement idempotent).
  - Effort : M (revoir chaque case et décider quoi propager).
  - Fichier : `backend/src/routes/webhooks.ts:215-219`.

- **CRITICAL** Aucune table d'idempotence event-level pour les webhooks Stripe.
  - Constat : l'idempotence actuelle repose sur `subscription.findFirst({ stripeSessionId })` (`webhooks.ts:75-78`) et `tipster.findUnique({ userId })` (`webhooks.ts:47-50`). Pour `invoice.paid` et `customer.subscription.deleted`, **aucune protection** : si Stripe re-livre le même `evt_xxx`, on update deux fois `expiresAt` (effet additif → user double-temps d'accès).
  - Fix : créer une table `StripeWebhookEvent { id (= evt_xxx), processedAt }`. En tête de chaque case, `if (existing) return res.json({ received: true })`, sinon insert et continue.
  - Effort : S (1 migration + 5 lignes en tête de handler).
  - Fichier : `backend/src/routes/webhooks.ts:34-213`.

- **CRITICAL** Pas d'`apiVersion` Stripe pin.
  - Constat : `backend/src/lib/stripe.ts:3` : `Stripe(process.env.STRIPE_SECRET_KEY!)`. Sans `apiVersion`, on suit la version par défaut du SDK installé. Quand Stripe sortira une nouvelle API, des champs vont disparaître ou changer de forme **silencieusement** au prochain `npm update`.
  - Fix : `Stripe(key, { apiVersion: "2025-11-15.acacia" })` (ou la version stable du jour).
  - Effort : S.
  - Fichier : `backend/src/lib/stripe.ts:3`.

- **CRITICAL** Endpoint `/auth/session-from-checkout` = vecteur d'élévation de session.
  - Constat : `backend/src/routes/auth.ts:128-181`. Le seul gate est `subscription.checkoutSessionUsed`, qui empêche la réutilisation mais **n'authentifie pas le caller**. N'importe qui qui voit l'URL `?stripe_session_id=cs_xxx` (logs, screenshare, partage involontaire) **avant** que la session ait été consommée peut récupérer le cookie session du payeur.
  - Impact : prise de contrôle de compte si l'URL fuite avant que l'utilisateur légitime ne revienne sur la page.
  - Fix : exiger un second facteur — soit un nonce signé inclus dans la metadata de la session Stripe et stocké côté client (sessionStorage avant le redirect), soit reposer purement sur le magic-link email (déjà envoyé par `sendAccessUnlockedEmail`) et supprimer ce shortcut. Au minimum, raccourcir la fenêtre (ex : invalider après 5 min).
  - Effort : M.
  - Fichier : `backend/src/routes/auth.ts:128-181`.

- **IMPORTANT** Pas de protection CSRF sur les endpoints POST cookie-based.
  - Constat : auth = session cookie httpOnly avec `sameSite: "lax"` (`auth.ts:32`). Lax protège contre la majorité des CSRF (les requêtes top-level), mais **pas les requêtes formulaires cross-site** (POST classique). Endpoints `/auth/logout`, `/checkout/become-tipster`, `/admin/*`, `/pronos/*` (PATCH/POST) sont vulnérables si un attaquant publie un form HTML qui POST vers `backend.plarya.com`.
  - Fix : soit passer en `sameSite: "strict"` (mais casse le retour `?checkout=success` cross-domain), soit ajouter un header anti-CSRF (`X-Requested-With` vérifié côté backend, ou token CSRF dans un cookie non-httpOnly lu par le frontend).
  - Effort : M.

- **IMPORTANT** `POST /tipsters/:id/view` sans rate-limit ni dédoublonnement.
  - Constat : `backend/src/routes/tipsters.ts:234-244` incrémente `viewsToday` à chaque POST, sans IP-check ni session-check. Un script peut pousser `viewsToday` à des millions.
  - Impact : preuve sociale frauduleuse, méfiance utilisateurs.
  - Fix : rate-limit dédié (1 incrément par IP+tipsterId par tranche horaire), ou stocker un set de `(tipsterId, IP-hash, day)` pour dédoublonner.
  - Effort : M.
  - Fichier : `backend/src/routes/tipsters.ts:234-244`.

- **IMPORTANT** EMAIL_FROM = sandbox Resend (`onboarding@resend.dev`).
  - Constat : `backend/src/lib/resend.ts:5`. C'est l'adresse de test du free tier. En prod : DKIM/SPF échoue, emails en spam ou rejetés.
  - Fix : configurer `noreply@plarya.com` sur Resend (vérification DNS), changer la variable.
  - Effort : S (mais dépend de la disponibilité du domaine).

- **IMPORTANT** Webhook handler insère le HTML utilisateur dans les emails sans escape.
  - Constat : `backend/src/lib/emails.ts:104,168` insèrent `tipsterPseudo` et `matchName` directement dans le HTML : `<strong>${tipsterPseudo}</strong>`. Si un tipster définit son pseudo en `</strong><script>alert(1)</script>`, c'est rendu tel quel.
  - Impact : XSS dans les inbox (la plupart des clients mail isolent JS, mais le HTML peut être réécrit pour du phishing visuel).
  - Fix : escape HTML server-side via une fonction `escapeHtml()` ou utiliser un template engine (Handlebars, MJML).
  - Effort : S.

- **IMPORTANT** `bcryptjs` listé en dépendance alors qu'aucun mot de passe n'est manipulé.
  - Surface d'attaque inutile, voir catégorie A.

- **NICE_TO_HAVE** `helmet()` sans config explicite.
  - Constat : `backend/src/server.ts:22` — defaults OK mais en prod il faut configurer `Content-Security-Policy` strict (sans 'unsafe-inline'), `crossOriginEmbedderPolicy`.
  - Effort : M.

- **NICE_TO_HAVE** Pas de secret rotation.
  - `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `DATABASE_URL` non rotatables sans downtime. Pour le MVP OK, mais documenter.

- **IGNORABLE** Pas de scan dépendances configuré (Dependabot, Renovate).
  - Fix : activer Dependabot sur le repo GitHub.

---

### F. Performance

- **CRITICAL** `next.config.ts` : `images.unoptimized: true`.
  - Constat : `frontend/next.config.ts:7` désactive **toute** optimisation Next/Image (resize, AVIF/WebP, lazy loading natif, blur placeholder). Comment dit "Switch to specific remotePatterns once image hosting is decided".
  - Impact : `/full-logo-remove.png` (~?MB), `/background-grain.jpg` (~?MB), `/image_hero_section.jpg`, photos experts, logos ligues → chargés en taille originale, format original (PNG ou JPG), pas de lazy. LCP désastreux sur mobile 3G.
  - Fix : décider du host (Cloudinary, Vercel Blob, S3) et configurer `remotePatterns`. Pour les assets statiques `public/`, retirer le flag suffit.
  - Effort : S (juste retirer le flag si on garde tout en `public/`) à M (si on configure un CDN externe).
  - Fichier : `frontend/next.config.ts:7`.

- **IMPORTANT** N+1 dans `GET /tipsters` (homepage).
  - Constat : `backend/src/routes/tipsters.ts:119-157` — pour chaque tipster (jusqu'à 6 sur la home), 2 queries (`count` + `findMany` pronosToday). Avec 50 tipsters et `?all=true` : 100 queries pour 50 résultats.
  - Impact : home plus lente à scale.
  - Fix : `prisma.tipster.findMany({ include: { pronos: { where: { createdAt: { gte: today } } } } })` puis comptage côté code. Ou requête SQL groupée.
  - Effort : S.
  - Fichier : `backend/src/routes/tipsters.ts:119-157`.

- **IMPORTANT** Toutes les pages critiques en `"use client"`.
  - Voir catégorie A. Impact perf : pas de streaming, pas de SSR, double network roundtrip (HTML vide → JS → /api).
  - Fix : extraire la logique client en sous-composants, garder le shell de page en server component.

- **IMPORTANT** `framer-motion` non utilisé mais dans le bundle.
  - Voir catégorie B.

- **IMPORTANT** `@iconify/react` chargé partout sans tree-shaking explicite.
  - Constat : `components/layout/header.tsx`, `home/trust-row.tsx`, `tipsters/[id]/page.tsx` etc. importent `Icon` et passent un `icon="iconamoon:menu-burger-horizontal"`. La lib télécharge les SVG à la volée depuis le CDN Iconify mais le composant lui-même est lourd.
  - Fix : précharger les ~10 icônes utilisées via `@iconify/json` au build-time, ou migrer vers `lucide-react` (déjà importé pour quelques icônes — pourquoi 2 libs ?).
  - Effort : M.

- **IMPORTANT** Aucun `dynamic()`/`lazy()` dans le projet.
  - Constat : grep `from "next/dynamic"` → 0 résultat. `app/admin/page.tsx` (1053 lignes) est chargé d'un bloc même pour un user qui visite juste la home.
  - Fix : split route-based (déjà fait par App Router) + split component-based pour les modales lourdes (`EmailCheckoutModal`, `LoginModal`, `ConfirmModal`).
  - Effort : M.

- **NICE_TO_HAVE** Pas de cache HTTP côté backend.
  - Constat : `GET /tipsters` et `/bookmakers` rendent les mêmes données à tous les visiteurs anonymes. Aucun `Cache-Control` envoyé.
  - Fix : ajouter `res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=600")` sur les GET publics.
  - Effort : S.

- **NICE_TO_HAVE** Pas de pagination sur `/admin/pronos`.
  - Constat : `backend/src/routes/admin.ts:88-99` retourne **tous** les pronos. À 10 k pronos, payload énorme.
  - Fix : ajouter `?limit=&offset=` comme pour `/admin/stats/sales`.
  - Effort : S.

- **NICE_TO_HAVE** Pas de revalidation Next ISR.
  - Le profil expert change peu (sauf pronos du jour). Mettre un `revalidate = 60` pourrait économiser 90% des appels DB. Pré-requis : passer la page en server component.

---

### G. Accessibilité (a11y)

- **IMPORTANT** Inputs sans `<label>` associé.
  - `frontend/components/checkout/email-checkout-modal.tsx:101-109` — input email sans `<label>` ni `aria-label` (seulement placeholder, non substituable).
  - `frontend/components/auth/login-modal.tsx:237-247` — input id="login-email" sans `<label htmlFor>`.
  - `frontend/app/admin/page.tsx:661-672` — input number (displayOrder) sans label.
  - Fix : ajouter `<Label htmlFor>` ou `aria-label`.
  - Effort : S.

- **IMPORTANT** `EmailCheckoutModal` n'a pas de focus trap ni de gestion Escape.
  - Constat : `components/checkout/email-checkout-modal.tsx` — pas de `useEffect` `keydown`, pas de `aria-modal` côté wrapper externe (seul le dialog interne l'a). Au contraire de `LoginModal` et `ConfirmModal` qui ont l'infrastructure complète.
  - Impact : utilisateur clavier ne peut pas sortir avec Escape, focus peut s'échapper de la modale.
  - Fix : copier le pattern de `LoginModal` (focus trap, Escape, scroll-lock).
  - Effort : S.

- **IMPORTANT** Sauts de niveau headings dans certaines pages.
  - `components/home/devenir-createur-section.tsx:42` — `<h3>` comme titre de section homepage alors qu'il y a un `<h1>` dans le Hero (saut h1→h3).
  - `components/dashboard/analyses-list.tsx:149` — `<h3>` alors que la page parent `dashboard/page.tsx` fournit un `<h1>` (saut h1→h3).
  - Modales `LoginModal`, `ConfirmModal`, modale upsell `tipsters/[id]/page.tsx:441` utilisent `<h3>` comme titre principal — devrait être `<h2>` ou cohérent.
  - Fix : remonter ou descendre la hiérarchie.
  - Effort : S.

- **NICE_TO_HAVE** Footer sans `<nav>` interne.
  - Constat : `components/layout/site-footer.tsx:18-42` — `<footer>` contient une liste de liens (Confidentialité, Mentions, CGU, Contact) mais pas dans un `<nav aria-label="Liens utiles">`.
  - Effort : S.

- **IGNORABLE** Boutons icon-only ont tous un `aria-label`.
  - Vérifié : close X des modales (`aria-label="Fermer la modale"`), burger header (`aria-label={menuOpen ? ...}`), close toast. ✅

- **IGNORABLE** `lang="fr"` correctement défini sur `<html>`. ✅

- **IGNORABLE** Pas de configuration de tests a11y (axe-core).
  - Fix : ajouter `eslint-plugin-jsx-a11y` (voir D) + un `@axe-core/playwright` quand les tests e2e arriveront.

---

### H. SEO

- **CRITICAL** Aucun `sitemap.ts` ni `robots.ts`.
  - Constat : pas de `app/sitemap.ts`, pas de `app/robots.ts`, pas de `public/robots.txt` ni `public/sitemap.xml`.
  - Impact : Google ne sait pas quelles pages indexer, taux de crawl sous-optimal.
  - Fix : créer `app/sitemap.ts` qui liste home + experts (fetch DB) + pages légales. `app/robots.ts` avec `User-agent: *, Allow: /`, sitemap URL.
  - Effort : S.

- **CRITICAL** Aucun Open Graph / Twitter Card sur aucune page.
  - Constat : grep `openGraph|twitter:|canonical` → 0 résultat. `app/layout.tsx:20-23` ne définit que `title` et `description`.
  - Impact : partage social → image générique du navigateur, taux de clic catastrophique.
  - Fix : enrichir le `metadata` root avec `openGraph: { images, type, locale }`, `twitter: { card, images }`, `metadataBase: new URL("https://plarya.com")`. Ajouter `app/opengraph-image.tsx` (Next-generated 1200x630) ou un fichier statique.
  - Effort : M (design de l'image OG inclus).

- **CRITICAL** `/tipsters/[id]` (page critique SEO) sans `generateMetadata`.
  - Constat : `frontend/app/tipsters/[id]/layout.tsx` exporte un `metadata` générique `{ title: "Profil expert — Plarya" }` (visible dans le grep précédent).
  - Impact : tous les profils experts ont le même `<title>` et même description. Google les déclasse comme contenu dupliqué.
  - Fix : passer en `export async function generateMetadata({ params })` qui fetch le pseudo et construit `${pseudo} — Analyses sportives sur Plarya`.
  - Effort : S.
  - Fichier : `frontend/app/tipsters/[id]/layout.tsx`.

- **IMPORTANT** Aucun JSON-LD structured data.
  - Pas de `<script type="application/ld+json">` quelque part. Pour une plateforme d'experts, le schema `Person` ou `ProfilePage` sur `/tipsters/[id]` est high-value (rich snippets Google).
  - Effort : M.

- **IMPORTANT** Aucun favicon custom.
  - Constat : `frontend/app/favicon.ico` est celui par défaut de Next. Pas de `app/icon.png`, `apple-icon.png`, ni `public/favicon-*`.
  - Effort : S (génération via realfavicongenerator + drop dans `app/`).

- **IMPORTANT** Pages critiques en `"use client"` sans metadata.
  - `app/page.tsx` (home), `app/compte/page.tsx`, `app/dashboard/page.tsx`, `app/admin/page.tsx`, `app/experts/page.tsx`, `app/auth/verify/page.tsx`, `app/tipsters/[id]/page.tsx` ne peuvent pas exporter `metadata` (limitation Next). Seul `tipsters/[id]/layout.tsx` + `devenir-tipster/layout.tsx` ajoutent metadata via le pattern layout-server.
  - Pour `app/page.tsx` (home) il faudrait soit un `layout.tsx` au-dessus, soit refactor.
  - Effort : M.

- **NICE_TO_HAVE** Pas de balise `<link rel="canonical">` explicite.
  - Avec `metadataBase` + `alternates.canonical` on couvre.
  - Effort : S (vient avec le fix OG).

- **NICE_TO_HAVE** Pas de hreflang (mais site mono-langue FR pour l'instant — OK).

---

### I. Tests

- **CRITICAL** Zéro test dans le projet.
  - Constat : `find -name "*.test.*" -o -name "*.spec.*"` → 0 résultats. Aucun framework installé (pas de `vitest`, `jest`, `playwright`, `cypress`).
  - Impact : régression au moindre refacto, pas de garde-fou sur les flows métier critiques (paiement, magic-link, override admin).
  - Fix recommandé pour MVP :
    1. **Vitest** pour les unités pures (validators Zod, helpers `formatPrice`, `calcWinRate`, `formatStartTime`).
    2. **Supertest** pour les routes backend critiques (`/auth/verify`, `/webhooks/stripe` avec event mock, `/checkout/create-session`).
    3. **Playwright** plus tard pour le flow checkout end-to-end.
  - Effort : L (setup + 20-30 tests minimum pour couvrir le critique).

---

### J. Paiements Stripe

- **CRITICAL** Pricing désynchronisé DB / CGU / emails.
  - **DB** : `backend/prisma/schema.prisma:117` → `monthlyPrice Int @default(1900)` (= 19,00€).
  - **CGU public** : `frontend/app/cgu/page.tsx:55,118` → "Abonnement mensuel : 29€ par mois".
  - **Emails** : `backend/src/lib/emails.ts:96` → `priceLabel = type === "DAY_PASS" ? "3,50€" : "19€/mois"` (en hard).
  - **Backend admin stats** : `backend/src/routes/admin.ts:161` → `total + (sub.type === "DAY_PASS" ? 300 : 1900)` (hardcoded 1900 alors que `tipster.monthlyPrice` peut varier).
  - **Brief CLAUDE.md §1** : "Abonnement mensuel : 29€".
  - Impact : si un user lit les CGU, paie 19€/mois via Stripe, puis dispute via Stripe pour "tarif annoncé != tarif facturé" → on perd. Litige RGPD-conso. Plus généralement, c'est un wedge pour des avis 1-étoile.
  - Fix : trancher (29€ ou 19€), aligner les 4 sources : `schema.prisma` default + migration data, `emails.ts:96`, `admin.ts:161`, `cgu/page.tsx:55,118`. Idéalement, supprimer le hardcoded `19€/mois` du email et lire depuis `tipster.monthlyPrice` (déjà fait pour DAY_PASS dans le backend).
  - Effort : S (mais nécessite décision business).

- **CRITICAL** Flow `/devenir-tipster` charge 39€/trimestre alors que la spec dit "candidature manuelle gratuite MVP".
  - Constat : `backend/src/routes/checkout.ts:135-198` crée une session Stripe `subscription` à 3900 centimes (`recurring: { interval: "month", interval_count: 3 }`). `frontend/app/devenir-tipster/page.tsx:93` appelle `createTipsterCheckout()`. CLAUDE.md §5 "DEVENIR EXPERT" est explicite : _"Pas de paiement 39€/trimestre pour l'instant... formulaire de candidature → soumission → email à l'admin → validation manuelle."_
  - Impact : produit out-of-spec. Un visiteur qui clique sur "Devenir expert" est envoyé sur Stripe au lieu de soumettre une candidature → conversion impossible.
  - Fix : remplacer la création de session Stripe par un POST sur `/admin/candidatures` (nouveau) qui crée une row `TipsterApplication { pseudo, email, bio, sports, motivation, status: PENDING }` + envoie un mail à l'admin via Resend. Côté admin, ajouter un onglet "Candidatures" pour valider/refuser.
  - Effort : M (nouvelle table + nouveau endpoint + nouvel onglet admin + désactivation du flow Stripe).
  - Fichiers : `backend/src/routes/checkout.ts:135-198`, `backend/src/routes/webhooks.ts:40-69`, `frontend/app/devenir-tipster/page.tsx`, `frontend/lib/stripe.ts:18-29`.

- **CRITICAL** Webhook Stripe : voir catégorie E (200 systématique + pas de table d'idempotence event-level + pas d'apiVersion).

- **IMPORTANT** Pas de handler `payment_intent.payment_failed` ni `charge.dispute.created`.
  - Constat : `webhooks.ts` couvre `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`. Pas de gestion des disputes (chargebacks), des paiements échoués post-checkout, des 3DS abandons.
  - Impact : impossible de désactiver automatiquement un accès suite à un chargeback.
  - Fix : ajouter les cases `payment_intent.payment_failed`, `charge.dispute.created` → marquer la `Subscription` en `EXPIRED` ou `DISPUTED`.
  - Effort : M.

- **IMPORTANT** Pas de logs structurés sur les fail-cases paiement.
  - Constat : `webhooks.ts:215-217` log juste `console.error("Webhook handler error:", err)`. Pas de payload utile (event.id, type, metadata), pas de niveau, pas de trace.
  - Fix : `pino` (ou équivalent) avec contexte structuré : `logger.error({ eventId, eventType, metadata, err }, "webhook handler failed")`.
  - Effort : S.

- **IMPORTANT** Montants côté Stripe lus depuis `tipster.dayPassPrice/monthlyPrice` (DB) — bonne pratique, mais pas de gate sur valeur min/max.
  - Constat : `checkout.ts:91` `const amount = isSubscription ? tipster.monthlyPrice : tipster.dayPassPrice`. Si un tipster (ou un admin distrait) set `monthlyPrice: 1`, la session sera à 0,01€.
  - Fix : `validators/tipster.ts` (admin update) : `monthlyPrice: z.number().int().min(500).max(50000)` (5-500€).
  - Effort : S.

- **NICE_TO_HAVE** Pas de support Apple Pay / Google Pay explicite dans la session.
  - Constat : `checkout.ts:104` `payment_method_types: ["card"]`. CLAUDE.md §2 prévoit Apple Pay + Google Pay.
  - Fix : retirer `payment_method_types` pour laisser Stripe gérer les modes auto, OU ajouter `["card", "apple_pay", "google_pay"]` selon la version SDK.
  - Effort : S.

- **NICE_TO_HAVE** `customer_email` réutilisé entre sessions → pas de `customer` Stripe persistant.
  - Constat : `checkout.ts:106` passe `customer_email` mais ne réutilise pas un `customer` Stripe existant. Pour un user qui paie 3 fois, on crée 3 customers Stripe.
  - Fix : ajouter un champ `User.stripeCustomerId`, créer le customer Stripe au 1er paiement et le réutiliser.
  - Effort : M.

---

### K. Jobs / Cron / async

- **IMPORTANT** Crons sans timezone explicite.
  - Constat : `backend/src/lib/cron.ts:7,17` — `cron.schedule("0 10 * * *", ...)` s'exécute à 10h **timezone serveur**. Si l'app est déployée sur Vercel/Railway/Fly en UTC, le job tournera à 12h heure française (été) ou 11h (hiver). Pour `0 0 * * *` (reset minuit), même soucis.
  - Impact : reset `viewsToday` à 1h ou 2h du matin heure française → données décalées d'1h pour la dashboard admin.
  - Fix : `cron.schedule("0 10 * * *", fn, { timezone: "Europe/Paris" })`.
  - Effort : S.
  - Fichier : `backend/src/lib/cron.ts:7,17`.

- **IMPORTANT** Crons non-idempotents.
  - Constat : si l'app crash entre 9:59 et 10:01 et redémarre, le cron de 10h se déclenche-t-il une fois, deux fois, zéro fois ? `node-cron` ne persiste pas l'état → si processus restart à 10:00:30, le job ne re-tire pas. Mais si deux instances tournent en parallèle (scaling), **les deux** envoient les emails J+1.
  - Impact : envois en double.
  - Fix : si scaling horizontal, isoler le cron sur une instance dédiée (worker) ou utiliser un lock Postgres (`pg_try_advisory_lock`).
  - Effort : M.

- **IMPORTANT** `sendDailyWinningEmails` non-idempotent.
  - Constat : `cron.ts:35-113` — pas de table de tracking "j'ai envoyé l'email à user X pour le tipster Y le YYYY-MM-DD". Si on l'appelle deux fois (cron + bouton admin /admin/send-daily-emails), les users reçoivent deux emails.
  - Fix : table `DailyEmailLog { userId, tipsterId, date }`, vérifier avant `sendWinningPronoEmail`.
  - Effort : S.

- **IMPORTANT** Endpoint manuel `/admin/send-daily-emails` sans confirmation forte.
  - Constat : `app/admin/page.tsx:347-354` montre une `ConfirmModal`, OK côté UI. Mais côté backend pas de gate "déjà envoyé aujourd'hui ?" → admin peut spammer.
  - Voir fix précédent (table `DailyEmailLog`).

- **NICE_TO_HAVE** Logs cron non-structurés.
  - `console.log("[CRON] ...")` → grep-friendly mais pas parsable. Avec pino + JSON, on peut router vers Datadog/Logflare facilement.
  - Effort : S.

- **NICE_TO_HAVE** Pas de retry sur Resend.
  - Constat : `emails.ts:42-62` — try/catch + log + swallow. Si Resend renvoie 500/429, l'email est perdu.
  - Fix : retry avec backoff (3 tentatives, 1s → 5s → 30s).
  - Effort : S.

---

### L. Conformité RGPD / juridique

- **CRITICAL** CGU / Mentions légales avec contenu placeholder explicite.
  - Constat : `components/legal/legal-shell.tsx:6-16` affiche un `LegalWarning` jaune : _"ces conditions sont génériques. Elles doivent être validées par un juriste qualifié avant la mise en production finale."_ Sur `mentions-legales/page.tsx`, l'adresse est `plarya.com` sans SIREN ni capital social. CGU mentionne `29€` ce qui contredit la DB (cf. catégorie J).
  - Impact : non-conforme RGPD/LCEN dès le premier visiteur français. Risque CNIL / DGCCRF.
  - Fix : faire valider par un juriste (Kamel ?), remplir SIREN, hébergeur, DPO, durée de conservation des données, droits d'accès, finalité des cookies, etc.
  - Effort : M (côté juriste) + S (intégration).

- **CRITICAL** Pas de bannière cookies.
  - Constat : pas de composant `CookieBanner`, pas de gestion du consentement (TCF, Axeptio, Didomi…). Pourtant le site set un cookie de session (auth) + analytics potentiels à venir.
  - Impact : non-conformité ePrivacy directive si on ajoute un seul cookie analytics.
  - Fix : déployer un CMP (consent management platform) avant prod.
  - Effort : M (intégration + config).

- **IMPORTANT** Pas de mécanisme de suppression / export des données (droit RGPD).
  - Constat : un user ne peut pas supprimer son compte depuis `/compte`. Pas d'endpoint backend `DELETE /auth/me`. Pas d'export "mes données".
  - Impact : non-conforme Art. 17 RGPD (droit à l'oubli) + Art. 20 (portabilité).
  - Fix : bouton "Supprimer mon compte" → soft-delete + tombstone email pour l'historique fiscal.
  - Effort : M.

- **IMPORTANT** Stockage des emails sans politique de durée explicite.
  - Constat : `User.email` conservé indéfiniment. Aucun TTL, aucun job de purge des comptes inactifs depuis 3 ans (durée légale par défaut pour les comptes commerciaux non actifs).
  - Fix : documenter la durée dans CGU, ajouter un cron de purge des comptes inactifs après X années (à définir avec juriste).
  - Effort : S.

- **NICE_TO_HAVE** Pas de page "Contact DPO" séparée.
  - La page `/contact` existe mais ne distingue pas les demandes RGPD.
  - Effort : S.

- **NICE_TO_HAVE** Logs / observabilité côté Stripe — pas de PII filter.
  - Si on ajoute un logger structuré, attention à ne pas logger `customer_email` en clair.

---

## Priorisation des corrections

### À faire ABSOLUMENT avant production (CRITICAL — 14 items)

1. **Aligner le pricing DB / CGU / emails (19€ ou 29€)** — `schema.prisma:117`, `cgu/page.tsx:55,118`, `emails.ts:96`, `admin.ts:161` — **Effort : S**
2. **Refondre le flow `/devenir-tipster` (candidature gratuite, pas Stripe 39€)** — `routes/checkout.ts:135-198`, `routes/webhooks.ts:40-69`, `app/devenir-tipster/page.tsx` — **Effort : M**
3. **Webhook Stripe : ne plus avaler les erreurs (renvoyer 5xx pour retry)** — `routes/webhooks.ts:215-219` — **Effort : M**
4. **Ajouter une table d'idempotence event-level Stripe** — nouvelle migration + `routes/webhooks.ts` — **Effort : S**
5. **Pin `apiVersion` Stripe** — `lib/stripe.ts:3` — **Effort : S**
6. **Sécuriser `/auth/session-from-checkout` (nonce signé)** — `routes/auth.ts:128-181` — **Effort : M**
7. **Supprimer le code mort streak/badges** — `lib/stats.ts:19-40`, `routes/tipsters.ts:43-45`, `lib/types/dashboard.ts:13-14` — **Effort : S**
8. **Supprimer `lib/jwt.ts` + désinstaller `jsonwebtoken` + `bcryptjs`** — `lib/jwt.ts`, `package.json:22,29` — **Effort : S**
9. **Désactiver `images.unoptimized: true`** ou configurer un host — `next.config.ts:7` — **Effort : S→M**
10. **Sitemap + robots + OG + favicons** — créer `app/sitemap.ts`, `app/robots.ts`, enrichir `app/layout.tsx` metadata, `app/icon.png`/`apple-icon.png` — **Effort : M**
11. **`generateMetadata` dynamique sur `/tipsters/[id]/layout.tsx`** — **Effort : S**
12. **Zéro test → setup minimum Vitest + 10 tests sur les flows critiques** — auth, checkout, webhook — **Effort : L**
13. **Faire valider mentions légales + CGU par un juriste** — `app/cgu`, `app/mentions-legales`, `app/confidentialite` — **Effort : M (juriste)**
14. **Bannière cookies (CMP)** — nouveau composant + intégration — **Effort : M**

### Important pour qualité (IMPORTANT — 34 items)

1. Décaler vocabulaire URL → `/experts/:id` canonique au lieu de `/tipsters/:id` — **M**
2. Extraire les pages `"use client"` critiques en server + sous-composants client — **L**
3. Éclater `app/admin/page.tsx` (1053 lignes) — **M**
4. Mécanisme RGPD : suppression compte + export — **M**
5. Protection CSRF (token ou sameSite strict) — **M**
6. Rate-limit + dédoublonnement sur `POST /tipsters/:id/view` — **M**
7. `EMAIL_FROM` → domaine custom `noreply@plarya.com` — **S**
8. Escape HTML sur les variables insérées dans les emails — **S**
9. Bloc LEGACY `globals.css` à supprimer (après migration `auth/verify`) — **S**
10. Supprimer utility classes CSS jamais utilisées (`.glow-or`, `.hero-reveal`, etc.) — **S**
11. Supprimer `framer-motion` du package.json — **S**
12. Crons : ajouter timezone `Europe/Paris` — **S**
13. `sendDailyWinningEmails` non-idempotent (table de log) — **S**
14. Webhook : handlers `payment_intent.payment_failed`, `charge.dispute.created` — **M**
15. Logs structurés (pino) — **S**
16. Stripe `customer_email` → persister `stripeCustomerId` sur User — **M**
17. Inputs `EmailCheckoutModal`, `LoginModal`, admin order sans `<label>` — **S**
18. `EmailCheckoutModal` sans focus trap / Escape — **S**
19. Headings : corriger sauts h1→h3 dans plusieurs sections — **S**
20. N+1 dans `GET /tipsters` (homepage) — **S**
21. Pagination sur `/admin/pronos` — **S**
22. `@iconify/react` vs `lucide-react` : choisir une seule lib d'icônes — **M**
23. Validation des sports cohérente entre `validators/tipster.ts` (enum) et `validators/tipsters.ts` (string) — **S**
24. Validation monthlyPrice/dayPassPrice min/max (admin update tipster) — **S**
25. Aucun `dynamic()` : split bundle pour modales lourdes et admin — **M**
26. JSON-LD `Person` / `ProfilePage` sur `/tipsters/[id]` — **M**
27. Helmet CSP strict (sans 'unsafe-inline') — **M**
28. ESLint : ajouter `jsx-a11y`, `unused-imports`, `import/order` — **S**
29. `app/page.tsx` (home) metadata via `app/layout.tsx` wrapper — **M**
30. Migration fichier `app/auth/verify/page.tsx` vers tokens DA dorés (pas LEGACY) — **S**
31. Cleanup automatique des magic_links / sessions expirés (cron) — **S**
32. `any` dans `webhooks.ts:62,148` → typer proprement — **S**
33. `Record<string, unknown>` au lieu de `Prisma.TipsterUpdateInput` — **S**
34. Retry Resend (3 tentatives avec backoff) — **S**

### Nice to have (NICE_TO_HAVE — 27 items)

1. Prettier + `.prettierrc` — S
2. README.md à la racine + frontend + backend — S
3. `.env.example` dans frontend + backend — S
4. `forceConsistentCasingInFileNames` côté frontend — S
5. `target: ES2020+` harmonisé — S
6. Footer dans un `<nav aria-label="…">` — S
7. Validators `tipster.ts` vs `tipsters.ts` : renommer pour clarté — S
8. Helpers `lib/sports.ts` morts (`getLeaguesBySport`, `getSportEmoji`) — S
9. `trust-row.tsx` à committer (untracked) — S
10. Pattern badges/tones factorisé dans `components/ui/badge.tsx` — S
11. Cache HTTP sur `GET /tipsters` et `/bookmakers` — S
12. Revalidation Next ISR sur pages publiques — M
13. `customer_email` → `stripeCustomerId` (déjà cité plus haut, S)
14. Validators inputs côté frontend plus stricts (au-delà du `includes("@")`) — S
15. `eslint-disable-next-line` dans 2 modales → cleaner via `useCallback` — S
16. Tests a11y avec `@axe-core/playwright` — M
17. Page "Contact DPO" — S
18. Logs sans PII — S
19. Documentation durée conservation données — S
20. `<link rel="canonical">` explicite — S
21. Apple Pay / Google Pay activés côté Stripe — S
22. Endpoint cron protégé (si on expose pour Vercel Cron etc.) — S
23. Lock Postgres pour cron multi-instance — M
24. Header CSP affiné — M
25. Dependabot / Renovate activé — S
26. Audit des paquets npm (npm audit + revue) — S
27. Image OG dynamique par tipster (`opengraph-image.tsx`) — M

### Ignorable / cosmétique (IGNORABLE — 12 items)

1. CLAUDE.md §12 (pages de test) à retirer
2. `target: ES2017` côté frontend
3. Validator nommage (tipster.ts vs tipsters.ts)
4. Pas de scan dépendances (Dependabot)
5. Commentaires fournis verbeux mais OK
6. `aria-label` cohérent — déjà bon
7. `lang="fr"` déjà OK
8. Pas d'`<nav>` dans footer (faible impact)
9. Pas de hreflang (mono-langue)
10. Validators non-DRY (refacto cosmétique)
11. Header `viewsCount > 0` display logic
12. Reorder migrations — déjà OK chronologiquement

---

## Recommandations méta

### Patterns récurrents observés

1. **Tout est `"use client"`.** Le projet utilise App Router mais n'exploite quasiment pas les server components. C'est une perte de perf et de SEO. **Recommandation V2** : adopter le pattern "shell server + island client". Chaque page devient un server component qui rend un sous-composant `<Page.Client />` pour la partie interactive.

2. **Duplication des types DTO entre frontend et backend.** Chaque page redéclare ses interfaces. **Recommandation** : créer un dossier `shared/types/` avec les DTOs Zod inferrés (`z.infer<typeof TipsterResponseSchema>`). Plus tard, extraire en package npm interne si on veut un monorepo (Turborepo, Nx).

3. **Tokens DS bien faits mais legacy CSS encore présent.** La discipline d'avoir un `@theme inline` est excellente. La dette résiduelle (bloc LEGACY) est isolée et facile à supprimer une fois `auth/verify` migré.

4. **Vestiges du brief précédent (streak, JWT, paiement tipster) toujours en code.** Quand on refonte un produit, faire un sprint dédié à "supprimer ce qui ne sert plus" — plus rapide que de patcher les divergences une par une. **Recommandation** : faire ce sprint après l'audit pour partir prod avec un code base aligné 100% sur CLAUDE.md.

5. **Pas de couche d'observabilité.** Logs `console.log`, pas de métriques, pas d'erreur tracking (Sentry). En MVP pré-trafic c'est OK mais avant ouverture publique, **Sentry minimum** (frontend + backend) + un endpoint `/health` (déjà présent ✅) + uptime monitoring externe.

6. **Pas de CI/CD.** Aucun `.github/workflows/`, pas de check de build au merge. Recommandation : pipeline simple `lint → typecheck → build → (à terme : tests)` au push sur `main` et sur PR.

### Suggestions stratégiques pour V2

- **Monorepo léger** : passer en Turborepo dès que le DTO partagé devient pénible. Évite les drift.
- **Backend : modulaire par feature** plutôt que par layer technique. Actuellement `routes/`, `validators/`, `lib/` éclatent une feature en 3 dossiers. À 50 routes ça devient ingérable. Pattern feature-folder : `features/checkout/{routes,schemas,service,handler}.ts`.
- **Image hosting** : ne pas garder les assets dans `public/`. Choisir Cloudinary (option simple) ou Vercel Blob + Next/Image optimization. Critique pour LCP.
- **Analytics** : prévoir Plausible / PostHog dès que la home publique tourne — sans cookies tiers pour rester RGPD-friendly.

### Conseils architecturaux

- **N'augmente pas la complexité avant d'en avoir besoin.** Le projet est petit (~7 500 LOC TS/TSX) — pas besoin de microservices, d'event bus, de cache Redis, de WebSocket. Garder Postgres + Express + Next jusqu'à 10 000 users.
- **Investir dans les tests AVANT le scale.** Aujourd'hui zéro test, demain 50 régressions par sprint. La fenêtre pour ajouter des tests à coût raisonnable est maintenant.
- **Le webhook Stripe est le talon d'Achille.** C'est le SEUL point où on peut perdre de l'argent silencieusement. Doubler l'effort sur l'idempotence, les logs, les alertes (Slack webhook sur erreur).

---

## Notes finales

### Ce qui n'a PAS été audité (à check manuellement par Romain)

1. **Le contenu des emails** (rendu HTML réel, déliverabilité, score spam, score Litmus / Email on Acid). Lecture du HTML faite, mais pas le rendu réel.
2. **Le déploiement** (Dockerfile, hosting, env vars manquantes, secrets management, backup Postgres). Aucun `Dockerfile` ou `vercel.json` lu — vraisemblablement pas encore configuré.
3. **Les migrations Prisma elles-mêmes** (SQL généré, contraintes, indexes) — j'ai listé les noms mais pas lu le `.sql`. À vérifier surtout que les unique constraints (`Subscription.stripeSessionId` ?) sont bien posées.
4. **Le seed de production** — le seed actuel met `monthlyPrice: 1900` (19€). À la prod, soit on seed les tipsters avec `monthlyPrice: 2900`, soit on aligne la DB sur 19€ et on met à jour les CGU. **Décision business prioritaire.**
5. **Mobile UX réel** — l'audit a vu le code responsive (md:hidden, sm:flex, etc.) mais pas testé en device-emulator. Le hero a un branchement mobile/desktop, mais les modales (`EmailCheckoutModal`, modale upsell) n'ont pas été testées en taille iPhone SE.
6. **Performance réelle** (Lighthouse, WebPageTest, RUM). L'audit identifie les blockers conceptuels (unoptimized images, pas de SSR, framer-motion) mais ne mesure pas l'impact en ms. À lancer Lighthouse une fois les CRITICAL fixés.
7. **Sécurité applicative en profondeur** — pas de fuzzing des inputs, pas de test penetration. Pour un MVP avec auth + paiement, prévoir un audit pentest externe avant ouverture publique.
8. **Stripe Test Mode → Production switch** — vérifier que `STRIPE_WEBHOOK_SECRET` de prod est bien différent de celui de test, que les webhooks endpoints sont configurés côté Stripe Dashboard.
9. **Resend domain verification** — DKIM, SPF, DMARC. Sans ça, les emails atterrissent en spam.
10. **Backup Postgres** — pas vérifié. Critique. RPO/RTO à définir avec l'hébergeur.

### Effort total estimé du sprint refonte

- **CRITICAL (14 items)** : ~5-8 jours dev (en supposant que la validation juridique tourne en parallèle).
- **IMPORTANT (34 items)** : ~10-15 jours dev.
- **NICE_TO_HAVE (27 items)** : ~5-8 jours, à étaler sur les sprints suivants.

**Recommandation séquencement :**

1. **Sprint Refonte 1 (5j)** : tous les CRITICAL sauf #10 (SEO) et #14 (cookies — dépend juriste).
2. **Sprint Refonte 2 (3j)** : CRITICAL #10 + #14 + IMPORTANT 1-10.
3. **Sprint Tests (4j)** : Vitest + 30 tests minimum + setup CI.
4. **Sprint Polish (3j)** : reste des IMPORTANT.
5. **Sprints NICE_TO_HAVE** : intercalés au fil de l'eau.

**Avant ouverture publique :** Sprint Refonte 1 + 2 + Tests = ~12 jours.
