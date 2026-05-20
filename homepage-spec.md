# Homepage — Spec d'intégration (desktop)

> Source : Figma `DFTjdH42nddqFyAtHQ6eac`, frame "1. Homepage" (node `80:734`)
> Viewport de référence : **1440px**, hauteur totale : **3141px**
> Référence DS : `design-system.md`
> Date d'extraction : 2026-05-10

## Vue d'ensemble

Ordre vertical (de haut en bas) :

1. **Header / TopBar** — `y = 0..70`
2. **Hero** — `y = -44..721` (recouvre le header en arrière-plan)
3. **Explore les domaines** — `y = 785..1238`
4. **Nos Experts** (carrousel) — `y = 1335..1952`
5. **Pourquoi Plarya** — `y = 2016..2310`
6. **Devenir créateur** (CTA card) — `y = 2374..2521`
7. **Divider décoratif + Disclaimer légal** — `y = 2649..2815`
8. **Footer** — `y = 3072..3141`

Le fond entier de la page est un `Gradient Background` global (frame `80:735`, full bleed).

---

## 1. Header / TopBar

**Frame Figma** : `80:740`, `1440 × 70`, full bleed.

### Structure logique
```
header (full-width, height 70px, transparent)
└── container (max-w 1175, mx-auto, flex items-center justify-between, h-full)
    ├── logo (152 × 54) — gauche
    └── nav (flex gap-64)
        ├── Dashboard
        ├── Mon Compte
        └── Déconnexion
```

### Spacing
- Hauteur : **70px**
- Padding horizontal : aligné sur la grille (logo à `x=128`, premier item nav à `x=898`)
- Gap nav items : **64px**

