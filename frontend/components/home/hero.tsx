"use client";

import { Fragment } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <section className="relative">
      <div className="mx-auto max-w-[1308px] px-6 sm:px-10 lg:px-[72px]">
        <div className="relative overflow-visible rounded-2xl">
          {/* Bordure 1px en dégradé angulaire (conic-gradient) : 50% global,
              stops dorés 33% (bas-droite) et 75% (haut-gauche), sombres
              ailleurs. `from 30deg` place ces deux pics dorés sur la
              diagonale haut-gauche ↔ bas-droite (cf. maquette Figma) ;
              `from 0deg` les aurait mis sur les bords droite/gauche.
              Technique : overlay absolu avec padding 1px + mask-composite
              pour ne garder que le contour. L'intérieur reste transparent
              (on voit la lueur dorée ambiante du body au travers). */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-50"
            style={{
              padding: "1px",
              background:
                "conic-gradient(from 30deg, #181818 8%, #DFB968 33%, #100E0E 47%, #181818 63%, #DFB968 75%, #181818 100%)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              maskComposite: "exclude",
            }}
          />

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
                    <span
                      aria-hidden
                      className="hidden sm:block h-24 w-px shrink-0 opacity-60"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)",
                      }}
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
