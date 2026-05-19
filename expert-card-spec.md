# Expert Card — Spec extraite du Figma

**Source Figma** : `vxkUD2k0gxROZEGZLlSFqb`
- Unlocked : node `94:619` (Expert Card Unlocked)
- Locked : node `119:13` (Expert Card Locked)

Les deux états partagent **exactement la même structure interne** sauf le bouton du bas. Toutes les valeurs ci-dessous sont extraites directement de `get_design_context`. Les valeurs non extractibles sont marquées `??` et signalées en clair.

---

## 1. Card — conteneur

| Propriété | Valeur Figma | Notes |
|---|---|---|
| Background | `rgba(0, 0, 0, 0.4)` | Voir ⚠️ ci-dessous |
| Border | aucune | — |
| Box-shadow | aucune | — |
| Border radius | `16px` | — |
| Padding | `16px` horizontal · `32px` vertical | `px-[16px] py-[32px]` |
| Dimensions | **largeur ≈ 322px** (= 290 bouton + 16×2 padding) · **hauteur ≈ 419px** (calculée : 32 top padding + 314 mt button + 41 button + 32 bottom padding) | Pas de largeur/hauteur explicite sur le node, déduit de la composition |
| Layout interne | `inline-grid` avec offsets `ml-*` / `mt-*` absolus | Tous les enfants positionnés par offset depuis le coin haut-gauche du content |

> ⚠️ **Card background `rgba(0,0,0,0.4)`** : sur la frame Figma (canvas clair), cette valeur produit le gris visible sur la screenshot. Sur fond noir réel du projet, le rendu serait quasi imperceptible. **Soit le DS Figma est conçu pour vivre sur un layer plus clair, soit cette valeur est un artefact d'édition.** À clarifier avec le designer avant implémentation.

---

## 2. Profile Pic

| Propriété | Valeur Figma |
|---|---|
| Position | `ml-0 mt-0` (coin haut-gauche du content) |
| Dimensions | `68 × 68px` |
| Forme | **Pas de `rounded-full` dans le code** — l'asset PNG est circulaire. Visuellement rond. À matérialiser via `rounded-full` côté implémentation pour ne pas dépendre du crop de l'asset. |
| Bordure | aucune dans le DS Figma extrait |

---

## 3. Pseudo (`MultiSport`)

| Propriété | Valeur Figma |
|---|---|
| Position | `ml-[84px] mt-[11px]` |
| Font-family | Work Sans |
| Font-weight | Medium (500) |
| Font-size | `20px` |
| Line-height | `normal` (style `H5` du DS : `lineHeight: 100` = 100% donc ≈ 20px) |
| Couleur | `#FFFFFF` |
| `whitespace-nowrap` | oui |

---

## 4. Label `EXPERT`

| Propriété | Valeur Figma |
|---|---|
| Position | `ml-[86px] mt-[50px]` |
| Font-family | Work Sans |
| Font-weight | Regular (400) |
| Font-size | `16px` |
| Line-height | `16px` |
| Couleur | `#dfb968` (accent or principal) |

---

## 5. Compteur `152 vues`

| Propriété | Valeur Figma |
|---|---|
| Position | `ml-[157px] mt-[50px]` (même ligne que `EXPERT`) |
| Font-family | Work Sans |
| Font-weight | Regular (400) |
| Font-size | `16px` |
| Line-height | `16px` |
| Couleur | `#898181` (muted-foreground) |

---

## 6. Icônes catégorie (3 sports)

| Propriété | Valeur Figma |
|---|---|
| Taille du conteneur | `21.154 × 21.154px` |
| Fond | `#181818` (surface-elevated) |
| Border radius | `8px` |
| Taille de l'icône intérieure | `13 × 13px` (basketball, football) ou `16 × 16px` (boxing-glove), centrée |
| Espacement horizontal entre icônes | **8px** (positions ml-[204], ml-[233], ml-[262] → écart de 29px - 21px conteneur = 8px) |
| Position verticale | `mt-[12px]` (ou `mt-[13px]` pour basketball — léger off-by-one dans Figma) |
| Ordre observé (gauche→droite) | football · basketball · boxing-glove |

---

## 7. Divider

| Propriété | Valeur Figma |
|---|---|
| Position | `ml-[20px] mt-[114px]` |
| Largeur | `247px` |
| Épaisseur | `1px` (`h-0` + `inset-[-1px_0_0_0]`) |
| Couleur | **`??` — rendu via asset image, pas une règle CSS.** Visuellement faible opacité dorée/blanche. À confirmer via `get_variable_defs` ou pipette sur la maquette. |

---

