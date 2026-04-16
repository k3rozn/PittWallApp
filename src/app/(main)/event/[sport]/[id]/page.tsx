"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Share2, BarChart2, Users, Clock } from "lucide-react";
import { LiveBadge, StatusBadge } from "@/components/sports/Badges";
import { StatBar, TimelineEvent } from "@/components/sports/StatBar";
import { formatEventDate } from "@/lib/utils";

type Tab = "overview" | "stats" | "timeline" | "lineup";

interface EventData {
  externalId: string;
  sport: string;
  competition: { id: string; name: string; badge?: string };
  status: string;
  startTime: string;
  venue?: string;
  city?: string;
  raceName?: string;
  circuit?: string;
  homeTeam?: { id: string; name: string; badge?: string };
  awayTeam?: { id: string; name: string; badge?: string };
  score?: { home: number | null; away: number | null; progress?: string };
  stats?: { strStat: string; intHome: string; intAway: string }[];
  timeline?: {
    strTimeline: string;
    strTimelineDetail: string;
    strTeam: string;
    strAction: string;
    strPlayer: string;
    strPlayer2?: string;
    intTime: string;
  }[];
  lineup?: {
    idPlayer: string;
    strPlayer: string;
    strTeam: string;
    strPosition: string;
    intSquadNumber: string;
    strHome: string;
  }[];
}

