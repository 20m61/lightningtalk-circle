/**
 * WebSocket Server Setup
 * WebSocketサーバーの設定とNotificationServiceとの統合
 */

import { WebSocketServer } from 'ws';
import { logger } from './middleware/logger.js';
import notificationService from './services/notificationService.js';

/**
 * WebSocketサーバーの設定
 */
export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    clientTracking: true
  });

  logger.info('WebSocket server initialized');

  // NotificationServiceにWebSocketサーバーを設定
  notificationService.setupWebSocket(wss);

  // WebSocketサーバーイベント
  wss.on('connection', (ws, request) => {
    const clientIP = request.socket.remoteAddress;
    logger.info(`WebSocket connection from ${clientIP}`);

    ws.on('error', error => {
      logger.error(`WebSocket error from ${clientIP}:`, error);
    });
  });

  wss.on('close', () => {
    logger.info('WebSocket server closed');
  });

  wss.on('error', error => {
    logger.error('WebSocket server error:', error);
  });

  // サーバー統計の定期ログ出力
  setInterval(() => {
    const stats = notificationService.getConnectionStats();
    logger.info(`WebSocket stats: ${stats.wsClients} connected clients`);
  }, 60000); // 1分ごと

  return wss;
}