## 8. Label `2 ANALYSES DU JOUR`

| Propriété | Valeur Figma |
|---|---|
| Position | `ml-0 mt-[162px]` |
| Font-family | Work Sans |
| Font-weight | Regular (400) |
| Font-size | `16px` |
| Line-height | `16px` |
| Couleur | `#898181` (muted-foreground) |
| Casse | MAJUSCULES dans le texte source |

---

## 9. Liste des analyses (2 lignes)

Container `Analyses` positionné à `ml-px mt-[194px]`.

### Structure d'une ligne

| Élément | Détail Figma |
|---|---|
| Icône de gauche | Vecteur `6 × 14.7px` **rotation 90°** → arrow horizontale `→`. Positionnée à `ml-0`. **Pas un chevron, pas un cadenas.** |
| Nom du match | Position `ml-[37.93px]` (donc gap arrow→texte ≈ 23px). Work Sans Regular 16 / lh 16, couleur `#FFFFFF`, `whitespace-nowrap`. |
| Icône "analyse du jour" (★) | Vecteur `10.78 × 10px`, position `ml-[168px]` de la ligne. **Présente uniquement sur la 1ère analyse** (`Celtics - Knicks`). Asset étoile dorée. |
| Espacement vertical entre 2 lignes | `mt-[24px]` |

### Contenu observé (mock Figma)

1. `Celtics - Knicks ` (avec étoile dorée à droite)
2. `UFC Fight Nights` (sans étoile)

---

## 10. Bouton du bas — variant utilisé + gap

Position dans le content : `ml-0 mt-[314px]` (commun aux deux états).

| Propriété | Unlocked | Locked |
|---|---|---|
| Background | `#FFFFFF` | `#181818` |
| Texte | `Accèder (3,50€)` — couleur `#000000` | `Terminé pour aujourd'hui` — couleur `#898181` |
| Font | Work Sans Regular 16 / lh 16 | Work Sans Regular 16 / lh 16 |
| Largeur | `290px` (fixe) | `290px` (fixe) |
| Hauteur | `41px` (fixe) | `41px` (fixe) |
| Padding | `16px 72px` (V / H) | `16px 48px` |
| Border radius | `16px` | `16px` |
| Border / Shadow | aucune | aucune |
| Icône fléche `→` à droite | présente (vecteur `6 × 15.124px` rotation 90°, `ml-[137.64px]`, gap texte↔flèche ≈ 8px) | **absente** |

### Variant Button à utiliser
→ **variant `white` du composant `components/ui/button.tsx`**.
- Le `disabled:bg-surface-elevated` (`#181818`) + `disabled:text-muted-foreground` (`#898181`) déjà en place produit bien le rendu Locked.
- ⚠️ **Le padding actuel du variant `white` est `px-8 py-4` (= 32 / 16) via size `default`.** Figma demande `px-72 py-16` unlocked et `px-48 py-16` locked. **C'est un écart à régler** : soit largeur fixe `w-[290px]` + `justify-center` (et on ignore le padding horizontal qui devient cosmétique), soit on crée des sizes custom pour ce variant. La largeur fixe 290px est probablement la bonne approche.

### Gap card ↔ bouton
Le bouton commence à `mt-[314px]` dans le content. La 2ème analyse occupe `mt-[218px]` à `mt-[234px]` (lh 16). **Gap vertical entre la fin de la liste analyses et le haut du bouton ≈ 80px.**

---

## 11. Différences Unlocked vs Locked

Hors bouton, **strictement identiques** (mêmes positions, mêmes textes, mêmes assets pour la photo / icônes / divider).

| Champ | Unlocked | Locked |
|---|---|---|
| Background bouton | `#FFFFFF` | `#181818` |
| Texte bouton | `Accèder (3,50€)` | `Terminé pour aujourd'hui` |
| Couleur texte bouton | `#000000` | `#898181` |
| Padding horizontal bouton | `72px` | `48px` |
| Flèche → à droite du bouton | oui | non |
| Reste de la card (matchs, étoile, ★, vues, icônes, divider, profile pic, pseudo, label EXPERT) | identique | identique |

> Conséquence design : sur la version Locked, **les noms des matchs et l'étoile "analyse du jour" restent visibles**. Seul le pick / CTA d'accès change. Conforme à la règle CLAUDE.md §5 ("matchs visibles, seul le pick reste caché").

---

## 12. Écarts avec `design-system.md` §6 (lignes 228-245)

