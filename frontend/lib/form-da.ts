import { cn } from "@/lib/utils";

// Classes partagées des formulaires (dashboard, compte, devenir expert) :
// carte détachée du fond par sa seule élévation, champs à bordure fine,
// focus signalé par la bordure plutôt que par un ring.

export const formDaCardCls = "rounded-lg bg-surface-elevated p-6 md:p-10";

// Hauteur alignée sur les Select ; `ring-0` neutralise les rings shadcn.
export const formDaInputCls = cn(
  "h-[46px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:ring-0",
  "aria-invalid:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const formDaTextareaCls = cn(
  "min-h-[120px] w-full resize-y rounded-[3px] border border-border-subtle bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:ring-0",
  "aria-invalid:ring-0",
);

// Sans champ unique associé (groupe de boutons), l'appliquer à un <span>
// plutôt qu'à un <label> (jsx-a11y/label-has-associated-control).
export const formDaLabelCls =
  "block font-body text-[11px] uppercase tracking-[0.15em] text-muted-foreground";

export const formDaInputInvalid = "border-destructive/60 focus-visible:border-destructive";

/** Champs des modales (connexion, email de paiement, suppression de compte). */
export const formDaModalInputCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);
