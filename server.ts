/**
 * GoalMetric AI - Full-Stack Server Entry Point
 * Mounts Express API backend routes and Vite dev server middlewares on port 3000.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createExpressApp } from './src/backend/app';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = createExpressApp();

  if (!isProd) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[GoalMetric] Vite middleware mounted in development mode.');
  } else {
    // Production mode: Serve built static files
    const staticDir = path.resolve(__dirname, 'dist');
    const express = (await import('express')).default;
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(staticDir, 'index.html'));
    });
    console.log(`[GoalMetric] Serving production static bundle from ${staticDir}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================================`);
    console.log(`⚽ GoalMetric AI Server running at http://localhost:${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/v1/health`);
    console.log(`📊 API Matches: http://localhost:${PORT}/api/v1/matches`);
    console.log(`🔐 Admin Route: http://localhost:${PORT}/api/v1/admin/stats`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================================`);
  });
}

startServer().catch(err => {
  console.error('[GoalMetric] Failed to start server:', err);
  process.exit(1);
});
