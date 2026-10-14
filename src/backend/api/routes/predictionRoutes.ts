/**
 * GoalMetric AI - Predictions Route
 * Coordinates domain prediction calculation and repository persistence.
 */

import { Router, Request, Response } from 'express';
import { matchRepository } from '../../data-access/repositories/matchRepository';
import { predictionRepository } from '../../data-access/repositories/predictionRepository';
import { executePrediction } from '../../domain/prediction/pythonEngineClient';
import { TeamStats } from '../../../types';
import { requireTier, enforceQuota } from '../middlewares/featureGateMiddleware';

export const predictionRoutes = Router();

// GET prediction for a specific fixture
predictionRoutes.get('/match/:id', async (req: Request, res: Response) => {
  const matchId = req.params.id;

  // Check cache first
  const cached = await predictionRepository.getPredictionByMatchId(matchId);
  if (cached) {
    res.json({ data: cached, source: 'CACHE', isDemo: true });
    return;
  }

  const match = await matchRepository.getMatchById(matchId);
  if (!match) {
    res.status(404).json({
      error: 'Not Found',
      message: `Match fixture with id ${matchId} not found.`,
      code: 'MATCH_NOT_FOUND',
    });
    return;
  }

  const prediction = await executePrediction(
    match.id,
    match.homeTeam,
    match.awayTeam,
    match.odds
  );

  await predictionRepository.savePrediction(prediction);

  res.json({
    data: prediction,
    source: 'CALCULATED',
    isDemo: true,
  });
});

// POST custom calculation (Prediction Sandbox)
predictionRoutes.post('/calculate', enforceQuota, async (req: Request, res: Response) => {
  const { homeTeam, awayTeam, odds } = req.body;

  if (!homeTeam?.name || !awayTeam?.name) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Both homeTeam and awayTeam objects with name and strengths are required.',
      code: 'INVALID_INPUT',
    });
    return;
  }

  // Set default reasonable attributes if not provided
  const sanitizedHome: TeamStats = {
    id: homeTeam.id || 'custom-home',
    name: `${homeTeam.name} [DEMO]`,
    shortName: homeTeam.shortName || homeTeam.name.substring(0, 3).toUpperCase(),
    league: homeTeam.league || 'Custom Simulation',
    homeAttackStrength: Number(homeTeam.homeAttackStrength) || 1.15,
    homeDefenseStrength: Number(homeTeam.homeDefenseStrength) || 0.90,
    awayAttackStrength: Number(homeTeam.awayAttackStrength) || 1.05,
    awayDefenseStrength: Number(homeTeam.awayDefenseStrength) || 0.95,
    recentForm: homeTeam.recentForm || ['W', 'D', 'W'],
    avgGoalsScored: Number(homeTeam.avgGoalsScored) || 1.8,
    avgGoalsConceded: Number(homeTeam.avgGoalsConceded) || 1.1,
    expectedGoalsFor: Number(homeTeam.expectedGoalsFor) || 1.75,
    expectedGoalsAgainst: Number(homeTeam.expectedGoalsAgainst) || 1.05,
  };

  const sanitizedAway: TeamStats = {
    id: awayTeam.id || 'custom-away',
    name: `${awayTeam.name} [DEMO]`,
    shortName: awayTeam.shortName || awayTeam.name.substring(0, 3).toUpperCase(),
    league: awayTeam.league || 'Custom Simulation',
    homeAttackStrength: Number(awayTeam.homeAttackStrength) || 1.10,
    homeDefenseStrength: Number(awayTeam.homeDefenseStrength) || 0.95,
    awayAttackStrength: Number(awayTeam.awayAttackStrength) || 1.00,
    awayDefenseStrength: Number(awayTeam.awayDefenseStrength) || 1.05,
    recentForm: awayTeam.recentForm || ['D', 'W', 'L'],
    avgGoalsScored: Number(awayTeam.avgGoalsScored) || 1.5,
    avgGoalsConceded: Number(awayTeam.avgGoalsConceded) || 1.3,
    expectedGoalsFor: Number(awayTeam.expectedGoalsFor) || 1.45,
    expectedGoalsAgainst: Number(awayTeam.expectedGoalsAgainst) || 1.25,
  };

  const customMatchId = `custom-${Date.now()}`;
  const prediction = await executePrediction(
    customMatchId,
    sanitizedHome,
    sanitizedAway,
    odds
  );

  res.json({
    data: prediction,
    source: 'CALCULATED_CUSTOM',
    isDemo: true,
  });
});

