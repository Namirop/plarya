"use client";

import { ArrowRight } from "@phosphor-icons/react";

import { ExpertProfileMockup } from "@/components/devenir-expert/expert-profile-mockup";
import { Reveal } from "@/components/ui/reveal";

// Section 1 : accroche et aperçu d'un profil expert, sur un halo doré discret.
export function HeroSection() {
  function scrollToForm() {
    document.getElementById("candidature")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="subtle-radial-glow-warm mx-auto w-full max-w-content px-4 pt-10 md:px-8 md:pt-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <div className="flex flex-col">
          <Reveal>
            {/* Retour à la ligne forcé : le titre tient sur deux lignes au lieu de trois. */}
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
            <p className="mt-4 font-body text-body-16 text-muted-foreground">
              <span className="font-semibold text-accent">39€ / trimestre</span>{" "}
              <span aria-hidden className="mx-2 text-muted-foreground/60">
                ·
              </span>{" "}
              Annulation à tout moment
            </p>
          </Reveal>

          <Reveal delay={0.28}>
            {/* Simple lien : le bouton principal est celui du formulaire. */}
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

        <div className="flex justify-center lg:justify-end">
          <Reveal delay={0.36}>
            <ExpertProfileMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
