# Audit usage doré — Plarya

Date : 2026-05-25
Branche : `redesign/golden-da`

## Vue d'ensemble

- **Nombre total d'occurrences** : 121 (118 dans `frontend/`, 3 dans `globals.css` au niveau des définitions de tokens)
- **Réparties sur** 37 fichiers
- **Pages avec le plus de doré** (top 3, hors `globals.css`) :
  1. `app/compte/CompteClient.tsx` — 22 occurrences
  2. `app/devenir-expert/DevenirExpert.client.tsx` — 13 occurrences
  3. `app/experts/[id]/ExpertProfile.client.tsx` — 12 occurrences

Note : ce décompte inclut les variantes d'opacité (`/10`, `/20`, `/40`) comme occurrences distinctes mais comptabilise chaque ligne 1 fois. Une ligne contenant 2 utilities dorés (ex. `border-accent bg-accent/10 text-accent`) = 1 occurrence dans le décompte fichier mais 3 utilisations visuelles.

---

## Par page

### Homepage `/`

Le fichier `app/page.tsx` n'a aucun doré direct (server wrapper). Tout vient des composants `components/home/*` + `Header`.

| Fichier:ligne                                    | Token                              | Usage                                                                                                                    | Catégorie                                      |
| ------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `components/home/hero.tsx:112`                   | `bg-accent`                        | Ligne décorative gauche eyebrow "PLATEFORME D'ANALYSES SPORTIVES" (desktop, 45×1px)                                      | À évaluer                                      |
| `components/home/hero.tsx:133`                   | `text-accent`                      | Mot "meilleurs" doré dans le H1 "Accède aux meilleurs analystes"                                                         | **Essentiel** (signature de marque)            |
| `components/home/hero.tsx:176`                   | `shadow-shine`                     | Glow doré sur CTA secondaire mobile "Explorer les domaines"                                                              | À évaluer (déjà 1 CTA principal qui glow)      |
| `components/home/trust-row.tsx:47`               | `text-accent`                      | Icône (User/LockOpen/CreditCard) — variante standalone mobile                                                            | À évaluer                                      |
| `components/home/trust-row.tsx:67`               | `text-accent`                      | Idem — variante inline desktop (3 icônes dorées)                                                                         | À évaluer                                      |
| `components/home/pourquoi-plarya-section.tsx:47` | `text-accent`                      | "?" doré dans "Pourquoi Plarya **?**"                                                                                    | À évaluer (charme mais isolé)                  |
| `components/home/pourquoi-plarya-section.tsx:78` | `text-accent`                      | 3 icônes piliers (Clock/Lightning/CreditCard)                                                                            | À évaluer                                      |
| `components/home/domains-section.tsx:167`        | `bg-accent`                        | Dot actif du carrousel domaines mobile                                                                                   | À évaluer (indicateur, OK petit)               |
| `components/home/experts-section.tsx:241`        | `border-accent-strong text-accent` | Flèche "next" carrousel experts desktop (45×45px)                                                                        | À évaluer                                      |
| `components/home/experts-section.tsx:243`        | `shadow-shine hover:border-accent` | Hover du même bouton                                                                                                     | À évaluer                                      |
| `components/home/experts-section.tsx:264`        | `bg-accent`                        | Dot actif du carrousel experts desktop                                                                                   | À évaluer                                      |
| `components/ui/section-title.tsx:46`             | `bg-accent`                        | Gold-bar verticale prefix `<MarketingSectionTitle>` (desktop 54px)                                                       | **Essentiel** (signature de section marketing) |
| `components/ui/section-title.tsx:95`             | `text-accent`                      | Caret "Voir tous les experts →" du CTA top-right de section                                                              | À évaluer                                      |
| `components/domains/domain-card.tsx:76`          | `ring-accent/60`                   | Glow card sélectionnée (état actif filtre)                                                                               | **Essentiel** (indicateur d'état)              |
| `components/domains/domain-card.tsx:159`         | `ring-accent`                      | Focus-visible ring (a11y)                                                                                                | **Essentiel** (a11y)                           |
| `components/experts/expert-card.tsx:18`          | `#DFB968` const                    | Variable JS pour la flèche SVG + étoile pick du jour                                                                     | À évaluer                                      |
| `components/experts/expert-card.tsx:21`          | `#DFB968`                          | Divider doré qui s'estompe à l'intérieur de la card                                                                      | À évaluer (décoratif)                          |
| `components/experts/expert-card.tsx:113`         | `text-accent`                      | Label "EXPERT" sous le pseudo                                                                                            | **Essentiel** (badge de statut)                |
| `components/experts/expert-card.tsx:221`         | `ring-accent`                      | Focus-visible (a11y)                                                                                                     | **Essentiel**                                  |
| `components/ui/decorative-divider.tsx:22`        | `bg-accent`                        | Point central doré 6×6px du séparateur "ligne — point — ligne" (séparateur "fin LP" entre DevenirCréateur et Disclaimer) | À évaluer                                      |
| `components/ui/golden-border-overlay.tsx:32`     | `#DFB968` × 2                      | Conic gradient cadre Hero + Devenir créateur                                                                             | **Essentiel** (cadre signature Hero)           |
| `components/ui/golden-border-overlay.tsx:33`     | `#DFB968` × 2                      | Linear gradient variant `pill` (topbar buttons)                                                                          | À évaluer                                      |

**Sous-total Homepage : ~28 occurrences** (en comptant les composants partagés rendus sur la home)

### `/experts/[id]`

| Fichier:ligne                                   | Token                                            | Usage                                                                               | Catégorie                                                 |
| ----------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `app/experts/[id]/ExpertProfile.client.tsx:352` | `border-accent/30 bg-accent/5 text-accent`       | Banner d'info post-checkout "Accès débloqué"                                        | À évaluer (alerte info OK)                                |
| `:381`                                          | `ring-accent/40`                                 | Ring photo profil expert                                                            | À évaluer                                                 |
| `:384`                                          | `text-accent ring-accent/40 bg-surface-elevated` | Initiale avatar fallback (cercle avec lettre dorée + ring doré)                     | À évaluer                                                 |
| `:394`                                          | `bg-accent/20 text-accent`                       | Badge "EXPERT" sous le pseudo                                                       | **Essentiel** (statut)                                    |
| `:421`                                          | `text-accent`                                    | Icônes sports (boucle, 3-5 icônes selon expert)                                     | **À retirer** (icônes répétées, surcharge)                |
| `:544`                                          | `text-accent`                                    | CheckCircle "Email vérifié" dans modale upsell post-checkout                        | **Essentiel** (success state)                             |
| `:817`                                          | `bg-accent/20 text-accent`                       | Badge "Analyse du jour" sur les cards Prono featured                                | À évaluer (1 badge featured doré par expert max)          |
| `:864`                                          | `text-accent`                                    | Valeur Cote (ex "2,10") quand l'user a accès                                        | **À retirer** (chiffre vanity doré, déjà visible en gros) |
| `:888`                                          | `text-accent`                                    | Valeur Cote blurred placeholder "●,●●" sous le verrou                               | **À retirer** (idem 864, et c'est flouté en plus !)       |
| `:897`                                          | `text-accent`                                    | Icône cadenas central sur Pick verrouillé                                           | À évaluer (1 cadenas doré par prono locked)               |
| `:936`                                          | `text-accent`                                    | Cote bookmaker dans le `BookmakerComparator` (3-4 occurrences max, 1 par bookmaker) | **À retirer** (3 cotes dorées alignées = surcharge)       |

**Sous-total : 12 occurrences** (mais avec multiplicateurs : les sports icônes × 3-5, les bookmaker cotes × 3-4, les cards prono × 2-5 → en pratique 30-50 instances dorées visibles sur la page).

### `/devenir-expert` + `components/devenir-expert/*`

| Fichier:ligne                                            | Token                                       | Usage                                                       | Catégorie                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `app/devenir-expert/DevenirExpert.client.tsx:32, 40`     | `border-accent ring-accent/30`              | Focus-visible inputs/textarea                               | **Essentiel** (a11y)                                                                                       |
| `:49`                                                    | `text-accent`                               | Eyebrow uppercase "ÉTAPE FINALE" / "QUESTIONS FRÉQUENTES"   | À évaluer                                                                                                  |
| `:166`                                                   | `text-accent`                               | "!" dans "Bienvenue parmi les experts !" (état success)     | À évaluer                                                                                                  |
| `:234`                                                   | `text-accent`                               | "sur Plarya" doré dans le H1 "Devenir Expert sur Plarya"    | À évaluer (charme du wording, mais redondant avec V1 où "Plarya" était brand)                              |
| `:247`                                                   | `text-accent`                               | "39€ / trimestre" inline en doré dans la ligne stats Hero   | **À retirer** (le prix est déjà répété en gros doré dans la PricingCard plus bas)                          |
| `:262`                                                   | `text-accent hover:text-accent-soft`        | Lien "Voir le formulaire de candidature →"                  | À évaluer                                                                                                  |
| `:347, 392`                                              | `text-accent`                               | Asterisks `*` champs requis (Pseudo, Sports couverts)       | À évaluer (signal légitime mais répété)                                                                    |
| `:406-407`                                               | `border-accent bg-accent/10 text-accent`    | Chip de sport sélectionné (jusqu'à 9 chips dorés possibles) | **À retirer** (un sport sélectionné chip orange/blanc serait OK, doré = trop)                              |
| `components/devenir-expert/expert-profile-mockup.tsx:50` | `ring-accent/40`                            | Ring avatar mockup                                          | À évaluer                                                                                                  |
| `:51`                                                    | `text-accent`                               | Icône User dans avatar mockup                               | À évaluer                                                                                                  |
| `:55`                                                    | `border-accent/40 bg-accent/10 text-accent` | Badge "EXPERT" du mockup                                    | À évaluer (déjà essentiel sur le vrai profil)                                                              |
| `:78`                                                    | `text-accent`                               | 3 chiffres stats du mockup (67% / 142 / 89)                 | **À retirer** (3 stats dorées + un avatar doré + un badge doré = saturation visuelle dans une seule carte) |
| `:89`                                                    | `border-accent/20`                          | Border du mini-bloc "analyse du jour" du mockup             | À évaluer                                                                                                  |
| `:90`                                                    | `border-accent/40 text-accent`              | Badge "PICK SOLIDE" du mockup                               | À évaluer                                                                                                  |
| `:97`                                                    | `text-accent`                               | Cote "@2.10" du mockup                                      | À évaluer                                                                                                  |
| `components/devenir-expert/pricing-card.tsx:29`          | `border-accent/30 shadow-shine-soft`        | Border + glow de la card 39€ premium                        | **Essentiel** (point focal de la page)                                                                     |
| `:36`                                                    | `text-accent`                               | Prix "39€" 32-36px doré                                     | **Essentiel** (mise en avant prix premium)                                                                 |
| `:48`                                                    | `bg-accent/20`                              | Divider doré sous le prix                                   | À évaluer                                                                                                  |
| `:58`                                                    | `text-accent`                               | 4 icônes check Phosphor dorés (bullets list)                | **À retirer** (4 checks dorés alignés = surcharge)                                                         |
| `components/devenir-expert/faq-item.tsx:47`              | `text-accent`                               | Caret accordion FAQ (4 occurrences)                         | À évaluer                                                                                                  |
| `components/devenir-expert/benefit-card.tsx:24`          | `hover:border-accent/30`                    | Hover border des 3 BenefitCards                             | À évaluer                                                                                                  |
| `:28`                                                    | `text-accent`                               | 3 icônes (Star / Wallet / ChartLineUp) BenefitCard          | À évaluer                                                                                                  |

**Sous-total : ~13 occurrences directes + ~10 composants partagés rendus sur la page = ~23**. Mockup ajoute 7 occurrences concentrées dans 1 seule carte = effet "carte saturée".

### `/compte`

| Fichier:ligne                        | Token                                    | Usage                                                                                     | Catégorie                                                                                  |
| ------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `app/compte/CompteClient.tsx:55, 63` | `border-accent ring-accent/30`           | Focus-visible inputs / textarea (ExpertView form)                                         | **Essentiel** (a11y)                                                                       |
| `:72`                                | `#DFB968`                                | Divider doré gradient (utilisé dans la liste historique)                                  | À évaluer                                                                                  |
| `:191`                               | `text-accent`                            | Compteur "8/200" daily note quand proche du max (ExpertView)                              | À évaluer                                                                                  |
| `:226, 324`                          | `text-accent`                            | Message success "Note mise à jour" / "Profil mis à jour"                                  | À évaluer (success normalement vert, pas doré)                                             |
| `:256, 283`                          | `text-accent`                            | Asterisks `*` champs requis (ExpertView)                                                  | À évaluer                                                                                  |
| `:297-298`                           | `border-accent bg-accent/20 text-accent` | Chip sport sélectionné (ExpertView)                                                       | **À retirer** (idem `/devenir-expert`)                                                     |
| `:399`                               | `text-accent hover:underline`            | Lien mailto contact@plarya.com (mention résiliation)                                      | À évaluer (lien légitime mais doré pas obligatoire)                                        |
| `:484`                               | `bg-accent/[0.06]`                       | Glow ambient subtil top-left du header card identité (blur-3xl)                           | À évaluer (décoratif)                                                                      |
| `:489`                               | `text-accent ring-accent/40`             | Avatar initiale dorée + ring (header USER)                                                | **À retirer** (initiale en blanc + ring neutre suffirait largement)                        |
| `:516`                               | `bg-accent`                              | Gold-bar prefix `<AccountSectionTitle>` (2 occurrences : Abonnements actifs + Historique) | À évaluer (cohérent home mais multiplie l'or sur la page)                                  |
| `:553`                               | `bg-gradient-gold`                       | Fill de la barre de progression abo (état nominal)                                        | **Essentiel** (sémantique : doré = OK ; amber/red = alerte)                                |
| `:562`                               | `hover:border-accent/40`                 | Hover border ActiveSubscriptionCard                                                       | À évaluer                                                                                  |
| `:573, 612`                          | `hover:text-accent`                      | Hover pseudo expert dans cards & rows                                                     | À évaluer                                                                                  |
| `:646, 655`                          | `ring-accent/40 text-accent`             | ExpertAvatar (4-10 avatars selon nombre d'abos & historique)                              | **À retirer** (chaque ligne historique a un avatar avec ring doré → série dorée verticale) |
| `:684`                               | `bg-accent/[0.07]`                       | Glow ambient bas de l'EmptyState                                                          | À évaluer (rendu uniquement si état vide)                                                  |

**Sous-total : 22 lignes, multipliées par les avatars (×N abos+historique) → souvent 30-40 instances dorées visibles**

### `components/account/confidentiality-section.tsx` (rendu sur /compte)

| Ligne | Token         | Usage                                             | Catégorie                  |
| ----- | ------------- | ------------------------------------------------- | -------------------------- |
| `156` | `text-accent` | Icône WarningCircle "Suppression programmée"      | À évaluer                  |
| `200` | `text-accent` | Message success "Export téléchargé ✓"             | À évaluer (success ≠ doré) |
| `312` | `text-accent` | Icône Download de la tuile "Exporter mes données" | À évaluer                  |

### `/dashboard` + `components/dashboard/*`

| Fichier:ligne                                               | Token                                                        | Usage                                                                | Catégorie                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `components/dashboard/stat-card.tsx:33`                     | `text-accent`                                                | Icônes des 3 StatCards (FileText / Target / Calendar)                | À évaluer                                                                             |
| `components/dashboard/publish-analysis-form.tsx:37, 45, 51` | `focus-visible:border-accent`                                | Focus visibles inputs/textarea/select                                | **Essentiel** (a11y)                                                                  |
| `:59`                                                       | `data-highlighted:bg-accent/15 data-highlighted:text-accent` | Item de Select au survol (clavier)                                   | **Essentiel** (a11y)                                                                  |
| `:83`                                                       | `text-accent`                                                | Asterisks `*` champs requis                                          | À évaluer                                                                             |
| `:443`                                                      | `border-accent bg-accent`                                    | Checkbox "Marquer comme analyse du jour" état activé (toggle visuel) | À évaluer (checkbox bg plein doré = beaucoup)                                         |
| `components/dashboard/analyses-list.tsx:143`                | `bg-accent/20 text-accent`                                   | Badge "Analyse du jour" sur lignes de la liste (toggle)              | À évaluer (multiple si plusieurs analyses featured — mais réservé 1/jour normalement) |
| `:153`                                                      | `text-accent`                                                | Cote `@2.10` dans chaque ligne d'analyse                             | **À retirer** (toutes les analyses ont une cote → série dorée verticale)              |

### `/admin` + `app/admin/_components/*`

| Fichier:ligne                            | Token                          | Usage                                                                         | Catégorie                                                                  |
| ---------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `app/admin/AdminClient.tsx:218`          | `border-accent text-accent`    | Onglet actif des sections admin (tab navigation)                              | À évaluer (1 onglet actif à la fois OK)                                    |
| `_components/ByExpertSection.tsx:46, 75` | `text-accent`                  | Valeurs numériques (revenus / commissions) dans table admin                   | **À retirer** (table = plusieurs lignes, chaque montant doré = saturation) |
| `_components/ExpertsSection.tsx:140`     | `text-accent`                  | Label "Mis à jour" inline                                                     | À évaluer                                                                  |
| `_components/RevenueSection.tsx:63`      | `bg-accent`                    | Barres du sparkline aujourd'hui (vs `bg-foreground/25` pour les autres jours) | À évaluer (1 barre dorée parmi N)                                          |
| `lib/admin-styles.ts:20`                 | `border-accent ring-accent/30` | Focus inputs partagés admin                                                   | **Essentiel** (a11y)                                                       |
| `lib/admin-styles.ts:46`                 | `bg-accent/20 text-accent`     | Variant "premium" de badge admin (utilisé sur quelques badges)                | À évaluer                                                                  |

### `/cgu`, `/confidentialite`, `/mentions-legales`, `/contact`

| Fichier:ligne                            | Token                                       | Usage                                                                          | Catégorie                                 |
| ---------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------- |
| `app/contact/page.tsx:22`                | `text-accent`                               | Lien email contact@plarya.com (taille body-18)                                 | À évaluer (1 lien email doré = OK)        |
| `components/legal/legal-shell.tsx:8, 10` | `border-accent/30 bg-accent/10 text-accent` | `LegalWarning` banner (carte d'avertissement "ces conditions sont génériques") | À évaluer (banner d'info, alerte info OK) |

### Composants transverses (Header, Footer, modales, Button)

| Fichier:ligne                                     | Token                                                         | Usage                                                             | Catégorie                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `components/layout/header.tsx:199`                | `border-accent-strong bg-gradient-gold shadow-shine`          | Bouton "Créer un compte" topbar guest (gradient doré plein)       | **Essentiel** (CTA principal topbar)                                                         |
| `:230`                                            | `border-accent/15`                                            | Border séparation panel mobile burger menu                        | À évaluer                                                                                    |
| `:251`                                            | `bg-accent/15`                                                | Divider horizontal dans burger menu                               | À évaluer                                                                                    |
| `:286`                                            | `text-accent`                                                 | Lien "Créer un compte" burger mobile guest                        | À évaluer (déjà essentiel sur le bouton desktop)                                             |
| `components/ui/button.tsx:19`                     | `bg-gradient-gold border-accent-strong shadow-shine`          | Variant `primary` du Button (utilisé sur tous les CTA principaux) | **Essentiel** (CTA principal DS)                                                             |
| `:24`                                             | `border-accent-strong hover:bg-accent/10 hover:border-accent` | Variant `secondary` (border dorée par défaut)                     | À évaluer (mais override possible site-wide, ex: confidentiality tile, modale delete cancel) |
| `:29`                                             | `text-accent`                                                 | Variant `ghost` (lien doré)                                       | À évaluer (utilisé rarement)                                                                 |
| `components/auth/login-modal.tsx:39`              | `focus-visible:border-accent ring-accent/30`                  | Focus input                                                       | **Essentiel** (a11y)                                                                         |
| `components/checkout/email-checkout-modal.tsx:25` | `focus-visible:border-accent ring-accent/30`                  | Focus input                                                       | **Essentiel** (a11y)                                                                         |
| `components/account/delete-account-modal.tsx:14`  | `focus-visible:border-accent ring-accent/30`                  | Focus input                                                       | **Essentiel** (a11y)                                                                         |
| `app/auth/verify/page.tsx:16`                     | `focus-visible:border-accent ring-accent/30`                  | Focus input                                                       | **Essentiel** (a11y)                                                                         |
| `components/legal/cookie-banner.tsx:77`           | `shadow-shine`                                                | Glow doré sous le banner cookies                                  | **À retirer** (banner cookies = utilitaire, pas un point focal)                              |
| `components/ui/select.tsx:115`                    | `focus:bg-accent focus:text-accent-foreground`                | Hover/focus d'un Item de Select (shadcn)                          | **Essentiel** (a11y)                                                                         |

### `globals.css` (définitions tokens DS)

| Ligne     | Token                                    | Catégorie                               |
| --------- | ---------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| `:25`     | `--color-accent: #dfb968`                | Token DS racine                         | **Essentiel** (définition)                       |
| `:26`     | `--color-accent-strong: #e1aa36`         | Idem                                    | **Essentiel**                                    |
| `:27`     | `--color-accent-glow`                    | Idem                                    | **Essentiel**                                    |
| `:30`     | `--color-border-gold`                    | Idem                                    | **Essentiel**                                    |
| `:80, 81` | `--shadow-shine`, `--shadow-shine-soft`  | Variables shadow                        | **Essentiel**                                    |
| `:86`     | `--background-image-gradient-gold`       | Gradient gold (pour `bg-gradient-gold`) | **Essentiel**                                    |
| `:90`     | `--background-image-divider-gold`        | Idem                                    | **Essentiel**                                    |
| `:147`    | `#FFAE00` × 3 (radial gradients du fond) | Ambient gold background body            | À évaluer (fond global du site — décision macro) |
| `:238+`   | `@keyframes shine-pulse`                 | Animation glow pulse                    | **Essentiel** (utilisé sur CTA pulse)            |

---

## Synthèse par usage

### Doré sur titres / H1

| Lieu                                       | Catégorie                           |
| ------------------------------------------ | ----------------------------------- |
| `hero.tsx` — "**meilleurs**" dans le H1    | **Essentiel** (signature marketing) |
| `pourquoi-plarya-section` — "**?**" doré   | À évaluer                           |
| `DevenirExpert` — "**sur Plarya**" dans H1 | À évaluer                           |
| `DevenirExpert` success — "**!**" doré     | À évaluer                           |

→ **4 occurrences sur titres**, dont 1 vraiment essentielle. Les 3 autres sont des fragments de phrases dorés, charmants individuellement mais cumulatifs.

### Doré sur icônes

| Lieu                                   | Nb icônes dorées rendues         | Catégorie                         |
| -------------------------------------- | -------------------------------- | --------------------------------- |
| `trust-row`                            | 3 (User, LockOpen, CreditCard)   | À évaluer (3 d'un coup, alignées) |
| `pourquoi-plarya` piliers              | 3 (Clock, Lightning, CreditCard) | À évaluer (3 alignées)            |
| `BenefitCard` × 3 (devenir-expert)     | 3 (Star, Wallet, ChartLineUp)    | À évaluer                         |
| `ExpertProfile` sports icônes          | 3-5 par expert                   | **À retirer**                     |
| `Lock` Pick verrouillé                 | 1 par prono locked               | À évaluer                         |
| `CheckCircle` modale success           | 1                                | **Essentiel**                     |
| `WarningCircle` Suppression programmée | 1                                | À évaluer                         |
| `Download` Exporter mes données        | 1                                | À évaluer                         |
| `stat-card` (dashboard)                | 3 (FileText, Target, Calendar)   | À évaluer                         |
| `User` avatar mockup devenir-expert    | 1                                | À évaluer                         |
| `Check` × 4 (PricingCard bullets)      | 4                                | **À retirer**                     |
| `Caret` accordéon FAQ                  | 4 (1 par item)                   | À évaluer                         |
| `Caret` `<SectionTitle>` CTA           | 1 par section avec CTA           | À évaluer                         |

→ **~30 icônes dorées rendues simultanément sur certaines pages**. C'est le plus grand poste de saturation.

### Doré sur borders de cards

| Lieu                                                            | Catégorie                                           |
| --------------------------------------------------------------- | --------------------------------------------------- |
| `PricingCard` (devenir-expert)                                  | **Essentiel**                                       |
| `LegalWarning` banner                                           | À évaluer                                           |
| `DomainCard` sélectionné (ring-1 ring-accent/60)                | **Essentiel** (état actif)                          |
| `golden-border-overlay` (Hero + Devenir créateur + Topbar pill) | **Essentiel** (Hero seul) ; À évaluer (topbar pill) |
| `ExpertProfile` banner success                                  | À évaluer                                           |
| `mockup expert profile` border-accent/20 mini-bloc              | À évaluer                                           |
| Hover `border-accent/30` (BenefitCard, ActiveSubCard, etc.)     | À évaluer                                           |

### Doré sur boutons / CTAs

| Lieu                                                                                                                                  | Catégorie                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Button variant `primary` (= TOUS les CTA principaux du site : Découvrir les experts, Devenir Expert, Devenir créateur, Accéder, etc.) | **Essentiel** (1 par page, pattern voulu)                                                                      |
| Button variant `secondary` (border dorée par défaut)                                                                                  | À évaluer (le doré "outline" se voit partout : Voir tous les experts, Voir un profil d'exemple, Annuler, etc.) |
| Button variant `ghost` (text doré)                                                                                                    | À évaluer                                                                                                      |
| `Topbar` "Créer un compte" gradient gold                                                                                              | **Essentiel**                                                                                                  |
| `Hero` "Explorer les domaines" mobile : `shadow-shine hover:border-white`                                                             | À évaluer (CTA secondaire avec glow doré = double signal)                                                      |

### Doré sur chips / badges

| Lieu                                                             | Catégorie                                        |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| Badge "EXPERT" sous pseudo (ExpertCard + ExpertProfile + mockup) | **Essentiel**                                    |
| Badge "Analyse du jour" sur card Prono featured                  | À évaluer (1 max par expert/jour)                |
| Badge "PICK SOLIDE" mockup devenir-expert                        | À évaluer                                        |
| Badge "Mis à jour" admin                                         | À évaluer                                        |
| Badge "Analyse du jour" sur ligne dashboard analyses-list        | À évaluer                                        |
| Chips sport sélectionnés (ExpertView /compte + /devenir-expert)  | **À retirer** (jusqu'à 9 chips dorés simultanés) |
| Admin badge variant "premium"                                    | À évaluer                                        |

### Doré sur indicateurs de statut

| Lieu                                                  | Catégorie                   |
| ----------------------------------------------------- | --------------------------- |
| Carrousel dots (active dot doré) — domaines + experts | À évaluer                   |
| Onglet actif admin tabs                               | À évaluer                   |
| Checkbox "Marquer comme analyse du jour" état activé  | À évaluer (bg-accent plein) |
| RevenueSection sparkline barre "aujourd'hui"          | À évaluer                   |
| Progression bar `bg-gradient-gold` (état nominal abo) | **Essentiel** (sémantique)  |

### Doré sur kickers / labels uppercase

| Lieu                                                                           | Catégorie     |
| ------------------------------------------------------------------------------ | ------------- |
| Eyebrow `text-accent` "ÉTAPE FINALE" / "QUESTIONS FRÉQUENTES" (devenir-expert) | À évaluer     |
| Label "EXPERT" sous pseudo (déjà compté en badges)                             | **Essentiel** |
| Label success "Mis à jour" admin                                               | À évaluer     |

### Doré sur valeurs numériques (prix, stats, cotes)

| Lieu                                                                           | Nb instances visibles | Catégorie                                  |
| ------------------------------------------------------------------------------ | --------------------- | ------------------------------------------ |
| Prix "39€" PricingCard                                                         | 1                     | **Essentiel**                              |
| "39€/trimestre" inline ligne stats Hero devenir-expert                         | 1                     | **À retirer** (redondant avec PricingCard) |
| Stats mockup (67%/142/89)                                                      | 3                     | **À retirer**                              |
| KPI valeurs `/compte` header (déjà retirées par chantier antérieur — vérifier) | —                     | (déjà supprimées)                          |
| Cote `@2.10` dans `ExpertProfile` PronoLine (hasAccess)                        | 1 par prono           | **À retirer**                              |
| Cote `●,●●` blurred placeholder (lock)                                         | 1 par prono locked    | **À retirer**                              |
| Cote bookmaker dans `BookmakerComparator`                                      | 3-4 par prono         | **À retirer**                              |
| Cote `@odds` dans `analyses-list` (dashboard)                                  | 1 par ligne           | **À retirer**                              |
| Admin valeurs CA / revenus expert (ByExpertSection)                            | N par ligne table     | **À retirer**                              |

→ **Plus grosse source de surcharge** : les cotes dorées partout (profil expert + dashboard + admin), souvent en série verticale.

### Doré sur effets visuels (glow / shadow)

| Lieu                                                  | Catégorie                                             |
| ----------------------------------------------------- | ----------------------------------------------------- |
| Glow body global (radial gradients `#FFAE00`)         | À évaluer (fond ambient, décision macro)              |
| `shadow-shine` Button variant primary                 | **Essentiel**                                         |
| `shadow-shine` Topbar "Créer un compte"               | **Essentiel**                                         |
| `shadow-shine` Hero "Explorer les domaines" mobile    | À évaluer                                             |
| `shadow-shine` Cookie banner                          | **À retirer**                                         |
| `shadow-shine` carousel "next" button experts         | À évaluer                                             |
| `shadow-shine-soft` DomainCard hover desktop          | À évaluer                                             |
| `shadow-shine-soft` PricingCard                       | **Essentiel**                                         |
| `shadow-[0_6px_32px...]` DomainCard sélectionnée      | **Essentiel**                                         |
| `shadow-[0_8px_40px...]` ExpertProfileMockup          | À évaluer                                             |
| Glow ambient `bg-accent/[0.06]` header /compte        | À évaluer                                             |
| Glow ambient `bg-accent/[0.07]` EmptyState /compte    | À évaluer                                             |
| `animate-shine-pulse` Hero CTA + Devenir créateur CTA | **Essentiel** (volonté explicite chantier animations) |

---

## Répartition par catégorie (estimation)

| Catégorie                                    | Approximation           | %     |
| -------------------------------------------- | ----------------------- | ----- |
| **Essentiel** (à garder absolument)          | ~25 occurrences uniques | ~20 % |
| **À évaluer** (peut être retiré ou remplacé) | ~70 occurrences         | ~58 % |
| **À retirer quasi certain** (bruit visuel)   | ~26 occurrences         | ~22 % |

Note : le pourcentage en "à évaluer" est élevé car beaucoup d'occurrences sont défendables individuellement mais cumulativement saturent. Le tri fin demande une vue rendue.

---

## Observations personnelles

### 1. `/compte` est saturée (22 lignes + multiplicateurs)

Le fichier le plus chargé du site. Les avatars d'experts (ring doré + initiale dorée) se multiplient sur la liste historique → série dorée verticale. Le `ring-accent/40` sur chaque ExpertAvatar est purement décoratif. Si on retire les ring-doré + texte-doré sur les avatars, on perd ~10 instances visuelles sans coût UX.

### 2. `/experts/[id]` souffre des cotes partout

La cote (`@2.10`) apparaît en doré sur :

- La card prono principale (`text-h5 text-accent`)
- La version blurred placeholder (idem, en `●,●●`)
- Les 3-4 lignes du BookmakerComparator
- Plus les badges "Analyse du jour" et le cadenas

Si on a 5 pronos par expert × 3 cotes bookmakers chacun = **20 cotes dorées affichées simultanément**. Le doré perd toute sémantique de "ça compte".

Recommandation : la cote principale en blanc/foreground + l'icône bookmaker neutre, garder le doré **uniquement** sur la cote la plus avantageuse (1 par prono).

### 3. Le mockup `ExpertProfileMockup` concentre 7 dorés dans 1 seule carte

Avatar doré + badge EXPERT doré + 3 stats dorées + cote `@2.10` dorée + border `border-accent/20` du mini-bloc → 7 surfaces dorées en 360×550px. C'est exactement le "trop d'or sur une surface réduite" qui dilue.

Recommandation : ne garder que **1 ou 2 dorés** dans le mockup (par exemple le badge EXPERT et la cote). Stats en blanc, avatar en blanc, border neutre.

### 4. Les 3-icônes-alignées-dorées sont un pattern récurrent (≥ 4 occurrences)

`TrustRow`, `PourquoiPlarya` piliers, `BenefitCard`, `StatCard`, et l'icône sports sur le profil expert : à chaque fois, 3 icônes dorées posées côte à côte. C'est très "AI-template". Une couleur neutre (text-foreground ou text-muted-foreground) sur ces icônes laisserait respirer + le titre h3 derrière porterait l'attention.

### 5. Les chips sport sélectionnés (`/devenir-expert` + `/compte`) explosent le compteur

Un user qui sélectionne 5 sports → **5 chips dorés side-by-side** (`border-accent + bg-accent/20 + text-accent`). C'est triple-doré sur chaque chip. Pattern "selected = neutral light bg + accent text" serait suffisant pour signaler le sélecté.

### 6. Les variants Button `secondary` et `ghost` portent du doré "by default"

Vu que ces variants ont une bordure dorée native, toute page avec des CTAs secondaires (Annuler, Voir tous les experts, Réessayer, etc.) hérite automatiquement du doré. Comme `secondary` est utilisé partout (modales, FAQ, sections), c'est un multiplicateur invisible.

Recommandation possible : créer un variant `secondary-neutral` (border-surface-elevated au lieu de border-accent-strong) et basculer 80 % des secondary actuels dessus. Garder `secondary` doré uniquement pour les CTA secondaires véritablement marketing.

### 7. Les success messages / icônes en doré au lieu de vert sont un anti-pattern

`/compte` ExpertView "Note mise à jour" / "Profil mis à jour" / `confidentiality-section` "Export téléchargé ✓" / icône Download tile → tous dorés. Un message success est sémantiquement vert (foreground positif), pas doré. Le doré perd son rôle de "premium / marque" quand il sert aussi à "feedback positif".

### 8. Les focus-ring (`focus-visible:border-accent ring-accent/30`) sont essentiels

Tous comptés dans **Essentiel** (a11y). 7-8 occurrences au total. Pas à toucher.

### 9. Le fond global ambient gold (`#FFAE00` × 3 radial gradients dans `body::after`) reste un sujet macro

Décision séparée à prendre : si on veut un site "moins doré", on peut réduire les opacités de ces gradients (passer de 10 % à 5 % ou désactiver). Mais ça change la signature visuelle globale (fond noir pur vs noir-doré-ambient).

### Top 3 fichiers à attaquer en priorité (ROI le plus élevé)

1. **`app/compte/CompteClient.tsx`** — retirer doré sur les ExpertAvatar + initiale + chip sport → -10 instances visuelles
2. **`app/experts/[id]/ExpertProfile.client.tsx`** — passer les cotes (principale + blurred + bookmakers) en `text-foreground`, garder doré seulement sur la cote la plus haute → -15 à -20 instances
3. **`components/devenir-expert/expert-profile-mockup.tsx`** — réduire de 7 dorés à 2 dans le mockup → -5 instances dans une zone très visible (Hero LP)

À traiter ensuite : icônes alignées par 3 (TrustRow, BenefitCard, StatCard) — uniformiser en `text-foreground` ou `text-muted-foreground`, garder doré uniquement sur l'icône "principale" d'une page si pertinent.
