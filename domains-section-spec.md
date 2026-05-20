# Section "Explore les domaines" — Spec d'intégration (desktop)

> Source : Figma `vxkUD2k0gxROZEGZLlSFqb`, frame "2. Explore les domaines" (node `87:211`)
> Viewport de référence : **1440px**
> Référence DS : `design-system.md` ; référence page : `homepage-spec.md §3`
> Date d'extraction : 2026-05-20

---

## 0. Vue d'ensemble

Frame Figma `87:211` :
- Position dans la page : `x = 125`, `y = 785`
- Dimensions : **`1175.124 × 453`**
- Bottom de la section : `y = 1238`

Sous-éléments enfants (positions absolues dans la page) :

| Node | Nom | x | y | w | h |
|---|---|---|---|---|---|
| `80:778` | Header "Explore les domaines" (titre + ligne) | 125 | 785 | 318 | 54 |
| `80:779` | Texte "Explore les domaines" | 141 | 790 | 302 | 44 |
| `80:780` | Ligne décorative `Line 4` (vector, image asset) | 125 | 785 | 0 (rotated) | 54 |
| `87:210` | Bloc "Voir tous les domaines" (texte + chevron) | 1068 | 802 | 232.124 | 18 |
| `87:193` | Texte "Voir tous les domaines" | 1068 | 802 | 201 | 18 |
| `94:883` | Chevron du lien | 1300.124 | 808 | 15.124 | 6 |
| `87:169` | Rangée des 3 cards `Domains` (auto-layout horizontal) | 125 | 903 | 1175 | 335 |
| `87:68` | Card "Sport" (dans `Domains`, x=0 relatif) | 125 | 903 | 381 | 335 |
| `87:170` | Card "Esport" (dans `Domains`, x=397 relatif) | 522 | 903 | 381 | 335 |
| `87:182` | Card "Hippique" (dans `Domains`, x=794 relatif) | 919 | 903 | 381 | 335 |

---

## 1. Conteneur de section

| Propriété | Valeur | Source |
|---|---|---|
| Largeur frame | **1175.124 px** | metadata `87:211` |
| Hauteur frame | **453 px** | metadata `87:211` |
| Background | **aucun** (transparent, hérite du `Gradient Background` global de la page — frame `80:735` cf. `homepage-spec.md`) | Pas de fill exposé par le MCP sur la frame `87:211` |
| Padding horizontal interne | **0 px** (le contenu de la section occupe toute la largeur de la frame) | Title à `x=141` (relatif à frame `x=125` → 16px de gap mais réservé à la ligne décorative, pas à un padding) ; cards à `x=125` (= bord gauche de la frame) ; voir §5 pour les notes d'alignement |
| Padding horizontal vs viewport | gauche **125 px**, droite **140 px** (1440 − 125 − 1175.124 = 139.876) | calcul depuis frame `x=125, w=1175.124` sur viewport 1440 |
| Padding vertical (gap depuis section précédente Hero) | **64 px** (Hero se termine à `y=721`, section démarre à `y=785`) | `homepage-spec.md §3` + `design-system.md` token `section-y` |
| Padding vertical (gap vers section suivante Nos Experts) | **97 px** ≈ **96 px** (section se termine à `y=1238`, Nos Experts démarre à `y=1335`) | `design-system.md` token `section-y-lg` |

### Notes
- La section ne possède **pas** de fond propre. Le fond visible est le gradient global de la page (cf. `homepage-spec.md` "Le fond entier de la page est un Gradient Background global").
- L'alignement horizontal de la frame (`x=125`) n'est pas parfaitement symétrique sur le viewport 1440 (125 à gauche vs 140 à droite). Le DS documente un container `1175px max-width` avec `~132px de padding` ; ici le designer a légèrement décalé vers la gauche. À harmoniser côté code (centrer le container ou conserver le `x=125`).
- La section n'a pas d'auto-layout : tous les enfants sont en positionnement absolu dans la frame Figma.

---

## 2. Header de section

Le header se décompose en 3 éléments **indépendants** (pas regroupés dans un auto-layout dans Figma) :
1. La **ligne décorative verticale** (gauche)
2. Le **titre** "Explore les domaines"
3. Le **lien** "Voir tous les domaines" (droite)

### 2.1 Titre "Explore les domaines"

