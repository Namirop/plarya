# Dashboard Expert — Spec d'intégration (desktop)

> Source : Figma `vxkUD2k0gxROZEGZLlSFqb`, frame "2. Dashboard" (node `114:20`)
> Viewport : **1440px**
> Hauteur frame ≈ **2253px** (la div `Gradient Background` mesure 3057px mais déborde sous le contenu — la limite visuelle utile est la fin des sections vers y≈2132)
> Référence DS : `design-system.md` · Header : `header-spec.md`
> Date d'extraction : 2026-05-20

---

## 0. Repères d'extraction

L'extraction `get_design_context` est cette fois **complète** (pas de rate-limit). On a accès aux positions, typos, couleurs natives. Les zones encore non-natives (formulaire et corps des cards d'analyses) sont identifiées explicitement plus bas.

### Convention d'unités

Les positions Figma sont exprimées en `calc(<pct>% + Npx)` relatif à la largeur frame (1440px) :

| Expression Figma | Valeur résolue |
|---|---|
| `calc(20% − 4px)` | 284 |
| `calc(20% + 16px)` | 304 |
| `calc(20% + 28px)` | 316 |
| `calc(40% + 4px)` | 580 |
| `calc(40% + 24px)` | 600 |
| `calc(60% + 12px)` | 876 |
| `calc(60% + 32px)` | 896 |
| `calc(30% + 87px)` | 519 |

→ Les sections principales sont **ancrées à x=284**, largeur **872**, donc padding latéral symétrique **284 / 284** (cf. §"Layout général").

---

## 1. Vue d'ensemble (top → bottom)

| Section | y_start | y_end | Hauteur | Statut |
|---|---|---|---|---|
| TopBar (header) | 0 | 70 | 70 | ✅ natif (réutiliser `<Header>`) |
| Titre pseudo "BetKing" | 172 | 232 | 60 | ✅ natif |
| Stats row (3 cards) | 264 | 386 | 122 | ✅ natif |
| Titre "Publier une analyse" | 450 | 494 | 44 | ✅ natif |
| Container "Publier" + form | 526 | 1386 | 860 | ⚠️ container natif, **form en screenshot** |
| Titre "Mes analyses (12)" | 1450 | 1494 | 44 | ✅ natif |
| Card analyse #1 | 1526 | 1770 | 244 | ⚠️ container natif, **contenu en screenshot** |
| Card analyse #2 | 1786 | 2030 | 244 | ⚠️ idem |
| Divider décoratif | 2126 | 2132 | 6 | ✅ natif (réutiliser pattern homepage) |

---

## 2. Layout général

- **Viewport cible** : 1440px (desktop, mobile non designé sur cette frame)
- **Container principal max-width** : `872px` (toutes les sections sauf TopBar et background)
- **Padding latéral** : `(1440 − 872) / 2 = 284px` de chaque côté
- ⚠️ Le container du Dashboard (**872**) est **plus étroit** que celui de la homepage (1175). Choix design délibéré — Dashboard = surface de travail concentrée.
- **Padding vertical** : section → section = **64px** ; titre → container = **32px** ; card → card = **16px**. Règle "multiples de 8" appliquée partout (cf. notes Figma de la designer).

### Background de page

Bloc `Gradient Background` (114:21) sur toute la frame :

```
1. bg-[#131212] (gris très sombre, légèrement plus chaud que pur #000)
2. img radial overlay (gradient doré) mix-blend-overlay opacity-20
3. 3 × radial gradients SVG dorés (mix-blend-lighten, opacity 0.1)
   - centre 1 : (170, 2061) — bas-gauche
   - centre 2 : (1287, 610) — droite haut
   - centre 3 : (1542, 2522) — hors champ bas-droite
   stops : rgba(255,174,0,1) → rgba(0,0,0,1) à offset 0.68
```

→ Cohérent avec la page d'accueil : page bg = base sombre `#131212` + ambient glows dorés. **Réutiliser** le pattern de background global déjà créé pour la home (probablement `app/globals.css` ou un composant `<PageBackground>`). À confirmer en croisant avec `frontend/app/globals.css` et le layout racine.

---

## 3. TopBar / Header (node 120:238)

