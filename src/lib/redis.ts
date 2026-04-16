// ── Redis client (lazy-initialized) ──────────────────────────
// Only creates the Redis connection when actually used.
// Falls back gracefully when UPSTASH_REDIS_REST_URL is missing or placeholder.

const REDIS_ENABLED =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://your-redis.upstash.io";

let _redis: import("@upstash/redis").Redis | null = null;

function getRedisClient() {
  if (!REDIS_ENABLED) return null;
  if (!_redis) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// ── Cache Helpers ─────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("[Redis] setCache error:", err);
  }
}

export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error("[Redis] deleteCache error:", err);
  }
}

// ── Cache Key Builders ────────────────────────────────────────

export const CacheKeys = {
  // Sports
  eventsDay: (date: string, sport?: string) =>
    `events:day:${date}${sport ? `:${sport}` : ""}`,
  eventDetail: (eventId: string) => `event:detail:${eventId}`,
  eventStats: (eventId: string) => `event:stats:${eventId}`,
  eventTimeline: (eventId: string) => `event:timeline:${eventId}`,
  eventLineup: (eventId: string) => `event:lineup:${eventId}`,
  teamDetail: (teamId: string) => `team:detail:${teamId}`,
  teamPlayers: (teamId: string) => `team:players:${teamId}`,
  teamScheduleNext: (teamId: string) => `team:schedule:next:${teamId}`,
  teamSchedulePrev: (teamId: string) => `team:schedule:prev:${teamId}`,
  leagueDetail: (leagueId: string) => `league:detail:${leagueId}`,
  leagueTeams: (leagueId: string) => `league:teams:${leagueId}`,
  leagueScheduleNext: (leagueId: string) => `league:schedule:next:${leagueId}`,
  leagueSchedulePrev: (leagueId: string) => `league:schedule:prev:${leagueId}`,
  leagueFullSchedule: (leagueId: string, season: string) =>
    `league:schedule:full:${leagueId}:${season}`,
  playerDetail: (playerId: string) => `player:detail:${playerId}`,
  allLeagues: () => `all:leagues`,
  searchTeam: (query: string) => `search:team:${query.toLowerCase()}`,
  searchPlayer: (query: string) => `search:player:${query.toLowerCase()}`,

  // User
  userFavorites: (userId: string, type: string) =>
    `user:${userId}:favorites:${type}`,
  userProfile: (userId: string) => `user:profile:${userId}`,

  // Fantasy
  fantasyLeague: (leagueId: string) => `fantasy:league:${leagueId}`,
  fantasyTeam: (teamId: string) => `fantasy:team:${teamId}`,
};

// ── TTL Constants ─────────────────────────────────────────────
export const TTL = {
  LIVE_SCORE: 60,        // 60 seconds (free plan polling)
  LIVE_STATS: 120,
  SCHEDULED_EVENT: 300,  // 5 min
  FINISHED_EVENT: 3600,  // 1 hour
  STANDINGS: 600,        // 10 min
  TEAM_PROFILE: 86400,   // 24 hours
  PLAYER_PROFILE: 86400,
  LEAGUE_INFO: 86400,
  SEARCH_RESULTS: 300,
  ALL_LEAGUES: 3600,
};
