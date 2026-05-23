# Plarya — Frontend

Next.js 16 (App Router) — interface utilisateur Plarya.

## Stack

- Next.js 16 App Router + Server Components
- React 19
- Tailwind v4 avec tokens custom (design system golden-da)
- Phosphor Icons (`@phosphor-icons/react`)
- Stripe Checkout (côté redirect uniquement, pas de Stripe.js direct)

## Routes principales

- `/` — Homepage (server, public)
- `/experts/[id]` — Profil expert (server, public, SEO indexé, JSON-LD ProfilePage)
- `/devenir-expert` — Formulaire candidature (server, public)
- `/dashboard` — Espace expert (server, auth EXPERT)
- `/compte` — Espace utilisateur (server, auth)
- `/admin` — Panel admin (server, auth ADMIN)
- `/cgu`, `/confidentialite`, `/mentions-legales`, `/contact` — Légal

## Architecture des pages connectées

Pages connectées (`/compte`, `/dashboard`, `/admin`) = pattern shell server + island client :

- `page.tsx` = server component (fetch initial + auth check via `serverFetch`)
- `*Client.tsx` = sous-composant client (hooks + interactions)
- Pour `/admin`, éclatement supplémentaire en `_components/` (Revenue, Sales, ByExpert,
  Experts, Pronos, Users), tous orchestrés par `AdminClient.tsx`.

Le pattern garantit que :

- le HTML initial contient les data (pas de spinner après l'hydratation)
- les cookies de session sont forwardés au backend via `lib/server-fetch.ts`
- les pages connectées ne sont jamais mises en cache HTTP (`cache: "no-store"`)

## Scripts

- `npm run dev` — Dev server (Turbopack)
- `npm run build` — Build prod
- `npm run start` — Start prod
- `npm run lint` — ESLint (jsx-a11y + import/order + unused-imports)
- `npm run format` — Prettier write
- `npm run format:check` — Prettier check (sans modif)

## Variables d'environnement

Voir [`.env.example`](.env.example).

## Convention design (DS golden-da)

Voir [`../CLAUDE.md`](../CLAUDE.md) à la racine pour la spec complète du design system
(noir profond + accent doré, DM Serif Display titres, Work Sans corps).
