# Domain Card — Spec extraite du Figma

**Source Figma** : `vxkUD2k0gxROZEGZLlSFqb`
- Conteneur des 3 cards : node `87:169` ("Domains"), parent direct contenant les 3 variantes
- Section parente : node `87:211` ("2. Explore les domaines")
- Variantes : Sport `87:68`, Esport `87:170`, Hippique `87:182`

Les **3 variantes** sont confirmées comme des frames sœurs dans le conteneur "Domains". Structure identique pour les 3, seuls l'image de fond, le titre et la liste de sports/jeux changent. Le conteneur "Domains" lui-même est un **flex horizontal avec `gap: 16px`** (`content-stretch flex gap-[16px] items-center`).

---

## 1. Card — conteneur

| Propriété | Valeur Figma | Notes |
|---|---|---|
| Outer wrapper | `<div className="relative size-full">` | Pas de largeur/hauteur explicite sur le node lui-même → dépend du parent (Figma "Auto-layout" probable). |
| Largeur (déduite) | `381px` | Confirmée via l'image de fond (`w-[381px]`). |
| Hauteur (estimée) | `≈ 335px` | Calculée : bouton à `top-[271px]` + bouton ~41px + bas-padding ~24px ≈ 335. Conforme à la valeur déjà notée dans `design-system.md` L253 (`381 × 335`). |
| Background propre | **aucun** | L'outer div est `relative shrink-0 w-[381px] h-[335px]` (Hippique a en plus `overflow-clip`). Pas de `bg-*`. Le fond visible vient uniquement de l'image (avec son mask). |
| Border | **AUCUNE** ✅ confirmé sur les 3 variantes | ❌ Le `design-system.md` annonçait `1px solid #E1AA36` — **c'est faux**. Vérifié sur les 3 nodes `87:68` / `87:170` / `87:182` via `get_design_context` du conteneur parent `87:169`. La border 0.5px #e1aa36 existe **uniquement sur le bouton "Voir les analyses"**, pas sur la card. |
| Box-shadow | **AUCUNE** ✅ confirmé sur les 3 variantes | ❌ Le `design-system.md` annonçait `Shining Effect 2` (`0 0 7px #DFB968`) — **c'est faux**. Aucune shadow sur les 3 nodes de card. Le `Shining Effect` (`0 0 15px rgba(255,174,0,0.7)`) existe **uniquement sur le bouton "Voir les analyses"**. |
| Border radius | `16px` | Appliqué sur l'image (via `rounded-[16px]`) et sur le bouton. L'outer div n'a pas de `rounded-*` direct mais le visuel rendu est arrondi (l'image masquée + son mask matérialisent la forme). À l'implémentation : ajouter `rounded-2xl` (= 16px) + `overflow-hidden` sur le conteneur outer. |

---

## 2. Image de fond

| Propriété | Valeur Figma |
|---|---|
| Dimensions visibles | `381 × 249px` (`w-[381px] h-[249px]`) |
| Positionnement | `absolute inset-0` dans une div `top-0 left-0` |
| `object-fit` | `object-bottom` (image alignée en bas) |
| Border radius | `16px` |
| **Masque alpha** (effet de fondu) | `mask-image: url('<asset PNG>')` + `mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_0px] mask-size-[381px_271px]` |
| Note sur le masque | Le masque est **plus haut que la box** (271 vs 249) → définit un dégradé d'opacité qui fait s'estomper le bas de l'image vers le fond de la card. C'est ce qui produit le dégradé visible sous le titre "SPORT" dans le rendu. |
| Asset photo | Image PNG du stade (extraite via Figma — URL temporaire 7 jours) |

> 💡 **Implémentation suggérée** : ne pas tenter de reproduire le `mask-image` Figma tel quel (le PNG du masque est une dépendance fragile). Remplacer par une superposition CSS d'un gradient vertical `linear-gradient(to bottom, transparent ~50%, var(--color-background) 100%)` sur l'image — visuellement équivalent et indépendant des assets Figma.

---

## 3. Titre (`SPORT`, `ESPORT`, `HIPPIQUE`)

| Propriété | Valeur Figma |
|---|---|
| Texte | `SPORT` (variante extraite) |
| Position | `absolute left-[34.29px] top-[155px]` |
| Font-family | Work Sans |
| Font-weight | Medium (500) |
| Font-size | `32px` |
| Line-height | `normal` (style `H3` du DS : `lineHeight: 100` = 100% du font-size ≈ 32px) |
| Couleur | `#FFFFFF` |
| Casse | MAJUSCULES dans le texte source |

---

## 4. Sous-titre (`Football, Basketball, Tennis, MMA et plus`)

| Propriété | Valeur Figma |
|---|---|
| Texte | 2 lignes : `Football, Basketball, Tennis,` puis `MMA et plus` |
| Position | `absolute left-[36.29px] top-[209px]` (= 54px sous le titre, +2px de décalage horizontal vs titre) |
| Font-family | Work Sans |
| Font-weight | Regular (400) |
| Font-size | `16px` |
| Line-height | `16px` |
| Couleur | `#898181` (muted-foreground) |
| Découpe | 2 paragraphes `<p>` séparés (saut de ligne dur, pas un wrap auto) |

