"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TEASING_OPTIONS, TEASING_LABELS } from "@/lib/constants";
import { formatStartTime } from "@/lib/date";
import {
  getLeaguesGroupedBySport,
  getSportLabel,
  getLeague,
} from "@/lib/sports";
import { Icon } from "@iconify/react";

interface TipsterProfile {
  id: string;
  pseudo: string;
  winRate: number;
  streak: number;
  streakBadge: string;
  pronosToday: number;
}

interface Prono {
  id: string;
  matchName: string;
  league: string | null;
  pick: string;
  odds: number;
  teasing: string;
  argument: string | null;
  result: "PENDING" | "WON" | "LOST";
  startTime: string;
  isFeatured: boolean;
  createdAt: string;
}

interface Bookmaker {
  id: string;
  name: string;
  logoUrl: string | null;
  affiliateLinks: { id: string; url: string; label: string | null }[];
}

interface FieldErrors {
  matchName?: string;
  pick?: string;
  odds?: string;
  teasing?: string;
  startTime?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<TipsterProfile | null>(null);
  const [pronos, setPronos] = useState<Prono[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [matchName, setMatchName] = useState("");
  const [league, setLeague] = useState("");
  const [pick, setPick] = useState("");
  const [odds, setOdds] = useState("");
  const [teasing, setTeasing] = useState("");
  const [argument, setArgument] = useState("");
  const [startTime, setStartTime] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [bookmakerOdds, setBookmakerOdds] = useState<Record<string, string>>(
    {},
  );

  const fetchData = useCallback(async () => {
    try {
      const [profileData, pronosData, bookmakersData] = await Promise.all([
        apiGet<TipsterProfile>("/tipsters/me"),
        apiGet<Prono[]>("/pronos/mine"),
        apiGet<Bookmaker[]>("/bookmakers"),
      ]);
      setProfile(profileData);
      setPronos(pronosData);
      setBookmakers(bookmakersData);
    } catch {
      /* redirect */
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "TIPSTER" && user.role !== "ADMIN")) {
      router.push("/");
      return;
    }
    fetchData();
  }, [user, loading, router, fetchData]);

