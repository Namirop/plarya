# Devenir Expert — Spec d'intégration (desktop)

> Source : Figma `vxkUD2k0gxROZEGZLlSFqb`, frame "3. Devenir Expert" (node `114:236`)
> Viewport : **1440px**, hauteur frame : **1397px**
> Référence DS : `design-system.md`
> Page V1 existante (logique métier à préserver) : `frontend/app/devenir-tipster/page.tsx`
> Date d'extraction : 2026-05-21

---

## ⚠️ Inventaire d'extractibilité

**À lire en premier — la maquette est très partielle.**

| Élément | Statut | Extractible ? |
|---|---|---|
| Background gradient (couleur + grain + 3 radial gradients) | ✅ Désigné nativement | Oui — identique pattern homepage |
| TopBar / Header | ✅ Désigné nativement (variant `connected`) | Oui — composant `<Header>` partagé déjà câblé |
| Titre "Devenir Expert" (H1) | ✅ Désigné nativement | Oui — DM Serif Display 48/60 blanc |
| Sous-titre / intro | ⚠️ **PLACEHOLDER** — texte perdu par la designer | Non — verbatim Figma : *"Phrase que j'ai perdu parce que j'ai crop ton screen et que j'ai fait 'Enregistrer' au lieu de 'enregistrer une copie'."* |
| Card englobante (872×860, `bg-black/40`, radius 16) | ✅ Désignée nativement | Oui |
| **Formulaire (champs, labels, chips, CTA)** | ❌ **SCREENSHOT PLAT** (`643×768`, asset `imgScreenshot`) | **Non — aucun champ extractible.** Image bitmap d'un rendu V1 |
| Divider décoratif bas de page | ✅ Désigné nativement (`114:276`, 402×6) | Oui — composant `<DecorativeDivider>` déjà existant |
| Footer | ❌ **Absent** de la frame | À reprendre du composant `<SiteFooter>` partagé |
| Disclaimer légal | ❌ **Absent** de la frame | À reprendre du composant `<Disclaimer>` partagé |
| États alternatifs (déjà tipster, checkout=success, checkout=cancel) | ❌ **Absents** de la frame | Conserver les vues V1 (logique préservée — cf. §10) |

---

## ⚠️ Contradictions Figma ↔ CLAUDE.md

La maquette Figma a été designée AVANT la mise à jour produit dans `CLAUDE.md §5 "PAGE DEVENIR EXPERT"`. Désaccords à arbitrer côté produit :

| Sujet | Figma (screenshot) | CLAUDE.md §5 |
|---|---|---|
| Modèle économique | Paiement automatique **39€/trimestre** (Stripe Checkout) | "Pas de paiement 39€/trimestre pour l'instant, on reste sur invitation" |
| Validation | Auto via paiement | Validation manuelle admin |
| Champs | Pseudo, Email, Bio, Sports couverts | Pseudo, Email, Bio, Sports, **Expérience / motivation (textarea)** ← absent du Figma |
| CTA submit | "Devenir Expert (39€/trimestre)" | Devrait être "Envoyer ma candidature" |
| Bloc prix "39€ / trimestre" | Présent (encart sombre au-dessus du CTA) | À supprimer |

→ **Décision à valider avec le client.** En attendant, le spec décrit la maquette Figma telle qu'elle est, mais l'implémentation devra probablement adapter ces points.

---

## Vue d'ensemble (top → bottom)

| Section | y_start | y_end | Hauteur | Statut |
|---|---|---|---|---|
| TopBar (header) | 0 | 70 | 70 | Natif |
| Titre "Devenir Expert" | 149 | 209 | 60 | Natif |
| Sous-titre/intro | 241 | 273 | 32 | ⚠️ Placeholder (texte perdu) |
| Card englobante formulaire | 337 | 1197 | 860 | Natif (card) + screenshot (contenu) |
| Divider décoratif | 1293 | 1299 | 6 | Natif |
| (fin de la frame) | | 1397 | | — |

---

## Layout général

- **Viewport** : 1440px
- **Container max-width** : **872px** (= largeur de la card)
- **Padding horizontal** : `(1440 − 872) / 2 = 284px` de chaque côté
- → Layout identique au Dashboard

---

## 1. Background

Gradient identique à la homepage (4 couches superposées) :

1. Couche base : `bg-[#131212]` plein
2. Image grain `cc77282f-8855-43d7-b16b-9cf703a84149` (mix-blend `overlay`, opacity 0.20, `object-cover`)
3. 3 radial gradients SVG inline (mix-blend `lighten`, opacity 0.10 chacun) — couleur centre `rgba(255,174,0,1)` → noir, positionnés différemment

