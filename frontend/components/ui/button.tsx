import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base : transitions douces 200ms, focus-visible accent, disabled opacity-50.
  // rounded-2xl = 16px (DS).
  // [&_svg]:translate-y-px : correction optique — les icônes Phosphor en
  // items-center sont géométriquement centrées mais paraissent "hautes"
  // par rapport à l'optical center du texte (l'œil place le centre du
  // texte légèrement sous le centre géométrique du line-box, à cause de
  // la masse visuelle concentrée dans la zone x-height + cap-height).
  // Nudge de 1px vers le bas → icône réalignée avec l'optical center.
  "group/button inline-flex shrink-0 items-center justify-center gap-4 rounded-2xl whitespace-nowrap font-body transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:translate-y-px [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // ──────────── Plarya DS variants ────────────

        // CTA principal : "Découvrir les experts", "Devenir créateur",
        // "Publier l'analyse", etc. Gradient doré + bordure Golden
        // Stroke + glow doré.
        // - rounded-[3px] : forme rectangulaire (override le rounded-2xl
        //   du base) — pattern carré demandé par Romain pour ancrer
        //   l'autorité du CTA gold sans round-corners "soft".
        // - shadow-shine-soft : glow doré atténué (7px blur 100 % accent)
        //   vs shadow-shine (15px 70 % orange saturé) — moins criard mais
        //   le doré reste perceptible.
        primary:
          "rounded-[3px] bg-gradient-gold text-black border border-accent-strong shadow-shine-soft hover:brightness-105",

        // CTA secondaire : transparent avec bordure NEUTRE
        // (anciennement bordure dorée — retirée car utilisée partout,
        // ça multipliait le doré sur tout le site sans raison).
        // Hover : léger fond blanc + bordure plus claire.
        //
        // Si on a besoin du look "bordure dorée" pour un CTA marketing
        // secondaire spécifique (rare), override sur la consumer via
        // className="border-accent-strong hover:border-accent" — c'est
        // l'exception, plus la règle.
        secondary:
          "bg-transparent text-foreground border border-surface-elevated hover:bg-white/[0.04] hover:border-foreground/30",

        // Lien doré : "Voir tous les experts" (top-right des sections).
        // Pas de bordure, pas de fond.
        ghost:
          "bg-transparent text-accent border border-transparent hover:underline underline-offset-4",

        // CTA "Accéder (3,50€)" — bouton blanc sur card analyse.
        // Disabled = bouton gris "Terminé" (bg #181818, texte #898181).
        // disabled:opacity-100 annule l'opacity-50 de la base.
        white:
          "bg-white text-black hover:bg-white/90 disabled:opacity-100 disabled:bg-surface-elevated disabled:text-muted-foreground disabled:hover:bg-surface-elevated",

        // Action destructive : suppression compte, annulation
        // abonnement, etc. Solid red plein, texte blanc, hover plus
        // foncé. PAS de bordure dorée (collision esthétique avec le
        // rouge). Focus ring rouge (cohérent avec l'intention).
        destructive:
          "bg-destructive text-white border border-destructive hover:bg-destructive/90 focus-visible:ring-destructive/40",

        // ──────────── Legacy shadcn variants (conservés) ────────────
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // DS CTA standard : padding 16/32, text-body-16 → h ≈ 48px
        // (= "Voir les analyses" Domain card, 225×48)
        default: "px-8 py-4 text-body-16",

        // Version Medium 20 : padding 16/32, text-h5 → h ≈ 55px
        // (= "Découvrir les experts" Hero 304×55, "Devenir créateur" 258×55)
        // font-weight Medium porté par le token text-h5 (cf. globals.css).
        lg: "px-8 py-4 text-h5",

        // Modale : compact mais lisible. h ≈ 44px. Utiliser pour les
        // CTAs intra-modale (delete-account, confirm-modal, etc.) où
        // `lg` est trop massif et `sm` un peu trop chétif vu l'enjeu.
        md: "px-5 py-3 text-body-16",

        // Bouton inline plus petit
        sm: "px-4 py-2 text-body-16",

        // Existants (legacy, pour shadcn V1)
        xs: "h-6 gap-1 rounded-lg px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // Quand on passe un `render` (typiquement `<Link>` pour rendre le
  // bouton en tant que <a>), Base UI exige `nativeButton: false` pour
  // ne pas réclamer un <button> natif. On détecte la présence de
  // `render` et on défaut `nativeButton` à false automatiquement.
  const resolvedNativeButton = nativeButton ?? render === undefined;
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      nativeButton={resolvedNativeButton}
      {...props}
    />
  );
}

export { Button, buttonVariants };
