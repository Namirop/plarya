"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/hooks/use-user";
import { apiGet, apiPost } from "@/lib/api";
import { createCheckoutSession } from "@/lib/stripe";
import { TEASING_LABELS, formatPrice } from "@/lib/constants";
import { getSportLabel } from "@/lib/sports";
import { Lock, Star } from "lucide-react";
import { Icon } from "@iconify/react";
import { formatStartTime, isStarted, allStarted } from "@/lib/date";
import { getLeague } from "@/lib/sports";
import { SportIcon } from "@/lib/sports-icons";
import { EmailCheckoutModal } from "@/components/checkout/email-checkout-modal";

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

export default function TipsterProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const id = params.id as string;

  const [tipster, setTipster] = useState<TipsterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [fullPronos, setFullPronos] = useState<PronoData[] | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalType, setEmailModalType] = useState<"DAY_PASS" | "MONTHLY">(
    "DAY_PASS",
  );
  const viewTracked = useRef(false);

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

  const checkAccess = useCallback(async () => {
    if (!user || !id) return false;
    try {
      const data = await apiPost<{ hasAccess: boolean }>(
        "/subscriptions/check",
        { tipsterId: id },
      );
      setHasAccess(data.hasAccess);
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
            setHasAccess(true);
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
        <div className="size-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-[#00D47E]" />
      </div>
    );
  }

  if (error || !tipster) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-red-400">{error || "Expert introuvable"}</p>
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
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
          {/* Warning */}
          {tipster.warningMessage && (
            <div className="mb-6 rounded-md ring-1 ring-[#00D47E]/30 bg-[#00D47E]/5 px-4 py-3 text-sm text-[#00D47E]">
              {tipster.warningMessage}
            </div>
          )}

          {/* ═══ PROFILE HEADER ═══ */}
          <div className="relative rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] pt-14 pb-8 px-6 sm:px-10">
            {/* Photo — overlapping top */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-[35px]">
              {tipster.photoUrl ? (
                <Image
                  src={tipster.photoUrl}
                  alt={tipster.pseudo}
                  width={140}
                  height={140}
                  className="size-[140px] rounded-full object-cover ring-2 ring-[#F0EDE8]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
                />
              ) : (
                <div className="flex size-[140px] items-center justify-center rounded-full bg-[#141414] text-5xl font-bold text-[#F0EDE8] ring-2 ring-[#F0EDE8]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
                  {tipster.pseudo.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="h-[70px]" />

            {/* Pseudo */}
            <h1 className="text-center font-[family-name:var(--font-dm-serif)] text-5xl font-normal sm:text-6xl italic pb-2 text-[#F0EDE8]">
              {tipster.pseudo}
            </h1>

            {/* Badge EXPERT */}
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#00D47E]/40" />
                <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00D47E]">
                  Expert
                </span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#00D47E]/40" />
              </div>
            </div>

            {/* Views */}
            {tipster.viewsToday > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8A8680]">
                <Icon icon="tabler:eye" className="size-4" />
                <span>{tipster.viewsToday} vues</span>
              </div>
            )}

            {/* Bio */}
            {tipster.bio && (
              <p className="mt-5 text-center text-base text-[#8A8680] leading-relaxed">
                {tipster.bio}
              </p>
            )}

            {/* Daily note */}
            {tipster.dailyNote && (
              <p className="mt-2 text-center text-base text-[#F0EDE8]/50 italic">
                {tipster.dailyNote}
              </p>
            )}

            {/* Sports */}
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {tipster.sports.map((sport) => (
                <span
                  key={sport}
                  className="inline-flex items-center gap-2 rounded-md bg-[#141414] px-3.5 py-1.5 text-sm text-[#8A8680]"
                >
                  <SportIcon
                    sport={sport}
                    className="size-4.5 text-[#8A8680]"
                  />
                  {getSportLabel(sport)}
                </span>
              ))}
            </div>
          </div>

          {/* ═══ SECTION TITLE ═══ */}
          {pendingPronos.length > 0 && (
            <>
              <div className="flex items-center gap-4 py-10">
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1A1A1A] to-[#2A2A2A]" />
                  <div className="mx-3 flex items-center gap-[6px]">
                    <div className="w-8 sm:w-12 h-px bg-gradient-to-r from-transparent to-[#00D47E]/50" />
                    <div className="w-[6px] h-[6px] rounded-full bg-[#00D47E]/70 shadow-[0_0_12px_rgba(0,212,126,0.4)]" />
                  </div>
                </div>
                <h2 className="whitespace-nowrap font-[family-name:var(--font-dm-serif)] text-xl italic text-[#F0EDE8] md:text-2xl">
                  {pendingPronos.length}&nbsp;
                  {pendingPronos.length === 1 ? "sélection" : "sélections"}
                  &nbsp;aujourd&apos;hui
                </h2>
                <div className="flex-1 flex items-center">
                  <div className="mx-3 flex items-center gap-[6px]">
                    <div className="w-[6px] h-[6px] rounded-full bg-[#00D47E]/70 shadow-[0_0_12px_rgba(0,212,126,0.4)]" />
                    <div className="w-8 sm:w-12 h-px bg-gradient-to-l from-transparent to-[#00D47E]/50" />
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#1A1A1A] to-[#2A2A2A]" />
                </div>
              </div>

              {/* ═══ ANALYSES CARD ═══ */}
              <div className="rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] overflow-hidden">
                {pendingPronos.map((prono, idx) => (
                  <PronoLine
                    key={prono.id}
                    prono={prono}
                    hasAccess={hasAccess}
                    isLast={idx === pendingPronos.length - 1}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ═══ CTA STICKY ═══ */}
        {!hasAccess && (
          <div className="sticky bottom-0 z-40 bg-[#080808]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-1.5 px-6 py-4">
              {allAnalysesStarted ? (
                <p className="text-center text-sm text-[#8A8680]">
                  Toutes les analyses du jour sont terminées, reviens demain
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={checkoutLoading}
                    onClick={() => handleCheckout("DAY_PASS")}
                    className="w-full rounded-md bg-[#00D47E] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-[#080808] transition-all hover:bg-[#00F590] disabled:opacity-50 cursor-pointer md:text-base"
                  >
                    {checkoutLoading
                      ? "..."
                      : `Déverrouiller les ${pendingPronos.length} sélections (${dayPrice}€)`}
                  </button>
                  <button
                    type="button"
                    disabled={checkoutLoading}
                    onClick={() => handleCheckout("MONTHLY")}
                    className="text-xs text-[#8A8680] hover:text-[#F0EDE8] transition-colors cursor-pointer"
                  >
                    ou abonnement mensuel {monthlyPrice}€
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Email checkout modal */}
      <EmailCheckoutModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        tipsterId={id}
        type={emailModalType}
      />

      {/* Upsell modal */}
      {showUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-6">
            <h3 className="text-lg font-bold text-[#F0EDE8] text-center">
              {hasAccess
                ? "Accès débloqué !"
                : "Paiement en cours de traitement..."}
            </h3>
            <p className="mt-2 text-sm text-[#8A8680] text-center">
              {hasAccess
                ? "Envie de découvrir d'autres experts ?"
                : "Vos sélections seront disponibles dans quelques instants."}
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/"
                className="flex h-10 w-full items-center justify-center rounded-md ring-1 ring-[#1A1A1A] text-sm font-medium text-[#8A8680] hover:text-[#F0EDE8] hover:ring-[#8A8680]/30 transition-all"
              >
                Voir tous les experts
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowUpsell(false);
                  if (!hasAccess) handleCheckout("MONTHLY");
                }}
                className="flex h-10 w-full items-center justify-center rounded-md bg-[#F0EDE8] text-sm font-bold text-[#080808] hover:bg-[#00D47E] transition-all cursor-pointer"
              >
                S&apos;abonner ({monthlyPrice}€/mois)
              </button>
              <button
                type="button"
                onClick={() => setShowUpsell(false)}
                className="flex h-10 w-full items-center justify-center text-sm text-[#8A8680] hover:text-[#F0EDE8] transition cursor-pointer"
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

/* ═══ PRONO LINE ═══ */

function PronoLine({
  prono,
  hasAccess,
  isLast,
}: {
  prono: PronoData;
  hasAccess: boolean;
  isLast: boolean;
}) {
  const started = isStarted(prono.startTime);
  const league = prono.league ? getLeague(prono.league) : undefined;
  const INVERT_LOGOS = [
    "ligue-1",
    "la-liga",
    "lol-worlds",
    "premier-league",
    "nhl",
  ];
  const needsInvert = league && INVERT_LOGOS.includes(league.id);

  return (
    <div
      className={`relative px-6 py-5 sm:px-8 ${!isLast ? "border-b border-[#1A1A1A]" : ""} ${started && !hasAccess ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-4 sm:gap-8">
        {/* Left — League logo */}
        <div className="flex shrink-0 flex-col items-center w-20 sm:w-16">
          {league?.logo ? (
            <div className="flex items-center justify-center size-16">
              <Image
                src={league.logo}
                width={48}
                height={48}
                alt={league.name}
                className={`object-contain ${needsInvert ? "invert" : ""}`}
              />
            </div>
          ) : (
            <div className="flex size-12 items-center justify-center rounded bg-[#141414] ring-1 ring-[#1A1A1A]">
              <SportIcon
                sport={league?.sport || ""}
                className="size-6 text-[#8A8680]"
              />
            </div>
          )}
        </div>

        {/* Center — Match info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-lg font-bold text-[#F0EDE8] md:text-xl leading-tight truncate flex items-center gap-3">
            {prono.matchName}
            {prono.isFeatured && (
              <Star className="size-4 text-[#00D47E] fill-[#00D47E] shrink-0" />
            )}
          </p>
          <p className="text-sm text-[#8A8680] truncate">
            {TEASING_LABELS[prono.teasing] || prono.teasing}
            <span className="text-[#8A8680]/40"> · </span>
            <span
              className={
                started ? "text-red-400 font-medium" : "text-[#8A8680]/60"
              }
            >
              {formatStartTime(prono.startTime)}
            </span>
          </p>

          {/* Pick — blurred or revealed */}
          {hasAccess && prono.pick ? (
            <div>
              <p className="text-sm font-bold text-[#F0EDE8]">{prono.pick}</p>
              {prono.argument && (
                <p className="mt-1 text-xs text-[#8A8680] leading-relaxed">
                  {prono.argument}
                </p>
              )}
              {prono.bookmakerOdds && prono.bookmakerOdds.length > 0 && (
                <BookmakerComparator bookmakerOdds={prono.bookmakerOdds} />
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-0 relative">
              <span
                className="select-none blur-sm pointer-events-none text-sm text-[#8A8680]"
                aria-hidden
              >
                Prédiction verrouillée
              </span>
              <Lock className="size-4 text-[#8A8680]/60 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {/* Right — Odds */}
        <div className="flex shrink-0 items-baseline gap-2 text-right">
          <span className="text-xs text-[#8A8680]/60 uppercase">Cote:</span>
          <span className="text-3xl font-bold text-[#F0EDE8] md:text-4xl">
            {prono.odds.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══ BOOKMAKER COMPARATOR ═══ */

function BookmakerComparator({
  bookmakerOdds,
}: {
  bookmakerOdds: BookmakerOddsData[];
}) {
  return (
    <div className="mt-3 rounded-md bg-[#141414] ring-1 ring-[#1A1A1A] p-3">
      <p className="text-xs font-medium text-[#8A8680] uppercase tracking-wide mb-2">
        Où consulter cette analyse
      </p>
      <div className="space-y-2">
        {bookmakerOdds.map((bo) => {
          const affiliateLink = bo.bookmaker.affiliateLinks[0];
          return (
            <div
              key={bo.id}
              className="flex items-center justify-between gap-3 rounded-md bg-[#0E0E0E] px-3 py-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {bo.bookmaker.logoUrl ? (
                  <Image
                    src={bo.bookmaker.logoUrl}
                    alt={bo.bookmaker.name}
                    width={24}
                    height={24}
                    className="size-6 shrink-0 rounded object-contain"
                  />
                ) : (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded bg-[#1A1A1A] text-[10px] font-bold text-[#F0EDE8]">
                    {bo.bookmaker.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-[#F0EDE8]">
                  {bo.bookmaker.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-[#F0EDE8]">
                  @{bo.odds.toFixed(2)}
                </span>
                {affiliateLink && (
                  <a
                    href={affiliateLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-[#F0EDE8] px-3 py-1.5 text-xs font-semibold text-[#080808] hover:bg-[#00D47E] transition-all whitespace-nowrap"
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
