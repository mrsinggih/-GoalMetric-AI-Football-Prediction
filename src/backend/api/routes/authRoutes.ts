/**
 * GoalMetric AI - Authentication Route
 * Manages user profile retrieval and sandbox role toggling.
 */

import { Router, Request, Response } from 'express';
import { DEMO_SESSIONS } from '../../domain/auth/authService';
import { subscriptionService } from '../../domain/billing/subscriptionService';
import { getDailyUsage } from '../middlewares/featureGateMiddleware';
import { checkUsageQuota } from '../../domain/billing/planManager';

export const authRoutes = Router();

authRoutes.get('/me', (req: Request, res: Response) => {
  const baseUser = req.user || {
    userId: 'usr_guest_demo',
    email: 'guest@goalmetric.demo',
    role: 'user',
    subscriptionTier: 'free',
    predictionsRemainingToday: 3,
  };

  // Get active subscription and quota
  const sub = subscriptionService.getSubscription(baseUser.userId);
  const usedToday = getDailyUsage(baseUser.userId);
  const quota = checkUsageQuota(usedToday, sub.tier, sub.status, sub.gracePeriodEnd);

  const enrichedUser = {
    ...baseUser,
    subscriptionTier: sub.tier,
    subscriptionStatus: sub.status,
    predictionsRemainingToday: quota.remaining,
  };

  res.json({
    user: enrichedUser,
    isAuthenticated: baseUser.userId !== 'usr_guest_demo',
  });
});

// Demo switch role endpoint for architectural testing in UI
authRoutes.post('/switch-demo-role', (req: Request, res: Response) => {
  const { role } = req.body; // 'guest' | 'user' | 'admin'

  if (role === 'admin') {
    res.json({
      token: 'demo-admin-token',
      user: DEMO_SESSIONS['demo-admin-token'],
      message: 'Switched to Admin (Premium Tier) role.',
    });
  } else if (role === 'user') {
    res.json({
      token: 'demo-user-token',
      user: DEMO_SESSIONS['demo-user-token'],
      message: 'Switched to Analyst (Pro Tier) role.',
    });
  } else {
    res.json({
      token: '',
      user: {
        userId: 'usr_guest_demo',
        email: 'guest@goalmetric.demo',
        role: 'user',
        subscriptionTier: 'free',
        predictionsRemainingToday: 3,
      },
      message: 'Switched to Guest (Free Tier) role.',
    });
  }
});