| # | Sujet | `design-system.md` | Réalité Figma | Action |
|---|---|---|---|---|
| 1 | Card background | `rgba(0, 0, 0, 0.4)` (`bg-black/40`) | `rgba(0, 0, 0, 0.4)` | ✓ Conforme — mais voir ⚠️ §1 sur le rendu réel |
| 2 | Dimensions card | `322 × 422` | `322 × ≈ 419` (calculé) | Quasi-conforme (delta 3px probablement arrondi) |
| 3 | Profile Pic — forme | "cercle (`rounded-full`)" | Pas de `rounded-full` dans le code — c'est l'asset PNG qui est circulaire | À matérialiser en CSS (`rounded-full`) côté implémentation |
| 4 | Profile Pic — taille | "68px (DS) / 82px (V1)" | `68 × 68` | ✓ Conforme |
| 5 | Pseudo | Work Sans Medium 20 blanc | Work Sans Medium 20 / lh normal / `#FFFFFF` | ✓ Conforme |
| 6 | Label EXPERT | Work Sans Regular 16 / `#DFB968` | Work Sans Regular 16 / lh 16 / `#dfb968` | ✓ Conforme |
| 7 | Compteur vues | Work Sans Regular 16 / `#898181` | Work Sans Regular 16 / lh 16 / `#898181` | ✓ Conforme |
| 8 | Categories | "icônes 21.154 × 21.154, fond `#181818`, radius `8px`" | Idem + gap 8px entre chaque + icône intérieure 13 ou 16px | ✓ Conforme — **ajout** : espacement 8px non documenté |
| 9 | Divider | "247px, 1px, blanc faible opacité" | 247 × 1px — **couleur ?? (asset image, non extractible)** | À confirmer (couleur exacte non vérifiée — pas forcément "blanc faible opacité") |
| 10 | "2 ANALYSES DU JOUR" | Work Sans Regular 16 / `#898181` | Idem | ✓ Conforme |
| 11 | **Liste analyses — icônes** | "nom du match en blanc + **chevron + cadenas**" | Arrow `→` à gauche + ★ **uniquement sur la 1ère ligne** (marqueur "analyse du jour"). **Aucun cadenas.** | ⚠️ **Écart majeur** : pas de cadenas dans le Figma. L'étoile marque l'analyse du jour, pas un état lock. Le `design-system.md` est à corriger. |
| 12 | CTA bas | "`Accéder (3,50€)` (unlocked) ou `Terminé pour aujourd'hui` (locked)" | Idem — texte exact Figma : `Accèder (3,50€)` (note : graphie avec accent grave dans Figma, à vérifier si volontaire) | ✓ Conforme sur la mécanique ; **typo à vérifier : `Accèder` ou `Accéder` ?** |
| 13 | Bouton — padding | `16/72` unlocked, `16/48` locked (§6 design-system.md L212-221) | Idem | ✓ Conforme |
| 14 | Bouton — variant | non spécifié | → variant `white` (Plarya DS) | À acter dans le DS |
| 15 | Gap card ↔ bouton | non spécifié | ≈ 80px entre la fin de la liste analyses et le bouton | À ajouter au DS |
| 16 | Espacement entre les 2 lignes d'analyses | non spécifié | `24px` (mt-[24px]) | À ajouter au DS |

---

## 13. Valeurs `??` (non extractibles depuis `get_design_context`)

- **Couleur exacte du divider** : asset image, pas de règle CSS. ❌ Non extractible via `get_variable_defs`.
- **Couleur exacte de l'arrow `→`** (icône à gauche de chaque ligne d'analyse) : asset SVG, pas de fill CSS extrait. ❌ Non extractible via `get_variable_defs`.
- **Couleur exacte de l'étoile ★** : asset SVG. ❌ Non extractible via `get_variable_defs`.

### Tentative `get_variable_defs` sur node `94:619` (frame Expert Card Unlocked)

Appel effectué le 2026-05-19. **Résultat** : la frame n'expose **aucune variable de couleur**, uniquement 3 styles typographiques (`Body 14px`, `Body 16px`, `H5`). Les 3 assets (divider, flèche, étoile) sont des fills SVG/image bruts **non liés à des variables Figma**.

→ **Conclusion** : les couleurs exactes ne sont pas récupérables par MCP. Pour les obtenir précisément, les options restantes sont :
1. Pipette visuelle directement dans Figma (ouvrir le fichier, cliquer sur l'asset, lire le fill dans le panneau de droite)
2. Téléchargement de l'asset SVG et lecture du `fill=` dans le code XML
3. Estimation visuelle depuis la screenshot (les 3 éléments apparaissent dorés, vraisemblablement `#dfb968` ou variante, mais **non confirmé**)

À ce stade du spec : laisser les 3 valeurs en `??` et ne pas inventer.