```
position : left=-6 (≈ full-bleed), top=0, w=1440
bg       : rgba(0, 0, 0, 0.3)
display  : content-stretch flex items-center justify-between
padding  : px-128 py-8 (= 128px latéral, 8px vertical)
overflow : overflow-clip
```

### Logo (120:239)
- Dimensions : `152 × 54`
- Asset : `imgLogo` (logo Plarya doré, identique homepage)

### Nav (120:240)
- 3 items : **Dashboard**, **Mon Compte**, **Déconnexion**
- Layout : `flex gap-[64px] items-center justify-center`
- Typo : Work Sans Regular **16px**, leading-16, white
- Pas d'état actif designé dans la maquette (les 3 items sont stylés identiquement). À discuter : underline doré sur l'item actif ?

→ **Réutiliser `<Header>` partagé** (cf. `header-spec.md`) en mode "connecté" (les 3 items de nav sont déjà gérés côté composant).

---

## 4. Titre pseudo expert "BetKing" (node 114:69)

```
position : x=284, y=172, w=169, h=60 (whitespace-nowrap)
typo     : DM Serif Display Regular 48px, leading-60
couleur  : #FFFFFF
```

- Padding-top depuis le TopBar (y=70 → y=172) : **102px**
- Le pseudo est ici dans la même taille que les big numbers des stats (48px DM Serif) — c'est intentionnel : l'identité de l'expert "trône" en haut comme un titre. Le H1 de la page.

→ Mapper sur **`text-h2-desktop` du DS** (48px DM Serif, cf. `design-system.md`).

⚠️ Valeur dynamique : c'est le pseudo de l'expert connecté, à interpoler.

---

## 5. Stats row (node 114:110)

3 cards alignées horizontalement, gap **16px** :

| Card (id Figma) | x | y | w | h |
|---|---|---|---|---|
| Card "1" (114:80) | 284 | 264 | 280 | 122 |
| Card "3" (114:103) | 580 | 264 | 280 | 122 |
| Card "2" (114:93) | 876 | 264 | 280 | 122 |

Gaps : 580−564=16 ; 876−860=16 ✓ (gap-4 Tailwind = 16px).
Largeur totale row : `3 × 280 + 2 × 16 = 872` (= container).

⚠️ La nomenclature Figma est désordonnée (1 / 3 / 2 de gauche à droite) — artefact du fichier. Côté code, c'est juste 3 cards identiques.

### Card (280 × 122) — layout interne

Toutes les valeurs `y` ci-dessous sont relatives au top de la card (y=264 du frame).

```
container : bg-[rgba(0,0,0,0.4)] rounded-[16px]
└── header row @ y=18  (label + icône)
│     ├── icône ri:target-fill 24×24, left=14 (de la card)
│     └── label "RÉUSSITE", left=46, Work Sans Regular 18px, color #898181
│       (left=46 = 14 + 24 + 8 ⇒ gap icon→texte 8px)
└── valeur row @ y=50  (gros nombre + suffixe %)
      ├── "70", left=16, DM Serif Display Regular 48px, leading-60, white
      └── "%", left=69, Work Sans Regular 18px, leading-18, white
        (left=69 ≈ 16 + width(48px-glyphes deux chiffres) + ~5px)
```

### Tokens utilisés

- bg : `bg-black/40` (= rgba(0,0,0,0.4))
- radius : `rounded-2xl` (16px)
- icon color : **#DFB968** (cf. notes Figma — la designer a explicitement demandé "changer la couleur des icones en jaune #DFB968")
- label color : `#898181` (= `text-muted-foreground` du DS, à vérifier dans tokens)
- big number : `text-h2-desktop` (48px DM Serif) + leading-60
- suffixe % : `text-body-18` (Work Sans Regular 18px)

