import { cn } from "./utils";

// Classes Tailwind partagées par les sections de l'espace admin.

// Champ compact pour cellule de tableau.
export const fieldClsCompact = cn(
  "w-full rounded-xl border border-surface-elevated bg-black/40 px-3 py-2",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:outline-none",
);

export const tableWrapperCls =
  "overflow-hidden rounded-2xl border border-surface-elevated bg-black/40";
export const tableScrollCls = "overflow-x-auto";
export const tableCls = "w-full text-left";
export const theadRowCls = "border-b border-surface-elevated bg-black/60";
export const thCls = "px-4 py-3 font-body text-body-16 font-normal text-muted-foreground";
export const thNumericCls = cn(thCls, "text-right");
export const tbodyRowCls =
  "border-b border-surface-elevated last:border-b-0 transition-colors hover:bg-black/30";
export const tdCls = "px-4 py-3 font-body text-body-16 text-foreground";
export const tdMutedCls = "px-4 py-3 font-body text-body-16 text-muted-foreground";
export const tdNumericCls = cn(tdCls, "text-right");

export const badgeBaseCls =
  "inline-flex items-center rounded-full px-3 py-1 font-body text-body-16";

export type BadgeTone = "success" | "danger" | "muted" | "premium";
export const BADGE_TONES: Record<BadgeTone, string> = {
  success: "bg-green-500/20 text-green-500",
  danger: "bg-red-500/20 text-red-500",
  muted: "bg-muted-foreground/20 text-muted-foreground",
  // Volontairement neutre : répété sur chaque vente MONTHLY du tableau.
  premium: "bg-foreground/10 text-foreground",
};

// Carte remplaçant une ligne de tableau sous le breakpoint sm.
export const mobileCardCls = "rounded-2xl border border-surface-elevated bg-black/40 p-4";
