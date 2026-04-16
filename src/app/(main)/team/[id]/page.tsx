"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Globe, MapPin } from "lucide-react";
import EventCard from "@/components/sports/EventCard";
import { SportBadge } from "@/components/sports/Badges";

interface TeamData {
  id: string;
  name: string;
  sport: string;
  league?: { id: string; name: string };
  badge?: string;
  jersey?: string;
  stadium?: string;
  city?: string;
  country?: string;
  formedYear?: string;
  description?: string;
  website?: string;
  players?: { idPlayer: string; strPlayer: string; strPosition?: string; strNumber?: string; strThumb?: string }[];
  nextEvents?: unknown[];
  prevEvents?: unknown[];
}

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "squad" | "matches">("overview");

  useEffect(() => {
    fetch(`/api/sports/teams/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d.team))
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

  if (!data) return <div className="p-8 text-text-muted">Team not found</div>;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface to-background border-b border-border px-4 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href={data.league ? `/competition/${data.league.id}` : "/"}
            className="text-text-muted hover:text-text-primary mb-4 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            {data.league?.name || "Back"}
          </Link>
          <div className="flex items-center gap-4 mt-2">
            {data.badge && (
              <div className="w-20 h-20 relative">
                <Image src={data.badge} alt={data.name} fill className="object-contain" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold font-display">{data.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <SportBadge sport={data.sport as "football" | "volleyball" | "motorsport" | "f1"} />
                {data.country && (
                  <span className="text-sm text-text-muted flex items-center gap-1">
                    <MapPin size={13} /> {data.country}
                  </span>
                )}
                {data.formedYear && (
                  <span className="text-sm text-text-muted">Est. {data.formedYear}</span>
                )}
                {data.website && (
                  <a
                    href={`https://${data.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary-glow flex items-center gap-1"
                  >
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border max-w-4xl mx-auto px-4">
        <div className="flex gap-6">
          {["overview", "squad", "matches"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as typeof tab)}
              className={`py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
        {tab === "overview" && (
          <div className="space-y-4">
            {data.stadium && (
              <div className="bg-surface border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-secondary mb-3">Stadium</h3>
                <div className="text-sm space-y-1">
                  <p className="text-text-primary font-medium">{data.stadium}</p>
                  {data.city && <p className="text-text-muted">{data.city}</p>}
                </div>
              </div>
            )}
            {data.description && (
              <div className="bg-surface border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-secondary mb-3">About</h3>
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-6">
                  {data.description}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "squad" && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {(data.players || []).length === 0 ? (
                <p className="text-center py-8 text-text-muted">No squad data available</p>
              ) : (
                (data.players || []).map((player) => (
                  <Link
                    key={player.idPlayer}
                    href={`/player/${player.idPlayer}`}
                    className="flex items-center gap-3 p-3 hover:bg-surface-elevated transition-colors"
                  >
                    <div className="w-8 h-8 relative shrink-0">
                      {player.strThumb ? (
                        <Image
                          src={`${player.strThumb}/tiny`}
                          alt={player.strPlayer}
                          fill
                          className="object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-elevated rounded-full flex items-center justify-center text-xs text-text-muted">
                          {player.strNumber || "?"}
                        </div>
                      )}
                    </div>
                    <span className="flex-1 text-sm text-text-primary">{player.strPlayer}</span>
                    {player.strPosition && (
                      <span className="text-xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
                        {player.strPosition}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "matches" && (
          <div className="space-y-6">
            {(data.prevEvents || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-3">Recent Results</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(data.prevEvents || []).map((e: any) => (
                    <EventCard
                      key={e.idEvent}
                      event={{
                        externalId: e.idEvent,
                        sport: e.strSport || data.sport,
                        competition: { id: e.idLeague, name: e.strLeague },
                        status: "finished",
                        startTime: `${e.dateEvent}T${e.strTime || "00:00:00"}`,
                        homeTeam: e.idHomeTeam ? { id: e.idHomeTeam, name: e.strHomeTeam, badge: e.strHomeTeamBadge } : undefined,
                        awayTeam: e.idAwayTeam ? { id: e.idAwayTeam, name: e.strAwayTeam, badge: e.strAwayTeamBadge } : undefined,
                        score: { home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null, away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null },
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {(data.nextEvents || []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-3">Next Matches</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(data.nextEvents || []).map((e: any) => (
                    <EventCard
                      key={e.idEvent}
                      event={{
                        externalId: e.idEvent,
                        sport: e.strSport || data.sport,
                        competition: { id: e.idLeague, name: e.strLeague },
                        status: "scheduled",
                        startTime: `${e.dateEvent}T${e.strTime || "00:00:00"}`,
                        homeTeam: e.idHomeTeam ? { id: e.idHomeTeam, name: e.strHomeTeam, badge: e.strHomeTeamBadge } : undefined,
                        awayTeam: e.idAwayTeam ? { id: e.idAwayTeam, name: e.strAwayTeam, badge: e.strAwayTeamBadge } : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