⚠️ **Les 3 cards montrent toutes "RÉUSSITE 70%"** dans la maquette = placeholder. Les 3 metrics réels sont à définir avec le client (CLAUDE.md §Dashboard évoque taux interne, ventes, revenus — mais "taux de réussite n'est PAS affiché en public" — ici c'est le dashboard expert privé, donc autorisé). À clarifier.

### Spacing

- Pseudo (y_end=232) → stats top (y=264) : **32px**

---

## 6. Section "Publier une analyse"

### 6.1 Titre (node 114:112)

```
position : x=284, y=450, w=278, h=44
typo     : DM Serif Display Regular 32px
couleur  : #FFFFFF
```

- Spacing stats (y_end=386) → titre (y=450) : **64px** (séparation de section)

→ Mapper sur **`text-h3-desktop` du DS** (32px DM Serif).

### 6.2 Container (node 114:122)

```
position : x=284, y=526, w=872, h=860
bg       : rgba(0, 0, 0, 0.4)
radius   : 16px
```

- Titre (y_end=494) → container top (y=526) : **32px**
- Hauteur fixe **860px** (le contenu interne le détermine, mais en code natif on laissera le container s'auto-dimensionner)

### 6.3 ⚠️ Form fields — non extractibles nativement

```
node 114:117 "screenshot" : 836 × 707, x=304, y=559
```

C'est **un rectangle aplati** dans Figma (image bitmap intégrée à la maquette), pas du contenu natif. Les champs visibles à l'œil sur la capture sont :

| Field (visible sur screenshot) | Type probable |
|---|---|
| Match * | input texte (placeholder "PSG - Marseille") |
| Ligue / Compétition | select (placeholder "Aucune / Autre") |
| Pick * | input texte (placeholder "PSG gagne") |
| Cote * | input texte / numérique (placeholder "1.85") |
| Teasing * | select (placeholder "Choisir un teasing") |
| Heure de début du match * | 2 selects HH / MM séparés par ":" |
| Cotes bookmakers (optionnel) | 3 inputs côte à côte : Betclic, PMU, Winamax (placeholder "ex: 1.85") |
| Argumentaire | textarea (placeholder "Pourquoi ce pick ? (visible après achat)") |
| ☐ Marquer comme analyse du jour | checkbox + sous-texte "Une seule analyse peut être mise en avant par jour" |

→ Aucune de ces valeurs (font, padding, border, focus state, gap) n'est extractible depuis Figma. À designer côté code avec les **tokens du DS** :
- `bg-black/40` ou `bg-surface-elevated` pour les inputs
- `rounded-2xl` (16px) — cohérent avec le reste
- borders subtiles `border border-amber-500/20` ou neutral
- placeholder color : `#898181`
- focus state : ring doré (à définir)

⚠️ Cf. `CLAUDE.md` §11 "Specs de design : `dashboard-spec.md` (form fields à designer)" — la designer/cliente a explicitement laissé ces champs ouverts. **À designer ou demander une v2 de la maquette.**

### 6.4 Bouton "Publier l'analyse" (node 114:121)

C'est **un seul élément natif extractible** du form :

```
position    : x=316, y=1298, w=800, h=50
bg          : #FFFFFF (blanc plein)
display     : content-stretch flex items-center justify-center
padding     : px-23 py-16
radius      : 16px
text        : "Publier l'analyse"
typo        : Work Sans Regular 18px, leading-18, color #000
```

→ Variante **`Button variant="white"` du DS** déjà utilisée dans ExpertCard, **largeur élargie à 800px** (~pleine largeur du container interne).

### 6.5 Spacing dans le container

| De → à | Distance |
|---|---|
| Container top (526) → screenshot top (559) | 33px (padding interne haut) |
| Screenshot bottom (559+707=1266) → button top (1298) | 32px |
| Button bottom (1348) → container bottom (1386) | 38px (~padding bas, à arrondir 32 ou 40) |

---

## 7. Section "Mes analyses"

### 7.1 Titre (node 114:124)

```
position : x=284, y=1450, w=242, h=44 ("Mes analyses (12)")
typo     : DM Serif Display Regular 32px, white
```

- Container "Publier" (y_end=1386) → titre (y=1450) : **64px** (séparation de section)
- Le "(12)" est un compteur dynamique = nombre total d'analyses publiées par l'expert.

→ Même token typo que §6.1.

### 7.2 Cards (node 114:297)

2 cards stackées, gap **16px** :

| Card | x | y | w | h |
|---|---|---|---|---|
| #1 (114:131) | 284 | 1526 | 872 | 244 |
| #2 (114:132) | 284 | 1786 | 872 | 244 |

Container externe par card :

```
bg       : rgba(0, 0, 0, 0.4)
radius   : 16px
```

Gap (1786 − 1770) = **16px** ✓.

### 7.3 ⚠️ Contenu interne — screenshot plat

Chaque card contient un screenshot bitmap :

```
node "screenshot" : 721 × 200, x=316, y=card_top+22
```

- Padding interne horizontal : `(872 − 721) / 2 = 75.5px` — visiblement le screenshot est aligné à gauche (x=316 = card_left+32 padding), pas centré
- Padding interne vertical : 22px haut, 22px bas

À l'œil sur la capture du screenshot (card 1), on voit :

```
[Lens - Toulouse]  [Ligue 1]                          [Gagné] [Perdu]
+1.5 buts — @1.35
☐ Opportunité
Argumentaire pour Lens - Toulouse.
Début à 20h48 · Publié le 16 avr., 17 h.
```

→ Layout à recréer nativement :
- Top row : titre match (Work Sans Medium ~16-18px white) + badge ligue (Work Sans 14 muted) à gauche · **boutons Gagné / Perdu alignés à droite** (cf. notes Figma : "aligner 'gagné' 'perdu' sur la droite avec le bouton 'publier l'analyse'")
- Pick : "+1.5 buts — @1.35" en Work Sans 16
- Teasing : checkbox + label "Opportunité" (état placeholder visiblement)
- Argumentaire : texte muted, Work Sans Regular 14-16
- Meta : "Début à 20h48 · Publié le 16 avr., 17 h." en Work Sans 12-14 muted-foreground

Les boutons **Gagné / Perdu** semblent être 2 boutons compacts ("pill") :
- Gagné : variant succès (vert #10B981 — cf. CLAUDE.md tokens couleurs)
- Perdu : variant erreur (rouge #EF4444)

→ **Aucune de ces valeurs (padding, font weight, border-radius des badges, etc.) n'est extractible précisément**. À designer côté code en réutilisant les tokens DS.

---

## 8. Divider décoratif (node 114:22)

```
position : x=519, y=2126, w=402, h=6
asset    : imgDivider (PNG bitmap dans Figma)
```

Pattern identique à la homepage (2 traits dorés + dot central). Le divider est centré dans la frame (x=519, w=402 → centre 720 = 1440/2 ✓).

→ **Réutiliser `<DividerDecorative>`** déjà créé pour la homepage.

⚠️ La frame s'arrête après le divider (y=2132). **Pas de footer, pas de disclaimer designés** sur cette page. À discuter :
- Réutiliser le footer global de la homepage ?
- Ou la page Dashboard n'a-t-elle pas de footer (UX dashboard "app-like") ?

---

## 9. INVENTAIRE — natif vs screenshot

### ✅ Designé nativement (extractible proprement)

- TopBar (logo + nav)
- Pseudo expert (typo, taille, position)
- Stats cards (background, icône, labels, big number + %)
- Titres de section "Publier une analyse" et "Mes analyses (12)"
- Container `bg-black/40 rounded-2xl` du form ET des cards analyses
- Bouton "Publier l'analyse" (variant `white`, 800×50)
- Divider décoratif
- Page background (gradients radiaux dorés)

### ⚠️ Screenshots plats (à recréer côté code avec patterns DS)

- **Tout le contenu interne du formulaire "Publier une analyse"** — 9 champs visibles à l'œil mais aucun token natif extractible. Cf. §6.3 pour la liste des fields probables.
- **Tout le contenu interne des cards "Mes analyses"** — match, pick, teasing, argumentaire, meta, boutons Gagné/Perdu. Cf. §7.3 pour le layout déduit visuellement.

### ❌ Manquant sur la maquette

- États focus / hover / disabled des form fields
- Variantes de la card analyse (analyse gagnée vs perdue vs en attente vs résultat overridé par admin) — la maquette montre seulement l'état "à valider"
- Le footer (page tronquée à y=2132)
- La version mobile (frame "2. Dashboard" est desktop 1440 only)
- Les vrais 3 stats à afficher (les 3 cards sont toutes "RÉUSSITE 70%" en placeholder)
- Comportement des boutons Gagné/Perdu : toggle d'état ? confirmation ? double-click ?

---

## 10. Composants à réutiliser (déjà existants)

| Composant | Source | Usage Dashboard |
|---|---|---|
| `<Header>` (variant connecté) | `header-spec.md` | TopBar |
| `<DividerDecorative>` | homepage | Fin de page |
| `<Button variant="white">` | `design-system.md` / ExpertCard | "Publier l'analyse" (size lg, w-800) |
| Page background (radial glows) | homepage / `globals.css` | Fond de page |
| Tokens : `bg-black/40`, `rounded-2xl`, `text-h2-desktop`, `text-h3-desktop`, `text-body-18` | `design-system.md` | Partout |

## 11. Composants nouveaux (à créer)

| Composant | Specs |
|---|---|
| `<StatCard>` | `280×122`, icône doré #DFB968 + label muted top, big number 48px + suffixe 18px bottom |
| `<DashboardSection>` | wrapper `mt-16` avec titre H3 + container `bg-black/40 rounded-2xl w-[872px] p-8` (à factoriser entre "Publier" et "Mes analyses") |
| `<PublishAnalysisForm>` | form à designer from scratch avec tokens DS (cf. §6.3 pour la liste des fields) |
| `<AnalysisListCard>` | card 872×244 avec layout déduit visuellement (cf. §7.3) — top row : match + ligue + Gagné/Perdu droite ; corps : pick, teasing, argumentaire, meta |
| `<ResultButton variant="won|lost">` | bouton pill compact, couleurs vert succès / rouge erreur, à designer |

---

## 12. Tokens / spacing récurrents — Dashboard

| Token | Valeur | Usage |
|---|---|---|
| Container max-w Dashboard | 872px | Toutes les sections principales |
| Padding latéral page | 284px (= (1440−872)/2) | Container centré |
| Padding interne container | ~28px horizontal (304 - 284 = 20, 316 - 284 = 32 selon élément) | Form + cards |
| Gap pseudo → stats | 32px | |
| Gap stats → titre section | 64px | |
| Gap titre → container | 32px | |
| Gap section → section | 64px | |
| Gap card → card | 16px | (analyses, stats) |
| Card radius | 16px (`rounded-2xl`) | Partout |
| Card bg | `rgba(0,0,0,0.4)` (`bg-black/40`) | Stats, Publier, Analyses |
| Icon color | `#DFB968` (`text-accent`) | Stats |
| Muted text | `#898181` (`text-muted-foreground`) | Labels stats, meta cards |

---

## 13. Notes de la designer (frame "Notes Dashboard" — verbatim)

> - espacements multiple de 8 (ex 16px, 24px, 32px)
> - background du container black #000000 opacité 40%
> - changer la couleur des icones en jaune #DFB968
> - corner radius 16px
> - aligner "gagné" "perdu" sur la droite avec le bouton "publier l'analyse"

→ **Le dernier point** est important : dans la liste "Mes analyses", chaque card a ses boutons "Gagné" / "Perdu" alignés à droite, à la verticale du bouton "Publier l'analyse" du form au-dessus. Le bouton "Publier" est centré à `x_center=316+400=716`, donc les boutons Gagné/Perdu doivent finir à environ `x=716` (= bord droit du bouton "Publier" à `316+800=1116`). À implémenter au niveau de `<AnalysisListCard>` (`flex justify-between` sur la top row).

---

## 14. Questions ouvertes / à clarifier avec le client

1. **Les 3 stats** : que veut-on réellement afficher ? Taux de réussite, nombre d'analyses publiées, revenus, ventes ? (les 3 cards Figma sont des placeholders identiques)
2. **Form fields** : valider la liste des fields (§6.3) et faire designer un v2 avec les états (focus, error, disabled), ou autoriser l'intégration libre avec tokens DS ?
3. **Card analyse "états"** : montrer la maquette pour analyse "Gagné" (badge vert ?), "Perdu" (badge rouge ?), "En attente" (badges actifs pour cliquer)
4. **Footer Dashboard** : oui/non ? Si oui, le même que la homepage ?
5. **Active state nav** : underline doré sur l'item actif (Dashboard ici) ?
6. **Version mobile** : la frame Dashboard mobile sera-t-elle designée ?
