# Blocs finaux de la homepage — Spec d'intégration (desktop)

> Source : Figma `vxkUD2k0gxROZEGZLlSFqb`
> - CTA "Devenir créateur" : frame `94:860`
> - Disclaimer : text node `94:865`
>
> Viewport de référence : **1440px**
> Référence DS : `design-system.md` ; référence page : `homepage-spec.md §6 + §7`
> Date d'extraction : 2026-05-20

---

# Section 1 — CTA "Devenir créateur" (`94:860`)

## 1. Vue d'ensemble

Frame Figma `94:860` :
- Position dans la page : `x = 129`, `y = 2374`
- Dimensions : **`1169 × 147`**
- Bottom : `y = 2521`

Sous-éléments (positions données en coordonnées **relatives au parent direct**) :

| Node | Nom | x | y | w | h |
|---|---|---|---|---|---|
| `94:891` | Content (grid wrapper) | 64 | 32 | 1020.124 | 76 |
| `94:861` | Text block (titre + subtitle) | 64 (relatif à Card) | 32 | 518 | 76 |
| `94:849` | Titre "Partage ton expertise…" | 64 | 32 | 518 | 28 |
| `94:850` | Subtitle "Rejoins Plarya…" | 64 | 76 | 477 | 32 (2 lignes) |
| `94:887` | Bouton "Devenir créateur btn" | 826 (relatif à Card) | 43 | 258.124 | 55 |
| `94:888` | Texte du bouton "Devenir créateur" | 32 (relatif au btn) | 16 | 163 | 23 |
| `94:889` | Chevron du bouton | 226.124 | 24.5 | 15.124 | 6 |

> ⚠️ Le metadata Figma place `94:891` et `94:861` aux mêmes coordonnées (`x=64, y=32`). C'est parce que `94:891` est un wrapper grid avec `place-items-start` qui ne décale pas son contenu. Les coordonnées des enfants sont **toutes relatives à la frame Card `94:860`** (la "Content" grid n'ajoute pas de translation supplémentaire).

## 2. Conteneur

| Propriété | Valeur | Source |
|---|---|---|
| Largeur | **1169 px** | metadata |
| Hauteur | **147 px** | metadata |
| Background | **AUCUN** (transparent — pas de fill exposé par MCP) | code: pas de `bg-...` sur la frame |
| Border | **`1px solid #181818`** (gris très sombre — token `surface-elevated`) | code: `border border-[#181818] border-solid` |
| Border radius | **16 px** | code: `rounded-[16px]` |
| Padding horizontal | **64 px** | code: `px-[64px]` |
| Padding vertical | **32 px** | code: `py-[32px]` |
| Layout | `flex flex-col items-start` (mais le bouton est positionné via grid + `ml-762` cf. §4) | code |
| Position absolue (page) | x=129, y=2374 → bottom y=2521 | metadata |
| Position horizontale vs viewport | gauche **129 px**, droite **142 px** (1440 − 129 − 1169 = 142) — léger décalage vs sections précédentes (x=125) | calcul |
| Gap vertical (depuis "Pourquoi Plarya" qui finit à y=2310) | **64 px** | calcul (= token `section-y`) |
| Gap vertical (vers Divider décoratif à y=2649) | **128 px** | calcul — grand gap avant la zone légale |

### Type de conteneur — comparaison

| Aspect | Card "Pourquoi Plarya" `94:829` | Card "Devenir créateur" `94:860` |
|---|---|---|
| Background | `rgba(9,8,7,0.4)` ≈ `bg-black/40` | **aucun (transparent)** |
| Border | aucune | **`1px solid #181818`** |
| Radius | 16 px | 16 px |
| Padding | 88 × 8 (avec items-center) | **64 × 32** |

→ **Deux styles de card distincts** : Pourquoi Plarya = card "remplie" (fond noir 40%, sans bordure). Devenir créateur = card "outline" (bordure subtile, sans fond). À l'intégration, c'est ce qui distingue visuellement les deux blocs malgré leur proximité.

