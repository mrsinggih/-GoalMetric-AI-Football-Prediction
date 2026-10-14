/**
 * GoalMetric AI - Supabase Server-side Data Access Client
 * SECURITY WARNING: This file runs ONLY in the Node.js backend.
 * SUPABASE_SERVICE_ROLE_KEY MUST NEVER BE EXPOSED TO THE CLIENT/BROWSER.
 */

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  mode: 'CONNECTED_SUPABASE' | 'IN_MEMORY_DEMO_REPOSITORIES';
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const isConfigured = Boolean(
    url &&
    !url.includes('placeholder') &&
    serviceKey &&
    !serviceKey.includes('placeholder')
  );

  return {
    isConfigured,
    url: url ? url.replace(/^(https?:\/\/[^/]+).*/, '$1') : 'Not Configured',
    hasAnonKey: Boolean(anonKey && !anonKey.includes('placeholder')),
    hasServiceRoleKey: Boolean(serviceKey && !serviceKey.includes('placeholder')),
    mode: isConfigured ? 'CONNECTED_SUPABASE' : 'IN_MEMORY_DEMO_REPOSITORIES',
  };
}

/**
 * Server-side Query Helper
 * When Supabase credentials are configured in .env, connects via REST.
 * When in local development/bootstrap mode, falls back to the in-memory repository.
 */
export async function executeServerSupabaseQuery<T>(
  table: string,
  queryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  const status = getSupabaseConfigStatus();
  if (status.isConfigured) {
    try {
      return await queryFn();
    } catch {
      // Query failed, fall back safely
      return await fallbackFn();
    }
  }
  return await fallbackFn();
}
