# Section "Pourquoi Plarya ?" — Spec d'intégration (desktop)

> Source : Figma `vxkUD2k0gxROZEGZLlSFqb`, frame "4. Pourquoi Plarya" (node `94:824`)
> Viewport de référence : **1440px**
> Référence DS : `design-system.md` ; référence page : `homepage-spec.md §5`
> Date d'extraction : 2026-05-20

---

## 0. Vue d'ensemble

Frame Figma `94:824` :
- Position dans la page : `x = 125`, `y = 2016`
- Dimensions : **`1174 × 294`**
- Bottom de la section : `y = 2310`

Sous-éléments (positions données en coordonnées **page absolues** sauf indication contraire) :

| Node | Nom | x | y | w | h |
|---|---|---|---|---|---|
| `94:826` | Header "Pourquoi Plarya?" (titre + ligne) | 137 | 2016 | 266 | 54 |
| `94:827` | Texte "Pourquoi Plarya ?" | 153 | 2021 | 250 | 44 |
| `94:828` | Ligne décorative `Line 4` (vector, image asset, vertical) | 137 | 2070 (wrapper top : 2016) | 0 (rot.) | 54 |
| `94:829` | Bloc Content (card avec fond + 3 piliers + dividers) | 125 | 2102 | 1174 | 208 |
| `94:830` | Pilier 1 "Gain de temps" (icon + title + desc) | 213 | 2141 (= 2102+39) | 281 | 130 |
| `94:833` | Icône `weui:time-outlined` (horloge) | 213 | 2141 | 30 | 30 |
| `94:831` | Titre "Gain de temps" | 213 | 2195 (= 2102+93) | 172 | 28 |
| `94:832` | Description "Accédez directement…" | 213 | 2239 (= 2102+137) | 281 | 32 |
| `94:845` | Divider vertical n°1 | 542 (=125+417) | 2110 (=2102+8) | 0 (rot.) | 192 |
| `94:835` | Pilier 2 "Simple" | 590 (=125+465) | 2142 (=2102+40) | 278 | 128 |
| `94:838` | Icône `mynaui:lightning` (éclair) | 590 | 2142 | 31 | 31 |
| `94:836` | Titre "Simple" | 590 | 2194 (=2102+92) | 81 | 28 |
| `94:837` | Description "Tout est prêt…" | 590 | 2238 (=2102+136) | 278 | 32 |
| `94:846` | Divider vertical n°2 | 916 (=125+791) | 2110 | 0 (rot.) | 192 |
| `94:840` | Pilier 3 "Sans engagements" | 964 (=125+839) | 2134.5 (=2102+32.5) | 247 | 143 |
| `94:843` | Icône `quill:creditcard` | 964 | 2134.5 | 30 | 30 |
| `94:841` | Titre "Sans engagements" | 964 | 2185.5 (=2102+83.5) | 221 | 28 |
| `94:842` | Description "Paiement à l'acte…" | 964 | 2229.5 (=2102+127.5) | 247 | 48 (3 lignes) |

> ⚠️ Pour les sous-frames du Content (`94:830`, `94:835`, `94:840`), les coordonnées de la metadata Figma sont relatives à la **frame Content `94:829`** (pas à la page). Les colonnes "x" et "y" du tableau ci-dessus sont **calculées en absolu page** pour comparaison directe.

---

## 1. Conteneur de section

### 1.1 Frame section `94:824`

| Propriété | Valeur | Source |
|---|---|---|
| Largeur | **1174 px** ⚠️ (≠ 1175 des autres sections — discrépance 1 px) | metadata |
| Hauteur | **294 px** | metadata |
| Background | **aucun** (transparent — hérite du gradient global) | Pas de fill exposé par MCP |
| Padding horizontal interne | 0 px | metadata |
| Padding horizontal vs viewport | gauche **125 px**, droite **141 px** (1440 − 125 − 1174 = 141) | calcul |
| Gap vertical (depuis section précédente "Nos Experts") | **64 px** (Nos Experts se termine à y=1952, cette section démarre à y=2016) | token DS `section-y` |
| Gap vertical (vers section suivante "Devenir créateur") | **64 px** (section bottom à y=2310, Devenir créateur démarre à y=2374) | token DS `section-y` |
| Padding interne (section top → header top) | **0 px** (header démarre à y=2016, exactement au top de section) | metadata |
| Padding interne (content bottom → section bottom) | **0 px** (content bottom à y=2310, exactement au bottom de section) | metadata |

