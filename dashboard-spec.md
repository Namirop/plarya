# Dashboard Expert — Spec d'intégration (desktop)

> Source : Figma `DFTjdH42nddqFyAtHQ6eac`, frame "2. Dashboard" (node `114:20`)
> Viewport : **1440px**, hauteur frame : **2253px**
> Référence DS : `design-system.md`
> Date d'extraction : 2026-05-10
>
> ⚠️ **Limites majeures de cette extraction.**
> - Sans `get_design_context` (rate-limit Figma), je n'ai que les positions/tailles depuis la métadonnée.
> - **Les zones formulaire et cards d'analyses sont des screenshots plats** (`rounded-rectangle name="screenshot"`) embarqués dans Figma, pas du contenu natif. Je ne peux PAS extraire les libellés des champs, les types d'inputs, leur layout interne, etc.
> - Cette spec couvre donc uniquement la **structure externe** (page layout, positions des sections, dimensions des containers) — pas le détail des formulaires.

---

## Vue d'ensemble (top → bottom)

| Section | y_start | y_end | Hauteur | Contenu |
|---|---|---|---|---|
| TopBar (header) | 0 | 70 | 70 | Logo + nav (Dashboard, Mon Compte, Déconnexion) |
| Pseudo expert "BetKing" | 172 | 232 | 60 | Titre H1 ou H2 |
| Stats row (3 cards) | 264 | 386 | 122 | 3 metrics "RÉUSSITE 70%" |
| Title "Publier une analyse" | 450 | 494 | 44 | H2 |
| Container "Publier l'analyse" form | 526 | 1386 | 860 | Form (screenshot Figma) + bouton submit |
| Title "Mes analyses (12)" | 1450 | 1494 | 44 | H2 |
| Card analyse #1 | 1526 | 1770 | 244 | Screenshot Figma |
| Card analyse #2 | 1786 | 2030 | 244 | Screenshot Figma |
| Divider décoratif | 2126 | 2132 | 6 | (pré-disclaimer ?) |
| (rien après y=2132) | | | | |

---

## Layout général

- **Viewport** : 1440px
- **Container max-width** : 872px (largeur des sections principales)
- **Padding horizontal** : `x=284` à gauche → padding gauche 284px, droite (1440−284−872) = 284px → **container centré, padding 284px de chaque côté**
- ⚠️ Différent de la homepage qui utilise un container 1175 / padding 132. Le Dashboard a un container plus étroit (872) et plus de padding (284). Choix design délibéré, à conserver.

---

## 1. Header / TopBar

Identique à la homepage : `1440 × 70`, full bleed, logo gauche + nav droite.
- Logo à `x=128, y=8, w=152, h=54`
- Nav à `x=898, y=27` : Dashboard / Mon Compte / Déconnexion (gap 64px)

→ Réutiliser le composant `<Header>` partagé.

---

## 2. Titre pseudo expert

```
text "BetKing" (x=284, y=172, w=169, h=60)
```

- Hauteur 60 → font ~ DM Serif Display 64 ? (cohérent avec desktop H1) — ou H2 32 avec padding
- ✶ Estimation : H2 (32px DM Serif) plus probable étant donné qu'il s'agit du pseudo de l'expert connecté, pas du H1 hero
- Padding-top depuis le header (y=70 → y=172) : **102px**

---

## 3. Stats row

3 cards en ligne, chacune `280 × 122`, gap entre cards :

| Card | x_start | x_end |
|---|---|---|
| Card 1 | 284 | 564 |
| Card 2 | 580 | 860 |
| Card 3 | 876 | 1156 |

Gap entre cards : `580 − 564 = 16px` ✓ (cohérent avec DS)

### Layout interne de chaque card (mesuré sur card 1)
- Background `Rectangle 15` : 280 × 122 (probablement `bg-black/40 rounded-2xl` selon les notes générales — à confirmer visuellement)
- Icône `ri:target-fill` : 24 × 24 à `y=282` (relative `y=18` dans la card)
- Label "RÉUSSITE" : `87 × 21` à `y=283` (Work Sans probablement, h=21 → ~16px)
- Big number "70" : `48 × 60` à `y=314` (h=60 sur une ligne → font-size grande, probablement DM Serif Display 48-64px)
- Symbole "%" : `16 × 18` à `y=346` (Work Sans 16px probable)

Pattern : `[icône] LABEL` en top, gros nombre + % en bas.

### Spacing
- Pseudo (ends y=232) → Stats (y=264) : **32px**

⚠️ La card #1 (`114:80`) a ses enfants directement (sans frame Group intermédiaire), tandis que les cards #2 et #3 ont des frames `Group 35` et `Group 36`. C'est probablement un artefact Figma (la card 1 a été désaplatie). À ne pas reproduire — rendre les 3 cards identiques.

⚠️ Les **3 cards montrent toutes "RÉUSSITE 70%"** dans la maquette. C'est un placeholder — les vrais labels (3 metrics différentes) seront probablement : taux de réussite, nombre de ventes, revenus, etc. À demander à ta sœur ou à proposer.

---

## 4. Section "Publier une analyse"

```
title "Publier une analyse" (x=284, y=450, w=278, h=44)
└── container (872 × 860, x=284, y=526)
    ├── bg (Rectangle 16, 872 × 860, rounded-2xl) — probablement bg-black/40
    ├── content du formulaire (screenshot 836 × 707, x=304, y=559)
    └── button "Publier l'analyse" (800 × 50, x=316, y=1298)
```

