/**
 * GoalMetric AI - Football Data & Analytics Service
 * Decoupled data source layer providing typed interfaces and repositories.
 * STRICT COMPLIANCE: All demonstration datasets carry isDemo: true and [DEMO] labeling.
 */

import { HeadToHeadRecord, LeagueStandingRow, InvoiceRecord, AdminUserRow, ComboBetItem, ComboBetSlip } from '../../types';

export const DEMO_STANDINGS: Record<string, LeagueStandingRow[]> = {
  'Premier League': [
    { rank: 1, teamName: 'Arsenal [DEMO]', played: 28, won: 20, drawn: 5, lost: 3, goalsFor: 62, goalsAgainst: 24, goalDiff: 38, points: 65, xgRatio: 1.84, isDemo: true },
    { rank: 2, teamName: 'Manchester City [DEMO]', played: 28, won: 19, drawn: 6, lost: 3, goalsFor: 67, goalsAgainst: 26, goalDiff: 41, points: 63, xgRatio: 1.95, isDemo: true },
    { rank: 3, teamName: 'Liverpool FC [DEMO]', played: 28, won: 19, drawn: 5, lost: 4, goalsFor: 65, goalsAgainst: 28, goalDiff: 37, points: 62, xgRatio: 1.80, isDemo: true },
    { rank: 4, teamName: 'Aston Villa [DEMO]', played: 28, won: 16, drawn: 5, lost: 7, goalsFor: 54, goalsAgainst: 37, goalDiff: 17, points: 53, xgRatio: 1.35, isDemo: true },
    { rank: 5, teamName: 'Tottenham Hotspur [DEMO]', played: 28, won: 15, drawn: 5, lost: 8, goalsFor: 55, goalsAgainst: 42, goalDiff: 13, points: 50, xgRatio: 1.28, isDemo: true },
    { rank: 6, teamName: 'Chelsea FC [DEMO]', played: 28, won: 13, drawn: 7, lost: 8, goalsFor: 49, goalsAgainst: 38, goalDiff: 11, points: 46, xgRatio: 1.31, isDemo: true },
  ],
  'La Liga': [
    { rank: 1, teamName: 'Real Madrid [DEMO]', played: 28, won: 21, drawn: 6, lost: 1, goalsFor: 64, goalsAgainst: 18, goalDiff: 46, points: 69, xgRatio: 1.92, isDemo: true },
    { rank: 2, teamName: 'Barcelona [DEMO]', played: 28, won: 19, drawn: 5, lost: 4, goalsFor: 68, goalsAgainst: 31, goalDiff: 37, points: 62, xgRatio: 1.85, isDemo: true },
    { rank: 3, teamName: 'Atletico Madrid [DEMO]', played: 28, won: 17, drawn: 4, lost: 7, goalsFor: 54, goalsAgainst: 31, goalDiff: 23, points: 55, xgRatio: 1.45, isDemo: true },
    { rank: 4, teamName: 'Girona FC [DEMO]', played: 28, won: 16, drawn: 6, lost: 6, goalsFor: 52, goalsAgainst: 35, goalDiff: 17, points: 54, xgRatio: 1.38, isDemo: true },
  ],
  'Serie A': [
    { rank: 1, teamName: 'Inter Milan [DEMO]', played: 28, won: 22, drawn: 4, lost: 2, goalsFor: 65, goalsAgainst: 14, goalDiff: 51, points: 70, xgRatio: 2.10, isDemo: true },
    { rank: 2, teamName: 'Juventus [DEMO]', played: 28, won: 17, drawn: 7, lost: 4, goalsFor: 44, goalsAgainst: 21, goalDiff: 23, points: 58, xgRatio: 1.55, isDemo: true },
    { rank: 3, teamName: 'AC Milan [DEMO]', played: 28, won: 17, drawn: 5, lost: 6, goalsFor: 52, goalsAgainst: 32, goalDiff: 20, points: 56, xgRatio: 1.48, isDemo: true },
  ],
};

export const DEMO_INVOICES: InvoiceRecord[] = [
  { id: 'INV-2026-003', date: '2026-10-01', amountUsd: 29, status: 'PAID', planName: 'Pro Analyst Monthly', downloadUrl: '#', isDemo: true },
  { id: 'INV-2026-002', date: '2026-09-01', amountUsd: 29, status: 'PAID', planName: 'Pro Analyst Monthly', downloadUrl: '#', isDemo: true },
  { id: 'INV-2026-001', date: '2026-08-01', amountUsd: 29, status: 'PAID', planName: 'Pro Analyst Monthly', downloadUrl: '#', isDemo: true },
];

