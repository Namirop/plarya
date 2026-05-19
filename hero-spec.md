# Hero — Spec d'intégration (desktop)

> Source : Figma `vxkUD2k0gxROZEGZLlSFqb`, frame "1. Hero" (node `80:746`)
> Viewport de référence : **1440px**
> Référence DS : `design-system.md` §6 (Section eyebrow, Trust row item)
> Référence layout : `homepage-spec.md` §2
> Date d'extraction : 2026-05-19 (via MCP `get_design_context`)

---

## 0. Aperçu

Premier bloc de la homepage, sous le header. Composé de :

```
section.hero (relative, 1308 × 765)
├── Cadre (rect rounded-16, border subtile, w=1285 × h=619)
├── Image hero (visuel masqué, top-right, déborde du cadre par le haut)
└── Content (colonne gauche)
    ├── Eyebrow ("— PLATEFORME D'ANALYSES SPORTIVES")
    ├── H1 ("Accède aux meilleurs analystes.")
    ├── Subtitle ("Découvres des analyses...")
    ├── CTA "Découvrir les experts"
    └── Trust row (3 items + 2 dividers verticaux)
```

Ordre vertical mesuré (depuis le top du cadre à `y=102` dans la frame parente) :
- Eyebrow : `y=148`
- H1 : `y=201`
- Subtitle : `y=353`
- CTA : `y=461`
- Trust row : `y=580..661`
- Bas du cadre : `y=721`

Gaps verticaux :
- Eyebrow → H1 : **32px** (201-148 = 53, mais H1 baseline-top suggère ~32px effectif)
- H1 → Subtitle : **32px** (353 - (201+120 ≈ 2 lignes × 60lh) ≈ 32px)
- Subtitle → CTA : **48px** (461 - (353+60) ≈ 48)
- CTA → Trust row : **64px** (580 - (461+55) ≈ 64)

---

## 1. Conteneur Hero

| Propriété | Valeur |
|---|---|
| Frame node | `80:746` ("1. Hero") |
| Dimensions | `1308 × 765` |
| Background frame | aucun (la déco vient du `Cadre` enfant et du `Gradient Background` global de la page) |
| Position | absolute dans la page, `y = -44` (déborde au-dessus du header) |
| Padding horizontal interne | `~72px` à gauche/droite (entre la frame Hero 1308 et le cadre 1285 centré : (1308-1285)/2 ≈ 11.5, mais référence DS = 72px de marge depuis viewport 1440) |

### 1a. Cadre (rect décoratif backplate)

| Propriété | Valeur |
|---|---|
| Node | `80:782` ("Cadre") |
| Dimensions | `1285 × 619` |
| Background fill | **aucun fill** dans les données Figma (le cadre est uniquement un contour) — voir §Écarts |
| Border | `1px solid #181818` |
| Border-radius | `16px` |
| Box-shadow | aucune |
| Position | centré horizontalement, top du cadre à `y ≈ 102` dans la frame Hero |
| Padding interne (visuel) | contenu textuel décalé de **~59px** depuis le bord gauche du cadre (contenu à `x=131`, cadre à `x=72`) |

**Note** : le cadre crée le "rectangle premium" qui contient tout le contenu visuel du hero. C'est lui qui donne l'impression d'une carte/section délimitée.

---

## 2. Eyebrow — "— PLATEFORME D'ANALYSES SPORTIVES"

Pattern : `[trait horizontal 45px] [TEXTE UPPERCASE]`.

