import { DecorativeDivider } from "@/components/ui/decorative-divider";

// Séparateur visuel entre 2 sections de la homepage : un divider doré
// "ligne — point — ligne" centré, avec un padding vertical équilibré
// pour donner de la respiration sans surcharger la page.
//
// py-20 = 80 px haut + 80 px bas. Avec le divider (~6 px), le gap
// visuel total entre 2 sections = ~166 px. Le précédent py-10 donnait
// un gap trop serré entre Devenir Créateur et le Disclaimer (cf.
// retour Romain — section "trop proche").
export function SectionSeparator() {
  return (
    <div className="py-20">
      <DecorativeDivider />
    </div>
  );
}
