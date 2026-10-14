/**
 * GoalMetric AI - Core Shared Types
 * All domain and API contracts are strongly typed here.
 */

export interface TeamStats {
  id: string;
  name: string;
  shortName: string;
  league: string;
  homeAttackStrength: number;   // Ratio relative to league average (e.g. 1.25 = 25% above average)
  homeDefenseStrength: number;  // Ratio relative to league average (e.g. 0.85 = concedes 15% fewer)
  awayAttackStrength: number;
  awayDefenseStrength: number;
  recentForm: ('W' | 'D' | 'L')[];
  avgGoalsScored: number;
  avgGoalsConceded: number;
  expectedGoalsFor: number;     // xGF per match
  expectedGoalsAgainst: number; // xGA per match
}

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  bttsYes: number;
  bttsNo: number;
  bookmaker: string;
}

export interface MatchFixture {
  id: string;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  league: string;
  season: string;
  kickoffTime: string; // ISO 8601
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  venue: string;
  isDemo: true; // Strict requirement: explicitly marks simulation/demo data
  odds?: MatchOdds;
  actualResult?: {
    homeScore: number;
    awayScore: number;
    homeXg?: number;
    awayXg?: number;
    finishedAt?: string;
  };
  modelVersion?: string;
  dataSnapshotAt?: string;
  statisticalFactors?: {
    homeAdvantageMultiplier: number;
    leagueAvgGoals: number;
    sampleSizeMatches: number;
    isNewlyPromotedAlert?: boolean;
    eloDifference?: number;
    calibrationBrierScore?: number;
    lowScoreAdjustmentRho?: number;
  };
}

export interface ScoreMatrixProbability {
  homeGoals: number;
  awayGoals: number;
  probability: number; // 0.00 to 1.00
}

export interface PredictionResult {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  calculationEngine: 'TYPESCRIPT_POISSON_V1' | 'PYTHON_DIXON_COLES_V1' | 'GOALMETRIC_POISSON_ELO_HYBRID_V2.1';
  modelVersion?: string;
  dataSnapshotAt?: string;
  homeLambda: number; // Expected home goals
  awayLambda: number; // Expected away goals
  probabilities: {
    homeWin: number; // e.g. 0.52 = 52%
    draw: number;    // e.g. 0.26 = 26%
    awayWin: number; // e.g. 0.22 = 22%
  };
  mostLikelyScore: {
    homeGoals: number;
    awayGoals: number;
    probability: number;
  };
  scoreMatrix: ScoreMatrixProbability[]; // top likely scorelines
  markets: {
    over25Goals: number;
    under25Goals: number;
    bothTeamsToScore: number;
    homeCleanSheet: number;
    awayCleanSheet: number;
  };
  valueBets: {
    market: string;
    modelProbability: number;
    bookmakerOdds: number;
    impliedProbability: number;
    edgePercentage: number;
    hasValue: boolean; // edge > 0.05 (5%)
  }[];
  confidenceRating: 'LOW' | 'MEDIUM' | 'HIGH';
  isDemo: true; // Mandatory flag
  timestamp: string;
  calibrationMetrics?: {
    brierScore: number;
    logLoss: number;
    baselineBrier: number;
    reliabilityRating: string;
  };
  statisticalAudit?: {
    homeAttackShrunk: number;
    homeDefenseShrunk: number;
    awayAttackShrunk: number;
    awayDefenseShrunk: number;
    homeAdvantageFactor: number;
    eloHome: number;
    eloAway: number;
  };
  limitations?: string[];
  status?: 'READY' | 'POSTPONED' | 'INSUFFICIENT_DATA';
}

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'elite';
export type SubscriptionStatus = 'active' | 'pending' | 'past_due' | 'canceled' | 'expired' | 'refunded';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  priceMonthlyUsd: number;
  features: string[];
  dailyPredictionLimit: number;
  hasValueBetDetection: boolean;
  hasPythonDixonColesEngine: boolean;
  hasApiAccess: boolean;
}

export interface UserSubscription {
  id: string; // sub_xxx
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingPeriod: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  gracePeriodEnd?: string;
  gatewayCustomerId: string;
  gatewaySubscriptionId?: string;
  lastPaymentId?: string;
  lastPaymentStatus?: 'succeeded' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface BillingTransaction {
  id: string; // txn_xxx
  userId: string;
  subscriptionId?: string;
  amount: number; // e.g. 29.00 USD
  currency: string;
  status: 'succeeded' | 'failed' | 'refunded' | 'pending';
  paymentMethod: {
    brand: string;
    last4: string;
  };
  description: string;
  receiptUrl?: string;
  failureReason?: string;
  gatewayReference: string;
  createdAt: string;
}

export interface WebhookEventRecord {
  id: string;
  eventType: string;
  receivedAt: string;
  processed: boolean;
  status: 'SUCCESS' | 'DUPLICATE' | 'FAILED' | 'REJECTED';
  detail?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  subscriptionTier: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  predictionsRemainingToday: number;
  apiKey?: string;
  avatarUrl?: string;
  joinedAt?: string;
}

export interface HeadToHeadRecord {
  homeTeamName: string;
  awayTeamName: string;
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  avgTotalGoals: number;
  bttsRate: number; // e.g. 0.65 = 65%
  over25Rate: number; // e.g. 0.70 = 70%
  pastEncounters: {
    id: string;
    date: string;
    competition: string;
    homeScore: number;
    awayScore: number;
    homeXg: number;
    awayXg: number;
    isDemo: true;
  }[];
}

export interface ComboBetItem {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  selectedMarket: string;
  modelProb: number;
  bookmakerOdds: number;
  edgePercentage: number;
}

export interface ComboBetSlip {
  items: ComboBetItem[];
  combinedModelProbability: number;
  combinedDecimalOdds: number;
  combinedImpliedProbability: number;
  totalEdgePercentage: number;
  recommendedKellyStakePct: number;
}

export interface InvoiceRecord {
  id: string;
  date: string;
  amountUsd: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  planName: string;
  downloadUrl: string;
  isDemo: true;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  tier: 'free' | 'pro' | 'elite';
  predictionsUsedToday: number;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
  isDemo: true;
}

export interface LeagueStandingRow {
  rank: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  xgRatio: number;
  isDemo: true;
}

