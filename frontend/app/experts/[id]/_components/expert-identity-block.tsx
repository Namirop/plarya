import Image from "next/image";

import { Eye } from "@phosphor-icons/react";

import type { PublicExpertProfile } from "@/lib/experts";
import { getSportLabel } from "@/lib/sports";

/** Bandeaux (avertissement admin, suppression programmée) et identité de l'expert. */
export function ExpertIdentityBlock({ expert }: { expert: PublicExpertProfile }) {
  const isPendingDeletion = !!expert.pendingDeletion;

  return (
    <>
      {expert.warningMessage && (
        <div className="mb-6 rounded-xl border border-surface-elevated bg-white/[0.03] px-4 py-3 font-body text-body-16 text-foreground">
          {expert.warningMessage}
        </div>
      )}

      {/* Profil retiré des listings : ce bandeau s'adresse aux abonnés en cours. */}
      {isPendingDeletion && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-body-16 text-destructive">
          Cet expert ne prend plus de nouveaux abonnés et quittera bientôt la plateforme. Ton accès
          actuel reste valide jusqu&apos;à l&apos;expiration de ton abonnement.
        </div>
      )}

      <section className="rounded-2xl border border-surface-elevated bg-black/40 p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="shrink-0">
            {expert.photoUrl ? (
              <Image
                src={expert.photoUrl}
                alt={expert.pseudo}
                width={96}
                height={96}
                className="size-24 rounded-full object-cover ring-1 ring-surface-elevated"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-surface-elevated font-display text-h2 text-foreground ring-1 ring-surface-elevated">
                {expert.pseudo.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <h1 className="font-display text-h2 text-foreground">{expert.pseudo}</h1>
              <span className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 font-body text-body-16 text-accent">
                EXPERT
              </span>
            </div>

            {expert.viewsToday > 0 && (
              <div className="flex items-center gap-2 font-body text-body-16 text-muted-foreground">
                <Eye className="size-4" />
                <span>{expert.viewsToday} vues aujourd&apos;hui</span>
              </div>
            )}

            {expert.bio && <p className="font-body text-body-16 text-foreground">{expert.bio}</p>}

            {expert.sports.length > 0 && (
              <p className="font-body text-sm text-muted-foreground">
                Spécialiste {expert.sports.map(getSportLabel).join(", ").toLowerCase()}
              </p>
            )}

            {expert.dailyNote && (
              <p className="font-body text-body-16 text-muted-foreground">{expert.dailyNote}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
