"use client";

import { ArrowRight } from "@phosphor-icons/react";

import { ExpertProfileMockup } from "@/components/devenir-expert/expert-profile-mockup";
import { Reveal } from "@/components/ui/reveal";

// ════════════════ SECTION 1 — HERO ÉDITORIAL ════════════════
// Pitch 60% + mockup profil 40% (desktop). Animations <Reveal> du DS
// (fade + slide subtil), même pattern que les sections de la home.
//
// subtle-radial-glow-warm : halo doré ultra-subtil (opacity 4%) en haut
// centre du Hero, donne l'impression que le H1 rayonne. Imperceptible
// directement mais ajoute de la profondeur.
export function HeroSection() {
  function scrollToForm() {
    document.getElementById("candidature")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="subtle-radial-glow-warm mx-auto w-full max-w-content px-4 pt-10 md:px-8 md:pt-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        {/* Colonne gauche : pitch + sous-titre + mini-stats + CTA lien.
            Espacements serrés (mt-5 / mt-4 / mt-6) pour grouper les
            éléments en une unité visuelle au lieu de les faire flotter. */}
        <div className="flex flex-col">
          <Reveal>
            {/* H1 XL — pattern "type-driven design" : le titre écrase
                visuellement tout le reste. Mobile 48px, desktop 88px,
                line-height ultra-serré (0.92).
                Break manuel après "Expert" pour FORCER un wrap 2/2 :
                "Devenir Expert" / "sur Plarya". Sans ce break, le
                texte wrapait sur 3 lignes (4 mots à 88px dans une col
                bornée). */}
            <h1 className="font-display text-[48px] leading-[0.95] text-foreground md:text-[88px] md:leading-[0.92]">
              Devenir Expert
              <br />
              <span className="text-accent">sur Plarya</span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-5 max-w-[500px] font-body text-body-18 leading-[1.55] text-muted-foreground">
              Partage tes analyses sportives avec une audience qui paie pour tes sélections. Un
              profil mis en avant, des paiements directs, une plateforme premium.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            {/* Ligne stats Hero : "39€ / trimestre" en doré — cohérent
                avec le prix gold dans la PricingCard plus bas. */}
            <p className="mt-4 font-body text-body-16 text-muted-foreground">
              <span className="font-semibold text-accent">39€ / trimestre</span>{" "}
              <span aria-hidden className="mx-2 text-muted-foreground/60">
                ·
              </span>{" "}
              Annulation à tout moment
            </p>
          </Reveal>

          <Reveal delay={0.28}>
            {/* Lien neutre avec underline au hover — pas un bouton
                plein (pas de duplicate du CTA primary du formulaire). */}
            <button
              type="button"
              onClick={scrollToForm}
              className="group mt-6 inline-flex cursor-pointer items-center gap-2 self-start font-body text-body-16 text-foreground transition-colors hover:underline underline-offset-4"
            >
              Voir le formulaire de candidature
              <ArrowRight
                size={16}
                weight="bold"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
          </Reveal>
        </div>

        {/* Colonne droite : mockup profil expert. Slide-up par défaut
            (Reveal) — le mockup arrive en glissant légèrement du bas,
            subtil et cohérent avec le reste de la page. */}
        <div className="flex justify-center lg:justify-end">
          <Reveal delay={0.36}>
            <ExpertProfileMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
