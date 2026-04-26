const REASONS = [
  {
    emoji: "⏱",
    title: "Gain de temps",
    description: "Accédez directement aux analyses",
  },
  {
    emoji: "✓",
    title: "Simple",
    description: "Tout est prêt, sans recherche",
  },
  {
    emoji: "🔓",
    title: "Sans engagement",
    description: "Paiement à l'acte",
  },
];

export function WhyPlarya() {
  return (
    <section>
      <div className="text-center">
        <h2 className="text-gradient-or text-3xl font-bold uppercase tracking-wider sm:text-4xl">
          POURQUOI PLARYA ?
        </h2>
        <p className="mt-2 text-base text-texte-secondaire">
          La plateforme pensée pour vous
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {REASONS.map((r) => (
          <div
            key={r.title}
            className="flex flex-col items-center rounded-xl border border-bordure bg-fond-card px-8 py-10 text-center sm:py-12"
          >
            <div className="flex size-16 items-center justify-center rounded-full border border-or-principal/30 bg-or-principal/10 sm:size-20">
              <span className="text-3xl sm:text-4xl">{r.emoji}</span>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-blanc sm:text-2xl">
              {r.title}
            </h3>
            <p className="mt-2 text-base text-texte-secondaire">{r.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
