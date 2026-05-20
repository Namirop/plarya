# Section "Nos experts du jour" — Spec d'intégration (desktop)

> Source : Figma `vxkUD2k0gxROZEGZLlSFqb`, frame "3. Nos Experts" (node `94:848`)
> Viewport de référence : **1440px**
> Référence DS : `design-system.md` ; référence page : `homepage-spec.md §4`
> Date d'extraction : 2026-05-20

> ⚠️ **Note vocabulaire** : la maquette Figma intitule la section **"Nos experts"** (pas "Nos experts du jour" comme dans le brief). Au choix : suivre Figma (`Nos experts`) ou suivre le brief (`Nos experts du jour`). Cette spec garde le **wording Figma** pour le titre extrait, mais signale les deux options en §2.1.

---

## 0. Vue d'ensemble

Frame Figma `94:848` :
- Position dans la page : `x = 125`, `y = 1335`
- Dimensions : **`1175 × 617`**
- Bottom de la section : `y = 1952`

Sous-éléments (positions **relatives à la frame section**, sauf indication contraire) :

| Node | Nom | x | y | w | h |
|---|---|---|---|---|---|
| `87:223` | Header (titre + ligne + "Voir tous") | 0 | 22 | 1156.124 | 54 |
| `87:214` | Bloc titre "Nos experts" (texte + ligne) | 0 | 22 | 183 | 54 |
| `87:215` | Texte "Nos experts" | 16 | 27 | 167 | 44 |
| `87:216` | Ligne décorative `Line 4` (vector, image asset, vertical) | 0 | 22 (wrapper) | 0 (rot.) | 54 |
| `87:218` | Bloc "Voir tous les experts" (texte + chevron) | 944 | 39 | 212.124 | 18 |
| `87:219` | Texte "Voir tous les experts" | 944 | 39 | 181 | 18 |
| `94:885` | Chevron du lien | 1156.124 | 45 | 15.124 | 6 |
| `94:816` | Rangée carrousel `Expert Cards` (auto-layout flex-wrap) | 0 | 140 | **1336** | 422 |
| `94:619` | Expert Card Unlocked (1ʳᵉ) | 0 | 0 (dans `94:816`) | 322 | 422 |
| `119:13` | Expert Card Locked (2ᵉ) | 338 | 0 | 322 | 422 |
| `119:51` | Expert Card Locked (3ᵉ) | 676 | 0 | 322 | 422 |
| `119:88` | Expert Card Unlocked (4ᵉ) | 1014 | 0 | 322 | 422 |
| `94:821` | Next Btn (image asset) | 1038 | 182 (dans `94:816`) | 45 | 45 |
| `94:815` | Carrousel state (pagination, image asset) | 563 | 597 | 49 | 10 |

---

## 1. Conteneur de section

| Propriété | Valeur | Source |
|---|---|---|
| Largeur frame | **1175 px** | metadata `94:848` |
| Hauteur frame | **617 px** | metadata `94:848` |
| Background | **aucun** (transparent — hérite du gradient global de la page) | Pas de fill exposé par le MCP sur `94:848` |
| Padding horizontal interne | **0 px** (le contenu démarre à `x=0` côté gauche) | metadata |
| Padding horizontal vs viewport | gauche **125 px**, droite **140 px** (1440 − 125 − 1175 = 140) — même asymétrie que la section domaines | calcul |
| Padding-top interne (section top → header top) | **22 px** | header `87:223` à y=22 |
| Padding-bottom interne (carrousel state bottom → section bottom) | `617 − (597 + 10) = 10 px` | calcul |
| Gap vertical (depuis section précédente "Explore les domaines") | **97 px** ≈ **96 px** (Explore se termine à y=1238, cette section démarre à y=1335) | token DS `section-y-lg` |
| Gap vertical (vers section suivante "Pourquoi Plarya") | **64 px** (section se termine à y=1952, Pourquoi démarre à y=2016) | token DS `section-y` |

### Notes
- Section transparente, aucun fond propre.
- Asymétrie 125/140 reproduite (identique à la section domaines) ; à harmoniser en code via `max-w-content` centré.

---

## 2. Header de section

Structure identique à la section "Explore les domaines" : une ligne décorative verticale + le titre à gauche, et un lien "Voir tous" à droite.

### 2.1 Titre "Nos experts"

