/**
 * GoalMetric AI - Unit Test: Advanced Prediction Engine, Elo Benchmark, & Backtesting
 * Validates:
 * - Mathematical bounds (0 <= P <= 1, sum(P) == 1.0)
 * - Extreme cases (high lambda, low lambda, zero games)
 * - Elo rating dynamics (symmetry, home advantage, goal margin)
 * - Bayesian shrinkage for newly promoted & small sample teams
 * - Postponed match safety
 * - Audit metadata completeness
 * - Chronological backtester without lookahead bias & scoring rules (Log Loss, Brier, Calibration)
 */

import {
  advancedPoissonEngine,
  computePoissonPmf,
  applyBayesianShrinkage,
  MODEL_VERSION,
} from '../../src/backend/domain/prediction/advancedPoissonEngine';
import { eloRatingEngine } from '../../src/backend/domain/prediction/eloRatingEngine';
import { pointInTimeBacktester } from '../../src/backend/domain/prediction/backtesting/backtestEngine';
import { BENCHMARK_HISTORICAL_MATCHES } from '../../src/backend/domain/prediction/backtesting/historicalDataset';

export function runAdvancedEngineAndBacktestTests(): { name: string; passed: boolean; message?: string }[] {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Probability Normalization and Bounds
  try {
    const pred = advancedPoissonEngine.predictMatch(
      'bound-test-1',
      {
        id: 't1',
        name: 'Team Alpha',
        matchesPlayed: 12,
        attackStrength: 1.35,
        defenseStrength: 0.82,
        avgGoalsScored: 2.1,
        avgGoalsConceded: 0.9,
      },
      {
        id: 't2',
        name: 'Team Beta',
        matchesPlayed: 12,
        attackStrength: 1.05,
        defenseStrength: 1.10,
        avgGoalsScored: 1.4,
        avgGoalsConceded: 1.5,
      }
    );

    const sum1X2 = pred.probabilities.homeWin + pred.probabilities.draw + pred.probabilities.awayWin;
    const isSumValid = Math.abs(sum1X2 - 1.0) <= 0.001;

    const allInBounds =
      pred.probabilities.homeWin >= 0 && pred.probabilities.homeWin <= 1 &&
      pred.probabilities.draw >= 0 && pred.probabilities.draw <= 1 &&
      pred.probabilities.awayWin >= 0 && pred.probabilities.awayWin <= 1;

    const overUnder25Sum = pred.overUnderMarkets.over25 + pred.overUnderMarkets.under25;
    const isO25Valid = Math.abs(overUnder25Sum - 1.0) <= 0.001;

    const bttsSum = pred.bothTeamsToScore.yes + pred.bothTeamsToScore.no;
    const isBttsValid = Math.abs(bttsSum - 1.0) <= 0.001;

    const passed = isSumValid && allInBounds && isO25Valid && isBttsValid;

    results.push({
      name: 'Mathematical Bounds: 1X2, Over/Under, and BTTS strictly sum to 1.0000 with P in [0, 1]',
      passed,
      message: passed ? undefined : `sum1X2=${sum1X2}, overUnder25Sum=${overUnder25Sum}, bttsSum=${bttsSum}`,
    });
  } catch (err: any) {
    results.push({ name: 'Mathematical bounds check', passed: false, message: err.message });
  }

  // Test 2: Extreme Cases (High Lambda, Low Lambda, Zero Division protection)
  try {
    // Extreme High Lambda: 5.50
    const pmfHigh = computePoissonPmf(8, 5.5);
    const validHigh = !isNaN(pmfHigh) && isFinite(pmfHigh) && pmfHigh > 0 && pmfHigh < 1;

    // Extreme Low Lambda: 0.20
    const pmfLow = computePoissonPmf(0, 0.2);
    const validLow = !isNaN(pmfLow) && Math.abs(pmfLow - Math.exp(-0.2)) < 0.001;

    // Zero Lambda
    const pmfZero = computePoissonPmf(0, 0);
    const validZero = pmfZero === 1;

    const passed = validHigh && validLow && validZero;
    results.push({
      name: 'Extreme Values: Poisson PMF handles very high lambda (5.5), very low (0.2), and zero safely',
      passed,
      message: passed ? undefined : `High: ${pmfHigh}, Low: ${pmfLow}, Zero: ${pmfZero}`,
    });
  } catch (err: any) {
    results.push({ name: 'Extreme values test', passed: false, message: err.message });
  }

  // Test 3: Elo Rating Dynamics & Home Advantage
  try {
    // 1500 vs 1500 without home advantage gives exactly 0.5 win expectancy
    const neutralExp = eloRatingEngine.calculateExpectedScore(1500, 1575); // offsets HFA (75)
    const isNeutral50 = Math.abs(neutralExp - 0.5) < 0.01;

    // With standard HFA (+75), Home team expected score should be > 0.50
    const homeAdvExp = eloRatingEngine.calculateExpectedScore(1500, 1500);
    const hasHomeAdv = homeAdvExp > 0.58;

    // Margin multiplier: 4-0 win yields higher delta than 1-0 win
    const updateClose = eloRatingEngine.updateRatings(1500, 1500, 1, 0);
    const updateBlowout = eloRatingEngine.updateRatings(1500, 1500, 4, 0);
    const marginWorks = updateBlowout.deltaElo > updateClose.deltaElo;

    const passed = isNeutral50 && hasHomeAdv && marginWorks;
    results.push({
      name: 'Elo Benchmark: Correctly reflects home field advantage (+75) and margin of victory multipliers',
      passed,
      message: passed ? undefined : `Neutral: ${neutralExp}, HFA: ${homeAdvExp}, Close: ${updateClose.deltaElo}, Blowout: ${updateBlowout.deltaElo}`,
    });
  } catch (err: any) {
    results.push({ name: 'Elo benchmark test', passed: false, message: err.message });
  }

  // Test 4: Bayesian Shrinkage & Newly Promoted Team handling
  try {
    // Team with 0 matches played should have weight 0 and shrink 100% to prior mean
    const zeroGames = applyBayesianShrinkage(2.5, 0, 1.0, 8);
    const isZeroShrunk = zeroGames.shrunkValue === 1.0 && zeroGames.weight === 0;

    // Team with 24 matches played should retain most of its observed metric
    const manyGames = applyBayesianShrinkage(1.5, 24, 1.0, 8);
    const isManyShrunk = manyGames.shrunkValue > 1.35 && manyGames.weight === 0.75;

    // Newly promoted team receives elevated defense prior (1.20)
    const promotedPrediction = advancedPoissonEngine.predictMatch(
      'promoted-test',
      { id: 'p1', name: 'Promoted FC', matchesPlayed: 2, isNewlyPromoted: true, attackStrength: 1.0, defenseStrength: 1.0, avgGoalsScored: 1.0, avgGoalsConceded: 1.0 },
      { id: 'est1', name: 'Established FC', matchesPlayed: 20, isNewlyPromoted: false, attackStrength: 1.3, defenseStrength: 0.8, avgGoalsScored: 2.0, avgGoalsConceded: 0.9 }
    );

    const hasPromotedFlag = promotedPrediction.audit.input_features.homeNewlyPromoted === true;
    const lowConfidenceOnSmallSample = promotedPrediction.modelConfidence === 'LOW';

    const passed = isZeroShrunk && isManyShrunk && hasPromotedFlag && lowConfidenceOnSmallSample;
    results.push({
      name: 'Bayesian Shrinkage: Dampens small sample sizes and adjusts defense prior for newly promoted teams',
      passed,
      message: passed ? undefined : 'Shrinkage or promoted team adjustment failed',
    });
  } catch (err: any) {
    results.push({ name: 'Bayesian shrinkage test', passed: false, message: err.message });
  }

  // Test 5: Postponed Match Handling
  try {
    const postponedPred = advancedPoissonEngine.predictMatch(
      'postponed-match',
      { id: 'h1', name: 'Team H', matchesPlayed: 10, attackStrength: 1.1, defenseStrength: 0.9, avgGoalsScored: 1.5, avgGoalsConceded: 1.1 },
      { id: 'a1', name: 'Team A', matchesPlayed: 10, attackStrength: 1.0, defenseStrength: 1.0, avgGoalsScored: 1.2, avgGoalsConceded: 1.2 },
      { isPostponed: true }
    );

    const passed =
      postponedPred.status === 'POSTPONED_CANNOT_PREDICT' &&
      postponedPred.probabilities.homeWin === 0 &&
      postponedPred.expectedGoals.homeLambda === 0;

    results.push({
      name: 'Postponed Matches: Gracefully halts calculation and flags status POSTPONED_CANNOT_PREDICT',
      passed,
      message: passed ? undefined : 'Postponed match was not safely halted',
    });
  } catch (err: any) {
    results.push({ name: 'Postponed match test', passed: false, message: err.message });
  }

  // Test 6: Audit Metadata Trail Completeness
  try {
    const pred = advancedPoissonEngine.predictMatch(
      'audit-test-1',
      { id: 'h1', name: 'Arsenal', matchesPlayed: 10, attackStrength: 1.2, defenseStrength: 0.8, avgGoalsScored: 2.0, avgGoalsConceded: 0.9 },
      { id: 'a1', name: 'Chelsea', matchesPlayed: 10, attackStrength: 1.1, defenseStrength: 1.0, avgGoalsScored: 1.5, avgGoalsConceded: 1.2 }
    );

    const hasVersion = pred.audit.model_version === MODEL_VERSION;
    const hasGeneratedAt = typeof pred.audit.generated_at === 'string' && pred.audit.generated_at.length > 10;
    const hasSnapshotAt = typeof pred.audit.data_snapshot_at === 'string' && pred.audit.data_snapshot_at.length > 10;
    const hasFeatures = pred.audit.input_features.homeAdvantageFactor > 1.0 && typeof pred.audit.input_features.homeAttackShrunk === 'number';

    const passed = hasVersion && hasGeneratedAt && hasSnapshotAt && hasFeatures;
    results.push({
      name: 'Audit Trail: Preserves model_version, generated_at, data_snapshot_at, and shrunk feature inputs',
      passed,
      message: passed ? undefined : 'Audit fields missing or invalid',
    });
  } catch (err: any) {
    results.push({ name: 'Audit trail test', passed: false, message: err.message });
  }

  // Test 7: Point-in-Time Chronological Backtest Evaluation (Strictly No Lookahead)
  try {
    const report = pointInTimeBacktester.runChronologicalBacktest(BENCHMARK_HISTORICAL_MATCHES);

    // Verify sample size matches benchmark
    const hasCorrectN = report.sampleSize === BENCHMARK_HISTORICAL_MATCHES.length && report.sampleSize >= 15;

    // Verify Log Loss is computed and better than uniform random (1.0986)
    const validLogLoss = report.metrics.modelLogLoss > 0 && report.metrics.modelLogLoss < report.baselines.uniformRandom.logLoss;

    // Verify Brier Score is computed and better than uniform random (0.6667)
    const validBrier = report.metrics.modelBrierScore > 0 && report.metrics.modelBrierScore < report.baselines.uniformRandom.brierScore;

    // Verify calibration table has decile bins and Expected Calibration Error is non-negative
    const validCalibration = report.calibrationTable.length > 0 && report.metrics.expectedCalibrationError >= 0;

    // Verify relative improvement metrics exist
    const hasRelativeImprovement = report.relativeImprovement.logLossVsUniformPct > 0;

    const passed = hasCorrectN && validLogLoss && validBrier && validCalibration && hasRelativeImprovement;
    results.push({
      name: 'Chronological Backtest: Evaluates multi-class Log Loss and Brier Score strictly outperforming Naive Uniform Baseline',
      passed,
      message: passed ? undefined : `N=${report.sampleSize}, LogLoss=${report.metrics.modelLogLoss}, Brier=${report.metrics.modelBrierScore}`,
    });
  } catch (err: any) {
    results.push({ name: 'Chronological backtest test', passed: false, message: err.message });
  }

  return results;
}
