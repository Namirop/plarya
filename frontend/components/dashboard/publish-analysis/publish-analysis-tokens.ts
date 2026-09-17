// Classes partagées par les deux étapes du formulaire de publication.

import { cn } from "@/lib/utils";

export const INPUT_BASE = cn(
  "w-full rounded-[3px] border border-border-subtle bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

export const INPUT_INVALID = "border-destructive/60 focus-visible:border-destructive";

export const SELECT_TRIGGER = cn(
  "flex w-full items-center justify-between gap-2 rounded-[3px] border border-border-subtle bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground data-placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60",
  "h-[46px] data-[size=default]:h-[46px]",
);

// Menu déroulant un niveau d'élévation au-dessus du formulaire.
export const SELECT_CONTENT = cn(
  "rounded-[3px] border border-border-subtle bg-surface-3 text-foreground shadow-xl",
);

export const SELECT_ITEM = cn(
  "cursor-pointer rounded-sm px-3 py-2 font-body text-[15px] text-foreground",
  "data-highlighted:bg-white/[0.06] data-highlighted:text-foreground",
);

// Surtitre de groupe ou de champ.
export const EYEBROW_CLASS = cn(
  "block font-body text-[11px] uppercase tracking-[0.15em] text-muted-foreground",
);

export const ERROR_TEXT = "mt-2 font-body text-[13px] leading-[1.3] text-destructive/90";
