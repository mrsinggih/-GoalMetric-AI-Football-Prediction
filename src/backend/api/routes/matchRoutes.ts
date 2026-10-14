/**
 * GoalMetric AI - Matches Route
 * Exposes fixtures and team stats.
 */

import { Router, Request, Response } from 'express';
import { matchRepository } from '../../data-access/repositories/matchRepository';

export const matchRoutes = Router();

matchRoutes.get('/', async (_req: Request, res: Response) => {
  const matches = await matchRepository.getAllMatches();
  res.json({
    data: matches,
    count: matches.length,
    isDemoDataset: true,
    disclaimer: 'Semua data pertandingan adalah DATA SIMULASI DEMO untuk evaluasi algoritma dan arsitektur.',
  });
});

matchRoutes.get('/:id', async (req: Request, res: Response) => {
  const match = await matchRepository.getMatchById(req.params.id);
  if (!match) {
    res.status(404).json({
      error: 'Not Found',
      message: `Match fixture with id ${req.params.id} not found.`,
      code: 'MATCH_NOT_FOUND',
    });
    return;
  }
  res.json({ data: match, isDemoDataset: true });
});
