"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useUser } from "@/hooks/use-user";
import { createExpertCheckout } from "@/lib/stripe";
import { SPORT_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function DevenirExpertPage() {
  return (
    <Suspense>
      <DevenirExpertContent />
    </Suspense>
  );
}

// Styles partagés form (DS). Inputs : fond noir 40 %, bordure subtile
// surface-elevated, focus accent doré.
const fieldCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

const textareaCls = cn(
  "min-h-[120px] w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200 resize-y",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
);

const labelCls = "font-body text-body-16 text-muted-foreground";

// Wrapper layout (max-w 872 = largeur de la card Figma). Padding
// vertical 64 px desktop / 40 px mobile, padding latéral 16 px mobile
// (cohérent avec le Dashboard). PageShell aussi utilisé par les états
// alternatifs (déjà expert / success / cancel) pour cohérence
// visuelle (même page bg, même container).
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[872px] px-4 py-10 md:px-8 md:py-16">
      {children}
    </div>
  );
}

function DevenirExpertContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();

  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checkoutStatus = searchParams.get("checkout");

  // Redirige les non-loggés vers la home (logique V1 inchangée).
  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  function toggleSport(sport: string) {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!pseudo.trim() || pseudo.length < 2) {
      setError("Le pseudo doit contenir au moins 2 caractères");
      return;
    }
    if (sports.length === 0) {
      setError("Sélectionnez au moins un sport");
      return;
    }
    setSubmitting(true);
    try {
      const url = await createExpertCheckout(pseudo, bio, sports);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du paiement");
    } finally {
      setSubmitting(false);
    }
  }

  // ── État 1 : chargement de la session ────────────────────────
  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-surface-elevated border-t-accent" />
        </div>
      </PageShell>
    );
  }

  // ── État 2 : utilisateur déjà expert ────────────────────────
  if (user?.role === "EXPERT") {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-surface-elevated bg-black/40 px-6 py-8 text-center md:px-8 md:py-10">
          <h1 className="font-display text-h2 text-foreground">
            Vous êtes déjà expert
          </h1>
          <p className="font-body text-body-16 text-muted-foreground">
            Votre compte expert est actif. Rendez-vous sur votre tableau de
            bord pour publier vos analyses.
          </p>
          <Button variant="primary" size="lg" render={<Link href="/dashboard" />}>
            Accéder au dashboard
          </Button>
        </div>
      </PageShell>
    );
  }

  // ── État 3 : retour Stripe checkout réussi ───────────────────
  if (checkoutStatus === "success") {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-surface-elevated bg-black/40 px-6 py-8 text-center md:px-8 md:py-10">
          <h1 className="font-display text-h2 text-foreground">
            Bienvenue parmi les experts <span className="text-accent">!</span>
          </h1>
          <p className="font-body text-body-16 text-muted-foreground">
            Votre compte expert est en cours de création. Vous pourrez accéder
            à votre dashboard dans quelques instants.
          </p>
          <Button variant="primary" size="lg" render={<Link href="/dashboard" />}>
            Accéder au dashboard
          </Button>
        </div>
      </PageShell>
    );
  }

  // ── État 4 : retour Stripe checkout annulé ───────────────────
  if (checkoutStatus === "cancel") {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-surface-elevated bg-black/40 px-6 py-8 text-center md:px-8 md:py-10">
          <h1 className="font-display text-h2 text-foreground">
            Paiement annulé
          </h1>
          <p className="font-body text-body-16 text-muted-foreground">
            Vous pouvez réessayer quand vous le souhaitez.
          </p>
          <Button
            variant="primary"
            size="lg"
            // Logique V1 inchangée : retire le query param sans nav et
            // refresh pour repartir sur la branche par défaut (form).
            onClick={() => {
              window.history.replaceState({}, "", "/devenir-expert");
              router.refresh();
            }}
          >
            Réessayer
          </Button>
        </div>
      </PageShell>
    );
  }

  // ── État 5 (default) : formulaire de candidature ────────────
  return (
    <PageShell>
      {/* Titre de page — DM Serif Display 48/60 desktop, 32/36 mobile
          (aligné Dashboard h1 — évite le wrap horrible sur "Devenir Expert"). */}
      <h1 className="text-center font-display text-[32px] leading-[36px] text-foreground md:text-[48px] md:leading-[60px]">
        Devenir Expert
      </h1>
      <p className="mx-auto mt-6 max-w-[635px] text-center font-body text-body-16 text-muted-foreground md:mt-8">
        Publiez vos analyses et monétisez votre expertise — 39€/trimestre
      </p>

      {/* Card englobante — bg-black/40 + bordure subtile, radius 16.
          Padding 32 px desktop / 20 px mobile (cf. spec §5 + DS). */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-10 space-y-6 rounded-2xl border border-surface-elevated bg-black/40 p-5 md:mt-16 md:p-8"
      >
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-body-16 text-destructive"
          >
            {error}
          </div>
        )}

        {/* Pseudo */}
        <div className="space-y-2">
          <Label htmlFor="pseudo" className={labelCls}>
            Pseudo <span className="text-accent">*</span>
          </Label>
          <Input
            id="pseudo"
            placeholder="TonPseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className={fieldCls}
          />
        </div>

        {/* Email (auto-rempli depuis la session, disabled) */}
        <div className="space-y-2">
          <Label htmlFor="email" className={labelCls}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ""}
            disabled
            className={fieldCls}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className={labelCls}>
            Bio
          </Label>
          <Textarea
            id="bio"
            placeholder="Expert Football & Tennis — Analyses pointues"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className={textareaCls}
          />
        </div>

        {/* Sports couverts — chips toggle multi-select */}
        <div className="space-y-2">
          <Label className={labelCls}>
            Sports couverts <span className="text-accent">*</span>
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(SPORT_LABELS).map(([key, label]) => {
              const isActive = sports.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSport(key)}
                  aria-pressed={isActive}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-2 font-body text-body-16 transition-all duration-200",
                    isActive
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-surface-elevated bg-black/40 text-foreground hover:border-accent",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bloc résumé tarif */}
        <div className="rounded-xl border border-surface-elevated bg-black/40 p-5">
          <p className="font-body text-h5 text-foreground">39€ / trimestre</p>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Accès au dashboard expert, publication d&apos;analyses, visibilité
            sur la plateforme. Renouvellement automatique tous les 3 mois.
          </p>
        </div>

        {/* Submit — variant white du DS (équivalent CTA "Accéder (3,50€)") */}
        <Button
          type="submit"
          variant="white"
          size="lg"
          disabled={submitting}
          className="w-full"
        >
          {submitting
            ? "Redirection vers le paiement..."
            : "Devenir Expert (39€/trimestre)"}
        </Button>
      </form>
    </PageShell>
  );
}