### 1.2 Bloc Content `94:829` (card intérieure)

Cette section, à la différence des sections "Explore les domaines" et "Nos experts", a un **vrai bloc visuel encadré** (card) qui contient les 3 piliers — pas juste un texte sur fond transparent.

| Propriété | Valeur | Source |
|---|---|---|
| Position absolue (page) | x = 125, y = 2102 | metadata |
| Dimensions | **1174 × 208** | metadata |
| Background | **`rgba(9, 8, 7, 0.4)`** ≈ `#090807` à 40% d'opacité (très proche de `#000` /40%) | code: `bg-[rgba(9,8,7,0.4)]` |
| Border | aucune | code |
| Border radius | **16 px** | code: `rounded-[16px]` |
| Box-shadow / glow | aucun | code |
| Padding horizontal interne | **88 px** | code: `px-[88px]` |
| Padding vertical interne | **8 px** | code: `py-[8px]` |
| Layout | `flex` horizontal, items-center, justify-center, gap **48 px** | code: `flex gap-[48px] items-center justify-center` |
| Centrage horizontal | `left-[calc(50%-8px)] -translate-x-1/2` → centré sur le viewport avec offset −8 px (le centre du bloc est à `viewport-center − 8 px`) | code |

> **Notes** :
> - Le fond est proche de `bg-black/40` (`rgba(0,0,0,0.4)` utilisé pour les Expert Cards) mais avec une teinte très légèrement verdâtre/brune (`rgb(9,8,7)`). En pratique indistinguable à l'œil — à l'intégration, **utiliser `bg-black/40` du DS** pour cohérence (ou créer un token `--bg-card-warm` si on veut être strict).
> - L'offset −8 px sur le centrage est probablement un artefact d'alignement Figma. À ignorer côté code (centrer proprement).

---

## 2. Header de section

### 2.1 Titre "Pourquoi Plarya ?"

| Propriété | Valeur | Source |
|---|---|---|
| Texte | **"Pourquoi Plarya ?"** | `94:827` |
| Font family | **DM Serif Display** | `get_variable_defs` (H2) |
| Font weight | Regular (400) | `get_variable_defs` |
| Font size | **32 px** | `get_variable_defs` |
| Line-height | `normal` (~100%) | code: `leading-[normal]` |
| Letter-spacing | 0 | `get_variable_defs` |
| Couleur | **`#FFFFFF` blanc** pour "Pourquoi Plarya " + **`#DFB968` `accent`** pour le "**?**" | code: deux `<span>`, le 2ᵉ a `text-[#dfb968]` |
| Position absolue (page) — texte | x = 153, y = 2021 | metadata |
| Position relative à la section | x = 28, y = 5 | calcul |
| Hauteur bbox | 44 px | metadata |
| Largeur bbox | 250 px | metadata |
| Token DS | `font-display text-h2` avec accent sur le "?" | déduit |

