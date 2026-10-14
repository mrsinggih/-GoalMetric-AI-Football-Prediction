/**
 * GoalMetric AI - Backend Feature Gating & Quota Enforcement Middleware
 * Ensures premium capabilities are guarded server-side and cannot be accessed
 * by Free/Expired tier users simply by spoofing client requests.
 */

import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../../domain/billing/subscriptionService';
import { isEntitlementActive, checkUsageQuota, normalizeTier } from '../../domain/billing/planManager';
import { SubscriptionTier } from '../../../types';

// In-memory daily quota tracker (resets daily or per test)
const dailyUsageTracker = new Map<string, { date: string; count: number }>();

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyUsage(userId: string): number {
  const today = getTodayString();
  const record = dailyUsageTracker.get(userId);
  if (!record || record.date !== today) {
    return 0;
  }
  return record.count;
}

export function incrementDailyUsage(userId: string): number {
  const today = getTodayString();
  const record = dailyUsageTracker.get(userId);
  if (!record || record.date !== today) {
    dailyUsageTracker.set(userId, { date: today, count: 1 });
    return 1;
  }
  record.count += 1;
  return record.count;
}

export function resetQuotaTrackerForTesting(): void {
  dailyUsageTracker.clear();
}

/**
 * Middleware factory to enforce minimum subscription tier on backend endpoints.
 * @param minTier 'pro' | 'premium'
 * @param featureLabel Human readable label for error message
 */
export function requireTier(
  minTier: 'pro' | 'premium',
  featureLabel: string = 'Fitur Kuantitatif'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.userId || 'usr_guest_demo';
    const sub = subscriptionService.getSubscription(userId);

    const isEntitled = isEntitlementActive(sub.status, sub.gracePeriodEnd);
    const activeTier = isEntitled ? normalizeTier(sub.tier) : 'free';

    const tierHierarchy: Record<SubscriptionTier, number> = {
      free: 0,
      pro: 1,
      premium: 2,
      elite: 2,
    };

    if (tierHierarchy[activeTier] < tierHierarchy[minTier]) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'UPGRADE_REQUIRED',
        feature: featureLabel,
        requiredTier: minTier,
        currentTier: activeTier,
        subscriptionStatus: sub.status,
        message: `${featureLabel} membutuhkan paket ${minTier.toUpperCase()} yang aktif. Status langganan Anda saat ini: ${sub.status.toUpperCase()} (${activeTier.toUpperCase()}).`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to enforce daily prediction calculation quota per tier.
 */
export function enforceQuota(req: Request, res: Response, next: NextFunction): void {
  const userId = req.user?.userId || 'usr_guest_demo';
  const sub = subscriptionService.getSubscription(userId);
  const currentUsage = getDailyUsage(userId);

  const quota = checkUsageQuota(currentUsage, sub.tier, sub.status, sub.gracePeriodEnd);

  if (!quota.allowed) {
    res.status(429).json({
      error: 'Too Many Requests',
      code: 'DAILY_QUOTA_EXCEEDED',
      limit: quota.limit,
      used: currentUsage,
      subscriptionTier: sub.tier,
      message: `Batas kuota harian untuk paket ${sub.tier.toUpperCase()} (${quota.limit} prediksi/hari) telah habis. Tingkatkan paket langganan Anda untuk mendapatkan kuota lebih besar.`,
    });
    return;
  }

  // Attach quota info to response headers
  res.setHeader('X-GoalMetric-Daily-Limit', quota.limit.toString());
  res.setHeader('X-GoalMetric-Daily-Remaining', (quota.remaining - 1).toString());

  // Increment usage on next call
  incrementDailyUsage(userId);
  next();
}
