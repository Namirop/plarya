# Audit V1 — page `/tipsters/[id]` (profil expert)

**Fichier audité** : `frontend/app/tipsters/[id]/page.tsx` (584 lignes)
**Layout** : `frontend/app/tipsters/[id]/layout.tsx` (metadata uniquement, passthrough)
**Composants associés** :
- `components/checkout/email-checkout-modal.tsx`
- (internes au fichier) `PronoLine`, `BookmakerComparator`

**Rappel routing** : `next.config.ts` rewrite `/experts/:id` → `/tipsters/:id` (non-permanent). L'URL UI publique reste `/experts/[id]`.

---

## 1) DONNÉES AFFICHÉES

### Données tipster (interface `TipsterProfile`, ligne 46-59)

| Champ | Type | Affichage |
|---|---|---|
| `id` | string | (clé interne) |
| `pseudo` | string | `<h1>` central, DM Serif italique 5xl/6xl |
| `bio` | string \| null | `<p>` centré sous badge |
| `dailyNote` | string \| null | `<p>` italique gris clair sous bio |
| `photoUrl` | string \| null | Avatar 140×140 rond, overlap top de la card identité. Fallback : initiale dans cercle `#141414` |
| `sports` | string[] | Liste de chips `#141414` avec `<SportIcon>` + label via `getSportLabel()` |
| `dayPassPrice` | number (cents) | Affiché dans le CTA sticky via `formatPrice()` |
| `monthlyPrice` | number (cents) | Affiché en sous-CTA + dans la modale upsell |
| `warningMessage` | string \| null | Bandeau vert `#00D47E/5` en haut de page (admin warning) |
| `viewsToday` | number | `<span>` "X vues" avec icône `tabler:eye`, **affiché uniquement si > 0** |
| `pronosToday` | number | **Fetché mais jamais affiché** dans la V1 actuelle |
| `pronos` | PronoData[] | Liste utilisée comme fallback avant que `fullPronos` arrive |

**Volontairement ABSENT** (cf. CLAUDE.md §6 — règle Plarya) :
- Pas de streak / badge 🔥
- Pas de taux de réussite affiché en public
- Pas de profit total / "+3200€"

### Source des données

