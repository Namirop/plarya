"use client";

import { useState } from "react";

import { ConfidentialitySection } from "@/components/account/confidentiality-section";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { apiPatch } from "@/lib/api";
import { SPORT_LABELS, stripSportEmoji } from "@/lib/constants";
import { formDaCardCls, formDaInputCls, formDaLabelCls, formDaTextareaCls } from "@/lib/form-da";
import type { ExpertProfile } from "@/lib/types/account";
import { cn } from "@/lib/utils";

import { AccountSectionTitle } from "./account-section-title";
import { ExpertIdentityHeader } from "./expert-identity-header";

const DAILY_NOTE_MAX = 200;

export function ExpertView({ initial }: { initial: ExpertProfile }) {
  const { user } = useUser();

  const [pseudo, setPseudo] = useState(initial.pseudo);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [sports, setSports] = useState<string[]>(initial.sports);
  const [dailyNote, setDailyNote] = useState(initial.dailyNote ?? "");

  const [noteMsg, setNoteMsg] = useState("");
  const [noteIsError, setNoteIsError] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const [profileMsg, setProfileMsg] = useState("");
  const [profileIsError, setProfileIsError] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  function toggleSport(sport: string) {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }

  async function handleDailyNote() {
    setNoteMsg("");
    setNoteIsError(false);
    setNoteSaving(true);
    try {
      await apiPatch<ExpertProfile>("/experts/me", { dailyNote });
      setNoteMsg("Note mise à jour");
    } catch (err) {
      setNoteMsg(err instanceof Error ? err.message : "Erreur");
      setNoteIsError(true);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleProfile() {
    setProfileMsg("");
    setProfileIsError(false);
    if (sports.length === 0) {
      setProfileMsg("Sélectionnez au moins un sport");
      setProfileIsError(true);
      return;
    }
    setProfileSaving(true);
    try {
      await apiPatch<ExpertProfile>("/experts/me", { pseudo, bio, sports });
      setProfileMsg("Profil mis à jour");
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Erreur");
      setProfileIsError(true);
    } finally {
      setProfileSaving(false);
    }
  }

  const noteCount = dailyNote.length;
  // destructive si dépasse, foreground proche de la limite (80 %), muted sinon.
  const noteColorCls =
    noteCount > DAILY_NOTE_MAX
      ? "text-destructive"
      : noteCount >= DAILY_NOTE_MAX * 0.8
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8 md:px-6 md:py-14">
      <ExpertIdentityHeader
        pseudo={initial.pseudo}
        email={user?.email ?? ""}
        sportsCount={initial.sports.length}
        hasDailyNote={Boolean(initial.dailyNote)}
      />

      {/* ─── Note quotidienne — DA "form publication" ─── */}
      <section className="mt-12 md:mt-16">
        <AccountSectionTitle title="Note quotidienne" />
        <p className="mt-3 font-body text-body-16 text-muted-foreground">
          Visible sur ton profil public. Teasez tes sélections du jour, ajoute du contexte.
        </p>

        <div className={cn(formDaCardCls, "mt-6")}>
          <label htmlFor="daily-note" className={formDaLabelCls}>
            Ta note du jour
          </label>
          <div className="relative mt-2">
            <textarea
              id="daily-note"
              className={cn(formDaTextareaCls, "min-h-[140px]")}
              placeholder="Aujourd'hui focus Ligue 1 et Tennis — gros combo en vue"
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              maxLength={DAILY_NOTE_MAX}
              rows={4}
            />
            <span
              aria-live="polite"
              className={cn(
                "pointer-events-none absolute bottom-3 right-3 font-body text-[12px]",
                noteColorCls,
              )}
            >
              {noteCount}/{DAILY_NOTE_MAX}
            </span>
          </div>

          {noteMsg && (
            <p
              role="status"
              className={cn(
                "mt-3 font-body text-[14px]",
                noteIsError ? "text-destructive" : "text-foreground",
              )}
            >
              {noteMsg}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleDailyNote}
              disabled={noteSaving}
            >
              {noteSaving ? "Enregistrement…" : "Mettre à jour"}
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Profil expert — DA "form publication" ─── */}
      <section className="mt-12 md:mt-16">
        <AccountSectionTitle title="Profil expert" />
        <p className="mt-3 font-body text-body-16 text-muted-foreground">
          Ton pseudo, ta bio, les sports que tu couvres. Visible sur ton profil public.
        </p>

        <div className={cn(formDaCardCls, "mt-6")}>
          <div className="space-y-8">
            <div>
              <label htmlFor="pseudo" className={formDaLabelCls}>
                Pseudo <span className="text-muted-foreground">*</span>
              </label>
              <input
                id="pseudo"
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className={cn(formDaInputCls, "mt-2")}
              />
            </div>

            <div>
              <label htmlFor="bio" className={formDaLabelCls}>
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Expert Football & Tennis — Analyses pointues"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className={cn(formDaTextareaCls, "mt-2")}
              />
            </div>

            <div>
              {/* Surtitre non-label : les "champs" sont des toggle buttons
                  (chacun avec aria-pressed). Un <label> ne s'attache à
                  aucun contrôle unique → <span>. */}
              <span className={formDaLabelCls}>
                Sports couverts <span className="text-muted-foreground">*</span>
              </span>
              {/* Tags inline éditoriaux — cohérence avec /devenir-expert.
                  + muted → ✓ accent + underline. */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {Object.entries(SPORT_LABELS).map(([key, label]) => {
                  const isActive = sports.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSport(key)}
                      aria-pressed={isActive}
                      className={cn(
                        "group cursor-pointer inline-flex items-baseline gap-1.5 px-1 py-1 font-body text-[16px] transition-colors duration-150",
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "font-body text-[14px] leading-none transition-colors",
                          isActive
                            ? "text-accent"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {isActive ? "✓" : "+"}
                      </span>
                      <span
                        className={cn(
                          "underline-offset-4",
                          isActive && "underline decoration-accent/40 decoration-1",
                        )}
                      >
                        {stripSportEmoji(label)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {profileMsg && (
              <p
                role="status"
                className={cn(
                  "font-body text-[14px]",
                  profileIsError ? "text-destructive" : "text-foreground",
                )}
              >
                {profileMsg}
              </p>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleProfile}
                disabled={profileSaving}
                className="w-full sm:w-auto"
              >
                {profileSaving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ConfidentialitySection />
    </div>
  );
}
