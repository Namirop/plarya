"use client";

import { useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useUser } from "@/hooks/use-user";

import { ApplicationFormSection } from "./_components/application-form-section";
import { FaqSection } from "./_components/faq-section";
import { HeroSection } from "./_components/hero-section";
import {
  AlreadyExpertScreen,
  CheckoutCancelScreen,
  CheckoutSuccessScreen,
  LoadingScreen,
} from "./_components/result-screens";
import { StatsSection } from "./_components/stats-section";

export function DevenirExpertClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();

  const checkoutStatus = searchParams.get("checkout");

  // Page réservée aux utilisateurs connectés.
  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  // ── États alternatifs (chacun remplace toute la page) ────────
  if (loading) return <LoadingScreen />;
  if (user?.role === "EXPERT") return <AlreadyExpertScreen />;
  if (checkoutStatus === "success") return <CheckoutSuccessScreen />;
  if (checkoutStatus === "cancel") return <CheckoutCancelScreen />;

  // ── Page par défaut : accroche, chiffres, formulaire, FAQ ────
  return (
    <div className="relative">
      <HeroSection />
      <StatsSection />
      <ApplicationFormSection email={user?.email || ""} />
      <FaqSection />
    </div>
  );
}