- **Profil + analyses (pick masqué)** : `apiGet('/tipsters/:id')` → ligne 83. Renvoie la version "publique" (pick à `null` si pas d'accès).
- **Analyses complètes (avec pick)** : `apiGet('/tipsters/:id/pronos')` → ligne 115. Appelé uniquement si `hasAccess === true`.
- **Compteur de vues** : `apiPost('/tipsters/:id/view', {})` → ligne 92. Fire-and-forget, idempotent dans la session (gardé par `viewTracked.useRef`).
- **Hook user** : `useUser()` → expose `user.role` (`USER | TIPSTER | ADMIN`) et `refreshUser`.

---

## 2) LISTE DES ANALYSES

### Chargement

- Le profil renvoie déjà `pronos` (liste avec `pick: null` quand verrouillé).
- Si l'user a accès : second fetch sur `/tipsters/:id/pronos` qui écrase via `setFullPronos`.
- **Pas de pagination** — toutes les analyses du jour sont chargées d'un coup.
- Filtrage frontend : `pronos.filter(p => p.result === "PENDING")` → seules les analyses non encore validées s'affichent.

### Schéma `PronoData` (ligne 30-44)

```ts
{
  id, matchName, league (id sport p.ex. "ligue-1"),
  pick: string | null,           // ← MASQUÉ quand verrouillé
  argument: string | null,       // ← MASQUÉ aussi (révélé avec le pick)
  odds: number,
  teasing: string,               // ← code → libellé via TEASING_LABELS
  result: "PENDING" | "WON" | "LOST",
  startTime: string,             // ISO
  isFeatured: boolean,           // ← marque "Analyse du jour" (étoile)
  matchDate: string | null,
  createdAt: string,
  bookmakerOdds?: BookmakerOddsData[],  // ← VISIBLE uniquement déverrouillé
}
```

### Affichage Locked vs Unlocked

**Toujours visible (les deux états)** :
- Logo de ligue (ou `<SportIcon>` fallback)
- `matchName` (titre du match — Real Madrid vs Barcelone, etc.)
- Étoile `<Star>` si `isFeatured`
- Libellé teasing (TEASING_LABELS — "🎯 Pick solide", "💣 Value"…)
- `formatStartTime(startTime)` ("Début à 20h45" / "Demain à 15h00" / "Match commencé" en rouge)
- Cote (`prono.odds.toFixed(2)`)

**Locked uniquement** :
- À la place du `pick` : `<span class="blur-sm">Prédiction verrouillée</span>` avec `<Lock>` icon centré dessus.
- Opacité 50% sur toute la ligne **si le match a déjà commencé** (`isStarted(startTime) && !hasAccess`).

**Unlocked uniquement** :
- `prono.pick` en gras texte clair.
- `prono.argument` en petit gris en dessous.
- `<BookmakerComparator>` (cotes alternatives + lien d'affiliation "Accéder" qui ouvre l'URL bookmaker en `_blank`).

### Détection Locked vs Unlocked

```ts
apiPost('/subscriptions/check', { tipsterId: id }) → { hasAccess: boolean }
```

Backend résout via abonnement actif **OU** day-pass acheté ≤ 24h. La détection est centralisée backend — le frontend ne fait que stocker `hasAccess` dans le state.

**Recheck** :
- Au mount.
- À chaque retour Stripe (poll 5× × 2s — ligne 138-156).

### Champ "teasing" — confusion à clarifier

Le brief mentionne un "texte d'aperçu masqué pour les non-acheteurs". **Ce champ n'existe pas en V1**. Ce qui existe :
- `teasing: string` → un **code enum** (PICK_SOLIDE, VALUE…) qui mappe vers un libellé court visible **pour tout le monde** (locked ET unlocked).
- `pick: string | null` → la prédiction réelle (1×2, plus/moins X, etc.), **uniquement renvoyée par le backend quand hasAccess**.
- `argument: string | null` → l'argumentaire long, idem.

Pas de "texte teaser long". Si la nouvelle DA veut ça, il faudra **ajouter un champ DB** (out of scope du visuel).

---

## 3) CTA DE PAIEMENT (état Locked)

### Sticky CTA (bas de page, ligne 327-359)

Conditionnel sur `!hasAccess`. Disparaît dès qu'on a l'accès.

**Si toutes les analyses du jour sont commencées** (`allAnalysesStarted`) :
> "Toutes les analyses du jour sont terminées, reviens demain"
(texte gris, pas de bouton)

**Sinon, deux boutons** :
1. **Bouton principal** (full-width, vert `#00D47E`, uppercase tracking-wide) :
   > `Déverrouiller les {n} sélections ({dayPrice}€)`
   - Wording V1 : "Déverrouiller" — ❗ **CLAUDE.md §1.1 préfère "Accéder"**.
   - Tarif : `formatPrice(tipster.dayPassPrice)` — **dynamique, récupéré du backend**, pas hardcodé.

2. **Bouton secondaire** (lien texte gris discret) :
   > `ou abonnement mensuel {monthlyPrice}€`

### Action au clic — `handleCheckout(type)` (ligne 161-176)

- **Si user non connecté** → ouvre `<EmailCheckoutModal>` (récupère email avant Stripe).
- **Si user connecté** → appelle `createCheckoutSession(tipsterId, type)` → `apiPost('/checkout/create-session', { tipsterId, type })` → reçoit `{ url }` → `window.location.href = url`.

### Retour Stripe (ligne 120-159)

URL : `/tipsters/:id?checkout=success&stripe_session_id=...`

1. Récup la session via `apiGet('/auth/session-from-checkout?stripe_session_id=...')` (login l'user via cookie posé par le webhook).
2. `refreshUser()`.
3. `replaceState` pour nettoyer les query params.
4. Poll `/subscriptions/check` (5× × 2s) jusqu'à voir `hasAccess: true`.
5. Affiche `<UpsellModal>` (voir §État Particulier).

---

## 4) ÉTATS PARTICULIERS

### User déconnecté

**Voit la page Locked classique**. Pas de redirect, pas de "connexion requise". Au clic sur le CTA → ouvre `<EmailCheckoutModal>` qui demande l'email avant de partir sur Stripe.
Conséquence : un visiteur anonyme peut acheter directement, le compte est créé côté backend post-paiement (flow magic link décrit CLAUDE.md §5).

### User connecté = le tipster lui-même

**Aucun traitement spécial dans la V1 actuelle.** Il voit la page exactement comme un visiteur (Locked si pas d'abonnement, Unlocked sinon). Le check `user.role === "TIPSTER"` n'est jamais utilisé sur cette page — c'est utilisé sur `/dashboard` et `/devenir-tipster`.
→ **À discuter pour la refonte** : faut-il bypasser le paywall sur sa propre page ? Probablement oui (cf. §Pièges).

### Admin

**Idem visiteur**. Aucun bypass `role === "ADMIN"` dans le code. L'admin a son panel sur `/admin` mais s'il visite `/tipsters/:id` il voit la version Locked.
→ **À discuter** : bypass admin sur cette page ?

### Modale Upsell (post-paiement réussi)

Trigger : retour Stripe avec `checkout=success`, après poll.

```
Titre  : "Accès débloqué !" (hasAccess) | "Paiement en cours de traitement..." (timeout poll)
Body   : "Envie de découvrir d'autres experts ?" | "Vos sélections seront disponibles dans quelques instants."
CTA 1  : <Link href="/"> "Voir tous les experts"
CTA 2  : Si !hasAccess → "S'abonner ({monthly}€/mois)" → relance checkout MONTHLY
         Si hasAccess  → idem (relance MONTHLY pour upsell day-pass → monthly)
CTA 3  : "Fermer"
```

❗ **Bug latent** : le CTA 2 s'affiche toujours "S'abonner" même si l'user vient d'acheter un MONTHLY (il n'y a pas de filtre sur le type acheté). À vérifier côté backend pour la refonte.

---

## 5) LAYOUT V1

### Structure visuelle (top → bottom)

```
┌────────────────────────────────────────────────────────────┐
│ Container : max-w-4xl, px-4/6/8, pt-20, pb-32              │
│                                                            │
│ [Warning bar] (optionnel, vert #00D47E/5)                  │
│                                                            │
│ ┌─ Card identité (rounded-lg, bg-#0E0E0E, ring-#1A1A1A) ──┐│
│ │           ╭─────────────╮                               ││
│ │          ( Avatar 140px  )  ← overlap top -35px         ││
│ │           ╰─────────────╯                               ││
│ │                                                         ││
│ │              Pseudo (DM Serif italic 5xl)               ││
│ │           ─── EXPERT ───   (vert #00D47E, ALL CAPS)     ││
│ │                                                         ││
│ │               👁 X vues  (gris)                         ││
│ │                                                         ││
│ │           Bio (centré, gris)                            ││
│ │           Daily note (italique gris clair)              ││
│ │                                                         ││
│ │           [⚽ Football] [🎾 Tennis] [🏀 Basket]           ││
│ │           (chips gris)                                  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                            │
│   ═══ — • {N} sélections aujourd'hui • — ═══               │
│   (séparateur déco — points lumineux verts + lignes)       │
│                                                            │
│ ┌─ Liste analyses (1 card unique, lignes séparées) ───────┐│
│ │ [logo] Match name                       Cote: 2,15      ││
│ │        🎯 Pick solide · Début à 20h45                   ││
│ │        🔒 Prédiction verrouillée                        ││
│ │ ─────────────────────────────────────────────────────── ││
│ │ [logo] Match name 2                     Cote: 1,85      ││
│ │ ...                                                     ││
│ └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
[CTA STICKY BOTTOM] (uniquement si !hasAccess)
  ┌─ bg-#080808/95 backdrop-blur ─────────────────────────┐
  │ [Déverrouiller les N sélections (3,50€)] (vert)       │
  │ ou abonnement mensuel 29€ (lien gris)                 │
  └────────────────────────────────────────────────────────┘
```

**Footer** : pas de footer rendu sur cette page (la sticky CTA prend la place — `min-h-[calc(100vh-4rem)]` réserve la hauteur).

### Couleurs / classes V1 problématiques à migrer

| V1 (hardcodé) | Sémantique | → DS golden-da |
|---|---|---|
| `#00D47E` | Vert "primary" (badge EXPERT, CTA, ring warning, séparateur deco, dot, étoile featured) | `accent` (#dfb968) ou `accent-strong` (#e1aa36) |
| `#00F590` | Vert hover | `accent-strong` ou variante hover du token |
| `#F0EDE8` | Off-white texte principal | `foreground` (#ffffff) ou nouveau token off-white si nécessaire |
| `#8A8680` | Gris texte secondaire | `muted-foreground` (#898181) — quasi équivalent |
| `#0E0E0E` | BG card | `surface` (#131212) |
| `#1A1A1A` | Border / ring | `surface-elevated` (#181818) |
| `#141414` | BG chip / fallback avatar | `surface-elevated` (#181818) |
| `#080808` | BG sticky CTA | `background` (#000000) ou variante |
| `font-[family-name:var(--font-dm-serif)]` italic | Police titre | `font-display` (déjà DM Serif) — virer le `italic` (le DS ne l'utilise pas ailleurs) |
| `text-red-400` (erreur + match commencé) | Rouge erreur | À garder ou créer un token `destructive` cohérent |
| `tracking-[0.25em]` uppercase | Style badge EXPERT | Calquer le label EXPERT de la nouvelle Expert Card (DS — voir `expert-card.tsx`) |

### Spécificités responsive V1

- Container : `max-w-4xl` (= 896px, ≈ celui du Dashboard à 872px → **à uniformiser à 872px**).
- Avatar : 140px fixe (pas de variation mobile).
- Pseudo : `text-5xl sm:text-6xl` (48px / 60px) — pas de réduction mobile claire.
- Padding card : `px-6 sm:px-10` (24 / 40px).
- Cote : `text-3xl md:text-4xl` (mobile 30, desktop 36).
- Sticky CTA : `text-sm md:text-base`.

---

## 6) COMPOSANTS PARTAGÉS

### Composants réutilisables tels quels
- `<SportIcon>` (lib/sports-icons) — icônes sports, neutre niveau couleur.
- `<EmailCheckoutModal>` — fonctionne, juste à restyler aux tokens DS.
- `formatPrice()`, `formatStartTime()`, `isStarted()`, `allStarted()`, `getLeague()`, `getSportLabel()`, `TEASING_LABELS` — pure logic, on garde.

### Composants V1 internes (à refondre dans la nouvelle DA)
- `<PronoLine>` (déclaré ligne 419 dans la même page) — **équivalent fonctionnel d'une ligne d'analyse**, à refaire avec les tokens DS et le pattern visuel doré.
- `<BookmakerComparator>` (ligne 526) — **garder la fonctionnalité** (logo, cote, lien affilié), restyler.
- Header identité — à reconcevoir mais grandes lignes OK (avatar centré, pseudo, badge, vues, bio, sports chips).

### Composant nouveau qui ressemble ?

- `components/experts/expert-card.tsx` (homepage Expert Card golden-da) — **utilise déjà** les bons tokens (`accent`, `surface-elevated`, `font-display`, label EXPERT). On peut s'inspirer du **header identité** et de la **typo du pseudo / badge EXPERT** pour le profil. Mais c'est une CARD compacte de homepage, pas un layout pleine page → on ne réutilise pas le composant directement, on **réplique le style**.
- Pas d'équivalent V1 d'un layout "profil pleine page" dans le golden-da actuel.

---

## 7) ROUTES / NAVIGATION

### Entrées vers la page

- Click sur une `<ExpertCard>` (homepage) → `<Link href="/tipsters/${id}">` (cf. `expert-card.tsx:164`).
- URL UI publique `/experts/:id` → rewrite Next.js → `/tipsters/:id` (cf. `next.config.ts:19`).
- Retour Stripe Checkout → `/tipsters/:id?checkout=success&stripe_session_id=...`.

### Sorties depuis la page

- **Bouton CTA** → Stripe Checkout (externe).
- **`<Lock>` / verrouillage** → idem CTA via le sticky (pas de click sur la ligne).
- **Upsell modal `Voir tous les experts`** → `<Link href="/">`.
- **Lien affiliation bookmaker** (analyses déverrouillées) → URL externe `_blank`.
- **Navbar** (probablement présente dans le layout root) → home, /compte, /dashboard, etc.

### Pas d'entrées attendues mais utilisées
- **L'admin n'a pas de lien direct** depuis `/admin` vers la page publique d'un tipster (à vérifier — utile pour modérer).

---

## 8) STATS / MÉTRIQUES

### Compteur de vues interne
- **OUI** — `apiPost('/tipsters/:id/view', {})` lancé au mount (ligne 89-93).
- Protection contre double-trigger : `useRef(viewTracked)` empêche les ré-incréments dans la session courante.
- Backend incrémente `Tipster.viewsToday` ; reset par cron quotidien (cf. CLAUDE.md §6).
- Affichage côté UI : "X vues" si > 0.

### Analytics tiers
- **AUCUN** dans le frontend. Pas de Sentry, Plausible, PostHog, GA, gtag. (Confirmé par `grep -i "sentry|posthog|plausible|gtag|analytics"` qui ne ressort que `package-lock.json`.)
- Aucun event tracking custom non plus.

---

# SYNTHÈSE — 5 LIGNES

**Ce qu'il faut redesigner** :
1. Remplacer **toutes** les couleurs vertes hardcodées (`#00D47E`, `#00F590`) par les tokens `accent` / `accent-strong` dorés, plus l'off-white `#F0EDE8` → `foreground`, et les BG `#0E0E0E` / `#1A1A1A` → `surface` / `surface-elevated`.
2. Refaire le **header identité** (avatar + pseudo + badge EXPERT + vues + bio + sports chips) en cohérence visuelle avec l'`ExpertCard` du golden-da (label EXPERT en doré uppercase tracking-wider, fonte `font-display` sans italic).
3. Refaire la **liste d'analyses** (`PronoLine` + `BookmakerComparator`) : tokens DS, étoile featured en doré, blur du pick + cadenas en muted-foreground, garder l'opacity-50 sur les matchs commencés non-débloqués.
4. Refaire le **CTA sticky** : bouton principal en variant doré du DS, wording "Accéder" au lieu de "Déverrouiller" (cf. CLAUDE.md §1.1), garder le sous-CTA mensuel discret, garder le fallback "Toutes les analyses du jour sont terminées".
5. Refaire la **modale upsell** + restyler l'**`EmailCheckoutModal`** aux tokens DS (même problème de hardcoded `#00D47E` / `#F0EDE8`).

**Pièges potentiels** :
1. **Champ `teasing` ≠ texte teaser** — c'est un code enum (PICK_SOLIDE…) qui mappe vers un emoji+label court visible des deux côtés. Pas de "texte d'aperçu long" en DB. Si la nouvelle DA en demande un, c'est un changement de schéma.
2. **Le tipster connecté sur SA propre page voit la version Locked** — comportement V1 inchangé, à valider explicitement avec le client (probablement un bug UX à corriger, mais hors scope refonte visuelle).
3. **L'admin n'a pas de bypass paywall** sur les profils publics — idem ci-dessus.
4. **Le retour Stripe** repose sur un poll (5×2s) qui peut timeout (`showUpsell` s'affiche quand même avec un message "Paiement en cours de traitement") — à ne pas casser au refactor.
5. **`viewTracked.useRef` est session-scoped** — un user qui hard-refresh recompte une vue. Comportement V1 voulu mais à garder explicitement à l'esprit (un cleanup naïf de `useEffect` pourrait casser ça).
6. **Le wording "Déverrouiller"** est dans le bouton — à changer pour "Accéder" (CLAUDE.md §1.1), mais attention si des screenshots marketing / emails l'utilisent encore ailleurs (à grep dans `backend/` aussi).
7. **Container `max-w-4xl` (896px) vs Dashboard `max-w-[872px]`** — léger décalage. À uniformiser à 872px pour la cohérence cross-pages.
