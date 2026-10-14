/**
 * GoalMetric AI - Health & System Status Route
 * Provides runtime health diagnostics for backend, database, and microservice status.
 */

import { Router, Request, Response } from 'express';
import { getSupabaseConfigStatus } from '../../data-access/supabaseClient';

export const healthRoutes = Router();

healthRoutes.get('/', async (_req: Request, res: Response) => {
  const supabaseStatus = getSupabaseConfigStatus();
  const pythonEnabled = process.env.PYTHON_ENGINE_ENABLED === 'true';
  const pythonUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

  let pythonServiceHealthy = false;
  if (pythonEnabled) {
    try {
      const response = await fetch(`${pythonUrl}/health`, { signal: AbortSignal.timeout(1500) });
      pythonServiceHealthy = response.ok;
    } catch {
      pythonServiceHealthy = false;
    }
  }

  res.json({
    status: 'healthy',
    service: 'GoalMetric AI API Gateway',
    version: '1.0.0-foundation',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    engine: {
      activeEngine: pythonServiceHealthy ? 'PYTHON_DIXON_COLES_MICROSERVICE' : 'TYPESCRIPT_NATIVE_POISSON',
      pythonMicroservice: {
        configured: pythonEnabled,
        endpoint: pythonUrl,
        isReachable: pythonServiceHealthy,
      },
      fallbackReady: true,
    },
    database: {
      provider: 'Supabase PostgreSQL',
      status: supabaseStatus.mode,
      isConfigured: supabaseStatus.isConfigured,
      hasServiceRoleKey: supabaseStatus.hasServiceRoleKey,
    },
    demoDisclaimer: 'NOTICE: This platform is running in DEMO mode with synthetic team and match statistics.',
  });
});
