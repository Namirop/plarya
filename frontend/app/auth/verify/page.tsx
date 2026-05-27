"use client";

import { Suspense, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import {
  formDaInputCls,
  formDaInputInvalid,
  formDaLabelCls,
} from "@/lib/form-da";
import { cn } from "@/lib/utils";

// /auth/verify — page de retour magic-link.
//
// Cas couverts :
//   - error=expired : lien trop vieux ou déjà utilisé
//   - error=invalid : lien mal formé / token inconnu
//   - error=deleted : email en cooldown post-suppression
//   - aucun error  : fallback "connexion en cours…" (le backend a normalement
//                    posé le cookie et redirigé avant)
//
// DA : InfoScreen-style — titre éditorial XL centré (font-display 48-96px),
// pas de card, contenu unique posé sur le fond. Pour les cas expired/invalid,
// un mini-formulaire intégré sous le subtitle permet de demander un nouveau
// lien sans repasser par le LoginModal.

export default function AuthVerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error === "expired") {
    return (
      <ResendErrorScreen
        eyebrow="Lien expiré"
        title="Ce lien n'est plus valide."
        subtitle="Pas de souci. Entre ton email pour recevoir un nouveau lien de connexion."
      />
    );
  }

  if (error === "invalid") {
    return (
      <ResendErrorScreen
        eyebrow="Lien invalide"
        title="Ce lien est invalide."
        subtitle="Le lien que tu as utilisé est mal formé. Demande un nouveau lien ci-dessous."
      />
    );
  }

  if (error === "deleted") {
    return (
      <CenteredInfoScreen
        eyebrow="Compte supprimé"
        title="Ce compte a été supprimé."
        subtitle="La connexion avec cet email est temporairement indisponible. Réessaie dans quelques jours, ou utilise un autre email pour créer un nouveau compte."
        action={
          <Button variant="primary" size="lg" render={<Link href="/" />}>
            Retour à l&apos;accueil
          </Button>
        }
      />
    );
  }

  // Fallback : le backend a normalement posé le cookie + redirigé. Si on
  // arrive ici sans param, c'est probablement transitoire.
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="font-body text-body-16 text-muted-foreground">Connexion en cours…</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Écran "demande de nouveau lien" — utilisé pour expired/invalid.
// ────────────────────────────────────────────────────────────────────

interface ResendErrorScreenProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

function ResendErrorScreen({ eyebrow, title, subtitle }: ResendErrorScreenProps) {
  const { requestMagicLink } = useUser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email.trim() || !email.includes("@")) {
      setError("Email invalide");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  // Cas succès : on remplace tout le formulaire par un message de
  // confirmation centré, sans CTA (le user a juste à aller dans sa
  // boîte mail).
  if (sent) {
    return (
      <CenteredInfoScreen
        eyebrow="Lien envoyé"
        title="Vérifie ta boîte mail."
        subtitle={`Un nouveau lien de connexion a été envoyé à ${email}. Il expire dans 15 minutes.`}
      />
    );
  }

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {eyebrow}
      </p>

      <h1
        style={{ lineHeight: 0.85 }}
        className="mt-5 max-w-[860px] font-display text-foreground text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px]"
      >
        {title}
      </h1>

      <p className="mt-6 max-w-[520px] font-body text-body-18 leading-[1.55] text-muted-foreground">
        {subtitle}
      </p>

      {/* Formulaire intégré — pas de card, juste un input + bouton
          alignés sous le subtitle, max-w restreint pour ne pas crier. */}
      <div className="mt-10 w-full max-w-[400px] text-left">
        <label htmlFor="resend-email" className={formDaLabelCls}>
          Ton email
        </label>
        <input
          id="resend-email"
          type="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          autoComplete="email"
          disabled={submitting}
          aria-invalid={!!error}
          className={cn(formDaInputCls, "mt-2", error && formDaInputInvalid)}
        />
        {error && (
          <p role="alert" className="mt-2 font-body text-[13px] text-destructive">
            {error}
          </p>
        )}
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleResend}
          disabled={submitting}
          className="mt-5 w-full"
        >
          {submitting ? "Envoi…" : "Demander un nouveau lien"}
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Écran d'info centré simple (compte supprimé, lien envoyé).
// ────────────────────────────────────────────────────────────────────

interface CenteredInfoScreenProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

function CenteredInfoScreen({ eyebrow, title, subtitle, action }: CenteredInfoScreenProps) {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {eyebrow}
      </p>
      <h1
        style={{ lineHeight: 0.85 }}
        className="mt-5 max-w-[860px] font-display text-foreground text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px]"
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-6 max-w-[560px] font-body text-body-18 leading-[1.55] text-muted-foreground">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-10">{action}</div>}
    </div>
  );
}
