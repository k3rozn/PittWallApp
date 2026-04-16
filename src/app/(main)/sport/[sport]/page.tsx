"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpDown,
  CalendarDays,
  Flag,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import EventCard from "@/components/sports/EventCard";
import { LiveBadge } from "@/components/sports/Badges";
import { Button } from "@/components/ui/button";

const SPORT_CONFIG = {
  football: {
    name: "Football",
    emoji: "⚽",
    color: "text-sport-football",
    leagues: [
      { id: "4328", name: "English Premier League" },
      { id: "4335", name: "Spanish La Liga" },
      { id: "4331", name: "Italian Serie A" },
      { id: "4332", name: "German Bundesliga" },
      { id: "4334", name: "French Ligue 1" },
      { id: "4399", name: "UEFA Champions League" },
      { id: "4390", name: "Copa Libertadores" },
    ],
  },
  volleyball: {
    name: "Volleyball",
    emoji: "🏐",
    color: "text-sport-volleyball",
    leagues: [
      { id: "4952", name: "VNL Men" },
      { id: "4953", name: "VNL Women" },
    ],
  },
  f1: {
    name: "Formula 1",
    emoji: "🏎️",
    color: "text-sport-f1",
    leagues: [{ id: "4370", name: "Formula 1" }],
  },
};

type SportSlug = keyof typeof SPORT_CONFIG;

interface Event {
  externalId: string;
  sport: string;
  competition: { id: string; name: string; badge?: string };
  status: string;
  startTime: string;
  homeTeam?: { id: string; name: string; badge?: string };
  awayTeam?: { id: string; name: string; badge?: string };
  score?: { home: number | null; away: number | null; progress?: string };
  raceName?: string;
  circuit?: string;
}

interface Driver {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  teamBadge?: string;
  number?: string;
  nationality?: string;
  thumb?: string;
  dateBorn?: string;
  status?: string;
  position?: string;
}

type DriverSort = "name-asc" | "name-desc" | "number";

