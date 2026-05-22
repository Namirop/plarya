# Audit V1 — `LoginModal` (modale magic-link)

**Fichier audité** : `frontend/components/auth/login-modal.tsx` (117 lignes).
**Pas de dépendance shadcn Dialog** — wrapper custom `fixed inset-0`.
**Hook consommé** : `useUser().requestMagicLink` (cf. `frontend/hooks/use-user.tsx:48-50`) qui pointe sur `POST /auth/request-magic-link`.

---

## 1) STRUCTURE ACTUELLE

### Composants visibles

```
LoginModal (open=true)
├─ Overlay : bg-black/60 backdrop-blur-sm, click → handleClose
└─ Card centrée (max-w-md, bg #0E0E0E, ring #1A1A1A)
   ├─ X icon (top-right, svg inline 20×20) → handleClose
   ├─ Branche initiale (sent === false) :
   │   ├─ h3 : {title}  ← prop, défaut "Se connecter"
   │   ├─ p : {description}  ← prop, défaut "Entre ton email pour recevoir un lien de connexion."
   │   └─ <form>
   │       ├─ {error && <p text-red-400>}
   │       ├─ <input email> (autoFocus, autoComplete=email)
   │       ├─ <button submit> "Recevoir mon lien de connexion" / "Envoi..."
   │       └─ <button> "Annuler" (link texte sous le form)
   └─ Branche succès (sent === true) :
       ├─ h3 : "Vérifie ta boîte mail"
       ├─ p : "Un lien de connexion a été envoyé à <strong>{email}</strong>. Clique dessus pour te connecter."
       ├─ p (xs) : "Le lien expire dans 15 minutes."
       └─ <button> "Fermer" (CTA)
```

### États

| État | Trigger | UI |
|---|---|---|
| **`open=false`** | Parent passe `open={false}` | `if (!open) return null` — rien rendu |
| **Initial** | `open=true`, `sent=false`, `submitting=false`, `error=""` | Form vide, X close, bouton CTA actif |
| **En cours d'envoi** | `submitting=true` | Bouton CTA disabled, label "Envoi..." |
| **Erreur** | `setError("…")` non vide | `<p text-red-400>` au-dessus du champ. Email pré-rempli conservé. |
| **Email validation client** | Sur submit si `!email.trim() \|\| !email.includes("@")` | `setError("Email invalide")` immédiat, pas d'appel réseau |
| **Succès** | `sent=true` après `requestMagicLink` réussi | Branche succès affichée, email visible, bouton "Fermer" |

---

## 2) LOGIQUE

### Endpoint
- `useUser().requestMagicLink(email)` → wrapper qui appelle `apiPost("/auth/request-magic-link", { email })` (cf. `hooks/use-user.tsx:48-50`).
- Backend : `POST /auth/request-magic-link` dans `backend/src/routes/auth.ts:39` :
  - **Rate limit** : 5 demandes / IP / 15 min (`magicLinkRequestLimiter` ligne 18-22). Au-delà, renvoie `{ error: "Trop de demandes de connexion, réessayez dans quelques minutes" }`.
  - **Anti-leak** : renvoie **toujours** 200 + message générique "Si un compte existe avec cet email, un lien de connexion a été envoyé." → l'UI ne sait jamais si le compte existait. (Note : la création de l'user est faite côté `/auth/verify`, pas ici.)
  - Génère token + envoie email via Resend (`sendMagicLinkEmail` fire-and-forget).

