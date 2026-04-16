import { NextResponse } from "next/server";
import { DEMO_MODE, MOCK_F1_DRIVERS } from "@/lib/mock-data";
import { getCache, setCache, TTL } from "@/lib/redis";
import { SportsDBProvider } from "@/lib/sportsdb";

const REDIS_ENABLED =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://your-redis.upstash.io";

const F1_LEAGUE_ID = "4370";
const DRIVERS_CACHE_KEY = "f1:drivers:list";

type DriverResponse = {
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
};

async function tryGetCache<T>(key: string): Promise<T | null> {
  if (!REDIS_ENABLED) return null;
  try {
    return await getCache<T>(key);
  } catch {
    return null;
  }
}

async function trySetCache<T>(key: string, value: T, ttl: number) {
  if (!REDIS_ENABLED) return;
  try {
    await setCache(key, value, ttl);
  } catch {}
}

function isLikelyDriver(position?: string): boolean {
  const value = (position || "").toLowerCase();
  return (
    value.includes("driver") ||
    value.includes("pilot") ||
    value.includes("racer")
  );
}

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json({ drivers: MOCK_F1_DRIVERS, source: "mock" });
  }

  const cached = await tryGetCache<DriverResponse[]>(DRIVERS_CACHE_KEY);
  if (cached && cached.length > 0) {
    return NextResponse.json({ drivers: cached, source: "cache" });
  }

  const teamsData = await SportsDBProvider.listLeagueTeams(F1_LEAGUE_ID);
  const teams = teamsData?.teams || [];

  if (teams.length === 0) {
    return NextResponse.json({ drivers: MOCK_F1_DRIVERS, source: "fallback" });
  }

  const playersByTeam = await Promise.all(
    teams.map(async (team) => {
      const playersData = await SportsDBProvider.listTeamPlayers(team.idTeam);
      const players = playersData?.players || [];

      const clearDrivers = players.filter((p) => isLikelyDriver(p.strPosition));
      const fallbackDrivers =
        clearDrivers.length > 0 ? clearDrivers : players.slice(0, 2);

      return fallbackDrivers.map((p) => ({
        id: p.idPlayer,
        name: p.strPlayer,
        teamId: team.idTeam,
        teamName: team.strTeam,
        teamBadge: team.strTeamBadge,
        number: p.strNumber,
        nationality: p.strNationality,
        thumb: p.strThumb,
        dateBorn: p.dateBorn,
        status: p.strStatus,
        position: p.strPosition,
      }));
    })
  );

  const drivers = playersByTeam
    .flat()
    .filter((d) => !!d.id && !!d.name)
    .sort((a, b) => {
      if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName);
      return a.name.localeCompare(b.name);
    });

  const deduped = Array.from(
    new Map(drivers.map((d) => [d.id, d])).values()
  );

  const response = deduped.length > 0 ? deduped : MOCK_F1_DRIVERS;
  await trySetCache(DRIVERS_CACHE_KEY, response, TTL.TEAM_PROFILE);

  return NextResponse.json({
    drivers: response,
    source: deduped.length > 0 ? "api" : "fallback",
  });
}