| Propriété | Valeur | Source |
|---|---|---|
| Texte | **"Nos experts"** (⚠️ pas "Nos experts du jour") | `87:215` |
| Font family | **DM Serif Display** | `get_variable_defs` (H2) |
| Font weight | **Regular (400)** | `get_variable_defs` |
| Font size | **32 px** | `get_variable_defs` (H2) |
| Line-height | **`normal`** (auto, ~100%) | code: `leading-[normal]` |
| Couleur | **`#FFFFFF`** | code: `text-white` |
| Letter-spacing | 0 | `get_variable_defs` |
| Position absolue (page) | `x = 141`, `y = 1362` | calcul (125+16, 1335+27) |
| Position relative à la section | `x = 16`, `y = 27` | metadata |
| Hauteur bbox | 44 px | metadata |
| Largeur bbox | 167 px | metadata |
| Token DS | `font-display text-h2 text-foreground` | `design-system.md §6 Section title` |

> ⚠️ Le brief utilise "Nos experts du jour". La maquette Figma livre "Nos experts" (plus court). Décision à prendre à l'intégration :
> - Suivre la maquette → "Nos experts"
> - Suivre le brief → "Nos experts du jour"
>
> Si on suit le brief, prévoir que le texte est ~50% plus long ; le layout flex-justify-between reste OK car il y a beaucoup d'espace libre (gap titre↔lien actuel ≈ 761 px).

### 2.2 Ligne décorative verticale

| Propriété | Valeur | Source |
|---|---|---|
| Type | Vector / image asset (`Line 4`, `imgLine4`) — **pas un solid fill exposé par le MCP** | code + metadata `87:216` |
| Orientation | **Verticale** (rotation `-90deg`) | code: `-rotate-90` + `w-[54px] h-0` |
| Longueur | **54 px** (vertical) | code |
| Épaisseur | **1 px** (~ `inset-[-1px_-1.85%]`) | code |
| Couleur | **`??`** non exposé par `get_variable_defs` (asset image) — visuellement doré. DS la documente comme `accent` (`#DFB968`) | DS §6 + screenshot |
| Position absolue (page) | `x = 125`, `y = 1357..1411` | calcul |
| Position relative à la section | `x = 0`, `y = 22..76` (54 px) | code wrapper |
| Position par rapport au titre | À **gauche** du titre. Gap horizontal ligne↔texte = `16 − 0 = 16 px`. Ligne y=22..76, titre y=27..71 → ligne 5 px au-dessus du texte et 5 px en dessous, parfaitement centrée. | calcul |
| Token DS | `accent` (`#DFB968`) — déduit, non confirmé par MCP | DS §6 |

### 2.3 Lien "Voir tous les experts" (top-right)

| Propriété | Valeur | Source |
|---|---|---|
| Texte exact | **"Voir tous les experts"** | `87:219` |
| Font family | **Work Sans** | code + `get_variable_defs` (Body 18px) |
| Font weight | **Regular (400)** | code: `font-normal` |
| Font size | **18 px** | code: `text-[18px]` + `get_variable_defs` |
| Line-height | **18 px** | code: `leading-[18px]` |
| Couleur | **`#FFFFFF`** | code: `text-white` |
| Letter-spacing | 0 | `get_variable_defs` |
| Position absolue (page) — texte | `x = 1069`, `y = 1374` | calcul (125+944, 1335+39) |
| Position relative à la section | `x = 944`, `y = 39` | metadata |
| Largeur bbox texte | 181 px | metadata |
| Hauteur bbox texte | 18 px | metadata |
| Chevron — présent ? | **Oui** | code + metadata `94:885` |
| Chevron — dimensions | **15.124 × 6 px** (rendu en flèche droite via double rotation) | metadata |
| Chevron — couleur | **`??`** non exposé (asset image `imgVector3`) — visuellement blanc/doré clair | screenshot |
| Chevron — position relative à la section | `x = 1156.124`, `y = 45` | metadata |
| Chevron — gap horizontal depuis fin de texte | `1156.124 − (944+181) = 31.124 px` ≈ **31 px** (gonflé par la bbox du vector ; visuellement plus tassé) | calcul |
| Alignement vertical avec le titre | Centre titre y=49 vs centre lien y=48 → **alignés** (1 px) | calcul |
| Token DS | `font-body text-body-18 text-foreground` + chevron `accent` (présumé, identique à la section domaines) | déduit |

