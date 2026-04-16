import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_COMPETITION } from "@/lib/mock-data";
import { getCache, setCache, CacheKeys, TTL } from "@/lib/redis";
import { SportsDBProvider } from "@/lib/sportsdb";

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

// GET /api/sports/competitions/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (DEMO_MODE || id.startsWith("mock-")) {
    return NextResponse.json({ competition: MOCK_COMPETITION, source: "mock" });
  }

  const cacheKey = CacheKeys.leagueDetail(id);
  const cached = await tryGetCache(cacheKey);
  if (cached) return NextResponse.json({ competition: cached, source: "cache" });

  const [leagueData, teamsData, nextEvents, prevEvents] = await Promise.all([
    SportsDBProvider.lookupLeague(id),
    SportsDBProvider.listLeagueTeams(id),
    SportsDBProvider.scheduleNextLeague(id),
    SportsDBProvider.schedulePrevLeague(id),
  ]);

  const league = leagueData?.leagues?.[0];
  if (!league) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

  const result = {
    id: league.idLeague,
    name: league.strLeague,
    sport: league.strSport,
    country: league.strCountry,
    badge: league.strLeagueBadge,
    currentSeason: league.strCurrentSeason,
    description: league.strDescriptionEN,
    teams: teamsData?.teams || [],
    nextEvents: nextEvents?.events || [],
    prevEvents: prevEvents?.events || [],
  };

  await trySetCache(cacheKey, result, TTL.LEAGUE_INFO);
  return NextResponse.json({ competition: result, source: "api" });
}
