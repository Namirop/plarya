"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InfoScreen } from "@/components/ui/info-screen";

// Écrans alternatifs de /devenir-expert (hors landing par défaut) :
// chargement de session, utilisateur déjà expert, et retours Stripe
// (succès / annulation). Chacun remplace toute la page.

// PageShell pour l'état de chargement. Layout centré max-w 872.
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[872px] px-4 py-10 md:px-8 md:py-16">{children}</div>
  );
}

// ── État 1 : chargement de la session ────────────────────────
export function LoadingScreen() {
  return (
    <PageShell>
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-surface-elevated border-t-accent" />
      </div>
    </PageShell>
  );
}

// ── État 2 : utilisateur déjà expert ────────────────────────
// Pattern InfoScreen : grand titre éditorial centré vh/hz, sans card.
export function AlreadyExpertScreen() {
  return (
    <InfoScreen
      eyebrow="Compte expert actif"
      title="Tu es déjà expert."
      subtitle="Rendez-vous sur ton tableau de bord pour publier tes analyses et suivre tes performances."
      actions={
        <Button variant="primary" size="lg" render={<Link href="/dashboard" />}>
          Accéder au dashboard
        </Button>
      }
    />
  );
}

// ── État 3 : retour Stripe checkout réussi ───────────────────
export function CheckoutSuccessScreen() {
  return (
    <InfoScreen
      eyebrow="Paiement validé"
      title="Bienvenue parmi les experts."
      subtitle="Ton compte expert est en cours de création. Tu pourras accéder à ton dashboard dans quelques instants."
      actions={
        <Button variant="primary" size="lg" render={<Link href="/dashboard" />}>
          Accéder au dashboard
        </Button>
      }
    />
  );
}

// ── État 4 : retour Stripe checkout annulé ───────────────────
export function CheckoutCancelScreen() {
  const router = useRouter();
  return (
    <InfoScreen
      eyebrow="Paiement annulé"
      title="Pas de souci."
      subtitle="Tu peux relancer ta candidature quand tu veux — rien n'a été débité."
      actions={
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            window.history.replaceState({}, "", "/devenir-expert");
            router.refresh();
          }}
        >
          Réessayer
        </Button>
      }
    />
  );
}
