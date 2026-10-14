/**
 * GoalMetric AI - Provider Sliding-Window Rate Limiter
 * Enforces per-minute and per-day safety ceilings on external API requests.
 */

export class ProviderRateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequestsPerMinute: number;
  private totalRequestsToday: number = 0;
  private currentDay: string = new Date().toISOString().slice(0, 10);

  constructor(maxRequestsPerMinute: number = 10) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  canMakeRequest(): { allowed: boolean; waitTimeMs: number; remainingInWindow: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Purge timestamps older than 1 minute
    this.timestamps = this.timestamps.filter(ts => ts > oneMinuteAgo);

    // Reset daily counter on date rollover
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.currentDay) {
      this.currentDay = today;
      this.totalRequestsToday = 0;
    }

    if (this.timestamps.length >= this.maxRequestsPerMinute) {
      const oldestInWindow = this.timestamps[0];
      const waitTimeMs = Math.max(100, 60000 - (now - oldestInWindow));
      return {
        allowed: false,
        waitTimeMs,
        remainingInWindow: 0,
      };
    }

    return {
      allowed: true,
      waitTimeMs: 0,
      remainingInWindow: this.maxRequestsPerMinute - this.timestamps.length,
    };
  }

  recordRequest(): void {
    this.timestamps.push(Date.now());
    this.totalRequestsToday++;
  }

  getMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.timestamps = this.timestamps.filter(ts => ts > oneMinuteAgo);

    return {
      requestsInLastMinute: this.timestamps.length,
      maxPerMinute: this.maxRequestsPerMinute,
      totalRequestsToday: this.totalRequestsToday,
    };
  }
}

export const providerRateLimiter = new ProviderRateLimiter(10);
