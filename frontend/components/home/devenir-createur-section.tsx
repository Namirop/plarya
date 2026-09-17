"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react";

import { LoginModal } from "@/components/auth/login-modal";
import { Button } from "@/components/ui/button";
import { GoldenBorderOverlay } from "@/components/ui/golden-border-overlay";
import { useUser } from "@/hooks/use-user";

const DEVENIR_CREATEUR_HREF = "/devenir-expert";

export function DevenirCreateurSection() {
  const { user, loading } = useUser();
  const [loginOpen, setLoginOpen] = useState(false);

  // Connecté : lien direct. Sinon : LoginModal, puis redirection vers
  // /devenir-expert (POST_LOGIN_REDIRECT_KEY, lu par HeaderAuth). Pendant le
  // chargement, rendu « déconnecté » pour éviter un aller-retour de redirection.
  const isConnected = !loading && !!user;

  return (
    <section className="pt-20">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        {/* Carte sans fond, bordée par GoldenBorderOverlay comme le Hero. */}
        <div className="relative flex flex-col items-stretch gap-6 rounded-2xl px-8 py-8 md:flex-row md:items-center md:justify-between md:gap-8 md:px-16">
          <GoldenBorderOverlay />
          <div className="flex flex-col gap-4">
            {/* h2 pour la hiérarchie de la page, style h4. */}
            <h2 className="font-body text-h4 text-foreground">
              Partage ton expertise et génère des revenus
            </h2>
            <p className="font-body text-body-16 leading-[1.4] text-muted-foreground">
              Rejoins Plarya en tant que créateur et monétise tes analyses auprès d&apos;une
              communauté engagée.
            </p>
          </div>

          {isConnected ? (
            <Button
              variant="primary"
              size="lg"
              render={<Link href={DEVENIR_CREATEUR_HREF} />}
              className="w-full md:w-auto animate-shine-pulse"
            >
              Devenir expert
              <ArrowRight className="size-4 hidden md:inline-block" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setLoginOpen(true)}
              className="w-full md:w-auto animate-shine-pulse"
            >
              Devenir créateur
              <ArrowRight className="size-4 hidden md:inline-block" />
            </Button>
          )}
        </div>
      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="Connecte-toi pour devenir créateur"
        description="Entre ton email — on t'envoie un lien de connexion, puis tu accèdes au formulaire de candidature."
        redirectAfterLogin={DEVENIR_CREATEUR_HREF}
      />
    </section>
  );
}
