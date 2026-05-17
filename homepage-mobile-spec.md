# Homepage mobile — Spec d'intégration

> Source : Figma `DFTjdH42nddqFyAtHQ6eac`, frame "1a. Mobile Homepage" (node `123:129`)
> Viewport : **393px**, hauteur frame : **2589px**
> Référence DS : `design-system.md`
> Date d'extraction : 2026-05-10
>
> ⚠️ **Maquette incomplète.** Le contenu visible s'arrête à y≈1743 (fin du carrousel "Explore les domaines"). Les sections `Nos Experts`, `Pourquoi Plarya`, `Devenir créateur`, `Disclaimer` et `Footer` ne sont **pas designées sur cette frame**. Pour ces sections en mobile, il faudra adapter la version desktop ou demander à ta sœur.
>
> ⚠️ **Limites d'extraction.** Sans `get_design_context` sur cette frame (rate-limit Figma), je n'ai accès qu'aux dimensions/positions. **Les font-sizes mobiles ne sont pas extractibles fiablement** depuis les hauteurs seules — les valeurs ci-dessous sont des estimations (✶) à valider visuellement.

---

## Vue d'ensemble (top → bottom)

| Section | y_start | y_end | Hauteur | Notes |
|---|---|---|---|---|
| Header (logo + burger) | 59 | ~105 | ~46 | |
| Hero image | 113 | 429 | 316 | Stack au-dessus du texte |
| Hero eyebrow | 141 | 160 | 19 | Overlap zone image |
| Hero H1 | 400 | 460 | 60 | Démarre légèrement avant la fin de l'image |
| Hero subtitle | 476 | 548 | 72 | 3 lignes |
| CTA "Découvrir les experts" | 612 | 663 | 51 | Plein largeur (325px) |
| CTA "Explorer les domaines" | 683 | 734 | 51 | Plein largeur |
| Feature card 1 "Analyse d'experts" | 841 | 975 | 134 | |
| Feature card 2 "Contenu indépendant" | 991 | 1125 | 134 | |
| Feature card 3 "Paiement sécurisé" | 1141 | 1275 | 134 | |
| Section title "Explore les domaines" | 1339 | ~1385 | 46 | |
| Domains carrousel horizontal | 1417 | ~1738 | 321 | Cards qui débordent à gauche/droite |
| Carrousel dots | 1743 | 1753 | 10 | |
| **(rien après y=1753 jusqu'à y=2589)** | | | | Maquette s'arrête ici |

---

## Layout général

- **Viewport** : 393px
- **Padding horizontal** : ~32px (mesuré 34px ± rounding Figma)
- **Largeur contenu** : 325px (= 393 − 32×2 = 329, valeur réelle 325)
- **Pas de container max-width** : tout prend la largeur de l'écran
- **Header** transparent au-dessus du gradient background

---

## 1. Header mobile

```
header (full-width, h≈70-80)
├── logo (128 × 46) à x=34
└── burger icon (20 × 13) à x=337 (top-right)
```

- Logo : 128 × 46 (plus petit que desktop 152 × 54)
- Icône burger menu : `iconamoon:menu-burger-horizontal` (16×16 dans la métadonnée, mais positionné à 20×13 sur la frame)
- ⚠️ Pas de nav text visible (Dashboard / Mon Compte / Déconnexion) — caché derrière le burger

---

## 2. Hero mobile

Layout vertical (différent du desktop qui est horizontal text+image) :

```
hero (vertical stack)
├── Image (329 × 316, x=32, rounded-2xl)
│   └── (eyebrow overlay sur l'image en haut, à x=32 y=141)
├── H1 "Accède aux meilleurs analystes." (321 × 60, x=36 y=400)
├── Subtitle "Découvres des analyses..." (321 × 72, x=36 y=476, ~3 lignes)
├── CTA1 "Découvrir les experts" (325 × 51, x=34 y=612, full-width)
└── CTA2 "Explorer les domaines" (323 × 51, x=36 y=683, full-width)
```

### Spacing
- Logo (y=59 ends ~105) → image (y=113) : ~8px
- Image (ends y=429) → H1 (y=400) : overlap de 29px (texte démarre avant fin image — pattern hero overlap fade)
- H1 (ends y=460) → subtitle (y=476) : 16px
- Subtitle (ends y=548) → CTA1 (y=612) : 64px
- CTA1 (ends y=663) → CTA2 (y=683) : 20px (≈16-24)
- CTA2 (ends y=734) → Feature card 1 (y=841) : 107px (≈96-112, à arrondir 96)

### Composants spécifiques mobile
- ⚠️ **Eyebrow** est positionné en overlay sur l'image (y=141 alors que l'image va de y=113 à y=429). Pas de ligne décorative visible (largeur w=297 ne contient que le texte).
- **CTA "Explorer les domaines"** est nouveau — n'existe pas en desktop. Probablement variant outline/secondary (à confirmer visuellement, non extractible depuis métadonnée).

