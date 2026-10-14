/**
 * GoalMetric AI - Unit Test: Authentication & Demo Data Integrity
 */

import { verifyAuthToken } from '../../src/backend/domain/auth/authService';
import { DEMO_MATCH_FIXTURES } from '../../src/backend/data-access/repositories/matchRepository';

export function runAuthAndDataIntegrityTests(): { name: string; passed: boolean; message?: string }[] {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Anonymous session gets guest free tier
  try {
    const session = verifyAuthToken(undefined);
    const passed = session !== null && session.subscriptionTier === 'free' && session.role === 'user';
    results.push({
      name: 'Auth Service: defaults unauthenticated requests to safe guest free tier',
      passed,
      message: passed ? undefined : 'Guest session was incorrect',
    });
  } catch (err: any) {
    results.push({ name: 'Guest auth fallback', passed: false, message: err.message });
  }

  // Test 2: Admin demo token verification
  try {
    const session = verifyAuthToken('Bearer demo-admin-token');
    const passed = session !== null && session.role === 'admin' && session.subscriptionTier === 'elite';
    results.push({
      name: 'Auth Service: recognizes admin token and grants elite role privileges',
      passed,
      message: passed ? undefined : 'Admin token recognition failed',
    });
  } catch (err: any) {
    results.push({ name: 'Admin token auth', passed: false, message: err.message });
  }

  // Test 3: Strict Demo Labeling verification (Requirement 6)
  try {
    const totalMatches = DEMO_MATCH_FIXTURES.length;
    const allHaveIsDemo = DEMO_MATCH_FIXTURES.every(m => m.isDemo === true);
    const allHaveDemoLabelInName = DEMO_MATCH_FIXTURES.every(
      m => m.homeTeam.name.includes('[DEMO]') && m.awayTeam.name.includes('[DEMO]')
    );

    const passed = totalMatches > 0 && allHaveIsDemo && allHaveDemoLabelInName;
    results.push({
      name: 'Compliance: 100% of fixtures strictly tagged with isDemo: true and [DEMO] labels',
      passed,
      message: passed ? undefined : 'Found fixture without required [DEMO] labeling',
    });
  } catch (err: any) {
    results.push({ name: 'Demo labeling compliance check', passed: false, message: err.message });
  }

  return results;
}