---

## 5. Bouton "Voir les analyses" (CTA en bas)

| Propriété | Valeur Figma |
|---|---|
| Position | `absolute left-[34px] top-[271px]` |
| Largeur | non explicite → s'auto-dimensionne (texte + padding + gap + icône) |
| Hauteur | `≈ 41px` (déduit du padding et du contenu) |
| Background | `linear-gradient(to right, rgba(223,185,104,0.8) 0%, rgba(255,255,255,0.8) 100%)` — **version 80% du Figma**. ⚠️ Notre token DS `--background-image-gradient-gold` a été **mis à jour en 100%** (cf. décisions session du 19/05/2026). Si tu veux matcher pixel-perfect le Figma, repasser à 80% ; sinon assumer la divergence. |
| Border | `0.5px solid #E1AA36` (Golden Stroke) |
| Box-shadow | `0px 0px 15px 0px rgba(255,174,0,0.7)` (Shining Effect plein — `--shadow-shine` du DS) |
| Padding | `16px vertical / 32px horizontal` (`py-[16px] px-[32px]`) |
| Gap texte ↔ icône | `16px` (`gap-[16px]`) |
| Border radius | `16px` |
| Texte | `Voir les analyses` — Work Sans Regular 16 / lh 16, couleur `#000000` |
| Icône fléche → | Vecteur 6 × 15.124px rotation 90° (= flèche horizontale droite). Asset SVG `imgVector`. **Couleur ??** (asset SVG, non extractible directement — visuellement noire pour matcher le texte). |

### Variant Button à utiliser
→ **variant `primary` size `default`** du composant `components/ui/button.tsx`.
- Background `bg-gradient-gold` ✓
- Border `accent-strong` (`#e1aa36`) ✓
- Box-shadow `shadow-shine` constant (refactor déjà fait) ✓
- Texte `text-black`, gap `gap-4` (= 16px, déjà dans la base class) ✓
- Padding par défaut du variant : `px-8 py-4` (32/16) — match parfait avec Figma 32/16 ✓
- Border `0.5px` Figma vs `1px` du variant → écart visuel négligeable, **garder 1px** côté implémentation (le navigateur arrondit `0.5px` en 1px en pratique).

---

## 6. Styles globaux référencés par la frame

`get_design_context` renvoie les styles utilisés :

| Style Figma | Valeur exacte | Mapping DS |
|---|---|---|
| `Body 16px` | Work Sans Regular 16 / lh 16 / ls 0 | `text-body-16` |
| `H3` | Work Sans Medium 32 / lh 100 / ls 0 | `text-h3` (token `--text-h3` du `globals.css`) |
| `Btn gradient` | linear gradient or (valeur définie ailleurs) | `--background-image-gradient-gold` |
| `Golden Stroke` | `#E1AA36` | `--color-accent-strong` |
| `Shining Effect` | drop-shadow `#FFAE00B2`, offset (0,0), radius 15, spread 0 | `--shadow-shine` |

---

## 7. Écarts avec `design-system.md` §6 (lignes 247-257)

| # | Sujet | `design-system.md` | Réalité Figma | Action |
|---|---|---|---|---|
| 1 | Image de fond — traitement | "`object-cover`, masque `rounded-[16px]`" | `object-bottom` + **mask-image** (alpha PNG) + `rounded-[16px]` | DS à corriger : ce n'est pas un `object-cover` simple, c'est un mask alpha. À l'implémentation : remplacer par un gradient overlay (cf. §2 ci-dessus). |
| 2 | Border card | `1px solid #E1AA36` (Golden Stroke) | **Non vue dans l'extract du node `87:68`** | À confirmer — voir §10. Possiblement appliquée par le parent frame. |
| 3 | Box-shadow card | `Shining Effect 2` (`0 0 7px #DFB968`) | **Non vue dans l'extract du node `87:68`** | À confirmer — voir §10. Idem. |
| 4 | Border radius card | `16px` | `16px` sur image et bouton | ✓ Conforme |
| 5 | Dimensions | `381 × 335` | `381 × ≈ 335` (estimé) | ✓ Conforme |
| 6 | Padding card | `32px` | Marges internes ≈ `32-34px` côté texte/bouton (titre à `left-[34.29px]`, bouton à `left-[34px]`) | ✓ Conforme |
| 7 | Titre | Work Sans Medium 32 blanc | Work Sans Medium 32 / lh normal / `#FFFFFF` | ✓ Conforme |
| 8 | Sous-titre | Work Sans Regular 16, `#898181` | Work Sans Regular 16 / lh 16 / `#898181` | ✓ Conforme |
| 9 | CTA | "Btn gradient, voir Primary" | Bouton gradient or, padding `32/16`, shadow Shining Effect, border 0.5px Golden Stroke | ✓ Conforme — utiliser variant Button `primary` size `default`. **Note** : gradient encore en 80% dans le Figma, on assume la divergence avec notre token 100%. |
| 10 | Espacements internes (positions Y) | non documenté | Titre `top-[155px]`, sous-titre `top-[209px]` (= 54px sous le titre), bouton `top-[271px]` (= 62px sous le sous-titre). Image en haut s'étend de 0 à 249. | À ajouter au DS — voir §9 ci-dessous. |

