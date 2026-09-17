import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // [&_svg]:translate-y-px : correction optique, une icône centrée
  // géométriquement paraît trop haute à côté du texte.
  "group/button inline-flex shrink-0 items-center justify-center gap-4 rounded-2xl whitespace-nowrap font-body transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:translate-y-px [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // CTA principal : dégradé doré.
        primary:
          "rounded-lg bg-gradient-gold text-black border border-accent-strong shadow-shine-soft hover:brightness-105",

        // CTA secondaire à bordure neutre, pour limiter le doré aux CTA principaux.
        secondary:
          "bg-transparent text-foreground border border-surface-elevated hover:bg-white/[0.04] hover:border-foreground/30",

        ghost:
          "bg-transparent text-accent border border-transparent hover:underline underline-offset-4",

        // Achat sur une carte d'analyse ; désactivé, il devient un état
        // « Terminé » gris (opacity-100 annule l'opacité de base).
        white:
          "bg-white text-black hover:bg-white/90 disabled:opacity-100 disabled:bg-surface-elevated disabled:text-muted-foreground disabled:hover:bg-surface-elevated",

        destructive:
          "bg-destructive text-white border border-destructive hover:bg-destructive/90 focus-visible:ring-destructive/40",
      },
      size: {
        default: "px-8 py-4 text-body-16",
        lg: "px-8 py-4 text-h5",
        // Boutons de modale.
        md: "px-5 py-3 text-body-16",
        sm: "px-4 py-2 text-body-16",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // Avec `render` (ex. <Link>), Base UI exige `nativeButton: false`.
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
