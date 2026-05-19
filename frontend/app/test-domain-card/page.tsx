/**
 * Page de test temporaire (/test-domain-card) pour valider visuellement
 * le composant DomainCard dans ses 3 variantes actives (Sport / Esport /
 * Hippique) + l'état coming-soon.
 *
 * À SUPPRIMER une fois la migration des composants terminée.
 * Voir CLAUDE.md §"Pages de test temporaires".
 *
 * Note : les images sont des placeholders (picsum.photos) — seront
 * remplacées par les vrais assets lors de l'intégration de la homepage.
 */
import { DomainCard } from "@/components/domains/domain-card";

const PLACEHOLDER_SPORT = "https://picsum.photos/seed/plarya-sport/381/335";
const PLACEHOLDER_ESPORT = "https://picsum.photos/seed/plarya-esport/381/335";
const PLACEHOLDER_HIPPIQUE =
  "https://picsum.photos/seed/plarya-hippique/381/335";

export default function TestDomainCardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-8">
      <div className="max-w-content mx-auto space-y-16">
        <header className="space-y-2">
          <h1 className="font-display text-h1 text-foreground">
            DomainCard — Test page
          </h1>
          <p className="font-body text-body-16 text-muted-foreground">
            Les 3 variantes actives + l&apos;état coming-soon. Images
            placeholder via picsum.photos. À supprimer après migration.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="font-display text-h2 text-foreground border-l-2 border-accent-strong pl-4">
            3 variantes actives (Sport / Esport / Hippique)
          </h2>
          <div className="flex flex-wrap items-start gap-4">
            <DomainCard
              image={PLACEHOLDER_SPORT}
              title="SPORT"
              subtitle={"Football, Basketball, Tennis,\nMMA et plus"}
              href="/experts?domain=sport"
            />
            <DomainCard
              image={PLACEHOLDER_ESPORT}
              title="ESPORT"
              subtitle={"CS2, LoL, Valorant, Dota 2,\net plus"}
              href="/experts?domain=esport"
            />
            <DomainCard
              image={PLACEHOLDER_HIPPIQUE}
              title="HIPPIQUE"
              subtitle="Saut d&apos;obstacles, Horseball"
              href="/experts?domain=hippique"
            />
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-h2 text-foreground border-l-2 border-accent-strong pl-4">
            État coming-soon (image désaturée + assombrie, sous-titre
            remplacé, bouton disabled)
          </h2>
          <div className="flex flex-wrap items-start gap-4">
            <DomainCard
              image={PLACEHOLDER_HIPPIQUE}
              title="HIPPIQUE"
              subtitle="Saut d&apos;obstacles, Horseball"
              state="coming-soon"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
