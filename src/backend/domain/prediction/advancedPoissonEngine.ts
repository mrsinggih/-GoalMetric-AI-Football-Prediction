/**
 * GoalMetric AI - Advanced Poisson & Dixon-Coles Prediction Engine
 * Statistical Module: Completely decoupled from UI.
 *
 * Implements:
 * - Attack strength, defense strength, and calibrated home advantage factor
 * - Bayesian shrinkage for small-sample sizes and newly promoted teams
 * - Dixon-Coles bivariate low-score correlation adjustment (tau)
 * - Complete probability distribution (0-7 x 0-7 scorelines)
 * - Markets: 1X2, Over/Under 0.5-4.5, BTTS, Clean Sheets, Double Chance
 * - Full audit metadata trail (model_version, generated_at, data_snapshot_at, input_features)
 * - Postponed match handling
 * - Elo rating benchmark integration
 */

import { EloMatchPrediction, eloRatingEngine } from './eloRatingEngine';
import { ScoreMatrixProbability } from '../../../types';

export const MODEL_VERSION = 'GOALMETRIC_POISSON_ELO_HYBRID_V2.1';

export interface StatisticalTeamProfile {
  id: string;
  name: string;
  matchesPlayed: number; // For sample size evaluation
  isNewlyPromoted?: boolean;
  attackStrength: number;   // Raw observed ratio
  defenseStrength: number;  // Raw observed ratio
  avgGoalsScored: number;
  avgGoalsConceded: number;
  expectedGoalsFor?: number;
  expectedGoalsAgainst?: number;
  eloRating?: number;
}

export interface EngineFeatureAudit {
  homeAttackObserved: number;
  homeDefenseObserved: number;
  homeAttackShrunk: number;
  homeDefenseShrunk: number;
  awayAttackObserved: number;
  awayDefenseObserved: number;
  awayAttackShrunk: number;
  awayDefenseShrunk: number;
  homeAdvantageFactor: number;
  leagueAvgHomeGoals: number;
  leagueAvgAwayGoals: number;
  sampleWeightHome: number;
  sampleWeightAway: number;
  homeElo: number;
  awayElo: number;
  homeNewlyPromoted: boolean;
  awayNewlyPromoted: boolean;
}

export interface ComprehensivePredictionOutput {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  status: 'READY' | 'POSTPONED_CANNOT_PREDICT' | 'INSUFFICIENT_DATA';
  audit: {
    model_version: string;
    generated_at: string;
    data_snapshot_at: string;
    input_features: EngineFeatureAudit;
  };
  expectedGoals: {
    homeLambda: number;
    awayLambda: number;
    totalExpectedGoals: number;
  };
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  doubleChance: {
    homeOrDraw: number;
    homeOrAway: number;
    drawOrAway: number;
  };
  overUnderMarkets: {
    over05: number;
    under05: number;
    over15: number;
    under15: number;
    over25: number;
    under25: number;
    over35: number;
    under35: number;
    over45: number;
    under45: number;
  };
  bothTeamsToScore: {
    yes: number;
    no: number;
  };
  cleanSheets: {
    homeCleanSheet: number;
    awayCleanSheet: number;
  };
  mostLikelyScore: {
    homeGoals: number;
    awayGoals: number;
    probability: number;
  };
  scoreMatrixGrid: ScoreMatrixProbability[]; // Top 15 scorelines
  eloBenchmark: EloMatchPrediction;
  modelConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
  isDemo: true;
}

/**
 * Standard Poisson probability mass function:
 * P(X = k) = (lambda^k * e^-lambda) / k!
 */
export function computePoissonPmf(k: number, lambda: number): number {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;

  // Protect against factorial integer overflow for large k using log-gamma / log accumulation
  let logP = -lambda + k * Math.log(lambda);
  let logFactorial = 0;
  for (let i = 2; i <= k; i++) {
    logFactorial += Math.log(i);
  }
  logP -= logFactorial;

  return Math.exp(logP);
}

/**
 * Dixon-Coles tau adjustment for score dependence on low goals:
 * tau(0,0), tau(1,0), tau(0,1), tau(1,1) with parameter rho = -0.11
 */
