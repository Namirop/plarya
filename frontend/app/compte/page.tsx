"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { apiGet, apiPatch } from "@/lib/api";
import { SPORT_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TipsterProfile {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  dailyNoteDate: string | null;
  sports: string[];
}

export default function ComptePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const [tipster, setTipster] = useState<TipsterProfile | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [dailyNote, setDailyNote] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    // Pour les non-TIPSTER, on coupe le spinner immédiatement — la page
    // affichera le placeholder "réservée aux experts" (vue USER) ou
    // sera court-circuitée par un redirect (vue ADMIN, géré ailleurs si
    // besoin). Sans ce reset, fetchLoading restait `true` à vie → spinner
    // infini (bug observé en login USER/ADMIN).
    if (user.role !== "TIPSTER") {
      setFetchLoading(false);
      return;
    }
    apiGet<TipsterProfile>("/tipsters/me")
      .then((data) => {
        setTipster(data);
        setDailyNote(data.dailyNote || "");
        setPseudo(data.pseudo);
        setBio(data.bio || "");
        setSports(data.sports);
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false));
  }, [user]);

  function toggleSport(sport: string) {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }

  async function handleDailyNote() {
    setNoteMsg("");
    setNoteSaving(true);
    try {
      const data = await apiPatch<TipsterProfile>("/tipsters/me", {
        dailyNote,
      });
      setTipster((prev) =>
        prev ? { ...prev, dailyNote: data.dailyNote } : prev,
      );
      setNoteMsg("Note mise à jour");
    } catch (err) {
      setNoteMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleProfile() {
    setProfileMsg("");
    if (sports.length === 0) {
      setProfileMsg("Sélectionnez au moins un sport");
      return;
    }
    setProfileSaving(true);
    try {
      const data = await apiPatch<TipsterProfile>("/tipsters/me", {
        pseudo,
        bio,
        sports,
      });
      setTipster((prev) =>
        prev
          ? { ...prev, pseudo: data.pseudo, bio: data.bio, sports: data.sports }
          : prev,
      );
      setProfileMsg("Profil mis à jour");
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setProfileSaving(false);
    }
  }

  if (loading || fetchLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-[#00D47E]" />
      </div>
    );
  }

  if (user?.role !== "TIPSTER") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-[#8A8680]">Cette page est réservée aux experts.</p>
      </div>
    );
  }

  const inputCls =
    "bg-[#080808] border-[#1A1A1A] text-[#F0EDE8] placeholder:text-[#8A8680]/40 focus:border-[#00D47E]/50 focus:ring-1 focus:ring-[#00D47E]/30";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:px-8">
      <h1 className="font-[family-name:var(--font-dm-serif)] text-4xl sm:text-5xl italic text-[#F0EDE8]">
        Mon compte
      </h1>

      {/* Daily Note */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-[#F0EDE8]">
          Note quotidienne
        </h2>
        <p className="mt-0 text-base text-[#8A8680]">
          Visible sur votre profil et la page d&apos;accueil. Teaser vos
          sélections du jour.
        </p>
        <Textarea
          className={`mt-5 text-base ${inputCls}`}
          placeholder="Aujourd'hui focus Ligue 1 et Tennis — gros combo en vue"
          value={dailyNote}
          onChange={(e) => setDailyNote(e.target.value)}
          maxLength={200}
          rows={4}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-[#8A8680]/60">
            {dailyNote.length}/200
          </span>
          {noteMsg && (
            <span
              className={`text-sm ${noteMsg.includes("Erreur") || noteMsg.includes("pris") ? "text-red-400" : "text-[#00D47E]"}`}
            >
              {noteMsg}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleDailyNote}
          disabled={noteSaving}
          className="mt-4 rounded-lg bg-[#F0EDE8] px-6 py-2 text-sm font-semibold text-[#080808] transition-all hover:bg-[#00D47E] disabled:opacity-50"
        >
          {noteSaving ? "Enregistrement..." : "Mettre à jour"}
        </button>
      </section>

      {/* Profile */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold text-[#F0EDE8]">Profil</h2>

        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="pseudo" className="text-base text-[#8A8680]">
              Pseudo
            </Label>
            <Input
              id="pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className={`text-base ${inputCls}`}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bio" className="text-base text-[#8A8680]">
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Expert Football & Tennis — Analyses pointues"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className={`text-base ${inputCls}`}
            />
          </div>

          <div className="space-y-2.5">
            <Label className="text-base text-[#8A8680]">Sports couverts</Label>
            <div className="flex flex-wrap gap-3 mt-3">
              {Object.entries(SPORT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSport(key)}
                  className={`rounded-lg px-5 py-2.5 text-base transition cursor-pointer ring-1 ${
                    sports.includes(key)
                      ? "ring-[#00D47E] bg-[#00D47E]/10 text-[#00D47E] font-medium"
                      : "ring-[#1A1A1A] text-[#8A8680] hover:ring-[#8A8680]/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleProfile}
            disabled={profileSaving}
            className="rounded-lg bg-[#F0EDE8] px-7 py-2 text-base font-semibold text-[#080808] transition-all hover:bg-[#00D47E] disabled:opacity-50"
          >
            {profileSaving ? "Enregistrement..." : "Enregistrer"}
          </button>

          {profileMsg && (
            <p
              className={`text-sm ${profileMsg.includes("Erreur") || profileMsg.includes("pris") ? "text-red-400" : "text-[#00D47E]"}`}
            >
              {profileMsg}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