---

## 8. Les 3 variantes — Sport / Esport / Hippique ✅ confirmées

Récupérées via `get_design_context` sur le conteneur parent `87:169`. Structure identique pour les 3 (même template), seuls 3 éléments changent :

| | **Sport** (`87:68`) | **Esport** (`87:170`) | **Hippique** (`87:182`) |
|---|---|---|---|
| Titre | `SPORT` | `ESPORT` | `HIPPIQUE` |
| Sous-titre (ligne 1) | `Football, Basketball, Tennis,` | `CS2, Lol, Valorant, Dota 2,` | `Saut d'obstacles, Horseball` *(1 ligne seulement, pas de saut)* |
| Sous-titre (ligne 2) | `MMA et plus` | `et plus` | — |
| Image de fond | stade de foot la nuit | setup esport éclairé en orange | jockeys en course |
| Hauteur image source | `249px` (la mask étend à 271) | `368px` (image plus haute, mask 271) | `368px` (image plus haute, mask 271) |
| Position X bouton (gauche dans la card) | `left-[34px]` | `left-[36px]` | `left-[36px]` |

Toutes les autres valeurs (dimensions card, position titre/sous-titre, style bouton, typo, couleurs) sont **strictement identiques** entre les 3 variantes.

> ⚠️ **Note vocabulaire** : Le CLAUDE.md §5 mentionne actuellement "**Gaming**" comme 3e domaine ("Arrive bientôt..."). Le Figma utilise "**HIPPIQUE**" avec contenu actif (pas un "coming soon"). Divergence à trancher avec le client : on garde Hippique ? On ajoute Hippique en plus de Gaming ? À clarifier.

### Détail technique sur la structure "Background" interne

D'après la metadata Figma, chaque card a un sous-frame "Background" contenant **2 rounded-rectangles** :
- Un nommé `"gradient"` (rond-rect 381×271)
- Un nommé `"image"` (rond-rect 381×249 pour Sport, 381×368 pour Esport/Hippique)

Mais le `get_design_context` du conteneur parent **ne fait apparaître qu'une seule couche** dans le rendu (l'image avec son mask alpha). Le calque "gradient" est soit fusionné par l'export MCP, soit invisible/redondant. **Pas besoin de tenter de le reproduire** — l'image avec son fade-mask suffit à reproduire le visuel.

---

## 9. Espacements internes confirmés (à ajouter au DS)

| Élément | Position Y (absolu, depuis le haut de la card) |
|---|---|
| Image de fond | `0` → `249` (hauteur 249, masque alpha étendu à 271) |
| Titre `SPORT` | `155` |
| Sous-titre (1ère ligne) | `209` (= 54px sous le titre) |
| Sous-titre (2e ligne) | `225` (= 16px lh) |
| Bouton CTA | `271` (= 62px sous la fin du sous-titre, soit 46px sous la 1ère ligne du sous-titre + 16px lh) |
| Bouton CTA — bas | `≈ 312` (271 + 41px de hauteur bouton) |

Espacements relatifs :
- Image-bottom → Titre : **−94px** (le titre chevauche l'image, c'est l'effet du fade-mask qui le permet)
- Titre-bottom → Sous-titre : **22px** (titre 155-187, sous-titre 209)
- Sous-titre-bottom → Bouton-top : **30px** (sous-titre 209-241, bouton 271)
- Bouton-bottom → Card-bottom : **≈ 23px** (bouton 312, card 335)

---

## 10. Valeurs `??` (non extractibles)

- **Couleur exacte de la flèche →** dans le bouton CTA : asset SVG `imgVector`. ❌ Non extractible directement. Visuellement noire pour matcher le texte du bouton — à l'implémentation, utiliser `currentColor` qui héritera du `text-black` du variant `primary`.

### Inconnues levées (mise à jour 2026-05-19)

| Question | Réponse |
|---|---|
| Border sur la card ? | **NON** ❌ Le DS doc s'était trompé. Vérifié sur les 3 variantes. |
| Glow/shadow sur la card ? | **NON** ❌ Le DS doc s'était trompé. Vérifié sur les 3 variantes. |
| 3 variantes existent ? | **OUI** ✅ Sport / Esport / Hippique — voir §8 pour titres + sous-titres exacts. |

### Reste à corriger dans `design-system.md` §6 "Card Domaine"

Lignes 250-251 du DS doc à supprimer/corriger :
- ❌ `Border : 1px solid #E1AA36 (Golden Stroke)` → **AUCUNE BORDER**
- ❌ `Box-shadow : Shining Effect 2 (0 0 7px #DFB968) — glow doré doux` → **AUCUNE SHADOW**

Le glow doré qu'on voit dans la maquette vient **exclusivement du bouton "Voir les analyses"** qui projette son `Shining Effect` autour de lui. Il n'y a pas de glow sur la card elle-même.
