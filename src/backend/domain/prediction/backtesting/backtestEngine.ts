/**
 * GoalMetric AI - Strictly Chronological Point-in-Time Backtesting Engine
 *
 * Enforces zero lookahead bias:
 * For every match at time T, model state is derived strictly from historical data before T.
 *
 * Evaluates:
 * - Multi-class Log Loss (Cross-Entropy)
 * - Multi-class Brier Score (Ranked Probability Squared Error)
 * - Decile Calibration & Expected Calibration Error (ECE)
 * - Statistical comparison against Naive Baselines (Uniform Random & Empirical Prior)
 */

import { AdvancedPoissonEngine, StatisticalTeamProfile } from '../advancedPoissonEngine';
import { EloRatingEngine } from '../eloRatingEngine';

export interface HistoricalMatchRecord {
  id: string;
  kickoffTime: string; // ISO 8601
  league: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isNewlyPromotedHome?: boolean;
  isNewlyPromotedAway?: boolean;
}

export interface CalibrationBin {
  binRange: string;
  minProb: number;
  maxProb: number;
  predictionCount: number;
  avgPredictedProbability: number;
  observedFrequency: number;
  calibrationError: number;
}

export interface BacktestEvaluationReport {
  sampleSize: number;
  startDate: string;
  endDate: string;
  metrics: {
    modelLogLoss: number;
    modelBrierScore: number;
    expectedCalibrationError: number;
    accuracyPercentage: number; // For reporting only
  };
  baselines: {
    uniformRandom: {
      logLoss: number;
      brierScore: number;
    };
    empiricalPrior: {
      logLoss: number;
      brierScore: number;
      homeFreq: number;
      drawFreq: number;
      awayFreq: number;
    };
  };
  relativeImprovement: {
    logLossVsUniformPct: number;
    logLossVsPriorPct: number;
    brierScoreVsUniformPct: number;
    brierScoreVsPriorPct: number;
  };
  calibrationTable: CalibrationBin[];
  detailedMatchLogs: {
    matchId: string;
    kickoffTime: string;
    homeTeam: string;
    awayTeam: string;
    actualScore: string;
    actualOutcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    predictedProbabilities: { homeWin: number; draw: number; awayWin: number };
    matchLogLoss: number;
    matchBrierScore: number;
  }[];
  generatedAt: string;
}

export class PointInTimeBacktester {
  constructor(
    private readonly poissonEngine: AdvancedPoissonEngine = new AdvancedPoissonEngine(),
    private readonly eloEngine: EloRatingEngine = new EloRatingEngine()
  ) {}

