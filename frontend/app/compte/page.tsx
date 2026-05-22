"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { useUser } from "@/hooks/use-user";
import { apiGet, apiPatch } from "@/lib/api";
import { SPORT_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ════════════════════════ Types ════════════════════════ */

interface TipsterProfile {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  dailyNoteDate: string | null;
  sports: string[];
}

interface SubscriptionWithTipster {
  id: string;
  userId: string;
  tipsterId: string;
  type: "DAY_PASS" | "MONTHLY";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  tipster: {
    id: string;
    pseudo: string;
    photoUrl: string | null;
    sports: string[];
  };
}

/* ════════════════════════ Styles partagés ════════════════════════ */

// Pattern input DS aligné /devenir-tipster + EmailCheckoutModal (Bloc 2).
// Fond noir 40 %, bordure subtile surface-elevated, focus accent doré.
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

// Card englobante DS (cohérent avec /tipsters, /devenir-tipster).
const cardCls =
  "rounded-2xl border border-surface-elevated bg-black/40";

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

/** Statut UI dérivé : un abonnement est actif si son status DB est ACTIVE
 *  ET sa date d'expiration est dans le futur (double-check, comme le fait
 *  /subscriptions/check côté backend). */
function isActiveSubscription(sub: SubscriptionWithTipster): boolean {
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
      {subtitle && (
        <p className="mt-3 font-body text-body-16 text-muted-foreground">
          {subtitle}
        </p>
      )}
      <div className="mt-10">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-surface-elevated border-t-accent" />
    </div>
  );
}

/* ════════════════════════ Page ════════════════════════ */

export default function ComptePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  // ── État TIPSTER ──
  const [tipster, setTipster] = useState<TipsterProfile | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [dailyNote, setDailyNote] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [noteIsError, setNoteIsError] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileIsError, setProfileIsError] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── État USER (abonnements + achats) ──
  // `null` = pas encore chargé / non applicable, `[]` = chargé vide.
  const [subscriptions, setSubscriptions] = useState<
    SubscriptionWithTipster[] | null
  >(null);

  // ── Redirects ──
  // Déconnecté → /. Admin → /admin (cf. brief §2, admin n'a pas de Mon
  // Compte, juste un panel /admin). Tipster et User : ils restent ici.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin");
    }
  }, [user, loading, router]);

  // ── Fetch profil TIPSTER ──
  // Guard fetchLoading conservée (cf. compte-page-audit.md §8 piège 1) :
  // pour USER/ADMIN, on coupe le spinner immédiatement, sinon il tourne
  // à vie.
  useEffect(() => {
    if (!user) return;
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

  // ── Fetch abonnements USER ──
  // Uniquement pour les rôles USER (les TIPSTER ont aussi une vue
  // d'éditeur, on ne mélange pas). Si ADMIN arrive ici, l'effet
  // redirect ci-dessus le pousse vers /admin avant que le fetch ait
  // lieu — mais on garde le early-return par sécurité.
  useEffect(() => {
    if (!user) return;
    if (user.role !== "USER") {
      setSubscriptions(null);
      return;
    }
    apiGet<SubscriptionWithTipster[]>("/subscriptions/me")
      .then(setSubscriptions)
      .catch(() => setSubscriptions([]));
  }, [user]);

  /* ── Handlers TIPSTER — logique V1 conservée à l'identique ── */

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
      const data = await apiPatch<TipsterProfile>("/tipsters/me", {
        dailyNote,
      });
      // State optimiste V1 : merge le payload retourné dans le tipster
      // courant sans re-fetch complet.
      setTipster((prev) =>
        prev ? { ...prev, dailyNote: data.dailyNote } : prev,
      );
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
      const data = await apiPatch<TipsterProfile>("/tipsters/me", {
        pseudo,
        bio,
        sports,
      });
      setTipster((prev) =>
        prev
          ? {
              ...prev,
              pseudo: data.pseudo,
              bio: data.bio,
              sports: data.sports,
            }
          : prev,
      );
      setProfileMsg("Profil mis à jour");
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Erreur");
      setProfileIsError(true);
    } finally {
      setProfileSaving(false);
    }
  }

  /* ── Rendering branches ── */

  // Loading initial — session non encore résolue, ou redirects transient.
  if (loading || !user || user.role === "ADMIN") {
    return <Spinner />;
  }

  // Vue TIPSTER : éditeur de profil.
  if (user.role === "TIPSTER") {
    if (fetchLoading) return <Spinner />;
    return (
      <TipsterView
        pseudo={pseudo}
        bio={bio}
        sports={sports}
        dailyNote={dailyNote}
        noteMsg={noteMsg}
        noteIsError={noteIsError}
        noteSaving={noteSaving}
        profileMsg={profileMsg}
        profileIsError={profileIsError}
        profileSaving={profileSaving}
        onPseudoChange={setPseudo}
        onBioChange={setBio}
        onDailyNoteChange={setDailyNote}
        onToggleSport={toggleSport}
        onSubmitProfile={handleProfile}
        onSubmitNote={handleDailyNote}
      />
    );
  }

  // Vue USER : abonnements + achats.
  return <UserView subscriptions={subscriptions} />;
}

