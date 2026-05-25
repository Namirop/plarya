"use client";

import Image from "next/image";

import { ArrowRight } from "@phosphor-icons/react";
import { motion, type Variants } from "motion/react";

import { TrustRow } from "@/components/home/trust-row";
import { Button } from "@/components/ui/button";
import { GoldenBorderOverlay } from "@/components/ui/golden-border-overlay";

// Variants d'entrée au chargement (= v1 hero-reveal) : fade + slide-up
// 20px, 0.8s ease-out. Appliqué aux blocs textuels du Hero (eyebrow,
// H1, sous-titre, CTAs). Stagger 0.12s entre chaque bloc pour donner un
// rythme premium au load initial.
const HERO_FADE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
const HERO_TRANSITION = { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const };

// Masque radial doux : l'image fond dans le background sur tous les
// bords. Même pattern que le visuel hero desktop. Centre opaque jusqu'à
// 42 %, transparence complète à 80 % → bords totalement fondus.
const RADIAL_FADE_MASK = "radial-gradient(circle at center, black 38%, transparent 80%)";

export function Hero() {
  function handleCtaClick() {
    document.getElementById("experts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleDomainsClick() {
    document.getElementById("domains")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="relative pt-3 md:pt-8">
      {/* ──────── Mobile : eyebrow tout en haut, sous le header, en
          overlay sur la zone fondue (top) de l'image. z-10 pour passer
          au-dessus du masque radial. ──────── */}
      <motion.div
        className="md:hidden relative z-10 px-6"
        initial="hidden"
        animate="visible"
        variants={HERO_FADE_VARIANTS}
        transition={HERO_TRANSITION}
      >
        <span className="block font-body text-body-16 text-muted-foreground">
          PLATEFORME D&apos;ANALYSES SPORTIVES
        </span>
      </motion.div>

      {/* ──────── Mobile : image fondue dans le bg via masque radial.
          mt-[-44px] : l'image remonte sous l'eyebrow pour réduire le
          gap visuel — l'eyebrow se retrouve naturellement dans la zone
          transparente du masque radial, sans rupture visible. ──────── */}
      <div className="md:hidden -mt-[50px]">
        <div className="relative w-full aspect-square">
          <Image
            src="/image_hero_section.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{
              WebkitMaskImage: RADIAL_FADE_MASK,
              maskImage: RADIAL_FADE_MASK,
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1308px] px-6 sm:px-10 lg:px-[72px]">
        <div className="relative overflow-visible md:rounded-2xl">
          {/* Cadre conic-gradient doré — desktop uniquement (pas dans
              la maquette Figma mobile). */}
          <div className="hidden md:block">
            <GoldenBorderOverlay />
          </div>

          {/* Visuel hero desktop : déborde au-dessus du cadre, top-right. */}
          <div className="pointer-events-none absolute -top-12 right-0 hidden lg:block">
            <Image
              src="/image_hero_section.jpg"
              alt=""
              width={624}
              height={624}
              priority
              className="size-[480px] object-cover xl:size-[624px]"
              style={{
                WebkitMaskImage: "radial-gradient(circle at center, black 42%, transparent 75%)",
                maskImage: "radial-gradient(circle at center, black 42%, transparent 75%)",
              }}
            />
          </div>

          {/* -mt-[64px] mobile : remonte le bloc texte (H1/subtitle/CTAs)
              dans la zone fondue du bas de l'image, même logique que
              l'eyebrow en haut — réduit le gap "vide" et donne un
              flow plus continu, comme dans la maquette Figma. */}
          <div className="relative z-10 px-0 -mt-[64px] pb-4 sm:mt-0 sm:px-12 sm:py-16 lg:px-[59px] lg:py-20">
            {/* Eyebrow desktop : avec ligne décorative à gauche */}
            <motion.div
              className="hidden md:block max-w-[605px]"
              initial="hidden"
              animate="visible"
              variants={HERO_FADE_VARIANTS}
              transition={{ ...HERO_TRANSITION, delay: 0 }}
            >
              <div className="flex items-center gap-[17px]">
                <span aria-hidden className="block h-px w-[45px] bg-muted-foreground/40" />
                <span className="font-body text-[18px] font-normal text-muted-foreground">
                  PLATEFORME D&apos;ANALYSES SPORTIVES
                </span>
              </div>
            </motion.div>

            {/* Colonne gauche (desktop) / pleine largeur (mobile) :
                H1 + sous-titre + CTAs */}
            <div className="md:max-w-[605px]">
              {/* H1 : mobile 32/30 (= "h1 mobile" Figma). Desktop : token
                  text-h1 (64/60). Valeur arbitraire `text-[32px]
                  leading-[30px]` car Tailwind v4 ne génère pas
                  d'utility pour un token avec suffixe (`-mobile`). */}
              <motion.h1
                className="mt-2 md:mt-8 font-display text-[32px] leading-[30px] md:text-h1 md:leading-[60px] text-foreground"
                initial="hidden"
                animate="visible"
                variants={HERO_FADE_VARIANTS}
                transition={{ ...HERO_TRANSITION, delay: 0.12 }}
              >
                Accède aux <span className="text-accent">meilleurs</span> analystes.
              </motion.h1>

              <motion.p
                className="mt-4 md:mt-8 md:max-w-[592px] font-body text-body-16 md:text-h5 leading-[1.5] font-medium md:font-normal text-foreground"
                initial="hidden"
                animate="visible"
                variants={HERO_FADE_VARIANTS}
                transition={{ ...HERO_TRANSITION, delay: 0.24 }}
              >
                Découvre des analyses et opinions exclusives dans les domaines qui
                t&apos;intéressent.
              </motion.p>

              {/* CTAs : taille `default` mobile (text-body-16 16px),
                  `lg` desktop (text-h5 20px). Spec Figma mobile : btn
                  mobile = Work Sans Medium 16px. */}
              <motion.div
                className="mt-8 md:mt-12 flex flex-col gap-4 md:flex-row md:gap-4"
                initial="hidden"
                animate="visible"
                variants={HERO_FADE_VARIANTS}
                transition={{ ...HERO_TRANSITION, delay: 0.36 }}
              >
                <Button
                  variant="primary"
                  size="default"
                  onClick={handleCtaClick}
                  aria-label="Découvrir les experts"
                  className="w-full md:w-auto md:text-h5 md:px-8 md:py-4 animate-shine-pulse"
                >
                  Découvrir les experts
                  {/* Flèche desktop only (la maquette mobile Figma n'en
                      montre pas sur ce bouton). */}
                  <ArrowRight className="size-4 hidden md:inline-block" />
                </Button>

                {/* CTA secondaire — mobile-only. Outline blanc, le
                    glow doré (shadow-shine) a été retiré : doublon
                    avec le CTA primaire déjà glow. */}
                <Button
                  variant="secondary"
                  size="default"
                  onClick={handleDomainsClick}
                  aria-label="Explorer les domaines"
                  className="w-full md:hidden border-white hover:border-white"
                >
                  Explorer les domaines
                </Button>
              </motion.div>
            </div>

            {/* Trust row embed desktop only. md:mt-16 = espace explicite
                vis-à-vis des CTAs (sinon le bloc se colle au bouton). */}
            <TrustRow variant="inline" className="hidden md:flex md:mt-6" />
          </div>
        </div>
      </div>
    </section>
  );
}
