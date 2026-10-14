/**
 * GoalMetric AI - Express Application Setup
 * Modular assembly of routes, middlewares, and error handlers.
 */

import express, { Express } from 'express';
import { healthRoutes } from './api/routes/healthRoutes';
import { matchRoutes } from './api/routes/matchRoutes';
import { predictionRoutes } from './api/routes/predictionRoutes';
import { billingRoutes } from './api/routes/billingRoutes';
import { authRoutes } from './api/routes/authRoutes';
import { adminRoutes } from './api/routes/adminRoutes';
import { syncRoutes } from './api/routes/syncRoutes';
import { authMiddleware } from './api/middlewares/authMiddleware';
import { errorHandler, demoModeGuard } from './api/middlewares/errorHandler';

export function createExpressApp(): Express {
  const app = express();

  // Basic middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(demoModeGuard);
  app.use(authMiddleware);

  // API v1 Routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/matches', matchRoutes);
  app.use('/api/v1/predictions', predictionRoutes);
  app.use('/api/v1/billing', billingRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/sync', syncRoutes);

  // Central error handling
  app.use(errorHandler);

  return app;
}
