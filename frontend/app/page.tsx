"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { apiGet } from "@/lib/api";
import {
  TipsterCard,
  type TipsterCardData,
} from "@/components/tipsters/tipster-card";
import { SPORT_DOMAIN, ESPORT_DOMAIN } from "@/lib/sports";
import { ArrowRight, Clock, Zap, CreditCard } from "lucide-react";
import { SectionDivider } from "@/components/ui/section-divider";
import { Hero } from "@/components/home/hero";

type Domain = "SPORT" | "ESPORT" | null;

export default function Home() {
  const [tipsters, setTipsters] = useState<TipsterCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState<Domain>(null);
  const expertsRef = useRef<HTMLDivElement>(null);

  function handleDomainSelect(domain: Domain) {
    setActiveDomain(domain);
    if (domain && expertsRef.current) {
      const y =
        expertsRef.current.getBoundingClientRect().top + window.scrollY - 128; // offset for scroll-mt-32
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    apiGet<TipsterCardData[]>("/tipsters?all=true")
      .then(setTipsters)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Intersection Observer for scroll-triggered animations
  const domainSectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = domainSectionRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".scroll-reveal, .scroll-pop");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const filteredTipsters = useMemo(() => {
    if (!activeDomain) return tipsters;
    const domainSports =
      activeDomain === "SPORT" ? SPORT_DOMAIN : ESPORT_DOMAIN;
    return tipsters.filter((t) =>
      t.sports.some((s) => domainSports.includes(s)),
    );
  }, [tipsters, activeDomain]);

  return (
    <div className="relative overflow-hidden">
      <Hero />

      {/* ═══ DOMAIN SELECTOR ═══ */}
      <section className="relative pt-12 pb-20 sm:pt-17 sm:pb-15 sm:px-8 lg:px-16 overflow-hidden">
        {/* Scrolling marquee — behind cards */}
        <div className="absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden z-0">
          <div className="marquee-loop" style={{ marginLeft: "-100%" }}>
            {[0, 1].map((i) => (
              <span
                key={i}
                className="whitespace-nowrap text-[6rem] sm:text-[8rem] lg:text-[10rem] font-black uppercase tracking-tight text-white/[0.03] leading-none shrink-0"
                style={{ paddingRight: "100vw" }}
              >
                ANALYZE • DECIDE • IMPROVE
                <span className="text-[#00D47E]/10">.</span>
              </span>
            ))}
          </div>
        </div>

        <div ref={domainSectionRef} className="relative z-10 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-20">
            {/* SPORT */}
            <button
              type="button"
              onClick={() =>
                handleDomainSelect(activeDomain === "SPORT" ? null : "SPORT")
              }
              className="scroll-pop group flex flex-col items-center relative"
              style={{ transitionDelay: "0.2s" }}
            >
              {/* Hover shadow */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-6 rounded-[50%] bg-black/0 group-hover:bg-black/70 blur-2xl transition-all duration-500 pointer-events-none" />
              <div
                className={`relative w-[85%] sm:w-full aspect-[4/5] transition-all duration-500 group-hover:-translate-y-3 ${
                  activeDomain === "SPORT"
                    ? "scale-100"
                    : activeDomain !== null
                      ? "scale-90 opacity-50"
                      : "scale-100"
                }`}
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <div
                  className={`absolute inset-0 ${activeDomain === "SPORT" ? "bg-[#00D47E]/40" : "bg-[#2A2A2A]"} transition-colors duration-500`}
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                />
                <div
                  className="absolute inset-[2px] overflow-hidden"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: "url(/domains/sport.jpg)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/30 to-[#080808]/10" />
                  {/* Badge label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-5 py-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded text-lg font-bold uppercase tracking-[0.15em] text-[#F0EDE8] sm:text-xl">
                      Sport
                    </span>
                  </div>
                </div>
              </div>
              {/* Slide-up label */}
              <div className="relative mt-2 h-8 overflow-hidden">
                <div className="flex items-center gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
                  <span className="text-sm font-medium text-[#00D47E]">
                    Voir les analyses
                  </span>
                  <ArrowRight className="size-4 text-[#00D47E]" />
                </div>
              </div>
            </button>

            {/* ESPORT */}
            <button
              type="button"
              onClick={() =>
                handleDomainSelect(activeDomain === "ESPORT" ? null : "ESPORT")
              }
              className="scroll-pop group flex flex-col items-center relative"
              style={{ transitionDelay: "0.35s" }}
            >
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-6 rounded-[50%] bg-black/0 group-hover:bg-black/70 blur-2xl transition-all duration-500 pointer-events-none" />
              <div
                className={`relative w-[85%] sm:w-full aspect-[4/5] transition-all duration-500 group-hover:-translate-y-3 ${
                  activeDomain === "ESPORT"
                    ? "scale-100"
                    : activeDomain !== null
                      ? "scale-90 opacity-50"
                      : "scale-100"
                }`}
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <div
                  className={`absolute inset-0 ${activeDomain === "ESPORT" ? "bg-[#00D47E]/40" : "bg-[#2A2A2A]"} transition-colors duration-500`}
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                />
                <div
                  className="absolute inset-[2px] overflow-hidden"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: "url(/domains/esport.jpg)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/30 to-[#080808]/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-5 py-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded text-lg font-bold uppercase tracking-[0.15em] text-[#F0EDE8] sm:text-xl">
                      Esport
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative mt-2 h-8 overflow-hidden">
                <div className="flex items-center gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
                  <span className="text-sm font-medium text-[#00D47E]">
                    Voir les analyses
                  </span>
                  <ArrowRight className="size-4 text-[#00D47E]" />
                </div>
              </div>
            </button>

            {/* GAMING */}
            <button
              type="button"
              onClick={() =>
                handleDomainSelect(activeDomain === "ESPORT" ? null : "ESPORT")
              }
              className="scroll-pop group flex flex-col items-center relative"
              style={{ transitionDelay: "0.5s" }}
            >
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-6 rounded-[50%] bg-black/0 group-hover:bg-black/70 blur-2xl transition-all duration-500 pointer-events-none" />
              <div
                className={`relative w-[85%] sm:w-full aspect-[4/5] transition-all duration-500 group-hover:-translate-y-3 ${
                  activeDomain === "ESPORT"
                    ? "scale-100"
                    : activeDomain !== null
                      ? "scale-90 opacity-50"
                      : "scale-100"
                }`}
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <div
                  className={`absolute inset-0 ${activeDomain === "ESPORT" ? "bg-[#00D47E]/40" : "bg-[#2A2A2A]"} transition-colors duration-500`}
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                />
                <div
                  className="absolute inset-[2px] overflow-hidden"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: "url(/domains/gaming.jpg)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/30 to-[#080808]/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-5 py-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded text-lg font-bold uppercase tracking-[0.15em] text-[#F0EDE8] sm:text-xl">
                      Gaming
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative mt-2 h-8 overflow-hidden">
                <div className="flex items-center gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
                  <span className="text-sm font-medium text-[#00D47E]">
                    Voir les analyses
                  </span>
                  <ArrowRight className="size-4 text-[#00D47E]" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ DIVIDER ═══ */}
      <div className="px-6 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <SectionDivider />
        </div>
      </div>

      {/* ═══ EXPERTS ═══ */}
      <section
        ref={expertsRef}
        className="scroll-mt-32 relative px-6 pt-12 pb-20 sm:pt-17 sm:pb-20 sm:py-28 lg:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
            <div>
              <h2 className="font-[family-name:var(--font-dm-serif)] text-4xl text-[#F0EDE8] sm:text-5xl lg:text-6xl italic">
                Nos experts
              </h2>
              <p className="mt-2 text-base text-[#8A8680]">
                Les meilleurs analystes à votre service
              </p>
            </div>
            {activeDomain && (
              <button
                type="button"
                onClick={() => setActiveDomain(null)}
                className="self-start sm:self-auto text-sm font-medium text-[#00D47E] hover:text-[#00F590] transition-colors cursor-pointer"
              >
                Voir tous les experts
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="size-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-[#00D47E]" />
            </div>
          ) : filteredTipsters.length === 0 ? (
            <p className="py-20 text-center text-[#8A8680]">
              Aucun expert disponible
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ perspective: "1200px" }}>
              {filteredTipsters.map((tipster) => (
                <TipsterCard key={tipster.id} tipster={tipster} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ DIVIDER ═══ */}
      <div className="px-6 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <SectionDivider />
        </div>
      </div>

      {/* ═══ WHY PLARYA ═══ */}
      <section className="relative px-6 pt-12 pb-20 sm:pt-20 sm:pb-24 sm:py-28 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-[family-name:var(--font-dm-serif)] text-4xl text-[#F0EDE8] sm:text-5xl italic mb-14">
            Pourquoi Plarya<span className="text-[#00D47E]">?</span>
          </h2>

          <div className="grid grid-cols-1 gap-px bg-[#1A1A1A] rounded-lg overflow-hidden sm:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Gain de temps",
                desc: "Accédez directement aux analyses. Pas de recherche, pas de bruit.",
              },
              {
                icon: Zap,
                title: "Simple",
                desc: "Tout est prêt. Choisissez un expert, accédez à ses sélections.",
              },
              {
                icon: CreditCard,
                title: "Sans engagement",
                desc: "Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#0E0E0E] p-8 sm:p-10">
                <item.icon
                  className="size-6 text-[#00D47E] mb-5"
                  strokeWidth={1.5}
                />
                <h3 className="text-xl font-semibold text-[#F0EDE8] mb-3">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#8A8680]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
