/**
 * GoalMetric AI - Python Statistical Microservice Client
 * Connects Node.js backend to separate Python Dixon-Coles / xG analytics microservice.
 * Fallbacks gracefully to the native TypeScript engine if the Python service is offline or disabled.
 */

import { PredictionResult, TeamStats, MatchOdds } from '../../../types';
import { calculateMatchPrediction } from './poissonEngine';

interface PythonPredictPayload {
  match_id: string;
  home_team: {
    name: string;
    attack_strength: number;
    defense_strength: number;
    xg_for: number;
    xg_against: number;
  };
  away_team: {
    name: string;
    attack_strength: number;
    defense_strength: number;
    xg_for: number;
    xg_against: number;
  };
  odds?: {
    home_win: number;
    draw: number;
    away_win: number;
    over25: number;
    under25: number;
    btts_yes: number;
  };
}

export async function executePrediction(
  matchId: string,
  homeTeam: TeamStats,
  awayTeam: TeamStats,
  odds?: MatchOdds
): Promise<PredictionResult> {
  const pythonEngineEnabled = process.env.PYTHON_ENGINE_ENABLED === 'true';
  const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

  if (pythonEngineEnabled) {
    try {
      const payload: PythonPredictPayload = {
        match_id: matchId,
        home_team: {
          name: homeTeam.name,
          attack_strength: homeTeam.homeAttackStrength,
          defense_strength: homeTeam.homeDefenseStrength,
          xg_for: homeTeam.expectedGoalsFor,
          xg_against: homeTeam.expectedGoalsAgainst,
        },
        away_team: {
          name: awayTeam.name,
          attack_strength: awayTeam.awayAttackStrength,
          defense_strength: awayTeam.awayDefenseStrength,
          xg_for: awayTeam.expectedGoalsFor,
          xg_against: awayTeam.expectedGoalsAgainst,
        },
        odds: odds ? {
          home_win: odds.homeWin,
          draw: odds.draw,
          away_win: odds.awayWin,
          over25: odds.over25,
          under25: odds.under25,
          btts_yes: odds.bttsYes,
        } : undefined,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${pythonEngineUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          isDemo: true, // Maintain strict demo label
          calculationEngine: 'PYTHON_DIXON_COLES_V1',
        };
      }
    } catch {
      // Python microservice unavailable, fall through to native TypeScript implementation
    }
  }

  // Native TypeScript Dixon-Coles Poisson Engine
  return calculateMatchPrediction(
    matchId,
    {
      homeTeam,
      awayTeam,
      useDixonColesAdjustment: true,
    },
    odds
  );
}
