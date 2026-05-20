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
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <p className="mx-auto max-w-[748px] text-center font-body text-body-16 text-muted-foreground">
          Les contenus proposés sur Plarya sont des analyses et opinions
          personnelles. Ils ne constituent en aucun cas des conseils
          financiers ou des incitations à parier.
        </p>
      </div>
    </section>
  );
}
