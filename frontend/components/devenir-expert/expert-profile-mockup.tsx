import { cn } from "@/lib/utils";

// Mockup de profil expert affiché dans le Hero de /devenir-expert.
// Pivot psychologique : l'utilisateur se projette en voyant ce qu'il
// pourrait avoir comme "carte de visite" sur la plateforme.
//
// Polish v2 :
//  - Photo réelle (i.pravatar.cc) au lieu d'icône User Phosphor
//  - Composition stack : 2 cards (BetKing au front + RugbyPro fantôme
//    derrière, opacity 0.6, rotation +2deg) → suggère "il y a d'autres
//    experts"
//  - Halo doré subtil 200px à droite, opacity 5 % — rayonnement sans
//    surcharge
//
// Doré conservé : badge "EXPERT" + cote "@2.10" (2 signaux).
// Point vert "live" sur la photo = exception unique sémantique.
//
// `<img>` plain (pas next/image) car le mockup est aria-hidden et
// décoratif — pas de SEO/perf nécessaire, évite d'ajouter
// i.pravatar.cc au remotePatterns next.config.

export interface ExpertProfileMockupProps {
  className?: string;
}

const SPORTS = [
  { emoji: "⚽", label: "Football" },
  { emoji: "🎾", label: "Tennis" },
  { emoji: "🏒", label: "Hockey" },
] as const;

const STATS = [
  { value: "67%", label: "Win Rate" },
  { value: "142", label: "Abonnés" },
  { value: "89", label: "Analyses" },
] as const;

const PHANTOM_SPORTS = [
  { emoji: "🏉", label: "Rugby" },
  { emoji: "🥊", label: "MMA" },
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

      {/* Card FANTÔME (RugbyPro) — derrière + à droite, rotation +2deg,
          opacity 0.6. Affiche juste le haut (avatar/pseudo/sports), pas
          le contenu détaillé — suggère qu'il y a d'autres experts. */}
      <div className="absolute right-[-20px] top-3 w-full max-w-[340px] rotate-[2deg] rounded-2xl border border-surface-3 bg-surface-1 p-5 opacity-60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] md:max-w-[360px]">
        <div className="flex items-center gap-3">
          <div className="size-12 shrink-0 rounded-full bg-surface-elevated" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-body-18 font-bold text-foreground">RugbyPro</p>
            <span className="mt-0.5 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wider text-accent">
              Expert
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PHANTOM_SPORTS.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated/60 px-3 py-1 font-body text-[13px] text-foreground"
            >
              <span aria-hidden>{s.emoji}</span>
              <span>{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Card PRINCIPALE (BetKing) — au premier plan, rotation -1deg,
          surface-2, ombre prononcée. C'est la card qui porte tous
          les détails. */}
      <div
        className={cn(
          "relative w-full max-w-[360px] rotate-[-0.5deg] md:rotate-[-1deg]",
          "rounded-2xl border border-surface-3 bg-gradient-to-br from-surface-2 to-surface-3 p-5 md:p-6",
          "shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]",
        )}
      >
        {/* ─── Header : photo réelle + indicateur live + pseudo + badge ─── */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.pravatar.cc/120?img=33"
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-full object-cover"
            />
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 block size-3 rounded-full border-2 border-surface-2 bg-[#22C55E]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-body-18 font-bold text-foreground">BetKing</p>
            <span className="mt-0.5 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wider text-accent">
              Expert
            </span>
          </div>
        </div>

        {/* ─── Sports chips ─── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SPORTS.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated/60 px-3 py-1 font-body text-[13px] text-foreground"
            >
              <span aria-hidden>{s.emoji}</span>
              <span>{s.label}</span>
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
    </div>
  );
}
