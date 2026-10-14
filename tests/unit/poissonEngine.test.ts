/**
 * GoalMetric AI - Unit Test: Poisson & Dixon-Coles Engine
 * Validates mathematical soundness, normalization, and bounds.
 */

import { poissonPmf, calculateMatchPrediction } from '../../src/backend/domain/prediction/poissonEngine';
import { TeamStats } from '../../src/types';

export function runPoissonTests(): { name: string; passed: boolean; message?: string }[] {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Poisson PMF math verification
  try {
    // For lambda = 1.0, k = 0, P(0; 1) = e^(-1) ~ 0.367879
    const p0 = poissonPmf(0, 1.0);
    const p1 = poissonPmf(1, 1.0);
    const passed = Math.abs(p0 - 0.367879) < 0.0001 && Math.abs(p1 - 0.367879) < 0.0001;
    results.push({
      name: 'Poisson PMF: computes exact theoretical probabilities for known lambda',
      passed,
      message: passed ? undefined : `Expected ~0.367879, got p0=${p0}, p1=${p1}`,
    });
  } catch (err: any) {
    results.push({ name: 'Poisson PMF math check', passed: false, message: err.message });
  }

  // Test 2: Full Match Prediction Probabilities Normalization
  try {
    const dummyHome: TeamStats = {
      id: 'test-h',
      name: 'Test Home [DEMO]',
      shortName: 'TH',
      league: 'Test League',
      homeAttackStrength: 1.3,
      homeDefenseStrength: 0.8,
      awayAttackStrength: 1.0,
      awayDefenseStrength: 1.0,
      recentForm: ['W', 'W'],
      avgGoalsScored: 2.0,
      avgGoalsConceded: 0.9,
      expectedGoalsFor: 2.1,
      expectedGoalsAgainst: 0.85,
    };

    const dummyAway: TeamStats = {
      id: 'test-a',
      name: 'Test Away [DEMO]',
      shortName: 'TA',
      league: 'Test League',
      homeAttackStrength: 1.0,
      homeDefenseStrength: 1.0,
      awayAttackStrength: 0.9,
      awayDefenseStrength: 1.2,
      recentForm: ['L', 'D'],
      avgGoalsScored: 1.2,
      avgGoalsConceded: 1.6,
      expectedGoalsFor: 1.1,
      expectedGoalsAgainst: 1.7,
    };

    const prediction = calculateMatchPrediction('test-match-1', {
      homeTeam: dummyHome,
      awayTeam: dummyAway,
    });

    const sum1x2 = prediction.probabilities.homeWin + prediction.probabilities.draw + prediction.probabilities.awayWin;
    const passedSum = Math.abs(sum1x2 - 1.0) <= 0.01;

    const sumTotals = prediction.markets.over25Goals + prediction.markets.under25Goals;
    const passedTotals = Math.abs(sumTotals - 1.0) <= 0.01;

    const passedStrictDemo = prediction.isDemo === true;

    results.push({
      name: 'Match Prediction: 1X2 probabilities strictly sum to 1.00 (+-0.01)',
      passed: passedSum,
      message: passedSum ? undefined : `1X2 sum was ${sum1x2}`,
    });

    results.push({
      name: 'Match Prediction: Over/Under 2.5 probabilities sum to 1.00 (+-0.01)',
      passed: passedTotals,
      message: passedTotals ? undefined : `Over/Under sum was ${sumTotals}`,
    });

    results.push({
      name: 'Match Prediction: result strictly carries isDemo: true flag',
      passed: passedStrictDemo,
      message: passedStrictDemo ? undefined : 'isDemo flag missing or false',
    });
  } catch (err: any) {
    results.push({ name: 'Match prediction calculation', passed: false, message: err.message });
  }

  return results;
}