> ⚠️ **Spécificité unique à cette section** : le "?" est en **doré accent** (#DFB968), pas en blanc. C'est le seul titre de section avec un caractère coloré. À implémenter via deux `<span>` (ou un mot-clé délimiteur dans la prop du `SectionTitle` s'il évolue pour le supporter).

### 2.2 Ligne décorative verticale

| Propriété | Valeur | Source |
|---|---|---|
| Type | Vector / image asset (`Line 4`, `imgLine4`) | code + metadata `94:828` |
| Orientation | **Verticale** (rotation `-90deg`) | code |
| Longueur | **54 px** | code: wrapper `h-[54px]` |
| Épaisseur | **1 px** (~ `inset-[-1px_-1.85%]`) | code |
| Couleur | **`??`** non exposé par `get_variable_defs` (asset image) — visuellement doré. DS = `accent` (#DFB968) | DS §6 |
| Position absolue (page) | wrapper : x=137, y=2016..2070 | code wrapper |
| Position relative à la section | x = 12, y = 0..54 | calcul |
| Gap horizontal ligne ↔ texte titre | `153 − 137 = 16 px` | calcul |
| Token DS | `accent` (#DFB968) — déduit | DS §6 |

> ⚠️ **Écart de positionnement** par rapport aux autres sections :
> - "Explore les domaines" : ligne à `x=0` relatif (section start x=125, ligne à x=125)
> - "Nos experts" : ligne à `x=0` relatif (section start x=125, ligne à x=125)
> - **"Pourquoi Plarya"** : ligne à `x=12` relatif (section start x=125, ligne à `x=137`)
>
> Ce décalage de 12 px côté gauche n'a pas de logique évidente. Probablement un défaut d'alignement Figma. À l'intégration, **harmoniser** sur le pattern des autres sections (ligne au début de la section, gap 16 px du texte). Le décalage interne du Content (88 px) reste indépendant.

### 2.3 Lien "Voir tous" ?

**❌ ABSENT.** Aucun lien "Voir tous" ou similaire dans cette section. Le header ne contient que le titre + la ligne décorative. Logique : c'est une section de réassurance/branding, pas une section de navigation vers du contenu listé.

### 2.4 Espacement header → contenu

- Bas du header (texte) : y = 2021 + 44 = **2065**
- Bas du header (ligne décorative) : y = 2016 + 54 = **2070**
- Top du Content : y = **2102**

→ Gap **bas ligne décorative → top Content = `2102 − 2070 = 32 px`** (NOT 64 px comme dans Explore/Experts)
→ Gap **bas texte titre → top Content = `2102 − 2065 = 37 px`** ≈ 32 px effectif

→ Documenté dans `homepage-spec.md` : "Gap title → content : 32px (content démarre à y=2102)" ✓

C'est la section avec le **plus petit gap header → contenu** (32 px vs 64 px ailleurs). Cohérent avec un contenu encadré qui "absorbe" visuellement plus d'espace.

---

## 3. Les 3 piliers

### 3.1 Layout général

| Propriété | Valeur | Source |
|---|---|---|
| Layout | **Horizontal**, 3 colonnes de largeurs **inégales**, séparées par 2 dividers verticaux | code + metadata |
| Container | flex, items-center, justify-center, **gap `48px`** entre items (5 items en tout : pilier1, divider1, pilier2, divider2, pilier3) | code: `gap-[48px]` |
| Padding horizontal du conteneur Content | 88 px chaque côté | code |
| Padding vertical du conteneur Content | 8 px chaque côté | code |
| Alignement vertical des piliers dans la card | `items-center` → les piliers sont **verticalement centrés** dans les 192 px d'inner height | code |

Largeurs des 3 piliers (mesurées) :
- Pilier 1 (Gain de temps) : **281 px**
- Pilier 2 (Simple) : **278 px**
- Pilier 3 (Sans engagements) : **247 px**

→ **Pas de colonnes égales** — chaque pilier a sa propre largeur déterminée par son contenu (notamment la description la plus longue). À l'intégration, on peut choisir d'aligner sur 3 colonnes égales (cohérence visuelle) ou de respecter ces largeurs intrinsèques.

### 3.2 Pattern par pilier (layout interne)

Chaque pilier suit le **même pattern vertical** : icône → titre → description (stack vertical, aligné gauche).

| Élément | Spec |
|---|---|
| **Icône** | 30 × 30 px (31×31 pour le Simple/éclair — variation marginale) ; couleur **`??`** asset image, visuellement **doré `accent` (#DFB968)** |
| **Titre** | Work Sans **Regular 24** / line-height `normal` (~24px) / blanc `#FFFFFF` |
| **Description** | Work Sans **Regular 16** / line-height **16** / muted **`#898181`** / 2 lignes (3 lignes pour le pilier 3, voir note) |

**Espacements verticaux** (mesurés sur les 3 piliers) :

| Mesure | Pilier 1 | Pilier 2 | Pilier 3 |
|---|---|---|---|
| Icône → top du titre (gap entre bas icône et top texte) | `93 − 39 − 30 = 24 px` | `92 − 40 − 31 = 21 px` | `83.5 − 32.5 − 30 = 21 px` |
| Titre → top description (gap entre bas titre et top desc) | `137 − 93 − 28 = 16 px` | `136 − 92 − 28 = 16 px` | `127.5 − 83.5 − 28 = 16 px` |

→ **Gap icône → titre ≈ 21-24 px** (légère variation, probablement à harmoniser à **24 px** côté code).
→ **Gap titre → description = 16 px** (constant).

### 3.3 Pilier 1 — "Gain de temps"

| Propriété | Valeur |
|---|---|
| Icône | `weui:time-outlined` (horloge) |
| Icône — dimensions | 30 × 30 px |
| Titre | **"Gain de temps"** |
| Description (verbatim Figma) | **"Accédez directement aux analyses. Pas de recherche, pas de bruit."** |
| Description — nb de lignes | 2 (avec un saut de ligne **forcé** après "analyses." `whitespace-pre`) |
| Hauteur cluster | 130 px |
| Largeur cluster | 281 px |

### 3.4 Pilier 2 — "Simple"

| Propriété | Valeur |
|---|---|
| Icône | `mynaui:lightning` (éclair) |
| Icône — dimensions | **31 × 31 px** (+1 vs les autres — anomalie mineure) |
| Titre | **"Simple"** |
| Description (verbatim Figma) | **"Tout est prêt. Choisissez un expert, accédez à ses sélections."** |
| Description — nb de lignes | 2 (saut entre "expert," et "accédez") |
| Hauteur cluster | 128 px |
| Largeur cluster | 278 px |

### 3.5 Pilier 3 — "Sans engagements"

| Propriété | Valeur |
|---|---|
| Icône | `quill:creditcard` (carte de crédit) |
| Icône — dimensions | 30 × 30 px |
| Titre | **"Sans engagements"** ⚠️ (avec `s` au pluriel — différent de `CLAUDE.md` qui dit "Sans engagement" sans `s`) |
| Description (verbatim Figma) | **"Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire."** |
| Description — nb de lignes | 3 (la 3ᵉ ligne est vide — un `<p>​</p>` avec un zero-width space, pour équilibrer visuellement la hauteur du cluster) |
| Hauteur cluster | 143 px (avec la ligne vide) ou 127 px si on retire la ligne vide |
| Largeur cluster | 247 px |

> ⚠️ **3ᵉ ligne vide artificielle** : le pilier 3 contient un troisième paragraphe vide dans Figma (`<p>...zero-width-space...</p>`). C'est un hack d'alignement de la designer pour gonfler la hauteur du cluster. **À l'intégration : ignorer cette ligne vide** — l'aligement vertical sera géré naturellement par le `items-center` du flex.

### 3.6 Dividers verticaux entre piliers

| Propriété | Valeur |
|---|---|
| Type | Vector / image asset (`imgDivider`) — **pas un solid color** | code |
| Quantité | **2** (entre pilier 1↔2 et pilier 2↔3) |
| Orientation | Verticale (rotation `-90deg`, élément Figma horizontal 192×0 rotaté) |
| Longueur | **192 px** | code: wrapper `h-[192px]` |
| Épaisseur | 1 px (inset `[-1px_0_0_0]`) |
| Couleur | **`??`** asset image — visuellement : **gradient doré qui s'estompe en haut et en bas** (probablement identique au divider doré utilisé dans l'Expert Card et le Hero Trust row, défini dans `globals.css` comme `--background-image-divider-gold` = `linear-gradient(to right, transparent 0%, #dfb968 51%, transparent 100%)`) |
| Position | Entre les piliers, gap 48 px de chaque côté (= gap du flex parent) | calcul depuis metadata |
| Position absolue (page) | Divider 1 : x=542, y=2110..2302 ; Divider 2 : x=916, y=2110..2302 | metadata |

→ Côté code, utiliser le même utilitaire que dans le Hero Trust row :
```css
background: linear-gradient(to bottom, transparent 0%, #DFB968 51%, transparent 100%);
opacity: 0.3 ou similaire
```
(Identique au `DividerVertical` du Hero — voir §4 comparaison.)

---

## 4. Comparaison avec le Trust row du Hero

Le Trust row du Hero (`homepage-spec.md §2`) et les piliers de "Pourquoi Plarya" partagent **3 éléments visuels** (icône + titre + body) **séparés par des dividers verticaux**, mais le pattern de layout et la typo diffèrent.

| Aspect | Trust row Hero | Piliers Pourquoi Plarya |
|---|---|---|
| **Layout d'un item** | **HORIZONTAL** : `[icône] [titre + body empilés à droite]` | **VERTICAL** : icône → titre → body (stack vertical, aligné gauche) |
| **Icône — dimensions** | 30 × 30 (uniformisée en code, Figma avait une icône à 35×35) | 30 × 30 (avec une variante 31×31 sur "Simple") |
| **Icône — couleur** | `accent` (#DFB968) | `accent` (#DFB968) — présumé (asset image) |
| **Titre — typo** | **H5** : Work Sans **Medium 20** / lh normal | **H4** : Work Sans **Regular 24** / lh normal |
| **Titre — couleur** | blanc | blanc |
| **Description — typo** | Body 16 (Work Sans Regular 16 / lh 16) | Body 16 (Work Sans Regular 16 / lh 16) — identique |
| **Description — couleur** | `muted-foreground` (#898181) | `muted-foreground` (#898181) — identique |
| **Gap icône → titre** | ~9 px **horizontal** (icône à gauche du bloc texte) | ~21-24 px **vertical** |
| **Gap titre → body** | ~16 px vertical | 16 px vertical — identique |
| **Divider entre items** | Trait vertical 1px × **96 px**, fade haut/bas (gradient doré) — code: `linear-gradient(to bottom, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)` à `opacity-60` | Trait vertical 1px × **192 px** (2× plus haut), gradient doré similaire (asset image) |
| **Fond du conteneur** | Le Hero a son propre cadre `bg-black/40` (sans inner card) | Card encadrée `rgba(9,8,7,0.4)` ≈ `bg-black/40` avec `rounded-[16px]` et padding 88/8 |
| **Padding horizontal du conteneur** | Hero : cadre 1285 px avec padding 59 px → contenu à x=131 | Content : 1174 px avec padding 88 px → contenu à x=213 |

### Verdict — peut-on factoriser un seul composant `FeatureItem` ?

**Non, pas directement.** Les 2 patterns sont visuellement distincts :
- Hero : item horizontal, titre H5 Medium 20
- Pourquoi Plarya : item vertical, titre H4 Regular 24

À factoriser éventuellement :
- Le **`DividerVertical`** (gradient doré qui s'estompe) peut être un seul composant avec une prop `height` (96 pour Hero, 192 pour Pourquoi) — recommandé.
- Le **`FeatureItem`** côté implémentation reste mieux séparé en 2 variantes (`<TrustItem>` horizontal et `<PillarItem>` vertical) ou bien un seul `<FeatureItem>` avec une prop `layout="horizontal" | "vertical"` et `titleSize="h5" | "h4"`.

---

## 5. Récap tokens / valeurs clés

| Élément | Valeur | Token DS suggéré |
|---|---|---|
| Background section | transparent | — |
| Section width | 1174 px (vs 1175 ailleurs — discrépance 1 px) | — |
| Padding-top (section précédente Experts) | 64 px | `section-y` |
| Padding-bottom (vers Devenir créateur) | 64 px | `section-y` |
| Padding interne (top section → header) | 0 px | — |
| Gap header → Content | 32 px | — |
| Titre — typo / couleur | DM Serif Display Regular 32 / `#FFFFFF` (le "?" en `#DFB968`) | `text-h2 text-foreground` + override pour "?" |
| Ligne décorative — dimensions / couleur | 1 × 54 px verticale / présumée `accent` | — |
| Ligne décorative — position | offset **+12 px** depuis le bord gauche de la section (≠ 0 dans les autres sections) | À harmoniser |
| Content card — bg | `rgba(9,8,7,0.4)` ≈ `bg-black/40` | utiliser `bg-black/40` pour cohérence |
| Content card — radius / padding | 16 px / 88×8 px | `rounded` + `px-22 py-2` (88=22*4, 8=2*4) |
| Content card — flex gap | 48 px | `gap-12` |
| Pilier — layout interne | vertical (icon → title → desc, aligné gauche) | — |
| Icône pilier — dimensions / couleur | 30×30 (31×31 pour Simple) / présumée `accent` | `text-accent` |
| Titre pilier — typo / couleur | Work Sans Regular 24 / `#FFFFFF` | `text-h4 text-foreground` |
| Description pilier — typo / couleur | Work Sans Regular 16 / `#898181` | `text-body-16 text-muted-foreground` |
| Gap icône → titre | ~21-24 px (à harmoniser à 24) | `mt-6` |
| Gap titre → description | 16 px | `mt-4` |
| Divider vertical entre piliers | 1×192 px, gradient doré (asset image) | utiliser le même CSS que le Hero Trust row, hauteur 192 |

---

## 6. Écarts détectés avec les specs existantes

### 6.1 vs `design-system.md`

| Sujet | DS dit | Figma (cette extraction) | Verdict |
|---|---|---|---|
| `Section title` pattern (ligne 1×54 + H2) | DM Serif 32 + ligne verticale 1×54 à gauche, gap 16 px | ✓ mais position de la ligne décalée de +12 px ici | OK avec note |
| Titre coloré partiellement | Non documenté | Le "?" est en `accent` — pattern unique à cette section | À ajouter au DS |
| `Why-Plarya item` | "Layout vertical (icône → titre H4 → body) — distinct du Trust row Hero" + "À confirmer après extraction MCP de la section Pourquoi Plarya" | ✓ confirmé : vertical, titre H4 Work Sans Regular 24, body 16 muted | OK (à passer de "à confirmer" à "confirmé") |
| Divider vertical (Hero/Pourquoi) | "Trait vertical 1px, gradient doré, 96px (Hero) et 192px (Pourquoi)" | ✓ confirmé 192 px pour Pourquoi | OK |

### 6.2 vs `homepage-spec.md §5`

| Sujet | homepage-spec dit | Figma (cette extraction) | Verdict |
|---|---|---|---|
| Frame Figma `94:824`, `1174 × 294` | ✓ | ✓ | OK |
| `padding-top` 64 px | ✓ | ✓ | OK |
| Gap title → content 32 px | ✓ | ✓ | OK |
| Content frame 1174 × 208 | ✓ | ✓ | OK |
| Dividers verticaux 192 px à x=417 et x=791 dans le content | ✓ | ✓ | OK |
| Padding horizontal content 88 px | ✓ | ✓ | OK |
| Structure tree mention "(icon + H5 + body)" | "H5" | En réalité **H4 (Work Sans Regular 24)** | ⚠️ Incohérence interne homepage-spec.md : structure dit H5, "Tokens" dit H4. **H4 est la bonne valeur** |
| Tokens : `Feature title : font-body text-h4 (Work Sans Regular 24)` | ✓ H4 | ✓ confirmé | OK |
| Tokens : icônes 30×30, couleur `accent` ou `accent-strong` (à confirmer) | Non confirmé | Présumé `accent` (asset image) — non extractible avec certitude | À confirmer visuellement |
| Spacing icône→titre ~24-30 px | "~24-30 px" | **~21-24 px** mesuré (légère variation par pilier) | Précision : 24 px standard |
| Largeur item 247-281 px | ✓ | ✓ (281 / 278 / 247) | OK |
| Background du Content | Non mentionné | **`rgba(9,8,7,0.4)`** card avec radius 16 et flex gap 48 — détail manquant dans homepage-spec | À ajouter |
| Ligne décorative du titre — position | "ligne dorée verticale" générique | **Offset +12 px** dans cette section (≠ 0 dans Explore/Experts) | ⚠️ À ajouter |
| Le "?" en accent doré | Non mentionné | ✓ "?" en `#DFB968` | À ajouter |
| Wording exact | "Gain de temps / Simple / Sans engagements" | ✓ confirmé avec un `s` à "Sans engagements" | OK |
| Wording desc 1 | "Accédez directement aux analyses. Pas de recherche, pas de bruit." | ✓ verbatim Figma | OK |
| Wording desc 2 | "Tout est prêt. Choisissez un expert, accédez à ses sélections." | ✓ verbatim Figma | OK |
| Wording desc 3 | "Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire." | ✓ verbatim Figma | OK |

### 6.3 vs `CLAUDE.md`

`CLAUDE.md` §"Pourquoi Plarya" mentionne :
- ⏱ **Gain de temps** — "Accédez directement aux analyses"
- ✓ **Simple** — "Tout est prêt, sans recherche"
- 🔓 **Sans engagement** — "Paiement à l'acte"

→ Wording approximatif (raccourci). **À mettre à jour** vers le verbatim Figma :
- "Gain de temps" → "Accédez directement aux analyses. Pas de recherche, pas de bruit."
- "Simple" → "Tout est prêt. Choisissez un expert, accédez à ses sélections."
- "Sans engagement**s**" (avec `s`) → "Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire."

### 6.4 Inconnues persistantes (`??`)

- **Couleurs exactes** des 3 icônes (assets image PNG) — présumées `accent` (#DFB968) d'après le screenshot.
- **Couleur exacte** de la ligne décorative verticale du titre (asset image) — présumée `accent`.
- **Couleur exacte** des 2 dividers verticaux 1×192 (assets image) — présumés gradient doré identique au Hero Trust row (`linear-gradient(to bottom, transparent 0%, #DFB968 51%, transparent 100%)` à opacity ~30%).
- **États hover / focus** : non maquettés (section purement statique de toute façon — pas d'interaction sur les piliers).
- **Variante mobile** : non extraite ici (cette spec couvre desktop uniquement).

---

## 7. Récap structuré pour l'intégration

```jsx
<section className="pourquoi-plarya">  {/* py = section-y (64) haut, section-y (64) bas */}
  <div className="container max-w-content mx-auto">

    {/* Header — réutilisation du SectionTitle, avec gestion du "?" doré */}
    <SectionTitle
      title="Pourquoi Plarya"
      titleSuffix={<span className="text-accent"> ?</span>}
      // OU directement title="Pourquoi Plarya ?" + parsing du "?" en interne
    />

    {/* Gap 32px (header → content) — plus serré que les autres sections */}

    {/* Card content (encadrée) */}
    <div className="mt-8 flex items-center justify-center gap-12 rounded-2xl bg-black/40 px-22 py-2">
      <Pillar
        icon="weui:time-outlined"
        title="Gain de temps"
        description="Accédez directement aux analyses.\nPas de recherche, pas de bruit."
      />
      <DividerVertical height={192} />
      <Pillar
        icon="mynaui:lightning"
        title="Simple"
        description="Tout est prêt. Choisissez un expert,\naccédez à ses sélections."
      />
      <DividerVertical height={192} />
      <Pillar
        icon="quill:creditcard"
        title="Sans engagements"
        description="Paiement à l'acte. 3,50€ le jour,\nsans abonnement obligatoire."
      />
    </div>

  </div>
</section>

// Composant Pillar (vertical stack, distinct du TrustItem du Hero) :
function Pillar({ icon, title, description }) {
  return (
    <div className="flex flex-col items-start">
      <Icon icon={icon} className="size-[30px] text-accent" />
      <h3 className="mt-6 font-body text-h4 text-foreground">{title}</h3>
      <p className="mt-4 font-body text-body-16 text-muted-foreground whitespace-pre-line">
        {description}
      </p>
    </div>
  );
}
```

À l'implémentation, **factoriser le `DividerVertical`** (gradient doré) avec celui du Hero Trust row — même CSS, juste une prop `height` (96 pour Hero / 192 pour Pourquoi Plarya).
