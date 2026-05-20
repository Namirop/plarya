"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeaderRole = "USER" | "TIPSTER" | "ADMIN";

export interface HeaderProps {
  variant?: "connected" | "guest";
  /** Rôle de l'utilisateur connecté. Pilote les liens de nav affichés
   *  (cf. nav role-aware §5 de project-state.md) :
   *    - USER  : "Mon Compte" (vue acheteur : abonnements + historique)
   *    - TIPSTER : "Dashboard" + "Mon Compte" (éditeur profil expert)
   *    - ADMIN : "Admin" uniquement
   *  Ignoré en variant="guest". Défaut USER (safe pour les rôles
   *  inconnus — affiche le moins de liens). */
  role?: HeaderRole;
  /** Position sticky en haut au scroll. Désactivable pour les pages de test. */
  sticky?: boolean;
  /** Callback déclenché par "Déconnexion" (variant connected). */
  onLogout?: () => void;
  /** Callback déclenché par "Se connecter" (variant guest). Typiquement ouvre une modale. */
  onSignIn?: () => void;
  /** Href de "Créer un compte" (variant guest). */
  signUpHref?: string;
}

interface NavLink {
  href: string;
  label: string;
}

// Mapping role → liens de nav. Source unique de vérité, utilisée en
// desktop ET en mobile (panel dropdown) pour rester cohérent.
function navLinksForRole(role: HeaderRole): NavLink[] {
  switch (role) {
    case "TIPSTER":
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/compte", label: "Mon Compte" },
      ];
    case "ADMIN":
      return [{ href: "/admin", label: "Admin" }];
    case "USER":
    default:
      return [{ href: "/compte", label: "Mon Compte" }];
  }
}

const navItemClass =
  "font-body text-body-16 text-foreground transition-opacity hover:opacity-70";

export function Header({
  variant = "guest",
  role = "USER",
  sticky = true,
  onLogout,
  onSignIn,
  signUpHref = "/devenir-expert",
}: HeaderProps) {
  const navLinks = variant === "connected" ? navLinksForRole(role) : [];
  // Burger menu mobile : panel dropdown sous le header. Ferme au scroll
  // et au resize vers desktop (md ≥ 768px) pour éviter un état orphelin
  // si l'utilisateur passe en desktop avec le menu ouvert.
  const [menuOpen, setMenuOpen] = useState(false);

  // Tracking scroll : au-dessus de 10 px de scroll, on bascule le
  // header d'un fond transparent (haut de page, fondu avec le hero) à
  // un fond sombre + blur (pour cacher le contenu qui défile derrière
  // en mobile).
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function close() {
      setMenuOpen(false);
    }
    function onResize() {
      if (window.innerWidth >= 768) setMenuOpen(false);
    }
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // overflow-visible : le logo (h=160) déborde au-dessus/en dessous
        // de la barre h=70 pour compenser le padding transparent du PNG.
        // Mobile : transparent en haut de page (fondu avec le hero),
        // bg-background/90 + blur dès que `scrolled` passe à true pour
        // masquer le contenu qui défile derrière (cf. effet "frosted").
        // Desktop (md+) : toujours bg-background/90 + backdrop-blur-md.
        // Transition douce sur bg + backdrop pour éviter le flash.
        "relative flex h-[70px] w-full items-center justify-between overflow-visible px-4 lg:px-32 py-2",
        "transition-colors duration-200 ease-out",
        "md:bg-background/90 md:backdrop-blur-md",
        scrolled
          ? "bg-background/90 backdrop-blur-md"
          : "bg-transparent",
        sticky && "sticky top-0 z-50",
      )}
    >
      {/* Le PNG du logo (1536×1024, transparent) contient beaucoup de
          padding autour du glyphe visible (le glyphe occupe ~30 % de la
          hauteur et est positionné légèrement au-dessus du centre vertical
          du canvas — d'où le `translate-y-[6px]` qui re-aligne le glyphe
          avec les boutons d'auth à droite, vertical-centrés sur la barre).
          Mobile : on rend le logo plus petit (h-[110px]) pour matcher la
          spec Figma (128×46 visible). */}
      <Link href="/" className="flex shrink-0 items-center">
        <Image
          src="/full-logo-remove.png"
          alt="Plarya"
          width={240}
          height={160}
          className="h-[110px] md:h-[160px] w-auto translate-y-[6px] md:translate-y-[10px]"
          priority
        />
      </Link>

      {/* Nav desktop : visible md+ — liens pilotés par `navLinksForRole`. */}
      {variant === "connected" ? (
        <nav className="hidden md:flex items-center gap-16">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={navItemClass}>
              {l.label}
            </Link>
          ))}
          <button type="button" onClick={onLogout} className={navItemClass}>
            Déconnexion
          </button>
        </nav>
      ) : (
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" onClick={onSignIn}>
            Se connecter
          </Button>
          <Button variant="primary" render={<Link href={signUpHref} />}>
            Créer un compte
          </Button>
        </div>
      )}

      {/* Burger mobile : visible <md uniquement. Ouvre un panel dropdown
          contenant les mêmes liens que la nav desktop. */}
      <button
        type="button"
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className="md:hidden inline-flex size-10 items-center justify-center text-foreground cursor-pointer"
      >
        <Icon
          icon={menuOpen ? "iconamoon:close" : "iconamoon:menu-burger-horizontal"}
          width={24}
          height={24}
        />
      </button>

      {menuOpen && (
        <div
          className={cn(
            // Panel dropdown sous le header. bg-background/95 + blur pour
            // rester lisible sur le gradient doré derrière.
            "md:hidden absolute left-0 right-0 top-full",
            "bg-background/95 backdrop-blur-md border-t border-white/5",
            "px-6 py-4 flex flex-col gap-3",
          )}
        >
          {variant === "connected" ? (
            <>
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={navItemClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className={cn(navItemClass, "text-left")}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setMenuOpen(false);
                  onSignIn?.();
                }}
                className="justify-start"
              >
                Se connecter
              </Button>
              <Button
                variant="primary"
                render={<Link href={signUpHref} onClick={() => setMenuOpen(false)} />}
              >
                Créer un compte
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
