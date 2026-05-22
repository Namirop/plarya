import { DecorativeDivider } from "@/components/ui/decorative-divider";

// Séparateur visuel entre 2 sections de la homepage : un divider doré
// "ligne — point — ligne" centré, avec un padding vertical équilibré
// pour donner de la respiration sans surcharger la page.
//
// Mobile : pt-16 (= 64 px) + pb-12 (= 48 px) pour donner de l'air sans
// trop écarter sur petit écran.
// Desktop : py-20 (= 80 px haut + 80 px bas). Avec le divider (~6 px),
// gap visuel total ~166 px — le précédent py-10 était trop serré entre
// Devenir Créateur et le Disclaimer (retour Romain).
export function SectionSeparator() {
  return (
    <div className="pt-16 pb-12 md:py-20">
      <DecorativeDivider />
    </div>
  );
}
