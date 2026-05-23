"use client";

import { useState, type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { DangerZone } from "@/components/account/danger-zone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiPatch } from "@/lib/api";
import { SPORT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ════════════════════════ Types ════════════════════════ */

export interface ExpertProfile {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  dailyNoteDate: string | null;
  sports: string[];
}

export interface SubscriptionWithExpert {
  id: string;
  userId: string;
  expertId: string;
  type: "DAY_PASS" | "MONTHLY";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  expert: {
    id: string;
    pseudo: string;
    photoUrl: string | null;
    sports: string[];
  };
}

interface CompteClientProps {
  role: "USER" | "EXPERT";
  /** Profile expert injecté par le server pour les EXPERTS (null pour USERS). */
  initialExpertProfile: ExpertProfile | null;
  /** Abonnements injectés par le server pour les USERS (null pour EXPERTS). */
  initialSubscriptions: SubscriptionWithExpert[] | null;
}

/* ════════════════════════ Styles partagés ════════════════════════ */

const fieldCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

const textareaCls = cn(
  "min-h-[120px] w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200 resize-y",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
);

const labelCls = "font-body text-body-16 text-muted-foreground";
const cardCls = "rounded-2xl border border-surface-elevated bg-black/40";

/* ════════════════════════ Helpers ════════════════════════ */

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

function formatPeriod(start: string, end: string): string {
  return `Du ${formatDate(start)} au ${formatDate(end)}`;
}

function isActiveSubscription(sub: SubscriptionWithExpert): boolean {
  return sub.status === "ACTIVE" && new Date(sub.expiresAt) > new Date();
}

/* ════════════════════════ Layout shell ════════════════════════ */

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[872px] px-4 py-10 md:px-6 md:py-16">
      <h1 className="font-display text-h2 text-foreground">{title}</h1>
      {subtitle && <p className="mt-3 font-body text-body-16 text-muted-foreground">{subtitle}</p>}
      <div className="mt-10">{children}</div>
    </div>
  );
}

/* ════════════════════════ Client root ════════════════════════ */

export default function CompteClient({
  role,
  initialExpertProfile,
  initialSubscriptions,
}: CompteClientProps) {
  if (role === "EXPERT" && initialExpertProfile) {
    return <ExpertView initial={initialExpertProfile} />;
  }
  return <UserView subscriptions={initialSubscriptions ?? []} />;
}

/* ════════════════════════ Vue EXPERT ════════════════════════ */

const DAILY_NOTE_MAX = 200;

