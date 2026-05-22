"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, X } from "lucide-react";
import { Icon } from "@iconify/react";

import { useUser } from "@/hooks/use-user";
import { apiGet, apiPost } from "@/lib/api";
import { createCheckoutSession } from "@/lib/stripe";
import { TEASING_LABELS, formatPrice } from "@/lib/constants";
import { getSportLabel, getLeague } from "@/lib/sports";
import { SportIcon } from "@/lib/sports-icons";
import { formatStartTime, isStarted, allStarted } from "@/lib/date";
import { EmailCheckoutModal } from "@/components/checkout/email-checkout-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookmakerOddsData {
  id: string;
  odds: number;
  bookmaker: {
    id: string;
    name: string;
    logoUrl: string | null;
    affiliateLinks: { id: string; url: string; label: string | null }[];
  };
}

interface PronoData {
  id: string;
  matchName: string;
  league: string | null;
  pick: string | null;
  argument: string | null;
  odds: number;
  teasing: string;
  result: "PENDING" | "WON" | "LOST";
  startTime: string;
  isFeatured: boolean;
  matchDate: string | null;
  createdAt: string;
  bookmakerOdds?: BookmakerOddsData[];
}

interface TipsterProfile {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  photoUrl: string | null;
  sports: string[];
  dayPassPrice: number;
  monthlyPrice: number;
  warningMessage: string | null;
  viewsToday: number;
  pronosToday: number;
  pronos: PronoData[];
}

// Shape minimale de /tipsters/me utilisée uniquement pour détecter si
// le tipster connecté est sur SA propre page publique (bypass paywall).
interface OwnTipsterIdentity {
  id: string;
}