/* ════════════════════════ Vue TIPSTER ════════════════════════ */

interface TipsterViewProps {
  pseudo: string;
  bio: string;
  sports: string[];
  dailyNote: string;
  noteMsg: string;
  noteIsError: boolean;
  noteSaving: boolean;
  profileMsg: string;
  profileIsError: boolean;
  profileSaving: boolean;
  onPseudoChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onDailyNoteChange: (v: string) => void;
  onToggleSport: (s: string) => void;
  onSubmitProfile: () => void;
  onSubmitNote: () => void;
}

const DAILY_NOTE_MAX = 200;

function TipsterView(props: TipsterViewProps) {
  const noteCount = props.dailyNote.length;
  // Compteur visuel : vert/blanc tant qu'on est loin du max, doré quand
  // on approche (~80 %), rouge quand on dépasse (maxLength HTML
  // l'empêche, mais on garde la couleur pour défense en profondeur).
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
          <h2 className="font-display text-h3 text-foreground">
            Note quotidienne
          </h2>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Visible sur votre profil et la page d&apos;accueil. Teasez vos
            sélections du jour.
          </p>

          <div className="mt-6 space-y-2">
            <textarea
              className={textareaCls}
              placeholder="Aujourd'hui focus Ligue 1 et Tennis — gros combo en vue"
              value={props.dailyNote}
              onChange={(e) => props.onDailyNoteChange(e.target.value)}
              maxLength={DAILY_NOTE_MAX}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <span className={cn("font-body text-body-16", noteColorCls)}>
                {noteCount}/{DAILY_NOTE_MAX}
              </span>
              {props.noteMsg && (
                <span
                  role="status"
                  className={cn(
                    "font-body text-body-16",
                    props.noteIsError ? "text-destructive" : "text-accent",
                  )}
                >
                  {props.noteMsg}
                </span>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={props.onSubmitNote}
            disabled={props.noteSaving}
            className="mt-6 w-full sm:w-auto"
          >
            {props.noteSaving ? "Enregistrement…" : "Mettre à jour"}
          </Button>
        </section>

        {/* ─── Section 2 : Profil ─── */}
        <section className={cn(cardCls, "p-6 md:p-8")}>
          <h2 className="font-display text-h3 text-foreground">Profil</h2>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Ton pseudo, ta bio, les sports que tu couvres.
          </p>

          <div className="mt-6 space-y-6">
            {/* Pseudo */}
            <div className="space-y-2">
              <Label htmlFor="pseudo" className={labelCls}>
                Pseudo <span className="text-accent">*</span>
              </Label>
              <input
                id="pseudo"
                type="text"
                value={props.pseudo}
                onChange={(e) => props.onPseudoChange(e.target.value)}
                className={fieldCls}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className={labelCls}>
                Bio
              </Label>
              <textarea
                id="bio"
                placeholder="Expert Football & Tennis — Analyses pointues"
                value={props.bio}
                onChange={(e) => props.onBioChange(e.target.value)}
                rows={5}
                className={textareaCls}
              />
            </div>

            {/* Sports — chips toggle multi-select (pattern /devenir-tipster) */}
            <div className="space-y-2">
              <Label className={labelCls}>
                Sports couverts <span className="text-accent">*</span>
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(SPORT_LABELS).map(([key, label]) => {
                  const isActive = props.sports.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => props.onToggleSport(key)}
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
              onClick={props.onSubmitProfile}
              disabled={props.profileSaving}
              className="w-full sm:w-auto"
            >
              {props.profileSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>

            {props.profileMsg && (
              <p
                role="status"
                className={cn(
                  "font-body text-body-16",
                  props.profileIsError ? "text-destructive" : "text-accent",
                )}
              >
                {props.profileMsg}
              </p>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

/* ════════════════════════ Vue USER ════════════════════════ */

function UserView({
  subscriptions,
}: {
  subscriptions: SubscriptionWithTipster[] | null;
}) {
  // Loading initial du fetch /subscriptions/me — pendant ce temps on
  // affiche un spinner plutôt que des sections vides flash.
  if (subscriptions === null) {
    return <Spinner />;
  }

  // Split par type : abonnements mensuels vs achats ponctuels (day-passes).
  const monthly = subscriptions.filter((s) => s.type === "MONTHLY");
  const dayPasses = subscriptions.filter((s) => s.type === "DAY_PASS");

  // Sub-split abonnements : actifs / expirés (CANCELLED tombent en expirés).
  const monthlyActive = monthly.filter(isActiveSubscription);
  const monthlyExpired = monthly.filter((s) => !isActiveSubscription(s));

  return (
    <PageShell
      title="Mon compte"
      subtitle="Tes abonnements et achats sur Plarya."
    >
      <div className="space-y-12">
        {/* ─── Section 1 : Mes abonnements ─── */}
        <section>
          <h2 className="font-display text-h3 text-foreground">
            Mes abonnements
          </h2>

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

          {/* Mention résiliation discrète si au moins un abonnement actif.
              Pas de bouton/portal Stripe en V1 (cf. brief §"PAS DE
              RESILIATION D'ABONNEMENT côté UI pour cette version"). */}
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

        {/* ─── Section 2 : Mes achats ponctuels ─── */}
        <section>
          <h2 className="font-display text-h3 text-foreground">
            Mes achats ponctuels
          </h2>

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
    </PageShell>
  );
}

/* ── Card abonnement mensuel ── */

function SubscriptionCard({
  sub,
  active,
}: {
  sub: SubscriptionWithTipster;
  active: boolean;
}) {
  return (
    <article className={cn(cardCls, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <TipsterAvatar tipster={sub.tipster} />

          <div className="min-w-0 flex-1">
            <Link
              href={`/tipsters/${sub.tipsterId}`}
              className="font-display text-h5 text-foreground transition-colors hover:text-accent"
            >
              {sub.tipster.pseudo}
            </Link>
            <p className="mt-1 font-body text-body-16 text-foreground">
              Abonnement mensuel
            </p>
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

/* ── Card achat ponctuel ── */

function DayPassCard({ sub }: { sub: SubscriptionWithTipster }) {
  return (
    <article className={cn(cardCls, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <TipsterAvatar tipster={sub.tipster} />

          <div className="min-w-0 flex-1">
            <Link
              href={`/tipsters/${sub.tipsterId}`}
              className="font-display text-h5 text-foreground transition-colors hover:text-accent"
            >
              {sub.tipster.pseudo}
            </Link>
            <p className="mt-1 font-body text-body-16 text-foreground">
              Accès à la journée
            </p>
            <p className="mt-1 font-body text-body-16 text-muted-foreground">
              Acheté le {formatDate(sub.createdAt)}
            </p>
          </div>
        </div>

        <span className="shrink-0 font-display text-h5 text-accent">
          3,50€
        </span>
      </div>
    </article>
  );
}

/* ── Avatar tipster réutilisable (cards abonnement/day-pass) ── */

function TipsterAvatar({
  tipster,
}: {
  tipster: SubscriptionWithTipster["tipster"];
}) {
  if (tipster.photoUrl) {
    return (
      <Image
        src={tipster.photoUrl}
        alt={tipster.pseudo}
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full object-cover ring-1 ring-accent/40"
      />
    );
  }
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-elevated font-display text-h5 text-accent ring-1 ring-accent/40">
      {tipster.pseudo.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Badge statut ── */

function StatusBadge({ active }: { active: boolean }) {
  // Couleurs explicites : vert success pour ACTIVE (pas de token DS
  // success défini, on utilise Tailwind green-500), gris muted pour
  // EXPIRED — cohérent avec le brief §"Statut".
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center rounded-full px-3 py-1 font-body text-body-16",
        active
          ? "bg-green-500/20 text-green-500"
          : "bg-muted-foreground/20 text-muted-foreground",
      )}
    >
      {active ? "Actif" : "Expiré"}
    </span>
  );
}

/* ── État vide DS ── */

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
    <div
      className={cn(
        cardCls,
        "mt-6 flex flex-col items-center gap-4 px-6 py-10 text-center",
      )}
    >
      <p className="font-body text-body-16 text-foreground">{message}</p>
      <p className="font-body text-body-16 text-muted-foreground">{hint}</p>
      <Button
        variant="secondary"
        size="lg"
        render={<Link href={cta.href} />}
        className="mt-2"
      >
        {cta.label}
      </Button>
    </div>
  );
}
