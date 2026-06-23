import { cn } from "@/lib/utils";

// ════════════════════════════════════════════════════════════════════
// Tokens DA "form publication" — partagés entre /dashboard (publish
// analysis), /compte expert (Note quotidienne, Profil expert),
// /devenir-expert et tout autre form où la DA cohérente est requise.
//
// Pattern :
//   - Card : fond surface-elevated (#181818, +5 luminance vs body #131212),
//     radius 8px, pas de border / shadow / gradient. Le contraste vient
//     uniquement de la nuance d'élévation.
//   - Input : border 1px border-subtle (#2A2A2A), radius 3px, bg transparent
//     (la surface card transparaît). Focus border doré subtil (accent/60).
//   - Label : 11px uppercase tracking 0.15em muted (sur-titre éditorial).
//
// Anti-pattern à ne pas réintroduire : pas de glow, pas de gradient
// sur inputs/labels, pas de ring sur focus (border only).
// ════════════════════════════════════════════════════════════════════

// Card : conteneur principal de form. Padding 6 mobile / 10 desktop
// (à override via className si besoin de plus grand padding type
// hero form publication).
export const formDaCardCls = "rounded-lg bg-surface-elevated p-6 md:p-10";

// Input texte / number — hauteur fixe 46px pour aligner avec les Select.
// `focus-visible:ring-0 aria-invalid:ring-0` neutralise les rings par
// défaut de shadcn (au cas où la classe est appliquée à un <Input> via
// className).
export const formDaInputCls = cn(
  "h-[46px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:ring-0",
  "aria-invalid:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

// Textarea — même DA que l'input mais resize-y et min-h 120.
export const formDaTextareaCls = cn(
  "min-h-[120px] w-full resize-y rounded-[3px] border border-border-subtle bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:ring-0",
  "aria-invalid:ring-0",
);

// Label éditorial — éléments interactifs ou groupes de champs. Quand
// le surtitre ne s'attache pas à un input unique (ex. groupe de toggle
// buttons), utiliser <span className={formDaLabelCls}> au lieu de
// <label> pour respecter jsx-a11y/label-has-associated-control.
export const formDaLabelCls =
  "block font-body text-[11px] uppercase tracking-[0.15em] text-muted-foreground";

// État invalide (validation KO) — border destructive subtle.
export const formDaInputInvalid =
  "border-destructive/60 focus-visible:border-destructive";

/**
 * Classes Tailwind pour les inputs en modale (login, checkout email,
 * delete-account). Hauteur 48px, fond noir 40 %, bordure subtile,
 * focus accent doré. Aligné sur le DS Plarya.
 */
export const formDaModalInputCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);
