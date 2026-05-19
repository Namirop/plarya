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
        "flex h-[70px] w-full items-center justify-between bg-black/30 px-4 lg:px-32 py-2",
        sticky && "sticky top-0 z-50",
      )}
    >
      <Link href="/" className="flex shrink-0 items-center">
        <Image
          src="/full-logo-remove.png"
          alt="Plarya"
          width={152}
          height={54}
          className="h-[54px] w-auto"
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
