/**
 * GoalMetric AI - Billing & Subscription Domain Logic
 * Defines tiers, feature flags, quota management, and status entitlement.
 */

import { SubscriptionPlan, SubscriptionTier, SubscriptionStatus } from '../../../types';

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Starter (Free)',
    priceMonthlyUsd: 0,
    dailyPredictionLimit: 3,
    hasValueBetDetection: false,
    hasPythonDixonColesEngine: false,
    hasApiAccess: false,
    features: [
      '3 Analisis Pertandingan / hari',
      'Prediksi Poisson Dasar (1X2 & Over/Under)',
      'Statistik xG Standar',
      'Data Demo & Komparasi Tim',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Analyst',
    priceMonthlyUsd: 29,
    dailyPredictionLimit: 50,
    hasValueBetDetection: true,
    hasPythonDixonColesEngine: true,
    hasApiAccess: false,
    features: [
      '50 Analisis Pertandingan / hari',
      'Model Dixon-Coles Koreksi Bivariat (tau correlation)',
      'Detektor Value Bet (+EV) vs Odds Pasar',
      'Simulasi Skor Eksak & Rekomendasi Kelly Criterion',
      'Top 5 Liga Eropa & Liga Champions',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Syndicate',
    priceMonthlyUsd: 79,
    dailyPredictionLimit: 500,
    hasValueBetDetection: true,
    hasPythonDixonColesEngine: true,
    hasApiAccess: true,
    features: [
      'Akses Tanpa Batas (500 kuota/hari)',
      'Akses Langsung REST API GoalMetric & API Key',
      'Model Statistik Bayesian Shrinkage & Benchmark Elo',
      'Riwayat Backtest Kronologis & Ekspor Data Audit',
      'Notifikasi Value Bet Real-time & Webhook Feed',
    ],
  },
  // Backward compatibility alias for 'elite' -> mapped to premium
  elite: {
    id: 'elite',
    name: 'Premium Syndicate (Elite)',
    priceMonthlyUsd: 79,
    dailyPredictionLimit: 500,
    hasValueBetDetection: true,
    hasPythonDixonColesEngine: true,
    hasApiAccess: true,
    features: [
      'Akses Tanpa Batas (500 kuota/hari)',
      'Akses Langsung REST API GoalMetric & API Key',
      'Model Statistik Bayesian Shrinkage & Benchmark Elo',
      'Riwayat Backtest Kronologis & Ekspor Data Audit',
      'Notifikasi Value Bet Real-time & Webhook Feed',
    ],
  },
};

/**
 * Normalizes tier aliases (e.g. 'elite' -> 'premium')
 */
export function normalizeTier(tier?: string): 'free' | 'pro' | 'premium' {
  if (!tier) return 'free';
  const lower = tier.toLowerCase();
  if (lower === 'pro') return 'pro';
  if (lower === 'premium' || lower === 'elite') return 'premium';
  return 'free';
}

/**
 * Validates whether a user's subscription entitlement is currently active.
 * - 'active': Granted full tier entitlement
 * - 'canceled': Granted entitlement until current period ends (status remains canceled)
 * - 'past_due': Granted entitlement only if still within grace period window
 * - 'expired' / 'refunded' / 'pending': Entitlement revoked, falls back to 'free'
 */
export function isEntitlementActive(
  status: SubscriptionStatus = 'active',
  gracePeriodEnd?: string
): boolean {
  if (status === 'active' || status === 'canceled') {
    return true;
  }
  if (status === 'past_due') {
    if (gracePeriodEnd) {
      const graceTime = new Date(gracePeriodEnd).getTime();
      return Date.now() < graceTime;
    }
    return false;
  }
  return false;
}

/**
 * Check if user can access a specific feature given their tier and status.
 */
export function canUserAccessFeature(
  userTier: SubscriptionTier,
  feature: 'valueBets' | 'pythonEngine' | 'apiAccess' | 'backtestAudit',
  status: SubscriptionStatus = 'active',
  gracePeriodEnd?: string
): boolean {
  // If subscription is not active or within grace period, enforce free tier fallback
  const effectiveTier: SubscriptionTier = isEntitlementActive(status, gracePeriodEnd)
    ? (normalizeTier(userTier) as SubscriptionTier)
    : 'free';

  const plan = SUBSCRIPTION_PLANS[effectiveTier] || SUBSCRIPTION_PLANS.free;

  switch (feature) {
    case 'valueBets':
      return plan.hasValueBetDetection;
    case 'pythonEngine':
      return plan.hasPythonDixonColesEngine;
    case 'apiAccess':
      return plan.hasApiAccess;
    case 'backtestAudit':
      return effectiveTier === 'premium' || effectiveTier === 'elite';
    default:
      return false;
  }
}

/**
 * Check daily usage quota based on tier and active status.
 */
export function checkUsageQuota(
  currentUsageToday: number,
  userTier: SubscriptionTier,
  status: SubscriptionStatus = 'active',
  gracePeriodEnd?: string
): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const effectiveTier: SubscriptionTier = isEntitlementActive(status, gracePeriodEnd)
    ? (normalizeTier(userTier) as SubscriptionTier)
    : 'free';

  const plan = SUBSCRIPTION_PLANS[effectiveTier] || SUBSCRIPTION_PLANS.free;
  const remaining = Math.max(0, plan.dailyPredictionLimit - currentUsageToday);

  return {
    allowed: remaining > 0,
    remaining,
    limit: plan.dailyPredictionLimit,
  };
}