| Propriété | Valeur |
|---|---|
| Node | `80:747` (frame "Plateforme d'analyses sportives") |
| Position | `x = calc(10% − 13px)`, `top = 148` (texte) / `top = 158` (trait) |
| Trait — node | `80:748` (`Line 1`, exporté en image asset `imgLine1`) |
| Trait — dimensions | `45 × 1px` |
| Trait — couleur | `??` (asset image, non extractible des `variable_defs`) — `design-system.md` §6 indique "ligne dorée", `homepage-spec.md` ne précise pas |
| Trait — position verticale | centré verticalement sur la baseline du texte (top du trait à `y=158`, top du texte à `y=148` → trait à mi-hauteur du texte) |
| Texte — node | `80:749` |
| Texte — contenu | `PLATEFORME D'ANALYSES SPORTIVES` (verbatim Figma, apostrophe typographique `'`) |
| Texte — font-family | `Work Sans` |
| Texte — font-weight | `Regular` (400) |
| Texte — font-size | **`18px`** |
| Texte — line-height | `normal` |
| Texte — letter-spacing | `0` (pas de tracking custom Figma) |
| Texte — color | **`#898181`** (muted) |
| Texte — text-transform | majuscules (déjà capitalisé dans la string) |
| Gap trait → texte (horizontal) | **`~17px`** (trait s'arrête à `10%+32px`, texte commence à `10%+49px`) |

---

## 3. Titre H1 — "Accède aux meilleurs analystes."

Texte multi-ligne avec un seul mot en doré.

| Propriété | Valeur |
|---|---|
| Node | `80:750` |
| Position | `x = calc(10% − 13px)`, `top = 201` |
| Contenu (verbatim) | Ligne 1 : `Accède aux ` (espace final inclus dans le span) + `meilleurs` ; Ligne 2 : `analystes.` |
| Font-family | `DM Serif Display` |
| Font-style | `Regular` (italic = `not-italic`) |
| Font-weight | `400` |
| Font-size | **`64px`** |
| Line-height | **`60px`** (line-height plus serré que la taille — token `H1` du DS) |
| Letter-spacing | `0` |
| Color (par défaut) | `#FFFFFF` (blanc) |
| Color partie dorée | **`#DFB968`** (token `accent` du DS) appliqué uniquement sur le mot **"meilleurs"** |
| Word-break | `break-word` |
| Largeur du texte | s'étend naturellement (pas de `width` fixé, le `top=201` et 2 lignes à 60px → bas du H1 ≈ `y=321`) |

**Mise en gras dorée** : seul le mot `meilleurs` (5e mot, milieu de la phrase) est en `#DFB968`. Pas de gradient — couleur dorée plate du token `accent`.

---

## 4. Sous-titre — "Découvres des analyses..."

| Propriété | Valeur |
|---|---|
| Node | `80:751` |
| Position | `x = calc(10% − 13px)`, `top = 353` |
| Contenu (verbatim) | `Découvres des analyses et opinions exclusives dans les domaines qui t'intéressent.` |
| Font-family | `Work Sans` |
| Font-weight | **`Medium` (500)** |
| Font-size | **`20px`** |
| Line-height | **`1.5`** (= 30px à 20px) |
| Letter-spacing | `0` |
| Color | `#FFFFFF` (blanc) |
| Width | **`592px`** (texte sur ~2 lignes à cette largeur) |

**Note typo** : ce style (Work Sans Medium 20 / lh 1.5) **ne correspond à aucun token nommé du DS** (`design-system.md` §2). Le plus proche serait `H5` (Work Sans Medium 20 / lh `100`), mais le line-height ici est `1.5` (≈ 30px) — distinct du `H5` standard. Voir §Écarts.

---

## 5. Bouton CTA — "Découvrir les experts"

Bouton primary gradient or, identique au CTA "Découvrir les experts" listé dans `design-system.md` §6 Boutons → Primary.

| Propriété | Valeur |
|---|---|
| Node | `80:752` |
| Position | `x = calc(10% − 10px)`, `top = 461` |
| Layout interne | `flex items-center justify-center`, gap `16px` (texte ↔ flèche) |
| Padding | `16px` vertical / `32px` horizontal |
| Background | **`linear-gradient(to right, rgba(223,185,104,0.8) 0%, rgba(255,255,255,0.8) 100%)`** (token `Btn gradient`) |
| Border | **`1px solid #E1AA36`** (token `Golden Stroke`) |
| Border-radius | **`16px`** |
| Box-shadow | **`0px 0px 15px 0px rgba(255,174,0,0.7)`** (token `Shining Effect`) |
| Texte — contenu | `Découvrir les experts` |
| Texte — font-family | `Work Sans` |
| Texte — font-weight | `Medium` (500) |
| Texte — font-size | `20px` |
| Texte — line-height | `normal` |
| Texte — color | `#000000` (noir) |
| Flèche (chevron) — node | `94:881` (`Vector`) |
| Flèche — dimensions | `6 × 15.124` (rotée 90° → chevron orienté droite ≈ `15.124 × 6`) |
| Flèche — asset | image SVG (`imgVector`) |
| Flèche — couleur | `??` (asset image, non extractible — vraisemblablement noir vu le contraste sur fond doré) |

**Variant du DS** : ce CTA correspond à `Button variant="primary"` (gradient gold) — `design-system.md` §6 Boutons → Primary, déclinaison **20px/Medium** (la même typo que "Devenir créateur", pas la 16px/Regular de "Voir les analyses").

**Taille effective** : `homepage-spec.md` mentionne `304 × 55` (en incluant padding). Avec padding `16/32` et texte 20px Medium + gap 16 + flèche 15.124, la largeur intrinsèque est cohérente.

---

## 6. Trust row — 3 colonnes + 2 séparateurs verticaux

Layout horizontal sur 3 colonnes, séparées par des dividers verticaux.

### 6.0. Layout d'ensemble

| Propriété | Valeur |
|---|---|
| Node parent | `80:756` ("Content") |
| Position top | `y = 580` (top des icônes) |
| Hauteur totale | `~81px` (icônes à `y=580..616`, body texts à `y=628..660`) |

**Disposition des 3 colonnes** (calculé sur frame parent 1308) :
- Item 1 ("Analyses d'experts") : icône à `x = calc(10% − 3px)` ≈ `x=128`
- Divider 1 : à `x = calc(30% − 1px)` ≈ `x=391`
- Item 2 ("Contenu indépendant") : icône à `x = calc(30% + 47px)` ≈ `x=439`
- Divider 2 : à `x = calc(50% + 71px)` ≈ `x=725`
- Item 3 ("Paiement sécurisé") : icône à `x = calc(50% + 119px)` ≈ `x=773`

Largeur approximative par colonne : ~290px.

### 6.1. Layout d'un trust item

**⚠️ Layout HORIZONTAL** (icône à gauche, titre à droite de l'icône, body sous le titre) — **différent** de ce que `design-system.md` §6 décrit ("Layout vertical : icône → titre H5 → body 16"). Voir §Écarts.

```
[icon]  Titre H5
        Body 16 (multi-ligne)
```

| Propriété | Valeur |
|---|---|
| Gap icône → titre (horizontal) | **~9px** (icône `30px` à `10%-3`, titre à `10%+36` → gap = 36-(-3+30) = 9px) |
| Gap titre → body (vertical) | **~39px** (titre à `y=589`, body à `y=628`) |
| Body — width | `203px` (item 1) — texte multi-ligne à largeur fixe |

### 6.2. Item 1 — "Analyses d'experts"

| Élément | Valeur |
|---|---|
| Frame node | `80:757` |
| Icône — node | `80:760` (`solar:user-outline`, asset image `imgSolarUserOutline`) |
| Icône — dimensions | **`30 × 30`** |
| Icône — position | `x = calc(10% − 3px)`, `top = 586` |
| Icône — couleur | `??` (asset image, vraisemblablement blanc ou doré — non extractible) |
| Titre — node | `80:758` |
| Titre — contenu | `Analyses d'experts` (apostrophe typographique `'`) |
| Titre — typo | `Work Sans Medium 20 / lh normal` (= H5) |
| Titre — color | `#FFFFFF` |
| Titre — position | `x = calc(10% + 36px)`, `top = 589` |
| Body — node | `80:759` |
| Body — contenu | `Des créateurs passionnés partagent leurs insights.` (avec espace double final dans Figma) |
| Body — typo | `Work Sans Regular 16 / lh 16` (= Body 16) |
| Body — color | `#898181` (muted) |
| Body — position | `x = calc(10% + 36px)`, `top = 628`, width `203px` |

### 6.3. Item 2 — "Contenu indépendant"

| Élément | Valeur |
|---|---|
| Frame node | `80:762` |
| Icône — node | `80:765` (`stash:lock-opened`, asset image `imgStashLockOpened`) |
| Icône — dimensions | **`35 × 35`** ⚠️ (plus grande que les autres icônes) |
| Icône — position | `x = calc(30% + 47px)`, `top = 583` |
| Titre — node | `80:763` |
| Titre — contenu | `Contenu indépendant` |
| Titre — typo | `Work Sans Medium 20 / lh normal` (= H5), color `#FFFFFF` |
| Titre — position | `x = calc(30% + 98px)`, `top = 590` |
| Body — node | `80:764` |
| Body — contenu (2 lignes) | Ligne 1 : `Des opinions libres,` / Ligne 2 : `sans influence extérieure.` |
| Body — typo | `Work Sans Regular 16 / lh 16`, color `#898181` |
| Body — position | `x = calc(30% + 98px)`, `top = 629` |

### 6.4. Item 3 — "Paiement sécurisé"

| Élément | Valeur |
|---|---|
| Frame node | `80:768` |
| Icône — node | `80:771` (`f7:creditcard`, asset image `imgF7Creditcard`) |
| Icône — dimensions | **`30 × 30`** |
| Icône — position | `x = calc(50% + 119px)`, `top = 585` |
| Titre — node | `80:769` |
| Titre — contenu | `Paiement sécurisé` |
| Titre — typo | `Work Sans Medium 20 / lh normal` (= H5), color `#FFFFFF` |
| Titre — position | `x = calc(60% + 21px)`, `top = 588` |
| Body — node | `80:770` |
| Body — contenu (2 lignes) | Ligne 1 : `Accès simple et rapide` / Ligne 2 : `à chaque analyse.` |
| Body — typo | `Work Sans Regular 16 / lh 16`, color `#898181` |
| Body — position | `x = calc(60% + 21px)`, `top = 627` |

### 6.5. Dividers verticaux (entre les items)

Deux séparateurs verticaux identiques entre les trois colonnes.

| Propriété | Valeur |
|---|---|
| Nodes | `80:773` (entre item 1 et 2), `80:774` (entre item 2 et 3) |
| Dimensions | **`1px × 96px`** (déclaré comme `Divider` de 96px de large, roté 90° → trait vertical de 96px de haut) |
| Asset | image `imgDivider` (même asset pour les deux dividers) |
| Couleur | `??` (asset image — `design-system.md` §1 indique `#FFFFFF` à faible opacité pour les dividers de cards, à valider visuellement) |
| Position div 1 | `x = calc(30% − 1px)` ≈ `x=391`, centré verticalement à `top=580 + 48 = 628` |
| Position div 2 | `x = calc(50% + 71px)` ≈ `x=725`, centré verticalement à `top=580 + 48 = 628` |

---

## 7. Visuel / Image hero (top-right)

Image décorative qui déborde au-dessus du cadre, côté droit du hero.

| Propriété | Valeur |
|---|---|
| Frame parent — node | `80:775` ("Image") |
| Frame position | `x = calc(50% + 13px)`, `top = -44` (déborde au-dessus du cadre) |
| Image — node | `80:777` ("image_hero_section 1") |
| Image — dimensions affichées | **`624 × 624`** |
| Image — position interne | `x = calc(50% + 37px)`, `top = -40` |
| Image source (visuel) | asset `imgImageHeroSection2` (l'image effective rendue) |
| Image source (mask) | asset `imgImageHeroSection1` (forme du mask alpha) |
| Mask | `mask-image` alpha + `mask-intersect mask-no-clip mask-no-repeat`, `mask-size: 647px × 621px`, `mask-position: -24px -4px` |
| Effet visuel | crop circulaire avec **fade alpha doux** (le mask est une forme floutée non rectangulaire) — produit l'effet "silhouette d'analyste avec cards holographiques sur fond noir, fondu radial vers l'extérieur" |
| Object-fit | `cover` |
| Pointer-events | `none` (image décorative, non interactive) |
| Position dans le hero | top-right, déborde du cadre (cadre commence à `y=102`, image démarre à `y=-44` — soit ~146px au-dessus du cadre) |

**Visuel** : silhouette d'une personne de dos face à 2-3 cards/écrans flottants représentant des analyses (avec graphes), sur fond stade flou. Glow doré ambiant. Voir screenshot pour référence.

**Asset à fournir** : l'image hero finale (placeholder dans la maquette actuelle). 2 assets requis : (a) l'image rendue, (b) la forme du mask alpha (peut être un radial gradient SVG).

---

## 8. Écarts par rapport au DS et au homepage-spec

| # | Élément | Réf documentée | Figma réel | Action |
|---|---|---|---|---|
| 1 | **Eyebrow texte — font-size** | `design-system.md` §6 : `16px` | **`18px`** | Mettre à jour DS / homepage-spec |
| 2 | **Eyebrow texte — color** | `homepage-spec.md` §2 Tokens : `accent` (`#DFB968`, doré) | **`#898181`** (muted gris) | ⚠️ Important : la maquette finale a un eyebrow **gris muted, pas doré**. À confirmer avec la sœur (intentionnel ou erreur ?) — la mention "ligne dorée" du DS reste valable, mais seule la **ligne** est dorée, pas le texte. |
| 3 | **Subtitle — typo** | `homepage-spec.md` §2 Tokens : `Body 18` ou `H4` (à confirmer) | **`Work Sans Medium 20 / lh 1.5`** (≠ tous les tokens nommés du DS) | Le sous-titre n'utilise aucun token nommé. Soit ajouter un token (`subtitle-20`), soit reconfigurer le `H5` avec lh 1.5 pour ce cas. |
| 4 | **Trust row — layout** | `design-system.md` §6 Trust row item : `Layout vertical : icône → titre H5 → body 16` | **Layout horizontal** : `[icon] [title]` puis `body` sous le titre | ⚠️ Le DS décrit faussement un layout vertical. La maquette utilise un layout horizontal (icône à gauche, titre/body empilés à droite). À corriger dans le DS. |
| 5 | **Trust row — gap icône → titre** | `design-system.md` §6 : `~24px` | **~9px** (horizontal, pas vertical) | Le gap de 24px était basé sur l'hypothèse vertical. Le vrai gap horizontal est ~9px. |
| 6 | **Trust row — gap titre → body** | `design-system.md` §6 : `~12-16px` | **~39px** entre top-titre et top-body (= ~19px en gap "blanc" entre baseline titre et top body) | Plus aéré que le DS ne le décrit. |
| 7 | **Trust row — taille icône item 2** | `design-system.md` §6 : `(30 × 30)` (générique) | **`35 × 35`** pour `stash:lock-opened` (items 1 et 3 = `30 × 30`) | Inconsistance interne dans la maquette : 1 icône sur 3 est plus grande. À aligner (toutes à 30 ?) ou documenter comme exception. |
| 8 | **Cadre — background** | `homepage-spec.md` §2 Tokens : "custom (probable `bg-black/40` ou gradient — non confirmé)" | **Aucun fill explicite** dans les données Figma extraites — uniquement `border: 1px solid #181818` | Le cadre n'a **pas** de fond `bg-black/40`. Soit (a) le fond du hero entier est `bg-black/40` au niveau page (Gradient Background global), soit (b) le cadre est totalement transparent (juste un contour `#181818`). À clarifier visuellement avant intégration. |
| 9 | **Cadre — border color** | DS : `border-default — Pas de bordure neutre dans le DS` | **`1px solid #181818`** | Nouveau token de bordure neutre nécessaire (`border-subtle` = `#181818`). À ajouter au DS. |
| 10 | **Hero CTA — typo** | `design-system.md` §6 Primary : `"Voir les analyses" = WS Regular 16/16` ; `"Découvrir les experts" / "Devenir créateur" = WS Medium 20` | ✅ Confirmé : `WS Medium 20 / lh normal`, color `#000000` | OK — pas d'écart. |
| 11 | **Section eyebrow — espacement ligne ↔ texte** | `design-system.md` §6 : `~17px` | ✅ Confirmé : `~17px` (calcul `10%+49 - (10%-13+45) = 17`) | OK — pas d'écart. |
| 12 | **Hero — orthographe sous-titre** | n/a | `Découvres des analyses...` (verbatim) | ⚠️ Probable typo (devrait être `Découvre` à l'impératif 2e pers., ou `Découvrez` formel). À vérifier avec la sœur avant intégration — préserver verbatim pour l'instant. |

---

## 9. Assets à fournir

- `imgImageHeroSection2` : image de fond du visuel hero (silhouette + cards) — placeholder Figma actuel
- `imgImageHeroSection1` : forme du mask alpha (peut être SVG radial)
- `imgLine1` : trait 45px de l'eyebrow — recréable en CSS (`<span class="block h-px w-[45px] bg-accent" />`)
- `imgDivider` : trait vertical des dividers du trust row — recréable en CSS (`<span class="block w-px h-24 bg-white/10" />`)
- `imgSolarUserOutline`, `imgStashLockOpened`, `imgF7Creditcard` : icônes Iconify (récupérables via `@iconify/react`)
- `imgVector` : chevron du CTA — recréable en SVG inline

---

## 10. Récapitulatif compact des tokens utilisés

- **Couleurs** : `#FFFFFF` (texte primary), `#898181` (texte muted/eyebrow/body trust), `#DFB968` (mot "meilleurs" du H1), `#000000` (texte CTA), `#181818` (border cadre), `#E1AA36` (border CTA), `rgba(255,174,0,0.7)` (shadow CTA), gradient `rgba(223,185,104,0.8) → rgba(255,255,255,0.8)` (bg CTA)
- **Typo** :
  - H1 : DM Serif Display Regular 64 / 60
  - H5 (trust titles, "Découvrir les experts" CTA) : Work Sans Medium 20 / normal
  - Subtitle hero : Work Sans Medium 20 / 1.5 ⚠️ token non nommé
  - Eyebrow : Work Sans Regular 18 / normal ⚠️ DS dit 16
  - Body 16 (trust body) : Work Sans Regular 16 / 16
- **Radius** : `16px` (cadre, CTA)
- **Shadows** : `0 0 15px rgba(255,174,0,0.7)` (CTA)
- **Gaps verticaux internes** : 32 (eyebrow→H1), 32 (H1→subtitle), 48 (subtitle→CTA), 64 (CTA→trust), 39 (trust title→body)
- **Gaps horizontaux** : 17 (ligne eyebrow→texte), 9 (icône trust→titre), 16 (CTA texte→chevron)
