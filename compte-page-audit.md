# Audit V1 — page `/compte` (Mon Compte)

**Fichier audité** : `frontend/app/compte/page.tsx` (250 lignes)
**Composants associés** : `@/components/ui/{input,label,textarea}`, `@/hooks/use-user`, `@/lib/api`, `@/lib/constants` (SPORT_LABELS).
**Route appelée** : `GET /tipsters/me`, `PATCH /tipsters/me`.

---

## ⚠️ Note importante — décalage entre le brief et le code V1

Le brief décrit **"Mon Compte"** comme un espace acheteur (email, abonnements, historique, etc.), conforme à `CLAUDE.md §5` :

> - Liste des abonnements actifs avec lien vers le profil de l'expert
> - Historique des achats (dates, montants, experts, analyses)
> - Bouton "Se déconnecter"
> - Pas de modification de profil

**La V1 actuelle ne contient RIEN de tout ça.** `/compte` est exclusivement un **éditeur de profil TIPSTER** (note quotidienne, pseudo, bio, sports). Les USER et ADMIN qui y arrivent voient juste un placeholder *"Cette page est réservée aux experts."*

Le commentaire du `Header.tsx` ligne 18-21 confirme l'intention non-implémentée :
```
USER    : "Mon Compte" (vue acheteur : abonnements + historique)
TIPSTER : "Dashboard" + "Mon Compte" (éditeur profil expert)
ADMIN   : "Admin" uniquement
```

→ **Décision à prendre avant la refonte** : redesigner uniquement la vue TIPSTER existante, ou aussi câbler la vue USER manquante (le backend `GET /subscriptions/me` existe déjà).

---

## 1) DONNÉES AFFICHÉES

### Données utilisateur

| Champ | Source | Affiché ? |
|---|---|---|
| `user.email` | `useUser()` (cookie session → `GET /auth/me`) | ❌ NON |
| `user.role` | idem | ❌ NON (utilisé en interne pour le gating) |
| `user.id` | idem | ❌ NON |
| Date d'inscription | — | ❌ Pas dans le payload `/auth/me` |
| Photo de profil | — | ❌ |

### Données tipster (uniquement si `user.role === "TIPSTER"`)

Récupérées via `apiGet<TipsterProfile>("/tipsters/me")` au mount :

| Champ | Affiché | Éditable |
|---|---|---|
| `id` | non | non |
| `pseudo` | input pré-rempli | ✅ |
| `bio` | textarea pré-rempli | ✅ |
| `dailyNote` | textarea pré-rempli, max 200 caractères | ✅ |
| `dailyNoteDate` | non | non (auto-set côté backend au PATCH) |
| `sports` | chips toggle | ✅ |

**Manquant V1** (qui pourrait être pertinent dans la refonte) :
- `photoUrl` (présent en DB, exposé par `/tipsters/me` indirectement, mais pas dans l'interface TS locale ni dans l'UI).
- `dayPassPrice` / `monthlyPrice` (non éditables, fixés par admin).
- `winRate`, `pronosToday` (présents dans la réponse `/tipsters/me` du backend ligne 11-50, mais non utilisés ici — déjà affichés sur le Dashboard).

---

## 2) ACTIONS DISPONIBLES

### USER (role = "USER")
- **Aucune action.** Page bloquée par le placeholder *"Cette page est réservée aux experts."*

### TIPSTER (role = "TIPSTER")
- **Modifier la note quotidienne** (`dailyNote`) → `PATCH /tipsters/me { dailyNote }` (bouton "Mettre à jour").
- **Modifier le profil** (`pseudo`, `bio`, `sports`) → `PATCH /tipsters/me { pseudo, bio, sports }` (bouton "Enregistrer").
- Validation client : minimum 1 sport requis (le pseudo n'a PAS de validation longueur — c'est implicite côté backend).
- **Pas de déconnexion** sur cette page. La déconnexion vit dans le `Header` (`onLogout` câblé via `HeaderAuth` → `useUser().logout()`).
- **Pas de modification d'email** — l'email est fixe (magic-link sur email, cf. CLAUDE.md §5).
- **Pas de suppression de compte.**
- **Pas de modification de photo** (alors que `photoUrl` existe en DB).

### ADMIN (role = "ADMIN")
- **Aucune action.** Vu comme un USER (placeholder "réservée aux experts").

