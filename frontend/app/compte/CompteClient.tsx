"use client";

import { useState, type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { ConfidentialitySection } from "@/components/account/confidentiality-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
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
  initialExpertProfile: ExpertProfile | null;
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

// Divider neutre — séparateur fin entre lignes de l'historique.
// Anciennement gradient doré, neutralisé en ménage 3B (aucun doré
// sur l'historique).
const DIVIDER_NEUTRAL_GRADIENT =
  "linear-gradient(to right, transparent 0%, var(--color-surface-elevated) 51%, transparent 100%)";

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

/* ════════════════════════ Vue EXPERT (inchangée) ════════════════════════ */

const DAILY_NOTE_MAX = 200;

function ExpertPageShell({
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
      <h1 className="font-body text-[28px] font-bold leading-none text-foreground md:text-[32px]">
        {title}
      </h1>
      {subtitle && <p className="mt-3 font-body text-body-16 text-muted-foreground">{subtitle}</p>}
      <div className="mt-10">{children}</div>
    </div>
  );
}

function ExpertView({ initial }: { initial: ExpertProfile }) {
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
  // Compteur de chars : destructive si dépasse, foreground (blanc)
  // proche de la limite (80 %), muted sinon. Anciennement doré au
  // seuil 80 % — anti-pattern doré sur un état "warning approche".
  const noteColorCls =
    noteCount > DAILY_NOTE_MAX
      ? "text-destructive"
      : noteCount >= DAILY_NOTE_MAX * 0.8
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <ExpertPageShell
      title="Mon compte"
      subtitle="Modifie tes informations de profil et ta note quotidienne."
    >
      <div className="space-y-10">
        <section className={cn(cardCls, "p-6 md:p-8")}>
          <h2 className="font-body text-h5 font-bold text-foreground md:text-[24px]">
            Note quotidienne
          </h2>
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
                    noteIsError ? "text-destructive" : "text-foreground",
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

        <section className={cn(cardCls, "p-6 md:p-8")}>
          <h2 className="font-body text-h5 font-bold text-foreground md:text-[24px]">Profil</h2>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Ton pseudo, ta bio, les sports que tu couvres.
          </p>

          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pseudo" className={labelCls}>
                Pseudo <span className="text-muted-foreground">*</span>
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
                Sports couverts <span className="text-muted-foreground">*</span>
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
                        // Sélectionné neutre (border + bg blancs subtils) —
                        // règle /compte 3B : aucun doré sur les chips
                        // sport. L'état actif est porté par le bg
                        // + la bordure plus marquées.
                        isActive
                          ? "border-foreground bg-white/[0.06] text-foreground"
                          : "border-surface-elevated bg-black/40 text-foreground hover:border-foreground/30",
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
                  profileIsError ? "text-destructive" : "text-foreground",
                )}
              >
                {profileMsg}
              </p>
            )}
          </div>
        </section>
      </div>

      <ConfidentialitySection />
    </ExpertPageShell>
  );
}

/* ════════════════════════ Vue USER — refonte ════════════════════════ */

