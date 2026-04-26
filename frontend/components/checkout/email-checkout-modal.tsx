"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/lib/stripe";

interface EmailCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  tipsterId: string;
  type: "DAY_PASS" | "MONTHLY";
}

export function EmailCheckoutModal({ open, onClose, tipsterId, type }: EmailCheckoutModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) { setError("Veuillez entrer un email valide"); return; }
    setLoading(true);
    try {
      const url = await createCheckoutSession(tipsterId, type, trimmed);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 mx-4 w-full max-w-md rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-6">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[#8A8680] hover:text-[#F0EDE8] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        <h2 className="text-xl font-bold text-[#F0EDE8] mb-2">Accédez aux analyses</h2>
        <p className="text-sm text-[#8A8680] mb-6">Entrez votre email pour recevoir l&apos;accès et votre facture</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-[#080808] ring-1 ring-[#1A1A1A] px-4 py-3 text-[#F0EDE8] placeholder:text-[#8A8680]/40 focus:ring-[#00D47E]/50 focus:outline-none transition-colors"
            autoFocus
            disabled={loading}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-[#F0EDE8] px-4 py-3 text-sm font-bold text-[#080808] transition-all hover:bg-[#00D47E] disabled:opacity-50">
            {loading ? "Redirection..." : "Continuer vers le paiement"}
          </button>
        </form>
      </div>
    </div>
  );
}
