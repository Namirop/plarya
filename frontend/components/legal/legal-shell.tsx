import { cn } from "@/lib/utils";

// Encart d'avertissement utilisé en haut des pages juridiques pour
// signaler que le contenu doit être validé par un juriste. Pas
// rendu sur la page Contact.
// Banner neutralisé en 3B (anciennement border + bg + texte dorés).
// Le mot "Note :" en bold + le fond surface-elevated suffisent à
// signaler le statut d'avertissement.
export function LegalWarning() {
  return (
    <div className="mt-6 rounded-xl border border-surface-elevated bg-white/[0.03] p-4">
      <p className="font-body text-body-16 text-foreground">
        <strong className="font-semibold">Note :</strong> ces conditions sont génériques. Elles
        doivent être validées par un juriste qualifié avant la mise en production finale de la
        plateforme.
      </p>
    </div>
  );
}

// Section d'une page juridique. Titre h2 (= text-h3 DS, 32 px weight
// 500), espacement vertical 48 px (mt-12) entre 2 sections — cf.
// brief §"espacement ~48px entre sections".
export function LegalSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-12", className)}>
      <h2 className="font-display text-h3 text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 font-body text-body-16 leading-relaxed text-foreground">
        {children}
      </div>
    </section>
  );
}

// Liste à puces stylée pour les énumérations de droits RGPD, etc.
// Préserve l'indentation du brief (pl-6) + gap entre items (mb-2 via
// `space-y-2` Tailwind pour éviter le margin-collapse).
export function LegalList({
  children,
  ordered = false,
}: {
  children: React.ReactNode;
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={cn(
        "space-y-2 pl-6 font-body text-body-16 leading-relaxed text-foreground",
        ordered ? "list-decimal" : "list-disc",
      )}
    >
      {children}
    </Tag>
  );
}