| Propriété | Valeur | Source |
|---|---|---|
| Texte | **"Explore les domaines"** | `80:779` |
| Font family | **DM Serif Display** | `get_variable_defs` (style "H2") |
| Font weight | **Regular (400)** | `get_variable_defs` (style "H2") |
| Font size | **32 px** | `get_variable_defs` (style "H2") |
| Line-height | **`normal`** (auto, ~100%) | code: `leading-[normal]` |
| Couleur | **`#FFFFFF`** | code: `text-white` |
| Letter-spacing | 0 | `get_variable_defs` |
| Position absolue (page) | `x = 141`, `y = 790` | metadata `80:779` |
| Position relative à la frame `87:211` | `x = 16`, `y = 5` | calcul (141−125=16 ; 790−785=5) |
| Hauteur du texte (bbox) | 44 px | metadata `80:779` |
| Largeur du texte (bbox) | 302 px | metadata `80:779` |
| Token DS | `font-display text-h2 text-primary` | `design-system.md §2 + §6 Section title` |

### 2.2 Ligne décorative (eyebrow visuel à gauche du titre)

| Propriété | Valeur | Source |
|---|---|---|
| Type | Vector / image asset (`Line 4`, `imgLine4`) — **pas un solid fill exposé par le MCP** | code + metadata `80:780` |
| Orientation | **Verticale** (élément Figma horizontal de 54 px, rotaté `-90deg` dans le rendu) | code: `-rotate-90` + `w-[54px] h-0` |
| Longueur visible | **54 px** (vertical) | metadata + code |
| Épaisseur | **1 px** (ou ~2 px d'après l'`inset-[-1px_-1.85%]` autour de l'image) | code: `inset-[-1px_-1.85%]` |
| Couleur | **`??`** non exposé par `get_variable_defs` (asset image, non un fill) — visuellement doré. DS documente cette ligne comme dorée (`accent` `#DFB968`) cf. `design-system.md §6 "Section title"` | screenshot + DS |
| Position absolue (page) | `x = 125`, `y = 785` (top) → bottom à `y = 839` | metadata `80:780` |
| Position relative à la frame `87:211` | `x = 0`, `y = 0` (coin haut-gauche de la section) | calcul |
| Position par rapport au titre | **À gauche** du titre. Gap horizontal ligne ↔ titre = `141 − 125 = 16 px`. Ligne démarre 5 px au-dessus du texte (top du texte y=790 vs top de la ligne y=785), s'étend jusqu'à y=839 (donc 5 px **sous** le bas du texte qui finit à y=834). **La ligne est plus haute que le texte** (54 px vs 44 px), centrée à peu près verticalement avec le texte. | calcul depuis metadata |
| Token DS | `accent` (#DFB968) — couleur déduite, non confirmée par MCP | `design-system.md §6` |

### 2.3 Lien "Voir tous les domaines" (top-right)

| Propriété | Valeur | Source |
|---|---|---|
| Texte exact | **"Voir tous les domaines"** | `87:193` |
| Font family | **Work Sans** | code + `get_variable_defs` (style "Body 18px") |
| Font weight | **Regular (400)** | code: `font-normal` |
| Font size | **18 px** ⚠️ | code: `text-[18px]` + `get_variable_defs` style "Body 18px" |
| Line-height | **18 px** | code: `leading-[18px]` |
| Couleur | **`#FFFFFF`** ⚠️ | code: `text-white` |
| Letter-spacing | 0 | `get_variable_defs` |
| Position absolue (page) — texte | `x = 1068`, `y = 802` | metadata `87:193` |
| Position relative à la frame | `x = 943`, `y = 17` | calcul (1068−125=943 ; 802−785=17) |
| Largeur du texte (bbox) | 201 px | metadata |
| Hauteur du texte (bbox) | 18 px | metadata |
| **Chevron** — présent ? | **Oui** | code + metadata `94:883` |
| Chevron — dimensions | **15.124 × 6 px** (rendu en flèche pointant droite via une double rotation dans le code Figma) | metadata `94:883` |
| Chevron — couleur | **`??`** non exposé (asset image `imgVector2`) — visuellement blanc/doré clair sur le screenshot. À confirmer | code + screenshot |
| Chevron — position absolue (page) | `x = 1300.124`, `y = 808` | metadata `94:883` |
| Chevron — gap horizontal depuis fin de texte | `1300.124 − (1068+201) = 31.124 px` ≈ **31 px** (gap large dû à la construction du vector ; visuellement, le bord visible du chevron est plus proche du texte) | calcul |
| Alignement vertical avec le titre | Texte du lien à `y=802` (top), centre vertical ≈ y=811. Titre à `y=790..834`, centre vertical ≈ y=812. → **les centres sont alignés** (~1 px de différence). | calcul |
| Token DS | `font-body text-body-18 text-primary` + chevron `??` | déduit |

---

## 3. Disposition des 3 cards (rangée `Domains` `87:169`)

| Propriété | Valeur | Source |
|---|---|---|
| Layout | **Flex horizontal** (auto-layout dans Figma) | code: `content-stretch flex gap-[16px] items-center` |
| Alignement vertical | **center** (`items-center`) | code |
| Alignement horizontal | (pas de justify spécifié — flex naturel, packed à gauche) | code |
| Gap entre cards | **16 px** | code: `gap-[16px]` + metadata (Sport à x=0, Esport à x=397 = 0+381+16, Hippique à x=794 = 397+381+16) |
| Largeur de chaque card | **381 px** (3 cards identiques) | metadata `87:68`, `87:170`, `87:182` |
| Hauteur de chaque card | **335 px** (3 cards identiques) | metadata |
| Largeur totale rangée | `381 × 3 + 16 × 2 = 1175 px` ✓ correspond à la largeur de la frame section | calcul |
| Position absolue (page) | `x = 125`, `y = 903` | metadata `87:169` |
| Position relative à la frame `87:211` | `x = 0`, `y = 118` | calcul (903−785=118) |
| Padding interne de la rangée | **0 px** (les cards occupent toute la largeur, bord à bord avec le frame section) | metadata |

### Cards (ordre Figma)
1. **Sport** (`87:68`) — texte "SPORT" + sous-texte "Football, Basketball, Tennis, MMA et plus"
2. **Esport** (`87:170`) — texte "ESPORT" + sous-texte "CS2, Lol, Valorant, Dota 2, et plus"
3. **Hippique** (`87:182`) — texte "HIPPIQUE" + sous-texte "Saut d'obstacles, Horseball"

> ⚠️ `CLAUDE.md` mentionne `SPORT / ESPORT / GAMING` (avec GAMING "Arrive bientôt..."), mais la maquette livre **SPORT / ESPORT / HIPPIQUE**, sans état "coming soon" visible sur cette frame. À arbitrer avec le client.

> Pour le détail interne d'une `DomainCard`, voir `domain-card-spec.md`. Cette spec ne ré-extrait pas les composants enfants.

---

## 4. Espacement entre header de section et rangée de cards

| Mesure | Valeur | Source |
|---|---|---|
| Bas du titre (texte) | `y = 790 + 44 = 834` | metadata `80:779` |
| Bas de la ligne décorative | `y = 785 + 54 = 839` | metadata `80:780` |
| Top de la rangée de cards | `y = 903` | metadata `87:169` |
| Gap **bas texte → top cards** | **`903 − 834 = 69 px`** | calcul |
| Gap **bas ligne décorative → top cards** | **`903 − 839 = 64 px`** | calcul |

→ La mesure "officielle" retenue par `homepage-spec.md §3` est **`~64 px`** (= mesurée depuis le bas de la ligne décorative, qui est l'élément visuel le plus bas du header). Cohérent avec le token DS `section-y` de 64 px.

---

## 5. Récapitulatif des tokens / valeurs clés

| Élément | Valeur | Token DS suggéré |
|---|---|---|
| Background section | transparent (gradient global) | — |
| Padding-top section | 64 px | `section-y` |
| Padding-bottom section | 96 px (vers Nos Experts) | `section-y-lg` |
| Padding horizontal section | 125 px gauche / 140 px droite (asymétrique sur viewport 1440) | aligner sur `container` (1175 max-w) |
| Titre — typo | DM Serif Display Regular 32 / line-height normal | `text-h2` |
| Titre — couleur | `#FFFFFF` | `text-primary` |
| Ligne décorative — dimensions | 1 px × 54 px (vertical) | — |
| Ligne décorative — couleur | doré (asset image, valeur exacte non exposée — DS = `#DFB968`) | `accent` |
| Ligne décorative — position | à gauche du titre, gap 16 px texte | — |
| Lien "Voir tous" — texte | "Voir tous les domaines" | — |
| Lien "Voir tous" — typo | Work Sans Regular 18 / line-height 18 | `text-body-18` |
| Lien "Voir tous" — couleur | `#FFFFFF` | `text-primary` |
| Lien "Voir tous" — chevron | 15.124 × 6 px, couleur `??` | — |
| Lien "Voir tous" — position | top-right, vertical centré sur le titre | — |
| Layout cards | flex horizontal, gap 16, items-center | — |
| Gap header → cards | 64 px | — |

---

## 6. Écarts détectés avec les specs existantes

### 6.1 vs `design-system.md`

| Sujet | DS dit | Figma (cette extraction) | Verdict |
|---|---|---|---|
| Lien "Voir tous" — taille | 16 px Work Sans Regular (`design-system.md §6 "Lien Voir tous"`) | **18 px** Work Sans Regular | ⚠️ **Écart taille** — Figma fait foi (18 px) |
| Lien "Voir tous" — couleur | non spécifiée explicitement dans le DS | **`#FFFFFF` blanc** | ⚠️ À documenter dans le DS |
| Section title pattern (ligne dorée + H2) | "1px × 54px à gauche du titre, espacée de ~16 px" | ✓ confirmé : 54 px vertical, gap horizontal 16 px | OK |
| Couleur de la ligne décorative | `accent` `#DFB968` | **`??`** (image asset, non exposé par MCP) | À confirmer visuellement |
| Gap cards | 16 px (DS §3 et §7) | ✓ 16 px confirmé | OK |
| Padding container | "1175 max-width, ~132 px chaque côté" | x=125 / 140 (asymétrique) | ⚠️ Léger écart d'alignement (125 vs 132.5 attendu pour un container centré) |

### 6.2 vs `homepage-spec.md §3`

| Sujet | homepage-spec dit | Figma (cette extraction) | Verdict |
|---|---|---|---|
| Lien "Voir tous" — tokens | "`font-body text-body-16 text-muted` + chevron `accent`" | **`text-body-18 text-primary` (blanc)** | ⚠️ **Écart taille (16→18) ET couleur (muted→primary)** — Figma fait foi |
| `padding-top` section | 64 px (= section-y) | ✓ 64 px | OK |
| Position titre | `y=790` + ligne verticale (1 px × 54 px) | ✓ | OK |
| Gap title → cards | ~64 px (cards à y=903) | ✓ 64 px depuis le bas de la ligne décorative | OK |
| Cards : 3 × 381, gap 16 | ✓ | ✓ | OK |
| 3e card : "HIPPIQUE" (≠ GAMING de `CLAUDE.md`) | "remplace GAMING mentionné dans CLAUDE.md" | ✓ confirmé HIPPIQUE | OK (déjà flaggé) |

### 6.3 Inconnues persistantes (`??`)

- **Couleur exacte de la ligne décorative** : asset image, non exposé par `get_variable_defs`. Présumée `#DFB968` d'après le DS et le screenshot, mais à confirmer par inspection visuelle directe dans Figma.
- **Couleur exacte du chevron** du lien "Voir tous" : asset image. Présumée blanche ou dorée — à confirmer.
- **Couleur exacte de la flèche** dans les boutons "Voir les analyses" des cards (hors scope ici, voir `domain-card-spec.md`).
- **Fill / background de la frame section `87:211`** : aucun fill exposé par MCP, présumé transparent (gradient global de page).
- **Hover / focus states** sur le lien "Voir tous" : non maquettés.

---

## 7. Récap structuré pour l'intégration

```
<section className="explore-domains"  /* aucun bg, ~py = section-y/64 haut, section-y-lg/96 bas */>
  <div className="container max-w-[1175px]"  /* horizontalement aligné cf. §1 */>

    {/* Header — 3 éléments en positionnement libre, à composer en flex */}
    <div className="header-row flex items-center justify-between relative">
      {/* Bloc titre : ligne décorative gauche + titre */}
      <div className="title-block flex items-center gap-[16px]">
        <span className="decorative-line w-[1px] h-[54px] bg-accent" />
        <h2 className="font-display text-[32px] leading-none text-white">
          Explore les domaines
        </h2>
      </div>

      {/* Lien droite — vertical centré sur le titre */}
      <a href="..." className="see-all flex items-center gap-[??] text-white font-body text-[18px] leading-[18px]">
        Voir tous les domaines
        <Chevron className="w-[15.124px] h-[6px]" />
      </a>
    </div>

    {/* Espace ~64px (gap header → cards) */}

    {/* Rangée de 3 cards */}
    <div className="domains-row flex items-center gap-[16px] mt-[64px]">
      <DomainCard data={sport} />
      <DomainCard data={esport} />
      <DomainCard data={hippique} />
    </div>

  </div>
</section>
```

Le `gap` interne du lien "Voir tous" entre texte et chevron est mesuré à **31 px** dans Figma mais visuellement plus tassé (la bbox du vector est plus large que le glyph visible) — à ajuster visuellement, valeur de référence 8-16 px probable.
