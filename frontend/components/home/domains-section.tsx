import { DomainCard } from "@/components/domains/domain-card";
import { SectionTitle } from "@/components/ui/section-title";

// 3 cards Figma frame `87:211` — voir domains-section-spec.md.
// Note : pas de lien "Voir tous les domaines" (acté avec le client :
// pas de sens avec seulement 3 domaines, cf. homepage-spec.md §3).
const DOMAINS = [
  {
    title: "SPORT",
    subtitle: "Football, Basketball, Tennis,\nMMA et plus",
    image: "/domains/sport.jpg",
    href: "/domains/sport",
    state: "active" as const,
  },
  {
    title: "ESPORT",
    subtitle: "CS2, LoL, Valorant, Dota 2,\net plus",
    image: "/domains/esport.jpg",
    href: "/domains/esport",
    state: "active" as const,
  },
  {
    title: "HIPPIQUE",
    subtitle: "Saut d'obstacles, Horseball",
    image: "/domains/hippique.jpg",
    state: "coming-soon" as const,
  },
];

export function DomainsSection() {
  return (
    // pt-16 = 64 px (gap depuis Hero, mesuré Figma).
    <section id="domains" className="pt-16">
      {/* max-w-content (1175px) + mx-auto → ~132px padding latéral naturel
          sur viewport 1440 (cohérent avec le Hero, sans l'asymétrie 125/140
          observée dans Figma). Pas de padding horizontal à lg : la rangée
          de 3 cards (381×3 + 2×16 = 1175px) doit pouvoir utiliser toute la
          largeur du container, sinon elles wrappent. Padding mobile/tablet
          pour éviter le bord. */}
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <SectionTitle title="Explore les domaines" />

        <div className="mt-16 flex flex-wrap items-center gap-4">
          {DOMAINS.map((d) => (
            <DomainCard
              key={d.title}
              image={d.image}
              title={d.title}
              subtitle={d.subtitle}
              state={d.state}
              href={d.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