function UserView({ subscriptions }: { subscriptions: SubscriptionWithExpert[] }) {
  const { user } = useUser();

  const monthlyActive = subscriptions.filter(
    (s) => s.type === "MONTHLY" && isActiveSubscription(s),
  );
  const monthlyExpired = subscriptions.filter(
    (s) => s.type === "MONTHLY" && !isActiveSubscription(s),
  );
  const dayPasses = subscriptions.filter((s) => s.type === "DAY_PASS");

  // Historique = day-passes + abos expirés, tri chrono desc (plus
  // récent en premier). Séparé des abos actifs pour clarté visuelle.
  const history = [...dayPasses, ...monthlyExpired].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // KPI "Sports suivis" : sports uniques agrégés depuis tous les experts
  // suivis (subs + day-passes). Donne une touche perso, plus parlant
  // que "Total dépensé" qui aurait un ton guilt-inducing.
  const uniqueSports = new Set<string>();
  subscriptions.forEach((s) => s.expert.sports.forEach((sp) => uniqueSports.add(sp)));

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8 md:px-6 md:py-14">
      <IdentityHeader
        email={user?.email ?? ""}
        activeCount={monthlyActive.length}
        dayPassCount={dayPasses.length}
        sportsCount={uniqueSports.size}
      />

      {/* ─── Abonnements actifs ─── */}
      <section className="mt-12 md:mt-16">
        <AccountSectionTitle title="Abonnements actifs" />

        {monthlyActive.length === 0 ? (
          <EmptyState
            message="Aucun abonnement actif"
            hint="Trouve un expert qui te correspond et abonne-toi pour suivre toutes ses analyses sur la durée."
            cta={{ label: "Découvrir les experts", href: "/" }}
          />
        ) : (
          <div className="mt-6 space-y-4">
            {monthlyActive.map((sub) => (
              <ActiveSubscriptionCard key={sub.id} sub={sub} />
            ))}
          </div>
        )}

        {/* TODO V2 : bouton de résiliation in-app + endpoint backend
            DELETE /subscriptions/:id. Pour le MVP, on garde l'opt-out
            par email (mention discrète volontaire — pas un CTA). */}
        {monthlyActive.length > 0 && (
          <p className="mt-6 font-body text-body-16 text-muted-foreground">
            Pour résilier un abonnement, écris-nous à{" "}
            <a
              href="mailto:contact@plarya.com"
              className="text-foreground transition-colors hover:underline underline-offset-4"
            >
              contact@plarya.com
            </a>
            .
          </p>
        )}
      </section>

      {/* ─── Historique ─── */}
      <section className="mt-12 md:mt-16">
        <AccountSectionTitle title="Historique" />

        {history.length === 0 ? (
          <EmptyState
            message="Aucun achat pour le moment"
            hint="Tes accès journée et abonnements terminés s'afficheront ici."
            cta={{ label: "Voir les experts", href: "/" }}
          />
        ) : (
          // Liste unique sans card-per-row : une grande surface avec
          // des dividers dorés discrets entre items (= pattern de
          // l'ExpertCard). Plus "dashboard" mais plus calme qu'un
          // tableau classique.
          <div className={cn(cardCls, "mt-6 overflow-hidden")}>
            {history.map((sub, i) => (
              <div key={sub.id}>
                <HistoryRow sub={sub} />
                {i < history.length - 1 && (
                  <div
                    aria-hidden
                    className="mx-5 h-px opacity-30 md:mx-6"
                    style={{ backgroundImage: DIVIDER_NEUTRAL_GRADIENT }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Confidentialité & données (ex-DangerZone) ─── */}
      <ConfidentialitySection />
    </div>
  );
}

/* ════════════════════════ Building blocks USER view ════════════════════════ */

interface IdentityHeaderProps {
  email: string;
  activeCount: number;
  dayPassCount: number;
  sportsCount: number;
}

function IdentityHeader({ email, activeCount, dayPassCount, sportsCount }: IdentityHeaderProps) {
  // Initiale de fallback. Email vide possible si useUser pas encore
  // résolu — on rend une initiale "—" plutôt qu'une chaîne vide.
  const initial = email.charAt(0).toUpperCase() || "—";

  // Ligne descriptive en prose — remplace les 3 KPI cards verticaux
  // (pattern "dashboard vanity stats" qui faisait IA-generated).
  // Chaque item n'apparaît que s'il a une valeur > 0 → ligne adaptative
  // selon le profil utilisateur. Fallback si tout est à 0 = un user qui
  // arrive sur /compte sans aucun achat (cas marginal, mais évite une
  // ligne vide qui ferait bizarre).
  const summaryParts: string[] = [];
  if (activeCount > 0) {
    summaryParts.push(`${activeCount} abonnement${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""}`);
  }
  if (dayPassCount > 0) {
    summaryParts.push(`${dayPassCount} achat${dayPassCount > 1 ? "s" : ""} au total`);
  }
  if (sportsCount > 0) {
    summaryParts.push(`${sportsCount} sport${sportsCount > 1 ? "s" : ""} suivi${sportsCount > 1 ? "s" : ""}`);
  }
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "Aucun achat pour l'instant";

  return (
    <header className={cn(cardCls, "relative overflow-hidden p-6 md:p-8")}>
      {/* Glow doré subtil top-left : casse la platitude du fond noir
          sans alourdir. Inspiré du fond ambient gold du body global. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/[0.03] blur-3xl"
      />

      <div className="relative flex items-center gap-5 md:gap-6">
        {/* Avatar initiale neutre — l'eyebrow "MON COMPTE" + l'email
            suffisent à identifier la page, pas besoin d'un avatar
            doré décoratif. */}
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-elevated font-body text-[28px] font-bold text-foreground md:size-20 md:text-[32px]">
          {initial}
        </div>

        {/* Identité — eyebrow MON COMPTE, email, et ligne descriptive
            en prose sous l'email (vs ancien layout 3-KPIs vertical à
            droite qui faisait "dashboard IA"). */}
        <div className="min-w-0 flex-1">
          <p className="font-body text-body-16 uppercase tracking-[0.15em] text-muted-foreground">
            Mon compte
          </p>
          <p className="mt-1 truncate font-body text-[22px] font-bold text-foreground md:text-[28px]">
            {email}
          </p>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">{summary}</p>
        </div>
      </div>
    </header>
  );
}

function AccountSectionTitle({ title }: { title: string }) {
  // Pas de compteur entre parenthèses (pattern "dashboard IA"). Le
  // nombre d'items est immédiatement visible dans la liste qui suit
  // le titre — afficher "(N)" en redondance fait sur-traduit / machine.
  return (
    <div className="flex items-baseline gap-3">
      <span aria-hidden className="block h-7 w-px self-center bg-foreground" />
      <h2 className="font-body text-[22px] font-bold text-foreground md:text-[24px]">{title}</h2>
    </div>
  );
}

// Durée d'un cycle de facturation mensuel (en ms). Source de vérité
// pour la barre de progression d'abonnement : elle reflète le CYCLE
// COURANT (= 30 derniers jours avant `expiresAt`), pas la durée totale
// depuis le 1er abonnement. Sans ça, un user qui s'est abonné il y a
// 6 mois verrait sa barre à 95 % alors qu'il vient juste de renouveler.
const CYCLE_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function ActiveSubscriptionCard({ sub }: { sub: SubscriptionWithExpert }) {
  // Calcul "temps restant dans le cycle courant" :
  //   cycleStart = expiresAt - 30 jours
  //   remaining = max(0, expiresAt - now)
  //   widthPct = (remaining / CYCLE_MS) * 100  → 100 % en début de cycle,
  //                                              0 % à l'expiration
  // Ne se base PAS sur createdAt (qui peut être 6 mois en arrière pour
  // un abo renouvelé plusieurs fois) → bug précédent où la barre paraissait
  // toujours pleine.
  const end = new Date(sub.expiresAt).getTime();
  // Date.now() au render = impur (lint warning) mais accepté ici :
  // la barre de progression est cosmétique, une variation au re-render
  // (ms d'écart) est invisible. Pas de useEffect/state nécessaire.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const remainingMs = Math.max(0, end - now);
  const remainingPct = Math.min(100, (remainingMs / CYCLE_MS) * 100);
  const daysLeft = Math.max(0, Math.ceil(remainingMs / ONE_DAY_MS));

  // Couleur de la barre selon l'urgence (s'aligne avec le wording
  // "X jours restants"). > 7 jours = doré (status nominal), 4-7 = amber
  // (heads-up), ≤ 3 = destructive (alerte). La sémantique va dans le
  // sens du shrink de la barre : moins de temps → couleur plus chaude.
  let barColorCls = "bg-gradient-gold";
  if (daysLeft <= 3) barColorCls = "bg-destructive";
  else if (daysLeft <= 7) barColorCls = "bg-amber-500";

  return (
    <article
      className={cn(
        cardCls,
        "group relative overflow-hidden p-5 transition-all duration-300 md:p-6",
        "hover:border-foreground/20",
      )}
    >
      <div className="flex items-center gap-4">
        <ExpertAvatar expert={sub.expert} />

        <div className="min-w-0 flex-1">
          {/* Pseudo seul — pas d'éclair décoratif (était du bruit visuel
              sans signification métier, retiré pour la finition anti-IA). */}
          <Link
            href={`/experts/${sub.expertId}`}
            className="block truncate font-body text-h5 text-foreground transition-colors hover:underline underline-offset-4"
          >
            {sub.expert.pseudo}
          </Link>
          <p className="mt-1 font-body text-body-16 text-muted-foreground">
            Abonnement mensuel · {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant
            {daysLeft > 1 ? "s" : ""}
          </p>
        </div>

        <p className="hidden shrink-0 font-body text-body-16 text-muted-foreground sm:block">
          Échéance {formatDate(sub.expiresAt)}
        </p>
      </div>

      {/* Barre de "temps restant" — épaisseur 4px (au lieu de 3px,
          un poil + visible), track surface-elevated/40 pour le contraste,
          fill couleur selon urgence (doré → amber → red). La barre
          rétrécit au fil du cycle : 100 % juste après renouvellement,
          0 % à expiration. */}
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface-elevated/40">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColorCls)}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
    </article>
  );
}

function HistoryRow({ sub }: { sub: SubscriptionWithExpert }) {
  const isMonthly = sub.type === "MONTHLY";
  return (
    <div className="flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.02] md:px-6 md:py-5">
      <ExpertAvatar expert={sub.expert} size="sm" />

      <div className="min-w-0 flex-1">
        <Link
          href={`/experts/${sub.expertId}`}
          className="truncate font-body text-body-18 text-foreground transition-colors hover:underline underline-offset-4"
        >
          {sub.expert.pseudo}
        </Link>
        <p className="font-body text-body-16 text-muted-foreground">
          {isMonthly ? `Mensuel · ${formatPeriod(sub.createdAt, sub.expiresAt)}` : `Journée · ${formatDate(sub.createdAt)}`}
        </p>
      </div>

      <p className="shrink-0 font-body text-body-18 text-foreground">
        {isMonthly ? "29€" : "3,50€"}
      </p>
    </div>
  );
}

function ExpertAvatar({
  expert,
  size = "md",
}: {
  expert: SubscriptionWithExpert["expert"];
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? 40 : 48;
  const sizeCls = size === "sm" ? "size-10" : "size-12";
  if (expert.photoUrl) {
    return (
      <Image
        src={expert.photoUrl}
        alt={expert.pseudo}
        width={dim}
        height={dim}
        className={cn(sizeCls, "shrink-0 rounded-full object-cover")}
      />
    );
  }
  // Avatar fallback neutre — ex `ring-accent/40 text-accent` retiré
  // (anti-pattern : 10 avatars en série historique = série dorée
  // verticale, doré purement décoratif sans signal métier).
  return (
    <div
      className={cn(
        sizeCls,
        "flex shrink-0 items-center justify-center rounded-full bg-surface-elevated font-body text-h5 font-bold text-foreground",
      )}
    >
      {expert.pseudo.charAt(0).toUpperCase()}
    </div>
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
    <div
      className={cn(
        cardCls,
        "relative mt-6 flex flex-col items-center gap-4 overflow-hidden px-6 py-12 text-center",
      )}
    >
      {/* Glow doré ambient — même pattern que IdentityHeader.
          Donne un peu de présence à l'état vide sans crier "ajoute-moi
          un illustration". */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl"
      />
      <p className="relative font-body text-h5 text-foreground">{message}</p>
      <p className="relative max-w-md font-body text-body-16 text-muted-foreground">{hint}</p>
      <Button
        variant="secondary"
        size="lg"
        render={<Link href={cta.href} />}
        className="relative mt-2"
      >
        {cta.label}
      </Button>
    </div>
  );
}