### Aucune action liée aux abonnements
- Pas de listing des subscriptions actives.
- Pas de listing des day-passes historiques.
- Pas de bouton "résilier abonnement".
- Pas d'appel Stripe Customer Portal.

---

## 3) HISTORIQUE / ABONNEMENTS

### V1 actuel — RIEN n'est affiché sur `/compte` côté abonnements.

### Backend déjà disponible

| Endpoint | Auth | Renvoie |
|---|---|---|
| `GET /subscriptions/me` | authMiddleware | Liste complète des subscriptions de l'user (active + expirées), avec `tipster: { id, pseudo, photoUrl, sports }` inline. Triée `createdAt desc`. |

Schéma `Subscription` (cf. usage backend) :
- `id`, `userId`, `tipsterId`, `type` (`DAY_PASS` | `MONTHLY`), `status` (`ACTIVE` | `EXPIRED` | `CANCELED`?), `expiresAt`, `createdAt`.

→ **Brancher cette vue côté frontend est un travail neuf, pas un restyle.** Si la refonte inclut cette feature, il faut :
1. Fetch `/subscriptions/me` au mount (en USER ou TIPSTER).
2. Render une liste : abonnements actifs (status=ACTIVE && expiresAt>now) en haut, historique en dessous.
3. Liens `/tipsters/[id]` sur le pseudo.
4. Pas de bouton résiliation pour le MVP (CLAUDE.md §1 mentionne "pas Stripe Connect pour le MVP" → vraisemblablement pas de Customer Portal non plus tant qu'il n'est pas explicitement câblé).

### Pas d'appels Stripe Portal V1

Recherche `customer-portal` / `billingPortal` / `stripe.billingPortal` dans le code → **aucun résultat** dans le frontend (à vérifier backend si besoin). Confirme l'absence de feature résiliation V1.

---

## 4) DIFFÉRENCES PAR RÔLE