  /**
   * Executes backtest strictly respecting chronological time ordering (no lookahead bias).
   */
  runChronologicalBacktest(matches: HistoricalMatchRecord[]): BacktestEvaluationReport {
    if (matches.length === 0) {
      throw new Error('Cannot run backtest on empty match dataset.');
    }

    // 1. Sort strictly ascending by kickoffTime to guarantee temporal order
    const chronologicalMatches = [...matches].sort(
      (a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
    );

    // Dynamic state stores that evolve strictly over simulated time
    const teamStatsMap: Map<string, StatisticalTeamProfile> = new Map();
    const teamEloMap: Map<string, number> = new Map();

    const getOrCreateTeamProfile = (id: string, name: string, isPromoted?: boolean): StatisticalTeamProfile => {
      let profile = teamStatsMap.get(id);
      if (!profile) {
        profile = {
          id,
          name,
          matchesPlayed: 0,
          isNewlyPromoted: isPromoted,
          attackStrength: 1.0,
          defenseStrength: 1.0,
          avgGoalsScored: 1.3,
          avgGoalsConceded: 1.3,
        };
        teamStatsMap.set(id, profile);
      }
      return profile;
    };

    const getOrCreateElo = (id: string, isPromoted?: boolean): number => {
      let elo = teamEloMap.get(id);
      if (elo === undefined) {
        elo = this.eloEngine.initializeTeamElo(isPromoted);
        teamEloMap.set(id, elo);
      }
      return elo;
    };

    let totalLogLoss = 0;
    let totalBrierScore = 0;
    let correctOutcomeCount = 0;

    let actualHomeWins = 0;
    let actualDraws = 0;
    let actualAwayWins = 0;

    const detailedLogs: BacktestEvaluationReport['detailedMatchLogs'] = [];

    // For calibration measurement: track (predictedProb, actualBinaryOutcome)
    const calibrationEntries: { predicted: number; actual: number }[] = [];

    // 2. Iterate through matches one by one in chronological sequence
    for (const match of chronologicalMatches) {
      // READ STATE: only state known BEFORE this match kickoff
      const homeProfile = getOrCreateTeamProfile(match.homeTeamId, match.homeTeamName, match.isNewlyPromotedHome);
      const awayProfile = getOrCreateTeamProfile(match.awayTeamId, match.awayTeamName, match.isNewlyPromotedAway);

      const homeElo = getOrCreateElo(match.homeTeamId, match.isNewlyPromotedHome);
      const awayElo = getOrCreateElo(match.awayTeamId, match.isNewlyPromotedAway);

      homeProfile.eloRating = homeElo;
      awayProfile.eloRating = awayElo;

      // PREDICT: point-in-time calculation with snapshot at kickoff time
      const prediction = this.poissonEngine.predictMatch(
        match.id,
        homeProfile,
        awayProfile,
        { dataSnapshotTime: match.kickoffTime }
      );

      const probs = prediction.probabilities;

      // ACTUAL RESULT: $(y_H, y_D, y_A)$
      let yH = 0, yD = 0, yA = 0;
      let outcomeLabel: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';

      if (match.homeScore > match.awayScore) {
        yH = 1;
        actualHomeWins++;
        outcomeLabel = 'HOME_WIN';
      } else if (match.homeScore === match.awayScore) {
        yD = 1;
        actualDraws++;
        outcomeLabel = 'DRAW';
      } else {
        yA = 1;
        actualAwayWins++;
        outcomeLabel = 'AWAY_WIN';
      }

      // Check top outcome hit for accuracy metric
      const predictedTop =
        probs.homeWin >= probs.draw && probs.homeWin >= probs.awayWin
          ? 'HOME_WIN'
          : probs.draw >= probs.homeWin && probs.draw >= probs.awayWin
          ? 'DRAW'
          : 'AWAY_WIN';

      if (predictedTop === outcomeLabel) {
        correctOutcomeCount++;
      }

      // Multi-class Log Loss: - sum( y_k * ln(p_k) )
      const eps = 1e-15;
      const pH = Math.max(eps, Math.min(1 - eps, probs.homeWin));
      const pD = Math.max(eps, Math.min(1 - eps, probs.draw));
      const pA = Math.max(eps, Math.min(1 - eps, probs.awayWin));

      const matchLL = -(yH * Math.log(pH) + yD * Math.log(pD) + yA * Math.log(pA));
      totalLogLoss += matchLL;

      // Multi-class Brier Score: sum( (p_k - y_k)^2 )
      const matchBrier = Math.pow(probs.homeWin - yH, 2) + Math.pow(probs.draw - yD, 2) + Math.pow(probs.awayWin - yA, 2);
      totalBrierScore += matchBrier;

      // Record calibration points
      calibrationEntries.push({ predicted: probs.homeWin, actual: yH });
      calibrationEntries.push({ predicted: probs.draw, actual: yD });
      calibrationEntries.push({ predicted: probs.awayWin, actual: yA });

      detailedLogs.push({
        matchId: match.id,
        kickoffTime: match.kickoffTime,
        homeTeam: match.homeTeamName,
        awayTeam: match.awayTeamName,
        actualScore: `${match.homeScore}-${match.awayScore}`,
        actualOutcome: outcomeLabel,
        predictedProbabilities: probs,
        matchLogLoss: Number(matchLL.toFixed(4)),
        matchBrierScore: Number(matchBrier.toFixed(4)),
      });

      // UPDATE STATE POST-MATCH (Strictly AFTER recording prediction results)
      const eloUpdate = this.eloEngine.updateRatings(homeElo, awayElo, match.homeScore, match.awayScore);
      teamEloMap.set(match.homeTeamId, eloUpdate.newHomeRating);
      teamEloMap.set(match.awayTeamId, eloUpdate.newAwayRating);

      // Update goal averages and attack/defense strength
      homeProfile.matchesPlayed++;
      awayProfile.matchesPlayed++;
      homeProfile.avgGoalsScored = Number(((homeProfile.avgGoalsScored * (homeProfile.matchesPlayed - 1) + match.homeScore) / homeProfile.matchesPlayed).toFixed(2));
      homeProfile.avgGoalsConceded = Number(((homeProfile.avgGoalsConceded * (homeProfile.matchesPlayed - 1) + match.awayScore) / homeProfile.matchesPlayed).toFixed(2));
      awayProfile.avgGoalsScored = Number(((awayProfile.avgGoalsScored * (awayProfile.matchesPlayed - 1) + match.awayScore) / awayProfile.matchesPlayed).toFixed(2));
      awayProfile.avgGoalsConceded = Number(((awayProfile.avgGoalsConceded * (awayProfile.matchesPlayed - 1) + match.homeScore) / awayProfile.matchesPlayed).toFixed(2));

      homeProfile.attackStrength = Number((homeProfile.avgGoalsScored / 1.45).toFixed(2));
      homeProfile.defenseStrength = Number((homeProfile.avgGoalsConceded / 1.15).toFixed(2));
      awayProfile.attackStrength = Number((awayProfile.avgGoalsScored / 1.45).toFixed(2));
      awayProfile.defenseStrength = Number((awayProfile.avgGoalsConceded / 1.15).toFixed(2));
    }

    const N = chronologicalMatches.length;
    const avgLogLoss = Number((totalLogLoss / N).toFixed(4));
    const avgBrierScore = Number((totalBrierScore / N).toFixed(4));
    const accuracy = Number(((correctOutcomeCount / N) * 100).toFixed(1));

    // 3. Compute Calibration Bins (Deciles 0-10%, 10-20%, ..., 90-100%)
    const binDefinitions = [
      { label: '0% - 10%', min: 0.0, max: 0.1 },
      { label: '10% - 20%', min: 0.1, max: 0.2 },
      { label: '20% - 30%', min: 0.2, max: 0.3 },
      { label: '30% - 40%', min: 0.3, max: 0.4 },
      { label: '40% - 50%', min: 0.4, max: 0.5 },
      { label: '50% - 60%', min: 0.5, max: 0.6 },
      { label: '60% - 70%', min: 0.6, max: 0.7 },
      { label: '70% - 80%', min: 0.7, max: 0.8 },
      { label: '80% - 100%', min: 0.8, max: 1.0 },
    ];

    let totalWeightedCalibrationError = 0;
    const totalEntriesCount = calibrationEntries.length;

    const calibrationTable: CalibrationBin[] = binDefinitions.map(b => {
      const inBin = calibrationEntries.filter(e => e.predicted >= b.min && (b.max === 1.0 ? e.predicted <= b.max : e.predicted < b.max));
      const count = inBin.length;
      if (count === 0) {
        return {
          binRange: b.label,
          minProb: b.min,
          maxProb: b.max,
          predictionCount: 0,
          avgPredictedProbability: 0,
          observedFrequency: 0,
          calibrationError: 0,
        };
      }

      const sumPred = inBin.reduce((acc, e) => acc + e.predicted, 0);
      const sumAct = inBin.reduce((acc, e) => acc + e.actual, 0);
      const avgPred = sumPred / count;
      const obsFreq = sumAct / count;
      const error = Math.abs(avgPred - obsFreq);

      totalWeightedCalibrationError += error * count;

      return {
        binRange: b.label,
        minProb: b.min,
        maxProb: b.max,
        predictionCount: count,
        avgPredictedProbability: Number((avgPred * 100).toFixed(1)),
        observedFrequency: Number((obsFreq * 100).toFixed(1)),
        calibrationError: Number((error * 100).toFixed(1)),
      };
    });

    const ece = Number(((totalWeightedCalibrationError / totalEntriesCount) * 100).toFixed(2));

    // 4. Compute Naive Baselines
    // Baseline 1: Uniform Random (1/3, 1/3, 1/3)
    const uniformLL = Number((-Math.log(1 / 3)).toFixed(4)); // ~ 1.0986
    const uniformBrier = Number((Math.pow(1 / 3 - 1, 2) + Math.pow(1 / 3, 2) + Math.pow(1 / 3, 2)).toFixed(4)); // ~ 0.6667

    // Baseline 2: Empirical Prior Class Frequencies
    const priorH = actualHomeWins / N;
    const priorD = actualDraws / N;
    const priorA = actualAwayWins / N;

    let priorLogLossSum = 0;
    let priorBrierSum = 0;
    for (const match of chronologicalMatches) {
      const yH = match.homeScore > match.awayScore ? 1 : 0;
      const yD = match.homeScore === match.awayScore ? 1 : 0;
      const yA = match.awayScore > match.homeScore ? 1 : 0;

      priorLogLossSum += -(yH * Math.log(priorH) + yD * Math.log(priorD) + yA * Math.log(priorA));
      priorBrierSum += Math.pow(priorH - yH, 2) + Math.pow(priorD - yD, 2) + Math.pow(priorA - yA, 2);
    }
    const priorLL = Number((priorLogLossSum / N).toFixed(4));
    const priorBrier = Number((priorBrierSum / N).toFixed(4));

    // Relative Improvements
    const logLossVsUniformPct = Number((((uniformLL - avgLogLoss) / uniformLL) * 100).toFixed(1));
    const logLossVsPriorPct = Number((((priorLL - avgLogLoss) / priorLL) * 100).toFixed(1));
    const brierScoreVsUniformPct = Number((((uniformBrier - avgBrierScore) / uniformBrier) * 100).toFixed(1));
    const brierScoreVsPriorPct = Number((((priorBrier - avgBrierScore) / priorBrier) * 100).toFixed(1));

    return {
      sampleSize: N,
      startDate: chronologicalMatches[0].kickoffTime.slice(0, 10),
      endDate: chronologicalMatches[N - 1].kickoffTime.slice(0, 10),
      metrics: {
        modelLogLoss: avgLogLoss,
        modelBrierScore: avgBrierScore,
        expectedCalibrationError: ece,
        accuracyPercentage: accuracy,
      },
      baselines: {
        uniformRandom: {
          logLoss: uniformLL,
          brierScore: uniformBrier,
        },
        empiricalPrior: {
          logLoss: priorLL,
          brierScore: priorBrier,
          homeFreq: Number((priorH * 100).toFixed(1)),
          drawFreq: Number((priorD * 100).toFixed(1)),
          awayFreq: Number((priorA * 100).toFixed(1)),
        },
      },
      relativeImprovement: {
        logLossVsUniformPct,
        logLossVsPriorPct,
        brierScoreVsUniformPct,
        brierScoreVsPriorPct,
      },
      calibrationTable,
      detailedMatchLogs: detailedLogs,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const pointInTimeBacktester = new PointInTimeBacktester();
