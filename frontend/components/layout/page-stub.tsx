import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface PageStubProps {
  /** Titre H1 — sur 1 ligne, Work Sans bold (cf. règle typo CLAUDE.md §3 :
   *  les stubs UI internes ne sont pas du contenu marketing → pas de
   *  font-display). */
  title: string;
  /** Sous-titre court / description "à venir". */
  description?: string;
}

// Stub minimal pour les routes référencées depuis l'UI mais pas encore
// designées (mentions légales, listing experts, etc.). Header + Footer
// sont rendus par le layout racine, on n'a qu'à fournir le bloc central.
export function PageStub({
  title,
  description = "Cette page sera bientôt disponible.",
}: PageStubProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-content flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-body text-[28px] font-bold text-foreground md:text-[32px]">{title}</h1>
      <p className="mt-6 font-body text-body-18 text-muted-foreground">{description}</p>
      <Button variant="secondary" render={<Link href="/" />} className="mt-10">
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}
