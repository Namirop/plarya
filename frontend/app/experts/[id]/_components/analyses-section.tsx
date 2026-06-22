import { AnalysisCardTicket } from "@/components/analyses/analysis-card-ticket";
import type { PronoData } from "@/lib/experts";

/**
 * Section "Analyses du jour" : titre + liste des tickets. `pronos` est
 * déjà filtré sur les analyses PENDING par le container. Rien rendu si
 * la liste est vide.
 */
export function AnalysesSection({
  pronos,
  hasAccess,
}: {
  pronos: PronoData[];
  hasAccess: boolean;
}) {
  if (pronos.length === 0) return null;

  return (
    <section className="mt-12">
      {/* Titre fort en display (Hubot Sans) — porte la page, le reste
          de la hiérarchie suit la card-ticket. */}
      <h2 className="mb-8 font-display text-3xl font-normal text-foreground md:text-5xl">
        {pronos.length === 1 ? "Analyses du jour" : `${pronos.length} analyses du jour`}
      </h2>

      <div className="flex flex-col gap-8">
        {pronos.map((prono) => (
          <AnalysisCardTicket key={prono.id} analysis={prono} hasAccess={hasAccess} />
        ))}
      </div>
    </section>
  );
}
