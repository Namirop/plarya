import { DecorativeDivider } from "@/components/ui/decorative-divider";

// Séparateur visuel entre 2 sections de la homepage : un divider doré
// "ligne — point — ligne" centré, avec un padding vertical équilibré
// pour donner de la respiration sans surcharger la page.
//
// py-10 = 40 px haut + 40 px bas. Avec le divider (~6 px), le gap
// visuel total entre 2 sections = ~86 px.
export function SectionSeparator() {
  return (
    <div className="py-10">
      <DecorativeDivider />
    </div>
  );
}
