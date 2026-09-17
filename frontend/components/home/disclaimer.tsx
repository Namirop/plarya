// Mention légale de bas d'accueil ; l'espace supérieur est porté par le
// SectionSeparator qui la précède.
export function Disclaimer() {
  return (
    <section className="pb-8">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <p className="mx-auto max-w-[315px] md:max-w-[748px] text-center font-body text-body-16 leading-[1.4] text-muted-foreground">
          Les contenus proposés sur Plarya sont des analyses et opinions personnelles. Ils ne
          constituent en aucun cas des conseils financiers ou des incitations à parier.
        </p>
      </div>
    </section>
  );
}
