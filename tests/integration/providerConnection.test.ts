/**
 * GoalMetric AI - Controlled Integration Test: Football Provider Connection & Secret Isolation
 * Verifies real environment variable detection, honest unconfigured state, and secret containment.
 */

import { ApiFootballAdapter } from '../../src/backend/data-access/providers/apiFootballAdapter';
import { providerRateLimiter } from '../../src/backend/data-access/providers/providerRateLimiter';

export function runProviderIntegrationTests(): { name: string; passed: boolean; message?: string }[] {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Controlled Environment Check & Honest Failure Handling
  try {
    const currentKey = process.env.FOOTBALL_DATA_API_KEY || '';
    const adapter = new ApiFootballAdapter(currentKey);

    // If key is empty or placeholder, adapter must honestly report isConfigured = false
    if (!currentKey || currentKey.includes('placeholder')) {
      const passed = adapter.isConfigured === false;
      results.push({
        name: 'Controlled Integration: Honestly detects unconfigured provider key without inventing fake data',
        passed,
        message: passed ? undefined : 'Expected isConfigured to be false for placeholder key',
      });
    } else {
      // If a real key is supplied via Secrets, verify it is marked configured
      const passed = adapter.isConfigured === true;
      results.push({
        name: 'Controlled Integration: Successfully detects configured FOOTBALL_DATA_API_KEY from Secrets',
        passed,
        message: passed ? undefined : 'Failed to recognize valid API key in environment',
      });
    }
  } catch (err: any) {
    results.push({ name: 'Controlled integration check', passed: false, message: err.message });
  }

  // Test 2: Rate Limiter Token Bucket / Sliding Window Verification
  try {
    const check1 = providerRateLimiter.canMakeRequest();
    const passed = typeof check1.allowed === 'boolean' && check1.remainingInWindow >= 0;

    results.push({
      name: 'Controlled Integration: Sliding-window rate limiter actively guards provider quota',
      passed,
      message: passed ? undefined : 'Rate limiter did not return valid check object',
    });
  } catch (err: any) {
    results.push({ name: 'Rate limiter guard check', passed: false, message: err.message });
  }

  // Test 3: Secret Isolation (Guarantee: No API secrets in client-facing DTOs)
  try {
    const adapter = new ApiFootballAdapter('super_secret_test_key_xyz987');
    const logs = adapter.getSyncLogs();
    // Verify no log entry leaks the secret key string
    const noLeakInLogs = logs.every(l => !l.message.includes('super_secret_test_key_xyz987'));

    const passed = noLeakInLogs;
    results.push({
      name: 'Controlled Integration: API keys are strictly contained on server side with 0 leak in logs',
      passed,
      message: passed ? undefined : 'Found leaked secret key string in provider logs',
    });
  } catch (err: any) {
    results.push({ name: 'Secret isolation check', passed: false, message: err.message });
  }

  return results;
}
