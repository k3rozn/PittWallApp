// ── TheSportsDB v2 Provider ──────────────────────────────────
// All external API calls MUST go through this file.
// Never call the external API directly from the frontend.

const BASE_URL = process.env.SPORTSDB_BASE_URL || "https://www.thesportsdb.com/api/v2/json";
const API_KEY = process.env.SPORTSDB_API_KEY;

// Rate limiting state (simple in-memory for single instance)
let requestsThisMinute = 0;
let minuteStart = Date.now();
const MAX_REQUESTS_PER_MINUTE = 25; // Leave buffer below 30 limit

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  if (now - minuteStart > 60000) {
    requestsThisMinute = 0;
    minuteStart = now;
  }

  if (requestsThisMinute >= MAX_REQUESTS_PER_MINUTE) {
    const waitMs = 60000 - (now - minuteStart);
    console.warn(`[SportsDB] Rate limit reached, waiting ${waitMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    requestsThisMinute = 0;
    minuteStart = Date.now();
  }

  requestsThisMinute++;

  const headers: HeadersInit = {};
  if (API_KEY) {
    headers["X-API-KEY"] = API_KEY;
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 0 }, // Don't use Next.js cache — we handle it ourselves
  });

  if (!response.ok) {
    throw new Error(`SportsDB API error: ${response.status} ${url}`);
  }

  return response;
}

async function apiGet<T>(path: string): Promise<T | null> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await rateLimitedFetch(url);
    const data = await res.json();
    return data as T;
  } catch (err) {
    console.error(`[SportsDB] GET ${path} failed:`, err);
    return null;
  }
}

// ── Search Endpoints ─────────────────────────────────────────

export const SportsDBProvider = {
  // Search
  searchLeague: (name: string) =>
    apiGet<SportsDBLeagueSearch>(`/search/league/${encodeURIComponent(name)}`),

  searchTeam: (name: string) =>
    apiGet<SportsDBTeamSearch>(`/search/team/${encodeURIComponent(name)}`),

  searchPlayer: (name: string) =>
    apiGet<SportsDBPlayerSearch>(`/search/player/${encodeURIComponent(name)}`),

  searchEvent: (name: string) =>
    apiGet<SportsDBEventSearch>(`/search/event/${encodeURIComponent(name)}`),

  // Lookup
  lookupLeague: (id: string) => apiGet<SportsDBLeagueLookup>(`/lookup/league/${id}`),

  lookupTeam: (id: string) => apiGet<SportsDBTeamLookup>(`/lookup/team/${id}`),

  lookupPlayer: (id: string) => apiGet<SportsDBPlayerLookup>(`/lookup/player/${id}`),

  lookupEvent: (id: string) => apiGet<SportsDBEventLookup>(`/lookup/event/${id}`),

  lookupEventLineup: (id: string) => apiGet<SportsDBLineup>(`/lookup/event_lineup/${id}`),

  lookupEventResults: (id: string) => apiGet<SportsDBResults>(`/lookup/event_results/${id}`),

  lookupEventStats: (id: string) => apiGet<SportsDBEventStats>(`/lookup/event_stats/${id}`),

  lookupEventTimeline: (id: string) => apiGet<SportsDBTimeline>(`/lookup/event_timeline/${id}`),

  lookupEventHighlights: (id: string) =>
    apiGet<SportsDBHighlights>(`/lookup/event_highlights/${id}`),

  lookupPlayerResults: (id: string) =>
    apiGet<SportsDBPlayerResults>(`/lookup/player_results/${id}`),

  lookupPlayerHonours: (id: string) =>
    apiGet<SportsDBPlayerHonours>(`/lookup/player_honours/${id}`),

  lookupPlayerTeams: (id: string) =>
    apiGet<SportsDBPlayerTeams>(`/lookup/player_teams/${id}`),

  // List
  listLeagueTeams: (leagueId: string) => apiGet<SportsDBTeamList>(`/list/teams/${leagueId}`),

  listLeagueSeasons: (leagueId: string) =>
    apiGet<SportsDBSeasonList>(`/list/seasons/${leagueId}`),

  listTeamPlayers: (teamId: string) => apiGet<SportsDBPlayerList>(`/list/players/${teamId}`),

  // Schedule
  scheduleNextLeague: (leagueId: string) =>
    apiGet<SportsDBSchedule>(`/schedule/next/league/${leagueId}`),

  schedulePrevLeague: (leagueId: string) =>
    apiGet<SportsDBSchedule>(`/schedule/previous/league/${leagueId}`),

  scheduleNextTeam: (teamId: string) =>
    apiGet<SportsDBSchedule>(`/schedule/next/team/${teamId}`),

  schedulePrevTeam: (teamId: string) =>
    apiGet<SportsDBSchedule>(`/schedule/previous/team/${teamId}`),

  scheduleFullLeague: (leagueId: string, season: string) =>
    apiGet<SportsDBSchedule>(`/schedule/league/${leagueId}/${season}`),

  // All
  allLeagues: () => apiGet<SportsDBAllLeagues>(`/all/leagues`),
  allSports: () => apiGet<SportsDBAllSports>(`/all/sports`),

  // Livescores (Premium — returns null on free plan)
  livescoreSport: (sport: string) =>
    apiGet<SportsDBLivescores>(`/livescore/${sport}`),

  livescoreAll: () => apiGet<SportsDBLivescores>(`/livescore/all`),

  livescoreLeague: (leagueId: string) =>
    apiGet<SportsDBLivescores>(`/livescore/${leagueId}`),
};

// ── Raw API Types ─────────────────────────────────────────────

export interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strLeague: string;
  idLeague: string;
  strSeason: string;
  strHomeTeam: string;
  idHomeTeam: string;
  strAwayTeam: string;
  idAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  strProgress: string;
  dateEvent: string;
  strTime: string;
  strTimestamp: string;
  strThumb: string;
  strLeagueBadge?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  strSport: string;
  strVenue: string;
  strCity: string;
  strCountry: string;
  strHomeGoalDetails?: string;
  strAwayGoalDetails?: string;
  strVideo?: string;
}

export interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strLeague: string;
  idLeague: string;
  strSport: string;
  strTeamBadge: string;
  strTeamJersey?: string;
  strStadium?: string;
  strStadiumLocation?: string;
  strDescriptionEN?: string;
  strCountry: string;
  intFormedYear?: string;
  strWebsite?: string;
  strFacebook?: string;
  strTwitter?: string;
  strInstagram?: string;
}

export interface SportsDBPlayer {
  idPlayer: string;
  strPlayer: string;
  strTeam: string;
  idTeam: string;
  strPosition: string;
  strNationality: string;
  dateBorn: string;
  strHeight?: string;
  strWeight?: string;
  strThumb?: string;
  strDescriptionEN?: string;
  strNumber?: string;
  strStatus?: string;
}

export interface SportsDBLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strLeagueBadge?: string;
  strCountry?: string;
  strCurrentSeason?: string;
  strDescriptionEN?: string;
  strWebsite?: string;
  intFormedYear?: string;
}

// Response wrappers
export interface SportsDBLeagueSearch { leagues: SportsDBLeague[] | null }
export interface SportsDBTeamSearch { teams: SportsDBTeam[] | null }
export interface SportsDBPlayerSearch { players: SportsDBPlayer[] | null }
export interface SportsDBEventSearch { events: SportsDBEvent[] | null }
export interface SportsDBLeagueLookup { leagues: SportsDBLeague[] | null }
export interface SportsDBTeamLookup { teams: SportsDBTeam[] | null }
export interface SportsDBPlayerLookup { players: SportsDBPlayer[] | null }
export interface SportsDBEventLookup { events: SportsDBEvent[] | null }
export interface SportsDBTeamList { teams: SportsDBTeam[] | null }
export interface SportsDBPlayerList { players: SportsDBPlayer[] | null }
export interface SportsDBSeasonList { seasons: { strSeason: string; idLeague: string }[] | null }
export interface SportsDBSchedule { events: SportsDBEvent[] | null }
export interface SportsDBAllLeagues { leagues: SportsDBLeague[] | null }
export interface SportsDBAllSports { sports: { idSport: string; strSport: string; strSportThumb?: string }[] | null }
export interface SportsDBLivescores { events: SportsDBEvent[] | null }

export interface SportsDBLineup {
  lineup: {
    idPlayer: string;
    strPlayer: string;
    strTeam: string;
    strPosition: string;
    strFormation: string;
    intSquadNumber: string;
    strHome: string;
  }[] | null;
}

export interface SportsDBResults {
  results: {
    idEvent: string;
    idPlayer: string;
    strPlayer: string;
    strResult: string;
    strTeam: string;
  }[] | null;
}

export interface SportsDBEventStats {
  eventstats: {
    idEvent: string;
    strStat: string;
    intHome: string;
    intAway: string;
  }[] | null;
}

export interface SportsDBTimeline {
  timeline: {
    idEvent: string;
    strTimeline: string;
    strTimelineDetail: string;
    strTeam: string;
    strAction: string;
    strPlayer: string;
    strPlayer2?: string;
    intTime: string;
  }[] | null;
}

export interface SportsDBHighlights {
  highlights: {
    idEvent: string;
    strVideo: string;
    strThumb: string;
  }[] | null;
}

export interface SportsDBPlayerResults {
  results: SportsDBEvent[] | null;
}

export interface SportsDBPlayerHonours {
  honours: {
    idHonour: string;
    strHonour: string;
    strSeason: string;
    strTeam: string;
  }[] | null;
}

export interface SportsDBPlayerTeams {
  formerteams: {
    idFormerTeam: string;
    idPlayer: string;
    strFormerTeam: string;
    strSport: string;
    strMoveType: string;
    dateSigned: string;
    dateContractEnd: string;
  }[] | null;
}