function ExpertView({ initial }: { initial: ExpertProfile }) {
  // States locaux initialisés depuis les data server. Pas de useEffect
  // de fetch initial → pas de spinner ni de flash de loading.
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
  const noteColorCls =
    noteCount > DAILY_NOTE_MAX
      ? "text-destructive"
      : noteCount >= DAILY_NOTE_MAX * 0.8
        ? "text-accent"
        : "text-muted-foreground";

  return (
    <PageShell
      title="Mon compte"
      subtitle="Modifie tes informations de profil et ta note quotidienne."
    >
      <div className="space-y-10">
        {/* ─── Section 1 : Note quotidienne ─── */}
        <section className={cn(cardCls, "p-6 md:p-8")}>
          <h2 className="font-display text-h3 text-foreground">Note quotidienne</h2>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Visible sur votre profil et la page d&apos;accueil. Teasez vos sélections du jour.
          </p>

          <div className="mt-6 space-y-2">
            <textarea
              className={textareaCls}
              placeholder="Aujourd'hui focus Ligue 1 et Tennis — gros combo en vue"
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              maxLength={DAILY_NOTE_MAX}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <span className={cn("font-body text-body-16", noteColorCls)}>
                {noteCount}/{DAILY_NOTE_MAX}
              </span>
              {noteMsg && (
                <span
                  role="status"
                  className={cn(
                    "font-body text-body-16",
                    noteIsError ? "text-destructive" : "text-accent",
                  )}
                >
                  {noteMsg}
                </span>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleDailyNote}
            disabled={noteSaving}
            className="mt-6 w-full sm:w-auto"
          >
            {noteSaving ? "Enregistrement…" : "Mettre à jour"}
          </Button>
        </section>

        {/* ─── Section 2 : Profil ─── */}
        <section className={cn(cardCls, "p-6 md:p-8")}>
          <h2 className="font-display text-h3 text-foreground">Profil</h2>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Ton pseudo, ta bio, les sports que tu couvres.
          </p>

          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pseudo" className={labelCls}>
                Pseudo <span className="text-accent">*</span>
              </Label>
              <input
                id="pseudo"
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className={fieldCls}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className={labelCls}>
                Bio
              </Label>
              <textarea
                id="bio"
                placeholder="Expert Football & Tennis — Analyses pointues"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className={textareaCls}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelCls}>
                Sports couverts <span className="text-accent">*</span>
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(SPORT_LABELS).map(([key, label]) => {
                  const isActive = sports.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSport(key)}
                      aria-pressed={isActive}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-2 font-body text-body-16 transition-all duration-200",
                        isActive
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-surface-elevated bg-black/40 text-foreground hover:border-accent",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleProfile}
              disabled={profileSaving}
              className="w-full sm:w-auto"
            >
              {profileSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>

            {profileMsg && (
              <p
                role="status"
                className={cn(
                  "font-body text-body-16",
                  profileIsError ? "text-destructive" : "text-accent",
                )}
              >
                {profileMsg}
              </p>
            )}
          </div>
        </section>
      </div>

      <DangerZone />
    </PageShell>
  );
}

/* ════════════════════════ Vue USER ════════════════════════ */

function UserView({ subscriptions }: { subscriptions: SubscriptionWithExpert[] }) {
  const monthly = subscriptions.filter((s) => s.type === "MONTHLY");
  const dayPasses = subscriptions.filter((s) => s.type === "DAY_PASS");

  const monthlyActive = monthly.filter(isActiveSubscription);
  const monthlyExpired = monthly.filter((s) => !isActiveSubscription(s));

  return (
    <PageShell title="Mon compte" subtitle="Tes abonnements et achats sur Plarya.">
      <div className="space-y-12">
        <section>
          <h2 className="font-display text-h3 text-foreground">Mes abonnements</h2>

          {monthly.length === 0 ? (
            <EmptyState
              message="Tu n'as pas d'abonnement actif."
              hint="Découvre nos experts pour t'abonner."
              cta={{ label: "Voir les experts", href: "/" }}
            />
          ) : (
            <div className="mt-6 space-y-4">
              {monthlyActive.map((sub) => (
                <SubscriptionCard key={sub.id} sub={sub} active />
              ))}
              {monthlyExpired.length > 0 && (
                <>
                  <h3 className="mt-8 font-body text-body-16 text-muted-foreground">
                    Abonnements expirés
                  </h3>
                  {monthlyExpired.map((sub) => (
                    <SubscriptionCard key={sub.id} sub={sub} active={false} />
                  ))}
                </>
              )}
            </div>
          )}

          {monthlyActive.length > 0 && (
            <p className="mt-6 font-body text-body-16 text-muted-foreground">
              Pour résilier un abonnement, contacte-nous à{" "}
              <a
                href="mailto:contact@plarya.com"
                className="text-accent transition-colors hover:underline"
              >
                contact@plarya.com
              </a>
              .
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-h3 text-foreground">Mes achats ponctuels</h2>

          {dayPasses.length === 0 ? (
            <EmptyState
              message="Tu n'as encore acheté aucune analyse."
              hint="Accède à une journée d'analyses d'un expert pour 3,50€."
              cta={{ label: "Voir les experts", href: "/" }}
            />
          ) : (
            <div className="mt-6 space-y-4">
              {dayPasses.map((sub) => (
                <DayPassCard key={sub.id} sub={sub} />
              ))}
            </div>
          )}
        </section>
      </div>

      <DangerZone />
    </PageShell>
  );
}

function SubscriptionCard({ sub, active }: { sub: SubscriptionWithExpert; active: boolean }) {
  return (
    <article className={cn(cardCls, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <ExpertAvatar expert={sub.expert} />

          <div className="min-w-0 flex-1">
            <Link
              href={`/experts/${sub.expertId}`}
              className="font-display text-h5 text-foreground transition-colors hover:text-accent"
            >
              {sub.expert.pseudo}
            </Link>
            <p className="mt-1 font-body text-body-16 text-foreground">Abonnement mensuel</p>
            <p className="mt-1 font-body text-body-16 text-muted-foreground">
              {formatPeriod(sub.createdAt, sub.expiresAt)}
            </p>
          </div>
        </div>

        <StatusBadge active={active} />
      </div>
    </article>
  );
}

function DayPassCard({ sub }: { sub: SubscriptionWithExpert }) {
  return (
    <article className={cn(cardCls, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <ExpertAvatar expert={sub.expert} />

          <div className="min-w-0 flex-1">
            <Link
              href={`/experts/${sub.expertId}`}
              className="font-display text-h5 text-foreground transition-colors hover:text-accent"
            >
              {sub.expert.pseudo}
            </Link>
            <p className="mt-1 font-body text-body-16 text-foreground">Accès à la journée</p>
            <p className="mt-1 font-body text-body-16 text-muted-foreground">
              Acheté le {formatDate(sub.createdAt)}
            </p>
          </div>
        </div>

        <span className="shrink-0 font-display text-h5 text-accent">3,50€</span>
      </div>
    </article>
  );
}

function ExpertAvatar({ expert }: { expert: SubscriptionWithExpert["expert"] }) {
  if (expert.photoUrl) {
    return (
      <Image
        src={expert.photoUrl}
        alt={expert.pseudo}
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full object-cover ring-1 ring-accent/40"
      />
    );
  }
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-elevated font-display text-h5 text-accent ring-1 ring-accent/40">
      {expert.pseudo.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center rounded-full px-3 py-1 font-body text-body-16",
        active ? "bg-green-500/20 text-green-500" : "bg-muted-foreground/20 text-muted-foreground",
      )}
    >
      {active ? "Actif" : "Expiré"}
    </span>
  );
}

function EmptyState({
  message,
  hint,
  cta,
}: {
  message: string;
  hint: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className={cn(cardCls, "mt-6 flex flex-col items-center gap-4 px-6 py-10 text-center")}>
      <p className="font-body text-body-16 text-foreground">{message}</p>
      <p className="font-body text-body-16 text-muted-foreground">{hint}</p>
      <Button variant="secondary" size="lg" render={<Link href={cta.href} />} className="mt-2">
        {cta.label}
      </Button>
    </div>
  );
}
