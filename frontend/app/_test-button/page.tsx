/**
 * Page de test temporaire pour valider visuellement le composant Button
 * et tous ses variants/sizes avec les tokens du DS golden-da.
 *
 * À SUPPRIMER une fois la migration des composants terminée.
 * Voir CLAUDE.md §"Pages de test temporaires".
 */
import { Button } from "@/components/ui/button";

export default function TestButtonPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-8">
      <div className="max-w-content mx-auto space-y-16">
        <header className="space-y-2">
          <h1 className="font-display text-h1 text-foreground">
            Button — Test page
          </h1>
          <p className="font-body text-body-16 text-muted-foreground">
            Référence visuelle pour les variants Plarya DS. À supprimer après
            migration.
          </p>
        </header>

        {/* ─────────────────── DS VARIANTS ─────────────────── */}
        <Section title="DS — Primary (gradient gold)">
          <Row label="size default">
            <Button variant="primary">Voir les analyses</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </Row>
          <Row label="size lg (Hero CTA)">
            <Button variant="primary" size="lg">
              Découvrir les experts
            </Button>
            <Button variant="primary" size="lg">
              Devenir créateur
            </Button>
          </Row>
          <Row label="size sm">
            <Button variant="primary" size="sm">
              S&apos;inscrire
            </Button>
          </Row>
        </Section>

        <Section title="DS — Secondary (transparent + gold border)">
          <Row label="size default">
            <Button variant="secondary">Voir toutes les analyses</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </Row>
          <Row label="size lg">
            <Button variant="secondary" size="lg">
              Action secondaire
            </Button>
          </Row>
          <Row label="size sm">
            <Button variant="secondary" size="sm">
              Filtrer
            </Button>
          </Row>
        </Section>

        <Section title="DS — Ghost (lien doré)">
          <Row label="size default">
            <Button variant="ghost">Voir tous les experts →</Button>
            <Button variant="ghost" disabled>
              Disabled
            </Button>
          </Row>
          <Row label="size sm">
            <Button variant="ghost" size="sm">
              Voir tous →
            </Button>
          </Row>
        </Section>

        {/* ─────────────────── LEGACY VARIANTS ─────────────────── */}
        <Section title="Legacy — variants conservés (V1)">
          <Row label="default">
            <Button variant="default">Default</Button>
          </Row>
          <Row label="outline (utilisé par admin/dashboard)">
            <Button variant="outline">Annuler</Button>
            <Button variant="outline" size="sm">
              Modifier
            </Button>
          </Row>
          <Row label="destructive">
            <Button variant="destructive">Supprimer</Button>
          </Row>
          <Row label="link">
            <Button variant="link">Lien classique</Button>
          </Row>
        </Section>

        {/* ─────────────────── STATES ─────────────────── */}
        <Section title="États (focus visible : Tab dessus)">
          <Row label="primary — hover, focus, disabled">
            <Button variant="primary">Hover me</Button>
            <Button variant="primary">Tab to focus</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </Row>
          <Row label="secondary — hover, focus, disabled">
            <Button variant="secondary">Hover me</Button>
            <Button variant="secondary">Tab to focus</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </Row>
        </Section>

        {/* ─────────────────── ICON SIZES ─────────────────── */}
        <Section title="Icon sizes (legacy)">
          <Row label="icon variants">
            <Button variant="outline" size="icon">
              <span>★</span>
            </Button>
            <Button variant="outline" size="icon-sm">
              <span>★</span>
            </Button>
            <Button variant="outline" size="icon-lg">
              <span>★</span>
            </Button>
          </Row>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <h2 className="font-display text-h2 text-foreground border-l-2 border-accent-strong pl-4">
        {title}
      </h2>
      <div className="space-y-4 rounded-2xl border border-white/5 bg-surface/50 p-8">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-body-16 text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}