function getDriverAge(dateBorn?: string): number | null {
  if (!dateBorn) return null;
  const born = new Date(dateBorn);
  if (Number.isNaN(born.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function SportPage() {
  const { sport } = useParams<{ sport: string }>();
  const config = SPORT_CONFIG[sport as SportSlug] || SPORT_CONFIG.football;
  const isDriversTab = sport === "f1";

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState<DriverSort>("name-asc");

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const apiSport = sport === "f1" ? "motorsport" : sport;
      const res = await fetch(`/api/sports/events?date=${date}&sport=${apiSport}`);
      const data = await res.json();
      setEvents(data.events || []);
    } finally {
      setLoadingEvents(false);
    }
  }, [date, sport]);

  const fetchDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch("/api/sports/drivers");
      const data = await res.json();
      setDrivers(data.drivers || []);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  useEffect(() => {
    if (isDriversTab) return;
    fetchEvents();
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, [fetchEvents, isDriversTab]);

  useEffect(() => {
    if (!isDriversTab) return;
    fetchDrivers();
  }, [fetchDrivers, isDriversTab]);

  const filteredEvents = events.filter((e) =>
    statusFilter === "all" ? true : e.status === statusFilter
  );

  const liveCount = events.filter((e) => e.status === "live").length;

  const teamOptions = useMemo(
    () =>
      Array.from(new Set(drivers.map((d) => d.teamName)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [drivers]
  );

  const filteredDrivers = useMemo(() => {
    const lowerQuery = search.trim().toLowerCase();
    const list = drivers.filter((driver) => {
      const matchesSearch =
        lowerQuery.length === 0 ||
        driver.name.toLowerCase().includes(lowerQuery) ||
        (driver.nationality || "").toLowerCase().includes(lowerQuery) ||
        (driver.number || "").toLowerCase().includes(lowerQuery);

      const matchesTeam =
        teamFilter === "all" ? true : driver.teamName === teamFilter;

      return matchesSearch && matchesTeam;
    });

    return list.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      const numA = Number.parseInt(a.number || "999", 10);
      const numB = Number.parseInt(b.number || "999", 10);
      return numA - numB;
    });
  }, [drivers, search, teamFilter, sortBy]);

  const getDates = () => {
    const dates = [];
    for (let i = -2; i <= 5; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const label =
        i === -1
          ? "Yesterday"
          : i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
      dates.push({ iso, label });
    }
    return dates;
  };

  if (isDriversTab) {
    return (
      <div className="page-enter min-h-[calc(100vh-4rem)] bg-[#0a0e1a] text-white">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_520px_at_8%_-18%,rgba(176,58,46,0.22),transparent_58%),radial-gradient(1200px_560px_at_92%_-15%,rgba(30,41,59,0.48),transparent_62%),linear-gradient(180deg,rgba(10,14,26,0.96),rgba(10,14,26,1))]" />
          <div className="relative flex w-full justify-center px-4 py-6 lg:px-8">
            <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(17,24,39,0.95),rgba(12,18,30,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{config.emoji}</span>
                <div>
                  <h1 className={`font-display text-2xl font-bold ${config.color}`}>
                    Drivers
                  </h1>
                  <p className="text-xs text-white/60">
                    Formula 1 driver lineup
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Temporada atual
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-wider text-white/55">Pilotos</p>
                <p className="mt-1 text-xl font-semibold text-white">{drivers.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-wider text-white/55">Equipes</p>
                <p className="mt-1 text-xl font-semibold text-white">{teamOptions.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-wider text-white/55">Em exibicao</p>
                <p className="mt-1 text-xl font-semibold text-white">{filteredDrivers.length}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar piloto, numero ou nacionalidade"
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/25 pl-10 pr-3 text-sm text-white placeholder:text-white/45 focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div className="mt-3 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/45">
                    <Users size={12} />
                    Equipe
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant={teamFilter === "all" ? "default" : "outline"}
                    onClick={() => setTeamFilter("all")}
                    className={
                      teamFilter === "all"
                        ? "h-8 rounded-full border-primary/45 bg-primary/20 px-3 text-primary hover:bg-primary/25"
                        : "h-8 rounded-full border-white/15 bg-black/20 px-3 text-white/75 hover:bg-black/35 hover:text-white"
                    }
                  >
                    Todas
                  </Button>
                  {teamOptions.map((team) => (
                    <Button
                      key={team}
                      type="button"
                      size="sm"
                      variant={teamFilter === team ? "default" : "outline"}
                      onClick={() => setTeamFilter(team)}
                      className={
                        teamFilter === team
                          ? "h-8 rounded-full border-primary/45 bg-primary/20 px-3 text-primary hover:bg-primary/25"
                          : "h-8 rounded-full border-white/15 bg-black/20 px-3 text-white/75 hover:bg-black/35 hover:text-white"
                      }
                    >
                      {team}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/45">
                    <ArrowUpDown size={12} />
                    Ordenar
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant={sortBy === "name-asc" ? "default" : "outline"}
                    onClick={() => setSortBy("name-asc")}
                    className={
                      sortBy === "name-asc"
                        ? "h-8 rounded-full border-primary/45 bg-primary/20 px-3 text-primary hover:bg-primary/25"
                        : "h-8 rounded-full border-white/15 bg-black/20 px-3 text-white/75 hover:bg-black/35 hover:text-white"
                    }
                  >
                    Nome (A-Z)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sortBy === "name-desc" ? "default" : "outline"}
                    onClick={() => setSortBy("name-desc")}
                    className={
                      sortBy === "name-desc"
                        ? "h-8 rounded-full border-primary/45 bg-primary/20 px-3 text-primary hover:bg-primary/25"
                        : "h-8 rounded-full border-white/15 bg-black/20 px-3 text-white/75 hover:bg-black/35 hover:text-white"
                    }
                  >
                    Nome (Z-A)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sortBy === "number" ? "default" : "outline"}
                    onClick={() => setSortBy("number")}
                    className={
                      sortBy === "number"
                        ? "h-8 rounded-full border-primary/45 bg-primary/20 px-3 text-primary hover:bg-primary/25"
                        : "h-8 rounded-full border-white/15 bg-black/20 px-3 text-white/75 hover:bg-black/35 hover:text-white"
                    }
                  >
                    Numero
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="relative flex w-full justify-center px-4 pb-8 pt-6 lg:px-8">
          <div className="w-full max-w-5xl">
          {loadingDrivers ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-black/25" />
              ))}
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
              <UserRound className="mx-auto mb-3 text-white/40" size={36} />
              <p className="font-medium text-white/80">
                Nenhum piloto encontrado
              </p>
              <p className="mt-1 text-sm text-white/50">
                Ajuste os filtros para ver mais resultados.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDrivers.map((driver) => {
                const age = getDriverAge(driver.dateBorn);
                return (
                  <Link
                    key={driver.id}
                    href={`/player/${driver.id}`}
                    className="card-hover rounded-2xl border border-white/10 bg-[linear-gradient(165deg,rgba(17,24,39,0.95),rgba(12,18,30,0.88))] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.28)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-white/55">
                          {driver.teamName}
                        </p>
                        <h3 className="truncate text-base font-semibold text-white">
                          {driver.name}
                        </h3>
                      </div>
                      <span className="inline-flex h-8 min-w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 px-2 text-sm font-bold text-primary">
                        #{driver.number || "--"}
                      </span>
                    </div>

                    <div className="mb-3 flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-white/15 bg-black/35">
                        {driver.thumb ? (
                          <Image
                            src={driver.thumb}
                            alt={driver.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-sm font-bold text-white/70">
                            {getInitials(driver.name)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-white/60">
                          <Flag size={12} />
                          <span className="truncate">
                            {driver.nationality || "Nationality N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/60">
                          <CalendarDays size={12} />
                          <span>
                            {age !== null ? `${age} anos` : "Idade N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                      <span className="text-xs text-white/50">
                        {driver.position || "Driver"}
                      </span>
                      <span className="text-xs font-medium text-primary/90">
                        Ver perfil
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="border-b border-border bg-gradient-to-b from-surface to-background px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.emoji}</span>
              <div>
                <h1 className={`font-display text-2xl font-bold ${config.color}`}>
                  {config.name}
                </h1>
                <p className="text-xs text-text-muted">{events.length} events</p>
              </div>
            </div>
            {liveCount > 0 && <LiveBadge />}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {getDates().map(({ iso, label }) => (
              <button
                key={iso}
                onClick={() => setDate(iso)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  date === iso
                    ? "bg-primary text-white"
                    : "border border-border bg-surface-elevated text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-3">
          {config.leagues.map((league) => (
            <Link
              key={league.id}
              href={`/competition/${league.id}`}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
            >
              {league.name}
            </Link>
          ))}
        </div>

        <div className="mb-4 flex gap-2">
          {["all", "live", "scheduled", "finished"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-all ${
                statusFilter === s
                  ? s === "live"
                    ? "border-live/30 bg-live/10 text-live"
                    : "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-secondary"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loadingEvents ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-5xl">{config.emoji}</span>
            <p className="mt-3 font-medium text-text-secondary">
              No {config.name} events today
            </p>
            <p className="mt-1 text-sm text-text-muted">Try a different date</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.externalId} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
