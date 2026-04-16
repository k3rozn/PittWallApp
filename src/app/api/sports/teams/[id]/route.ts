import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_TEAM } from "@/lib/mock-data";
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

// GET /api/sports/teams/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (DEMO_MODE || id.startsWith("mock-")) {
    return NextResponse.json({ team: MOCK_TEAM, source: "mock" });
  }

  const cacheKey = CacheKeys.teamDetail(id);
  const cached = await tryGetCache(cacheKey);
  if (cached) return NextResponse.json({ team: cached, source: "cache" });

  const [teamData, playersData, nextEvents, prevEvents] = await Promise.all([
    SportsDBProvider.lookupTeam(id),
    SportsDBProvider.listTeamPlayers(id),
    SportsDBProvider.scheduleNextTeam(id),
    SportsDBProvider.schedulePrevTeam(id),
  ]);

  const team = teamData?.teams?.[0];
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const result = {
    id: team.idTeam,
    name: team.strTeam,
    sport: team.strSport,
    league: { id: team.idLeague, name: team.strLeague },
    badge: team.strTeamBadge,
    jersey: team.strTeamJersey,
    stadium: team.strStadium,
    city: team.strStadiumLocation,
    country: team.strCountry,
    formedYear: team.intFormedYear,
    description: team.strDescriptionEN,
    website: team.strWebsite,
    players: playersData?.players || [],
    nextEvents: nextEvents?.events?.slice(0, 5) || [],
    prevEvents: prevEvents?.events?.slice(0, 5) || [],
  };

  await trySetCache(cacheKey, result, TTL.TEAM_PROFILE);
  return NextResponse.json({ team: result, source: "api" });
}
