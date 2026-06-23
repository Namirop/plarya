"use client";

import { ExpertProfilePreview } from "@/components/devenir-expert/expert-profile-preview";
import { PricingCard } from "@/components/devenir-expert/pricing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/ui/reveal";
import { Textarea } from "@/components/ui/textarea";
import { SPORT_LABELS, stripSportEmoji } from "@/lib/constants";
import {
  formDaInputCls,
  formDaLabelCls,
  formDaTextareaCls,
} from "@/lib/form-da";
import { cn } from "@/lib/utils";

import { useExpertApplication } from "../_hooks/use-expert-application";

import { SectionHeader } from "./section-header";

// Aliases locaux pour minimiser les call-sites à modifier (et préserver
// l'option de surcharger localement si /devenir-expert a besoin d'une
// variante ultérieure).
const fieldCls = formDaInputCls;
const textareaCls = cn(formDaTextareaCls, "min-h-[100px]");
const labelCls = formDaLabelCls;

// ════════════════ SECTION 3 — FORMULAIRE ════════════════
// Layout 2 colonnes desktop : form left (col-span-7) + panel preview
// LIVE right (col-span-5). Mobile : stack 1 col, panel sous le form.
export function ApplicationFormSection({ email }: { email: string }) {
  const { pseudo, setPseudo, bio, setBio, sports, toggleSport, error, submitting, handleSubmit } =
    useExpertApplication();

  return (
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
            className="space-y-6 rounded-lg bg-surface-elevated p-6 md:p-10"
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
                value={email}
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
            Reçoit le state du form (pseudo / bio / sports) et se
            re-render à chaque modification — l'user voit son profil se
            construire en temps réel pendant qu'il remplit le form. ─── */}
        <Reveal delay={0.2} className="md:col-span-5">
          <ExpertProfilePreview pseudo={pseudo} bio={bio} sports={sports} />
        </Reveal>
      </div>
    </section>
  );
}
