# Devenir Expert — Spec d'intégration (desktop)

> Source : Figma `DFTjdH42nddqFyAtHQ6eac`, frame "3. Devenir Expert" (node `114:236`)
> Viewport : **1440px**, hauteur frame : ~3057px (gradient bg height)
> Référence DS : `design-system.md`
> Date d'extraction : 2026-05-10
>
> ⚠️ **Maquette très incomplète.**
> - Sans `get_design_context` (rate-limit Figma), je n'ai que la métadonnée.
> - **Le formulaire est un screenshot plat** (`rounded-rectangle 114:294 "screenshot" 643 × 768`) — aucun champ natif extractible.
> - La frame contient une **note de ta sœur dans le contenu** : *"Phrase que j'ai perdu parce que j'ai crop ton screen et que j'ai fait Enregistrer au lieu de enregistrer une copie."* (text `114:301`, y=241). Donc une partie du contenu textuel prévu (probablement une intro / sous-titre sous le H1) **est manquante** dans la maquette.

---

## Vue d'ensemble (top → bottom)

| Section | y_start | y_end | Hauteur | Contenu |
|---|---|---|---|---|
| TopBar (header) | 0 | 70 | 70 | Identique homepage/dashboard |
| Title "Devenir Expert" | 149 | 209 | 60 | H1 ou H2 |
| (texte d'intro perdu) | 241 | 273 | 32 | ⚠️ note de ta sœur, contenu manquant |
| Container formulaire | 337 | 1197 | 860 | Screenshot Figma |
| Divider décoratif | 1293 | 1299 | 6 | |
| (rien après) | | | | |

---

## Layout général

- **Viewport** : 1440px
- **Container max-width** : **872px** (identique au Dashboard)
- **Padding horizontal** : `x=284` à gauche → 284px de chaque côté
- → Page identique au Dashboard côté layout (largeur container, padding)

---

## 1. Header / TopBar

Identique à la homepage et au Dashboard : `1440 × 70`, full bleed.
→ Réutiliser le composant `<Header>` partagé.

---

## 2. Titre "Devenir Expert"

```
text "Devenir Expert" (x=284, y=149, w=321, h=60)
```

- Hauteur 60 → estimation H1 (DM Serif Display 64px) ou H2 (32px) avec padding
- ✶ Plus probablement H1 puisqu'il s'agit d'un titre de page principal (et non d'un sous-titre comme sur Dashboard)
- Padding-top depuis le header (y=70 → y=149) : **79px** (pas un multiple de 8 — probablement 80)

---

## 3. Texte d'intro (manquant)

```
text (x=283, y=241, w=635, h=32) — placeholder note de ta sœur
```

⚠️ Le texte affiché ici est : *"Phrase que j'ai perdu parce que j'ai crop ton screen et que j'ai fait 'Enregistrer' au lieu de 'enregistrer une copie'."*

C'est une **note d'oubli** de ta sœur, pas du vrai contenu. Le texte d'intro réel a été perdu. À demander à ta sœur de le re-fournir, ou à proposer un texte d'intro cohérent (ex : "Rejoins Plarya en tant que créateur et monétise tes analyses auprès d'une communauté engagée." — repris de la card "Devenir créateur" de la homepage).

### Position et style attendus
- Largeur : 635px (maxlw du sous-titre)
- Hauteur : 32px (probablement 1 ou 2 lignes de Body 16)
- ✶ Style probable : Body 16 ou Body 18, couleur muted (#898181)
- Padding title → intro : `241 − 209 = 32px`

---

## 4. Container formulaire

```
container (872 × 860, x=284, y=337)
├── bg (Rectangle 16, 872 × 860, rounded-2xl) — probablement bg-black/40
└── screenshot (643 × 768, x=399, y=383) — form fields plats
```

### Spacing
- Texte intro (ends y=273) → container top (y=337) : **64px**
- Container top (y=337) → screenshot top (y=383) : **46px** padding-top interne
- Screenshot bottom (y=383+768=1151) → container bottom (y=337+860=1197) : 46px padding-bottom
- Padding horizontal interne du container : `(872 − 643) / 2 = ~115px` de chaque côté du screenshot

### Container
- Dimensions : **872 × 860**
- Background : probablement `bg-black/40 rounded-2xl`
- Padding interne : ~46px vertical, ~115px horizontal (form occupe une largeur réduite dans le container)

### ⚠️ Form non extractible
Le screenshot 643 × 768 contient le formulaire de candidature. D'après `CLAUDE.md` §Page Devenir Expert, les champs attendus sont :
- Pseudo
- Email
- Bio
- Sports couverts
- Expérience / motivation (textarea)

→ À designer nativement avec les tokens du DS, ou à demander à ta sœur un design Figma détaillé.

### Notes Figma de ta sœur (frame "Notes Devenir Expert" `114:330`)
Verbatim depuis la métadonnée :
- "background du container black #000000 opacité 40%"
- "espacements multiple de 8 (ex 16px, 24px, 32px)"
- "alonger les text fields vers la droite sur toute la longueur"
- "alonger le bouton CTA vers la droite sur toute la longueur"

→ Indications précieuses :
- **Champs full-width** : les inputs doivent occuper toute la largeur du container (pas la largeur réduite du screenshot 643px). Donc les champs nativement intégrés doivent faire ~872 − 2×padding ≈ **800px ou ~808px** de large.
- **Bouton submit full-width** : pareil, doit s'étendre sur toute la largeur du container.

---

## 5. Divider décoratif

À `y=1293`, identique à homepage et dashboard (`Divider 114:276`).

⚠️ Pas de disclaimer ni de footer designés sur cette frame. Réutiliser ceux de la homepage.

---

## Composants à réutiliser

- `<Header>` — partagé
- `<DividerDecorative>` — partagé

## Composants à créer / adapter

- Form fields texte/textarea/select stylés DS (utilisables aussi sur Dashboard et modals)
- `<SubmitButton>` (probablement même style que CTA primary gradient gold, au moins pour le rendu)

## Tokens / valeurs récurrentes

| Token | Valeur | Usage |
|---|---|---|
| Container max-width Devenir Expert | 872px | Identique Dashboard |
| Padding horizontal Devenir Expert | 284px | (1440 − 872) / 2 |
| Gap title → intro | 32px | |
| Gap intro → container form | 64px | |
| Padding interne container vertical | ~46px | (à arrondir 48) |
| Width inputs (note ta sœur) | full-width container | ≈ 800px |

## À demander à ta sœur

1. **Le texte d'intro perdu** sous le titre "Devenir Expert" — actuellement remplacé par une note d'oubli
2. **Un design natif du formulaire** (champs, labels, placeholders, états focus/error) — actuellement un screenshot plat de 643×768
3. **Le footer / disclaimer pour cette page** — pas designés
