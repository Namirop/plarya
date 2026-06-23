"use client";

import { useEffect, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { EmailCheckoutModal } from "@/components/checkout/email-checkout-modal";
import { useUser } from "@/hooks/use-user";
import { apiGet, apiPost } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import { allStarted } from "@/lib/date";
import type { PronoData, PublicExpertProfile } from "@/lib/experts";
import { createCheckoutSession } from "@/lib/stripe";

import { AnalysesSection } from "./_components/analyses-section";
import { CheckoutStatusModal } from "./_components/checkout-status-modal";
import { EmailGateModal } from "./_components/email-gate-modal";
import { ExpertIdentityBlock } from "./_components/expert-identity-block";
import { StickyCta } from "./_components/sticky-cta";
import { useCheckoutPolling } from "./_hooks/use-checkout-polling";
import { useEmailGatePolling } from "./_hooks/use-email-gate-polling";
import { useOwnerDetection } from "./_hooks/use-owner-detection";

interface ExpertProfileClientProps {
  initialExpert: PublicExpertProfile;
}

type ResendState = "idle" | "sending" | "sent" | "error";

export function ExpertProfileClient({ initialExpert }: ExpertProfileClientProps) {
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const id = initialExpert.id;

  // Expert rendu server-side (page.tsx) puis passé en initialExpert →
  // pas de fetch initial client, pas de spinner au mount.
  const [expert] = useState<PublicExpertProfile>(initialExpert);
  const [error, setError] = useState("");

  // Accès payant (source de vérité après /subscriptions/check ou poll).
  const [subscriptionAccess, setSubscriptionAccess] = useState(false);
  const [fullPronos, setFullPronos] = useState<PronoData[] | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Retour Stripe — user loggé : upsell + poll /subscriptions/check.
  const [showUpsell, setShowUpsell] = useState(false);
  const [checkoutPolling, setCheckoutPolling] = useState(false);
  // Conservé pour /auth/resend-access-unlocked depuis la modale failed
  // (l'URL `?stripe_session_id=` est purgée juste après l'arrivée).
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [retryResendState, setRetryResendState] = useState<ResendState>("idle");

  // Retour Stripe — user non loggé : email-gate + poll check-stripe-session.
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailGatePolling, setEmailGatePolling] = useState(false);
  const [emailGateSessionId, setEmailGateSessionId] = useState<string | null>(null);
  const [resendState, setResendState] = useState<ResendState>("idle");

  // Modale email (checkout anonyme : saisie email → Stripe).
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalType, setEmailModalType] = useState<"DAY_PASS" | "MONTHLY">("DAY_PASS");

  const viewTracked = useRef(false);

  // ── Hooks extraits (polling + owner detection, avec AbortController) ──
  const isOwner = useOwnerDetection(user, id);
  const { status: checkoutStatus, retry: retryCheckout } = useCheckoutPolling({
    enabled: checkoutPolling,
    expertId: id,
    onSuccess: () => setSubscriptionAccess(true),
  });
  const { status: emailGateStatus, retry: retryEmailGate } = useEmailGatePolling({
    enabled: emailGatePolling,
    sessionId: emailGateSessionId,
  });

  // ── hasAccess (DÉRIVÉ, source de vérité UI) ──
  const isAdmin = user?.role === "ADMIN";
  const hasAccess = subscriptionAccess || isAdmin || isOwner;

  // Track view (fire-and-forget, une fois par mount).
  useEffect(() => {
    if (!id || viewTracked.current) return;
    viewTracked.current = true;
    const controller = new AbortController();
    apiPost(`/experts/${id}/view`, {}, { signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [id]);

  // Check d'accès initial au mount (subscriber qui revient).
  useEffect(() => {
    if (!user || !id) return;
    const controller = new AbortController();
    apiPost<{ hasAccess: boolean }>("/subscriptions/check", { expertId: id }, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setSubscriptionAccess(data.hasAccess);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [user, id]);

  // Fetch des pronos complets (pick visible) dès qu'on a accès.
  useEffect(() => {
    if (!hasAccess || !id) return;
    const controller = new AbortController();
    apiGet<PronoData[]>(`/experts/${id}/pronos`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setFullPronos(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [hasAccess, id]);

  // Orchestration du retour Stripe Checkout (?checkout=success).
  useEffect(() => {
    if (searchParams.get("checkout") !== "success" || !id) return;
    // GUARD : tant que useUser n'a pas résolu la session, `user` vaut
    // null → la branche "non loggé" matcherait à tort pour un user loggé
    // pendant les 50-200 ms d'hydratation.
    if (userLoading) return;

    const stripeSessionId = searchParams.get("stripe_session_id");
    setCheckoutSessionId(stripeSessionId);
    window.history.replaceState({}, "", `/experts/${id}`);

    if (!user) {
      setEmailGateSessionId(stripeSessionId);
      setShowEmailGate(true);
      setEmailGatePolling(true);
      return;
    }

    setShowUpsell(true);
    setCheckoutPolling(true);
  }, [searchParams, id, user, userLoading]);

  async function handleResendEmail() {
    if (!emailGateSessionId || resendState !== "idle") return;
    setResendState("sending");
    try {
      await apiPost("/auth/resend-access-unlocked", { stripeSessionId: emailGateSessionId });
      setResendState("sent");
      setTimeout(() => setResendState("idle"), 3000);
    } catch {
      setResendState("error");
      setTimeout(() => setResendState("idle"), 5000);
    }
  }

  // Renvoi d'email depuis la modale upsell "failed" (user loggé) —
  // distinct de handleResendEmail (flow email-gate non-loggé).
  async function handleRetryResend() {
    if (!checkoutSessionId || retryResendState !== "idle") return;
    setRetryResendState("sending");
    try {
      await apiPost("/auth/resend-access-unlocked", { stripeSessionId: checkoutSessionId });
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
  const isPendingDeletion = !!expert.pendingDeletion;

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        {/* Container 960px. pb-32 pour libérer la zone du sticky CTA. */}
        <div className="mx-auto w-full max-w-[960px] flex-1 px-4 pt-10 pb-32 md:px-6 md:pt-16">
          <ExpertIdentityBlock expert={expert} />
          <AnalysesSection pronos={pendingPronos} hasAccess={hasAccess} />
        </div>

        <StickyCta
          hasAccess={hasAccess}
          isPendingDeletion={isPendingDeletion}
          allAnalysesStarted={allAnalysesStarted}
          pendingPronosCount={pendingPronos.length}
          dayPrice={dayPrice}
          monthlyPrice={monthlyPrice}
          checkoutLoading={checkoutLoading}
          onCheckout={handleCheckout}
        />
      </div>

      {/* ════ MODALES ════ */}

      <EmailCheckoutModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        expertId={id}
        type={emailModalType}
      />

      <EmailGateModal
        open={showEmailGate}
        status={emailGateStatus}
        sessionId={emailGateSessionId}
        resendState={resendState}
        onResend={handleResendEmail}
        onRetry={retryEmailGate}
      />

      <CheckoutStatusModal
        open={showUpsell}
        status={checkoutStatus}
        hasAccess={hasAccess}
        monthlyPrice={monthlyPrice}
        sessionId={checkoutSessionId}
        retryResendState={retryResendState}
        onClose={() => setShowUpsell(false)}
        onRetry={retryCheckout}
        onResend={handleRetryResend}
        onSubscribe={() => {
          setShowUpsell(false);
          if (!hasAccess) handleCheckout("MONTHLY");
        }}
      />
    </>
  );
}
