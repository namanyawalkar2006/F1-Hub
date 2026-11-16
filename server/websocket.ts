/**
 * WebSocket Server for F1 Hub
 * Communicates live timing and historical session telemetry to clients.
 * Zero-Cost Architecture: Respects free provider boundaries.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { dataProviderRegistry } from './providers/dataProviderRegistry';

export function setupWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/live',
  });

  const sendCurrentState = async (ws: WebSocket) => {
    if (ws.readyState === WebSocket.OPEN) {
      const state = await dataProviderRegistry.getLiveTimingState();
      ws.send(JSON.stringify({
        type: 'live_snapshot',
        timestamp: new Date().toISOString(),
        data: state,
      }));
    }
  };

  wss.on('connection', async (ws: WebSocket) => {
    await sendCurrentState(ws);

    let isAlive = true;
    ws.on('pong', () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 20000);

    ws.on('message', async (message: string) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === 'change_session') {
          const updated = await dataProviderRegistry.getLiveTimingState(msg.session_key ? Number(msg.session_key) : undefined);
          ws.send(JSON.stringify({
            type: 'live_state_update',
            timestamp: new Date().toISOString(),
            data: updated,
          }));
        }
      } catch {
        // ignore
      }
    });

    ws.on('close', () => clearInterval(pingInterval));
    ws.on('error', () => clearInterval(pingInterval));
  });

  return {
    wss,
    cleanup: () => wss.close(),
  };
}
