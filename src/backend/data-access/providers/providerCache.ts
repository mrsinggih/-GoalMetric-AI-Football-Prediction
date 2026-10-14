/**
 * GoalMetric AI - Provider Cache & Stale Recovery Manager
 * Stores API responses with TTL, handles stale-fallback when API is down or throttled.
 */

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export class ProviderCacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      ttlMs,
    });
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.cachedAt;
    const isStale = age > entry.ttlMs;

    return {
      data: entry.data as T,
      isStale,
    };
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const providerCache = new ProviderCacheManager();
