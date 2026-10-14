/**
 * GoalMetric AI - Auth & RBAC Middleware
 * Validates request authorization and enforces role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../../domain/auth/authService';
import { UserSession } from '../../../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const session = verifyAuthToken(authHeader);
  if (session) {
    req.user = session;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.userId === 'usr_guest_demo') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please provide a valid Bearer token.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required to access this resource.',
      code: 'ADMIN_ACCESS_REQUIRED',
    });
    return;
  }
  next();
}
