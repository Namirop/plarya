import Image from "next/image";

import { CardTilt } from "@/components/ui/card-tilt";
import { cn } from "@/lib/utils";

// Mockup de profil expert affiché dans le Hero de /devenir-expert.
// Pivot psychologique : l'utilisateur se projette en voyant ce qu'il
// pourrait avoir comme "carte de visite" sur la plateforme.
//
// Card seule (la card "fantôme" derrière a été retirée — Romain la
// trouvait visuellement parasite). Le halo doré ambient suffit pour
// éviter l'effet "card flottante dans le vide".
//
// Avatar : image locale optimisée via next/image (profile2.png).
// Le wrapper est aria-hidden (décoratif), mais next/image évite de
// servir le PNG 2 Mo brut pour un rendu 48px (resize + AVIF/WebP).

export interface ExpertProfileMockupProps {
  className?: string;
}

const SPORTS = ["Football", "Tennis", "Hockey"] as const;

const STATS = [
  { value: "67%", label: "Win Rate" },
  { value: "142", label: "Abonnés" },
  { value: "89", label: "Analyses" },
] as const;

export function ExpertProfileMockup({ className }: ExpertProfileMockupProps) {
  return (
    <div aria-hidden className={cn("relative", className)}>
      {/* Halo doré ambient — 200px à droite, opacity 5 %, blur-3xl.
          Suggère un rayonnement extérieur sans bordure ni shadow
          sur la card elle-même. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 top-12 -z-10 size-72 rounded-full bg-accent/[0.05] blur-3xl"
      />

      {/* Card PRINCIPALE (BetKing) wrappée dans CardTilt — base
          rotation -1deg (rotation artistique légère), tilt 3D ±12°
          au survol curseur + glare radial qui suit la souris.
          Gradient sombre diagonal (noir profond → surface-3) pour
          la profondeur sans intro de couleur. */}
      <CardTilt baseRotateZ={-1} maxTilt={10}>
        <div
          className={cn(
            "w-full max-w-[360px]",
            "rounded-2xl border border-surface-3 p-5 md:p-6",
            "bg-[linear-gradient(135deg,#0c0b0b_0%,#161414_55%,#1f1d1d_100%)]",
            "shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]",
          )}
        >
        {/* ─── Header : photo réelle + indicateur live + pseudo + badge ─── */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Image
              src="/profile2.png"
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-full object-cover"
            />
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 block size-3 rounded-full border-2 border-surface-2 bg-green-500"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-body-18 font-bold text-foreground">BetKing</p>
            <span className="mt-2 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wider text-accent">
              Expert
            </span>
          </div>
        </div>

        {/* ─── Sports — tags inline éditoriaux (cohérence preview navigateur).
            Pas de pill, pas d'emoji. ✓ doré + underline accent/40. ─── */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {SPORTS.map((label) => (
            <span
              key={label}
              className="inline-flex items-baseline gap-1.5 font-body text-[14px] text-foreground"
            >
              <span aria-hidden className="text-[12px] leading-none text-accent">
                ✓
              </span>
              <span className="underline decoration-accent/40 decoration-1 underline-offset-4">
                {label}
              </span>
            </span>
          ))}
        </div>

        {/* ─── Stats row ─── */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-surface-3 pt-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <p className="font-body text-[22px] font-bold leading-none tabular-nums text-foreground">
                {s.value}
              </p>
              <p className="mt-1.5 font-body text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Mini analyse du jour ─── */}
        <div className="mt-5 rounded-xl border border-surface-3 bg-black/40 p-4">
          <p className="font-body text-[11px] uppercase tracking-wider text-muted-foreground">
            Aujourd&apos;hui · 16:30
          </p>
          <span className="mt-2 inline-flex items-center rounded-md border border-surface-3 bg-black px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-foreground">
            Pick solide
          </span>
          <p className="mt-3 font-body text-body-16 font-semibold text-foreground">
            PSG vs Marseille
          </p>
          <p className="mt-1 font-body text-body-14 text-muted-foreground">Plus de 2,5 buts</p>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-body text-[18px] font-bold text-accent">@2.10</p>
            <p className="font-body text-body-14 text-muted-foreground">Cote moyenne : 1.92</p>
          </div>
        </div>
      </div>
      </CardTilt>
    </div>
  );
}
