/**
 * GoalMetric AI - Value Bet & Expected Value (EV) Domain Logic
 * Compares pure model probabilities against bookmaker implied odds to find positive edges (+EV).
 */

export interface MarketOddsInput {
  marketName: string;
  modelProbability: number; // 0.0 to 1.0
  decimalOdds: number;       // e.g. 2.10
}

export interface ValueBetAnalysis {
  marketName: string;
  modelProbability: number;
  decimalOdds: number;
  impliedProbability: number; // 1 / decimalOdds
  expectedValue: number;      // (modelProbability * decimalOdds) - 1
  edgePercentage: number;     // expectedValue * 100
  kellyFraction: number;      // Conservative quarter-Kelly recommendation
  hasValue: boolean;          // true if edge > 3%
}

/**
 * Evaluates market odds for Positive Expected Value (+EV)
 */
export function analyzeMarketValue(input: MarketOddsInput): ValueBetAnalysis {
  if (input.decimalOdds <= 1.0 || input.modelProbability <= 0) {
    return {
      marketName: input.marketName,
      modelProbability: input.modelProbability,
      decimalOdds: input.decimalOdds,
      impliedProbability: 0,
      expectedValue: -1,
      edgePercentage: -100,
      kellyFraction: 0,
      hasValue: false,
    };
  }

  const impliedProbability = 1 / input.decimalOdds;
  const expectedValue = (input.modelProbability * input.decimalOdds) - 1;
  const edgePercentage = expectedValue * 100;

  // Kelly Criterion: f* = (b*p - q) / b where b = odds - 1, p = prob, q = 1 - p
  const b = input.decimalOdds - 1;
  const p = input.modelProbability;
  const q = 1 - p;
  const fullKelly = b > 0 ? (b * p - q) / b : 0;
  // Conservative quarter-Kelly (0.25x) capped at 5% max bankroll
  const conservativeKelly = Math.max(0, Math.min(0.05, (fullKelly * 0.25)));

  return {
    marketName: input.marketName,
    modelProbability: Number(input.modelProbability.toFixed(3)),
    decimalOdds: Number(input.decimalOdds.toFixed(2)),
    impliedProbability: Number(impliedProbability.toFixed(3)),
    expectedValue: Number(expectedValue.toFixed(4)),
    edgePercentage: Number(edgePercentage.toFixed(1)),
    kellyFraction: Number((conservativeKelly * 100).toFixed(1)), // percentage of bankroll
    hasValue: edgePercentage >= 3.0, // Minimum 3% edge threshold
  };
}
