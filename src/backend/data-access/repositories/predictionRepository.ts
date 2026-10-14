/**
 * GoalMetric AI - Prediction Repository
 * Stores generated predictions with caching and historical retrieval.
 */

import { PredictionResult } from '../../../types';

export class PredictionRepository {
  private cache: Map<string, PredictionResult> = new Map();

  async savePrediction(prediction: PredictionResult): Promise<void> {
    this.cache.set(prediction.matchId, prediction);
  }

  async getPredictionByMatchId(matchId: string): Promise<PredictionResult | null> {
    return this.cache.get(matchId) || null;
  }

  async getAllCachedPredictions(): Promise<PredictionResult[]> {
    return Array.from(this.cache.values());
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }
}

export const predictionRepository = new PredictionRepository();
