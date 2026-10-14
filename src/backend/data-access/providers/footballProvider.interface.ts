/**
 * GoalMetric AI - Football Data Provider Interface & Normalization Contracts
 * Decoupled abstract contract for external football data providers.
 * SECURITY: API keys and HTTP calls must strictly remain server-side.
 */

import { MatchOdds } from '../../../types';

export interface NormalizedLeague {
  id: string; // External provider league ID (e.g. "39" for Premier League)
  name: string;
  country: string;
  season: string;
  isCup: boolean;
  logoUrl?: string;
  flagUrl?: string;
}

export interface NormalizedTeam {
  id: string; // External provider team ID
  name: string;
  shortName: string;
  leagueId: string;
  leagueName: string;
  logoUrl?: string;
  venueName: string;
  // Attack and defense strength ratios relative to league baseline
  homeAttackStrength: number;
  homeDefenseStrength: number;
  awayAttackStrength: number;
  awayDefenseStrength: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  expectedGoalsFor: number;
  expectedGoalsAgainst: number;
  recentForm: ('W' | 'D' | 'L')[];
}

export interface NormalizedFixture {
  id: string;
  externalId: string; // Provider fixture ID to prevent duplicates
  leagueId: string;
  leagueName: string;
  season: string;
  kickoffTime: string; // ISO 8601
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  statusRaw: string;   // e.g. 'NS', '1H', 'HT', '2H', 'FT', 'PST'
  elapsedMinutes: number | null;
  venue: string;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  homeScore: number | null;
  awayScore: number | null;
  odds?: MatchOdds;
  isDemo: boolean;
  providerSource: string;
  syncedAt: string;
}

export interface NormalizedMatchStats {
  fixtureId: string;
  hasDetailedStats: boolean; // Flag: not all leagues support detailed stats
  hasXgData: boolean;        // Flag: lower leagues often lack xG
  shotsOnGoal: { home: number; away: number };
  totalShots: { home: number; away: number };
  possessionPct: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  expectedGoals: { home: number; away: number } | null;
}

export interface NormalizedH2H {
  teamAId: string;
  teamBId: string;
  totalPlayed: number;
  teamAWins: number;
  draws: number;
  teamBWins: number;
  avgGoalsPerMatch: number;
  bttsRate: number;
  over25Rate: number;
  encounters: {
    externalId: string;
    date: string;
    competition: string;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: number;
    awayScore: number;
  }[];
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  status: 'SUCCESS' | 'CACHED' | 'RATE_LIMITED' | 'STALE_FALLBACK' | 'ERROR';
  itemsCount: number;
  latencyMs: number;
  message: string;
  retryAttempts: number;
  isDemoFallback: boolean;
}

export interface IFootballDataProvider {
  readonly providerName: string;
  readonly isConfigured: boolean;

  getLeagues(): Promise<NormalizedLeague[]>;
  getTeams(leagueId: string, season: string): Promise<NormalizedTeam[]>;
  getFixtures(leagueId: string, season: string, nextLimit?: number): Promise<NormalizedFixture[]>;
  getResults(leagueId: string, season: string, lastLimit?: number): Promise<NormalizedFixture[]>;
  getMatchStatistics(externalFixtureId: string): Promise<NormalizedMatchStats | null>;
  getHeadToHead(teamAExternalId: string, teamBExternalId: string, limit?: number): Promise<NormalizedH2H | null>;
  getOdds(externalFixtureId: string): Promise<MatchOdds | null>;
  getSyncLogs(): SyncLogEntry[];
}