> 💡 Côté code, la bordure `#181818` sur fond noir global = très peu visible. C'est volontaire (effet "fantôme" subtil qui délimite la zone sans crier). À l'écran, le contour est à peine perceptible.

## 3. Contenu textuel (gauche)

### 3.1 Titre / accroche

| Propriété | Valeur | Source |
|---|---|---|
| Texte | **"Partage ton expertise et génère des revenus"** | `94:849` |
| Font family | **Work Sans** | `get_variable_defs` (h4) |
| Font weight | **Regular (400)** | `get_variable_defs` |
| Font size | **24 px** | `get_variable_defs` (h4) |
| Line-height | `normal` (~100%) | code: `leading-[normal]` |
| Couleur | **`#FFFFFF` blanc** | code: `text-white` |
| Letter-spacing | 0 | `get_variable_defs` |
| Position absolue (page) | x=193 (=129+64), y=2406 (=2374+32) | calcul |
| Position relative à la Card | x=64, y=32 | metadata |
| Bbox | 518 × 28 | metadata |
| Token DS | `font-body text-h4 text-foreground` | déduit |

### 3.2 Subtitle / description

| Propriété | Valeur | Source |
|---|---|---|
| Texte (verbatim) | **"Rejoins Plarya en tant que créateur et monétise tes analyses auprès d'une communauté engagée."** | `94:850` |
| Nb de lignes | **2** (saut entre "analyses" et "auprès") | code: 2 `<p>` |
| Font family | **Work Sans** | `get_variable_defs` (Body 16) |
| Font weight | Regular (400) | code |
| Font size | **16 px** | code: `text-[16px]` |
| Line-height | **16 px** | code: `leading-[16px]` |
| Couleur | **`#898181` muted-foreground** | code: `text-[#898181]` |
| Position absolue (page) | x=193, y=2450 (=2374+76) | calcul |
| Position relative à la Card | x=64, y=76 | metadata |
| Bbox | 477 × 32 | metadata |
| Token DS | `font-body text-body-16 text-muted-foreground` | déduit |

### 3.3 Gap titre → subtitle

- Bas du titre : y=32+28 = **60** (relatif à Card)
- Top du subtitle : y=**76** (relatif à Card)
- **Gap = 16 px** | code: `mt-[44px]` du subtitle dans la grid + 32 (start) → `gap` effectif = 76-60 = 16

## 4. Bouton CTA "Devenir créateur"

### 4.1 Texte exact

**"Devenir créateur"** + chevron `→` à droite (cf. `94:889` — vector image, présumé blanc/noir selon le rendu du bouton primary).

### 4.2 Variant à utiliser

→ **`<Button variant="primary" size="lg">`** du composant Button existant.

