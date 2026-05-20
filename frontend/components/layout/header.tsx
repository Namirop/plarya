import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  variant?: "connected" | "guest";
  /** Position sticky en haut au scroll. Désactivable pour les pages de test. */
  sticky?: boolean;
  /** Callback déclenché par "Déconnexion" (variant connected). */
  onLogout?: () => void;
  /** Callback déclenché par "Se connecter" (variant guest). Typiquement ouvre une modale. */
  onSignIn?: () => void;
  /** Href de "Créer un compte" (variant guest). */
  signUpHref?: string;
}

const navItemClass =
  "font-body text-body-16 text-foreground transition-opacity hover:opacity-70";

export function Header({
  variant = "guest",
  sticky = true,
  onLogout,
  onSignIn,
  signUpHref = "/devenir-expert",
}: HeaderProps) {
  return (
    <header
      className={cn(
        // overflow-visible : le logo (h=160) déborde au-dessus/en dessous
        // de la barre h=70 pour compenser le padding transparent du PNG.
        // bg-background/90 + backdrop-blur-md : header quasi-opaque avec
        // un léger flou — masque le contenu qui défile derrière au scroll
        // (vs l'ancien bg-black/30 qui laissait tout transparent).
        "flex h-[70px] w-full items-center justify-between overflow-visible bg-background/90 backdrop-blur-md px-4 lg:px-32 py-2",
        sticky && "sticky top-0 z-50",
      )}
    >
      {/* Le PNG du logo (1536×1024, transparent) contient beaucoup de
          padding autour du glyphe visible (le glyphe occupe ~30 % de la
          hauteur et est positionné légèrement au-dessus du centre vertical
          du canvas — d'où le `translate-y-[6px]` qui re-aligne le glyphe
          avec les boutons d'auth à droite, vertical-centrés sur la barre).
          → Si l'alignement vertical te déplaît : ajuster la valeur de
          translate-y ici (négatif = monter, positif = descendre).
          Ratio width/height (240 × 160 = 1.5) aligné sur l'intrinsèque
          pour éviter le warning d'aspect ratio Next/Image. */}
      <Link href="/" className="flex shrink-0 items-center">
        <Image
          src="/full-logo-remove.png"
          alt="Plarya"
          width={240}
          height={160}
          className="h-[160px] w-auto translate-y-[10px]"
          priority
        />
      </Link>

      {variant === "connected" ? (
        <nav className="flex items-center gap-16">
          <Link href="/dashboard" className={navItemClass}>
            Dashboard
          </Link>
          <Link href="/compte" className={navItemClass}>
            Mon Compte
          </Link>
          <button type="button" onClick={onLogout} className={navItemClass}>
            Déconnexion
          </button>
        </nav>
      ) : (
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onSignIn}>
            Se connecter
          </Button>
          <Button variant="primary" render={<Link href={signUpHref} />}>
            Créer un compte
          </Button>
        </div>
      )}
    </header>
  );
}
