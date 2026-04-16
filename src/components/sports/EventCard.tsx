import Image from "next/image";
import Link from "next/link";
import { LiveBadge, StatusBadge } from "@/components/sports/Badges";
import { formatEventDate, normalizeSport } from "@/lib/utils";

interface EventCardProps {
  event: {
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
    venue?: string;
  };
  compact?: boolean;
}

export default function EventCard({ event, compact = false }: EventCardProps) {
  const sport = normalizeSport(event.sport);
  const isLive = event.status === "live";
  const isF1 = sport === "motorsport";

  const href = `/event/${sport === "motorsport" ? "f1" : sport}/${event.externalId}`;

  if (isF1) {
    return (
      <Link href={href}>
        <div
          className={`card-hover bg-surface border border-border rounded-xl overflow-hidden ${
            isLive ? "border-live/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]" : ""
          } ${compact ? "p-3" : "p-4"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-text-muted truncate">
                  {event.competition.name}
                </span>
                {isLive && <LiveBadge size="sm" />}
              </div>
              <h3 className="font-semibold text-text-primary text-sm truncate">
                {event.raceName || event.competition.name}
              </h3>
              {event.circuit && (
                <p className="text-xs text-text-muted mt-0.5">{event.circuit}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <StatusBadge status={event.status} />
              <p className="text-xs text-text-muted mt-1">
                {formatEventDate(
                  new Date(event.startTime).toISOString().split("T")[0],
                  new Date(event.startTime).toTimeString().slice(0, 5)
                )}
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <div
        className={`card-hover bg-surface border border-border rounded-xl overflow-hidden ${
          isLive ? "border-live/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]" : ""
        } ${compact ? "p-3" : "p-4"}`}
      >
        {/* Competition header */}
        <div className="flex items-center gap-2 mb-3">
          {event.competition.badge && (
            <Image
              src={`${event.competition.badge}/tiny`}
              alt={event.competition.name}
              width={16}
              height={16}
              className="rounded-sm object-contain"
            />
          )}
          <span className="text-xs text-text-muted flex-1 truncate">
            {event.competition.name}
          </span>
          {isLive ? (
            <LiveBadge size="sm" />
          ) : (
            <span className="text-xs text-text-muted">
              {formatEventDate(
                new Date(event.startTime).toISOString().split("T")[0],
                new Date(event.startTime).toTimeString().slice(0, 5)
              )}
            </span>
          )}
        </div>

        {/* Teams and Score */}
        <div className="space-y-2.5">
          {/* Home Team */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {event.homeTeam?.badge ? (
                <Image
                  src={`${event.homeTeam.badge}/tiny`}
                  alt={event.homeTeam?.name || ""}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              ) : (
                <div className="w-6 h-6 bg-surface-elevated rounded-full" />
              )}
            </div>
            <span
              className={`flex-1 text-sm truncate ${
                event.score?.home !== null &&
                event.score?.away !== null &&
                (event.score?.home ?? 0) > (event.score?.away ?? 0)
                  ? "font-semibold text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              {event.homeTeam?.name || "TBD"}
            </span>
            <span
              className={`text-sm font-mono font-bold w-5 text-right ${
                isLive ? "text-live" : ""
              }`}
            >
              {event.score?.home ?? "-"}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {event.awayTeam?.badge ? (
                <Image
                  src={`${event.awayTeam.badge}/tiny`}
                  alt={event.awayTeam?.name || ""}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              ) : (
                <div className="w-6 h-6 bg-surface-elevated rounded-full" />
              )}
            </div>
            <span
              className={`flex-1 text-sm truncate ${
                event.score?.home !== null &&
                event.score?.away !== null &&
                (event.score?.away ?? 0) > (event.score?.home ?? 0)
                  ? "font-semibold text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              {event.awayTeam?.name || "TBD"}
            </span>
            <span
              className={`text-sm font-mono font-bold w-5 text-right ${
                isLive ? "text-live" : ""
              }`}
            >
              {event.score?.away ?? "-"}
            </span>
          </div>
        </div>

        {/* Progress (Live only) */}
        {isLive && event.score?.progress && (
          <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
            <span className="text-xs text-live font-medium">
              {event.score.progress}&apos;
            </span>
            <span className="text-xs text-text-muted">{event.venue}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
