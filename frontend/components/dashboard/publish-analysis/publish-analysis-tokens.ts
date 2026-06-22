// Tokens visuels partagés entre les 2 étapes du wizard de publication
// d'analyse.

import { cn } from "@/lib/utils";

export const INPUT_BASE = cn(
  "w-full rounded-[3px] border border-[#2A2A2A] bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const INPUT_INVALID = "border-destructive/60 focus-visible:border-destructive";

export const SELECT_TRIGGER = cn(
  "flex w-full items-center justify-between gap-2 rounded-[3px] border border-[#2A2A2A] bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground data-placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60",
  "h-[46px] data-[size=default]:h-[46px]",
);

// Popup déroulant : bg légèrement au-dessus du form (#181818) pour
// que le menu flotte sans paraître écrasé. Border et radius matchent
// les inputs (3px, #2A2A2A) → cohérence visuelle avec le form.
export const SELECT_CONTENT = cn(
  "rounded-[3px] border border-[#2A2A2A] bg-[#1F1F1F] text-foreground shadow-xl",
);

export const SELECT_ITEM = cn(
  "cursor-pointer rounded-sm px-3 py-2 font-body text-[15px] text-foreground",
  "data-highlighted:bg-white/[0.06] data-highlighted:text-foreground",
);

// Sur-titre (label de groupe ou de champ) — 11px uppercase tracking
// 0.15em muted. JAMAIS d'accent doré dessus.
export const EYEBROW_CLASS = cn(
  "block font-body text-[11px] uppercase tracking-[0.15em] text-muted-foreground",
);

export const ERROR_TEXT = "mt-2 font-body text-[13px] leading-[1.3] text-destructive/90";
