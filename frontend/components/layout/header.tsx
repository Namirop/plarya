"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { List, X, CaretRight } from "@phosphor-icons/react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/auth";

export type HeaderRole = UserRole;

export interface HeaderProps {
  /** "loading" : on n'a pas encore résolu la session (1ʳᵉ frame post
   *  hydratation). On rend juste le logo, rien à droite — évite le
   *  flash "guest → connected" visible 50-200 ms au refresh. */
  variant?: "connected" | "guest" | "loading";
  /** Rôle de l'utilisateur connecté. Pilote les liens de nav affichés
   *  selon le rôle :
   *    - USER  : "Mon Compte" (vue acheteur : abonnements + historique)
   *    - EXPERT : "Dashboard" + "Mon Compte" (éditeur profil expert)
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
  /** Callback déclenché par "Créer un compte" (variant guest). Ouvre la
   *  même LoginModal magic-link avec un copy contextualisé : créer un
   *  compte = recevoir un lien par email (le User est créé à la 1ʳᵉ
   *  vérification du token via auth-service.verifyMagicLink). */
  onSignUp?: () => void;
}

interface NavLink {
  href: string;
  label: string;
}

// Mapping role → liens de nav. Source unique de vérité, utilisée en
// desktop ET en mobile (panel dropdown) pour rester cohérent.
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

// Topbar desktop — style SOBRE (sans cadre pill doré, retiré car trop
// présent). Lien de nav (connecté) : pilule transparente, fond blanc 5%
// au hover pour l'affordance.
const navLinkCls =
  "inline-flex items-center justify-center rounded-full px-4 py-2 font-body text-body-16 text-foreground transition-colors hover:bg-white/5 cursor-pointer";
// "Se connecter" (guest) : bouton ghost à bordure neutre discrète.
const ghostBtnCls =
  "inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2 font-body text-body-16 text-foreground transition-colors hover:bg-white/5 hover:border-white/25 cursor-pointer";
// "Créer un compte" (guest) : bouton doré plein = action primaire.
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
    <motion.header
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        // Le header pleine largeur (BG full-bleed pour cover le viewport).
        // Le CONTENU à l'intérieur est contraint à max-w-content + padding
        // identique aux sections de la home → alignement visuel avec le
        // contenu de la page (logo collé au même bord que le texte du Hero,
        // nav à droite collée au même bord que le côté droit des cards).
        // overflow-visible : le logo (h=160) déborde au-dessus/en dessous
        // de la barre h=70 pour compenser le padding transparent du PNG.
        // Mobile : transparent en haut de page (fondu avec le hero),
        // bg-background/90 + blur dès que `scrolled` passe à true pour
        // masquer le contenu qui défile derrière (cf. effet "frosted").
        // Si le menu mobile est ouvert, on force aussi le fond sombre
        // pour que le header s'aligne avec le panel dropdown (sinon
        // contraste laid : header transparent + panel dark).
        // Desktop (md+) : toujours bg-background/90 + backdrop-blur-md.
        "relative h-[76px] w-full overflow-visible",
        "transition-colors duration-200 ease-out",
        "md:bg-background/90 md:backdrop-blur-md",
        scrolled || menuOpen ? "bg-background/90 backdrop-blur-md" : "bg-transparent",
        sticky && "sticky top-0 z-50",
      )}
    >
      {/* Wrapper inner — aligne le contenu du header avec le contenu
          des sections de la home (mx-auto + max-w-content + même
          padding latéral). */}
      <div className="mx-auto flex h-full w-full max-w-content items-center justify-between px-6 py-2 sm:px-8 lg:px-0">
        {/* Le PNG du logo (1536×1024, transparent) contient beaucoup de
          padding autour du glyphe visible (le glyphe occupe ~30 % de la
          hauteur et est positionné légèrement au-dessus du centre vertical
          du canvas — d'où le `translate-y-[6px]` qui re-aligne le glyphe
          avec les boutons d'auth à droite, vertical-centrés sur la barre).
          Mobile : h-[150px], desktop h-[180px] (proportionnés à la
          nouvelle topbar h=85). */}
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

        {/* Nav desktop : visible md+. Pattern unifié "pill" — toutes les
          actions à droite sont enveloppées dans un container rounded-full
          bordé d'un GoldenBorderOverlay (même technique que le cadre du
          Hero + de "Devenir créateur"). Pendant variant="loading" : on
          ne rend RIEN à droite (évite le flash). */}
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

        {/* Burger mobile : visible <md uniquement. Caché pendant
          variant="loading" (même raison — évite le flash). */}
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
      {/* /inner wrapper */}
      {menuOpen && (
        <div
          className={cn(
            // Panel dropdown sous le header. bg-background/95 + blur
            // pour rester lisible sur le gradient doré derrière. Bord
            // gauche transparent → border-t neutre pour marquer la
            // séparation avec le header (anciennement doré /15,
            // retiré dans le ménage doré — décoratif).
            "md:hidden absolute left-0 right-0 top-full",
            "bg-background/95 backdrop-blur-md",
            "border-t border-surface-elevated",
            "px-6 py-6 flex flex-col",
          )}
        >
          {variant === "connected" ? (
            <>
              {/* Nav links — simples, gap généreux pour respiration. */}
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

              {/* Séparateur subtil avant l'action de sortie. */}
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
            // Guest : pattern identique aux nav links connectés —
            // deux liens texte stackés. "Créer un compte" en accent
            // doré + chevron pour signaler l'action primaire sans le
            // poids du bouton gradient (qui dominait le panel).
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
