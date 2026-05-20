"use client";

import { Fragment } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DividerVertical } from "@/components/ui/divider-vertical";
import { GoldenBorderOverlay } from "@/components/ui/golden-border-overlay";

const TRUST_ITEMS = [
  {
    icon: "solar:user-outline",
    title: "Analyses d'experts",
    body: "Des créateurs passionnés partagent leurs insights.",
  },
  {
    icon: "stash:lock-opened",
    title: "Contenu indépendant",
    body: "Des opinions libres, sans influence extérieure.",
  },
  {
    icon: "f7:creditcard",
    title: "Paiement sécurisé",
    body: "Accès simple et rapide à chaque analyse.",
  },
];

export function Hero() {
  function handleCtaClick() {
    document
      .getElementById("experts")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    // pt-8 = 32 px : gap entre le bas du Header (sticky, h=70) et le top
    // du cadre Hero, conformément à Figma (TopBar y=0..70, Hero Cadre y=102).
    <section className="relative pt-8">
      <div className="mx-auto max-w-[1308px] px-6 sm:px-10 lg:px-[72px]">
        <div className="relative overflow-visible rounded-2xl">
          {/* Cadre doré conic-gradient — extrait dans
              `components/ui/golden-border-overlay.tsx`. Réutilisé sur la
              card "Devenir créateur" (même pattern visuel). */}
          <GoldenBorderOverlay />

          {/* Visuel hero : déborde au-dessus du cadre, top-right. Masqué
              en mobile et tablette (la composition gauche prime). */}
          <div className="pointer-events-none absolute -top-12 right-0 hidden lg:block">
            <Image
              src="/image_hero_section.jpg"
              alt=""
              width={624}
              height={624}
              priority
              className="size-[480px] object-cover xl:size-[624px]"
              style={{
                WebkitMaskImage:
                  "radial-gradient(circle at center, black 42%, transparent 75%)",
                maskImage:
                  "radial-gradient(circle at center, black 42%, transparent 75%)",
              }}
            />
          </div>

          <div className="relative z-10 px-8 py-16 sm:px-12 lg:px-[59px] lg:py-20">
            {/* Colonne gauche : eyebrow + H1 + sous-titre + CTA */}
            <div className="max-w-[605px]">
              <div className="flex items-center gap-[17px]">
                <span aria-hidden className="block h-px w-[45px] bg-accent" />
                <span className="font-body text-[18px] font-normal text-muted-foreground">
                  PLATEFORME D&apos;ANALYSES SPORTIVES
                </span>
              </div>

              <h1 className="mt-8 font-display text-h1 text-foreground">
                Accède aux <span className="text-accent">meilleurs</span>{" "}
                analystes.
              </h1>

              <p className="mt-8 max-w-[592px] font-body text-h5 leading-relaxed text-foreground">
                Découvre des analyses et opinions exclusives dans les domaines
                qui t&apos;intéressent.
              </p>

              <div className="mt-12">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCtaClick}
                  aria-label="Découvrir les experts"
                >
                  Découvrir les experts
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Trust row : pleine largeur du cadre (sous l'image) */}
            <ul className="mt-16 flex flex-col gap-10 sm:flex-row sm:items-center sm:gap-0">
              {TRUST_ITEMS.map((item, index) => (
                <Fragment key={item.title}>
                  {index > 0 && (
                    <DividerVertical
                      height={96}
                      className="hidden sm:block"
                    />
                  )}
                  <li className="flex flex-1 items-start gap-[9px] sm:px-8">
                    <Icon
                      icon={item.icon}
                      width={30}
                      height={30}
                      className="shrink-0 text-accent"
                    />
                    <div className="flex flex-col gap-2">
                      <p className="font-body text-h5 text-foreground">
                        {item.title}
                      </p>
                      <p className="font-body text-body-16 leading-[1.4] text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                </Fragment>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
