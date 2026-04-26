"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { createTipsterCheckout } from "@/lib/stripe";
import { SPORT_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DevenirTipsterPage() {
  return (
    <Suspense>
      <DevenirTipsterContent />
    </Suspense>
  );
}

const btnCls = "rounded-md bg-[#F0EDE8] px-6 py-2 text-sm font-semibold text-[#080808] transition-all hover:bg-[#00D47E]";
const inputCls = "bg-[#080808] border-[#1A1A1A] text-[#F0EDE8] placeholder:text-[#8A8680]/40 focus:border-[#00D47E]/50 focus:ring-1 focus:ring-[#00D47E]/30";

function DevenirTipsterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useUser();

  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => { if (!loading && !user) router.push("/"); }, [user, loading, router]);

  function toggleSport(sport: string) {
    setSports((prev) => prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!pseudo.trim() || pseudo.length < 2) { setError("Le pseudo doit contenir au moins 2 caractères"); return; }
    if (sports.length === 0) { setError("Sélectionnez au moins un sport"); return; }
    setSubmitting(true);
    try {
      const url = await createTipsterCheckout(pseudo, bio, sports);
      window.location.href = url;
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur lors du paiement"); }
    finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-[#00D47E]" />
      </div>
    );
  }

  if (user?.role === "TIPSTER") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold text-[#F0EDE8]">Vous êtes déjà expert !</p>
        <Link href="/dashboard" className={btnCls}>Accéder au dashboard</Link>
      </div>
    );
  }

  if (checkoutStatus === "success") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <h1 className="font-[family-name:var(--font-dm-serif)] text-2xl italic text-[#F0EDE8]">Bienvenue parmi les experts !</h1>
        <p className="text-sm text-[#8A8680] text-center max-w-sm">
          Votre compte expert est en cours de création. Vous pourrez accéder à votre dashboard dans quelques instants.
        </p>
        <Link href="/dashboard" className={btnCls}>Accéder au dashboard</Link>
      </div>
    );
  }

  if (checkoutStatus === "cancel") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-bold text-[#F0EDE8]">Paiement annulé</h1>
        <p className="text-sm text-[#8A8680]">Vous pouvez réessayer quand vous le souhaitez.</p>
        <button type="button" onClick={() => { window.history.replaceState({}, "", "/devenir-tipster"); router.refresh(); }} className={`${btnCls} cursor-pointer`}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8 sm:px-8">
      <h1 className="font-[family-name:var(--font-dm-serif)] text-3xl italic text-[#F0EDE8] text-center">
        Devenir Expert
      </h1>
      <p className="mt-2 text-sm text-[#8A8680] text-center">
        Publiez vos analyses et monétisez votre expertise — 39€/trimestre
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {error && (
          <div className="rounded-md ring-1 ring-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pseudo" className="text-[#8A8680]">Pseudo *</Label>
          <Input id="pseudo" placeholder="TonPseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#8A8680]">Email</Label>
          <Input id="email" type="email" value={user?.email || ""} disabled className={`${inputCls} opacity-50`} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-[#8A8680]">Bio</Label>
          <Textarea id="bio" placeholder="Expert Football & Tennis — Analyses pointues"
            value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputCls} />
        </div>

        <div className="space-y-2">
          <Label className="text-[#8A8680]">Sports couverts *</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(SPORT_LABELS).map(([key, label]) => (
              <button key={key} type="button" onClick={() => toggleSport(key)}
                className={`rounded-md px-3 py-1 text-sm transition cursor-pointer ring-1 ${
                  sports.includes(key)
                    ? "ring-[#00D47E] bg-[#00D47E]/10 text-[#00D47E] font-medium"
                    : "ring-[#1A1A1A] text-[#8A8680] hover:ring-[#8A8680]/30"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-[#0E0E0E] ring-1 ring-[#1A1A1A] px-4 py-3">
          <p className="text-sm font-medium text-[#F0EDE8]">39€ / trimestre</p>
          <p className="text-xs text-[#8A8680] mt-1">
            Accès au dashboard expert, publication d&apos;analyses, visibilité sur la plateforme. Renouvellement automatique tous les 3 mois.
          </p>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full h-10 rounded-md bg-[#F0EDE8] text-sm font-bold text-[#080808] transition-all hover:bg-[#00D47E] disabled:opacity-50">
          {submitting ? "Redirection vers le paiement..." : "Devenir Expert (39€/trimestre)"}
        </button>
      </form>
    </div>
  );
}