export function computeDixonColesTau(
  x: number,
  y: number,
  lambda: number,
  mu: number,
  rho: number = -0.11
): number {
  if (x === 0 && y === 0) {
    return 1 - (lambda * mu * rho);
  } else if (x === 0 && y === 1) {
    return 1 + (lambda * rho);
  } else if (x === 1 && y === 0) {
    return 1 + (mu * rho);
  } else if (x === 1 && y === 1) {
    return 1 - rho;
  }
  return 1.0;
}

/**
 * Empirical Bayes shrinkage towards the mean (1.00) for small sample sizes
 * Weight = N / (N + N0), where N0 is the shrinkage half-life parameter (~8 matches)
 */
export function applyBayesianShrinkage(
  observedMetric: number,
  matchesPlayed: number,
  priorMean: number = 1.00,
  n0: number = 8
): { shrunkValue: number; weight: number } {
  const safeN = Math.max(0, matchesPlayed);
  const weight = safeN / (safeN + n0);
  const shrunk = weight * observedMetric + (1.0 - weight) * priorMean;
  return {
    shrunkValue: Number(shrunk.toFixed(3)),
    weight: Number(weight.toFixed(3)),
  };
}

export class AdvancedPoissonEngine {
  readonly defaultLeagueAvgHomeGoals: number = 1.48;
  readonly defaultLeagueAvgAwayGoals: number = 1.18;
  readonly homeAdvantageMultiplier: number = 1.08; // ~8% net attacking lift at home

