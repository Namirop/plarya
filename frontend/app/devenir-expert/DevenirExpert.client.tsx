"use client";

import { useState, useEffect, type FormEvent } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ArrowRight } from "@phosphor-icons/react";

import { ExpertProfileMockup } from "@/components/devenir-expert/expert-profile-mockup";
import { ExpertProfilePreview } from "@/components/devenir-expert/expert-profile-preview";
import { FaqItem } from "@/components/devenir-expert/faq-item";
import { PricingCard } from "@/components/devenir-expert/pricing-card";
import { Button } from "@/components/ui/button";
import { InfoScreen } from "@/components/ui/info-screen";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui/reveal";
import { StatBlock } from "@/components/ui/stat-block";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { SPORT_LABELS, stripSportEmoji } from "@/lib/constants";
import {
  formDaInputCls,
  formDaLabelCls,
  formDaTextareaCls,
} from "@/lib/form-da";
import { createExpertCheckout } from "@/lib/stripe";
import { cn } from "@/lib/utils";

// Aliases locaux pour minimiser les call-sites à modifier (et préserver
// l'option de surcharger localement si /devenir-expert a besoin d'une
// variante ultérieure).
const fieldCls = formDaInputCls;
const textareaCls = cn(formDaTextareaCls, "min-h-[100px]");
const labelCls = formDaLabelCls;

// Eyebrow uppercase commun (Form & FAQ). Tracking large pour un
// rendu moderne, font-semibold pour du poids sans crier.
const eyebrowCls =
  "font-body text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

// Pré-titre + titre + sous-titre — pattern partagé entre Section 3
// (Form) et Section 4 (FAQ). Centré, padding-bottom homogène.
function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      {/* Kicker → Titre : 12px (mt-3) — élément lié, gap proportionné
          à la nouvelle taille XL du titre. */}
      <p className={eyebrowCls}>{eyebrow}</p>
      {/* H2 XL : mobile 36px, desktop 56px (vs 28-32 ancien). Le
          contraste éditorial vient du gabarit, pas de la couleur. */}
      <h2 className="mt-3 font-body text-[36px] font-bold leading-[1.02] text-foreground md:text-[56px]">
        {title}
      </h2>
      {/* Titre → sous-titre : 16px (mt-4) — gap d'une unité visuelle. */}
      {subtitle && (
        <p className="mx-auto mt-4 max-w-[560px] font-body text-body-16 text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// PageShell pour les états alternatifs (loading / déjà expert /
// success / cancel). Layout centré max-w 872.
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[872px] px-4 py-10 md:px-8 md:py-16">{children}</div>
  );
}