Vérification correspondance avec le DS :
- Background : `bg-gradient-to-r from-[rgba(223,185,104,0.8)] to-[rgba(255,255,255,0.8)]` = **Btn gradient** (`linear-gradient(to right, #DFB968_80% → #FFFFFF_80%)`) ✓
- Border : `border border-[#e1aa36] border-solid` = **Golden Stroke** (#E1AA36) ✓
- Shadow : `shadow-[0px_0px_15px_0px_rgba(255,174,0,0.7)]` = **Shining Effect** ✓
- Padding : `px-[32px] py-[16px]` ✓ correspond à `size-default` mais avec `text-h5` (Medium 20) → c'est le `size="lg"` du Button (cf. button.tsx)
- Texte : Work Sans **Medium 20** noir ✓ (h5)
- Border radius : `rounded-[16px]` ✓
- Gap interne (texte ↔ chevron) : `gap-[16px]` ✓

### 4.3 Taille

| Propriété | Valeur | Source |
|---|---|---|
| Dimensions | **258.124 × 55 px** | metadata `94:887` |
| Padding | 32 px horizontal / 16 px vertical | code |
| Variant Button | `primary` size `lg` (cf. `button.tsx` lignes 52-56) | équivalence DS |

### 4.4 Position dans le bandeau

- Position absolue (page) : x=955 (=129+826), y=2417 (=2374+43)
- Position relative à la Card : **x=826, y=43**
- Le bouton est **à droite** dans le bandeau.
- Détails :
  - Card width = 1169, padding-right = 64 → bord droit du content area à x=1105 (relatif Card)
  - Bord droit du bouton : x=826+258 = **1084** (relatif Card)
  - **Gap bouton → padding droit : 21 px** (le bouton n'est pas collé au bord droit, ~21px d'espace)
- Centre vertical du bouton (y=43 + 27.5 = 70.5) vs centre vertical du text block (y=32 + 38 = 70) → **alignés** (centre vertical commun = ~70 px depuis le top de la Card)

## 5. Layout général

**Layout horizontal** : texte d'un côté (gauche), bouton de l'autre (droite), **alignés verticalement par leurs centres**.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Partage ton expertise et génère des revenus           [Devenir    │
│  Rejoins Plarya en tant que créateur et monétise tes    créateur →]│
│  analyses auprès d'une communauté engagée.                          │
└─────────────────────────────────────────────────────────────────────┘
   ↑64                                                         ↑64
   padding-x                                                   padding-x
```

- Texte aligné à gauche (x=64), largeur ~518 (titre) / 477 (subtitle)
- Bouton aligné à droite (x=826, w=258), 21px de gap avec le padding droit
- Verticalement : tout est centré dans l'inner area (147 - 64 = 83 px de hauteur utile)

> ⚠️ Le DS (`design-system.md §6 Devenir créateur CTA card`) et `homepage-spec.md §6` mentionnent un **`bg-black/40`** pour cette card. **À corriger** : la maquette montre uniquement une **bordure `#181818`** sans fond.

---

# Section 2 — Disclaimer (`94:865`)

## 1. Vue d'ensemble

Le disclaimer est un **simple nœud texte** dans Figma (pas une frame, pas de wrapper, pas de padding) :

| Node | Type | x (page) | y (page) | w | h |
|---|---|---|---|---|---|
| `94:865` | `<text>` | 346 | 2783 | 748 | 32 |

→ **Pas de conteneur dédié, pas de padding, pas de background, pas d'icône**. Juste un paragraphe de texte centré.

## 2. Conteneur

| Propriété | Valeur | Source |
|---|---|---|
| Background | **aucun** (transparent — fond global page visible) | code |
| Padding | **aucun** (texte directement positionné) | code/metadata |
| Position absolue (page) | x=346, y=2783..2815 | metadata |
| Centrage horizontal | 346 + 748/2 = 720 = viewport center 1440/2 → **centré exactement sur le viewport** | calcul |
| Largeur du bloc texte | **748 px** | metadata |
| Hauteur du bloc texte | **32 px** (= 2 lignes × line-height 16) | metadata |

## 3. Icône ?

❌ **Aucune icône** (pas de "ⓘ", pas d'avertissement visuel). Le disclaimer est purement textuel.

## 4. Texte

| Propriété | Valeur | Source |
|---|---|---|
| Texte exact (verbatim) | **"Les contenus proposés sur Plarya sont des analyses et opinions personnelles. Ils ne constituent en aucun cas des conseils financiers ou des incitations à parier."** | `94:865` |
| Nombre de lignes | **2** (saut auto à ~748px de largeur) | metadata |
| Font family | **Work Sans** | `get_variable_defs` (Body 16) |
| Font weight | Regular (400) | code |
| Font size | **16 px** | code: `text-[16px]` |
| Line-height | **16 px** | code: `leading-[16px]` |
| Couleur | **`#898181` muted-foreground** | code: `text-[#898181]` |
| Letter-spacing | 0 | `get_variable_defs` |
| Alignement | **center** (text-center) | code: `text-center` |
| Token DS | `font-body text-body-16 text-muted-foreground text-center` | déduit |

## 5. Position par rapport au footer

Contexte vertical (cf. `homepage-spec.md §7-§8`) :

| Élément | y top | y bottom | Hauteur |
|---|---|---|---|
| Devenir créateur (Card) | 2374 | 2521 | 147 |
| Divider décoratif (lignes + ellipse) | 2649 | 2655 | ~6 |
| **Disclaimer** | **2783** | **2815** | **32** |
| Footer | 3072 | 3141 | 69 |

| Gap | Valeur |
|---|---|
| Devenir créateur (bottom) → Divider décoratif (top) | `2649 − 2521 = 128 px` |
| Divider décoratif (bottom) → Disclaimer (top) | `2783 − 2655 = 128 px` (≈ ce que `homepage-spec.md` appelait "~134px" — précision : **128 px** depuis le bas de la ligne) |
| Disclaimer (bottom) → Footer (top) | `3072 − 2815 = 257 px` |

→ Le disclaimer est **au-dessus** du footer, séparé par un **gros gap vide de 257 px**. Visuellement, le disclaimer flotte dans la zone légale en bas de page.

> ⚠️ Le gap de 257 px disclaimer→footer est probablement un artefact Figma (zone vide non remplie) plutôt qu'une intention forte. À l'intégration, **réduire à ~64-96 px** est probablement plus naturel — à arbitrer.

## 6. Position vs viewport

- Centré horizontalement : x=346, w=748 → centre x = 720 = viewport center 1440/2 ✓
- Padding latéral effectif : (1440 − 748) / 2 = **346 px** (largeur de marge de chaque côté)

→ Beaucoup plus de marge latérale (346 px) que les autres sections (~132 px). Cela force le texte à rester centré sur une largeur lisible (~70 caractères par ligne max).

---

# Écarts détectés avec les specs existantes

## A. CTA "Devenir créateur" vs `homepage-spec.md §6`

| Sujet | homepage-spec dit | Figma (cette extraction) | Verdict |
|---|---|---|---|
| Frame `94:860`, `1169 × 147`, y=2374..2521 | ✓ | ✓ | OK |
| Card `bg-black/40 rounded-2xl` | "Card : bg-black/40, rounded-2xl" | **PAS de fond** — seulement une **bordure `1px solid #181818`** | ⚠️ **ÉCART majeur** — corriger |
| Padding interne ~32 vertical / ~64 horizontal | ✓ | ✓ confirmé exactement `32×64` | OK |
| Text frame 518 × 76 | ✓ | ✓ | OK |
| Button 258 × 55 | ✓ | ✓ confirmé `258.124 × 55` | OK |
| Title "Partage ton expertise et génère des revenus" | ✓ | ✓ verbatim | OK |
| Subtitle "Rejoins Plarya en tant que créateur..." | "Rejoins Plarya en tant que créateur..." (raccourci) | ✓ verbatim Figma : "Rejoins Plarya en tant que créateur et monétise tes analyses auprès d'une communauté engagée." | OK (compléter si raccourci) |
| Title H4 24 | ✓ | ✓ h4 (Work Sans Regular 24) | OK |
| Subtitle Body 16 muted | ✓ | ✓ | OK |
| Button variant primary gradient gold | ✓ | ✓ confirmé (gradient, border #E1AA36, shadow shine, text Medium 20 noir) | OK |
| Gap titre → subtitle | "~16px" | ✓ 16 px exact | OK |

## B. CTA "Devenir créateur" vs `design-system.md §6 "Devenir créateur CTA card"`

| Sujet | DS dit | Figma | Verdict |
|---|---|---|---|
| Card 1169 × 147, **fond `bg-black/40`**, radius 16 | `bg-black/40` | **PAS de fond** (border uniquement) | ⚠️ **ÉCART** — corriger DS |
| Layout horizontal : texte (gauche) \| bouton (droite) | ✓ | ✓ | OK |
| Padding ~32 vertical / ~64 horizontal | ✓ | ✓ exact | OK |
| Texte H4 24 (titre) + Body 16 (subtitle) | ✓ | ✓ | OK |
| Bouton "Devenir créateur btn" (gradient gold) | ✓ | ✓ | OK |

→ **Action requise** : retirer la mention `bg-black/40` du DS et du homepage-spec pour cette card. Remplacer par "bordure `1px solid #181818` (surface-elevated), pas de fond".

## C. Disclaimer vs `homepage-spec.md §7b`

| Sujet | homepage-spec dit | Figma | Verdict |
|---|---|---|---|
| Frame `94:865`, 748 × 32, y=2783 | ✓ | ✓ | OK |
| Centré horizontalement (x=346 sur 1440) | ✓ | ✓ | OK |
| Texte Body 16 muted, max-width 748, centré, `text-center` | ✓ | ✓ confirmé `text-[#898181]` `text-center` Work Sans Regular 16 / lh 16 | OK |
| Texte verbatim "Les contenus proposés sur Plarya..." | ✓ | ✓ verbatim | OK |
| Gap Devenir créateur → Divider | "128 px" | ✓ 128 px | OK |
| Gap Divider → Disclaimer | "~134 px" | **128 px** depuis le bas de la ligne décorative (134 px depuis son top — léger écart d'arrondi) | Précision |
| Gap Disclaimer → Footer | "~257 px" | ✓ 257 px | OK (gros gap probablement à réduire) |
| Pas d'icône ⓘ | Non mentionné | ✓ Pas d'icône, pas de wrapper | OK |
| Pas de background ni padding | Non mentionné | ✓ Texte nu | À documenter |

## D. Inconnues persistantes (`??`)

- **Couleur exacte du chevron** du bouton "Devenir créateur" : asset image `imgVector` — non extractible. Présumée noire (cohérent avec le texte noir du bouton primary gradient).
- **États hover / focus** sur le bouton : non maquettés (à dériver via la convention DS : `hover:brightness-105` du Button primary).
- **Variante mobile** : non extraite ici (cette spec couvre desktop uniquement).
- **Pourquoi un gap de 257 px** entre le disclaimer et le footer ? Probablement un espace vide non rempli dans la maquette. À arbitrer côté code (probablement réduire).

---

# Récap structuré pour l'intégration

## CTA "Devenir créateur"

```jsx
<section className="py-16"  /* 64 px top depuis Pourquoi, gap large en bas vers zone légale */>
  <div className="mx-auto w-full max-w-[1169px] px-6 sm:px-8 lg:px-0">

    {/* Card "outline" : bordure subtile, pas de fond */}
    <div className="flex items-center justify-between rounded-2xl border border-surface-elevated px-16 py-8">

      {/* Texte (gauche) */}
      <div className="flex flex-col gap-4">
        <h3 className="font-body text-h4 text-foreground">
          Partage ton expertise et génère des revenus
        </h3>
        <p className="font-body text-body-16 text-muted-foreground">
          Rejoins Plarya en tant que créateur et monétise tes analyses
          auprès d'une communauté engagée.
        </p>
      </div>

      {/* Bouton (droite) — réutiliser Button variant="primary" size="lg" */}
      <Button variant="primary" size="lg">
        Devenir créateur
        <ArrowRight className="size-4" />
      </Button>

    </div>
  </div>
</section>
```

À noter :
- `border-surface-elevated` = `#181818` (token DS)
- Pas de `bg-...` (transparent)
- Padding `px-16 py-8` = 64×32
- Le `justify-between` place le texte à gauche et le bouton à droite ; le `items-center` aligne verticalement

## Disclaimer

```jsx
<section className="pt-32 pb-64"  /* ~128 px depuis le Divider décoratif, gros gap vers footer */>
  <p className="mx-auto max-w-[748px] text-center font-body text-body-16 text-muted-foreground">
    Les contenus proposés sur Plarya sont des analyses et opinions
    personnelles. Ils ne constituent en aucun cas des conseils
    financiers ou des incitations à parier.
  </p>
</section>
```

À noter :
- Texte nu sans wrapper visuel (pas de card, pas d'icône, pas de fond)
- Centré sur 748 px max
- Le gap de 257 px vers le footer est probablement excessif — réduire à ~64-96 px côté code
