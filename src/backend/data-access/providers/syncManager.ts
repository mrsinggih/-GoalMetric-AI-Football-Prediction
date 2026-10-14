/**
 * GoalMetric AI - Ingestion & Synchronization Manager
 * Orchestrates periodic ingestion from football data providers,
 * enforces deduplication, logs sync audits, and prevents fake actual data generation.
 */

import { defaultFootballProvider, ApiFootballAdapter } from './apiFootballAdapter';
import { NormalizedFixture, SyncLogEntry } from './footballProvider.interface';
import { providerRateLimiter } from './providerRateLimiter';
import { providerCache } from './providerCache';

export interface SyncStatusSummary {
  providerName: string;
  isConfigured: boolean;
  activeLeagues: string[];
  totalDeduplicatedFixtures: number;
  rateLimitMetrics: {
    requestsInLastMinute: number;
    maxPerMinute: number;
    totalRequestsToday: number;
  };
  cacheStats: {
    size: number;
  };
  lastSyncTimestamp: string | null;
  latestLogs: SyncLogEntry[];
}

export class DataSyncManager {
  private inMemoryStore: Map<string, NormalizedFixture> = new Map();
  private lastSyncTime: string | null = null;

  constructor(private readonly provider: ApiFootballAdapter = defaultFootballProvider) {}

  getStatus(): SyncStatusSummary {
    return {
      providerName: this.provider.providerName,
      isConfigured: this.provider.isConfigured,
      activeLeagues: ['Premier League (39)', 'La Liga (140)', 'Serie A (135)', 'Bundesliga (78)'],
      totalDeduplicatedFixtures: this.inMemoryStore.size,
      rateLimitMetrics: providerRateLimiter.getMetrics(),
      cacheStats: {
        size: providerCache.getStats().size,
      },
      lastSyncTimestamp: this.lastSyncTime,
      latestLogs: this.provider.getSyncLogs().slice(0, 15),
    };
  }

  /**
   * Run synchronization for a league
   */
  async syncLeague(leagueId: string = '39', season: string = '2025'): Promise<{
    success: boolean;
    syncedCount: number;
    isDemoFallback: boolean;
    message: string;
  }> {
    if (!this.provider.isConfigured) {
      return {
        success: false,
        syncedCount: 0,
        isDemoFallback: true,
        message: 'FOOTBALL_DATA_API_KEY belum dikonfigurasi di server environment/Secrets. Menggunakan dataset fallback demo berlabel transparan [DEMO DATA].',
      };
    }

    try {
      const fixtures = await this.provider.getFixtures(leagueId, season, 20);

      // Deduplication: upsert by external ID
      let newOrUpdated = 0;
      for (const fix of fixtures) {
        this.inMemoryStore.set(fix.externalId, fix);
        newOrUpdated++;
      }

      this.lastSyncTime = new Date().toISOString();

      return {
        success: true,
        syncedCount: newOrUpdated,
        isDemoFallback: false,
        message: `Sinkronisasi berhasil. ${newOrUpdated} jadwal pertandingan ter-update tanpa duplikasi.`,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        isDemoFallback: true,
        message: `Sinkronisasi gagal: ${err.message}. Data cache yang masih layak tetap dipertahankan.`,
      };
    }
  }

  getFixturesList(): NormalizedFixture[] {
    return Array.from(this.inMemoryStore.values());
  }
}

export const dataSyncManager = new DataSyncManager();