  /**
   * Generates full statistical prediction with feature shrinkage, Dixon-Coles correction,
   * audit trail, and Elo comparison.
   */
  predictMatch(
    matchId: string,
    homeTeam: StatisticalTeamProfile,
    awayTeam: StatisticalTeamProfile,
    options?: {
      leagueAvgHomeGoals?: number;
      leagueAvgAwayGoals?: number;
      dataSnapshotTime?: string;
      isPostponed?: boolean;
    }
  ): ComprehensivePredictionOutput {
    const dataSnapshotAt = options?.dataSnapshotTime || new Date().toISOString();
    const generatedAt = new Date().toISOString();

    // 1. Check for postponed match
    if (options?.isPostponed) {
      return this.createPostponedOutput(matchId, homeTeam, awayTeam, generatedAt, dataSnapshotAt);
    }

    const avgHome = options?.leagueAvgHomeGoals || this.defaultLeagueAvgHomeGoals;
    const avgAway = options?.leagueAvgAwayGoals || this.defaultLeagueAvgAwayGoals;

    // 2. Handle Small Sample Sizes & Newly Promoted Teams using Bayesian Shrinkage
    // Newly promoted teams have an inflated defense prior (expected to concede 20% more initially)
    const homeDefensePrior = homeTeam.isNewlyPromoted ? 1.20 : 1.00;
    const awayDefensePrior = awayTeam.isNewlyPromoted ? 1.20 : 1.00;
    const homeAttackPrior = homeTeam.isNewlyPromoted ? 0.90 : 1.00;
    const awayAttackPrior = awayTeam.isNewlyPromoted ? 0.90 : 1.00;

    const homeAttShrink = applyBayesianShrinkage(homeTeam.attackStrength, homeTeam.matchesPlayed, homeAttackPrior);
    const homeDefShrink = applyBayesianShrinkage(homeTeam.defenseStrength, homeTeam.matchesPlayed, homeDefensePrior);

    const awayAttShrink = applyBayesianShrinkage(awayTeam.attackStrength, awayTeam.matchesPlayed, awayAttackPrior);
    const awayDefShrink = applyBayesianShrinkage(awayTeam.defenseStrength, awayTeam.matchesPlayed, awayDefensePrior);

    // 3. Compute Expected Goals (Lambdas) with calibrated Home Advantage
    // Lambda_H = Attack_H * Defense_A * HomeAdvantage * LeagueAvgHome
    const rawHomeLambda =
      homeAttShrink.shrunkValue *
      awayDefShrink.shrunkValue *
      this.homeAdvantageMultiplier *
      avgHome;

    // Lambda_A = Attack_A * Defense_H * LeagueAvgAway
    const rawAwayLambda =
      awayAttShrink.shrunkValue *
      homeDefShrink.shrunkValue *
      avgAway;

    // Mathematical sanity bounds: expected goals per team bounded between 0.20 and 5.50
    const homeLambda = Math.max(0.20, Math.min(5.50, Number(rawHomeLambda.toFixed(2))));
    const awayLambda = Math.max(0.20, Math.min(5.50, Number(rawAwayLambda.toFixed(2))));

    // 4. Compute 2D Score Matrix (0 to 7 goals)
    const MAX_GOALS = 7;
    const matrix: ScoreMatrixProbability[] = [];

    let pHomeWin = 0;
    let pDraw = 0;
    let pAwayWin = 0;

    let pOver05 = 0;
    let pOver15 = 0;
    let pOver25 = 0;
    let pOver35 = 0;
    let pOver45 = 0;

    let pBtts = 0;
    let pHomeCleanSheet = 0;
    let pAwayCleanSheet = 0;
    let totalProbabilitySum = 0;

    for (let h = 0; h <= MAX_GOALS; h++) {
      for (let a = 0; a <= MAX_GOALS; a++) {
        const pmfH = computePoissonPmf(h, homeLambda);
        const pmfA = computePoissonPmf(a, awayLambda);
        const tau = computeDixonColesTau(h, a, homeLambda, awayLambda);

        let cellProb = Math.max(0, pmfH * pmfA * tau);
        matrix.push({ homeGoals: h, awayGoals: a, probability: cellProb });
        totalProbabilitySum += cellProb;

        if (h > a) pHomeWin += cellProb;
        else if (h === a) pDraw += cellProb;
        else pAwayWin += cellProb;

        const totalGoals = h + a;
        if (totalGoals > 0.5) pOver05 += cellProb;
        if (totalGoals > 1.5) pOver15 += cellProb;
        if (totalGoals > 2.5) pOver25 += cellProb;
        if (totalGoals > 3.5) pOver35 += cellProb;
        if (totalGoals > 4.5) pOver45 += cellProb;

        if (h > 0 && a > 0) pBtts += cellProb;
        if (a === 0) pHomeCleanSheet += cellProb;
        if (h === 0) pAwayCleanSheet += cellProb;
      }
    }

    // 5. Strict Normalization: Ensure sum(1X2) = 1.0000 and all P in [0, 1]
    if (totalProbabilitySum > 0) {
      pHomeWin /= totalProbabilitySum;
      pDraw /= totalProbabilitySum;
      pAwayWin /= totalProbabilitySum;

      pOver05 /= totalProbabilitySum;
      pOver15 /= totalProbabilitySum;
      pOver25 /= totalProbabilitySum;
      pOver35 /= totalProbabilitySum;
      pOver45 /= totalProbabilitySum;

      pBtts /= totalProbabilitySum;
      pHomeCleanSheet /= totalProbabilitySum;
      pAwayCleanSheet /= totalProbabilitySum;

      for (const cell of matrix) {
        cell.probability = Number((cell.probability / totalProbabilitySum).toFixed(4));
      }
    }

    // Sort matrix descending to find most likely exact score
    matrix.sort((a, b) => b.probability - a.probability);
    const mostLikely = matrix[0] || { homeGoals: 1, awayGoals: 1, probability: 0.12 };

    // 6. Benchmark against Elo Rating System
    const homeElo = homeTeam.eloRating || eloRatingEngine.initializeTeamElo(homeTeam.isNewlyPromoted);
    const awayElo = awayTeam.eloRating || eloRatingEngine.initializeTeamElo(awayTeam.isNewlyPromoted);
    const eloBenchmark = eloRatingEngine.calculateMatchProbabilities(homeElo, awayElo);

    // 7. Confidence Rating Heuristic
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    const sampleSize = Math.min(homeTeam.matchesPlayed, awayTeam.matchesPlayed);
    if (sampleSize < 5 || homeTeam.isNewlyPromoted || awayTeam.isNewlyPromoted) {
      confidence = 'LOW';
    } else if (sampleSize >= 15 && Math.max(pHomeWin, pAwayWin) > 0.55) {
      confidence = 'HIGH';
    }

    // 8. Assemble Full Audit Trail
    const inputAudit: EngineFeatureAudit = {
      homeAttackObserved: homeTeam.attackStrength,
      homeDefenseObserved: homeTeam.defenseStrength,
      homeAttackShrunk: homeAttShrink.shrunkValue,
      homeDefenseShrunk: homeDefShrink.shrunkValue,
      awayAttackObserved: awayTeam.attackStrength,
      awayDefenseObserved: awayTeam.defenseStrength,
      awayAttackShrunk: awayAttShrink.shrunkValue,
      awayDefenseShrunk: awayDefShrink.shrunkValue,
      homeAdvantageFactor: this.homeAdvantageMultiplier,
      leagueAvgHomeGoals: avgHome,
      leagueAvgAwayGoals: avgAway,
      sampleWeightHome: homeAttShrink.weight,
      sampleWeightAway: awayAttShrink.weight,
      homeElo,
      awayElo,
      homeNewlyPromoted: Boolean(homeTeam.isNewlyPromoted),
      awayNewlyPromoted: Boolean(awayTeam.isNewlyPromoted),
    };

    return {
      matchId,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      status: 'READY',
      audit: {
        model_version: MODEL_VERSION,
        generated_at: generatedAt,
        data_snapshot_at: dataSnapshotAt,
        input_features: inputAudit,
      },
      expectedGoals: {
        homeLambda,
        awayLambda,
        totalExpectedGoals: Number((homeLambda + awayLambda).toFixed(2)),
      },
      probabilities: {
        homeWin: Number(pHomeWin.toFixed(4)),
        draw: Number(pDraw.toFixed(4)),
        awayWin: Number(pAwayWin.toFixed(4)),
      },
      doubleChance: {
        homeOrDraw: Number((pHomeWin + pDraw).toFixed(4)),
        homeOrAway: Number((pHomeWin + pAwayWin).toFixed(4)),
        drawOrAway: Number((pDraw + pAwayWin).toFixed(4)),
      },
      overUnderMarkets: {
        over05: Number(pOver05.toFixed(4)),
        under05: Number((1.0 - pOver05).toFixed(4)),
        over15: Number(pOver15.toFixed(4)),
        under15: Number((1.0 - pOver15).toFixed(4)),
        over25: Number(pOver25.toFixed(4)),
        under25: Number((1.0 - pOver25).toFixed(4)),
        over35: Number(pOver35.toFixed(4)),
        under35: Number((1.0 - pOver35).toFixed(4)),
        over45: Number(pOver45.toFixed(4)),
        under45: Number((1.0 - pOver45).toFixed(4)),
      },
      bothTeamsToScore: {
        yes: Number(pBtts.toFixed(4)),
        no: Number((1.0 - pBtts).toFixed(4)),
      },
      cleanSheets: {
        homeCleanSheet: Number(pHomeCleanSheet.toFixed(4)),
        awayCleanSheet: Number(pAwayCleanSheet.toFixed(4)),
      },
      mostLikelyScore: {
        homeGoals: mostLikely.homeGoals,
        awayGoals: mostLikely.awayGoals,
        probability: mostLikely.probability,
      },
      scoreMatrixGrid: matrix.slice(0, 15),
      eloBenchmark,
      modelConfidence: confidence,
      isDemo: true,
    };
  }