→ **Identique au lien "Voir tous les domaines"** de la section domaines (typo, taille, couleur, structure). Le seul changement est le texte ("domaines" → "experts") et la position horizontale (1068 vs 944).

---

## 3. Carrousel — rangée `Expert Cards` (`94:816`)

| Propriété | Valeur | Source |
|---|---|---|
| Layout | **Flex horizontal**, `flex-wrap`, items-center, content-center | code: `content-center flex flex-wrap gap-[0px_16px] items-center` |
| Largeur de la rangée | **1336 px** | metadata `94:816` |
| Hauteur de la rangée | 422 px (= hauteur d'une card) | metadata |
| Position dans la section | `x = 0`, `y = 140` | metadata |
| Gap horizontal entre cards | **16 px** | code: `gap-[0px_16px]` |
| Gap vertical entre cards | 0 px (wrap théoriquement possible mais 4 cards en une ligne) | code |
| Padding interne (rangée) | 0 px | metadata |
| Largeur effective vs section | **1336 px > 1175 px section** → la rangée **dépasse de 161 px** la largeur de la section (overflow horizontal à droite). | calcul |

### 3.1 Card individuelle

| Propriété | Valeur | Source |
|---|---|---|
| Dimensions | **322 × 422 px** | metadata (chaque card) |
| Background | `rgba(0, 0, 0, 0.4)` (= `bg-black/40`) | code: `bg-[rgba(0,0,0,0.4)]` |
| Border | aucune | code |
| Border radius | **16 px** | code: `rounded-[16px]` |
| Padding | **16 px horizontal / 32 px vertical** | code: `px-[16px] py-[32px]` |

→ Spec interne complète : voir `design-system.md §6 Card Expert` et la card V1 déjà implémentée. Cette spec ne ré-extrait pas le contenu interne.

### 3.2 Cards visibles à l'état initial

| Card | Type | Position relative dans `94:816` | Visibilité dans la section (largeur 1175 px) |
|---|---|---|---|
| 1 | Expert Card Unlocked (`94:619`) | x = 0..322 | **Fully visible** |
| 2 | Expert Card Locked (`119:13`) | x = 338..660 | **Fully visible** |
| 3 | Expert Card Locked (`119:51`) | x = 676..998 | **Fully visible** |
| 4 | Expert Card Unlocked (`119:88`) | x = 1014..1336 | **Partiellement visible** — seulement les 161 premiers px côté gauche (~50% de la card) visibles dans la fenêtre section (1175 px) |

→ **3 cards entièrement visibles + 1 partielle à 50%** dans la fenêtre de 1175 px (et non pas 4 visibles comme indiqué dans `homepage-spec.md §4`).

Vérif : `3 × 322 + 2 × 16 = 998 px` ✓ (tient dans 1175). Le 4ᵉ démarre à x=1014, déborde de 1014+322−1175 = 161 px à droite.

### 3.3 Alternance Unlocked/Locked

Pattern Figma (de gauche à droite) : **Unlocked → Locked → Locked → Unlocked**.

→ Pas une alternance fixe ; c'est une démo : la 1ʳᵉ est visible (CTA blanc "Accèder (3,50€)"), les 2 suivantes sont locked (CTA gris "Terminé pour aujourd'hui"), la 4ᵉ est unlocked. **À l'intégration : pas de logique d'alternance hardcodée** — on rend l'état de chaque card en fonction des données utilisateur.

### 3.4 État "active" / mise en avant

**Aucune card n'est visuellement mise en avant** dans la maquette :
- Pas de scale, pas de border, pas de glow, pas de couleur d'arrière-plan différente
- Les 4 cards ont les mêmes dimensions (322 × 422) et le même fond (`bg-black/40`)
- La distinction visuelle entre cards porte uniquement sur leur **état de contenu** (Unlocked / Locked → bouton du bas différent)

→ **Pas de card "centrée" ou "active" au chargement**. Le carrousel démarre simplement avec la 1ʳᵉ card alignée à gauche.

---

## 4. Bouton de navigation "Next" (`94:821`)

| Propriété | Valeur | Source |
|---|---|---|
| Type | **Image asset** (`imgNextBtn`) — pas un nœud avec fills/strokes exposés | code |
| Forme | **Cercle** (`rounded-full`, taille fixe 45×45 px) | code: `size-[45px]` + screenshot |
| Dimensions | **45 × 45 px** | metadata |
| Position dans `94:816` (rangée cards) | `x = 1038`, `y = 182` | metadata |
| Position absolue dans la section | `x = 1038`, `y = 140 + 182 = 322` | calcul |
| Position absolue dans la page | `x = 125 + 1038 = 1163`, `y = 1335 + 322 = 1657` | calcul |
| Position par rapport aux cards | Overlay **absolu**. Centre du bouton = (1038+22.5, 182+22.5) = (1060.5, 204.5). Centre vertical de la rangée = 211 → bouton **~6 px au-dessus du centre** vertical des cards (quasi-centré). | calcul |
| Position horizontale par rapport au container | Le bouton est à `x=1038` dans la rangée, soit `1038-1014 = 24 px` à l'intérieur de la 4ᵉ card (partielle), à `1038-998-16 = 24 px` du bord droit de la 3ᵉ card → **chevauche le début de la 4ᵉ card**, à mi-chemin entre les 2 cards. | calcul |
| Background | **`??`** asset image — visuellement : disque sombre semi-transparent (probablement `bg-black/40` ou `surface-elevated`) | screenshot |
| Border | **`??`** asset image — visuellement : fine bordure dorée ou blanche subtile | screenshot |
| Icône intérieure | Flèche `→` (chevron) — couleur **`??`** asset image — visuellement blanche ou dorée | screenshot |
| Shadow / glow | non visible | screenshot |
| Bouton "Previous" (`←`) | **Absent de la maquette** — seul un Next Btn est dessiné. Le bouton retour est à designer (ou peut être implicite via swipe / dots) | metadata + code |

→ Position : top-right du bloc cards, **à l'intérieur** du conteneur (overlap absolu), aligné verticalement (~centre) avec les cards. **Pas à l'extérieur** de la section.

> Le DS (`design-system.md §6 Carrousel Next button`) documente le disque 45×45 rounded-full top-right absolu. **Couleurs exactes non documentées** (asset image).

---

## 5. Pagination — `Carrousel state` (`94:815`)

| Propriété | Valeur | Source |
|---|---|---|
| Type | **Image asset** (`imgCarrouselState`) — pas un composant Figma natif (pas de variables) | code |
| Dimensions totales | **49 × 10 px** | metadata |
| Position dans la section | `x = 563`, `y = 597` | metadata |
| Position absolue dans la page | `x = 125 + 563 = 688`, `y = 1335 + 597 = 1932` | calcul |
| Position relative à la section | **Centrée horizontalement** ? `563 + 49/2 = 587.5` ; centre de la section = 1175/2 = 587.5 → **oui, centré exactement** sur l'axe horizontal de la section | calcul |
| Position verticale | Sous la rangée de cards. Cards bas = y=140+422=562. Dots top = 597. → **Gap = 35 px** sous les cards (et non 50 px comme indiqué dans `homepage-spec.md §4`) | calcul |
| Padding-bottom (vers le bas de section) | 617 − 607 = **10 px** | calcul |
| Nombre de dots | **3 dots** (déduit du screenshot) — non confirmable depuis le bbox seul | screenshot |
| Taille des dots | **`??`** — 49 px / 3 = ~16 px d'espace par dot, mais hauteur totale 10 px → dots probablement ~6-10 px de diamètre | calcul + screenshot |
| Couleur dot actif | **`??`** (asset image) — visuellement plus clair / doré (présumé `accent` `#DFB968` ou blanc) | screenshot |
| Couleur dot inactif | **`??`** (asset image) — visuellement gris muted (présumé `text-muted` `#898181` ou `surface-elevated`) | screenshot |
| Gap entre dots | **`??`** — non extractible directement | calcul |
| Quel dot est actif au chargement | **`??`** — visuellement difficile à dire depuis le screenshot ; probablement le 1ᵉʳ (cohérent avec scroll = 0) | déduit |

> ⚠️ Toutes les propriétés visuelles des dots (taille exacte, couleurs, gap, indice actif) sont **non extractibles** car c'est un asset image, pas un composant. À récupérer en inspectant directement le PNG ou en redessinant côté code selon la convention DS (par exemple : 3 dots de 6-8 px, gap 8 px, actif = `accent`, inactif = `text-muted` à opacité réduite).

---

## 6. État initial du carrousel

Récap des comportements visuels au chargement (déduits du seul screenshot de la maquette — **pas de variants Figma exposés pour l'état hover/scrolled**) :

| Comportement | État Figma | Notes |
|---|---|---|
| Card affichée en premier (offset 0) | Card 1 — Unlocked | Pas d'animation d'entrée maquettée |
| Card "centrée" ou "mise en avant" | **Aucune** | Toutes les cards ont le même rendu visuel (background, dimensions, padding). La distinction est de contenu (Unlocked / Locked) |
| Nombre de cards entièrement visibles | **3** (sur les 4 dessinées) | + 1 partielle ~50% à droite |
| Bouton Next | Visible, top-right, overlay sur la 4ᵉ card | Indique qu'il y a "plus à voir" à droite |
| Bouton Previous | **Absent** | À designer ou à omettre côté code |
| Dots de pagination | **3 dots** centrés sous les cards | Le dot actif est probablement le 1ᵉʳ (état initial) |

---

## 7. Récapitulatif tokens / valeurs clés

| Élément | Valeur | Token DS suggéré |
|---|---|---|
| Background section | transparent (gradient global) | — |
| Padding-top vs section précédente | 96 px (depuis Explore) | `section-y-lg` |
| Padding-bottom vs section suivante | 64 px (vers Pourquoi Plarya) | `section-y` |
| Padding interne haut (section→header) | 22 px | — |
| Header → cards row (gap vertical) | 64 px | — |
| Cards row → pagination dots (gap vertical) | 35 px | — |
| Pagination dots → bottom section (gap vertical) | 10 px | — |
| Titre — typo / couleur | DM Serif Display Regular 32 / `#FFFFFF` | `text-h2 text-foreground` |
| Ligne décorative — dimensions / couleur | 1 × 54 px verticale / `accent` (présumé) | — |
| Lien "Voir tous" — typo / couleur | Work Sans Regular 18 / 18 / `#FFFFFF` | `text-body-18 text-foreground` |
| Lien "Voir tous" — chevron | 15.124 × 6 px, couleur `??` | `accent` (présumé) |
| Card — dimensions | 322 × 422 px | — |
| Card — background | `rgba(0,0,0,0.4)` | `bg-black/40` |
| Card — radius | 16 px | `rounded` |
| Card — padding | 16 × 32 px | — |
| Gap entre cards | 16 px | — |
| Cards visibles | 3 + 1 partielle (50%) dans 1175 px | — |
| Next Btn — dimensions / forme | 45 × 45 / `rounded-full` | — |
| Next Btn — position | top-right overlay, ~centré vertical des cards (`y = 322` dans section, `x = 1038` dans rangée) | — |
| Pagination — dimensions | 49 × 10 px, 3 dots, centré horizontalement, y=597 | — |

---

## 8. Écarts détectés avec les specs existantes

### 8.1 vs `design-system.md`

| Sujet | DS dit | Figma (cette extraction) | Verdict |
|---|---|---|---|
| Lien "Voir tous" — taille | 18 px Work Sans Regular blanc + chevron accent (déjà corrigé suite à `domains-section-spec.md`) | ✓ 18 px blanc | OK |
| Section title pattern | DM Serif 32 + ligne dorée verticale 1×54 à gauche, gap 16 px | ✓ confirmé identique à la section domaines | OK |
| Card Expert — dimensions DS | "322 × 422 (DS) — variante V1 = 379 × 352" | ✓ 322 × 422 confirmé | OK |
| Card Expert — bg / padding / radius | `bg-black/40`, padding 16/32, radius 16 | ✓ confirmé | OK |
| `Carrousel Next button` — disque 45×45 rounded-full top-right absolute | ✓ confirmé | confirmé | OK |
| `Carrousel Dots` — indicateur 49×10 en bas du carrousel "Nos Experts" | ✓ confirmé sur dimensions | dims OK, couleurs non extractibles | OK partiel |
| Gap cards (Expert carrousel) | 16 px (cards de 322, x = 0/338/676/1014) | ✓ confirmé | OK |

### 8.2 vs `homepage-spec.md §4`

| Sujet | homepage-spec dit | Figma (cette extraction) | Verdict |
|---|---|---|---|
| `padding-top` depuis section précédente | 96 px (`section-y-lg`) | ✓ 97 px ≈ 96 | OK |
| Title : top de la section | "top de la section" | y=27 dans la section (= 27 px depuis le top section) | Précision |
| Gap title → cards | 64 px (cards démarrent à y=140 depuis le top section) | ✓ 64 px (header bas y=76, cards top y=140) | OK |
| Cards : 4 visibles + 1 partielle | "**4 visibles** + 1 partielle, gap 16px" | ⚠️ En réalité **3 entièrement visibles + 1 partielle** (~50%) dans 1175 px | ⚠️ **Écart de comptage** — corriger `homepage-spec.md` |
| Largeur carrousel | 1336 px | ✓ 1336 | OK |
| Carrousel dots — position | "y=597 dans la section (**50px** sous les cards)" | y=597, **35 px** sous les cards (cards bas à y=562) | ⚠️ Écart 50 → 35 |
| NextBtn — position | "top-right absolute, **y=182**" | y=182 **dans la rangée `94:816`**, soit y=322 dans la section | ⚠️ Ambiguïté : y=182 est relatif à `94:816`, pas à la section. À clarifier |
| Lien "Voir tous" — tokens | `text-body-16 text-muted` (déjà corrigé) | 18 px white | OK (déjà à corriger comme la section domaines) |
| Titre extrait | "Nos experts" implicitement | **"Nos experts"** (la maquette n'écrit pas "du jour") | brief vs Figma à arbitrer |

### 8.3 Inconnues persistantes (`??`)

- **Couleur exacte de la ligne décorative verticale** : asset image, non exposé. Présumée `accent` (`#DFB968`).
- **Couleur exacte du chevron** du lien "Voir tous" : asset image. Présumée `accent`.
- **Next Btn** : tout son rendu (fond, bordure, couleur de la flèche, glow) est un asset image. À redessiner côté code en suivant la convention DS — proposition : `bg-black/40` ou transparent + bordure dorée 1 px + flèche blanche, dans un cercle 45×45.
- **Carrousel state (dots)** : taille exacte des dots, couleurs actif/inactif, gap entre dots, index actif initial → tous **non extractibles** depuis un asset image. À redessiner.
- **Bouton "Previous"** : non maquetté. À designer (par symétrie : disque 45×45 à gauche ?) ou omettre (navigation par swipe + dots).
- **États hover / focus** sur les cards, le Next Btn, les dots, le lien "Voir tous" : non maquettés.
- **Comportement scroll** (smooth scroll, snap, infinite vs bounded, scroll par card vs par viewport) : non spécifié dans Figma.
- **Wording** "Nos experts" vs "Nos experts du jour" : à arbitrer.

---

## 9. Récap structuré pour l'intégration

```
<section className="experts pt-24 pb-16"  /* 96 px top, 64 px bottom */>
  <div className="container max-w-content mx-auto">

    {/* Header — réutilisation directe de SectionTitle */}
    <SectionTitle
      title="Nos experts"  /* ou "Nos experts du jour" si on suit le brief */
      cta={{ text: "Voir tous les experts", href: "/experts" }}
    />

    {/* Espace ~64 px (gap header → carrousel) */}

    {/* Carrousel — overflow horizontal volontaire (1336 px > 1175 px section) */}
    <div className="relative mt-16">
      {/* Rangée des cards : flex horizontal, gap 16 */}
      <div className="flex flex-nowrap gap-4 overflow-hidden">
        {experts.map(expert => (
          <ExpertCard expert={expert} />  /* w=322, h=422 */
        ))}
      </div>

      {/* Bouton Next — overlay top-right, position approx. x = container-right + 24, vertical centré */}
      <button
        className="absolute size-[45px] rounded-full ..."
        style={{ right: "-24px", top: "182px" }}  /* à ajuster visuellement */
      >
        →
      </button>
    </div>

    {/* Dots de pagination — centrés horizontalement, 35 px sous les cards */}
    <div className="mt-[35px] flex justify-center gap-2">
      {Array.from({ length: dotsCount }).map((_, i) => (
        <span className={i === activeIndex ? "active-dot" : "inactive-dot"} />
      ))}
    </div>

  </div>
</section>
```

À designer côté code (pas dans Figma) :
- Couleurs / formes exactes du Next Btn et des dots (suivre la convention DS)
- Bouton Previous (si on en veut un)
- États hover, focus, animation de scroll
- Logique de scroll (snap par card, scroll smooth, infinite/bounded)
