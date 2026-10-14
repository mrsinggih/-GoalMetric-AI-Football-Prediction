/**
 * GoalMetric AI - Unit Test: Value Bet & EV Calculator
 */

import { analyzeMarketValue } from '../../src/backend/domain/prediction/valueBetCalculator';

export function runValueBetTests(): { name: string; passed: boolean; message?: string }[] {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Positive Expected Value (+EV) detection
  try {
    // Model says 60% (0.60), bookmaker offers 2.00 (implied 50%) -> edge should be (0.60 * 2.00) - 1 = +0.20 (+20%)
    const analysis = analyzeMarketValue({
      marketName: 'Home Win',
      modelProbability: 0.60,
      decimalOdds: 2.00,
    });

    const expectedEdge = 20.0;
    const passed = Math.abs(analysis.edgePercentage - expectedEdge) < 0.2 && analysis.hasValue === true;
    results.push({
      name: 'Value Bet: correctly detects positive edge (+20% EV)',
      passed,
      message: passed ? undefined : `Expected +20%, got ${analysis.edgePercentage}%`,
    });
  } catch (err: any) {
    results.push({ name: 'Value Bet calculation (+EV)', passed: false, message: err.message });
  }

  // Test 2: Negative Expected Value (-EV) correctly flagged as hasValue: false
  try {
    // Model says 40% (0.40), bookmaker offers 2.00 (implied 50%) -> edge is (0.40 * 2.00) - 1 = -0.20 (-20%)
    const analysis = analyzeMarketValue({
      marketName: 'Away Win',
      modelProbability: 0.40,
      decimalOdds: 2.00,
    });

    const passed = analysis.edgePercentage < 0 && analysis.hasValue === false;
    results.push({
      name: 'Value Bet: correctly rejects negative edge (-20% EV)',
      passed,
      message: passed ? undefined : `Edge was ${analysis.edgePercentage}%, hasValue was ${analysis.hasValue}`,
    });
  } catch (err: any) {
    results.push({ name: 'Value Bet calculation (-EV)', passed: false, message: err.message });
  }

  // Test 3: Invalid odds handling (odds <= 1.0)
  try {
    const analysis = analyzeMarketValue({
      marketName: 'Draw',
      modelProbability: 0.30,
      decimalOdds: 0.95,
    });

    const passed = analysis.hasValue === false && analysis.edgePercentage === -100;
    results.push({
      name: 'Value Bet: safely handles invalid odds <= 1.0 without crashing',
      passed,
      message: passed ? undefined : 'Failed to handle odds <= 1.0',
    });
  } catch (err: any) {
    results.push({ name: 'Value Bet invalid odds guard', passed: false, message: err.message });
  }

  return results;
}