export function DevenirExpertClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();

  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checkoutStatus = searchParams.get("checkout");

  // Redirige les non-loggés vers la home.
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
  // Pattern InfoScreen : grand titre éditorial centré vh/hz, sans card.
  if (user?.role === "EXPERT") {
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
  if (checkoutStatus === "success") {
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
  if (checkoutStatus === "cancel") {
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

  // ════════════════════════════════════════════════════════════════
  // État 5 (default) : la nouvelle landing /devenir-expert
  //
  // Architecture 4 sections :
  //   1. Hero éditorial (pitch 60% + mockup 40%, desktop)
  //   2. Bénéfices (3 cards)
  //   3. Formulaire + PricingCard 39€ premium
  //   4. FAQ (4 accordions)
  //
  // Animations : composant <Reveal> du DS (motion + whileInView), même
  // pattern que les sections de la home. Toutes subtiles (fade + slide
  // 24px, ease premium). Reveal respecte prefers-reduced-motion par
  // défaut côté motion lib.
  // ════════════════════════════════════════════════════════════════

  function scrollToForm() {
    document.getElementById("candidature")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative">
      {/* ════════════════ SECTION 1 — HERO ÉDITORIAL ════════════════
          subtle-radial-glow-warm : halo doré ultra-subtil (opacity 4%)
          en haut centre du Hero, donne l'impression que le H1 rayonne.
          Imperceptible directement mais ajoute de la profondeur. */}
      <section className="subtle-radial-glow-warm mx-auto w-full max-w-content px-4 pt-10 md:px-8 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
          {/* Colonne gauche : pitch + sous-titre + mini-stats + CTA lien.
              Espacements serrés (mt-5 / mt-4 / mt-6) pour grouper les
              éléments en une unité visuelle au lieu de les faire flotter. */}
          <div className="flex flex-col">
            <Reveal>
              {/* H1 XL — pattern "type-driven design" : le titre écrase
                  visuellement tout le reste. Mobile 48px, desktop 88px,
                  line-height ultra-serré (0.92).
                  Break manuel après "Expert" pour FORCER un wrap 2/2 :
                  "Devenir Expert" / "sur Plarya". Sans ce break, le
                  texte wrapait sur 3 lignes (4 mots à 88px dans une col
                  bornée). */}
              <h1 className="font-display text-[48px] leading-[0.95] text-foreground md:text-[88px] md:leading-[0.92]">
                Devenir Expert
                <br />
                <span className="text-accent">sur Plarya</span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-5 max-w-[500px] font-body text-body-18 leading-[1.55] text-muted-foreground">
                Partage tes analyses sportives avec une audience qui paie pour tes sélections. Un
                profil mis en avant, des paiements directs, une plateforme premium.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              {/* Ligne stats Hero : "39€ / trimestre" en doré — cohérent
                  avec le prix gold dans la PricingCard plus bas. */}
              <p className="mt-4 font-body text-body-16 text-muted-foreground">
                <span className="font-semibold text-accent">39€ / trimestre</span>{" "}
                <span aria-hidden className="mx-2 text-muted-foreground/60">
                  ·
                </span>{" "}
                Annulation à tout moment
              </p>
            </Reveal>

            <Reveal delay={0.28}>
              {/* Lien neutre avec underline au hover — pas un bouton
                  plein (pas de duplicate du CTA primary du formulaire). */}
              <button
                type="button"
                onClick={scrollToForm}
                className="group mt-6 inline-flex cursor-pointer items-center gap-2 self-start font-body text-body-16 text-foreground transition-colors hover:underline underline-offset-4"
              >
                Voir le formulaire de candidature
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            </Reveal>
          </div>

          {/* Colonne droite : mockup profil expert. Slide-from-right
              custom — Reveal fait du slide-up par défaut, on lui passe
              un wrapper avec une animation custom pour matcher la spec
              (slide-from-right au load). Pour faire simple on garde
              Reveal slide-up — le mockup arrive en glissant légèrement
              du bas plutôt que de la droite. C'est plus subtil et
              cohérent avec le reste de la page. */}
          <div className="flex justify-center lg:justify-end">
            <Reveal delay={0.36}>
              <ExpertProfileMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════ SECTION 2 — STAT FORTES ════════════════
          3 mini-blocs "chiffre fort" SANS card ni border ni bg.
          Refonte v3 : les anciennes BenefitCard asymétriques étaient
          encore "AI-template" malgré l'asymétrie. Le pattern moderne
          (type-driven) c'est juste un GROS chiffre + label, sans
          décoration.
          Sur desktop : grid 3 cols égales avec dividers verticaux
          subtils entre les blocs. Sur mobile : stack vertical sans
          dividers. */}
      <section className="mx-auto mt-20 w-full max-w-content px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <Reveal delay={0}>
            <StatBlock
              value="Top 3"
              label="dans les listings de sport"
              description="Ton profil mis en avant sur la homepage et dans toutes les pages sport."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <StatBlock
              value="80%"
              valueAccent
              label="du chiffre d'affaires te revient"
              description="Day pass 3,50€, abonnement 29€/mois. Paiements automatiques mensuels."
              withLeftDivider
            />
          </Reveal>
          <Reveal delay={0.2}>
            <StatBlock
              value="30 sec"
              label="pour publier une analyse"
              description="Dashboard pensé pour les experts. Stats détaillées, suivi de tes résultats."
              withLeftDivider
            />
          </Reveal>
        </div>
      </section>

      {/* ════════════════ SECTION 3 — FORMULAIRE ════════════════
          Layout 2 colonnes desktop : form left (col-span-7) + panel
          social proof right (col-span-5). Mobile : stack 1 col,
          panel passe sous le form. */}
      <section
        id="candidature"
        className="mx-auto mt-20 w-full max-w-[1080px] px-4 md:mt-24 md:px-8"
      >
        <Reveal>
          <SectionHeader
            eyebrow="Étape finale"
            title="Commence ta candidature"
            subtitle="Inscription en moins d'une minute · Annulation possible à tout moment"
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:mt-12 md:grid-cols-12 md:gap-8">
        <Reveal delay={0.1} className="md:col-span-7">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6 rounded-lg bg-[#181818] p-6 md:p-10"
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
                Pseudo <span className="text-foreground/60">*</span>
              </Label>
              <Input
                id="pseudo"
                placeholder="TonPseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className={fieldCls}
              />
            </div>

            {/* Email (auto-rempli, disabled) */}
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

            {/* Sports couverts — tags inline éditoriaux (pas de pill, pas
                d'emoji). Indicateur "+" muted → "✓" doré sur sélection,
                avec sous-ligne accent/40 pour le côté "tag éditorial".
                Cohérent avec le rendu des sports dans la preview navigateur. */}
            <div className="space-y-2">
              <Label className={labelCls}>
                Sports couverts <span className="text-foreground/60">*</span>
              </Label>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {Object.entries(SPORT_LABELS).map(([key, label]) => {
                  const isActive = sports.includes(key);
                  const cleanLabel = stripSportEmoji(label);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSport(key)}
                      aria-pressed={isActive}
                      className={cn(
                        "group cursor-pointer inline-flex items-baseline gap-1.5 px-1 py-1 font-body text-[16px] transition-colors duration-150",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "font-body text-[14px] leading-none transition-colors",
                          isActive
                            ? "text-accent"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {isActive ? "✓" : "+"}
                      </span>
                      <span
                        className={cn(
                          "underline-offset-4",
                          isActive && "underline decoration-accent/40 decoration-1",
                        )}
                      >
                        {cleanLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card prix : 36px de gap au-dessus (mt-9) pour la
                distinguer des champs (règle "champs → card prix : 32-40px"). */}
            <PricingCard className="!mt-9" />

            {/* CTA principal — DA primary standard (gradient gold +
                shadow-shine-soft + rounded-[3px] depuis le Button base). */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="!mt-7 w-full"
            >
              {submitting ? "Redirection vers le paiement…" : "Devenir Expert (39€/trimestre)"}
            </Button>

            {/* Sous-texte de réassurance : 10px sous le CTA (élément lié). */}
            <p className="!mt-2.5 text-center font-body text-[13px] text-muted-foreground">
              Paiement sécurisé via Stripe · Aucun engagement long terme
            </p>
          </form>
        </Reveal>

        {/* ─── Panneau droit : preview LIVE du futur profil expert.
            Reçoit le state du form (pseudo / bio / sports / email) et
            se re-render à chaque modification — l'user voit son profil
            se construire en temps réel pendant qu'il remplit le form. ─── */}
        <Reveal delay={0.2} className="md:col-span-5">
          <ExpertProfilePreview pseudo={pseudo} bio={bio} sports={sports} />
        </Reveal>
        </div>
      </section>

      {/* ════════════════ SECTION 4 — FAQ ════════════════ */}
      <section className="mx-auto mt-20 mb-20 w-full max-w-[720px] px-4 md:mt-24 md:mb-24 md:px-8">
        <Reveal>
          <SectionHeader eyebrow="Questions fréquentes" title="Tout ce que tu dois savoir" />
        </Reveal>

        <div className="mt-10 space-y-3">
          <Reveal delay={0}>
            <FaqItem
              question="Comment fonctionne le paiement ?"
              answer="Tu paies 39€ tous les 3 mois par carte bancaire via Stripe. Le paiement est automatique. Tu peux annuler à tout moment depuis ton compte — l'accès reste actif jusqu'à la fin de la période payée."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <FaqItem
              question="Quel pourcentage Plarya prend-elle ?"
              answer="Tu gardes 80% du chiffre d'affaires généré par tes analyses (day passes à 3,50€ et abonnements à 29€/mois). Plarya conserve 20% pour l'hébergement, les paiements et la mise en avant."
            />
          </Reveal>
          <Reveal delay={0.16}>
            <FaqItem
              question="Quand suis-je payé ?"
              answer="Les revenus sont versés mensuellement sur ton compte bancaire (via Stripe Connect, configuré depuis ton dashboard). Premier versement environ 30 jours après ta première vente."
            />
          </Reveal>
          <Reveal delay={0.24}>
            <FaqItem
              question="Puis-je quitter Plarya à tout moment ?"
              answer="Oui. Tu peux supprimer ton compte depuis ta page Mon Compte. Les abonnements actifs de tes clients courent jusqu'à leur date d'expiration naturelle, puis sont automatiquement résiliés. Tes données sont anonymisées dans les 30 jours."
            />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