### Spacing
- Title (ends y=494) → container top (y=526) : **32px**
- Container top (y=526) → screenshot top (y=559) : **33px** padding interne
- Screenshot bottom (y=559+707=1266) → button top (y=1298) : 32px
- Button bottom (y=1348) → container bottom (y=1386) : 38px (~32-40px padding bottom)

### Container "Publier l'analyse"
- Dimensions : **872 × 860**
- Padding horizontal interne : `(872 − 836) / 2 = 18px` côté screenshot, `(872 − 800) / 2 = 36px` côté bouton — mais en pratique le screenshot est centré et le bouton est centré indépendamment
- Background : très probablement `bg-black/40 rounded-2xl` (cohérent avec note Figma "background du container black #000000 opacité 40%")
- Bouton "Publier l'analyse" : pleine largeur ~800px, h=50

### ⚠️ Form fields non extractibles
La zone du formulaire (`rounded-rectangle 114:117 "screenshot" 836 × 707`) est **un seul rectangle plat** dans Figma. Les champs (Match, Ligue, Sport, Pick, Cote, Argumentaire, etc. listés dans `CLAUDE.md`) ne sont pas designés nativement — la maquette les montre via une capture d'écran de l'ancienne version probablement.

→ Pour l'intégration : se baser sur la liste de champs de `CLAUDE.md` (§Dashboard Expert / Features), les styler avec les tokens du DS (bg-black/40, rounded-16, padding 16-32, borders subtiles), et **demander à ta sœur** un design détaillé du form si besoin.

---

## 5. Section "Mes analyses"

```
title "Mes analyses (12)" (x=284, y=1450, w=242, h=44)
└── 2 cards stackées (gap 16)
    ├── Card analyse #1 (872 × 244, x=284, y=1526)
    │   ├── bg (Rectangle 16) — bg-black/40 rounded-2xl probable
    │   └── screenshot 721 × 200 (x=316, y=1548)
    └── Card analyse #2 (872 × 244, x=284, y=1786)
        ├── bg
        └── screenshot 721 × 200 (x=316, y=1808)
```

### Spacing
- Container "Publier" (ends y=1386) → "Mes analyses" title (y=1450) : **64px**
- Title (ends y=1494) → cards (y=1526) : **32px**
- Card 1 (ends y=1770) → Card 2 (y=1786) : **16px** gap

### Card analyse
- Dimensions : **872 × 244**
- Padding interne : `(872 − 721) / 2 = ~75px` horizontal, `(244 − 200) / 2 = 22px` vertical (à arrondir 24)
- Background : très probablement `bg-black/40 rounded-2xl`

### ⚠️ Contenu interne non extractible
Le screenshot 721×200 dans chaque card contient probablement : icône sport, match, cote, statut (gagné/perdu/en attente), boutons Valider gagné/perdu, etc. — **non visible dans la métadonnée**. À déduire des features listées dans `CLAUDE.md` §Dashboard Expert.

---

## 6. Divider décoratif

À `y=2126`, identique à la homepage : 2 lignes de 185px + ellipse 6×6 dorée centrale (`Divider 114:22`).

⚠️ La frame Dashboard se termine à y=2253. **Pas de disclaimer ni de footer designés**. Soit le footer global (réutilisé de la homepage) prend le relais, soit la maquette est incomplète sur ce point.

---

## Composants à réutiliser

- `<Header>` — partagé avec la homepage
- `<DividerDecorative>` — partagé avec la homepage
- (potentiellement) `<Footer>` — si on réutilise celui de la homepage

## Composants nouveaux (à créer)

- `<StatCard>` — `280 × 122`, [icône + label] en top, [big number + %] en bas
- `<DashboardSection>` — wrapper avec title H2 + container `bg-black/40 rounded-2xl 872`
- `<AnalysisListCard>` — card 872 × 244 listant une analyse publiée
- `<PublishAnalysisForm>` — form natif à designer (le screenshot Figma ne suffit pas)

## Tokens / valeurs récurrentes du Dashboard

| Token Dashboard | Valeur | Usage |
|---|---|---|
| Container max-width Dashboard | 872px | Toutes les sections |
| Padding horizontal Dashboard | 284px | (1440 − 872) / 2 |
| Gap pseudo → stats | 32px | |
| Gap stats → "Publier" | 64px | (450 − 386 = 64) |
| Gap title → container | 32px | |
| Gap section → section | 64px | |
| Gap card → card (analyses) | 16px | |
| Gap card stats → card stats | 16px | |

→ ⚠️ Le **container 872px** est différent de la homepage (1175px). À discuter : est-ce intentionnel ou est-ce que le Dashboard doit s'aligner sur 1175 ?

## Notes Figma de ta sœur (frame "Notes Dashboard" `114:232`)

Verbatim depuis la métadonnée :
- "espacements multiple de 8 (ex 16px, 24px, 32px)" ×2
- "background du container black #000000 opacité 40%"
- "changer la couleur des icones en jaune #DFB968"
- "corner radius 16px"
- "aligner 'gagné' 'perdu' sur la droite avec le bouton 'publier l'analyse'"

→ Le dernier point indique que dans la liste "Mes analyses", chaque card a des boutons "gagné" / "perdu" qui doivent être **alignés à droite**, à la verticale du bouton "Publier l'analyse" du form au-dessus. À implémenter au niveau de `<AnalysisListCard>`.
