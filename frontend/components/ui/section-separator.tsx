import { DecorativeDivider } from "@/components/ui/decorative-divider";

// Séparateur décoratif centré entre deux sections de l'accueil.
export function SectionSeparator() {
  return (
    <div className="pt-16 pb-12 md:py-20">
      <DecorativeDivider />
    </div>
  );
}
