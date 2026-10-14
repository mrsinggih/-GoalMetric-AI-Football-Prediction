/**
 * GoalMetric AI - Provider Synchronization Routes
 * REST API endpoints for monitoring data provider connectivity, rate limits, and sync triggers.
 */

import { Router, Request, Response } from 'express';
import { dataSyncManager } from '../../data-access/providers/syncManager';
import { defaultFootballProvider } from '../../data-access/providers/apiFootballAdapter';

export const syncRoutes = Router();

// GET synchronization diagnostics and status
syncRoutes.get('/status', (_req: Request, res: Response) => {
  const status = dataSyncManager.getStatus();
  res.json({
    data: status,
    instructions: {
      howToConfigureKey: 'Tambahkan secret FOOTBALL_DATA_API_KEY melalui panel Secrets pada pengaturan aplikasi AI Studio tanpa menaruh key di kode client.',
      complianceNote: 'Jika API key belum dikonfigurasi, sistem secara transparan memakai dataset demo [DEMO DATA] dan tidak membuat data aktual palsu.',
    },
  });
});

// POST trigger on-demand sync run
syncRoutes.post('/run', async (req: Request, res: Response) => {
  const { leagueId = '39', season = '2025' } = req.body || {};

  const result = await dataSyncManager.syncLeague(String(leagueId), String(season));

  res.json({
    result,
    timestamp: new Date().toISOString(),
  });
});

// GET historical sync logs
syncRoutes.get('/logs', (_req: Request, res: Response) => {
  const logs = defaultFootballProvider.getSyncLogs();
  res.json({
    logs,
    totalLogs: logs.length,
  });
});
