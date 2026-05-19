# Header (TopBar) — Spec extraite du Figma

**Source Figma** : `vxkUD2k0gxROZEGZLlSFqb`
- Node extrait : `80:740` (frame nommée "TopBar")

> ⚠️ **État maquetté = CONNECTÉ uniquement.** Le Figma ne montre que la version utilisateur connecté avec les 3 items `Dashboard / Mon Compte / Déconnexion`. **Pas de version "déconnecté"** (pas de boutons `Se connecter` / `Créer un compte`). Soit la version déconnectée n'a pas été maquettée, soit elle existe ailleurs dans le fichier — à clarifier avec le client. Pour le MVP : on devra créer la version déconnectée en se basant sur le DS existant.

---

## 1. Conteneur

| Propriété | Valeur Figma |
|---|---|
| Layout | `flex items-center justify-between` |
| Width | `size-full` (full-bleed — pleine largeur du viewport) |
| Hauteur | non explicite — déduit à **≈ 70px** : `py-[8px]` (8 top + 8 bottom = 16) + contenu logo `h-[54px]` ≈ 70px |
| Background | `rgba(0, 0, 0, 0.3)` (`bg-black/30`) — **noir semi-transparent à 30%**, PAS totalement transparent comme indiqué dans le DS doc |
| Padding | `128px` horizontal · `8px` vertical (`px-[128px] py-[8px]`) |
| Border | aucune |
| Box-shadow | aucune |

> 📝 **Sur le rendu Figma** (canvas clair), le `bg-black/30` apparaît gris. Sur fond noir réel du projet, ce sera quasi imperceptible. Comportement attendu : sur la homepage avec le hero photo en dessous, le `bg-black/30` crée un voile sombre pour que le texte de la nav reste lisible quel que soit le contenu sous-jacent. **Sticky / fixed à confirmer.**

---

## 2. Logo

| Propriété | Valeur Figma |
|---|---|
| Position | À gauche du conteneur (`justify-between` pousse à gauche) |
| Dimensions du slot | `152 × 54px` (`w-[152px] h-[54px]`) |
| Padding gauche depuis le bord du viewport | `128px` (= padding horizontal du conteneur, qui sert aussi de colonne de layout) |
| Asset | Image `imgLogo` (URL temporaire 7 jours). Le Figma rend en `<img>` positionné en absolu avec offsets `top-[-107.32%] left-[-40.28%] h-[337.8%] w-[181.44%]` — c'est un **crop sur une image source plus grande** (probablement l'asset full-logo+texte, dont on n'affiche qu'une portion centrale). |
| Notes d'implémentation | Le projet a déjà `/frontend/public/full-logo-remove.png` (logo P + texte PLARYA sur fond transparent) — c'est probablement cet asset qu'on doit utiliser directement, sans le cropping foireux du Figma. Le Figma a importé une version sprite que le designer a recadrée à l'écran. |

---

## 3. Navigation (état connecté)

| Propriété | Valeur Figma |
|---|---|
| Position | À droite du conteneur (`justify-between`) |
| Layout interne | `content-stretch flex items-center justify-center gap-[64px]` |
| Gap entre items | **`64px`** |
| Items (3) | `Dashboard` · `Mon Compte` · `Déconnexion` |
| Font-family | Work Sans |
| Font-weight | Regular (400) |
| Font-size | `16px` |
| Line-height | `16px` |
| Couleur | `#FFFFFF` (blanc) |
| `whitespace-nowrap` | oui |
| État active / hover | non défini dans le Figma (à designer) |

---

## 4. Boutons (Se connecter / Créer un compte)

| Propriété | Valeur Figma |
|---|---|
| Présence | **❌ ABSENTS du Figma** — seule la version connectée est maquettée. |

→ À designer côté implémentation. Suggestion cohérente avec le DS :
- `Se connecter` : variant `ghost` ou `secondary` du composant Button (transparent + bordure dorée)
- `Créer un compte` (CTA primaire) : variant `primary` du composant Button (gradient or)
- À valider avec le client avant code.

---

## 5. Écarts avec `design-system.md` §"Header / TopBar" (lignes 262-267)

| # | Sujet | `design-system.md` | Réalité Figma | Action |
|---|---|---|---|---|
| 1 | Hauteur | `70px` | `≈ 70px` (calculée 8+54+8) | ✓ Conforme |
| 2 | Full bleed | `oui` (w=1440) | `size-full` → oui | ✓ Conforme |
| 3 | Background | "**transparent** (le hero étant visible derrière)" | `rgba(0, 0, 0, 0.3)` — semi-transparent à 30% | ⚠️ **Écart** — le DS dit transparent, le Figma a un voile noir 30%. À corriger dans le DS doc. |
| 4 | Logo | `152 × 54px`, padding gauche 128px | `152 × 54px`, padding horizontal conteneur 128px | ✓ Conforme |
| 5 | Nav — items | `Dashboard, Mon Compte, Déconnexion` | Idem | ✓ Conforme |
| 6 | Nav — typo | Work Sans 16px | Work Sans Regular 16 / lh 16 / `#FFFFFF` | ✓ Conforme |
| 7 | Nav — gap | `64px` entre items | `gap-[64px]` | ✓ Conforme |
| 8 | Padding vertical interne | "~8px (logo) / 27px (nav text)" | `py-[8px]` sur le conteneur, nav `items-center` (donc centrée verticalement) | ✓ Conforme — le "27px" du DS doc correspond probablement à l'offset visuel du baseline du texte, pas à un padding explicite. |

---

## 6. Valeurs `??` (non extractibles)

- **État `déconnecté`** (boutons Se connecter / Créer un compte) — pas dans le Figma à ce node. Possiblement dans un autre frame du fichier ; sinon à designer.
- **État `hover` / `active`** des items de nav — pas dans le Figma.
- **Comportement `sticky` / `fixed` au scroll** — pas extractible d'une frame statique. À trancher (CLAUDE.md §5 mentionne "navbar avec 'Se connecter'" sans préciser le comportement).
- **Couleur exacte du logo asset** — c'est une image PNG/SVG. Visuellement doré P + doré texte PLARYA + slogan, mais pipettable directement depuis le projet (`/frontend/public/full-logo-remove.png`).
