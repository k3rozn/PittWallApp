import { NextRequest, NextResponse } from "next/server";
import { DEMO_MODE, MOCK_SEARCH_RESULTS } from "@/lib/mock-data";
import { getCache, setCache, TTL } from "@/lib/redis";
import { SportsDBProvider } from "@/lib/sportsdb";

const REDIS_ENABLED =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://your-redis.upstash.io";

// GET /api/sports/search?q=arsenal&type=all
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type") || "all";

  if (q.length < 2) return NextResponse.json({ results: [] });

  // Demo mode: filter mock data
  if (DEMO_MODE) {
    const lq = q.toLowerCase();
    const filtered = MOCK_SEARCH_RESULTS.filter(
      (r) =>
        r.name.toLowerCase().includes(lq) &&
        (type === "all" || r.type === type)
    );
    return NextResponse.json({ results: filtered, source: "mock" });
  }

  const cacheKey = `search:${type}:${q.toLowerCase()}`;
  if (REDIS_ENABLED) {
    try {
      const cached = await getCache<unknown[]>(cacheKey);
      if (cached) return NextResponse.json({ results: cached, source: "cache" });
    } catch {}
  }

  const results: unknown[] = [];

  try {
    if (type === "all" || type === "team") {
      const teamData = await SportsDBProvider.searchTeam(q);
      const teams = (teamData?.teams || []).slice(0, 5).map((t) => ({
        type: "team",
        id: t.idTeam,
        name: t.strTeam,
        badge: t.strTeamBadge,
        subtitle: `${t.strSport} • ${t.strCountry}`,
        href: `/team/${t.idTeam}`,
      }));
      results.push(...teams);
    }

    if (type === "all" || type === "player") {
      const playerData = await SportsDBProvider.searchPlayer(q);
      const players = (playerData?.players || []).slice(0, 5).map((p) => ({
        type: "player",
        id: p.idPlayer,
        name: p.strPlayer,
        badge: p.strThumb,
        subtitle: `${p.strPosition} • ${p.strTeam}`,
        href: `/player/${p.idPlayer}`,
      }));
      results.push(...players);
    }

    if (type === "all" || type === "competition") {
      const leagueData = await SportsDBProvider.searchLeague(q);
      const leagues = (leagueData?.leagues || []).slice(0, 3).map((l) => ({
        type: "competition",
        id: l.idLeague,
        name: l.strLeague,
        badge: l.strLeagueBadge,
        subtitle: `${l.strSport}${l.strCountry ? ` • ${l.strCountry}` : ""}`,
        href: `/competition/${l.idLeague}`,
      }));
      results.push(...leagues);
    }
  } catch (err) {
    console.error("[search] Error:", err);
  }

  if (REDIS_ENABLED) {
    try { await setCache(cacheKey, results, TTL.SEARCH_RESULTS); } catch {}
  }
  return NextResponse.json({ results, source: "api" });
}