function ScoreSkeleton() {
  return (
    <div className="bg-gradient-to-b from-surface to-background border-b border-border px-4 lg:px-8 py-8 animate-pulse">
      <div className="max-w-3xl mx-auto">
        <div className="h-4 bg-surface-elevated rounded w-40 mx-auto mb-6" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 bg-surface-elevated rounded-full" />
            <div className="h-4 bg-surface-elevated rounded w-24" />
          </div>
          <div className="text-center">
            <div className="h-12 bg-surface-elevated rounded w-28" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 bg-surface-elevated rounded-full" />
            <div className="h-4 bg-surface-elevated rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventPage() {
  const { sport, id } = useParams<{ sport: string; id: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    fetchEvent();
    const interval = setInterval(() => {
      if (event?.status === "live") fetchEvent();
    }, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchEvent() {
    try {
      const res = await fetch(`/api/sports/events/${id}`);
      const data = await res.json();
      setEvent(data.event);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ScoreSkeleton />;
  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-text-secondary">Event not found</p>
          <Link href="/" className="text-primary text-sm mt-2 inline-block">← Back</Link>
        </div>
      </div>
    );
  }

  const isLive = event.status === "live";
  const hasScore = event.score?.home !== null;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "stats", label: "Stats", icon: BarChart2 },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "lineup", label: "Lineup", icon: Users },
  ];

  return (
    <div className="page-enter">
      {/* Back & Actions */}
      <div className="flex items-center gap-3 px-4 lg:px-8 py-4 border-b border-border">
        <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {event.competition.badge && (
            <Image
              src={`${event.competition.badge}/tiny`}
              alt={event.competition.name}
              width={20}
              height={20}
              className="object-contain"
            />
          )}
          <span className="text-sm text-text-muted truncate">
            {event.competition.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-surface-elevated transition-colors text-text-muted hover:text-warning">
            <Star size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-surface-elevated transition-colors text-text-muted">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Score Hero */}
      <div
        className={`px-4 lg:px-8 py-8 border-b border-border ${
          isLive
            ? "bg-gradient-to-b from-live/5 to-background"
            : "bg-gradient-to-b from-surface to-background"
        }`}
      >
        <div className="max-w-3xl mx-auto">
          {/* Status */}
          <div className="text-center mb-6">
            {isLive ? (
              <div className="flex items-center gap-2 justify-center">
                <LiveBadge />
                {event.score?.progress && (
                  <span className="text-sm font-mono font-bold text-live">
                    {event.score.progress}&apos;
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <StatusBadge status={event.status} />
                <span className="text-sm text-text-muted">
                  {formatEventDate(
                    new Date(event.startTime).toISOString().split("T")[0],
                    new Date(event.startTime).toTimeString().slice(0, 5)
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Teams / Score */}
          {sport !== "f1" ? (
            <div className="flex items-center justify-between gap-4">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-16 h-16 lg:w-20 lg:h-20 relative">
                  {event.homeTeam?.badge ? (
                    <Image
                      src={event.homeTeam.badge}
                      alt={event.homeTeam.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-elevated rounded-full" />
                  )}
                </div>
                <Link
                  href={event.homeTeam ? `/team/${event.homeTeam.id}` : "#"}
                  className="text-sm lg:text-base font-semibold text-center text-text-primary hover:text-primary transition-colors"
                >
                  {event.homeTeam?.name || "Home"}
                </Link>
              </div>

              {/* Score */}
              <div className="text-center shrink-0">
                {hasScore ? (
                  <div className="font-display text-5xl lg:text-6xl font-bold tracking-wider text-text-primary">
                    <span className={isLive ? "text-live" : ""}>{event.score!.home}</span>
                    <span className="text-text-muted mx-2">–</span>
                    <span className={isLive ? "text-live" : ""}>{event.score!.away}</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-text-muted">
                    {new Date(event.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                )}
                {event.venue && (
                  <p className="text-xs text-text-muted mt-2">{event.venue}</p>
                )}
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-16 h-16 lg:w-20 lg:h-20 relative">
                  {event.awayTeam?.badge ? (
                    <Image
                      src={event.awayTeam.badge}
                      alt={event.awayTeam.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-elevated rounded-full" />
                  )}
                </div>
                <Link
                  href={event.awayTeam ? `/team/${event.awayTeam.id}` : "#"}
                  className="text-sm lg:text-base font-semibold text-center text-text-primary hover:text-primary transition-colors"
                >
                  {event.awayTeam?.name || "Away"}
                </Link>
              </div>
            </div>
          ) : (
            // F1 / Motorsport
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display">
                {event.raceName || event.competition.name}
              </h2>
              {event.venue && (
                <p className="text-text-muted mt-1">{event.venue}, {event.city}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex max-w-3xl mx-auto px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-text-secondary mb-3">
                Match Info
              </h3>
              <div className="space-y-2 text-sm">
                {event.competition.name && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Competition</span>
                    <span className="text-text-primary">{event.competition.name}</span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Venue</span>
                    <span className="text-text-primary">{event.venue}</span>
                  </div>
                )}
                {event.city && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">City</span>
                    <span className="text-text-primary">{event.city}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Date</span>
                  <span className="text-text-primary">
                    {new Date(event.startTime).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-3">
            {event.stats && event.stats.length > 0 ? (
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">
                  <span className="flex-1 truncate">{event.homeTeam?.name || "Home"}</span>
                  <span className="text-sm font-black mx-2">VS</span>
                  <span className="flex-1 text-right truncate">{event.awayTeam?.name || "Away"}</span>
                </div>
                <div className="space-y-4">
                  {event.stats.map((stat, i) => (
                    <StatBar
                      key={i}
                      label={stat.strStat}
                      home={parseInt(stat.intHome) || 0}
                      away={parseInt(stat.intAway) || 0}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted">
                <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>No statistics available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div>
            {event.timeline && event.timeline.length > 0 ? (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                  {event.timeline.map((item, i) => (
                    <div key={i} className="px-4">
                      <TimelineEvent
                        time={item.intTime}
                        type={item.strAction}
                        detail={item.strTimelineDetail}
                        team={item.strTeam}
                        player={item.strPlayer}
                        player2={item.strPlayer2}
                        isHome={item.strTeam === event.homeTeam?.name}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted">
                <Clock size={40} className="mx-auto mb-3 opacity-30" />
                <p>No timeline events yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "lineup" && (
          <div>
            {event.lineup && event.lineup.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[event.homeTeam?.name, event.awayTeam?.name].map((teamName) => {
                  const teamPlayers = event.lineup!.filter((p) =>
                    p.strHome === "1"
                      ? teamName === event.homeTeam?.name
                      : teamName === event.awayTeam?.name
                  );
                  return (
                    <div
                      key={teamName}
                      className="bg-surface border border-border rounded-xl p-4"
                    >
                      <h3 className="text-sm font-semibold text-text-secondary mb-3">
                        {teamName}
                      </h3>
                      <div className="space-y-2">
                        {teamPlayers.map((p) => (
                          <div
                            key={p.idPlayer}
                            className="flex items-center gap-3 text-sm"
                          >
                            <span className="w-6 text-right text-text-muted font-mono text-xs">
                              {p.intSquadNumber}
                            </span>
                            <span className="flex-1 text-text-primary">{p.strPlayer}</span>
                            <span className="text-xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
                              {p.strPosition}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>Lineup not available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
