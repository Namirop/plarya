"use client";

export type Domain = "SPORT" | "ESPORT" | null;

interface DomainSelectorProps {
  activeDomain: Domain;
  onSelect: (domain: Domain) => void;
}

const DOMAIN_IMAGES: Record<string, string> = {
  SPORT: "/domains/sport.jpg",
  ESPORT: "/domains/esport.jpg",
};

const DOMAINS = [
  {
    key: "SPORT" as const,
    emoji: "⚽",
    label: "SPORT",
    enabled: true,
  },
  {
    key: "ESPORT" as const,
    emoji: "🎮",
    label: "ESPORT",
    enabled: true,
  },
  {
    key: "GAMING" as const,
    emoji: "🕹️",
    label: "GAMING",
    enabled: false,
  },
];

export function DomainSelector({ activeDomain, onSelect }: DomainSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {DOMAINS.map((d) => {
        const isActive = d.key === activeDomain;
        const isDisabled = !d.enabled;
        const bgImage = DOMAIN_IMAGES[d.key];

        return (
          <button
            key={d.key}
            type="button"
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              onSelect(isActive ? null : (d.key as "SPORT" | "ESPORT"));
            }}
            className={`group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-2xl border-2 transition-all duration-300 sm:min-h-[380px] ${
              isDisabled
                ? "cursor-not-allowed border-bordure opacity-50"
                : isActive
                ? "border-or-principal/60 ring-2 ring-or-principal/40 shadow-[0_0_40px_rgba(212,175,55,0.15)]"
                : "cursor-pointer border-bordure hover:border-or-principal/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
            }`}
          >
            {/* Background image or gradient */}
            {bgImage ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-fond-card to-fond-principal" />
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-start gap-1 pl-8 pb-6 self-stretch">
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none sm:text-2xl">{d.emoji}</span>
                <span className="text-xl font-semibold tracking-[0.2em] text-blanc drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] sm:text-2xl leading-tight">
                  {d.label}
                </span>
              </div>
              {isDisabled ? (
                <span className="text-xs uppercase tracking-widest text-texte-tertiaire">Arrive bientôt...</span>
              ) : (
                <span
                  className={`text-xs font-medium uppercase tracking-widest ${
                    isActive ? "text-or-principal" : "text-amber-300/80"
                  }`}
                >
                  Voir les analyses
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
