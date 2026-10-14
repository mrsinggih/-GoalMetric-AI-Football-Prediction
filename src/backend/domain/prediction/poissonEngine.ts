/**
 * GoalMetric AI - Dixon-Coles Adjusted Poisson Distribution Prediction Engine
 * Domain Logic Layer: Pure business mathematics, free from HTTP/database dependencies.
 */

import { MatchFixture, PredictionResult, ScoreMatrixProbability, TeamStats } from '../../../types';

// League baseline averages (Premier League / Top European standard: ~1.45 home goals, ~1.15 away goals)
export const DEFAULT_LEAGUE_AVG_HOME_GOALS = 1.48;
export const DEFAULT_LEAGUE_AVG_AWAY_GOALS = 1.18;

// Factorial helper
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Standard Poisson probability: P(X = k) = (lambda^k * exp(-lambda)) / k!
 */
export function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Dixon-Coles correlation adjustment factor tau(x, y; lambda, mu, rho)
 * Adjusts for empirical underestimation of draws (0-0, 1-1) and low scores.
 */
function dixonColesTau(x: number, y: number, lambda: number, mu: number, rho: number = -0.11): number {
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

export interface EngineInput {
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  leagueAvgHomeGoals?: number;
  leagueAvgAwayGoals?: number;
  useDixonColesAdjustment?: boolean;
}

/**
 * Calculate expected goals (lambda) and match probabilities
 */
export function calculateMatchPrediction(
  matchId: string,
  input: EngineInput,
  odds?: MatchFixture['odds']
): PredictionResult {
  const avgHome = input.leagueAvgHomeGoals || DEFAULT_LEAGUE_AVG_HOME_GOALS;
  const avgAway = input.leagueAvgAwayGoals || DEFAULT_LEAGUE_AVG_AWAY_GOALS;

  // Expected home goals = Home Attack * Away Defense * League Average Home Goals
  const rawHomeLambda = input.homeTeam.homeAttackStrength * input.awayTeam.awayDefenseStrength * avgHome;
  // Expected away goals = Away Attack * Home Defense * League Average Away Goals
  const rawAwayLambda = input.awayTeam.awayAttackStrength * input.homeTeam.homeDefenseStrength * avgAway;

  // Bound lambdas to realistic football limits [0.25 to 5.50]
  const homeLambda = Math.max(0.25, Math.min(5.5, Number(rawHomeLambda.toFixed(2))));
  const awayLambda = Math.max(0.25, Math.min(5.5, Number(rawAwayLambda.toFixed(2))));

  const MAX_GOALS = 6;
  const matrix: ScoreMatrixProbability[] = [];

  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;

  let over25Prob = 0;
  let under25Prob = 0;
  let bttsProb = 0;
  let homeCleanSheetProb = 0;
  let awayCleanSheetProb = 0;

  let totalProbSum = 0;

  // Compute 0-6 score probability grid
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const pHome = poissonPmf(h, homeLambda);
      const pAway = poissonPmf(a, awayLambda);
      let prob = pHome * pAway;

      if (input.useDixonColesAdjustment !== false) {
        const tau = dixonColesTau(h, a, homeLambda, awayLambda);
        prob = Math.max(0, prob * tau);
      }

      matrix.push({ homeGoals: h, awayGoals: a, probability: prob });
      totalProbSum += prob;

      if (h > a) homeWinProb += prob;
      else if (h === a) drawProb += prob;
      else awayWinProb += prob;

      if (h + a > 2.5) over25Prob += prob;
      else under25Prob += prob;

      if (h > 0 && a > 0) bttsProb += prob;
      if (a === 0) homeCleanSheetProb += prob;
      if (h === 0) awayCleanSheetProb += prob;
    }
  }

  // Normalize probabilities to strictly sum to 1.0 (100%)
  if (totalProbSum > 0) {
    homeWinProb /= totalProbSum;
    drawProb /= totalProbSum;
    awayWinProb /= totalProbSum;
    over25Prob /= totalProbSum;
    under25Prob /= totalProbSum;
    bttsProb /= totalProbSum;
    homeCleanSheetProb /= totalProbSum;
    awayCleanSheetProb /= totalProbSum;
    matrix.forEach(cell => {
      cell.probability = Number((cell.probability / totalProbSum).toFixed(4));
    });
  }

  // Sort score matrix to find top 5 most likely scores
  matrix.sort((a, b) => b.probability - a.probability);
  const mostLikely = matrix[0] || { homeGoals: 1, awayGoals: 1, probability: 0.12 };

  // Calculate Value Bets if bookmaker odds provided
  const valueBets: PredictionResult['valueBets'] = [];

  if (odds) {
    const marketsToCheck = [
      { market: 'Home Win', modelProb: homeWinProb, bookOdds: odds.homeWin },
      { market: 'Draw', modelProb: drawProb, bookOdds: odds.draw },
      { market: 'Away Win', modelProb: awayWinProb, bookOdds: odds.awayWin },
      { market: 'Over 2.5 Goals', modelProb: over25Prob, bookOdds: odds.over25 },
      { market: 'Under 2.5 Goals', modelProb: under25Prob, bookOdds: odds.under25 },
      { market: 'Both Teams To Score (Yes)', modelProb: bttsProb, bookOdds: odds.bttsYes },
    ];

    marketsToCheck.forEach(m => {
      if (m.bookOdds > 1.0) {
        const impliedProb = 1 / m.bookOdds;
        const edge = (m.modelProb * m.bookOdds) - 1; // Expected Value formula
        valueBets.push({
          market: m.market,
          modelProbability: Number(m.modelProb.toFixed(3)),
          bookmakerOdds: m.bookOdds,
          impliedProbability: Number(impliedProb.toFixed(3)),
          edgePercentage: Number((edge * 100).toFixed(1)),
          hasValue: edge > 0.05, // 5%+ edge
        });
      }
    });
  }

  // Confidence rating heuristic
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  const highestOutcomeProb = Math.max(homeWinProb, awayWinProb, drawProb);
  if (highestOutcomeProb > 0.58) confidence = 'HIGH';
  else if (highestOutcomeProb < 0.40) confidence = 'LOW';

  return {
    matchId,
    homeTeamName: input.homeTeam.name,
    awayTeamName: input.awayTeam.name,
    calculationEngine: 'TYPESCRIPT_POISSON_V1',
    homeLambda,
    awayLambda,
    probabilities: {
      homeWin: Number(homeWinProb.toFixed(3)),
      draw: Number(drawProb.toFixed(3)),
      awayWin: Number(awayWinProb.toFixed(3)),
    },
    mostLikelyScore: {
      homeGoals: mostLikely.homeGoals,
      awayGoals: mostLikely.awayGoals,
      probability: mostLikely.probability,
    },
    scoreMatrix: matrix.slice(0, 10), // Return top 10 scorelines
    markets: {
      over25Goals: Number(over25Prob.toFixed(3)),
      under25Goals: Number(under25Prob.toFixed(3)),
      bothTeamsToScore: Number(bttsProb.toFixed(3)),
      homeCleanSheet: Number(homeCleanSheetProb.toFixed(3)),
      awayCleanSheet: Number(awayCleanSheetProb.toFixed(3)),
    },
    valueBets,
    confidenceRating: confidence,
    isDemo: true, // Strict requirement: explicitly labeled demo
    timestamp: new Date().toISOString(),
  };
}
