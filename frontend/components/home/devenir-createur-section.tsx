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

  // Si user connecté → bouton = Link direct vers /devenir-expert
  // (comportement avant le fix).
  // Si user déconnecté → bouton ouvre LoginModal contextualisé qui,
  // après login, le déposera sur /devenir-expert via le sessionStorage
  // POST_LOGIN_REDIRECT_KEY consommé dans HeaderAuth.
  // Pendant le `loading` initial de useUser : on rend comme déconnecté
  // (l'inverse causerait un flash "click → /devenir-expert → bounce /"
  // si la session échoue à hydrater).
  const isConnected = !loading && !!user;

  return (
    // pt-16 = 64 px (gap depuis Pourquoi Plarya).
    <section className="pt-20">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        {/* Card "outline" : bordure conic-gradient dorée (haut-gauche +
            bas-droite très visibles, sombre ailleurs), même pattern
            visuel que le cadre du Hero (cf. GoldenBorderOverlay). PAS
            de fond — distinct de Pourquoi Plarya qui a `bg-black/40`
            sans bordure.
            Mobile : stack vertical (texte + bouton plein largeur).
            Desktop : row horizontale (texte gauche + bouton droite). */}
        <div className="relative flex flex-col items-stretch gap-6 rounded-2xl px-8 py-8 md:flex-row md:items-center md:justify-between md:gap-8 md:px-16">
          <GoldenBorderOverlay />
          <div className="flex flex-col gap-4">
            {/* h2 = titre de section sur la home (hiérarchie h1 Hero
                → h2 sections). Le visuel reste text-h4 — c'est juste
                la sémantique HTML qui change. */}
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