→ **Déjà implémenté** dans `app/globals.css` (body::before pour le grain, body::after pour les radials). Aucune duplication à faire — la page hérite automatiquement.

---

## 2. Header / TopBar

```
TopBar (120:245) : x=-6, y=0, w=1440, h=70
├── bg: rgba(0,0,0,0.3) — voile noir 30%
├── padding: 8px vertical, 128px horizontal
├── flex items-center justify-between
├── Logo (120:246) : 152×54, image
└── Nav (120:247) : flex gap-64
    ├── "Dashboard" (Work Sans Regular 16/16 blanc)
    ├── "Mon Compte"
    └── "Déconnexion"
```

**Note :** la nav affiche le variant **`connected`** (utilisateur loggé). Cohérent avec le flow V1 qui exige une session pour accéder à `/devenir-tipster`.

→ Réutiliser le composant `<HeaderAuth />` partagé (auto-détecte l'auth via `useUser`).

---

## 3. Titre "Devenir Expert"

```
text (114:296) : x=284, y=149, w=321, h=60
```

| Propriété | Valeur |
|---|---|
| Famille | DM Serif Display Regular |
| Taille / line-height | 48 / 60 |
| Couleur | `#FFFFFF` |
| Whitespace | `whitespace-nowrap` |
| Padding-top depuis bas du header (70) | **79px** (probablement intendé 80) |

⚠️ **Taille = 48px**, **pas 64px** (H1 du DS). C'est plus petit que le H1 du Hero homepage. Pas de token DS dédié — utiliser `text-[48px] leading-[60px]` ou créer un token `text-h1-sub` / `text-page-title`.

---

## 4. Sous-titre / Intro

```
text (114:301) : x=283, y=241, w=635, h=32
```

| Propriété | Valeur |
|---|---|
| Famille | Work Sans Regular |
| Taille / line-height | 16 / 16 |
| Couleur | `#898181` (`muted-foreground`) |
| Largeur max | 635px (~2 lignes à 16px) |
| Word-break | `break-word` |
| Padding depuis le titre (`y=209 → y=241`) | **32px** |

⚠️ **Le verbatim Figma EST une note interne de la designer** (cf. §Inventaire). Le vrai texte est perdu.

**Texte à proposer** (à faire valider par le client — repris de l'identité de la card "Devenir créateur" en homepage) :
> "Rejoins Plarya en tant que créateur et monétise tes analyses auprès d'une communauté engagée."

---

## 5. Card englobante du formulaire

```
Content (114:302) : x=284, y=337, w=872, h=860
├── Rectangle 16 (114:299) : 872×860, rounded-2xl, bg rgba(0,0,0,0.4)
└── screenshot (114:294) : x=399, y=383, w=643, h=768 (image bitmap)
```

| Propriété | Valeur |
|---|---|
| Dimensions card | 872 × 860 |
| Background | `rgba(0,0,0,0.4)` (`bg-black/40`) |
| Border | aucune |
| Box-shadow | aucune |
| Border radius | 16px (`rounded-2xl`) |
| Padding-top interne (jusqu'au screenshot) | `383 − 337 = 46px` |
| Padding-bottom interne | `(337+860) − (383+768) = 46px` |
| Padding horizontal interne (jusqu'au screenshot) | `(872 − 643) / 2 = ~115px` |
| Gap intro → card top | `337 − 273 = 64px` |

→ Pattern visuel identique à la card "Pourquoi Plarya" de la homepage (même `bg-black/40` + `rounded-2xl`, pas de bordure).

⚠️ **Le screenshot prend 643px de large dans une card de 872px.** C'est étroit — la designer a laissé ~115px de padding horizontal. Pour l'implémentation native des champs, deux options :
- Reproduire fidèlement → champs à 643px de large
- Étendre les champs vers la largeur naturelle de la card → ~808px (= 872 − 2×32 padding standard)

À trancher visuellement quand la designer aura fourni un design natif du form. Par défaut, recommander **champs full-width dans la card** (= ~808px) avec padding interne 32px — plus aéré.

---

## 6. Formulaire (contenu du screenshot)

⚠️ **Aucun champ n'est extractible nativement de Figma.** Tout ce qui suit est lu sur le screenshot (image bitmap) — taille, couleur et police ne sont pas mesurables avec précision.

### 6.1 Champs visibles sur le screenshot (de haut en bas)

| # | Label | Type | Placeholder visible | Required |
|---|---|---|---|---|
| 1 | Pseudo | input text | `TonPseudo` | ✓ |
| 2 | Email | input email (disabled) | `user@test.com` | — (auto-rempli depuis la session) |
| 3 | Bio | textarea ~3 rows | `Expert Football & Tennis — Analyses pointues` | — |
| 4 | Sports couverts | grille de chips multi-select | — | ✓ |
| — | (bloc encart "39€/trimestre") | bloc info | — | — |
| 5 | (CTA submit) | bouton | "Devenir Expert (39€/trimestre)" | — |

### 6.2 Chips "Sports couverts"

Sports visibles sur le screenshot (4 par ligne, wrap) :
- Ligne 1 : Football, Tennis, Basketball, Rugby
- Ligne 2 : Hockey, MMA, Boxe, Esport
- Ligne 3 : Autre

Chaque chip : icône emoji/asset à gauche + texte. Style "inactif" (gris) sur le screenshot, donc état "actif" non visible.

⚠️ Le code V1 (`SPORT_LABELS` dans `lib/constants.ts`) est la source de vérité pour la liste réelle des sports.

### 6.3 Bloc prix "39€ / trimestre"

Visible en bas du formulaire, au-dessus du CTA :
- Encart sombre `rounded-md` avec ring
- Titre "39€ / trimestre"
- Sous-texte "Accès au dashboard expert, publication d'analyses, visibilité sur la plateforme. Renouvellement automatique tous les 3 mois."

→ ⚠️ À probablement **supprimer** côté implémentation (cf. §Contradictions).

### 6.4 Bouton submit

- Plein largeur (visible sur screenshot)
- Texte sombre sur fond clair (variant `white` du DS — équivalent du bouton "Accéder (3,50€)" de l'Expert Card)
- Label : "Devenir Expert (39€/trimestre)"

→ ⚠️ Si suppression du paiement (cf. §Contradictions) : label "Envoyer ma candidature".

### 6.5 Notes de la designer (frame "Notes Devenir Expert" `114:330`)

Verbatim repris de l'extraction précédente (non visibles dans l'extraction MCP courante mais documentés dans la spec antérieure) :
- "background du container black `#000000` opacité 40%" ✅ confirmé
- "espacements multiple de 8 (ex 16px, 24px, 32px)"
- "alonger les text fields vers la droite sur toute la longueur" → **champs full-width card**
- "alonger le bouton CTA vers la droite sur toute la longueur" → **CTA full-width card**

---

## 7. Divider décoratif

```
Divider (114:276) : x=519, y=1293, w=402, h=6
├── Line 2 (114:278) : trait horizontal gauche
├── Ellipse 1 (114:277) : point doré central (6×6)
└── Line 3 (114:279) : trait horizontal droit
```

| Propriété | Valeur |
|---|---|
| Largeur totale | 402px |
| Hauteur | 6px |
| Pattern | ligne — point doré — ligne (segments de 185px de chaque côté) |
| Position | centré horizontalement (519 = (1440-402)/2) |
| Padding depuis bas de card (1197) | **96px** |

→ Réutiliser le composant `<DecorativeDivider />` (déjà existant — utilisé en homepage).

⚠️ La frame Figma se termine ici (`h=1397`, divider à `y=1293-1299`, puis 98px de vide). **Aucun footer ni disclaimer designés dans cette frame.** À reprendre les composants partagés (cf. §10).

---

## 8. Spacing récap

| Token | Valeur | Calcul |
|---|---|---|
| Header → Titre | 79px | `149 − 70` (probablement 80 intendé) |
| Titre → Intro | 32px | `241 − 209` |
| Intro → Card form | 64px | `337 − 273` |
| Card form → Divider | 96px | `1293 − 1197` |
| Divider → bas de frame | 98px | `1397 − 1299` |
| Padding interne card vertical | 46px | top et bottom (probablement 48 intendé) |
| Padding interne card horizontal (jusqu'au screenshot) | ~115px | (à ignorer si champs full-width) |

---

## 9. Composants à réutiliser / créer

### Déjà existants (réutiliser)

- `<HeaderAuth>` — header connecté
- `<DecorativeDivider>` — divider bas de page
- `<SiteFooter>` — footer (absent du Figma, à brancher quand même)
- `<Disclaimer>` — texte légal (absent du Figma, à brancher quand même)
- Background : géré par `body::before` / `body::after` dans `globals.css` — la page hérite

### À créer / adapter

**Inputs DS** — pas définis dans le DS Figma. À designer côté code :
- `<Input>` text
- `<Input type="email">` disabled (pour le champ email auto-rempli)
- `<Textarea>` (3-4 rows)
- `<Label>` (Work Sans, couleur muted, gap label↔input ~8px)
- États : default, focus, error, disabled

→ Tokens probables : bordure `border-accent-strong/30`, focus `border-accent-strong`, bg `bg-black/40` (cohérent avec la card), text `text-foreground`, placeholder `text-muted-foreground/50`.

**Chip multi-select sport** — pas défini dans le DS Figma. À designer côté code :
- Pill `rounded-2xl` (DS = 16px partout)
- État inactif : `bg-transparent` + ring/border subtile + texte muted
- État actif : ring doré (`border-accent-strong`) + texte/icône doré + bg doré transparent (`bg-accent/10`)
- Icône sport à gauche (16-20px)
- Gap chips : 8px (`gap-2`)

**Submit button "Devenir Expert"** — variant `white` du DS (cf. design-system.md §6 Boutons "Accéder unlocked").
- Background `#FFFFFF`, texte `#000000`
- Width: full container
- Height: ~48-56px (à arbitrer)
- Disabled state pendant le submit : opacity 50%

---

## 10. Logique métier V1 à préserver

La page V1 (`frontend/app/devenir-tipster/page.tsx`) doit conserver ses comportements :

### États rendus
- **`loading`** : spinner centré pendant la résolution de la session
- **`!user`** (non connecté) : redirect immédiat vers `/` via `router.push("/")`
- **`user.role === "TIPSTER"`** (déjà expert) : message "Vous êtes déjà expert !" + lien vers `/dashboard`
- **`checkoutStatus === "success"`** : page "Bienvenue parmi les experts !" + lien dashboard
- **`checkoutStatus === "cancel"`** : "Paiement annulé" + bouton "Réessayer"
- **default** : le formulaire de la spec

→ ⚠️ **Aucun de ces états alternatifs n'est designé en Figma.** À styliser en respectant le DS doré, sur le même background. Pattern proposé : même H1 "Devenir Expert" + même card `bg-black/40` qui contient le message centré + CTA.

### Validation côté client (V1)
- Pseudo : trim, min 2 caractères
- Sports : au moins 1 sélectionné

### Submit (V1, à reconsidérer)
- V1 : `createTipsterCheckout(pseudo, bio, sports)` → redirige vers Stripe Checkout
- Nouveau (CLAUDE.md §5) : POST candidature → email admin → écran "Candidature envoyée"

### Email auto-rempli
- V1 : pris depuis `user.email` (toujours présent puisqu'on exige session)
- Champ disabled → cohérent avec le screenshot Figma qui montre "user@test.com" en placeholder grisé

---

## 11. À demander à la designer

1. **Texte d'intro réel** — actuellement remplacé par une note d'oubli ("Phrase que j'ai perdu...")
2. **Design natif du formulaire** — labels, inputs, chips, états focus/error/active. Aujourd'hui c'est un screenshot bitmap V1
3. **Design des 4 états alternatifs** non maquettés :
   - Déjà expert (`user.role === "TIPSTER"`)
   - Checkout success (si le modèle 39€ est conservé)
   - Checkout cancel (idem)
   - Candidature envoyée (si on passe au modèle "validation admin")
4. **Footer + disclaimer** pour cette page — absents de la frame (probablement OK de réutiliser ceux de la homepage, mais à confirmer)
5. **Arbitrage produit** : conserver paiement 39€/trimestre (Figma) ou passer à validation admin (CLAUDE.md) ? Impacte les champs (ajouter "Expérience / motivation"), le CTA, et toute la structure du bloc bas

---

## 12. Assets / images extraits

| Asset Figma | URL (expire dans 7j) | Usage |
|---|---|---|
| Background gradient | `https://www.figma.com/api/mcp/asset/cc77282f-8855-43d7-b16b-9cf703a84149` | Grain global (déjà téléchargé dans `frontend/public/background-grain.jpg`) |
| Screenshot formulaire | `https://www.figma.com/api/mcp/asset/84270c28-424c-41c5-abe9-cde258acfbef` | Référence visuelle uniquement, **pas à inclure en prod** |
| Logo | `https://www.figma.com/api/mcp/asset/3525f27a-e899-44b8-a0b8-9cd7381d12e3` | Logo Plarya (déjà dans `frontend/public/full-logo-remove.png`) |
| Divider | `https://www.figma.com/api/mcp/asset/04bf7492-3f86-4a56-976a-c538ed640a19` | Image du divider — préférer le rendu CSS via `<DecorativeDivider>` |

Screenshots de référence locale (à supprimer après implémentation) :
- `.figma-devenir-expert.png` (frame complète 1440×1397)
- `.figma-devenir-expert-form-screenshot.png` (zoom sur le form)
