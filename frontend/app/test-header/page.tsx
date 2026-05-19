/**
 * Page de test temporaire (/test-header) pour valider visuellement
 * le composant Header dans ses deux variants : connected et guest.
 *
 * Les Headers sont rendus avec sticky=false pour qu'ils s'empilent
 * naturellement et puissent être comparés côte à côte. En usage réel
 * (layout.tsx), le sticky par défaut est conservé.
 *
 * À SUPPRIMER une fois la migration des composants terminée.
 * Voir CLAUDE.md §"Pages de test temporaires".
 */
import { Header } from "@/components/layout/header";

export default function TestHeaderPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-8 py-16">
        <header className="max-w-content mx-auto space-y-2">
          <h1 className="font-display text-h1 text-foreground">
            Header — Test page
          </h1>
          <p className="font-body text-body-16 text-muted-foreground">
            Les 2 variants (connected / guest), empilés avec sticky désactivé
            pour la lisibilité. Sous chaque header, un bandeau sombre pour
            valider que le voile noir 30% reste lisible par-dessus un hero.
          </p>
        </header>
      </div>

      <section className="space-y-2">
        <h2 className="max-w-content mx-auto px-8 font-display text-h2 text-foreground border-l-2 border-accent-strong pl-4">
          Variant &quot;connected&quot; (Dashboard / Mon Compte / Déconnexion)
        </h2>
        <div className="relative">
          <Header variant="connected" sticky={false} />
          <div className="h-32 bg-gradient-to-b from-zinc-800 to-background" />
        </div>
      </section>

      <section className="mt-16 space-y-2">
        <h2 className="max-w-content mx-auto px-8 font-display text-h2 text-foreground border-l-2 border-accent-strong pl-4">
          Variant &quot;guest&quot; (Se connecter + Créer un compte)
        </h2>
        <div className="relative">
          <Header variant="guest" sticky={false} />
          <div className="h-32 bg-gradient-to-b from-zinc-800 to-background" />
        </div>
      </section>

      <div className="px-8 py-16">
        <p className="max-w-content mx-auto font-body text-body-16 text-muted-foreground">
          Note : le bandeau sombre derrière chaque header simule un hero photo.
          Le bg-black/30 du header doit créer un voile visible mais discret.
        </p>
      </div>
    </div>
  );
}
