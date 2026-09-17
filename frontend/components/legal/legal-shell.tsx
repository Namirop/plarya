import { cn } from "@/lib/utils";

// Avertissement en tête des pages juridiques (CGU, confidentialité, mentions légales).
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
