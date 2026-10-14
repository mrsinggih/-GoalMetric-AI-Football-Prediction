/**
 * GoalMetric AI - Master Automated Test Runner
 * Executes all domain, prediction mathematical engine, auth, and data integrity tests.
 */

import { runPoissonTests } from './unit/poissonEngine.test';
import { runValueBetTests } from './unit/valueBetCalculator.test';
import { runAuthAndDataIntegrityTests } from './unit/authMiddleware.test';
import { runProviderMockTests } from './unit/providerAdapterMock.test';
import { runProviderIntegrationTests } from './integration/providerConnection.test';
import { runAdvancedEngineAndBacktestTests } from './unit/advancedEngineAndBacktest.test';
import { runSubscriptionSystemTests } from './unit/subscriptionSystem.test';

async function main() {
  console.log('===============================================================');
  console.log('⚽ GOALMETRIC AI - AUTOMATED SUITE VERIFICATION RUN');
  console.log('===============================================================');

  const testGroups = [
    { title: '1. Mathematical Poisson & Dixon-Coles Prediction Engine', runner: runPoissonTests },
    { title: '2. Value Bet (+EV) & Probability Calibration', runner: runValueBetTests },
    { title: '3. Authentication, RBAC, and Strict Demo Data Labeling', runner: runAuthAndDataIntegrityTests },
    { title: '4. Football Provider Adapter Normalization & Mock Resilience', runner: runProviderMockTests },
    { title: '5. Controlled Integration & Secret Containment Verification', runner: runProviderIntegrationTests },
    { title: '6. Advanced Poisson Engine, Elo Benchmark & Time-Ordered Backtest', runner: runAdvancedEngineAndBacktestTests },
    { title: '7. Subscription Lifecycle, Payment Gateway, Idempotency & Feature Gating', runner: runSubscriptionSystemTests },
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const group of testGroups) {
    console.log(`\n🔹 ${group.title}:`);
    const results = group.runner();
    for (const res of results) {
      totalTests++;
      if (res.passed) {
        passedTests++;
        console.log(`  ✅ [PASS] ${res.name}`);
      } else {
        failedTests++;
        console.log(`  ❌ [FAIL] ${res.name}`);
        if (res.message) {
          console.log(`     Details: ${res.message}`);
        }
      }
    }
  }

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===============================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All automated tests completed with 100% success rate.\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
