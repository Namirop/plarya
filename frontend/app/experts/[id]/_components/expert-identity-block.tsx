import Image from "next/image";

import { Eye } from "@phosphor-icons/react";

import type { PublicExpertProfile } from "@/lib/experts";
import { getSportLabel } from "@/lib/sports";

/**
 * Bandeaux (avertissement admin + suppression programmée) + bloc
 * identité de l'expert (avatar, pseudo, badge, vues, bio, spécialité,
 * note du jour). Présentationnel pur.
 */
export function ExpertIdentityBlock({ expert }: { expert: PublicExpertProfile }) {
  const isPendingDeletion = !!expert.pendingDeletion;

  return (
    <>
      {/* Bandeau d'avertissement admin — neutre (anciennement doré,
          neutralisé : la règle /experts/[id] réserve le doré au badge
          EXPERT, badge featured, cote featured et CTA primary). Le
          warning reste visible via la bordure + le fond subtil. */}
      {expert.warningMessage && (
        <div className="mb-6 rounded-xl border border-surface-elevated bg-white/[0.03] px-4 py-3 font-body text-body-16 text-foreground">
          {expert.warningMessage}
        </div>
      )}

      {/* Bandeau "suppression programmée" : seuls les abonnés existants
          doivent encore voir ce profil. On reste transparent pour
          qu'ils sachent que l'expert quitte la plateforme. */}
      {isPendingDeletion && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-body-16 text-destructive">
          Cet expert ne prend plus de nouveaux abonnés et quittera bientôt la plateforme. Ton accès
          actuel reste valide jusqu&apos;à l&apos;expiration de ton abonnement.
        </div>
      )}

      {/* ═══ BLOC IDENTITÉ ═══
          Card englobante DS : bg-black/40, bordure subtile, radius 16,
          padding 24/32. Layout horizontal desktop, stack vertical
          mobile. Pas de glow décoratif (aucun halo de fond sur élément
          non-CTA). */}
      <section className="rounded-2xl border border-surface-elevated bg-black/40 p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Avatar 96×96, ring doré subtil. */}
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

          {/* Bloc infos. Centré mobile, gauche desktop. */}
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

            {/* Spécialité en mention inline éditoriale (plus de pills
                rounded-full + icône). */}
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