export const DEMO_ADMIN_USERS: AdminUserRow[] = [
  { id: 'usr_01', email: 'analyst@goalmetric.demo', name: 'Marco Silva', role: 'user', tier: 'pro', predictionsUsedToday: 24, status: 'ACTIVE', joinedDate: '2026-02-15', isDemo: true },
  { id: 'usr_02', email: 'syndicate.lead@quantbet.io', name: 'David Chen', role: 'user', tier: 'elite', predictionsUsedToday: 182, status: 'ACTIVE', joinedDate: '2026-01-10', isDemo: true },
  { id: 'usr_03', email: 'rookie.scout@footy.net', name: 'Andi Pratama', role: 'user', tier: 'free', predictionsUsedToday: 3, status: 'ACTIVE', joinedDate: '2026-03-22', isDemo: true },
  { id: 'usr_04', email: 'lead.architect@goalmetric.demo', name: 'Tech Lead Architect', role: 'admin', tier: 'elite', predictionsUsedToday: 54, status: 'ACTIVE', joinedDate: '2026-01-01', isDemo: true },
  { id: 'usr_05', email: 'stale.bot@crawler.xyz', name: 'Suspicious Crawler', role: 'user', tier: 'free', predictionsUsedToday: 50, status: 'SUSPENDED', joinedDate: '2026-04-05', isDemo: true },
];

export async function fetchHeadToHead(homeTeam: string, awayTeam: string): Promise<HeadToHeadRecord> {
  // Simulated asynchronous network delay to evaluate loading states
  await new Promise(r => setTimeout(r, 200));

  return {
    homeTeamName: homeTeam,
    awayTeamName: awayTeam,
    totalMatches: 8,
    homeWins: 4,
    draws: 2,
    awayWins: 2,
    avgTotalGoals: 2.85,
    bttsRate: 0.625,
    over25Rate: 0.75,
    pastEncounters: [
      { id: 'h2h-1', date: '2025-09-22', competition: 'League Matchday 5 [DEMO]', homeScore: 2, awayScore: 2, homeXg: 1.95, awayXg: 2.10, isDemo: true },
      { id: 'h2h-2', date: '2025-03-31', competition: 'League Matchday 30 [DEMO]', homeScore: 0, awayScore: 0, homeXg: 0.85, awayXg: 0.92, isDemo: true },
      { id: 'h2h-3', date: '2024-10-08', competition: 'League Matchday 8 [DEMO]', homeScore: 1, awayScore: 0, homeXg: 1.45, awayXg: 0.65, isDemo: true },
      { id: 'h2h-4', date: '2024-04-26', competition: 'League Matchday 33 [DEMO]', homeScore: 1, awayScore: 3, homeXg: 1.12, awayXg: 2.84, isDemo: true },
      { id: 'h2h-5', date: '2023-11-15', competition: 'Cup Quarter-Final [DEMO]', homeScore: 2, awayScore: 1, homeXg: 2.20, awayXg: 1.15, isDemo: true },
    ],
  };
}

export function computeComboBetSlip(items: ComboBetItem[]): ComboBetSlip {
  if (items.length === 0) {
    return {
      items: [],
      combinedModelProbability: 0,
      combinedDecimalOdds: 0,
      combinedImpliedProbability: 0,
      totalEdgePercentage: 0,
      recommendedKellyStakePct: 0,
    };
  }

  // Multiply independent match probabilities
  const combinedProb = items.reduce((acc, item) => acc * item.modelProb, 1.0);
  const combinedOdds = items.reduce((acc, item) => acc * item.bookmakerOdds, 1.0);
  const combinedImplied = 1.0 / combinedOdds;

  // Expected Value: EV = (P * Odds) - 1
  const ev = (combinedProb * combinedOdds) - 1.0;
  const edgePct = ev * 100;

  // Conservative quarter-Kelly fraction
  const b = combinedOdds - 1;
  const q = 1 - combinedProb;
  const fullKelly = b > 0 ? (b * combinedProb - q) / b : 0;
  const quarterKelly = Math.max(0, Math.min(0.04, fullKelly * 0.25));

  return {
    items,
    combinedModelProbability: Number(combinedProb.toFixed(4)),
    combinedDecimalOdds: Number(combinedOdds.toFixed(2)),
    combinedImpliedProbability: Number(combinedImplied.toFixed(4)),
    totalEdgePercentage: Number(edgePct.toFixed(1)),
    recommendedKellyStakePct: Number((quarterKelly * 100).toFixed(1)),
  };
}
