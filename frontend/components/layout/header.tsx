"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { List, X, CaretRight } from "@phosphor-icons/react";
import { motion } from "motion/react";

import type { UserRole } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

export type HeaderRole = UserRole;

export interface HeaderProps {
  /** "loading" : session non résolue, seul le logo est rendu (évite un
   *  affichage « invité » furtif pour un utilisateur connecté). */
  variant?: "connected" | "guest" | "loading";
  /** Détermine les liens de navigation (voir navLinksForRole). */
  role?: HeaderRole;
  sticky?: boolean;
  onLogout?: () => void;
  onSignIn?: () => void;
  /** Même flux magic-link que la connexion : le compte est créé à la
   *  première vérification du lien. */
  onSignUp?: () => void;
}

interface NavLink {
  href: string;
  label: string;
}

// Liens par rôle, partagés par la nav desktop et le menu mobile.
function navLinksForRole(role: HeaderRole): NavLink[] {
  switch (role) {
    case "EXPERT":
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

const navItemClass = "font-body text-body-16 text-foreground transition-opacity hover:opacity-70";

const navLinkCls =
  "inline-flex items-center justify-center rounded-full px-4 py-2 font-body text-body-16 text-foreground transition-colors hover:bg-white/5 cursor-pointer";
const ghostBtnCls =
  "inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 font-body text-body-16 text-foreground transition-colors hover:bg-white/5 hover:border-white/25 cursor-pointer";
const goldBtnCls =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-accent-strong bg-gradient-gold px-5 py-2 font-body text-body-16 text-black shadow-shine transition-all hover:brightness-105";

export function Header({
  variant = "guest",
  role = "USER",
  sticky = true,
  onLogout,
  onSignIn,
  onSignUp,
}: HeaderProps) {
  const navLinks = variant === "connected" ? navLinksForRole(role) : [];
  // Menu mobile : fermé au scroll et au passage en desktop (≥ 768 px).
  const [menuOpen, setMenuOpen] = useState(false);

  // En mobile, fond opaque dès 10 px de défilement (transparent en haut de page).
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
    <motion.header
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        // overflow-visible : l'image du logo, avec ses marges transparentes,
        // dépasse de la barre. Fond opaque aussi quand le menu mobile est ouvert.
        "relative h-[76px] w-full overflow-visible",
        "transition-colors duration-200 ease-out",
        "md:bg-background/90 md:backdrop-blur-md",
        scrolled || menuOpen ? "bg-background/90 backdrop-blur-md" : "bg-transparent",
        sticky && "sticky top-0 z-50",
      )}
    >
      {/* Même largeur et marges que les sections de la page. */}
      <div className="mx-auto flex h-full w-full max-w-content items-center justify-between px-6 py-2 sm:px-8 lg:px-0">
        {/* Le glyphe n'occupe qu'une partie du PNG : les translate le
            réalignent sur les boutons de droite. */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/full-logo-remove.png"
            alt="Plarya"
            width={240}
            height={180}
            className="h-[150px] md:h-[180px] w-auto translate-x-[55px] translate-y-[11px] md:translate-x-0 md:translate-y-[10px]"
            priority
          />
        </Link>

        {/* Nav desktop ; rien à droite pendant le chargement de la session. */}
        {variant === "loading" ? (
          <div className="hidden md:block" aria-hidden />
        ) : variant === "connected" ? (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className={navLinkCls}>
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={onLogout}
              className={cn(navLinkCls, "text-muted-foreground hover:text-foreground")}
            >
              Déconnexion
            </button>
          </nav>
        ) : (
          <div className="hidden items-center gap-2.5 md:flex">
            <button type="button" onClick={onSignIn} className={ghostBtnCls}>
              Se connecter
            </button>
            <button type="button" onClick={onSignUp} className={goldBtnCls}>
              Créer un compte
            </button>
          </div>
        )}

        {variant !== "loading" && (
          <button
            type="button"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex size-10 items-center justify-center text-foreground cursor-pointer"
          >
            {menuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        )}
      </div>{" "}
      {menuOpen && (
        <div
          className={cn(
            // Menu mobile déroulé sous le header.
            "md:hidden absolute left-0 right-0 top-full",
            "bg-background/95 backdrop-blur-md",
            "border-t border-surface-elevated",
            "px-6 py-6 flex flex-col",
          )}
        >
          {variant === "connected" ? (
            <>
              <div className="flex flex-col gap-5">
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
              </div>

              <div className="my-5 h-px w-full bg-surface-elevated" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className={cn(navItemClass, "text-left text-muted-foreground")}
              >
                Déconnexion
              </button>
            </>
          ) : (
            // Invité : liens texte ; le chevron signale l'action principale.
            <div className="flex flex-col gap-5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onSignIn?.();
                }}
                className={cn(navItemClass, "text-left")}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onSignUp?.();
                }}
                className="inline-flex cursor-pointer items-center gap-2 font-body text-body-16 text-foreground transition-opacity hover:opacity-80"
              >
                Créer un compte
                <CaretRight size={18} aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.header>
  );
}
