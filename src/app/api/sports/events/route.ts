import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_EVENTS } from "@/lib/mock-data";
import { getCache, setCache, CacheKeys, TTL } from "@/lib/redis";
import { SportsDBProvider, SportsDBEvent } from "@/lib/sportsdb";
import { normalizeStatus, normalizeSport } from "@/lib/utils";

const REDIS_ENABLED =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://your-redis.upstash.io";

const MONGODB_ENABLED =
  !!process.env.MONGODB_URI &&
  process.env.MONGODB_URI !== "mongodb+srv://user:password@cluster.mongodb.net/pitwall?retryWrites=true&w=majority";

// Lazy imports to prevent errors when MongoDB is not configured
async function tryConnectDB() {
  if (!MONGODB_ENABLED) return null;
  try {
    const { default: connectDB } = await import("@/lib/mongodb");
    return await connectDB();
  } catch {
    return null;
  }
}

async function tryGetCache<T>(key: string): Promise<T | null> {
  if (!REDIS_ENABLED) return null;
  return getCache<T>(key);
}

async function trySetCache<T>(key: string, value: T, ttl: number) {
  if (!REDIS_ENABLED) return;
  return setCache(key, value, ttl);
}

// GET /api/sports/events?date=YYYY-MM-DD&sport=football
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const sport = searchParams.get("sport") || undefined;

  // ── Demo mode / no API key ──────────────────────────────
  if (DEMO_MODE) {
    let events: SportsDBEvent[] = MOCK_EVENTS as unknown as SportsDBEvent[];
    if (sport) {
      const normalized = normalizeSport(sport);
      events = events.filter((e) => normalizeSport(e.strSport) === normalized);
    }
    return NextResponse.json({ events: events.map(toNormalizedEvent), source: "mock" });
  }

  // ── Cached path ─────────────────────────────────────────
  const cacheKey = CacheKeys.eventsDay(date, sport);
  const cached = await tryGetCache<ReturnType<typeof toNormalizedEvent>[]>(cacheKey);
  if (cached) return NextResponse.json({ events: cached, source: "cache" });

  // ── MongoDB path ─────────────────────────────────────────
  const db = await tryConnectDB();
  if (db) {
    try {
      const { default: Event } = await import("@/models/sports/Event");
      const query: Record<string, unknown> = {
        startTime: {
          $gte: new Date(`${date}T00:00:00Z`),
          $lte: new Date(`${date}T23:59:59Z`),
        },
      };
      if (sport) query.sport = normalizeSport(sport);

      const dbEvents = await Event.find(query).sort({ startTime: 1 }).limit(100).lean();
      if (dbEvents.length > 0) {
        await trySetCache(cacheKey, dbEvents, TTL.SCHEDULED_EVENT);
        return NextResponse.json({ events: dbEvents, source: "db" });
      }
    } catch (err) {
      console.error("[events] DB read error:", err);
    }
  }

  // ── TheSportsDB path ─────────────────────────────────────
  const MAJOR_LEAGUES = {
    football: ["4328", "4335", "4331", "4332", "4334"],
    volleyball: ["4952", "4953"],
    motorsport: ["4370"],
  };

  const leaguesToFetch =
    sport && MAJOR_LEAGUES[normalizeSport(sport) as keyof typeof MAJOR_LEAGUES]
      ? MAJOR_LEAGUES[normalizeSport(sport) as keyof typeof MAJOR_LEAGUES]
      : [...MAJOR_LEAGUES.football, ...MAJOR_LEAGUES.volleyball, ...MAJOR_LEAGUES.motorsport];

  const allEvents: SportsDBEvent[] = [];

  for (const leagueId of leaguesToFetch.slice(0, 5)) {
    try {
      const [nextData, prevData] = await Promise.all([
        SportsDBProvider.scheduleNextLeague(leagueId),
        SportsDBProvider.schedulePrevLeague(leagueId),
      ]);
      const events = [...(nextData?.events || []), ...(prevData?.events || [])].filter(
        (e) => e.dateEvent === date
      );
      allEvents.push(...events);
    } catch {}
  }

  if (allEvents.length > 0 && db) {
    try {
      const { default: Event } = await import("@/models/sports/Event");
      const docs = allEvents.map((e) => ({
        externalId: e.idEvent,
        sport: normalizeSport(e.strSport),
        competition: { id: e.idLeague, name: e.strLeague, badge: e.strLeagueBadge },
        season: e.strSeason,
        status: normalizeStatus(e.strStatus),
        startTime: new Date(`${e.dateEvent}T${e.strTime || "00:00:00"}`),
        venue: e.strVenue,
        city: e.strCity,
        homeTeam: e.idHomeTeam ? { id: e.idHomeTeam, name: e.strHomeTeam, badge: e.strHomeTeamBadge } : undefined,
        awayTeam: e.idAwayTeam ? { id: e.idAwayTeam, name: e.strAwayTeam, badge: e.strAwayTeamBadge } : undefined,
        score: e.intHomeScore !== null ? { home: parseInt(e.intHomeScore || "0"), away: parseInt(e.intAwayScore || "0"), progress: e.strProgress } : undefined,
        lastSyncAt: new Date(),
      }));
      await Event.bulkWrite(docs.map((doc) => ({ updateOne: { filter: { externalId: doc.externalId }, update: { $set: doc }, upsert: true } })));
    } catch {}
  }

  const normalized = allEvents.map(toNormalizedEvent);
  await trySetCache(cacheKey, normalized, TTL.SCHEDULED_EVENT);
  return NextResponse.json({ events: normalized, source: "api" });
}

function toNormalizedEvent(e: SportsDBEvent) {
  return {
    externalId: e.idEvent,
    sport: normalizeSport(e.strSport),
    competition: { id: e.idLeague, name: e.strLeague, badge: e.strLeagueBadge },
    season: e.strSeason,
    status: normalizeStatus(e.strStatus),
    startTime: `${e.dateEvent}T${e.strTime || "00:00:00"}`,
    venue: e.strVenue,
    city: e.strCity,
    homeTeam: e.idHomeTeam ? { id: e.idHomeTeam, name: e.strHomeTeam, badge: e.strHomeTeamBadge } : undefined,
    awayTeam: e.idAwayTeam ? { id: e.idAwayTeam, name: e.strAwayTeam, badge: e.strAwayTeamBadge } : undefined,
    score: e.intHomeScore !== null ? { home: parseInt(e.intHomeScore || "0"), away: parseInt(e.intAwayScore || "0"), progress: e.strProgress } : undefined,
  };
}