| Rôle | Vue actuelle | Vue attendue (CLAUDE.md + commentaires Header) |
|---|---|---|
| **USER** | Placeholder "réservée aux experts" | Liste abonnements + historique day-passes + déconnexion |
| **TIPSTER** | Éditeur profil (note + pseudo + bio + sports) | **À discuter** : garder l'éditeur ? Ou déplacer dans le Dashboard ? La vue acheteur (abonnements) est probablement utile aussi pour le tipster (il peut acheter d'autres experts) |
| **ADMIN** | Placeholder "réservée aux experts" (BUG — voir Header §40-52 : admin n'a pas de lien vers /compte de toute façon) | Pas de besoin spécifique. Soit redirect /admin, soit même vue que USER si pertinent |

---

## 5) LAYOUT V1

### Structure visuelle (top → bottom)

```
┌────────────────────────────────────────────────────────────┐
│ Container : max-w-2xl, px-6 py-12 (sm:px-8)                │
│                                                            │
│ <h1>Mon compte</h1>  (DM Serif italic, text-4xl/5xl)       │
│                                                            │
│ ── Si user.role !== TIPSTER : ─────────────────────────    │
│  "Cette page est réservée aux experts." (texte gris seul,  │
│  pas d'autre contenu)                                      │
│                                                            │
│ ── Si TIPSTER : ──────────────────────────────────────     │
│                                                            │
│ Section "Note quotidienne" (mt-12)                         │
│   <h2>                                                     │
│   <p> Description "Visible sur votre profil et la page..." │
│   <Textarea> max 200 caractères                            │
│   {count}/200 + status msg                                 │
│   <button>Mettre à jour</button>                           │
│                                                            │
│ Section "Profil" (mt-20)                                   │
│   <h2>                                                     │
│   <Label>Pseudo</Label><Input>                             │
│   <Label>Bio</Label><Textarea rows=5>                      │
│   <Label>Sports couverts</Label>                           │
│     [chips toggle ⚽ Football, 🎾 Tennis, ...]              │
│   <button>Enregistrer</button>                             │
│   msg status                                               │
└────────────────────────────────────────────────────────────┘
```

**Pas de footer** rendu directement par la page (cf. layout root `<SiteFooter />` géré globalement).

### Couleurs / classes V1 problématiques

| V1 (hardcodé) | Sémantique | → DS golden-da |
|---|---|---|
| `#00D47E` | Vert primary (spinner border-t, success msg, ring chip active, bg chip active /10, text chip active, hover btn) | `accent` (#dfb968) / `accent-strong` |
| `#F0EDE8` | Off-white texte principal (titres, inputs text, btn bg) | `foreground` (#ffffff) |
| `#8A8680` | Gris secondaire (Label, descriptions, /60 pour le compteur, chip default) | `muted-foreground` (#898181) |
| `#1A1A1A` | Border subtle (input border, ring chip default) | `surface-elevated` (#181818) |
| `#080808` | BG input + text-on-button-clair | `background` (#000000) ou `bg-black/40` |
| `text-red-400` | Status erreur | `text-destructive` |
| `font-[family-name:var(--font-dm-serif)] italic` | H1 italique | `font-display` (sans italic — DS golden-da n'utilise pas l'italique) |
| `bg-[#F0EDE8] hover:bg-[#00D47E]` | Bouton CTA blanc → vert au hover | Button variant `primary` ou `white` du DS |
| `text-2xl font-semibold` | H2 sections | `font-display text-h3` ou `text-h4` |
| `text-base` (16px générique) | Inputs, descriptions | `text-body-16` |
| Chip classes (`ring-[#00D47E] bg-[#00D47E]/10 text-[#00D47E]`) | État actif sport | `border-accent bg-accent/20 text-accent` (cohérent avec /devenir-tipster) |
| Chip classes default (`ring-[#1A1A1A] text-[#8A8680]`) | État inactif sport | `border-surface-elevated bg-black/40 text-foreground` (cohérent avec /devenir-tipster) |

**Total ~25 occurrences hardcodées** sur ce fichier.

---

## 6) COMPOSANTS UTILISÉS

### V1 importés
- `@/components/ui/input` (shadcn Input — fond `bg-input/30` hérité, override via className V1)
- `@/components/ui/label` (shadcn Label — sémantique standard)
- `@/components/ui/textarea` (shadcn Textarea — idem)
- `@/hooks/use-user` (UserProvider context)
- `apiGet`, `apiPatch` (`@/lib/api`)
- `SPORT_LABELS` (`@/lib/constants` — dict des labels emoji)
- `useRouter`, `useState`, `useEffect` (next/react)

### Composants DS déjà au point qu'on pourrait réutiliser
- **`Button`** (`@/components/ui/button`, variants `primary`/`secondary`/`white`/`ghost`) — pour remplacer les `<button>` natifs stylés.
- **Pattern Input du `/devenir-tipster`** : `fieldCls` partagé (h-12, rounded-xl, border surface-elevated, bg-black/40, focus accent). On peut le factoriser (créer un `field-styles.ts` ou un composant Input wrapper DS).
- **Pattern Chips toggle du `/devenir-tipster`** : `cn("rounded-full border px-4 py-2 …", isActive ? "border-accent bg-accent/20 text-accent" : "border-surface-elevated bg-black/40 text-foreground hover:border-accent")`. **Exactement le même comportement** que la chip "sports couverts" ici — réplication directe.
- **`SectionTitle`** (`@/components/ui/section-title`) utilisé sur le Dashboard. Pourrait être ré-utilisé si on garde des sections.

### Composants spécifiques manquants
- Pas de composant "Card abonnement" — à créer si on câble la vue USER (ou réutiliser une variante simplifiée de l'`ExpertCard`).

---

## 7) NAVIGATION

### Entrée vers la page
- **Header desktop / mobile** (variant `connected`) :
  - USER → bouton "Mon Compte" → `/compte` (ligne 51 de `header.tsx`)
  - TIPSTER → bouton "Mon Compte" (en plus de "Dashboard") → `/compte` (ligne 44-46)
  - ADMIN → **pas de lien** vers `/compte` (ligne 48 — uniquement "/admin")
- Pas d'autres entrées détectées dans le code (pas de link dans les modales ou autres pages).

### Sorties depuis la page
- **Retour Home** → via le logo du Header ou Link `<Link href="/">`.
- **Header** : nav vers `/dashboard` (TIPSTER), Déconnexion.
- **Aucun lien interne** dans le contenu de `/compte` actuellement.

### Redirect si déconnecté
- `useEffect` ligne 38-40 : `if (!loading && !user) router.push("/")` → redirige vers la home.

---

## 8) PIÈGES POTENTIELS

1. **`fetchLoading` à `true` à vie pour USER/ADMIN** : bug observé et corrigé en V1 (cf. commentaire ligne 44-49). Si on refactor sans préserver cette logique, le spinner ne s'éteint jamais pour les non-TIPSTER.
2. **Validation pseudo manquante côté front** : si on permet l'édition, un pseudo vide ou trop court passe côté client (le backend rejette avec un message → affiché tel quel via `noteMsg.includes("pris")` qui matche un "Ce pseudo est déjà pris" très spécifique côté backend `tipsters.ts:77`).
3. **`maxLength=200` sur dailyNote** : si on remplace le `<Textarea>` shadcn par un Textarea DS custom, ne pas perdre cet attribut HTML.
4. **Pas d'appel Stripe Portal V1** — confirmé absent. Pas de risque de casser ça côté `/compte`.
5. **Re-fetch après PATCH** : la V1 fait un update OPTIMISTE du state local (`setTipster(prev => ...)`) avec le payload retourné par le backend. Pas de re-fetch complet. Si on ajoute un fetch après mutation, attention à la double UI.
6. **`useUser` ne renvoie pas la date d'inscription ni la photo** : si la refonte affiche ces champs, il faut soit étendre `/auth/me` (modif backend), soit fetcher autre chose (`/users/me`).
7. **L'ADMIN voit le placeholder "réservée aux experts"** alors qu'il n'a aucun lien vers `/compte` dans le Header. Pas un bug bloquant — mais incohérent : visiteur ADMIN tape l'URL à la main → message confus.
8. **`POST_LOGIN_REDIRECT_KEY`** : si on est redirigé vers `/compte` après login via magic link, la session est encore en train de se charger → bien penser à `loading` dans l'UI.

---

# SYNTHÈSE — 5 LIGNES

**Ce qu'il faut redesigner** :
1. **Décider du scope** : juste restyler la vue TIPSTER (éditeur profil) au DS doré, **OU** câbler en plus la vue USER manquante (abonnements + historique day-passes) qui est documentée dans CLAUDE.md §5 et dans le commentaire du Header mais jamais implémentée.
2. Migrer **toutes** les couleurs hardcodées V1 (`#00D47E`, `#F0EDE8`, `#8A8680`, `#1A1A1A`, `#080808`, `text-red-400`) vers les tokens DS (`accent`, `foreground`, `muted-foreground`, `surface-elevated`, `bg-black/40`, `destructive`).
3. Refaire le **H1** ("Mon compte") en `font-display` sans italique, le **H2** des sections en `font-display text-h3`, et passer les inputs/textarea au pattern `fieldCls` partagé avec /devenir-tipster.
4. Remplacer les `<button>` natifs par `<Button variant="primary" />` (CTA enregistrer / mettre à jour) et utiliser les chips DS pour la sélection sports (mêmes classes que /devenir-tipster).
5. Uniformiser le container à `max-w-[872px]` (cohérent avec Dashboard et /devenir-tipster — V1 est en `max-w-2xl` = 672px, plus étroit).

**Pièges potentiels** :
1. **Bug `fetchLoading` à conserver** : la V1 a une garde explicite pour les non-TIPSTER (ligne 49-52) sinon spinner infini. Ne pas supprimer dans le refactor.
2. **Mise à jour state optimiste** : `handleDailyNote` et `handleProfile` font `setTipster(prev => { ...prev, …data })` après PATCH. Préserver ce comportement pour éviter un re-fetch inutile.
3. **Aucune logique Stripe Portal** : pas de risque de casser une feature résiliation existante (elle n'existe pas V1).
4. **Vue USER manquante** : si on l'ajoute, attention au backend `GET /subscriptions/me` qui renvoie TOUTES les subscriptions (actives + expirées). Filtrer côté UI.
5. **`POST_LOGIN_REDIRECT_KEY`** : l'utilisateur arrive parfois sur `/compte` juste après un magic-link → `loading` peut être encore `true` quelques ms. Garder le spinner de chargement gracieux.
6. **L'ADMIN n'a pas de lien `/compte`** mais peut taper l'URL → décider du comportement (redirect `/admin` ? Page neutre ? Vue USER ?).
7. **`maxLength=200` sur dailyNote** : si on remplace le Textarea shadcn par un wrapper custom, ne pas perdre cet attribut HTML (compteur visuel à conserver).
