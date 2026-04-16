import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_PLAYER } from "@/lib/mock-data";
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

// GET /api/sports/players/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (DEMO_MODE || id.startsWith("mock-") || id.startsWith("p")) {
    return NextResponse.json({ player: MOCK_PLAYER, source: "mock" });
  }

  const cacheKey = CacheKeys.playerDetail(id);
  const cached = await tryGetCache(cacheKey);
  if (cached) return NextResponse.json({ player: cached, source: "cache" });

  const [playerData, teamsData, honoursData] = await Promise.all([
    SportsDBProvider.lookupPlayer(id),
    SportsDBProvider.lookupPlayerTeams(id),
    SportsDBProvider.lookupPlayerHonours(id),
  ]);

  const p = playerData?.players?.[0];
  if (!p) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const result = {
    id: p.idPlayer,
    name: p.strPlayer,
    teamId: p.idTeam,
    teamName: p.strTeam,
    sport: "Soccer",
    position: p.strPosition,
    nationality: p.strNationality,
    dateBorn: p.dateBorn,
    height: p.strHeight,
    weight: p.strWeight,
    number: p.strNumber,
    thumb: p.strThumb,
    description: p.strDescriptionEN,
    status: p.strStatus,
    formerTeams: teamsData?.formerteams || [],
    honours: honoursData?.honours || [],
  };

  await trySetCache(cacheKey, result, TTL.PLAYER_PROFILE);
  return NextResponse.json({ player: result, source: "api" });
}
