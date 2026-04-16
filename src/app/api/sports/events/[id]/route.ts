import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_EVENT_DETAIL } from "@/lib/mock-data";
import { getCache, setCache, CacheKeys, TTL } from "@/lib/redis";
import { SportsDBProvider } from "@/lib/sportsdb";
import { normalizeStatus, normalizeSport } from "@/lib/utils";

const REDIS_ENABLED =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://your-redis.upstash.io";

async function tryGetCache<T>(key: string): Promise<T | null> {
  if (!REDIS_ENABLED) return null;
  try { return await getCache<T>(key); } catch { return null; }
}
async function trySetCache<T>(key: string, value: T, ttl: number) {
  if (!REDIS_ENABLED) return;
  try { await setCache(key, value, ttl); } catch {}
}

// GET /api/sports/events/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Demo fallback
  if (DEMO_MODE || id.startsWith("mock-")) {
    return NextResponse.json({ event: MOCK_EVENT_DETAIL, source: "mock" });
  }

  const cacheKey = CacheKeys.eventDetail(id);
  const cached = await tryGetCache(cacheKey);
  if (cached) return NextResponse.json({ event: cached, source: "cache" });

  const [eventData, statsData, timelineData, lineupData] = await Promise.all([
    SportsDBProvider.lookupEvent(id),
    SportsDBProvider.lookupEventStats(id),
    SportsDBProvider.lookupEventTimeline(id),
    SportsDBProvider.lookupEventLineup(id),
  ]);

  const rawEvent = eventData?.events?.[0];
  if (!rawEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const enrichedEvent = {
    externalId: rawEvent.idEvent,
    sport: normalizeSport(rawEvent.strSport),
    competition: { id: rawEvent.idLeague, name: rawEvent.strLeague, badge: rawEvent.strLeagueBadge },
    season: rawEvent.strSeason,
    status: normalizeStatus(rawEvent.strStatus),
    startTime: new Date(`${rawEvent.dateEvent}T${rawEvent.strTime || "00:00:00"}`),
    venue: rawEvent.strVenue,
    city: rawEvent.strCity,
    homeTeam: rawEvent.idHomeTeam
      ? { id: rawEvent.idHomeTeam, name: rawEvent.strHomeTeam, badge: rawEvent.strHomeTeamBadge }
      : undefined,
    awayTeam: rawEvent.idAwayTeam
      ? { id: rawEvent.idAwayTeam, name: rawEvent.strAwayTeam, badge: rawEvent.strAwayTeamBadge }
      : undefined,
    score: {
      home: rawEvent.intHomeScore !== null ? parseInt(rawEvent.intHomeScore || "0") : null,
      away: rawEvent.intAwayScore !== null ? parseInt(rawEvent.intAwayScore || "0") : null,
      progress: rawEvent.strProgress,
    },
    stats: statsData?.eventstats || [],
    timeline: timelineData?.timeline || [],
    lineup: lineupData?.lineup || [],
    lastSyncAt: new Date(),
  };

  const st = enrichedEvent.status;
  const ttl = st === "live" ? TTL.LIVE_SCORE : st === "finished" ? TTL.FINISHED_EVENT : TTL.SCHEDULED_EVENT;
  await trySetCache(cacheKey, enrichedEvent, ttl);

  return NextResponse.json({ event: enrichedEvent, source: "api" });
}
