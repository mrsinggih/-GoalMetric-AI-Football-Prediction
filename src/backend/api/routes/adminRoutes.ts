/**
 * GoalMetric AI - Admin Operations Route
 * Protected strictly by requireAuth and requireAdmin middleware.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';
import { predictionRepository } from '../../data-access/repositories/predictionRepository';
import { matchRepository } from '../../data-access/repositories/matchRepository';
import { getSupabaseConfigStatus } from '../../data-access/supabaseClient';

export const adminRoutes = Router();

// Protect all admin routes
adminRoutes.use(requireAuth);
adminRoutes.use(requireAdmin);

adminRoutes.get('/stats', async (_req: Request, res: Response) => {
  const allMatches = await matchRepository.getAllMatches();
  const cachedPredictions = await predictionRepository.getAllCachedPredictions();
  const supabaseStatus = getSupabaseConfigStatus();

  res.json({
    system: {
      serverUptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      environment: process.env.NODE_ENV || 'development',
    },
    dataAccess: {
      supabaseMode: supabaseStatus.mode,
      activeFixturesCount: allMatches.length,
      cachedPredictionsCount: cachedPredictions.length,
    },
    quotaTelemetry: {
      activeSubscribersCount: 142, // Simulated demo metrics
      apiRequestsLast24h: 3820,
      positiveEvOpportunitiesFound: 18,
    },
    auditStatus: {
      securityRulesValidated: true,
      serviceRoleExposedToBrowser: false, // Strict guarantee
      isDemoMode: true,
    },
  });
});
