/**
 * GoalMetric AI - Error Handler & Demo Header Middleware
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Safe error response without leaking stack traces or internal secrets
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred in GoalMetric backend.',
    code: 'INTERNAL_ERROR',
    ...(isDev ? { stack: err.stack } : {}),
  });
}

export function demoModeGuard(_req: Request, res: Response, next: NextFunction): void {
  // Explicitly inform clients and downstream services that data in this environment is simulated
  res.setHeader('X-GoalMetric-Environment', 'DEMO_SANDBOX');
  res.setHeader('X-GoalMetric-Disclaimer', 'ALL_DATA_IS_SIMULATED_FOR_ARCHITECTURE_EVALUATION');
  next();
}
