# Plarya — Design System

> Source de vérité pour la nouvelle DA dorée. Extrait depuis le Figma de [nom sœur].
> Branche : `redesign/golden-da`
> Date d'extraction : 2026-05-10
> Source : Figma file `DFTjdH42nddqFyAtHQ6eac`, frame "Design System" (node `114:332`)

---

## 1. Couleurs

### Palette principale

| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | `#000000` | Background principal (page) |
| `bg-secondary` | `#131212` | Background DS / surfaces sombres |
| `bg-tertiary` | `#181818` | Background bouton "Terminé", icône category, surfaces secondaires |
| `text-primary` | `#FFFFFF` | Texte principal |
| `text-secondary` | `#898181` | Texte secondaire / muted (vues, "2 ANALYSES DU JOUR", "Terminé pour aujourd'hui") |
| `text-muted` | `#898181` | Idem (un seul gris dans le DS) |
| `accent` | `#DFB968` | Doré principal (label "EXPERT", swatch palette) — note : différent du `#DFB698` mentionné dans CLAUDE.md, valeur Figma fait foi |
| `accent-strong` | `#E1AA36` | Doré fort — `Golden Stroke` (bordures CTA, Domain cards) |
| `border-default` | — | Pas de bordure neutre globale (cards sans border) |
| `border-gold` | `#E1AA36` | `Golden Stroke` — bordure dorée des CTA et Domain cards |
| `divider` | `#FFFFFF` (faible opacité, voir Notes) | Trait `Divider` dans les cards expert |
| `placeholder` | `#D9D9D9` | Placeholder image / fond neutre clair |

### Palette dorée (gradients & glow)

