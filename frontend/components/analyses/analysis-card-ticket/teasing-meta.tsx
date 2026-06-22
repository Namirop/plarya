import { teasingLabel } from "@/lib/analysis-format";

export function TeasingMeta({ teasing, ligueLabel }: { teasing: string; ligueLabel: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tampon teasing — encart fin façon "classe" imprimée sur le
          ticket : ressort par le contraste (filet + texte blanc) sans
          pill ni or. */}
      <span className="inline-flex items-center rounded-[2px] border border-foreground/30 px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.18em] text-foreground">
        {teasingLabel(teasing)}
      </span>
      {ligueLabel && (
        <span className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {ligueLabel}
        </span>
      )}
    </div>
  );
}
