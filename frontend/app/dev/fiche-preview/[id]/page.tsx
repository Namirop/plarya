import type { Metadata } from "next";

import { AnalysisCardFiche } from "@/components/analyses/analysis-card-fiche";
import { AnalysisCardTicket } from "@/components/analyses/analysis-card-ticket";
import { fetchExpert, type BookmakerOddsData, type PronoData } from "@/lib/experts";

/**
 * PAGE DE TEST INTERNE — preview design des deux directions de card.
 *
 * Consomme le MÊME loader que `/experts/[id]` (`fetchExpert`). Mais le
 * profil public masque pick / argumentaire / bookmakers (gating payant) :
 * pour rendre une card complète sans toucher la DB ni s'authentifier, on
 * enrichit l'analyse réelle avec des valeurs mockées sur les champs
 * masqués. Si aucun expert/analyse n'est trouvé, on bascule sur un mock
 * intégral.
 *
 * Non indexée (robots noindex) — c'est un outil de comparaison visuelle.
 */
export const metadata: Metadata = {
  title: "Preview card analyse (interne)",
  robots: { index: false, follow: false },
};

// Bookmakers mockés (logos locaux dans /public/bookmakers). Sert quand
// l'analyse réelle n'expose pas de cotes bookmakers (cas non-débloqué).
const MOCK_BOOKMAKERS: BookmakerOddsData[] = [
  {
    id: "preview-bm-winamax",
    odds: 1.47,
    bookmaker: {
      id: "preview-winamax",
      name: "Winamax",
      logoUrl: "/bookmakers/winamax.svg",
      affiliateLinks: [{ id: "preview-aff-1", url: "#", label: "Parier +100€" }],
    },
  },
  {
    id: "preview-bm-betclic",
    odds: 1.42,
    bookmaker: {
      id: "preview-betclic",
      name: "Betclic",
      logoUrl: "/bookmakers/betclic.svg",
      affiliateLinks: [{ id: "preview-aff-2", url: "#", label: "Parier +100€" }],
    },
  },
  {
    id: "preview-bm-pmu",
    odds: 1.4,
    bookmaker: {
      id: "preview-pmu",
      name: "PMU",
      logoUrl: "/bookmakers/pmu.svg",
      affiliateLinks: [{ id: "preview-aff-3", url: "#", label: "Parier +100€" }],
    },
  },
];

const MOCK_PICK = "Toulouse gagne";
const MOCK_ARGUMENT =
  "Le match s'annonce serré mais Toulouse a l'avantage du terrain et une dynamique récente favorable. " +
  "Le Racing reste sur deux défaites à l'extérieur et devra composer sans plusieurs cadres en première ligne. " +
  "Sur les dix dernières confrontations au Stadium, Toulouse s'impose huit fois.";

/** Demain 21h36 — toujours dans le futur (le ticket ne passe pas en "commencé"). */
function mockStartTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(21, 36, 0, 0);
  return d.toISOString();
}

function buildPreviewAnalysis(real: PronoData | undefined): PronoData {
  if (!real) {
    const startTime = mockStartTime();
    return {
      id: "preview-analysis",
      matchName: "Toulouse - Racing",
      league: "top-14",
      pick: MOCK_PICK,
      argument: MOCK_ARGUMENT,
      odds: 1.45,
      teasing: "SAFE",
      result: "PENDING",
      startTime,
      isFeatured: true,
      matchDate: startTime,
      createdAt: startTime,
      bookmakerOdds: MOCK_BOOKMAKERS,
    };
  }

  // Analyse réelle : on garde les champs visibles, on mocke les masqués.
  return {
    ...real,
    pick: real.pick ?? MOCK_PICK,
    argument: real.argument ?? MOCK_ARGUMENT,
    bookmakerOdds:
      real.bookmakerOdds && real.bookmakerOdds.length > 0 ? real.bookmakerOdds : MOCK_BOOKMAKERS,
  };
}

export default async function FichePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await fetchExpert(id);

  const realAnalysis = expert?.pronos.find((p) => p.result === "PENDING") ?? expert?.pronos[0];
  const analysis = buildPreviewAnalysis(realAnalysis);
  const expertPseudo = expert?.pseudo ?? "RugbyPro";
  const viewsToday = expert?.viewsToday ?? 267;

  return (
    <div className="mx-auto w-full max-w-[960px] flex-1 px-4 pb-24 pt-10 md:px-6 md:pt-16">
      <div className="mb-10 rounded-lg border border-border bg-white/[0.03] px-4 py-3 font-body text-sm text-muted-foreground">
        Page de test interne — comparaison visuelle des deux directions de card.{" "}
        {expert
          ? "Données réelles de l'expert (pick / argumentaire / bookmakers mockés pour la preview)."
          : "Expert introuvable : données entièrement mockées."}{" "}
        Non indexée.
      </div>

      <h1 className="mb-8 font-display text-3xl font-normal text-foreground md:text-5xl">
        Analyse du jour
      </h1>

      <p className="mb-4 font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Direction 2 · Fiche
      </p>
      <AnalysisCardFiche analysis={analysis} expertPseudo={expertPseudo} />

      <div aria-hidden className="my-16 border-t border-border" />

      <p className="mb-4 font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Direction 1 · Ticket (rappel)
      </p>
      <AnalysisCardTicket
        analysis={analysis}
        hasAccess
        expertPseudo={expertPseudo}
        viewsToday={viewsToday}
      />
    </div>
  );
}