### Tokens
- Texte nav : `Body 16` (`text-body-16`), couleur `text-primary` (#FFFFFF)
- Logo : asset `/frontend/public/logo.png` + texte recréé en CSS (gradient or)
- Pas de background (header transparent au-dessus du Hero)

### Composants partagés référencés
- `<Logo>` — voir §Composants additionnels

---

## 2. Hero

**Frame Figma** : `80:746`, `1308 × 765`, débute à `y = -44`.

### Structure logique
```
section.hero (relative, container plus large que les autres sections)
├── Cadre (rounded-2xl backplate) — y=102, w=1285, h=619
├── Hero image (hero photo, top-right) — y=-44..577, w=647
└── Content (left column, x≈131, w=605)
    ├── Eyebrow ("PLATEFORME D'ANALYSES SPORTIVES")
    │   └── ligne 45px + label uppercase 16px
    ├── H1 "Accède aux meilleurs analystes." (DM Serif 64/60, 2 lignes, w=605)
    ├── Subtitle "Découvres des analyses..." (Body, w=592, 2 lignes)
    ├── CTA "Découvrir les experts" (Primary gradient, 304×55)
    └── Trust row (3 colonnes)
        ├── Analyses d'experts (icon + H5 + body)
        ├── Divider vertical
        ├── Contenu indépendant (icon + H5 + body)
        ├── Divider vertical
        └── Paiement sécurisé (icon + H5 + body)
```

### Spacing vertical (mesuré)
- Top du Hero (cadre) : `y=102` (32px sous le bas du header à y=70)
- Eyebrow : `y=148` (gap depuis cadre top : **46px ≈ 48px**)
- H1 : `y=201` (gap depuis eyebrow : **32px**)
- Subtitle : `y=353` (gap depuis H1 : **32px**)
- CTA button : `y=461` (gap depuis subtitle : **48px**)
- Trust row : `y=580` (gap depuis CTA : **64px**)
- Bas du cadre : `y=721`

### Spacing horizontal
- Cadre : `x=72`, `w=1285` (Hero plus large que le container standard)
- Contenu textuel : `x=131` (donc 59px de padding interne dans le cadre)
- Image hero (côté droit) : `x=733`, `w=647` — overflow le cadre à droite (extension décorative)

### Trust row (3 features)
Chaque item : icône 30×30 → titre H5 (Work Sans Medium 20) → body (Work Sans Regular 16).
- Item 1 ("Analyses d'experts") : icône `solar:user-outline`
- Item 2 ("Contenu indépendant") : icône `stash:lock-opened` (35×35 ici)
- Item 3 ("Paiement sécurisé") : icône `f7:creditcard`
- Largeur item : ~242-264px, séparateurs verticaux 1px à `x=431` et `x=791`

### Tokens
- H1 : `font-display text-h1 text-primary` (DM Serif Display 64/60)
- Subtitle : `font-body text-body-18` ou `text-h4` (à confirmer visuellement, h=60 pour 2 lignes suggère 18-20px)
- Eyebrow : `font-body text-body-16` uppercase, couleur `accent` (#DFB968)
- CTA : `Button variant="primary"` (voir §Composants partagés)
- Cadre background : custom (probable `bg-black/40` ou gradient — non confirmé par les vars Figma)

### Composants partagés référencés
- `<Header>` (rendu dessus en absolute)
- `<Button variant="primary">` pour le CTA "Découvrir les experts"
- `<TrustItem>` ×3 + `<DividerVertical>` ×2

---

## 3. Section "Explore les domaines"

**Frame Figma** : `87:211`, `1175 × 453`, `y = 785..1238`.

### Structure logique
```
section.explore
├── header-row (titre seul — pas de lien "Voir tous")
│   └── title "Explore les domaines" (H2 32 DM Serif + ligne dorée verticale gauche)
└── grid (3 cols, gap 16)
    ├── DomainCard "SPORT" (381×335)
    ├── DomainCard "ESPORT" (381×335)
    └── DomainCard "HIPPIQUE" (381×335)
```

> ⚠️ Le lien "Voir tous les domaines" présent dans la maquette Figma (frame `87:210`, voir `domains-section-spec.md`) a été **retiré à l'intégration** : acté avec le client, ce lien n'a pas de sens avec seulement 3 domaines.

### Spacing
- `padding-top` (depuis section précédente) : **64px** (= `section-y`)
- Title : `y=790` (texte) + ligne verticale décorative à gauche (1px × 54px)
- Gap title → cards (`Domains` frame) : **~64px** (cards démarrent à `y=903`)
- Cards : 3 colonnes égales 381px, **gap 16px**

### Tokens
- Title : `font-display text-h2 text-primary`

### Composant `DomainCard`
Voir `design-system.md §6` (Card Domaine). Variantes :
- **SPORT** : image fond + label "SPORT" + sous-titre "Football, Basketball, Tennis, MMA et plus" + bouton "Voir les analyses"
- **ESPORT** : idem avec sous-titre "CS2, Lol, Valorant, Dota 2, et plus"
- **HIPPIQUE** : idem avec sous-titre "Saut d'obstacles, Horseball" — ⚠️ remplace "GAMING" mentionné dans `CLAUDE.md` (qui parlait de SPORT/ESPORT/GAMING — la maquette dit SPORT/ESPORT/HIPPIQUE)

Layout interne `DomainCard` (mesures Figma) :
- Background image : `381 × 271` en haut de la card, `rounded-2xl`
- Texte (label + sous-titre) : positionné en y=155 dans la card (overlap image)
- Bouton "Voir les analyses Btn" : `225 × 48`, positionné en bas (y=271)
- Hauteur totale : 335px

---

## 4. Section "Nos Experts"

**Frame Figma** : `94:848`, `1175 × 617`, `y = 1335..1952`.

### Structure logique
```
section.experts
├── header-row (flex justify-between items-center)
│   ├── title "Nos experts" (H2 32 + ligne verticale dorée)
│   └── link "Voir tous les experts" (16 + chevron)
├── carrousel (relative)
│   ├── Expert Card Unlocked (322×422)
│   ├── Expert Card Locked (322×422)
│   ├── Expert Card Locked (322×422)
│   ├── Expert Card Unlocked (322×422)
│   ├── (overlap mask "Opacity" sur la 5e card pour effet fade)
│   └── NextBtn (45×45 disque, top-right absolute)
└── carrousel-state (dots 49×10, en bas centré)
```

### Spacing
- `padding-top` (depuis section précédente) : **96px** (= `section-y-lg`)
- Title : top de la section
- Gap title → cards : **64px** (cards démarrent à `y=140` depuis le top de la section)
- Cards : **3 entièrement visibles + 1 partielle (~50%)** dans le container 1175px, **gap 16px** entre chaque — l'overflow à droite est **volontaire** (signal visuel qu'il y a plus à scroller)
- Largeur carrousel : 1336px (= 4×322 + 3×16, overflow horizontal du container 1175px volontaire)
- Carrousel dots : `y=597` dans la section (**35px** sous les cards — cards bas à y=562 ; voir `experts-section-spec.md`)
- NextBtn : top-right absolute. `y=182` est relatif à la rangée `94:816` → soit `y=322` relatif à la section. Pas de bouton Previous (absent de la maquette Figma).

### Tokens
- Title : `font-display text-h2 text-primary`
- Lien "Voir tous" : `font-body text-body-18 text-foreground` + chevron `accent` (identique au lien "Voir tous les domaines" — cf. correction dans `design-system.md §6 Lien "Voir tous"`)

### Composant `ExpertCard`
Voir `design-system.md §6` (Card Expert Locked / Unlocked). Layout interne identique aux 2 variantes, seul change le bouton du bas :
- **Unlocked** : bouton blanc plein "Accéder (3,50€)" + chevron noir
- **Locked** : bouton `#181818` "Terminé pour aujourd'hui" texte muted

Sous-éléments mesurés dans la card (322×422, padding 16/32) :
- Profile Pic : `68 × 68` cercle, `x=16 y=34`
- Pseudo : H4 24, `x=100 y=45`
- Categories (icônes sport) : 3× `21×21` rounded-8, `y=46`, alignés à droite
- "EXPERT" label : 16px doré (#DFB968), `y=84 x=102`
- "152 vues" : 16px muted, `y=84 x=173`
- Divider : 247px de large, `y=148`
- "Analyses du jour" : 16px muted, `y=196`
- Liste analyses : 2 lignes de match (cadenas + nom + chevron)
- Bouton Accéder/Terminé : `290 × 41`, `y=348`

---

## 5. Section "Pourquoi Plarya"

**Frame Figma** : `94:824`, `1174 × 294`, `y = 2016..2310`.

### Structure logique
```
section.why
├── title "Pourquoi Plarya ?" (H2 32 + ligne verticale dorée — "?" en accent doré)
└── content-row (3 cols equal width, séparées par dividers verticaux)
    ├── Feature "Gain de temps" (icon weui:time-outlined + H4 + body)
    ├── Divider vertical
    ├── Feature "Simple" (icon mynaui:lightning + H4 + body)
    ├── Divider vertical
    └── Feature "Sans engagements" (icon quill:creditcard + H4 + body)
```

### Spacing
- `padding-top` (depuis section précédente) : **64px**
- Title : `y=2016`, h=54
- Gap title → content : **32px** (content démarre à `y=2102`)
- Content frame : `1174 × 208`
- Dividers verticaux : 192px de haut, à `x=417` et `x=791` dans le content (3 colonnes ~390px)
- Padding horizontal du content frame : 88px à gauche du premier feature

### Tokens
- Title : `font-display text-h2 text-primary`
- Feature title : `font-body text-h4` (Work Sans Regular 24)
- Feature body : `font-body text-body-16 text-muted`
- Icônes : 30×30, couleur `accent` ou `accent-strong` (à confirmer)

### Composant `FeatureItem`
Layout vertical : icône → titre H4 → body.
- Spacing icône → titre : ~24-30px
- Spacing titre → body : ~16px
- Largeur item : 247-281px

⚠️ Note vocabulaire : `CLAUDE.md` mentionne "Gain de temps / Simple / Sans engagement" — la maquette confirme **3 features identiques** mais avec textes légèrement différents (voir contenu Figma) :
- Gain de temps — "Accédez directement aux analyses. Pas de recherche, pas de bruit."
- Simple — "Tout est prêt. Choisissez un expert, accédez à ses sélections."
- Sans engagements — "Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire."

---

## 6. Section "Devenir créateur" (CTA card)

**Frame Figma** : `94:860`, `1169 × 147`, `y = 2374..2521`.

### Structure logique
```
section.cta-creator (1175 max-width, padding-x ~132)
└── card (transparent, border 1px #181818, rounded-2xl, p-vert 32 / p-horz 64)
    └── flex justify-between items-center
        ├── text (left)
        │   ├── title "Partage ton expertise et génère des revenus" (H4 24)
        │   └── subtitle "Rejoins Plarya en tant que créateur et monétise tes analyses auprès d'une communauté engagée." (Body 16, muted, 2 lignes)
        └── button "Devenir créateur" (Primary gradient lg, 258×55)
```

> ⚠️ ⚠️ Card transparente avec **bordure** `1px solid #181818` (≠ Pourquoi Plarya qui a un `bg-black/40` sans bordure). Corrigé après extraction MCP — voir `final-blocks-spec.md §1`.

### Spacing
- `padding-top` (depuis "Pourquoi Plarya") : **64px**
- Card padding interne : **32px vertical / 64px horizontal**
- Hauteur card : **147px**
- Text frame (gauche) : `518 × 76` (titre 28h + subtitle 32h, gap 16px)
- Button (droite) : `258 × 55`, à 21 px du padding droit (pas collé)

### Tokens
- Card : `border border-surface-elevated rounded-2xl` (pas de `bg-...`)
- Title : `font-body text-h4 text-foreground`
- Subtitle : `font-body text-body-16 text-muted-foreground`
- Button : `Button variant="primary" size="lg"` (gradient gold, voir DS)

---

## 7. Divider décoratif + Disclaimer

### 7a. Divider décoratif

**Frame Figma** : `80:736`, ~`402 × 6`, `y = 2649`, centré horizontalement.

Pattern : `[ligne dorée 185px] [point doré 6×6] [ligne dorée 185px]`
- 2 lignes (`Line 2`, `Line 3`) de 185px de large, à `y=2652`
- 1 ellipse 6×6 dorée centrée, à `y=2649`

### 7b. Disclaimer

**Frame Figma** : `94:865`, `748 × 32`, `y = 2783`, centré horizontalement (`x=346` sur 1440).

### Spacing
- Gap Devenir créateur (`y=2521`) → Divider décoratif (`y=2649`) : **128px**
- Gap Divider → Disclaimer : ~134px
- Gap Disclaimer → Footer : ~257px

### Tokens
- Disclaimer : `font-body text-body-16 text-muted`, max-width 748px, centré, `text-center`

### Contenu (verbatim Figma)
> Les contenus proposés sur Plarya sont des analyses et opinions personnelles. Ils ne constituent en aucun cas des conseils financiers ou des incitations à parier.

---

## 8. Footer

**Frame Figma** : `94:866`, `1440 × 69`, `y = 3072..3141`, full bleed.

### Structure logique
```
footer (full-width, h=69, no children in Figma)
```

### ⚠️ Note importante
La frame Footer dans Figma est un **simple rectangle de 69px de haut sans contenu** (`rounded-rectangle` sans enfants). Aucun lien, aucun copyright, aucun nav n'est dessiné dans la maquette.

→ Le contenu attendu dans `CLAUDE.md` ("Liens : Confidentialité, Mentions légales, CGU, Contact / Copyright") n'est PAS designé sur cette frame. Soit :
- Il sera designé plus tard / sur une autre frame
- Soit la zone légale visible (disclaimer + divider) tient lieu de footer minimal

À clarifier avec ta sœur. Pour l'intégration, je suggère de quand même prévoir un footer fonctionnel avec les liens listés dans `CLAUDE.md`, en utilisant les tokens du DS (texte 16 muted, fond noir, séparateur en haut).

---

## Composants partagés à créer

À partir de la homepage, voici les composants à factoriser :

| Composant | Apparaît dans |
|---|---|
| `<Header>` / `<TopBar>` | Toutes les pages |
| `<Footer>` | Toutes les pages (à designer correctement) |
| `<Logo>` | Header |
| `<Button variant="primary">` (gradient gold) | Hero CTA, Devenir créateur, Domain card |
| `<Button variant="locked">` (#181818, "Terminé") | Expert card locked |
| `<Button variant="unlocked">` (blanc, "Accéder") | Expert card unlocked |
| `<SectionTitle>` (H2 + ligne décorative gauche) | Explore, Nos Experts, Pourquoi Plarya |
| `<SectionEyebrow>` (ligne + label uppercase) | Hero |
| `<SeeAllLink>` (texte + chevron, top-right) | Explore, Nos Experts |
| `<DividerDecorative>` (ligne — point — ligne) | Avant disclaimer |
| `<DividerVertical>` | Hero trust row, Pourquoi Plarya |
| `<DomainCard>` | Explore les domaines |
| `<ExpertCard>` (variantes locked/unlocked) | Nos Experts (carrousel) |
| `<CarrouselNextBtn>` | Nos Experts |
| `<CarrouselDots>` | Nos Experts |
| `<TrustItem>` / `<FeatureItem>` (icône + H5 + body vertical) | Hero trust row, Pourquoi Plarya |
| `<CtaCard>` | Section "Devenir créateur" |
| `<Disclaimer>` | Bas de page |

---

## Composants additionnels détectés (non documentés dans le DS Figma)

Éléments observés sur la homepage qui n'apparaissent **pas** dans la frame "Design System" (`114:332`) et qui devraient y être ajoutés :

1. **`SectionTitle` — H2 + ligne décorative verticale gauche**
   Pattern récurrent (3 sections : Explore, Nos Experts, Pourquoi Plarya). Une ligne dorée de 1px × 54px à gauche du titre, à environ 16px de l'attaque du texte. **Pas dans le DS.**

2. **`SectionEyebrow` — ligne horizontale + label uppercase**
   Spécifique au Hero. Ligne dorée de 45px de large + texte 16px uppercase. **Pas dans le DS.**

3. **`SeeAllLink` — lien "Voir tous les X" avec chevron**
   Apparaît dans Explore et Nos Experts (top-right). Texte 16px muted + chevron de 15px×6px. **Pas dans le DS.**

4. **`DividerDecorative` — ligne — point — ligne**
   Pattern unique avant le disclaimer. 2 lignes de 185px + ellipse 6×6 dorée centrale. **Pas dans le DS.**

5. **`DividerVertical` — séparateur vertical 1px**
   Utilisé dans le trust row Hero (192px haut) et dans Pourquoi Plarya (192px haut). **Pas dans le DS.**

6. **`CarrouselNextBtn` — disque 45×45**
   Bouton flèche du carrousel "Nos Experts". Forme/couleur exacte non extraite (image asset). **Pas dans le DS.**

7. **`CarrouselDots` — indicateur de pagination 49×10**
   En bas du carrousel "Nos Experts". **Pas dans le DS.**

8. **Variantes de boutons "Accéder" non distinguées explicitement**
   Le DS liste 5 boutons (`Découvrir les experts`, `Voir les analyses`, `Devenir créateur`, `Accéder Btn` ×2). Mais sur la homepage on observe :
   - **Accéder Unlocked** (blanc plein, `290 × 41`, padding 16/72) — DS confirmé
   - **Accéder Locked / Terminé** (gris #181818, `290 × 41`, padding 16/48) — DS confirmé
   - **Voir les analyses (Domain card)** (gradient gold, `225 × 48`, padding 16/32) — DS confirmé
   - **Découvrir les experts (Hero)** (gradient gold, `304 × 55`) — DS confirmé
   - **Devenir créateur** (gradient gold, `258 × 55`) — DS confirmé
   ✅ Toutes les variantes de boutons sont dans le DS, mais sans labels d'usage clair (qui appelle quoi).

9. **États hover/active**
   ❌ **Aucun état hover, focus, ou active n'est défini dans la maquette Figma.** À designer avec ta sœur ou à dériver via la convention "augmenter le glow `Shining Effect` + scale léger".

10. **Inputs / formulaires**
    ❌ Aucune input/textarea n'apparaît sur la homepage. Pour les formulaires (modal magic link, page Devenir Expert, Dashboard), les styles seront à extraire des frames "2. Dashboard" et "3. Devenir Expert".

11. **Modal magic link**
    ❌ Pas de design dédié au modal de saisie email pour l'achat. À designer.

12. **Footer riche**
    ❌ Le footer Figma est juste un rectangle de 69px sans contenu. À étoffer (voir §8).

13. **Hero "Cadre" background**
    Le Hero a un grand rectangle backplate (`Cadre` `80:782`, `1285 × 619`, rounded-2xl) dont le style de remplissage n'est pas exposé dans `get_variable_defs`. Probablement transparent / overlay subtil — à inspecter visuellement.

14. **Image hero**
    L'image principale du Hero (`80:777 image_hero_section 1`, `624 × 624`) : asset à fournir. Maquette utilise un placeholder.