### Tokens (estimations ✶ — à valider)
- H1 mobile : ✶ DM Serif Display, ~32-48px (h=60 sur une ligne, indéterminable précisément)
- Subtitle mobile : ✶ Work Sans Regular ~16-18px (h=72 sur 3 lignes)
- Eyebrow : ✶ Work Sans Regular 16px uppercase, accent (h=19, identique desktop)
- CTA texte : ✶ Work Sans 16-20px (h=19)
- Buttons : full-width 325 × 51, padding probable 16/16, radius 16

---

## 3. Trust cards (hero étendu)

3 cards stackées verticalement (au lieu d'une trust row horizontale comme desktop) :

```
card.trust (325 × 134, p=28-30 internal)
├── icon (30-35, en haut)
├── title H5 (Body Medium 20)
└── body (Body 16, 2 lignes)
```

| Card | Icône | y_start | y_end |
|---|---|---|---|
| "Analyses d'experts" | `solar:user-outline` (30×30) | 841 | 975 |
| "Contenu indépendant" | `stash:lock-opened` (35×35) | 991 | 1125 |
| "Paiement sécurisé" | `f7:creditcard` (30×30) | 1141 | 1275 |

### Spacing
- Gap entre cards : **16px**
- Padding interne card : ~28-30px top, ~30-42px gauche (estimé depuis x relative des enfants)
- Hauteur fixe : 134px

### Tokens
- Background card : probablement `bg-black/40` rounded-16 (à valider visuellement, non confirmé via métadonnée)
- Layout : icône top-left, puis text bloc à droite

⚠️ Différence avec desktop : sur desktop, ces 3 items sont **dans le hero** en row horizontale séparée par dividers verticaux. Sur mobile, ils sont **3 cards séparées** stackées en bloc indépendant.

---

## 4. Section "Explore les domaines" (mobile)

```
section.explore (mobile)
├── header-row (title + ligne décorative gauche)
└── carrousel horizontal des Domain cards (overflow-x scroll)
    ├── Hippique (251 × 289)  — partiellement visible à gauche
    ├── Sport (256 × 319)      — focus card
    ├── Esport (235 × 309)     — partiellement visible à droite
    └── ...
└── carrousel dots (36 × 10, centrés)
```

### Spacing
- Section title (y=1339 h=46) → carrousel (y=1417) : 32px
- Carrousel (y=1417 h=321) → dots (y=1743) : ~5px (les dots collent juste sous)

### Domain cards en mode carrousel
Hauteurs/largeurs **inégales** entre les 3 cards visibles (Hippique 251×289, Sport 256×319, Esport 235×309). Cela suggère :
- Soit un design "scaled" où la card centrale est plus grande (focus state)
- Soit un artefact de positionnement Figma (cards qui se chevauchent dans une carrousel snap)

→ À clarifier visuellement. Pour l'intégration, je recommanderais des cards de **256 × 319 uniformes** avec un mode carrousel snap horizontal et un fade sur les cards adjacentes.

### Tokens
- Section title : DM Serif Display ~24-28px (✶ h=33, plus petit que desktop H2 32px)
- Domain card titre "SPORT" : Work Sans Medium ~20-24px (✶ h=28, plus petit que desktop 32px)
- Domain card sous-titre : Work Sans Regular 16px (h=32 sur 2 lignes, identique desktop)
- Domain card bouton "Voir les analyses" : 220 × 51, plein-largeur de la card
- Carrousel dots : 36 × 10 (3 dots ?)

---

## Sections manquantes en mobile

À discuter avec ta sœur. Ces sections existent en desktop mais ne sont **pas designées sur la frame mobile** :
- Section "Nos Experts" (carrousel d'expert cards)
- Section "Pourquoi Plarya"
- Section "Devenir créateur" CTA card
- Divider décoratif + Disclaimer
- Footer

Hypothèses raisonnables pour l'intégration :
- Reprendre la même structure que desktop, en stack vertical avec padding-x 32px
- Cards Expert en carrousel horizontal (comme les Domain cards mobile)
- Pourquoi Plarya : 3 features stackées verticalement (comme les trust cards mobile)
- Devenir créateur : card pleine largeur avec texte au-dessus / bouton dessous (au lieu de horizontal)

→ **Ne pas designer ça sans confirmation**. Idéalement demander à ta sœur de compléter la frame mobile.

---

## Tokens spécifiques mobile à ajouter au DS

Si on confirme visuellement, à ajouter dans `design-system.md` § Typographie mobile :
- H1 mobile : `??/60` (font-size à confirmer)
- H2 mobile (section title) : `??` plus petit que desktop 32
- Domain card title mobile : `??` plus petit que desktop 32

→ **Aucun de ces tokens ne peut être extrait fiablement de la métadonnée seule**. À récupérer via `get_design_context` quand le quota Figma sera réinitialisé, ou en mesurant directement dans Figma.
