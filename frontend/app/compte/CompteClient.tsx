"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { ConfidentialitySection } from "@/components/account/confidentiality-section";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { apiPatch } from "@/lib/api";
import type { CompteUserRole, ExpertProfile, SubscriptionWithExpert } from "@/lib/types/account";
import { SPORT_LABELS, stripSportEmoji } from "@/lib/constants";
import {
  formDaCardCls,
  formDaInputCls,
  formDaLabelCls,
  formDaTextareaCls,
} from "@/lib/form-da";
import { cn } from "@/lib/utils";

/* ════════════════════════ Types ════════════════════════ */

interface CompteClientProps {
  role: CompteUserRole;
  initialExpertProfile: ExpertProfile | null;
  initialSubscriptions: SubscriptionWithExpert[] | null;
}

/* ════════════════════════ Styles partagés ════════════════════════ */

// UserView card token (historique) — conservé pour les sections
// IdentityHeader / ActiveSubscription / History / EmptyState qui
// continuent d'utiliser ce style. Les sections expert (Note quotidienne
// + Profil expert) sont sur la DA "form publication" plus bas.
const cardCls = "rounded-2xl border border-surface-elevated bg-black/40";


// Divider neutre — séparateur fin entre lignes de l'historique.
// Anciennement gradient doré, neutralisé (aucun doré sur
// l'historique).
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

/* ════════════════════════ Vue EXPERT — refonte DA UserView ════════════════════════ */

const DAILY_NOTE_MAX = 200;

function ExpertView({ initial }: { initial: ExpertProfile }) {
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
  // Compteur de chars : destructive si dépasse, foreground (blanc)
  // proche de la limite (80 %), muted sinon.
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
            {/* Compteur de chars — bottom-right du textarea (pattern
                cohérent avec le compteur de mots du form d'analyse). */}
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

          {/* Button primary rectangulaire (DA gold solide partagée avec
              "Continuer →" et "Publier l'analyse" du form publication). */}
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
              {/* Surtitre non-label : les "champs" sont une liste de
                  toggle buttons (chacun avec son aria-pressed et son
                  texte accessible). Un <label> ne s'attache à aucun
                  contrôle unique → on utilise <span>. */}
              <span className={formDaLabelCls}>
                Sports couverts <span className="text-muted-foreground">*</span>
              </span>
              {/* Tags inline éditoriaux — cohérence avec /devenir-expert
                  (FIX 2 de la session). + muted → ✓ accent + underline. */}
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
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
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

            {/* Button primary — désormais rectangulaire par défaut
                (cf. Button base variant) → plus besoin d'override. */}
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

interface ExpertIdentityHeaderProps {
  pseudo: string;
  email: string;
  sportsCount: number;
  hasDailyNote: boolean;
}

function ExpertIdentityHeader({
  pseudo,
  email,
  sportsCount,
  hasDailyNote,
}: ExpertIdentityHeaderProps) {
  // Initiale du pseudo (vs initiale email côté user) — l'expert a une
  // identité publique, mettre en avant son pseudo plutôt que son email.
  const initial = pseudo.charAt(0).toUpperCase() || "—";

  // Ligne descriptive en prose — pattern identique à IdentityHeader user.
  // Items conditionnels : seul ce qui a une valeur > 0 / true apparaît.
  const summaryParts: string[] = ["Compte expert"];
  if (sportsCount > 0) {
    summaryParts.push(`${sportsCount} sport${sportsCount > 1 ? "s" : ""} couvert${sportsCount > 1 ? "s" : ""}`);
  }
  summaryParts.push(hasDailyNote ? "Note quotidienne active" : "Aucune note du jour");
  const summary = summaryParts.join(" · ");

  return (
    <header className={cn(cardCls, "relative overflow-hidden p-6 md:p-8")}>
      {/* Glow blanc subtil top-left — même pattern que IdentityHeader user. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/[0.03] blur-3xl"
      />

      {/* Layout : centré horizontalement sur mobile, horizontal aligné
          gauche à partir de sm. */}
      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left md:gap-6">
        {/* Avatar initiale doré — exception sémantique pour signaler le
            statut Expert. Le badge "EXPERT" textuel n'est pas nécessaire
            (l'eyebrow MON COMPTE EXPERT remplit ce rôle). */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-body text-[24px] font-bold text-accent sm:size-16 sm:text-[28px] md:size-20 md:text-[32px]">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body text-body-16 uppercase tracking-[0.15em] text-muted-foreground">
            Mon compte expert
          </p>
          <p className="mt-1 truncate font-body text-[20px] font-bold text-foreground sm:text-[22px] md:text-[28px]">
            {pseudo}
          </p>
          <p className="mt-2 truncate font-body text-body-16 text-muted-foreground">{email}</p>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">{summary}</p>
        </div>
      </div>
    </header>
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

      {/* Layout : centré horizontalement sur mobile (avatar au-dessus,
          textes centrés en dessous), horizontal aligné gauche à
          partir de sm (640px+). */}
      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left md:gap-6">
        {/* Avatar initiale neutre — l'eyebrow "MON COMPTE" + l'email
            suffisent à identifier la page, pas besoin d'un avatar
            doré décoratif. Taille graduée mobile/desktop. */}
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-elevated font-body text-[24px] font-bold text-foreground sm:size-16 sm:text-[28px] md:size-20 md:text-[32px]">
          {initial}
        </div>

        {/* Identité — eyebrow MON COMPTE, email, et ligne descriptive
            en prose. min-w-0 pour permettre le truncate sur les emails
            longs. */}
        <div className="min-w-0 flex-1">
          <p className="font-body text-body-16 uppercase tracking-[0.15em] text-muted-foreground">
            Mon compte
          </p>
          <p className="mt-1 truncate font-body text-[20px] font-bold text-foreground sm:text-[22px] md:text-[28px]">
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
        size="md"
        render={<Link href={cta.href} />}
        className="relative mt-2"
      >
        {cta.label}
      </Button>
    </div>
  );
}