### Gestion d'erreurs
- **Validation client** : email vide ou sans `@` → `setError("Email invalide")` avant tout réseau.
- **Erreur réseau / rate limit** : capture le `Error` thrown par `apiPost`, affiche `err.message` directement (donc l'utilisateur voit le message backend brut, p.ex. "Trop de demandes de connexion…").
- **Pas de cas d'erreur "email invalide format"** côté backend explicite — `magicLinkRequestSchema` valide (z.email) ; si échec, le `validate` middleware renvoie un 400 dont le message est propagé dans le `err.message`.

### Comportement après succès
- **La modale reste ouverte** sur la branche succès (`sent=true`) avec le message "Vérifie ta boîte mail".
- Le bouton "Fermer" est l'unique chemin de sortie côté UI succès → appelle `handleClose()` qui **reset tous les states** (`email=""`, `error=""`, `sent=false`) avant le `onClose()` du parent. Donc une réouverture future repart sur la branche initiale propre.

### Redirection post-login
- **PAS DANS LA MODALE elle-même**. La modale ne sait rien du moment où l'auth se finalise (qui se passe sur `/auth/verify` côté backend → cookie posé → re-fetch `/auth/me`).
- Mécanisme : `LoginModal` accepte une prop `redirectAfterLogin?: string`. Si fournie, **avant** l'appel API, elle stocke la destination dans `sessionStorage[POST_LOGIN_REDIRECT_KEY]` (ligne 52-54). Le `HeaderAuth` consomme cette clé quand `useUser` détecte la transition `user null → défini` (cf. `header-auth.tsx:28-34`) et appelle `router.push(target)`.
- La clé `POST_LOGIN_REDIRECT_KEY` est **exportée** par `login-modal.tsx:10` comme source unique de vérité.

---

## 3) STYLE V1

### Pas de shadcn Dialog
Wrapper custom : `<div className="fixed inset-0 z-50 ...">` + overlay + card centrée. Même pattern que `EmailCheckoutModal` (`components/checkout/email-checkout-modal.tsx`) et la modale upsell inline. **Déjà refondues au DS sur les autres modales → recettes de classes prêtes à réutiliser.**

### Classes hardcodées V1 (à migrer)

| V1 | Sémantique | → DS golden-da |
|---|---|---|
| `bg-black/60 backdrop-blur-sm` | Overlay | `bg-black/80 backdrop-blur-md` (pattern Bloc 2) |
| `bg-[#0E0E0E]` | BG card | `bg-background` (#000) |
| `ring-1 ring-[#1A1A1A]` | Bordure card | `border border-surface-elevated` |
| `rounded-lg` (8px) | Radius card | `rounded-2xl` (16px DS) |
| `text-[#8A8680]` | Muted (description, expiry note, "Annuler") | `text-muted-foreground` |
| `text-[#F0EDE8]` | Foreground (titres, input text, email strong, btn text-on-light) | `text-foreground` |
| `bg-[#080808] ring-[#1A1A1A]` | Input bg + ring | `bg-black/40` + `border border-surface-elevated` |
| `focus:ring-[#00D47E]/50` | Focus input vert | `focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30` |
| `bg-[#F0EDE8] text-[#080808] hover:bg-[#00D47E]` | Bouton CTA (Recevoir / Fermer) | `<Button variant="primary" />` (gradient doré + glow) |
| `text-red-400` | Erreur | `text-destructive` |
| `placeholder:text-[#8A8680]/40` | Placeholder | `placeholder:text-muted-foreground/50` (pattern Bloc 2) |
| `text-xl font-bold` | Titre h3 | `font-display text-h4` (24px) |
| `text-sm font-bold` (boutons) | Label CTA | `font-body text-body-16` (via Button DS) |
| `text-sm` (descriptions/erreur) | Texte sous-titre | `font-body text-body-16` |
| `text-xs` (expiry note) | Texte court | `font-body text-body-16` (le DS n'a pas de token plus petit que body-16 ; à voir si on garde xs Tailwind ou si on utilise body-16 avec opacity) |
| `<svg>` inline X (20×20 stroke 2) | Icône fermeture | `<X className="size-5" />` lucide-react (pattern Bloc 2) |

**Total ~20 occurrences hardcodées** sur ce fichier.

---

## 4) WORDING

### Wording par défaut (props)
- **`title`** : `"Se connecter"`
- **`description`** : `"Entre ton email pour recevoir un lien de connexion."`

### Wording fixe (non-configurable)
- **Placeholder input** : `"ton@email.com"`
- **Erreur validation client** : `"Email invalide"`
- **Bouton submit (initial)** : `"Recevoir mon lien de connexion"`
- **Bouton submit (loading)** : `"Envoi..."`
- **Bouton "Annuler"** (sous le form) : `"Annuler"`
- **Bouton X close** : pas de label texte (svg seul, **pas d'`aria-label` V1** → accessibilité à améliorer)

### Wording branche succès
- **Titre** : `"Vérifie ta boîte mail"`
- **Sous-titre** : `Un lien de connexion a été envoyé à {email}. Clique dessus pour te connecter.` (avec `{email}` en `<strong>`)
- **Note expiry** : `"Le lien expire dans 15 minutes."`
- **Bouton CTA** : `"Fermer"`

### Wording contextuel (consommateurs)
- **Default** (HeaderAuth) : aucun override → titres défaut "Se connecter" / "Entre ton email…".
- **DevenirCreateurSection** : override → 
  - title = `"Connecte-toi pour devenir créateur"`
  - description = `"Entre ton email — on t'envoie un lien de connexion, puis tu accèdes au formulaire de candidature."`
  - redirectAfterLogin = `/devenir-tipster`

---

## 5) USAGES

### Lieux d'invocation (grep `LoginModal`)

| Fichier | Trigger | Props |
|---|---|---|
| `components/layout/header-auth.tsx:49` | Bouton "Se connecter" du Header (variant guest) | `open={loginOpen}`, `onClose={...}`, **aucun override** (title/description/redirect défauts) |
| `components/home/devenir-createur-section.tsx:75-81` | Bouton "Devenir créateur" cliqué par un visiteur non connecté | `title`, `description`, `redirectAfterLogin="/devenir-tipster"` |

**Donc 2 usages distincts** : un "sign-in générique" et un "sign-in contextuel pour devenir créateur". Le mécanisme de contextualisation est `props title/description/redirectAfterLogin`. Architecturalement propre — pas de duplication.

### Système de message contextuel
- Pas de système global ("toast", "context provider", etc.).
- Pas de variant prop — chaque consommateur passe son propre wording si besoin.
- Si on veut ajouter d'autres contextes (p.ex. "Connecte-toi pour acheter une analyse"), c'est trivialement extensible avec les props existantes.

---

## 6) PIÈGES POTENTIELS

1. **`POST_LOGIN_REDIRECT_KEY`** : la clé sessionStorage est posée **avant** l'appel API (ligne 52-54), pas après. Conséquence : si le user ferme l'onglet entre l'envoi et le clic sur le mail, et qu'il clique le lien magic-link depuis le **même navigateur** (même origin), la redirection POST-login peut tomber juste. Mais s'il ouvre depuis un autre device, la clé est perdue → retour `/` par défaut.
   → Ne pas perdre ce timing au refactor (déplacer le `setItem` après le `await` casserait le cas le plus simple où l'user reste sur l'onglet).

2. **`handleClose` reset les states** : `email=""`, `error=""`, `sent=false`. C'est volontaire pour qu'une réouverture parte propre. À conserver tel quel.

3. **Focus management** :
   - `autoFocus` sur l'input email à l'ouverture → ✅ OK.
   - **Pas de focus trap** : Tab peut sortir vers le contenu derrière l'overlay (qui est en `pointer-events: auto` mais `z-50` overlay devant). En pratique pas critique car le bg backdrop bloque les clics, mais le clavier passe à travers. À envisager pour l'accessibilité.
   - **Pas de gestion `Escape`** : la touche Escape ne ferme PAS la modale. Seul X et clic overlay le font.
   - **Pas d'`aria-modal` / `role="dialog"`** sur le wrapper — manque-t-aria, à ajouter (pattern Bloc 2 déjà appliqué sur EmailCheckoutModal).

4. **Clic en dehors** : `onClick={handleClose}` sur l'overlay → ferme. Comportement V1 conservé. Cohérent avec EmailCheckoutModal (Bloc 2). Diverge de la modale upsell inline qui n'a pas de close par overlay (volontairement — pour ne pas casser le flow post-Stripe).

5. **`Suspense` parent** : la modale est rendue dans des composants client (`HeaderAuth`, `DevenirCreateurSection`) — pas de problème SSR/Suspense particulier. Pas d'`useSearchParams` ici → pas besoin de Suspense boundary.

6. **Rate limit côté backend** : 5/15min/IP. Si l'user spam le bouton, la 6ᵉ tentative renvoie un message backend brut "Trop de demandes de connexion…". L'UI l'affiche tel quel via `setError(err.message)`. Comportement OK, juste à savoir.

7. **Anti-leak backend** : le backend renvoie toujours 200, même si l'email n'existe pas. La modale affiche systématiquement "Vérifie ta boîte mail". Donc impossible de distinguer "compte existant" vs "nouveau". C'est volontaire (anti-énumération d'emails).

8. **`Modal scroll lock` absent** : si l'utilisateur scrolle pendant que la modale est ouverte, le contenu de fond bouge (le `fixed inset-0` est sur l'overlay, pas un `position: fixed` sur le body). Pas critique mais perfectible si on veut polir.

9. **`<input>` natif (pas le composant DS)** : V1 utilise un `<input>` HTML brut avec classes hardcodées. Au refactor, soit on utilise le composant DS `<Input>` (mais il a son propre styling shadcn par défaut), soit on factorise le `fieldCls` partagé déjà utilisé sur `/devenir-tipster` et `EmailCheckoutModal`. **Recommandation : réutiliser `fieldCls`** (déjà 3× cohérent dans le repo).

---

# SYNTHÈSE — 5 LIGNES

**Ce qu'il faut redesigner** :
1. Migrer overlay (`bg-black/60` → `bg-black/80 backdrop-blur-md`), card (`bg-[#0E0E0E] rounded-lg ring-[#1A1A1A]` → `bg-background border border-surface-elevated rounded-2xl`), et padding (cohérent `p-8`) — pattern strict des modales du Bloc 2.
2. Titres en `font-display text-h4`, sous-titres / messages en `font-body text-body-16 text-muted-foreground`, X close en `<X className="size-5" />` lucide-react avec `aria-label="Fermer"`.
3. Input → réutiliser le `fieldCls` partagé `/devenir-tipster` (rounded-xl, focus accent). Erreur en `text-destructive`. Pas de wording à toucher (titre/description sont des props, défauts conservés).
4. Boutons "Recevoir mon lien de connexion" et "Fermer" → `<Button variant="primary" size="lg" />` du DS (gradient doré + glow). Bouton "Annuler" → simple lien texte muted.
5. Ajouter `role="dialog" aria-modal="true" aria-labelledby` (accessibilité, déjà fait sur les autres modales du Bloc 2).

**Pièges potentiels** :
1. **`POST_LOGIN_REDIRECT_KEY` posé avant l'API call** (ligne 52-54) — préserver ce timing au refactor (sinon le redirect post-login se casse pour le cas même-onglet).
2. **`handleClose` reset complet des states** (`email`, `error`, `sent`) — conserver pour qu'une réouverture parte propre.
3. **Wording configurable via props** (`title`, `description`, `redirectAfterLogin`) — ne pas hardcoder les défauts, les 2 consommateurs (HeaderAuth + DevenirCreateurSection) en dépendent.
4. **Anti-leak backend** : la branche succès s'affiche **toujours** (le backend renvoie 200 même pour un email inexistant). Le wording "Vérifie ta boîte mail" doit rester volontairement non-engageant sur l'existence du compte.
5. **Pas de focus trap ni d'Escape** en V1 — à ajouter pour l'accessibilité, mais ne pas en faire un blocker du refactor visuel (peut être un follow-up).
