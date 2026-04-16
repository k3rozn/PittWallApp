"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Trophy } from "lucide-react";
import EventCard from "@/components/sports/EventCard";

interface CompetitionData {
  id: string;
  name: string;
  sport: string;
  country?: string;
  badge?: string;
  currentSeason?: string;
  description?: string;
  teams?: { idTeam: string; strTeam: string; strTeamBadge?: string }[];
  nextEvents?: unknown[];
  prevEvents?: unknown[];
}

export default function CompetitionPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"results" | "upcoming" | "teams">("results");

  useEffect(() => {
    fetch(`/api/sports/competitions/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d.competition))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse p-8">
        <div className="h-8 bg-surface rounded w-48 mb-4" />
        <div className="h-4 bg-surface rounded w-32" />
      </div>
    );
  }

  if (!data) return <div className="p-8 text-text-muted">Competition not found</div>;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface to-background border-b border-border px-4 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-text-muted hover:text-text-primary mb-4 inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-4 mt-2">
            {data.badge && (
              <div className="w-16 h-16 relative">
                <Image src={data.badge} alt={data.name} fill className="object-contain" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold font-display">{data.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {data.country && (
                  <span className="text-sm text-text-muted">{data.country}</span>
                )}
                {data.currentSeason && (
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                    {data.currentSeason}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border max-w-4xl mx-auto px-4">
        <div className="flex gap-6">
          {[
            { id: "results", label: "Results", icon: Trophy },
            { id: "upcoming", label: "Upcoming", icon: Calendar },
            { id: "teams", label: "Teams", icon: null },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
        {tab === "results" && (
          <div className="grid gap-3 md:grid-cols-2">
            {(data.prevEvents || []).length === 0 ? (
              <p className="text-text-muted col-span-2 text-center py-8">No results yet</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data.prevEvents || []).map((e: any) => (
                <EventCard
                  key={e.idEvent || e.externalId}
                  event={{
                    externalId: e.idEvent || e.externalId,
                    sport: e.strSport || data.sport,
                    competition: {
                      id: e.idLeague || data.id,
                      name: e.strLeague || data.name,
                      badge: e.strLeagueBadge || data.badge
                    },
                    status: "finished",
                    startTime: `${e.dateEvent}T${e.strTime || "00:00:00"}`,
                    homeTeam: e.idHomeTeam ? { id: e.idHomeTeam, name: e.strHomeTeam, badge: e.strHomeTeamBadge } : undefined,
                    awayTeam: e.idAwayTeam ? { id: e.idAwayTeam, name: e.strAwayTeam, badge: e.strAwayTeamBadge } : undefined,
                    score: { home: e.intHomeScore !== null ? parseInt(e.intHomeScore || "0") : null, away: e.intAwayScore !== null ? parseInt(e.intAwayScore || "0") : null },
                  }}
                />
              ))
            )}
          </div>
        )}

        {tab === "upcoming" && (
          <div className="grid gap-3 md:grid-cols-2">
            {(data.nextEvents || []).length === 0 ? (
              <p className="text-text-muted col-span-2 text-center py-8">No upcoming events</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data.nextEvents || []).map((e: any) => (
                <EventCard
                  key={e.idEvent}
                  event={{
                    externalId: e.idEvent,
                    sport: e.strSport || data.sport,
                    competition: { id: data.id, name: data.name, badge: data.badge },
                    status: "scheduled",
                    startTime: `${e.dateEvent}T${e.strTime || "00:00:00"}`,
                    homeTeam: e.idHomeTeam ? { id: e.idHomeTeam, name: e.strHomeTeam, badge: e.strHomeTeamBadge } : undefined,
                    awayTeam: e.idAwayTeam ? { id: e.idAwayTeam, name: e.strAwayTeam, badge: e.strAwayTeamBadge } : undefined,
                  }}
                />
              ))
            )}
          </div>
        )}

        {tab === "teams" && (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(data.teams || []).map((team) => (
              <Link
                key={team.idTeam}
                href={`/team/${team.idTeam}`}
                className="card-hover bg-surface border border-border rounded-xl p-4 flex flex-col items-center gap-3"
              >
                {team.strTeamBadge ? (
                  <Image
                    src={`${team.strTeamBadge}/tiny`}
                    alt={team.strTeam}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-surface-elevated rounded-full" />
                )}
                <span className="text-sm font-medium text-text-primary text-center">
                  {team.strTeam}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
