# Audit V1 — page `/admin` (panel Admin)

**Fichiers audités** :
- `frontend/app/admin/page.tsx` (670 lignes)
- `frontend/app/admin/loading.tsx` (8 lignes — utilise encore un token LEGACY `border-or-principal`)
- `backend/src/routes/admin.ts` (13 routes — cf. §2 & §3)

**Pas de sous-routes Next.js** : `/admin` est une page unique avec des onglets internes (tabs piloté par `useState`). Aucune route `/admin/users`, `/admin/tipsters`, etc.

---

## 1) VUES / SECTIONS PRINCIPALES

Une page unique avec **6 onglets** (tab bar `border-b` en haut) + une action globale "Envoyer emails J+1" en header.

| Tab key | Label affiché | Composant interne | But |
|---|---|---|---|
| `revenus` | Revenus | `<RevenueSection>` | KPIs globaux + graphique CA 30 jours + CSV export |
| `ventes` | Ventes | `<SalesSection>` | Liste détaillée des ventes (50 dernières) |
| `par-expert` | Par expert | `<ByTipsterSection>` | CA par tipster + part expert (70%) / plateforme (30%) — pour le reversement manuel |
| `tipsters` | Experts | `<TipstersSection>` | Liste experts + ordre d'affichage homepage (input numérique) + message d'avertissement |
| `pronos` | Analyses | `<PronosSection>` | Liste analyses + override résultat WON/LOST |
| `users` | Users | `<UsersSection>` | Liste users (lecture seule, role + nb subscriptions) |

**Pas de navigation interne (sidebar) ni de sub-routes.** Le state `tab` est local et perdu au refresh page (retour sur "revenus").

**Action globale top-right** : bouton "Envoyer emails J+1" → `POST /admin/send-daily-emails` (déclenche manuellement le cron des notifications de gains).

---

## 2) DONNÉES AFFICHÉES PAR SECTION

### Fetch initial — `fetchAll()` (lignes 106-120)
**6 endpoints fetchés en `Promise.all`** au mount :

| Endpoint | Variable state | Shape |
|---|---|---|
| `GET /admin/stats` | `stats` | `{ usersCount, tipstersCount, pronosCount, activeSubscriptionsCount, estimatedRevenueCents }` |
| `GET /admin/stats/revenue` | `revenueDays[]` | `{ date, revenue, salesCount }[]` — 30 derniers jours |
| `GET /admin/stats/sales?limit=50` | `sales[]` + `salesTotal` | `{ id, date, email, tipsterPseudo, type, amount }[]` + count global |
| `GET /admin/stats/by-tipster` | `tipsterRevenue[]` | `{ tipsterId, pseudo, salesCount, totalRevenue, tipsterShare }[]` |
| `GET /admin/tipsters` | `tipsters[]` | `{ id, pseudo, sports[], subStatus, displayOrder, warningMessage, createdAt, user.email, _count: { pronos, subscriptions } }[]` |
| `GET /admin/pronos` | `pronos[]` | `{ id, matchName, league, odds, teasing, result, createdAt, tipster.pseudo }[]` |
| `GET /admin/users` | `users[]` | `{ id, email, role, createdAt, _count.subscriptions }[]` |

**Pas de pagination côté frontend** : tout est récupéré d'un coup (la limite 50 sur `sales` est posée côté URL).

### Section Revenus — données dérivées
- `currentMonthDays` : filter `revenueDays` sur mois courant.
- `monthRevenue`, `monthSales` : agrégats locaux.
- `totalRevenue` : sum sur 30 jours.
- `maxRevenue` : pour normaliser la hauteur des barres du chart.
- `StatCard` × 4 : CA total 30j / CA ce mois / Ventes ce mois / Abonnements actifs.