| Token | Valeur | Usage |
|---|---|---|
| `gold-light` | `rgba(223, 185, 104, 0.8)` (#DFB968 @ 80%) | Stop gauche du `Btn gradient` |
| `gold-white` | `rgba(255, 255, 255, 0.8)` | Stop droit du `Btn gradient` |
| `gold-glow` | `rgba(255, 174, 0, 0.7)` (#FFAE00 @ 70% — `#FFAE00B2`) | Couleur du `Shining Effect` (glow CTA) |
| `gold-glow-soft` | `#DFB968` | Couleur du `Shining Effect 2` (glow Domain card, plus doux) |

### États

| Token | Hex | Usage |
|---|---|---|
| `success` | `??` | Non défini dans le DS Figma |
| `error` | `??` | Non défini dans le DS Figma |
| `warning` | `??` | Non défini dans le DS Figma |

### Notes
- Container background : `#000000` à **opacité 40%** → `rgba(0, 0, 0, 0.4)` (`bg-black/40` Tailwind). Confirmé sur Expert Card Locked / Unlocked.
- Bouton "Terminé pour aujourd'hui" : fond `#181818` plein (parfois `rgba(24,24,24,0.5)` dans certaines variantes V1) — préférer `#181818`.
- `Divider` : trait fin (1px) blanc à faible opacité, exporté en image dans Figma — implémenter en CSS via `border-t border-white/10` (à valider visuellement).
- Aucune Figma Variable de couleur n'est définie dans le file (palette = swatches statiques).

### Figma Variables détectées
Aucune variable de couleur. Les seules entrées dans `get_variable_defs` côté couleurs sont :
- `Golden Stroke` → `#E1AA36`
- `Shining Effect` → `Effect(DROP_SHADOW, #FFAE00B2, offset(0,0), radius 15, spread 0)`
- `Btn gradient` → (style de remplissage, sans valeur exposée)

---

## 2. Typographie

### Font families

| Token | Famille | Usage |
|---|---|---|
| `font-display` | DM Serif Display | H1, H2 (titres hero / sections) |
| `font-body` | Work Sans | H3, H4, H5, body, UI |
| `font-label` | ABeeZee | Labels du DS uniquement ("TYPOS", "COULEURS", "COMPOSANTS") — pas pour la prod |

### Scale desktop (extrait des Figma styles)

| Token | Famille | Style | Taille / Line-height | Weight | Usage |
|---|---|---|---|---|---|
| `H1` | DM Serif Display | Regular | 64 / 60 | 400 | Titre hero |
| `H2` | DM Serif Display | Regular | 32 / 100% (auto) | 400 | Titres de section |
| `H3` | Work Sans | Medium | 32 / 100% (auto) | 500 | Sous-titres (⚠️ libellé Figma dit "DM Serif Display" mais le style appliqué est Work Sans Medium) |
| `H4` | Work Sans | Regular | 24 / 100% (auto) | 400 | Titres de card |
| `H5` | Work Sans | Medium | 20 / 100% (auto) | 500 | Titres mineurs / pseudo expert |
| `Body 18` | Work Sans | Regular | 18 / 18 | 400 | Texte mis en avant |
| `Body 16` | Work Sans | Regular | 16 / 16 | 400 | Texte courant, boutons |
| `Body 14` | Work Sans | Regular | **16 / 16** (cf. Notes) | 400 | ⚠️ Style mal nommé : déclaré "Body 14px" mais `size: 16` dans Figma. **Vérifié sur la frame "1. Homepage" : aucun texte n'utilise ce style.** Le plus petit texte de la homepage est 16px (nav header, "EXPERT", "152 vues", "2 ANALYSES DU JOUR", disclaimer). Conclusion : "Body 14" n'est jamais utilisé en pratique → token à supprimer ou à reconfigurer en vrai 14/16. |

### Scale mobile

Aucune variable typographique mobile-spécifique n'est définie dans la frame Design System (les tokens mobiles `H1 mobile`, `H2 mobile`, etc. mentionnés dans le template précédent ne sont pas présents). À mesurer sur la frame "1a. Mobile Homepage" si besoin.

| Token | Taille / Line-height | Usage |
|---|---|---|
| `H1 mobile` | `??` | Titre hero mobile |
| `H2 mobile` | `??` | Titres de section mobile |
| `h4 mobile` | `??` | À confirmer |
| `Btn mobile` | `??` | Texte boutons mobile |

### Notes typographiques
- Letter-spacing : 0 partout (aucun tracking custom).
- Line-height : H1 a un line-height fixe de 60px (plus serré que la taille). Tous les autres titres sont en `lineHeight: 100` (équivalent à 100% / `normal`).
- `H3` : libellé Figma incohérent (texte dit "DM Serif Display" mais la police effective est Work Sans Medium). À clarifier avec ta sœur.

---

## 3. Espacements

> Règle : tous les espacements doivent être des **multiples de 8** (16, 24, 32, 48, 64, 96, 128).
> Confirmé par la note Figma : "Agrandir les espacements et les mesurer en multiples de 8 (ex : 16px, 24px, 32px)".

### Espacements observés dans le DS

| Token | Valeur | Usage |
|---|---|---|
| Card padding (Expert Card) | `32px` vertical, `16px` horizontal (`px-[16px] py-[32px]`) | Padding interne Expert Card Locked/Unlocked |
| Domain Card padding | `32px` (`p-[32px]`) | Padding interne Domain Card |
| Bouton padding (CTA gradient) | `16px / 32px` (`px-[32px] py-[16px]`) | "Découvrir les experts", "Voir les analyses", "Devenir créateur" |
| Bouton padding (Accéder unlocked) | `16px / 72px` (`px-[72px] py-[16px]`) | Bouton "Accéder (3,50€)" — large padding pour centrer le texte |
| Bouton padding (Accéder locked) | `16px / 48px` (`px-[48px] py-[16px]`) | Bouton "Terminé pour aujourd'hui" |
| Gap interne (Devenir créateur btn) | `16px` | Gap texte ↔ flèche |
| Domain Card gap vertical | `207px` | Gap entre titre et bouton (interne à la Domain card de 350px) |

### Espacements de section (vertical) — mesurés sur "1. Homepage"

| Transition | Valeur | Notes |
|---|---|---|
| Hero → Explore les domaines | **64px** | gap section-section standard |
| Explore les domaines → Nos Experts | **96px** | section "experts" légèrement plus aérée |
| Nos Experts → Pourquoi Plarya | **64px** | standard |
| Pourquoi Plarya → Devenir créateur | **64px** | standard |
| Devenir créateur → Divider décoratif | **128px** | grand espace avant zone légale |
| Divider décoratif → Disclaimer | **~134px** | inclut une zone vide |
| Disclaimer → Footer | **~257px** | grande zone vide avant la barre footer |

→ **`section-y` (gap inter-section standard) = 64px** ; **96px pour la section "experts"** ; les transitions zone légale sont des cas spéciaux.

| Token | Valeur | Usage |
|---|---|---|
| `section-y` | `64px` | Gap vertical standard entre 2 sections |
| `section-y-lg` | `96px` | Gap renforcé (utilisé avant "Nos Experts") |
| `section-y-mobile` | `64px` | Gap vertical standard mesuré sur "1a. Mobile Homepage" (CTA→features, features→Explore titre) |

### Gap titre de section → contenu (vertical interne)

| Section | Gap titre → contenu |
|---|---|
| Hero (eyebrow → H1) | 32px |
| Hero (H1 → subtitle) | 32px |
| Hero (subtitle → CTA) | 48px |
| Hero (CTA → trust row) | 64px |
| Explore les domaines | ~64px |
| Nos Experts | 64px |
| Pourquoi Plarya | 32px |

### Espacements internes des composants
- Padding cards Expert : **16px horizontal / 32px vertical** (`px-4 py-8`)
- Padding Domain card : **32px** (`p-8`)
- Padding Devenir créateur card : **~32px vertical / ~64px horizontal**
- Gap entre cards Expert (carrousel) : **16px** (cards de 322px, x = 0 / 338 / 676 / 1014)
- Gap entre Domain cards : **16px** (cards de 381px, alignées sur 1175px = 381×3 + 16×2)
- Gap entre items du trust row Hero : sépareurs verticaux à x=431 et x=791 (3 colonnes de ~290px)
- Gap entre items nav header : **64px** (entre Dashboard / Mon Compte / Déconnexion)

---

## 4. Border radius

> Règle : **16px partout** (boutons, containers, cards). Confirmé par la note Figma.

| Token | Valeur | Usage |
|---|---|---|
| `rounded-default` | `16px` (`rounded-2xl`) | Tout par défaut : Expert Card, Domain Card, boutons CTA, bouton "Terminé", swatches couleurs |
| `rounded-sm` | `8px` | Icônes catégorie (carrés `21.154x21.154` avec icône sport) et swatches palette couleurs |
| `rounded-full` | `rounded-full` | Profile Pic (cercle 68px / 82px) |

---

## 5. Effets

### Shadows / Glow

| Token Figma | Valeur CSS | Usage |
|---|---|---|
| `Shining Effect` | `box-shadow: 0px 0px 15px 0px rgba(255, 174, 0, 0.7);` (couleur `#FFAE00B2`, drop-shadow, offset 0/0, radius 15, spread 0) | Glow doré chaud autour des CTA dorés ("Découvrir les experts", "Voir les analyses", "Devenir créateur", Domain card button) |
| `Shining Effect 2` | `box-shadow: 0px 0px 7px 0px #DFB968;` | Glow doré plus doux/clair autour des Domain cards (border-glow) — non explicitement nommé dans `get_variable_defs` mais présent sur les Domain cards (`shadow-[0px_0px_7px_0px_#dfb968]`) |

### Gradients

| Token | Valeur CSS | Usage |
|---|---|---|
| `Btn gradient` | `linear-gradient(to right, rgba(223, 185, 104, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%);` | Tous les CTA dorés (boutons "Découvrir les experts", "Voir les analyses", "Devenir créateur", "Voir les analyses" sur Domain card) |

---

## 6. Composants

### Boutons

#### Primary — CTA gradient doré (`Voir les analyses`, `Découvrir les experts`, `Devenir créateur`)
- Background : `Btn gradient` (linear `rgba(223,185,104,0.8) → rgba(255,255,255,0.8)`)
- Border : `1px solid #E1AA36` (Golden Stroke) — variante `Voir les analyses Btn` utilise `0.5px`
- Box-shadow : `Shining Effect` (`0 0 15px rgba(255,174,0,0.7)`)
- Texte : `#000000` (noir)
- Padding : `16px 32px` (vertical / horizontal)
- Gap interne (texte ↔ flèche) : `16px`
- Font :
  - "Voir les analyses" : Work Sans Regular 16 / lh 16
  - "Découvrir les experts" / "Devenir créateur" : Work Sans Medium 20 / lh normal
- Border radius : `16px`
- Hover : non défini dans le Figma (à designer)

#### Accéder (3,50€) — variante "unlocked" (Expert Card)
- Background : `#FFFFFF` (blanc plein)
- Border : aucune
- Box-shadow : aucune
- Texte : `#000000`, Work Sans Regular 16 / lh 16
- Padding : `16px 72px`
- Border radius : `16px`
- Largeur fixe : `290px`, hauteur `41px`
- Flèche `>` à droite

#### Accéder — variante "locked" / "Terminé pour aujourd'hui"
- Background : `#181818` (gris très sombre)
- Border : aucune
- Texte : `#898181`, Work Sans Regular 16 / lh 16, label "Terminé pour aujourd'hui"
- Padding : `16px 48px`
- Border radius : `16px`
- Largeur fixe : `290px`, hauteur `41px`

#### Ghost / Text
- Non défini comme variante dédiée dans le DS Figma.

### Card Expert (Unlocked / Locked)

> **Rôle** : composant vitrine de la homepage. Affiche les noms des matchs en clair — **aucun contenu masqué, aucun cadenas, aucun blur**. La seule variation entre les 2 états porte sur le bouton du bas. Le teasing du pick (prédiction) vit sur le profil expert (`/experts/[id]`), pas ici.

- Background : `rgba(0, 0, 0, 0.4)` (`bg-black/40`)
- Border : aucune
- Box-shadow : aucune
- Border radius : `16px`
- Dimensions : `322 × 422` (DS) — variante V1 = `379 × 352`
- Padding : `32px` vertical, `16px` horizontal
- Layout interne (de haut en bas) :
  - Profile Pic : `68px` (DS) / `82px` (V1), cercle (`rounded-full`)
  - Pseudo expert : Work Sans Medium 20 blanc
  - Label "EXPERT" : Work Sans Regular 16, couleur `#DFB968`
  - Compteur "152 vues" : Work Sans Regular 16, `#898181`
  - Categories : icônes `21.154 × 21.154`, fond `#181818`, radius `8px` — **gap horizontal `8px` entre chaque icône**
  - Divider : 247px de large, 1px, blanc faible opacité
  - "2 ANALYSES DU JOUR" : Work Sans Regular 16, `#898181`
  - Liste analyses (2x) : flèche décorative `→` à gauche + nom du match en blanc Work Sans 16. **Espacement vertical entre les 2 lignes : `24px`.** Une étoile dorée `★` marque la 1ère ligne ("analyse du jour") — ce n'est **pas** un état de verrouillage.
  - Gap vertical entre la fin de la liste d'analyses et le bouton : **`80px`**
  - CTA en bas : variant Button `white` — texte "Accéder (3,50€)" (unlocked, fond blanc) ou "Terminé pour aujourd'hui" (locked, état `disabled` → fond `#181818`, texte `#898181`)

### Card Domaine (Sport / Esport / Hippique)

- Image de fond : `object-cover`, masque `rounded-[16px]`
- Border : **aucune** (vérifié via extraction MCP du parent — voir `domain-card-spec.md`)
- Box-shadow : **aucune** sur la card. Le glow doré perçu vient exclusivement du bouton CTA "Voir les analyses" qui projette son `Shining Effect` (`0 0 15px rgba(255,174,0,0.7)`)
- Border radius : `16px`
- Dimensions de référence : `381 × 335` (DS) ou `335 × 350` (V1)
- Padding : `32px`
- Texte titre : Work Sans Medium 32 blanc (ex: "SPORT", "ESPORT", "HIPPIQUE")
- Sous-titre : Work Sans Regular 16, `#898181` (ex: "Football, Basketball, Tennis, MMA et plus")
- CTA : bouton "Voir les analyses" (Btn gradient, voir Primary)

### Inputs (formulaires)
Non définis dans la frame Design System extraite.

### Header / TopBar (mesuré sur Homepage)
- Hauteur : **70px**, full bleed (`w=1440`, full viewport)
- Background : `rgba(0, 0, 0, 0.3)` (`bg-black/30`) — voile noir 30% pour la lisibilité par-dessus le hero. Vérifié via extraction MCP — voir `header-spec.md`. **N'EST PAS transparent.**
- Logo : `152 × 54px`, padding gauche 128px (= colonne layout)
- Nav (à droite) : items Work Sans 16px, gap **64px** entre chaque (Dashboard, Mon Compte, Déconnexion)
- Padding vertical interne : ~8px (logo) / 27px (nav text) → centré verticalement
- État `guest` (Se connecter / Créer un compte) : **non maquetté dans Figma**, designé côté code en réutilisant les variants Button (ghost + primary), gap 16px entre les deux boutons.

### Footer
- Hauteur : **69px**, full bleed (`w=1440`)
- Aucun contenu visible dans la frame Figma (rectangle simple)
- ⚠️ Le footer "réel" semble n'être qu'une fine barre — toute la zone légale (disclaimer + divider décoratif) vit AU-DESSUS du footer dans le flow vertical de la page.

### Section title (Pourquoi Plarya?, Nos Experts, Explore les domaines)
- Texte : DM Serif Display 32px (H2)
- Décor : ligne verticale dorée fine (1px×54px) à gauche du titre, espacée de ~16px
- Largeur de la frame titre : variable selon le texte

### Section eyebrow (Hero uniquement)
- Format : `[ligne 45×1px dorée] [TEXTE 18px UPPERCASE]`
- Ex : "PLATEFORME D'ANALYSES SPORTIVES"
- Trait : `45 × 1px`, couleur `accent` (#DFB968)
- Texte : Work Sans Regular **18px**, couleur **`muted-foreground` (#898181)** — ⚠️ corrigé après extraction MCP du Hero (avant : "16px doré", c'était inexact ; seule la **ligne** est dorée, le texte est muted)
- Espacement ligne ↔ texte : ~17px

### Lien "Voir tous" (top-right des sections)
- Texte 16px Work Sans Regular + chevron
- Position : aligné à droite du contenu de la section, vertical centré sur le titre H2

### Carrousel "Next" button (Nos Experts)
- Disque `45 × 45px`, rounded-full
- Position : top-right du bloc cards (overlap absolu)

### Trust row item (Hero)
- Layout **horizontal** : `[icône] [titre + body empilés à droite]` — ⚠️ corrigé après extraction MCP du Hero (avant : layout "vertical icône → titre → body", c'était faux)
- Icône : **30 × 30** pour toutes les icônes (Figma a une icône à 35×35 par erreur sur `stash:lock-opened` — on uniformise à 30 en code)
- Couleur icône : **`accent` (#DFB968)** — icônes dorées (cf. screenshot final)
- Gap icône → titre (horizontal) : ~9px
- Titre : H5 (Work Sans Medium 20), blanc
- Body : Body 16 (Work Sans Regular 16), `muted-foreground`
- Gap titre → body (vertical) : ~16px
- Séparateur entre items : trait vertical `1px × 96px`, couleur **`accent` (#DFB968)** — pipette confirmée, doré et non blanc

### Why-Plarya item
- Layout vertical (icône → titre H4 → body) — distinct du Trust row Hero. À confirmer après extraction MCP de la section "Pourquoi Plarya".

### Devenir créateur CTA card
- Card : `1169 × 147`, fond `bg-black/40`, radius 16
- Layout horizontal : texte (gauche) | bouton (droite)
- Padding interne : ~32px vertical / ~64px horizontal
- Texte : H4 24px (titre) + Body 16 (subtitle)
- Bouton : `Devenir créateur btn` (gradient gold, voir §6 Boutons)

### Disclaimer
- Texte : 16px Work Sans Regular, `#898181`, max-width ~748px, centré
- Au-dessus : divider décoratif (ligne — point doré — ligne) sur ~400px de large

---

## 7. Layout

### Container
- Viewport de référence : **1440px** (largeur de la frame Homepage)
- Max-width contenu (sections "régulières") : **1175px** (utilisé par Explore, Nos Experts, Pourquoi Plarya)
- Padding horizontal desktop : **~132px** de chaque côté (1440 − 1175) / 2
- Hero : container plus large `1285-1308px` avec padding horizontal réduit (~72px)
- Devenir créateur card : largeur 1169px (≈1175 avec léger ajustement)
- Padding horizontal mobile : **~32px** (viewport 393px ; cards et CTA mesurés à `x=34, w=325` → marge gauche 34, droite 34, soit 32px ± 2 d'arrondi Figma)

### Grille
- Colonnes : **3** sur la section "Explore les domaines" et "Pourquoi Plarya" (pattern 3 colonnes égales)
- Carrousel "Nos Experts" : 4 cards de 322px visibles, gap 16px (= 4×322 + 3×16 = 1336px, légèrement plus large que le container 1175px → overflow horizontal volontaire)
- Gutter standard entre cards : **16px**
- Note Figma : "Même grille d'alignement sur toutes les pages"

---

## 8. Notes globales (de la sœur)

Extraites verbatim des notes Figma de la frame DS :

- [x] Espacements en multiples de 8 (16, 24, 32px)
- [x] Containers : background noir `#000000` opacité 40%
- [x] Border radius 16px sur tous boutons et containers
- [x] Vert d'origine remplacé par `#DFB968` (note CLAUDE.md disait `#DFB698` — la valeur Figma `#DFB968` fait foi)
- [x] Même grille d'alignement sur toutes les pages

### Pages à modifier (sans maquettes dédiées)
- Admin : couleurs, espacements
- Become an Expert : voir visuel
- My Account : espacements, suivre la grille d'alignement
- Profil Expert Locked : bouton "Déverrouiller" → utiliser le même dégradé que CTA homepage (`Btn gradient` + `Shining Effect`)
- Profil Expert Visible : couleurs, espacements
- Modals : couleurs

### Pages avec maquettes Figma
- Homepage (desktop + mobile) ✅ frame "1. Homepage" + "1a. Mobile Homepage"
- Dashboard Expert ✅ frame "2. Dashboard"
- Devenir Expert ✅ frame "3. Devenir Expert"

---

## 9. Configuration code

### tailwind.config.ts (à mettre à jour une fois le DS extrait)

```ts
export default {
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        surface: {
          DEFAULT: '#131212',
          elevated: '#181818',
        },
        accent: {
          DEFAULT: '#DFB968',          // doré principal (label EXPERT, swatch)
          strong: '#E1AA36',           // Golden Stroke (bordures CTA)
          glow: 'rgba(255,174,0,0.7)', // Shining Effect color
          soft: '#DFB968',             // Shining Effect 2 color
        },
        muted: '#898181',
        placeholder: '#D9D9D9',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
      fontSize: {
        h1: ['64px', { lineHeight: '60px', fontWeight: '400' }],
        h2: ['32px', { lineHeight: '1', fontWeight: '400' }],
        h3: ['32px', { lineHeight: '1', fontWeight: '500' }],
        h4: ['24px', { lineHeight: '1', fontWeight: '400' }],
        h5: ['20px', { lineHeight: '1', fontWeight: '500' }],
        'body-18': ['18px', { lineHeight: '18px', fontWeight: '400' }],
        'body-16': ['16px', { lineHeight: '16px', fontWeight: '400' }],
      },
      borderRadius: {
        DEFAULT: '16px',
        sm: '8px',
      },
      backgroundImage: {
        'gradient-gold':
          'linear-gradient(to right, rgba(223,185,104,0.8) 0%, rgba(255,255,255,0.8) 100%)',
      },
      boxShadow: {
        shine: '0 0 15px 0 rgba(255,174,0,0.7)',
        'shine-soft': '0 0 7px 0 #DFB968',
      },
    },
  },
}
```

### CLAUDE.md (à compléter après extraction)

Ajouter une section :

```md
## Design System

La DA actuelle est une refonte (branche `redesign/golden-da`).
Référence complète : voir `design-system.md`.

Tokens principaux :
- Couleurs : `bg-primary` (noir #000), `accent` (#DFB968), `accent-strong` (#E1AA36 = Golden Stroke), `bg-black/40` pour containers
- Typo : `font-display` (DM Serif Display) pour H1/H2, `font-body` (Work Sans) pour le reste
- Radius : 16px (`rounded-2xl`) par défaut partout
- Espacements : multiples de 8 uniquement
- CTA dorés : `bg-gradient-gold` + `border border-accent-strong` + `shadow-shine`

Statut intégration :
- [x] Tokens DS dans tailwind.config
- [ ] Composants partagés (Header, Footer, Button, ExpertCard, DomainCard)
- [ ] Homepage desktop
- [ ] Homepage mobile
- [ ] Dashboard expert
- [ ] Devenir expert
- [ ] Pages restantes (admin, my account, modals, profil expert)
```
