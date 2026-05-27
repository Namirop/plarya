import { cn } from "./utils";

/**
 * Tokens de style partagés par toutes les sections admin (extraits du
 * monolithe `app/admin/page.tsx`). Centralisés pour garantir la
 * cohérence visuelle entre Revenue/Sales/ByExpert/Experts/Pronos/Users
 * — toute modification se fait à un seul endroit.
 *
 * Pas de "use client" : ce sont juste des strings ; importable depuis
 * des composants client comme server (server components ne rendent
 * jamais ces tables, mais les helpers sont neutres).
 */

// Pattern input compact pour cellules de tableau (px-3 py-2 vs px-4
// py-3 du fieldCls standard).
export const fieldClsCompact = cn(
  "w-full rounded-xl border border-surface-elevated bg-black/40 px-3 py-2",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:outline-none",
);

// Pattern table DS unifié.
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

// Pattern badge DS — pill rounded-full, 4 sémantiques.
export const badgeBaseCls =
  "inline-flex items-center rounded-full px-3 py-1 font-body text-body-16";

export type BadgeTone = "success" | "danger" | "muted" | "premium";
export const BADGE_TONES: Record<BadgeTone, string> = {
  success: "bg-green-500/20 text-green-500",
  danger: "bg-red-500/20 text-red-500",
  muted: "bg-muted-foreground/20 text-muted-foreground",
  // Anciennement bg-accent/20 text-accent (doré) — neutralisé en 3B :
  // utilisé pour les rows MONTHLY de SalesSection (admin) qui se
  // multipliaient à chaque ligne. Admin = utilitaire, pas marketing.
  premium: "bg-foreground/10 text-foreground",
};

// Card mobile (utilisée dans le double-rendering sm:hidden / hidden sm:block).
export const mobileCardCls = "rounded-2xl border border-surface-elevated bg-black/40 p-4";
