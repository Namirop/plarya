"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { createCheckoutSession } from "@/lib/stripe";
import { formatPrice } from "@/lib/constants";
import { allStarted } from "@/lib/date";
import { getLeagueFlag, getLeague } from "@/lib/sports";
import { SportIcon } from "@/lib/sports-icons";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

interface TodayProno {
  id: string;
  matchName: string;
  league: string | null;
  odds: number;
  teasing: string;
  result: string;
  startTime: string;
  isFeatured: boolean;
}

export interface TipsterCardData {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  photoUrl: string | null;
  sports: string[];
  dayPassPrice: number;
  pronosToday: number;
  todayPronos: TodayProno[];
  viewsToday: number;
}

export function TipsterCard({ tipster }: { tipster: TipsterCardData }) {
  const router = useRouter();
  const { user } = useUser();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const dayPrice = formatPrice(tipster.dayPassPrice);
  const allDone = allStarted(tipster.todayPronos);
  const cardRef = useRef<HTMLDivElement>(null);

  // Tilt — centered on 0, pixel-based offset from center
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-150, 150], [6, -6]);
  const rotateY = useTransform(mouseX, [-150, 150], [-6, 6]);

  const springConfig = { stiffness: 300, damping: 20, mass: 0.5 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left - width / 2);
    mouseY.set(e.clientY - top - height / 2);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  async function handleUnlock(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      router.push(`/tipsters/${tipster.id}`);
      return;
    }
    setCheckoutLoading(true);
    try {
      const url = await createCheckoutSession(tipster.id, "DAY_PASS");
      window.location.href = url;
    } catch {
      router.push(`/tipsters/${tipster.id}`);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      className="group flex flex-col rounded-xl bg-[#0E0E0E] ring-1 ring-[#1A1A1A] transition-shadow duration-300 hover:ring-white/15 hover:shadow-[0_12px_50px_rgba(0,0,0,0.5)] transform-gpu"
    >
      {/* Inner content with translateZ for depth */}
      <div className="flex flex-col flex-1 overflow-hidden rounded-xl" style={{ transform: "translateZ(20px)" }}>
        <Link
          href={`/tipsters/${tipster.id}`}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Identity */}
          <div className="p-7">
            <div className="flex items-center gap-5">
              {tipster.photoUrl ? (
                <Image
                  src={tipster.photoUrl}
                  alt={tipster.pseudo}
                  width={96}
                  height={96}
                  className="size-18 shrink-0 rounded-full object-cover ring-1 ring-[#1A1A1A] sm:size-20"
                />
              ) : (
                <div className="flex size-18 shrink-0 items-center justify-center rounded-full bg-[#141414] text-2xl font-bold text-[#F0EDE8] ring-1 ring-[#1A1A1A] sm:size-20">
                  {tipster.pseudo.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-3.5">
                  <h3 className="truncate text-xl font-bold text-[#F0EDE8] sm:text-2xl">
                    {tipster.pseudo}
                  </h3>
                  <div className="flex items-center gap-1">
                    {tipster.sports.map((sport) => (
                      <span
                        key={sport}
                        className="inline-flex items-center rounded bg-[#141414] p-1.5"
                      >
                        <SportIcon
                          sport={sport}
                          className="size-4 text-[#8A8680]"
                        />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#00D47E]">
                    Expert
                  </span>
                  {tipster.viewsToday > 0 && (
                    <span className="text-xs text-[#8A8680]">
                      · {tipster.viewsToday} vues
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Today's analyses */}
          {tipster.todayPronos.length > 0 && (
            <div className="mx-7 mb-5 border-t border-[#1A1A1A] pt-5">
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-[#8A8680] mb-4">
                {tipster.todayPronos.length} analyse
                {tipster.todayPronos.length > 1 ? "s" : ""} du jour
              </p>
              <ul className="space-y-3">
                {tipster.todayPronos.slice(0, 4).map((prono) => (
                  <li
                    key={prono.id}
                    className="flex items-center gap-2.5 text-base text-[#F0EDE8]/80"
                  >
                    <span className="text-[#00D47E] text-sm">→</span>
                    {prono.league &&
                      (() => {
                        const lg = getLeague(prono.league);
                        const INVERT_LOGOS = [
                          "ligue-1",
                          "la-liga",
                          "lol-worlds",
                          "premier-league",
                          "nhl",
                        ];
                        const shouldInvert = lg && INVERT_LOGOS.includes(lg.id);
                        return lg?.logo ? (
                          <Image
                            src={lg.logo}
                            width={20}
                            height={20}
                            alt={lg.name}
                            className={`size-5 shrink-0 object-contain ${shouldInvert ? "invert" : ""}`}
                          />
                        ) : (
                          <span className="shrink-0 text-sm">
                            {getLeagueFlag(prono.league)}
                          </span>
                        );
                      })()}
                    <span className="truncate">{prono.matchName}</span>
                    {prono.isFeatured && (
                      <span className="shrink-0 text-xs font-semibold text-[#00D47E]">
                        ★
                      </span>
                    )}
                  </li>
                ))}
                {tipster.todayPronos.length > 4 && (
                  <li className="text-xs text-[#8A8680]">
                    +{tipster.todayPronos.length - 4} autre
                    {tipster.todayPronos.length - 4 > 1 ? "s" : ""}
                  </li>
                )}
              </ul>
            </div>
          )}
        </Link>

        {/* CTA */}
        <div className="mt-auto px-7 pb-7 pt-2">
          {allDone ? (
            <div className="flex h-12 w-full items-center justify-center rounded-lg bg-[#141414] text-sm font-medium text-[#8A8680]">
              Terminé pour aujourd&apos;hui
            </div>
          ) : (
            <button
              type="button"
              disabled={checkoutLoading}
              onClick={handleUnlock}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#F0EDE8] text-sm font-semibold text-[#080808] transition-all duration-200 hover:bg-[#00D47E] hover:text-[#080808] disabled:opacity-50"
            >
              {checkoutLoading ? (
                "Redirection..."
              ) : (
                <>
                  Accéder ({dayPrice}€)
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