// GET time-ordered point-in-time backtesting evaluation (Pro Tier required)
predictionRoutes.get(
  '/backtest',
  requireTier('pro', 'Evaluasi Backtest Kronologis & Kurva Kalibrasi'),
  async (_req: Request, res: Response) => {
    const { pointInTimeBacktester } = await import('../../domain/prediction/backtesting/backtestEngine');
    const { BENCHMARK_HISTORICAL_MATCHES } = await import('../../domain/prediction/backtesting/historicalDataset');

    try {
      const report = pointInTimeBacktester.runChronologicalBacktest(BENCHMARK_HISTORICAL_MATCHES);
      res.json({
        report,
        disclaimer: 'Hasil backtest dihitung secara deterministik berdasarkan urutan waktu tanpa lookahead bias.',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Backtest failed', message: err.message });
    }
  }
);

// POST advanced prediction with audit trail, Elo benchmark, and Bayesian shrinkage (Pro Tier required)
predictionRoutes.post(
  '/advanced-calculate',
  requireTier('pro', 'Model Kuantitatif Bayesian Shrinkage & Benchmark Elo'),
  enforceQuota,
  async (req: Request, res: Response) => {
    const { advancedPoissonEngine } = await import('../../domain/prediction/advancedPoissonEngine');
    const { homeTeam, awayTeam, options } = req.body || {};

    if (!homeTeam?.name || !awayTeam?.name) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Both homeTeam and awayTeam profiles are required.',
      });
      return;
    }

    const result = advancedPoissonEngine.predictMatch(
      `pred-${Date.now()}`,
      {
        id: homeTeam.id || 'h1',
        name: homeTeam.name,
        matchesPlayed: Number(homeTeam.matchesPlayed ?? 15),
        isNewlyPromoted: Boolean(homeTeam.isNewlyPromoted),
        attackStrength: Number(homeTeam.attackStrength ?? 1.15),
        defenseStrength: Number(homeTeam.defenseStrength ?? 0.85),
        avgGoalsScored: Number(homeTeam.avgGoalsScored ?? 1.8),
        avgGoalsConceded: Number(homeTeam.avgGoalsConceded ?? 1.0),
        eloRating: homeTeam.eloRating ? Number(homeTeam.eloRating) : undefined,
      },
      {
        id: awayTeam.id || 'a1',
        name: awayTeam.name,
        matchesPlayed: Number(awayTeam.matchesPlayed ?? 15),
        isNewlyPromoted: Boolean(awayTeam.isNewlyPromoted),
        attackStrength: Number(awayTeam.attackStrength ?? 1.05),
        defenseStrength: Number(awayTeam.defenseStrength ?? 0.95),
        avgGoalsScored: Number(awayTeam.avgGoalsScored ?? 1.4),
        avgGoalsConceded: Number(awayTeam.avgGoalsConceded ?? 1.3),
        eloRating: awayTeam.eloRating ? Number(awayTeam.eloRating) : undefined,
      },
      options
    );

    res.json({ data: result });
  }
);

// GET quantitative audit log export (Premium Tier required)
predictionRoutes.get(
  '/export-audit',
  requireTier('premium', 'Ekspor Dataset Audit Kuantitatif & Feed Raw'),
  async (_req: Request, res: Response) => {
    res.json({
      exportType: 'QUANTITATIVE_AUDIT_DATASET',
      tier: 'premium',
      generatedAt: new Date().toISOString(),
      dataset: {
        totalRecords: 124,
        compression: 'gzip',
        downloadUrl: 'https://goalmetric.ai/exports/quant_audit_dataset_sample.json.gz',
      },
    });
  }
);