### Section Ventes
- Tableau desktop (`hidden sm:block`) : Date / Email / Expert / Type / Montant.
- Cards mobile (`sm:hidden`) : layout vertical avec mêmes infos.
- Badge `type` : "Day Pass" (gris) ou "Mensuel" (vert #00D47E).

### Section Par expert
- Tableau / cards : Expert / Ventes / CA total / Part expert 70% (en vert) / Part plateforme 30%.

### Section Tipsters
- **Sous-bloc 1 "Ordre d'affichage homepage"** : table avec input `<input type="number">` éditable + bouton "Enregistrer" par ligne.
- **Sous-bloc 2 "Liste des experts"** : table avec Pseudo / Email / Analyses / Abonnés / Statut / Avertissement.
- Statut `subStatus` : ACTIVE (emerald), FREE (gris), autres (red).
- Avertissement : édition inline via `<Textarea>` shadcn + boutons OK / Annuler.

### Section Pronos
- Table : Match / Expert / Cote / Résultat / Date / Actions.
- Actions : 2 boutons "Gagné" (emerald) / "Perdu" (gris) — `onClick` direct sans confirmation.

### Section Users
- Read-only. Email / Rôle (badge ADMIN/TIPSTER/USER) / Abonnements / Inscrit le.
- **Aucune action** disponible (pas de promote, pas de delete, pas d'envoi magic-link, etc.).

---

## 3) ACTIONS DISPONIBLES (par section)

### Header global
| Action | Endpoint | Confirmation | Feedback |
|---|---|---|---|
| Envoyer emails J+1 | `POST /admin/send-daily-emails` | ❌ Aucune | Label du bouton change : "Envoi..." → "Emails J+1 envoyés !" (3s puis reset) |

### Revenus
| Action | Endpoint | Confirmation | Feedback |
|---|---|---|---|
| Export CSV ventes du mois | `GET /admin/stats/export.csv` (renvoie blob CSV) | ❌ | Téléchargement direct via `URL.createObjectURL` + `<a>` programmatique |

### Tipsters
| Action | Endpoint | Confirmation | Feedback |
|---|---|---|---|
| Modifier `displayOrder` | `PATCH /admin/tipsters/:id/display-order { displayOrder }` | ❌ | Mention "Mis à jour" (vert) 2s après PATCH |
| Modifier `warningMessage` | `PATCH /admin/tipsters/:id/warning { warningMessage }` | ❌ | Réinitialise l'éditeur, `onUpdate()` re-fetch tout |
| Effacer `warningMessage` | `PATCH /admin/tipsters/:id/warning { warningMessage: null }` | ❌ (passer textarea vide) | idem |

### Pronos
| Action | Endpoint | Confirmation | Feedback |
|---|---|---|---|
| Override résultat WON | `PATCH /admin/pronos/:id/result { result: "WON" }` | ❌ **AUCUNE** | State optimiste local (`prev.map`), pas de re-fetch |
| Override résultat LOST | idem `{ result: "LOST" }` | ❌ **AUCUNE** | idem |
| Bouton désactivé si déjà dans cet état | — | — | `disabled` |

### Users
**Aucune action.** Read-only.

### Endpoints backend dispos mais NON exposés dans le frontend V1
| Endpoint | Pourrait servir à |
|---|---|
| `POST /admin/tipsters` (cf. `admin.ts:53-83`) | Créer un compte tipster (email + pseudo + bio + sports) — utile pour la validation manuelle de candidatures (cf. §4) |
| Aucun `DELETE /admin/...` | **Pas de suppression possible** depuis le backend (ni user ni tipster ni prono) |

---

## 4) GESTION DES CANDIDATURES TIPSTER

### ❌ AUCUNE UI candidature

- Pas de tab "Candidatures" dans le panel admin V1.
- Aucun fichier ne mentionne `TipsterApplication` ou similaire (grep "candidature" : 0 résultat dans `backend/`, juste mentions dans CLAUDE.md spec et /devenir-tipster page).
- Pas de table dédiée en DB (Prisma schema → pas de `TipsterApplication` model).

### Flow actuel V1 — paiement Stripe
- Le visiteur clique "Devenir créateur" → `/devenir-tipster` → formulaire pseudo/bio/sports → Stripe Checkout 39€/trimestre → webhook Stripe crée l'user `TIPSTER` + le tipster directement (cf. `backend/src/routes/webhooks.ts`).
- **Pas d'étape validation admin** dans ce flow V1.

### Flow visé par CLAUDE.md §5
- "Soumission → email envoyé à l'admin"
- "L'admin valide manuellement dans le panel admin"
- "Pas de paiement 39€/trimestre pour l'instant (à discuter avec le client, pour le MVP on reste sur invitation)"

→ **Trou produit** : la spec demande une validation admin manuelle, le V1 fait du Stripe auto. Si on veut câbler la validation admin, il faut :
1. Créer un modèle Prisma `TipsterApplication` (ou réutiliser le tipster créé en `PENDING`).
2. Ajouter une UI admin avec liste + bouton "Valider" / "Refuser".
3. Modifier le flow `/devenir-tipster` pour soumettre une candidature au lieu de payer.

→ **Pour la refonte visuelle DA** : on n'ajoute pas cette feature. On flag juste comme manquant.

---

## 5) GESTION DU COMPTE ADMIN

### ❌ AUCUNE UI compte admin

- L'admin **NE PEUT PAS** modifier son email depuis `/admin` (ni depuis nulle part d'ailleurs).
- L'admin **NE PEUT PAS** modifier son mot de passe (de toute façon il n'y en a pas — auth magic-link).
- `/compte` redirige les ADMIN vers `/admin` (cf. refonte /compte précédente).

