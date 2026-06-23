import { useState, type FormEvent } from "react";

import { createExpertCheckout } from "@/lib/stripe";

// State + logique de soumission du formulaire de candidature expert.
// Encapsule pseudo/bio/sports + la validation et la redirection Stripe.
// Le state est entièrement local à la Section 3 (form + preview) — rien
// au-dessus n'en dépend, donc le hook est appelé directement par
// <ApplicationFormSection>.
export function useExpertApplication() {
  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleSport(sport: string) {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!pseudo.trim() || pseudo.length < 2) {
      setError("Le pseudo doit contenir au moins 2 caractères");
      return;
    }
    if (sports.length === 0) {
      setError("Sélectionnez au moins un sport");
      return;
    }
    setSubmitting(true);
    try {
      const url = await createExpertCheckout(pseudo, bio, sports);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du paiement");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    pseudo,
    setPseudo,
    bio,
    setBio,
    sports,
    toggleSport,
    error,
    submitting,
    handleSubmit,
  };
}