  function buildStartDate(time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  function validateForm(): boolean {
    const errors: FieldErrors = {};
    if (!matchName.trim()) errors.matchName = "Le match est requis";
    if (!pick.trim()) errors.pick = "Le pick est requis";
    if (!odds || parseFloat(odds) <= 0)
      errors.odds = "La cote doit être positive";
    if (!teasing) errors.teasing = "Le teasing est requis";
    if (!startTime) {
      errors.startTime = "L'heure de début est requise";
    } else if (buildStartDate(startTime) <= new Date()) {
      errors.startTime = "L'heure de début doit être dans le futur";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handlePublish(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const bmOddsPayload = Object.entries(bookmakerOdds)
        .filter(([, val]) => val && parseFloat(val) > 0)
        .map(([bookmakerId, val]) => ({ bookmakerId, odds: parseFloat(val) }));
      const newProno = await apiPost<Prono>("/pronos", {
        matchName,
        league: league || undefined,
        pick,
        odds: parseFloat(odds),
        teasing,
        argument: argument || undefined,
        startTime: buildStartDate(startTime).toISOString(),
        isFeatured,
        ...(bmOddsPayload.length > 0 ? { bookmakerOdds: bmOddsPayload } : {}),
      });
      setPronos((prev) => [newProno, ...prev]);
      setMatchName("");
      setLeague("");
      setPick("");
      setOdds("");
      setTeasing("");
      setArgument("");
      setStartTime("");
      setIsFeatured(false);
      setBookmakerOdds({});
      setFieldErrors({});
      const updated = await apiGet<TipsterProfile>("/tipsters/me");
      setProfile(updated);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erreur lors de la publication",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResult(pronoId: string, result: "WON" | "LOST") {
    try {
      const updated = await apiPatch<Prono>(`/pronos/${pronoId}/result`, {
        result,
      });
      setPronos((prev) => prev.map((p) => (p.id === pronoId ? updated : p)));
      const profileData = await apiGet<TipsterProfile>("/tipsters/me");
      setProfile(profileData);
    } catch {
      /* silent */
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-[#00D47E]" />
      </div>
    );
  }

  const inputCls =
    "bg-[#080808] border-[#1A1A1A] text-[#F0EDE8] placeholder:text-[#8A8680]/40 focus:border-[#00D47E]/50 focus:ring-1 focus:ring-[#00D47E]/30";

  const leaguesGrouped = getLeaguesGroupedBySport();
  const leagueOptions = Object.entries(leaguesGrouped).flatMap(
    ([sport, leagues]) => leagues.map((l) => ({ sport, league: l })),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      {profile && (
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-dm-serif)] text-4xl sm:text-5xl italic text-[#F0EDE8]">
            {profile.pseudo}
          </h1>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-5">
            <div className="relative overflow-hidden rounded-xl bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icon
                  icon="tabler:target-arrow"
                  className="size-5 text-[#00D47E]"
                />
                <span className="text-xs font-medium uppercase tracking-wider text-[#8A8680]">
                  Réussite
                </span>
              </div>
              <p className="text-3xl font-bold text-[#F0EDE8]">
                {profile.winRate}
                <span className="text-lg text-[#8A8680]">%</span>
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icon icon="tabler:flame" className="size-5 text-[#00D47E]" />
                <span className="text-xs font-medium uppercase tracking-wider text-[#8A8680]">
                  Streak
                </span>
              </div>
              <p className="text-3xl font-bold text-[#F0EDE8]">
                {profile.streak}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icon
                  icon="tabler:calendar-event"
                  className="size-5 text-[#00D47E]"
                />
                <span className="text-xs font-medium uppercase tracking-wider text-[#8A8680]">
                  Aujourd&apos;hui
                </span>
              </div>
              <p className="text-3xl font-bold text-[#F0EDE8]">
                {profile.pronosToday}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Publish form */}
      <div className="mb-10 rounded-xl bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-8">
        <h2 className="text-xl font-semibold text-[#F0EDE8] mb-6">
          Publier une analyse
        </h2>

        <form onSubmit={handlePublish} noValidate className="space-y-5">
          {formError && (
            <div className="rounded-md ring-1 ring-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-400">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="matchName" className="text-[#8A8680]">
                Match *
              </Label>
              <Input
                id="matchName"
                placeholder="PSG - Marseille"
                value={matchName}
                onChange={(e) => {
                  setMatchName(e.target.value);
                  if (fieldErrors.matchName)
                    setFieldErrors((p) => ({ ...p, matchName: undefined }));
                }}
                aria-invalid={!!fieldErrors.matchName}
                className={inputCls}
              />
              {fieldErrors.matchName && (
                <p className="text-xs text-red-400">{fieldErrors.matchName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[#8A8680]">Ligue / Compétition</Label>
              <Select
                value={league}
                onValueChange={(v) =>
                  setLeague(v === "__none__" ? "" : (v ?? ""))
                }
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Aucune / Autre">
                    {league ? getLeague(league)?.name || league : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#0E0E0E] border-[#1A1A1A] text-[#F0EDE8] min-w-[350px]">
                  <SelectItem
                    value="__none__"
                    className="text-[#8A8680] hover:text-[#F0EDE8] focus:bg-[#141414] focus:text-[#F0EDE8]"
                  >
                    Aucune / Autre
                  </SelectItem>
                  {leagueOptions.map(({ sport, league: l }) => (
                    <SelectItem
                      key={l.id}
                      value={l.id}
                      className="text-[#8A8680] hover:text-[#F0EDE8] focus:bg-[#141414] focus:text-[#F0EDE8]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-[#8A8680]/60">
                          {l.country}
                        </span>
                        <span>{l.name}</span>
                        <span className="text-[10px] text-[#8A8680]/40">
                          {getSportLabel(sport)}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pick" className="text-[#8A8680]">
                Pick *
              </Label>
              <Input
                id="pick"
                placeholder="PSG gagne"
                value={pick}
                onChange={(e) => {
                  setPick(e.target.value);
                  if (fieldErrors.pick)
                    setFieldErrors((p) => ({ ...p, pick: undefined }));
                }}
                aria-invalid={!!fieldErrors.pick}
                className={inputCls}
              />
              {fieldErrors.pick && (
                <p className="text-xs text-red-400">{fieldErrors.pick}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="odds" className="text-[#8A8680]">
                Cote *
              </Label>
              <Input
                id="odds"
                type="number"
                step="0.01"
                min="1"
                placeholder="1.85"
                value={odds}
                onChange={(e) => {
                  setOdds(e.target.value);
                  if (fieldErrors.odds)
                    setFieldErrors((p) => ({ ...p, odds: undefined }));
                }}
                aria-invalid={!!fieldErrors.odds}
                className={inputCls}
              />
              {fieldErrors.odds && (
                <p className="text-xs text-red-400">{fieldErrors.odds}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#8A8680]">Teasing *</Label>
            <Select
              value={teasing}
              onValueChange={(v) => {
                setTeasing(v ?? "");
                if (fieldErrors.teasing)
                  setFieldErrors((p) => ({ ...p, teasing: undefined }));
              }}
            >
              <SelectTrigger
                aria-invalid={!!fieldErrors.teasing}
                className={inputCls}
              >
                <SelectValue placeholder="Choisir un teasing">
                  {teasing ? TEASING_LABELS[teasing] : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#0E0E0E] border-[#1A1A1A] text-[#F0EDE8]">
                {TEASING_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-[#8A8680] hover:text-[#F0EDE8] focus:bg-[#141414] focus:text-[#F0EDE8]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.teasing && (
              <p className="text-xs text-red-400">{fieldErrors.teasing}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[#8A8680]">Heure de début du match *</Label>
            <div className="flex items-center gap-3">
              <Select
                value={startTime ? startTime.split(":")[0] : ""}
                onValueChange={(h) => {
                  const m = startTime ? startTime.split(":")[1] || "00" : "00";
                  setStartTime(`${h}:${m}`);
                  if (fieldErrors.startTime)
                    setFieldErrors((p) => ({ ...p, startTime: undefined }));
                }}
              >
                <SelectTrigger className={`w-28 ${inputCls}`}>
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent className="bg-[#0E0E0E] border-[#1A1A1A] text-[#F0EDE8] max-h-52">
                  {Array.from({ length: 24 }, (_, i) =>
                    String(i).padStart(2, "0"),
                  ).map((h) => (
                    <SelectItem
                      key={h}
                      value={h}
                      className="text-[#8A8680] focus:bg-[#141414] focus:text-[#F0EDE8]"
                    >
                      {h}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xl text-[#8A8680]">:</span>
              <Select
                value={startTime ? startTime.split(":")[1] || "00" : ""}
                onValueChange={(m) => {
                  const h = startTime ? startTime.split(":")[0] || "12" : "12";
                  setStartTime(`${h}:${m}`);
                  if (fieldErrors.startTime)
                    setFieldErrors((p) => ({ ...p, startTime: undefined }));
                }}
              >
                <SelectTrigger className={`w-28 ${inputCls}`}>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent className="bg-[#0E0E0E] border-[#1A1A1A] text-[#F0EDE8] max-h-52">
                  {[
                    "00",
                    "05",
                    "10",
                    "15",
                    "20",
                    "25",
                    "30",
                    "35",
                    "40",
                    "45",
                    "50",
                    "55",
                  ].map((m) => (
                    <SelectItem
                      key={m}
                      value={m}
                      className="text-[#8A8680] focus:bg-[#141414] focus:text-[#F0EDE8]"
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldErrors.startTime && (
              <p className="text-xs text-red-400">{fieldErrors.startTime}</p>
            )}
          </div>

          {bookmakers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#8A8680]">
                Cotes bookmakers (optionnel)
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {bookmakers.map((bm) => (
                  <div key={bm.id} className="space-y-1">
                    <p className="text-xs text-[#8A8680]">{bm.name}</p>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="ex: 1.85"
                      value={bookmakerOdds[bm.id] || ""}
                      onChange={(e) =>
                        setBookmakerOdds((prev) => ({
                          ...prev,
                          [bm.id]: e.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="argument" className="text-[#8A8680]">
              Argumentaire
            </Label>
            <Textarea
              id="argument"
              placeholder="Pourquoi ce pick ? (visible après achat)"
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              rows={4}
              className={inputCls}
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              id="isFeatured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="mt-1 size-4 rounded border-[#1A1A1A] accent-[#00D47E]"
            />
            <div>
              <Label htmlFor="isFeatured" className="text-[#8A8680]">
                Marquer comme analyse du jour
              </Label>
              <p className="text-xs text-[#8A8680]/60">
                Une seule analyse peut être mise en avant par jour
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-lg bg-[#F0EDE8] text-sm font-bold text-[#080808] transition-all hover:bg-[#00D47E] disabled:opacity-50"
          >
            {submitting ? "Publication..." : "Publier l'analyse"}
          </button>
        </form>
      </div>

      {/* Pronos list */}
      <div>
        <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl italic text-[#F0EDE8] mb-6">
          Mes analyses ({pronos.length})
        </h2>

        {pronos.length === 0 ? (
          <p className="text-sm text-[#8A8680]">Aucune analyse publiée</p>
        ) : (
          <div className="space-y-4">
            {pronos.map((prono) => (
              <PronoCard key={prono.id} prono={prono} onResult={handleResult} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PronoCard({
  prono,
  onResult,
}: {
  prono: Prono;
  onResult: (id: string, result: "WON" | "LOST") => void;
}) {
  return (
    <div className="rounded-xl bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-6">
      {prono.isFeatured && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs font-semibold text-[#00D47E]">
            ★ Analyse du jour
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-semibold text-[#F0EDE8]">
              {prono.matchName}
            </p>
            {prono.league && (
              <span className="text-sm text-[#8A8680]">
                {getLeague(prono.league)?.name || prono.league}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-base text-[#8A8680]">
            {prono.pick} — @{prono.odds}
          </p>
          <p className="mt-1 text-sm text-[#8A8680]/80">
            {TEASING_LABELS[prono.teasing] || prono.teasing}
          </p>
          {prono.argument && (
            <p className="mt-3 text-sm text-[#8A8680]/60 leading-relaxed">
              {prono.argument}
            </p>
          )}
          <p className="mt-3 text-xs text-[#8A8680]/60">
            {formatStartTime(prono.startTime)} · Publié le{" "}
            {new Date(prono.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="shrink-0">
          {prono.result === "PENDING" ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                onClick={() => onResult(prono.id, "WON")}
              >
                Gagné
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                onClick={() => onResult(prono.id, "LOST")}
              >
                Perdu
              </Button>
            </div>
          ) : (
            <span
              className={`inline-flex rounded-md px-3 py-1.5 text-xs font-medium ${prono.result === "WON" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}
            >
              {prono.result === "WON" ? "Gagné" : "Perdu"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