### Trou à combler (cf. décision Romain)
> "l'admin doit gérer son compte depuis le dashboard admin"

→ **À ajouter dans une feature future** : section/onglet "Mon compte" dans `/admin` avec :
- Affichage email + role + date d'inscription.
- Bouton "Se déconnecter" (déjà dispo dans le Header, mais cohérent ici).
- Éventuellement bouton "Demander un changement d'email" qui envoie un magic-link à un nouvel email (non-trivial — magic-link infra).

→ **Pour la refonte visuelle DA** : on n'ajoute pas cette feature. On flag juste comme manquant.

---

## 6) STATS GLOBALES

### KPIs affichés en tab "Revenus"
- **CA total (30j)** : sum `revenueDays[].revenue`
- **CA ce mois** : sum filtré sur mois courant
- **Ventes ce mois** : count filtré
- **Abonnements actifs** : `stats.activeSubscriptionsCount` (backend)

### KPIs renvoyés par `/admin/stats` mais NON affichés
- `usersCount`, `tipstersCount`, `pronosCount`, `estimatedRevenueCents`

→ Le backend renvoie plus de stats que ce qui est affiché. Si on veut enrichir le panel revenus, c'est dispo gratis.

### Graphique CA par jour
- Bar chart "fait main" (pas de lib type Recharts/Chart.js) — 30 div empilées avec hauteur en `%` calculée localement, tooltip au hover (`group-hover:block`).
- Couleurs : barre du jour courant en `bg-[#00D47E]` (vert), autres en `bg-[#F0EDE8]/25` (off-white transparent).

