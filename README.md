# Plarya

Plateforme d'analyses sportives par des experts vérifiés.

## Stack

- **Frontend** : Next.js 16 (App Router + Server Components), React 19, Tailwind v4, TypeScript 5
- **Backend** : Express 5, Prisma 7, PostgreSQL, TypeScript 6
- **Auth** : Magic-link (Resend), session cookies httpOnly + CSRF double-submit
- **Paiements** : Stripe Checkout (day pass + abonnement mensuel + candidature expert quarterly)
- **Logs** : pino structuré, masquage PII (emails)

## Architecture

```
plarya/
├── frontend/    Next.js — UI utilisateur
├── backend/     Express + Prisma — API REST + webhooks Stripe
├── docs/        Documentation (audit, project state)
└── CLAUDE.md    Spec produit + design system (source de vérité)
```

## Setup local

1. Cloner le repo
2. Installer Postgres local sur `:5432`, créer une DB `plarya`
3. Backend :
   ```bash
   cd backend
   cp .env.example .env   # renseigner DATABASE_URL + Stripe + Resend
   npm install
   npx prisma migrate dev
   npm run db:seed
   npm run dev            # port 4000
   ```
4. Frontend (dans un autre terminal) :
   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev            # port 3000
   ```
5. (Optionnel) Pour tester les webhooks Stripe en local :
   ```bash
   stripe listen --forward-to localhost:4000/webhooks/stripe
   ```

## Variables d'environnement

Voir [`frontend/.env.example`](frontend/.env.example) et [`backend/.env.example`](backend/.env.example).

## Outillage

- **Linting** : ESLint (frontend uniquement, `npm run lint`)
- **Formatting** : Prettier partagé via [`.prettierrc`](.prettierrc) à la racine — `npx prettier --write .`
  ou `npm run format` dans chaque package
- **Type-checking** : `npx tsc --noEmit` côté frontend et backend
- **Dependabot** : PRs hebdomadaires groupées (cf. [`.github/dependabot.yml`](.github/dependabot.yml))

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — spec produit, design system golden-da, conventions
- [`design-system.md`](design-system.md) — spec DS détaillée (extrait Figma)
- [`docs/dore-audit.md`](docs/dore-audit.md) — inventaire des usages de l'accent doré
- [`docs/web-patterns.md`](docs/web-patterns.md) — patterns Node.js + TypeScript réutilisables
