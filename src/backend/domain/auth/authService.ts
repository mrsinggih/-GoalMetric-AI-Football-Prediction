/**
 * GoalMetric AI - Authentication & Role Domain Logic
 * Manages token verification, authorization scopes, and user session context.
 */

import { UserSession } from '../../../types';

export interface DecodedToken {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  tier: 'free' | 'pro' | 'elite';
  exp: number;
}

// Built-in demo accounts for architectural testing and demonstration
export const DEMO_SESSIONS: Record<string, UserSession> = {
  'demo-user-token': {
    userId: 'usr_demo_7721',
    email: 'analyst@goalmetric.demo',
    role: 'user',
    subscriptionTier: 'pro',
    predictionsRemainingToday: 42,
  },
  'demo-admin-token': {
    userId: 'adm_demo_0001',
    email: 'lead.architect@goalmetric.demo',
    role: 'admin',
    subscriptionTier: 'elite',
    predictionsRemainingToday: 500,
  },
};

/**
 * Validates bearer token header and extracts session
 */
export function verifyAuthToken(bearerHeader?: string): UserSession | null {
  if (!bearerHeader) {
    // Return default anonymous free tier user for seamless guest previewing
    return {
      userId: 'usr_guest_demo',
      email: 'guest@goalmetric.demo',
      role: 'user',
      subscriptionTier: 'free',
      predictionsRemainingToday: 3,
    };
  }

  const token = bearerHeader.replace(/^Bearer\s+/i, '').trim();

  // Check known demo tokens or mock JWT
  if (DEMO_SESSIONS[token]) {
    return DEMO_SESSIONS[token];
  }

  // Basic mock JWT parsing for external Supabase JWTs if present
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload && payload.sub) {
        return {
          userId: payload.sub,
          email: payload.email || 'user@supabase.auth',
          role: payload.app_metadata?.role === 'admin' ? 'admin' : 'user',
          subscriptionTier: payload.app_metadata?.tier || 'free',
          predictionsRemainingToday: 50,
        };
      }
    }
  } catch {
    // Invalid token format
  }

  return null;
}