export default function TipsterProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useUser();
  const id = params.id as string;

  const [tipster, setTipster] = useState<TipsterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── ACCÈS PAYANT (V1) ──────────────────────────────────────
  // State conservé tel quel pour ne pas casser le flow Stripe :
  // `setSubscriptionAccess(true)` est appelé après poll réussi
  // sur le retour checkout. Renommé depuis `hasAccess` pour
  // libérer ce label au profit du dérivé (cf. plus bas).
  const [subscriptionAccess, setSubscriptionAccess] = useState(false);

  // ── ACCÈS PROPRIÉTAIRE ─────────────────────────────────────
  // Si user.role === TIPSTER, on fetch son propre profil pour
  // détecter s'il est sur SA page publique. Backend inchangé :
  // /tipsters/me existe déjà, gated TIPSTER via middleware.
  const [ownTipsterId, setOwnTipsterId] = useState<string | null>(null);

  const [fullPronos, setFullPronos] = useState<PronoData[] | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalType, setEmailModalType] = useState<"DAY_PASS" | "MONTHLY">(
    "DAY_PASS",
  );
  const viewTracked = useRef(false);

  // ── hasAccess (DÉRIVÉ, source de vérité UI) ────────────────
  // Étend la V1 : abonnement actif / day-pass OU tipster
  // propriétaire de la page OU admin. Tous les consommateurs en
  // aval (PronoLine, sticky CTA, modale upsell) lisent ce même
  // `hasAccess` — aucune autre modif d'API n'est nécessaire.
  const isAdmin = user?.role === "ADMIN";
  const isOwner = !!user && !!ownTipsterId && ownTipsterId === id;
  const hasAccess = subscriptionAccess || isAdmin || isOwner;

  useEffect(() => {
    if (!id) return;
    apiGet<TipsterProfile>(`/tipsters/${id}`)
      .then(setTipster)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || viewTracked.current) return;
    viewTracked.current = true;
    apiPost(`/tipsters/${id}/view`, {}).catch(() => {});
  }, [id]);

  // Fetch /tipsters/me uniquement si l'user est un TIPSTER.
  // Pour USER/ADMIN, l'endpoint est gated → on skip.
  useEffect(() => {
    if (user?.role !== "TIPSTER") {
      setOwnTipsterId(null);
      return;
    }
    apiGet<OwnTipsterIdentity>("/tipsters/me")
      .then((data) => setOwnTipsterId(data.id))
      .catch(() => setOwnTipsterId(null));
  }, [user]);

  const checkAccess = useCallback(async () => {
    if (!user || !id) return false;
    try {
      const data = await apiPost<{ hasAccess: boolean }>(
        "/subscriptions/check",
        { tipsterId: id },
      );
      setSubscriptionAccess(data.hasAccess);
      return data.hasAccess;
    } catch {
      return false;
    }
  }, [user, id]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (!hasAccess || !id) return;
    apiGet<PronoData[]>(`/tipsters/${id}/pronos`)
      .then(setFullPronos)
      .catch(() => {});
  }, [hasAccess, id]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success" || !id) return;
    const stripeSessionId = searchParams.get("stripe_session_id");

    async function handleCheckoutReturn() {
      if (stripeSessionId) {
        try {
          await apiGet(
            `/auth/session-from-checkout?stripe_session_id=${stripeSessionId}`,
          );
          await refreshUser();
        } catch {
          /* ignore */
        }
      }
      window.history.replaceState({}, "", `/tipsters/${id}`);
      let attempts = 0;
      const maxAttempts = 5;
      async function pollAccess() {
        attempts++;
        try {
          const data = await apiPost<{ hasAccess: boolean }>(
            "/subscriptions/check",
            { tipsterId: id },
          );
          if (data.hasAccess) {
            setSubscriptionAccess(true);
            setShowUpsell(true);
            return;
          }
        } catch {
          /* ignore */
        }
        if (attempts < maxAttempts) setTimeout(pollAccess, 2000);
        else setShowUpsell(true);
      }
      await pollAccess();
    }
    handleCheckoutReturn();
  }, [searchParams, id, refreshUser]);

  async function handleCheckout(type: "DAY_PASS" | "MONTHLY") {
    if (!user) {
      setEmailModalType(type);
      setEmailModalOpen(true);
      return;
    }
    setCheckoutLoading(true);
    try {
      const url = await createCheckoutSession(id, type);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur paiement");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-surface-elevated border-t-accent" />
      </div>
    );
  }

  if (error || !tipster) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-body text-body-16 text-destructive">
          {error || "Expert introuvable"}
        </p>
      </div>
    );
  }

  const dayPrice = formatPrice(tipster.dayPassPrice);
  const monthlyPrice = formatPrice(tipster.monthlyPrice);
  const pronos = fullPronos ?? tipster.pronos;
  const pendingPronos = pronos.filter((p) => p.result === "PENDING");
  const allAnalysesStarted = allStarted(pendingPronos);

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        {/* Container uniformisé 872px (Dashboard / Devenir Expert).
            pb-32 pour libérer la zone du sticky CTA et éviter qu'il
            recouvre la fin de la liste d'analyses. */}
        <div className="mx-auto w-full max-w-[872px] flex-1 px-4 pt-10 pb-32 md:px-6 md:pt-16">
          {/* Bandeau d'avertissement admin — tokens accent doré
              (remplace #00D47E vert V1). */}
          {tipster.warningMessage && (
            <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 font-body text-body-16 text-accent">
              {tipster.warningMessage}
            </div>
          )}

          {/* ═══ BLOC IDENTITÉ ═══
              Card englobante DS : bg-black/40, bordure subtile, radius 16,
              padding 24/32. Layout horizontal desktop, stack vertical mobile. */}
          <section className="rounded-2xl border border-surface-elevated bg-black/40 p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              {/* Avatar 96×96, ring doré subtil (remplace ring off-white V1). */}
              <div className="shrink-0">
                {tipster.photoUrl ? (
                  <Image
                    src={tipster.photoUrl}
                    alt={tipster.pseudo}
                    width={96}
                    height={96}
                    className="size-24 rounded-full object-cover ring-1 ring-accent/40"
                  />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-full bg-surface-elevated font-display text-h2 text-accent ring-1 ring-accent/40">
                    {tipster.pseudo.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Bloc infos. Centré mobile, gauche desktop. */}
              <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
                {/* Pseudo + badge EXPERT (pill doré, remplace le label
                    vert V1). */}
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <h1 className="font-display text-h2 text-foreground">
                    {tipster.pseudo}
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 font-body text-body-16 text-accent">
                    EXPERT
                  </span>
                </div>

                {/* Compteur vues — affiché uniquement si > 0 (V1 inchangé). */}
                {tipster.viewsToday > 0 && (
                  <div className="flex items-center gap-2 font-body text-body-16 text-muted-foreground">
                    <Icon icon="tabler:eye" className="size-4" />
                    <span>{tipster.viewsToday} vues aujourd&apos;hui</span>
                  </div>
                )}

                {/* Bio. */}
                {tipster.bio && (
                  <p className="font-body text-body-16 text-foreground">
                    {tipster.bio}
                  </p>
                )}

                {/* Note du jour (italique V1 retiré — DS golden-da
                    n'utilise pas d'italique en dehors de cas spécifiques). */}
                {tipster.dailyNote && (
                  <p className="font-body text-body-16 text-muted-foreground">
                    {tipster.dailyNote}
                  </p>
                )}

                {/* Sports couverts — chips rounded-full DS (mêmes
                    tokens que /devenir-tipster, état non-actif). */}
                {tipster.sports.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-2 md:justify-start">
                    {tipster.sports.map((sport) => (
                      <span
                        key={sport}
                        className="inline-flex items-center gap-2 rounded-full border border-surface-elevated bg-black/40 px-3 py-1 font-body text-body-16 text-foreground"
                      >
                        <SportIcon
                          sport={sport}
                          className="size-4 text-accent"
                        />
                        {getSportLabel(sport)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ═══ SECTION ANALYSES ═══
              Espacement bloc identité → titre = 48px (mt-12). */}
          {pendingPronos.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-h3 text-foreground">
                {pendingPronos.length === 1
                  ? "Analyse du jour"
                  : `${pendingPronos.length} analyses du jour`}
              </h2>

              {/* Cards séparées avec gap-4 (remplace la card unique
                  V1 avec border-b internes). */}
              <div className="mt-6 flex flex-col gap-4">
                {pendingPronos.map((prono) => (
                  <PronoLine
                    key={prono.id}
                    prono={prono}
                    hasAccess={hasAccess}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ═══ CTA STICKY ═══
            Visible uniquement quand !hasAccess (donc jamais affiché
            au propriétaire ni à l'admin grâce au dérivé étendu).
            Wording "Accéder" remplace "Déverrouiller" (CLAUDE.md §1.1). */}
        {!hasAccess && (
          <div className="sticky bottom-0 z-40 border-t border-surface-elevated bg-black/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-[872px] flex-col items-center gap-2 px-4 py-4 md:px-6">
              {allAnalysesStarted ? (
                <p className="text-center font-body text-body-16 text-muted-foreground">
                  Toutes les analyses du jour sont terminées, reviens demain
                </p>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    disabled={checkoutLoading}
                    onClick={() => handleCheckout("DAY_PASS")}
                    className="w-full"
                  >
                    {checkoutLoading
                      ? "..."
                      : `Accéder aux ${pendingPronos.length} ${
                          pendingPronos.length === 1 ? "analyse" : "analyses"
                        } (${dayPrice}€)`}
                  </Button>
                  <button
                    type="button"
                    disabled={checkoutLoading}
                    onClick={() => handleCheckout("MONTHLY")}
                    className="cursor-pointer font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ou abonnement mensuel {monthlyPrice}€
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ════ MODALES — STYLE V1 INCHANGÉ (Bloc 2) ════ */}

      <EmailCheckoutModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        tipsterId={id}
        type={emailModalType}
      />

      {/* ════ MODALE UPSELL ════
          Post-checkout Stripe : s'ouvre après poll réussi (hasAccess
          true) OU timeout (5×2s). Pas de close par clic overlay
          (V1 conservée) — l'utilisateur doit utiliser le X ou un des
          3 boutons d'action. */}
      {showUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upsell-title"
            className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-surface-elevated bg-background p-8"
          >
            {/* Close X — pattern partagé avec EmailCheckoutModal. */}
            <button
              type="button"
              onClick={() => setShowUpsell(false)}
              aria-label="Fermer"
              className="absolute right-4 top-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            <h3
              id="upsell-title"
              className="text-center font-display text-h4 text-foreground"
            >
              {hasAccess
                ? "Accès débloqué !"
                : "Paiement en cours de traitement…"}
            </h3>
            {/* Spinner doré inline quand on attend la confirmation (poll
                timeout) — feedback visuel que quelque chose progresse. */}
            <p className="mt-2 flex items-center justify-center gap-2 font-body text-body-16 text-muted-foreground">
              {!hasAccess && (
                <span
                  aria-hidden
                  className="size-4 animate-spin rounded-full border-2 border-surface-elevated border-t-accent"
                />
              )}
              <span>
                {hasAccess
                  ? "Envie de découvrir d'autres experts ?"
                  : "Vos sélections seront disponibles dans quelques instants."}
              </span>
            </p>

            <div className="mt-6 space-y-3">
              {/* "Voir tous les experts" — variant secondary DS (bordure
                  dorée transparente). Rendu via Link Next.js. */}
              <Button
                variant="secondary"
                size="lg"
                render={<Link href="/" />}
                className="w-full"
              >
                Voir tous les experts
              </Button>

              {/* "S'abonner" — primary DS doré. Comportement V1 conservé :
                  ferme modale + relance checkout MONTHLY si !hasAccess. */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => {
                  setShowUpsell(false);
                  if (!hasAccess) handleCheckout("MONTHLY");
                }}
                className="w-full"
              >
                S&apos;abonner ({monthlyPrice}€/mois)
              </Button>

              {/* "Fermer" — lien texte muted, pas de variant Button (V1
                  utilisait un simple <button> texte). */}
              <button
                type="button"
                onClick={() => setShowUpsell(false)}
                className="flex h-10 w-full cursor-pointer items-center justify-center font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════ PRONO LINE — card unique par analyse ════════════════ */

function PronoLine({
  prono,
  hasAccess,
}: {
  prono: PronoData;
  hasAccess: boolean;
}) {
  const started = isStarted(prono.startTime);
  const league = prono.league ? getLeague(prono.league) : undefined;
  // Logos qui sortent transparents/noirs sur fond clair en V1 → on
  // applique un `invert` Tailwind pour les rendre lisibles sur fond
  // dark. Liste conservée à l'identique de la V1.
  const INVERT_LOGOS = [
    "ligue-1",
    "la-liga",
    "lol-worlds",
    "premier-league",
    "nhl",
  ];
  const needsInvert = league && INVERT_LOGOS.includes(league.id);

  const teasingLabel = TEASING_LABELS[prono.teasing] || prono.teasing;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-surface-elevated bg-black/40 p-6",
        // Conservation V1 : matchs commencés sans accès sont dimmés.
        started && !hasAccess && "opacity-50",
      )}
    >
      {/* Badge "Analyse du jour" top-right si isFeatured. */}
      {prono.isFeatured && (
        <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-accent/20 px-3 py-1 font-body text-body-16 text-accent">
          Analyse du jour
        </span>
      )}

      {/* Header — logo ligue + match + meta (ligue/heure). */}
      <header className="flex items-start gap-4 pr-32 md:pr-36">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-surface-elevated">
          {league?.logo ? (
            <Image
              src={league.logo}
              width={40}
              height={40}
              alt={league.name}
              className={cn("size-10 object-contain", needsInvert && "invert")}
            />
          ) : (
            <SportIcon
              sport={league?.sport || ""}
              className="size-7 text-muted-foreground"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-body text-h5 text-foreground">
            {prono.matchName}
          </h3>
          <p className="mt-1 font-body text-body-16 text-muted-foreground">
            {league?.name && (
              <>
                <span>{league.name}</span>
                <span className="opacity-40"> · </span>
              </>
            )}
            <span className={cn(started && "text-destructive")}>
              {formatStartTime(prono.startTime)}
            </span>
          </p>
        </div>
      </header>

      {/* Teasing label — visible Locked ET Unlocked (donne le contexte). */}
      <p className="mt-4 font-body text-body-16 text-muted-foreground">
        {teasingLabel}
      </p>

      {/* Body — Pick / Cote / Argument / BookmakerComparator. */}
      {hasAccess ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-body text-body-16 text-muted-foreground">
                Pick
              </p>
              <p className="mt-1 font-body text-body-16 text-foreground">
                {prono.pick || "—"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-body text-body-16 text-muted-foreground">
                Cote
              </p>
              <p className="mt-1 font-body text-h5 text-accent">
                {prono.odds.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
          {prono.argument && (
            <p className="font-body text-body-16 text-foreground leading-relaxed">
              {prono.argument}
            </p>
          )}
          {prono.bookmakerOdds && prono.bookmakerOdds.length > 0 && (
            <BookmakerComparator bookmakerOdds={prono.bookmakerOdds} />
          )}
        </div>
      ) : (
        /* Locked — pick + cote + argument floutés, cadenas accent
           centré par-dessus. select-none + pointer-events-none pour
           bloquer toute interaction / sélection du contenu masqué. */
        <div className="relative mt-4">
          <div
            aria-hidden
            className="pointer-events-none space-y-4 select-none blur-[6px]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-body text-body-16 text-muted-foreground">
                  Pick
                </p>
                <p className="mt-1 font-body text-body-16 text-foreground">
                  ●●●●●●●●●●
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-body text-body-16 text-muted-foreground">
                  Cote
                </p>
                <p className="mt-1 font-body text-h5 text-accent">●,●●</p>
              </div>
            </div>
            <p className="font-body text-body-16 text-foreground leading-relaxed">
              Lorem ipsum dolor sit amet consectetur adipiscing elit sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock
              className="size-8 text-accent"
              aria-label="Contenu verrouillé"
            />
          </div>
        </div>
      )}
    </article>
  );
}

/* ════════════════ BOOKMAKER COMPARATOR ════════════════ */

function BookmakerComparator({
  bookmakerOdds,
}: {
  bookmakerOdds: BookmakerOddsData[];
}) {
  return (
    <div className="rounded-xl border border-surface-elevated bg-black/40 p-4">
      <p className="font-body text-body-16 text-muted-foreground">
        Où consulter cette analyse
      </p>
      <div className="mt-3 space-y-2">
        {bookmakerOdds.map((bo) => {
          const affiliateLink = bo.bookmaker.affiliateLinks[0];
          return (
            <div
              key={bo.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-black/40 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                {bo.bookmaker.logoUrl ? (
                  <Image
                    src={bo.bookmaker.logoUrl}
                    alt={bo.bookmaker.name}
                    width={24}
                    height={24}
                    className="size-6 shrink-0 rounded object-contain"
                  />
                ) : (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded bg-surface-elevated font-body text-body-16 text-foreground">
                    {bo.bookmaker.name.charAt(0)}
                  </div>
                )}
                <span className="font-body text-body-16 text-foreground">
                  {bo.bookmaker.name}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-body text-body-16 text-accent">
                  @{bo.odds.toFixed(2)}
                </span>
                {affiliateLink && (
                  <a
                    href={affiliateLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-white px-3 py-1.5 font-body text-body-16 text-black transition-colors hover:bg-white/90"
                  >
                    {affiliateLink.label || "Accéder"}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
