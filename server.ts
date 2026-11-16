/**
 * Full-stack server entry point for F1 Hub
 * Express backend with OpenF1 ingestion + WebSocket live streaming + Vite middleware
 */

import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes';
import { setupWebSocketServer } from './server/websocket';

dotenv.config();

const projectRoot = process.cwd();

// Safeguard process against unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[F1 Hub] Uncaught Exception caught safely:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[F1 Hub] Unhandled Rejection caught safely:', reason);
});

async function prewarmCoreF1Data() {
  try {
    const { jolpicaProvider } = await import('./server/providers/jolpicaProvider');
    const [schedule, drivers, constructors] = await Promise.all([
      jolpicaProvider.getSchedule('current'),
      jolpicaProvider.getDriverStandings('current'),
      jolpicaProvider.getConstructorStandings('current'),
      jolpicaProvider.getLastRaceResults(),
    ]);

    const missingData = [
      schedule.length === 0 && 'schedule',
      drivers.standings.length === 0 && 'driver standings',
      constructors.standings.length === 0 && 'constructor standings',
    ].filter(Boolean);

    if (missingData.length > 0) {
      console.warn(`[F1 Hub] Startup data cache is partial: ${missingData.join(', ')}.`);
    } else {
      console.log('[F1 Hub] Schedule and championship data warmed.');
    }
  } catch (error) {
    console.warn('[F1 Hub] Startup data warm-up failed; serving requests without a warm cache.', error);
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // Mount API routes
  app.use('/api', apiRouter);

  // Setup WebSocket server for timing events
  setupWebSocketServer(server);

  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static production build
    const distPath = path.resolve(projectRoot, 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        const fileName = path.basename(filePath);
        if (fileName === 'index.html') {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/-[A-Za-z0-9_-]{8,}\./.test(fileName)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (isProduction) {
    await prewarmCoreF1Data();
  }

  // Global Express Error Middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[F1 Hub API Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal telemetry server error', details: err?.message });
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[F1 Hub] Server listening on http://0.0.0.0:${port}`);
    if (!isProduction) {
      void prewarmCoreF1Data();
    }

    import('./server/providers/openf1HistoricalProvider')
      .then(({ openf1HistoricalProvider }) => openf1HistoricalProvider.preloadRecentSessions())
      .catch((error) => console.warn('[F1 Hub] OpenF1 historical cache warm-up could not start.', error));
  });
}

startServer().catch(err => {
  console.error('[F1 Hub] Failed to start server:', err);
  process.exit(1);
});