→ Le chart est minimaliste mais fonctionne. Pour la refonte DA on garde la même approche (pas besoin d'introduire une lib graphique).

---

## 7) LAYOUT V1

### Structure visuelle

```
┌────────────────────────────────────────────────────────────────────┐
│ Container : max-w-6xl, px-4/6/8 py-8                               │
│                                                                    │
│ ┌─ Header row ─────────────────────────────────────────────────┐  │
│ │ <h1>Panel Admin</h1>       [Envoyer emails J+1]              │  │
│ │ DM Serif italic 3xl                                          │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌─ Tabs bar (border-b #1A1A1A) ───────────────────────────────┐  │
│ │ Revenus | Ventes | Par expert | Experts | Analyses | Users   │  │
│ │ (active : border-b-2 #00D47E + text #00D47E)                 │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌─ Tab content (switch sur state `tab`) ──────────────────────┐  │
│ │ ... content variable selon tab ...                           │  │
│ │ Tables desktop / cards mobile (responsive double-rendering)  │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Container** : `max-w-6xl` (1152px) — significativement plus large que les autres pages (`max-w-[872px]`) car les tableaux ont besoin de place.

**Pas de footer** (page interne).

**Responsive** : double-rendering `hidden sm:block` (table) / `space-y-3 sm:hidden` (cards mobile). Pas de table responsive horizontal-scrollable + collapse, c'est deux UI distinctes.

### Classes V1 problématiques à migrer

| V1 (hardcodé) | Sémantique | Occurrences | → DS golden-da |
|---|---|---|---|
| `#00D47E` | Vert primary (active tab, badges, bouton hover, barre chart aujourd'hui, part expert 70%, statut ACTIVE FREE) | ~25 | `accent` / `accent-strong` |
| `#F0EDE8` | Off-white texte (titre h1, table values, bouton bg, hover gris) | ~30 | `foreground` |
| `#8A8680` | Gris secondaire (labels table, descriptions, hover muted, badges FREE) | ~40 | `muted-foreground` |
| `#1A1A1A` | Border subtle (table borders, ring cards, ring inputs) | ~25 | `surface-elevated` / `border-surface-elevated` |
| `#0E0E0E` | BG card / table head | ~15 | `bg-black/40` |
| `#141414` | BG chip / badge default | ~5 | `bg-surface-elevated` |
| `#080808` | BG input + texte sur bouton clair | ~5 | `background` / `text-black` |
| `text-red-400` / `bg-red-400/15` | Erreur, warning, statut LOST | ~5 | `text-destructive` |
| `text-emerald-400` / `bg-emerald-400/15` | Success, statut WON, statut TIPSTER | ~10 | À garder ou créer token success — **alignement à demander** (couleur green DS ?) |
| `font-[family-name:var(--font-dm-serif)] italic` | h1 italique | 1 | `font-display` (sans italic) |
| `text-3xl`, `text-2xl font-bold`, `text-sm font-semibold` | Titres h1/h2/h3 | mixé | `font-display text-h3/h4/h5` selon hiérarchie |
| `text-[11px]`, `text-[10px]` | Petites tailles non-DS | ~15 | `text-body-16` ou créer un token "text-xs" DS |
| `loading.tsx` : `border-or-principal` | Loading spinner LEGACY | 1 | `border-t-accent` |

**Total ~165 occurrences hardcodées** sur ce fichier (le plus gros du repo en termes de migration).

---

## 8) COMPOSANTS UTILISÉS

### V1 importés
- `@/hooks/use-user`
- `@/lib/api` (apiGet, apiPost, apiPatch, **apiFetch** — pour l'export CSV blob)
- `@/components/ui/button` (shadcn Button — utilisé avec variant `outline` legacy, à migrer)
- `@/components/ui/textarea` (shadcn Textarea — pour message d'avertissement)
- `@/lib/constants` (formatPrice helper)
- `next/navigation` (useRouter)

### Sous-composants locaux (déclarés dans le fichier)
- `<RevenueSection>` (74 lignes)
- `<SalesSection>` (55 lignes)
- `<ByTipsterSection>` (45 lignes)
- `<TipstersSection>` (155 lignes — le plus gros)
- `<PronosSection>` (62 lignes)
- `<UsersSection>` (42 lignes)
- `<StatCard>` (réutilisé 4× dans RevenueSection)
- `<ResultBadge>` (PENDING/WON/LOST)
- `<RoleBadge>` (USER/TIPSTER/ADMIN)

→ **Refacto possible** : extraire les badges et StatCard dans `components/admin/` pour les rendre testables et réutilisables.

### PAS de libs externes
- Pas de TanStack Table (les tableaux sont du JSX vanilla).
- Pas de Recharts / Chart.js (le bar chart est fait main avec divs et %).
- Pas de Radix Dialog (pas de modal de confirmation dans tout le panel).

→ **Reste cohérent avec le DS golden-da** : peu de dépendances externes, JSX direct + Tailwind.

---

## 9) NAVIGATION ET CONTRÔLE D'ACCÈS

### Protection d'accès
```tsx
useEffect(() => {
  if (loading) return;
  if (!user || user.role !== "ADMIN") { router.replace("/"); return; }
  fetchAll();
}, [user, loading, router, fetchAll]);
```

→ **Redirect côté client** vers `/` si user pas ADMIN. Pendant le `loading` initial, on affiche le spinner. **Pas de SSR guard / middleware** pour cette page. Un non-admin qui tape `/admin` peut voir un flash du spinner, puis le bounce vers `/`.

→ **Sécurité réelle** : reposera sur le fait que `/admin/*` endpoints backend sont gated par `adminMiddleware` (à vérifier dans `backend/src/middleware/admin.ts` ou équivalent — pas grep dans cette audit).

### Entrée depuis le Header
- **Header connecté + role ADMIN** : lien "Admin" → `/admin` (cf. `header.tsx:48`, ligne unique de nav pour les admins).
- USER et TIPSTER n'ont aucun lien vers `/admin`.

### Sortie depuis la page
- Tabs internes (state local).
- Logo Header → `/`.
- Pas de lien direct vers d'autres pages depuis le contenu (l'admin doit re-cliquer le logo ou taper l'URL).

→ **Amélioration possible** : ajouter dans les tables des liens cliquables vers `/tipsters/[id]` ou `/users/[id]` pour navigation rapide. Pas critique.

---

## 10) PIÈGES POTENTIELS

1. **`Promise.all` initial sans fallback partiel** : si un seul des 7 endpoints fail, tout le state reste vide et le `try/catch` silencieux ne dit rien à l'admin. À envisager : afficher des sections en error individuellement.

2. **Pas de confirmation sur actions destructives ou critiques** :
   - Override résultat WON/LOST → impacte le winRate du tipster et potentiellement le payout. **Aucun "êtes-vous sûr ?"**.
   - PATCH warning → l'admin peut publier un avertissement sur un profil expert sans confirmation.
   - PATCH displayOrder → modifie l'ordre homepage sans confirmation.
   - **Recommandation refonte** : ajouter une modal de confirmation pour `override result` (action la plus impactante).

3. **Export CSV via `apiFetch` direct (pas `apiGet`)** : le CSV est un blob, pas du JSON. Le code utilise `apiFetch` brut (lignes 199-208). Si on refactor le wrapper API, attention à ne pas casser ce cas.

4. **`Send daily emails` est destructif côté Resend** : appuie sur ce bouton 2× → envoie 2× les emails J+1. Pas de debounce, pas de confirmation, pas de feedback "déjà envoyé aujourd'hui". À reconsidérer côté UX.

5. **State optimiste sur `handleOverrideResult`** : `setPronos(prev.map(...))` après PATCH réussi, mais **PAS de re-fetch des stats** → le winRate dans `/admin/tipsters` ne sera pas mis à jour tant qu'on ne refresh pas la page. Sur le Dashboard expert, les stats remontées par `/tipsters/me` seront cohérentes après refresh seulement.

6. **`fetchAll` rappelé après PATCH warning / displayOrder** : tout est re-fetché (7 requêtes). Pour une page d'admin c'est OK (faible fréquence d'action) mais ça génère du traffic inutile.

7. **`displayOrder` input type number** : le `parseInt(... || 0)` accepte les valeurs négatives. Pas grave (le tri SQL marche pareil) mais peut être confusant. À forcer `min={0}` n'empêche pas la saisie clavier des `-1`.

8. **Pas de pagination côté frontend** : si la DB grossit (10k users, 5k pronos), la page va devenir lente (fetch full + render full). Pour le MVP c'est OK ; pour la prod prévoir pagination/lazy-load.

9. **`adminMiddleware` côté backend** : à confirmer que toutes les routes `/admin/*` sont protégées. Si oui, la sécurité réelle est OK même si le frontend redirect est cosmétique. Si non, n'importe qui peut hitter les endpoints en bypassing le frontend → critique.

10. **Tab state perdu au refresh** : pas dans l'URL (`?tab=ventes`). Si l'admin partage un lien vers `/admin` à un collègue, il atterrira sur "revenus" même si l'envoyeur regardait "ventes". À envisager : sync `tab` avec `useSearchParams`.

11. **`loading.tsx` utilise un token LEGACY** (`border-or-principal`) : à migrer en `border-t-accent` au passage refonte.

12. **Pas de feedback erreur global** : les `catch { /* silent */ }` partout. Si un PATCH échoue, l'admin ne le voit pas → state local reste optimiste mais DB pas à jour. Vraiment problématique pour `handleOverrideResult` et `handleSaveOrder`.

---

# SYNTHÈSE — 5 LIGNES

**Ce qu'il faut redesigner** :
1. **Migrer ~165 occurrences hardcodées** (`#00D47E` → `accent`, `#F0EDE8` → `foreground`, `#8A8680` → `muted-foreground`, `#1A1A1A` → `surface-elevated`, `#0E0E0E` → `bg-black/40`, `text-red-400` → `text-destructive`). H1 sans italique, titres en `font-display`. Plus le `loading.tsx` qui utilise encore un token LEGACY (`border-or-principal` → `border-t-accent`).
2. Repenser la **tab bar** en pattern DS doré (active = `border-b-2 border-accent text-accent`, hover muted → foreground). Container reste à `max-w-6xl` (les tableaux ont besoin de l'espace).
3. **Cards + tables** : passer toutes les `ring-1 ring-[#1A1A1A] bg-[#0E0E0E]` en `border border-surface-elevated bg-black/40 rounded-2xl`. Aligner les badges (statut, type vente, résultat prono, rôle) sur le pattern pill DS (rounded-full px-3 py-1).
4. **`StatCard`** : à faire passer en pattern DS doré (réutilisable Dashboard expert qui a déjà une variante).
5. **Boutons** : remplacer les `<button>` natifs stylés par `<Button variant="primary" />` / `<Button variant="secondary" />` selon hiérarchie. Inputs (`displayOrder`, `warningMessage`) → réutiliser `fieldCls` partagé.

**Pièges potentiels** :
1. **Aucune confirmation sur actions destructives** (override résultat, warning, send emails J+1) — ajouter au minimum une `confirm()` ou modale DS sur `override result` et `send daily emails` (le plus à risque).
2. **`apiFetch` direct pour l'export CSV** (blob, pas JSON) — ne pas casser au refactor en croyant que c'est du `apiGet`.
3. **State optimiste sans re-fetch stats** — l'override d'un résultat ne met PAS à jour les stats `by-tipster` / le winRate. Si on veut une UI cohérente, déclencher un `fetchAll` complet après chaque PATCH critique (au lieu du state optimiste local seulement).
4. **`catch { /* silent */ }` partout** — pas de feedback erreur. À remplacer par un toast / banner global pour que l'admin sache si un PATCH a foiré.
5. **Trous produits flaggés** (NE PAS implémenter dans cette refonte DA, juste documentés ici) : (a) UI candidatures tipster manquante (CLAUDE.md §5), (b) gestion compte admin manquante (changement email), (c) aucun endpoint DELETE côté backend → suppression user/tipster impossible.