  private createPostponedOutput(
    matchId: string,
    homeTeam: StatisticalTeamProfile,
    awayTeam: StatisticalTeamProfile,
    generatedAt: string,
    dataSnapshotAt: string
  ): ComprehensivePredictionOutput {
    return {
      matchId,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      status: 'POSTPONED_CANNOT_PREDICT',
      audit: {
        model_version: MODEL_VERSION,
        generated_at: generatedAt,
        data_snapshot_at: dataSnapshotAt,
        input_features: {} as any,
      },
      expectedGoals: { homeLambda: 0, awayLambda: 0, totalExpectedGoals: 0 },
      probabilities: { homeWin: 0, draw: 0, awayWin: 0 },
      doubleChance: { homeOrDraw: 0, homeOrAway: 0, drawOrAway: 0 },
      overUnderMarkets: {
        over05: 0, under05: 0, over15: 0, under15: 0, over25: 0, under25: 0, over35: 0, under35: 0, over45: 0, under45: 0,
      },
      bothTeamsToScore: { yes: 0, no: 0 },
      cleanSheets: { homeCleanSheet: 0, awayCleanSheet: 0 },
      mostLikelyScore: { homeGoals: 0, awayGoals: 0, probability: 0 },
      scoreMatrixGrid: [],
      eloBenchmark: {
        homeElo: 1500,
        awayElo: 1500,
        homeEloAdvantage: 0,
        expectedScoreHome: 0.5,
        probabilities: { homeWin: 0.33, draw: 0.34, awayWin: 0.33 },
      },
      modelConfidence: 'LOW',
      isDemo: true,
    };
  }
}

export const advancedPoissonEngine = new AdvancedPoissonEngine();
