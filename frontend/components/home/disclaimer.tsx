// Disclaimer légal — uniquement le texte. Le divider décoratif
// "ligne — point — ligne" qui le précède est rendu par le
// <SectionSeparator /> placé avant dans page.tsx (cohérent avec les
// autres transitions de section).
//
// pas de pt : le SectionSeparator au-dessus porte déjà l'espace.
// pb-8 = 32 px : disclaimer rapproché du footer (vs 256 px avant — le
// gap Figma de 257 px était un artefact).
export function Disclaimer() {
  return (
    <section className="pb-8">
      <div className="mx-auto w-full max-w-content px-4 sm:px-8 lg:px-0">
        {/* Mobile : largeur ~315 px (max-w-[315px]) pour rester aligné
            avec le divider décoratif au-dessus. Desktop : 748 px (≈
            largeur du contenu hero). */}
        <p className="mx-auto max-w-[315px] md:max-w-[748px] text-center font-body text-body-16 leading-[1.4] text-muted-foreground">
          Les contenus proposés sur Plarya sont des analyses et opinions personnelles. Ils ne
          constituent en aucun cas des conseils financiers ou des incitations à parier.
        </p>
      </div>
    </section>
  );
}
