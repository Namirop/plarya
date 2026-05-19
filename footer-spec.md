# Footer — Spec extraite du Figma

**Source Figma** : `vxkUD2k0gxROZEGZLlSFqb`
- Node extrait : `94:866` (frame nommée "Footer")

> ⚠️ **Le footer Figma est rendu comme un ASSET IMAGE unique**, pas comme des éléments structurés. La frame `94:866` ne contient qu'un `<img>` qui occupe toute la surface. **Aucun texte, lien, ou élément interactif n'est extractible via `get_design_context`.** Le contenu visible (©, liens) est imprimé dans l'image.

---

## 1. Conteneur

| Propriété | Valeur Figma |
|---|---|
| Structure | `<div className="relative size-full"><div className="absolute inset-0 overflow-hidden pointer-events-none"><img ... /></div></div>` |
| Width | `size-full` (pleine largeur) |
| Hauteur | non explicite dans l'extract. Le DS doc note `69px`. À confirmer côté metadata (frame y/height). |
| Background | **fait partie de l'image** — pas de `bg-*` CSS. Visuellement noir (`#000000` ou très proche). |
| Padding | aucun (image absolue inset-0 dans un conteneur full) |
| Border / Shadow | aucune |

---

## 2. Contenu (depuis la screenshot rendue par le MCP)

Le `<img>` du footer affiche visuellement :

| Élément | Position visuelle | Texte exact | Couleur (estimée à la pipette) |
|---|---|---|---|
| Copyright | Centré-gauche | `© 2026 Plarya. Tous droits réservés.` | `??` — gris clair, probablement `#898181` ou similaire (muted-foreground) |
| Liens légaux | Centré-droite | `Mentions légales`  ·  `CGU` | `??` — même gris |
| Logo | absent | — | — |
| Icônes sociales | absentes | — | — |
| Liens supplémentaires (Confidentialité, Contact) | absents | — | — |

> 📝 **Important** : ces valeurs sont lues sur la screenshot, **pas extraites du code**. Typographie, taille de police, espacements horizontaux exacts → non mesurables. Probablement Work Sans Regular 16 (cohérent avec le reste du DS), à confirmer.

---

## 3. Écarts avec `design-system.md` §"Footer" (lignes 269-272) et `CLAUDE.md` §5

### `design-system.md` (lignes 269-272)

| # | Sujet | `design-system.md` | Réalité Figma | Action |
|---|---|---|---|---|
| 1 | Hauteur | `69px` | non extractible du code (à confirmer via metadata) | À vérifier |
| 2 | Full bleed | `oui` (w=1440) | `size-full` → oui | ✓ Conforme |
| 3 | Contenu | "**Aucun contenu visible dans la frame Figma (rectangle simple)**" | **Image avec `©` + 2 liens visibles** | ⚠️ **Écart** — le DS doc dit "rectangle vide", l'extract montre du contenu (sous forme d'image). À corriger dans le DS doc. |
| 4 | Note du DS | "Le footer 'réel' semble n'être qu'une fine barre — toute la zone légale vit AU-DESSUS du footer" | Plausible : le footer fait 69px, c'est mince. La zone légale est peut-être effectivement au-dessus dans le flow. | Pas tranché. Voir la frame parente (homepage complète) pour confirmer s'il y a une zone légale "disclaimer + divider" séparée du footer. |

### `CLAUDE.md` §5 (description fonctionnelle de la homepage)

Le CLAUDE.md §5 annonce dans le footer :
- Liens : `Confidentialité`, `Mentions légales`, `CGU`, `Contact`
- Copyright

L'image Figma actuelle ne montre **que** `Mentions légales` et `CGU` côté liens, plus le copyright. **Manquent : `Confidentialité` et `Contact`**.

→ À trancher avec le client : on suit le Figma (2 liens) ou le CLAUDE.md (4 liens) ?

---

## 4. Implication pour l'implémentation

Comme le footer Figma est une image, on ne peut pas le réimplémenter "à l'identique" pixel-perfect avec ses textes. À l'implémentation, on doit :

1. **Recréer le footer en HTML/CSS** avec nos tokens DS (Work Sans 16 / `text-muted-foreground` / `bg-background`).
2. **Décider du contenu** (liste de liens) — suit-on le Figma minimaliste (2 liens) ou le CLAUDE.md (4 liens) ?
3. **Décider de la hauteur** (69px du DS doc est plausible mais à confirmer).

---

## 5. Valeurs `??` (non extractibles)

- **Hauteur exacte de la frame** — non visible dans l'extract `get_design_context`. Récupérable via `get_metadata` sur le node `94:866` ou son parent (1 appel MCP).
- **Couleur exacte du fond** — fait partie de l'image, pas une règle CSS. Visuellement noir.
- **Couleur exacte des textes** — image, pas extractible. Visuellement gris clair (~`#898181`).
- **Police / size / line-height des textes** — image, non extractibles. Probablement Work Sans Regular 16 par cohérence DS.
- **Positions horizontales exactes** des éléments dans le footer — image, non mesurables.
- **Présence d'un logo, d'icônes sociales, d'un divider décoratif** au-dessus du footer dans le flow page — à vérifier en remontant au parent.
