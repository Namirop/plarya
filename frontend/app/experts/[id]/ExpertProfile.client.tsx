"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CheckCircle, X, Eye } from "@phosphor-icons/react";

import { AnalysisCardTicket } from "@/components/analyses/analysis-card-ticket";
import { EmailCheckoutModal } from "@/components/checkout/email-checkout-modal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { apiGet, apiPost } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import { allStarted } from "@/lib/date";
import type { ExpertProfile, PronoData } from "@/lib/experts";
import { getSportLabel } from "@/lib/sports";
import { createCheckoutSession } from "@/lib/stripe";
import { cn } from "@/lib/utils";

// Shape minimale de /experts/me utilisée uniquement pour détecter si
// l'expert connecté est sur SA propre page publique (bypass paywall).
interface OwnExpertIdentity {
  id: string;
}

interface ExpertProfileClientProps {
  initialExpert: ExpertProfile;
}

export function ExpertProfileClient({ initialExpert }: ExpertProfileClientProps) {
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const id = initialExpert.id;

  // L'expert est rendu en server-side dans page.tsx puis passé en
  // initialExpert. Pas de fetch initial côté client → pas de spinner
  // au mount, pas de waterfall request HTML→hydratation→fetch.
  // Le state reste pour permettre le refresh client si besoin (ex :
  // vue counter qui pourrait s'incrémenter, mais ici on garde la
  // valeur server initiale — pas d'invalidation auto côté client).
  const [expert] = useState<ExpertProfile>(initialExpert);
  const [error, setError] = useState("");

  // ── ACCÈS PAYANT ────────────────────────────────────────────
  const [subscriptionAccess, setSubscriptionAccess] = useState(false);

  // ── ACCÈS PROPRIÉTAIRE ─────────────────────────────────────
  const [ownExpertId, setOwnExpertId] = useState<string | null>(null);

  const [fullPronos, setFullPronos] = useState<PronoData[] | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  // État du retour Stripe Checkout :
  //  - "polling"  : on attend que le webhook crée la Subscription
  //                 (poll /subscriptions/check max 15×, 2s entre essais
  //                 = 30s, voir pollCheckoutAccess pour le rationnel)
  //  - "success"  : hasAccess = true, on affiche l'upsell classique
  //  - "failed"   : 30s écoulés sans webhook, on bascule en modal
  //                 d'erreur ("Paiement non confirmé") avec actions
  //                 Réessayer + Renvoyer le lien.
  // null = pas dans un retour de checkout (state initial).
  const [checkoutState, setCheckoutState] = useState<"polling" | "success" | "failed" | null>(null);
  // Conservé pour pouvoir appeler /auth/resend-access-unlocked depuis
  // la modal "failed" (l'URL `?stripe_session_id=` est purgée juste
  // après l'arrivée sur la page).
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  // État de l'email-gate (flow non-loggé après Stripe). Tant que le
  // webhook n'a pas créé la Subscription, on n'a pas d'email envoyé
  // automatiquement — donc l'ancien message "Paiement confirmé, ouvre
  // ton email" était mensonger en cas de webhook down (dev sans
  // `stripe listen`).
  //  - "polling" : on poll /subscriptions/check-stripe-session
  //  - "ready"   : sub trouvée → on peut affirmer "Paiement confirmé"
  //  - "failed"  : 10s sans confirmation → modal d'erreur
  const [emailGateState, setEmailGateState] = useState<"polling" | "ready" | "failed">("polling");
  const [emailGateSessionId, setEmailGateSessionId] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Resend dédié à la modal "Paiement non confirmé" (user loggé) —
  // distinct de resendState (qui sert l'email-gate non-loggé) car les
  // deux modales peuvent théoriquement coexister suivant le timing.
  const [retryResendState, setRetryResendState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalType, setEmailModalType] = useState<"DAY_PASS" | "MONTHLY">("DAY_PASS");
  const viewTracked = useRef(false);

  // ── hasAccess (DÉRIVÉ, source de vérité UI) ────────────────
  const isAdmin = user?.role === "ADMIN";
  const isOwner = !!user && !!ownExpertId && ownExpertId === id;
  const hasAccess = subscriptionAccess || isAdmin || isOwner;

  useEffect(() => {
    if (!id || viewTracked.current) return;
    viewTracked.current = true;
    apiPost(`/experts/${id}/view`, {}).catch(() => {});
  }, [id]);

  // Fetch /experts/me uniquement si l'user est un EXPERT.
  // Pour USER/ADMIN, l'endpoint est gated → on skip.
  useEffect(() => {
    if (user?.role !== "EXPERT") {
      setOwnExpertId(null);
      return;
    }
    apiGet<OwnExpertIdentity>("/experts/me")
      .then((data) => setOwnExpertId(data.id))
      .catch(() => setOwnExpertId(null));
  }, [user]);

  const checkAccess = useCallback(async () => {
    if (!user || !id) return false;
    try {
      const data = await apiPost<{ hasAccess: boolean }>("/subscriptions/check", { expertId: id });
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
    apiGet<PronoData[]>(`/experts/${id}/pronos`)
      .then(setFullPronos)
      .catch(() => {});
  }, [hasAccess, id]);

  // Poll /subscriptions/check-stripe-session pour le flow email-gate
  // (user non loggé). Renvoie ready=true dès qu'une Subscription
  // existe pour ce sessionId (= webhook traité).
  //
  // Durée totale : 15 × 2s = 30s. En dev avec `stripe listen`, la
  // chaîne Stripe → CLI → backend peut prendre 10-20s avant que
  // checkout.session.completed soit livré, donc 30s est un minimum
  // pour ne pas bascule trop tôt en "failed". En prod le webhook
  // est typiquement <500ms → on le détecte au 1er essai.
  const pollEmailGateReady = useCallback(async (sessionId: string) => {
    setEmailGateState("polling");
    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const data = await apiGet<{ ready: boolean }>(
          `/subscriptions/check-stripe-session?stripe_session_id=${encodeURIComponent(sessionId)}`,
        );
        if (data.ready) {
          setEmailGateState("ready");
          return;
        }
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setEmailGateState("failed");
  }, []);

  // Boucle de poll sur /subscriptions/check après un retour Stripe.
  // Extraite en fonction pour pouvoir être ré-appelée depuis le bouton
  // "Réessayer" de la modal d'erreur.
  const pollCheckoutAccess = useCallback(async () => {
    if (!id) return;
    setCheckoutState("polling");
    setShowUpsell(true);
    // Cf. pollEmailGateReady — 30s totaux pour couvrir le pire cas
    // dev (`stripe listen` qui peut prendre 10-20s à relayer le
    // webhook). En prod, webhook quasi-instantané.
    const maxAttempts = 15;
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      try {
        const data = await apiPost<{ hasAccess: boolean }>("/subscriptions/check", {
          expertId: id,
        });
        if (data.hasAccess) {
          setSubscriptionAccess(true);
          setCheckoutState("success");
          return;
        }
      } catch {
        /* ignore — on retentera */
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    // 10s sans webhook → on n'attend plus, on bascule l'UI en mode
    // erreur. L'user pourra Réessayer (re-poll) ou demander un renvoi.
    setCheckoutState("failed");
  }, [id]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success" || !id) return;
    // GUARD : tant que useUser n'a pas fini de résoudre la session,
    // `user` vaut null par défaut → la branche "non loggé" matchait
    // à tort pour un user loggé pendant les 50-200 ms d'hydratation.
    if (userLoading) return;

    const stripeSessionId = searchParams.get("stripe_session_id");
    setCheckoutSessionId(stripeSessionId);
    window.history.replaceState({}, "", `/experts/${id}`);

    if (!user) {
      setEmailGateSessionId(stripeSessionId);
      setShowEmailGate(true);
      if (stripeSessionId) {
        pollEmailGateReady(stripeSessionId);
      } else {
        // Pas de sessionId dans l'URL (cas tordu — Stripe redirect
        // manipulé). On affiche directement l'état failed.
        setEmailGateState("failed");
      }
      return;
    }

    pollCheckoutAccess();
  }, [searchParams, id, user, userLoading, pollCheckoutAccess, pollEmailGateReady]);

  async function handleResendEmail() {
    if (!emailGateSessionId || resendState !== "idle") return;
    setResendState("sending");
    try {
      await apiPost("/auth/resend-access-unlocked", {
        stripeSessionId: emailGateSessionId,
      });
      setResendState("sent");
      setTimeout(() => setResendState("idle"), 3000);
    } catch {
      setResendState("error");
      setTimeout(() => setResendState("idle"), 5000);
    }
  }

  // Pendant Upsell état "failed" : permet à l'user de se faire renvoyer
  // l'email de confirmation (qui contient un magic-link). Distinct de
  // handleResendEmail qui est réservé au flow email-gate non-loggé.
  async function handleRetryResend() {
    if (!checkoutSessionId || retryResendState !== "idle") return;
    setRetryResendState("sending");
    try {
      await apiPost("/auth/resend-access-unlocked", {
        stripeSessionId: checkoutSessionId,
      });
      setRetryResendState("sent");
      setTimeout(() => setRetryResendState("idle"), 5000);
    } catch {
      setRetryResendState("error");
      setTimeout(() => setRetryResendState("idle"), 5000);
    }
  }

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

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-body text-body-16 text-destructive">{error}</p>
      </div>
    );
  }

  const dayPrice = formatPrice(expert.dayPassPrice);
  const monthlyPrice = formatPrice(expert.monthlyPrice);
  const pronos = fullPronos ?? expert.pronos;
  const pendingPronos = pronos.filter((p) => p.result === "PENDING");
  const allAnalysesStarted = allStarted(pendingPronos);
  // Expert qui a programmé la suppression de son compte : les
  // nouveaux paiements sont refusés côté backend. On désactive les
  // CTAs sticky et on affiche un banner explicite. Les abonnés
  // existants gardent leur accès (hasAccess reste true via
  // /subscriptions/check).
  const isPendingDeletion = !!expert.pendingDeletion;

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        {/* Container uniformisé 872px (Dashboard / Devenir Expert).
            pb-32 pour libérer la zone du sticky CTA et éviter qu'il
            recouvre la fin de la liste d'analyses. */}
        <div className="mx-auto w-full max-w-[960px] flex-1 px-4 pt-10 pb-32 md:px-6 md:pt-16">
          {/* Bandeau d'avertissement admin — neutre (anciennement
              doré, neutralisé : la règle /experts/[id] réserve
              le doré au badge EXPERT, badge featured, cote featured
              et CTA primary). Le warning reste visible via la bordure
              + le fond surface-elevated subtil. */}
          {expert.warningMessage && (
            <div className="mb-6 rounded-xl border border-surface-elevated bg-white/[0.03] px-4 py-3 font-body text-body-16 text-foreground">
              {expert.warningMessage}
            </div>
          )}

          {/* Bandeau "suppression programmée" : seuls les abonnés
              existants doivent encore voir ce profil. On reste
              transparent pour qu'ils sachent que l'expert quitte la
              plateforme. */}
          {isPendingDeletion && (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-body-16 text-destructive">
              Cet expert ne prend plus de nouveaux abonnés et quittera bientôt la plateforme. Ton
              accès actuel reste valide jusqu&apos;à l&apos;expiration de ton abonnement.
            </div>
          )}

          {/* ═══ BLOC IDENTITÉ ═══
              Card englobante DS : bg-black/40, bordure subtile, radius 16,
              padding 24/32. Layout horizontal desktop, stack vertical mobile.
              Pas de glow décoratif (aucun halo de fond sur élément
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

                {expert.bio && (
                  <p className="font-body text-body-16 text-foreground">{expert.bio}</p>
                )}

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

          {/* ═══ SECTION ANALYSES ═══ */}
          {pendingPronos.length > 0 && (
            <section className="mt-12">
              {/* Titre fort en display (Hubot Sans) — porte la page, le
                  reste de la hiérarchie suit la card-ticket. */}
              <h2 className="mb-8 font-display text-3xl font-normal text-foreground md:text-5xl">
                {pendingPronos.length === 1
                  ? "Analyses du jour"
                  : `${pendingPronos.length} analyses du jour`}
              </h2>

              <div className="flex flex-col gap-8">
                {pendingPronos.map((prono) => (
                  <AnalysisCardTicket key={prono.id} analysis={prono} hasAccess={hasAccess} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ═══ CTA STICKY ═══ */}
        {!hasAccess && (
          <div className="sticky bottom-0 z-40 border-t border-surface-elevated bg-black/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-[960px] flex-col items-center gap-2 px-4 py-4 md:px-6">
              {isPendingDeletion ? (
                <p className="text-center font-body text-body-16 text-muted-foreground">
                  Cet expert ne prend plus de nouveaux abonnés.
                </p>
              ) : allAnalysesStarted ? (
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

      {/* ════ MODALES ════ */}

      <EmailCheckoutModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        expertId={id}
        type={emailModalType}
      />

      {/* ════ MODALE "EMAIL GATE" ════
          Flow non-loggé après Stripe Checkout. 3 états :
            - polling : on attend la confirmation du webhook (spinner)
            - ready   : webhook reçu → "Paiement confirmé, ouvre ton email"
            - failed  : 10s sans webhook → modal d'erreur (idem
                        UpsellModal failed mais sans bouton Réessayer
                        au sens "re-déclencher l'access" — ici on
                        propose surtout "Renvoyer le lien" + Contact). */}
      {showEmailGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-gate-title"
            className={cn(
              "relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border bg-background p-8",
              emailGateState === "failed" ? "border-destructive/40" : "border-surface-elevated",
            )}
          >
            {emailGateState === "polling" && (
              <>
                <div className="flex justify-center">
                  <span
                    aria-hidden
                    className="size-12 animate-spin rounded-full border-4 border-surface-elevated border-t-accent"
                  />
                </div>
                <h2
                  id="email-gate-title"
                  className="mt-4 text-center font-body text-[22px] font-bold text-foreground md:text-h4"
                >
                  Vérification du paiement…
                </h2>
                <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
                  Stripe nous confirme ton paiement. Cela prend quelques secondes.
                </p>
              </>
            )}

            {emailGateState === "ready" && (
              <>
                <div className="flex justify-center">
                  <CheckCircle className="size-12 text-foreground" aria-hidden />
                </div>
                <h2
                  id="email-gate-title"
                  className="mt-4 text-center font-body text-[22px] font-bold text-foreground md:text-h4"
                >
                  Paiement confirmé
                </h2>
                <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
                  Pour accéder à tes analyses, ouvre l&apos;email que nous venons de t&apos;envoyer
                  et clique sur le lien de connexion.
                </p>
                <p className="mt-2 text-center font-body text-body-16 text-muted-foreground/70">
                  Pense à vérifier tes spams si tu ne le trouves pas.
                </p>
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    size="lg"
                    render={<Link href="/" />}
                    className="w-full"
                  >
                    Retourner à l&apos;accueil
                  </Button>

                  {emailGateSessionId && (
                    <div className="mt-4 text-center">
                      <p className="font-body text-body-16 text-muted-foreground/70">
                        Tu n&apos;as pas reçu l&apos;email ?
                      </p>
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={resendState !== "idle"}
                        className="mt-1 cursor-pointer font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {resendState === "sending" && "Envoi en cours…"}
                        {resendState === "sent" && "Email renvoyé !"}
                        {resendState === "error" && "Erreur, contacte-nous"}
                        {resendState === "idle" && "Renvoyer le lien"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {emailGateState === "failed" && (
              <>
                <h2
                  id="email-gate-title"
                  className="text-center font-body text-[22px] font-bold text-destructive md:text-h4"
                >
                  Paiement non confirmé
                </h2>
                <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
                  Nous n&apos;avons pas reçu la confirmation de Stripe dans les délais habituels. Si
                  tu as été débité, ton accès te sera envoyé par email dès que la confirmation
                  arrive.
                </p>
                <div className="mt-6 space-y-3">
                  {emailGateSessionId && (
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={() => emailGateSessionId && pollEmailGateReady(emailGateSessionId)}
                      className="w-full"
                    >
                      Réessayer
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    render={<Link href="/contact" />}
                    className="w-full"
                  >
                    Contacter le support
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    render={<Link href="/" />}
                    className="w-full"
                  >
                    Retourner à l&apos;accueil
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════ MODALE UPSELL / STATUT CHECKOUT ════
          3 états :
            - polling : paiement reçu, on attend que le webhook crée
              la Subscription (spinner).
            - success : hasAccess true, on propose l'upsell mensuel.
            - failed  : 10s écoulés sans webhook → message d'erreur
              clair + actions Réessayer / Renvoyer l'email / Contact. */}
      {showUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upsell-title"
            className={cn(
              "relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border bg-background p-8",
              checkoutState === "failed" ? "border-destructive/40" : "border-surface-elevated",
            )}
          >
            <button
              type="button"
              onClick={() => setShowUpsell(false)}
              aria-label="Fermer"
              className="absolute right-4 top-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            {checkoutState === "failed" ? (
              <>
                <h2
                  id="upsell-title"
                  className="text-center font-body text-[22px] font-bold text-destructive md:text-h4"
                >
                  Paiement non confirmé
                </h2>
                <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
                  Nous n&apos;avons pas reçu la confirmation de Stripe dans les délais habituels. Si
                  tu as été débité, ton accès sera ajouté automatiquement dès que la confirmation
                  arrive.
                </p>
                <p className="mt-2 text-center font-body text-body-16 text-muted-foreground/70">
                  Tu peux réessayer la vérification ou demander un nouvel email de confirmation.
                </p>

                <div className="mt-6 space-y-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={pollCheckoutAccess}
                    className="w-full"
                  >
                    Réessayer
                  </Button>

                  {checkoutSessionId && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={handleRetryResend}
                      disabled={retryResendState !== "idle"}
                      className="w-full"
                    >
                      {retryResendState === "sending" && "Envoi en cours…"}
                      {retryResendState === "sent" && "Email renvoyé !"}
                      {retryResendState === "error" && "Erreur, réessaie"}
                      {retryResendState === "idle" && "Renvoyer l'email"}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    render={<Link href="/contact" />}
                    className="w-full"
                  >
                    Contacter le support
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowUpsell(false)}
                    className="flex h-10 w-full cursor-pointer items-center justify-center font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Fermer
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2
                  id="upsell-title"
                  className="text-center font-body text-[22px] font-bold text-foreground md:text-h4"
                >
                  {checkoutState === "success" || hasAccess
                    ? "Accès débloqué !"
                    : "Paiement en cours de traitement…"}
                </h2>
                <p className="mt-2 flex items-center justify-center gap-2 font-body text-body-16 text-muted-foreground">
                  {checkoutState === "polling" && !hasAccess && (
                    <span
                      aria-hidden
                      className="size-4 animate-spin rounded-full border-2 border-surface-elevated border-t-accent"
                    />
                  )}
                  <span>
                    {checkoutState === "success" || hasAccess
                      ? "Envie de découvrir d'autres experts ?"
                      : "Vos sélections seront disponibles dans quelques instants."}
                  </span>
                </p>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    render={<Link href="/" />}
                    className="w-full"
                  >
                    Voir tous les experts
                  </Button>

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

                  <button
                    type="button"
                    onClick={() => setShowUpsell(false)}
                    className="flex h-10 w-full cursor-pointer items-center justify-center font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
