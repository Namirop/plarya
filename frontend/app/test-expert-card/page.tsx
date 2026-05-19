/**
 * Page de test temporaire (/test-expert-card) pour valider visuellement
 * le composant ExpertCard dans ses deux états (Unlocked / Locked).
 *
 * À SUPPRIMER une fois la migration des composants terminée.
 * Voir CLAUDE.md §"Pages de test temporaires".
 */
import { ExpertCard } from "@/components/experts/expert-card";

const MOCK_ANALYSES = [
  { label: "Celtics - Knicks", isPickOfTheDay: true },
  { label: "UFC Fight Nights", isPickOfTheDay: false },
];

const MOCK_CATEGORIES = ["FOOTBALL", "BASKETBALL", "MMA"];

export default function TestExpertCardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-8">
      <div className="max-w-content mx-auto space-y-16">
        <header className="space-y-2">
          <h1 className="font-display text-h1 text-foreground">
            ExpertCard — Test page
          </h1>
          <p className="font-body text-body-16 text-muted-foreground">
            Référence visuelle pour les deux états (Unlocked / Locked) de la
            carte vitrine homepage. À supprimer après migration.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="font-display text-h2 text-foreground border-l-2 border-accent-strong pl-4">
            Unlocked vs Locked (côte à côte)
          </h2>
          <div className="flex flex-wrap items-start gap-12">
            <div className="flex flex-col items-center gap-3">
              <ExpertCard
                avatar="/profile.jpg"
                pseudo="MultiSport"
                viewsCount={152}
                categories={MOCK_CATEGORIES}
                analyses={MOCK_ANALYSES}
              />
              <span className="font-body text-body-16 text-muted-foreground">
                Unlocked (state par défaut)
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ExpertCard
                avatar="/profile.jpg"
                pseudo="MultiSport"
                viewsCount={152}
                categories={MOCK_CATEGORIES}
                analyses={MOCK_ANALYSES}
                locked
              />
              <span className="font-body text-body-16 text-muted-foreground">
                Locked (locked=true)
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-h2 text-foreground border-l-2 border-accent-strong pl-4">
            Variations (pseudo long, catégorie unique, aucune pick of the day)
          </h2>
          <div className="flex flex-wrap items-start gap-12">
            <div className="flex flex-col items-center gap-3">
              <ExpertCard
                avatar="/profile.jpg"
                pseudo="ExpertPseudoTresTresLong"
                viewsCount={1428}
                categories={["FOOTBALL"]}
                analyses={[
                  { label: "Real Madrid - Barcelone", isPickOfTheDay: false },
                  { label: "Lens vs Rennes", isPickOfTheDay: false },
                ]}
              />
              <span className="font-body text-body-16 text-muted-foreground">
                Pseudo long + 1 catégorie + 0 pick du jour
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ExpertCard
                avatar="/profile.jpg"
                pseudo="ProTennis"
                viewsCount={87}
                categories={["TENNIS", "FOOTBALL", "BASKETBALL"]}
                analyses={[
                  { label: "Djokovic vs Alcaraz", isPickOfTheDay: true },
                  { label: "Sinner vs Medvedev", isPickOfTheDay: true },
                ]}
              />
              <span className="font-body text-body-16 text-muted-foreground">
                Les 2 lignes en pick du jour
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
