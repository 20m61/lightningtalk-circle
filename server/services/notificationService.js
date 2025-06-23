/**
 * リアルタイム通知サービス
 * WebSocketとServer-Sent Eventsを使用したリアルタイム通知機能
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const logger = require('../middleware/logger');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // SSE クライアント管理
    this.wsClients = new Set(); // WebSocket クライアント管理
    this.subscriptions = new Map(); // トピック別サブスクリプション
    this.notificationHistory = []; // 通知履歴
    this.maxHistorySize = 1000;

    // 内部イベントの設定
    this.setupInternalEvents();
  }

  /**
   * 内部イベントリスナーの設定
   */
  setupInternalEvents() {
    // 新規参加者登録
    this.on('participant:registered', data => {
      this.broadcast('participant_registered', {
        message: `${data.name}さんが参加登録しました`,
        participant: data,
        timestamp: new Date().toISOString()
      });
    });

    // 新規発表申込み
    this.on('talk:submitted', data => {
      this.broadcast('talk_submitted', {
        message: `新しい発表「${data.title}」が申し込まれました`,
        talk: data,
        timestamp: new Date().toISOString()
      });
    });

    // イベント更新
    this.on('event:updated', data => {
      this.broadcast('event_updated', {
        message: 'イベント情報が更新されました',
        event: data,
        timestamp: new Date().toISOString()
      });
    });

    // システム通知
    this.on('system:notification', data => {
      this.broadcast('system_notification', {
        message: data.message,
        type: data.type || 'info',
        timestamp: new Date().toISOString()
      });
    });

    // チャットメッセージ
    this.on('chat:message', data => {
      this.broadcast('chat_message', {
        message: data.message,
        author: data.author,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * SSE (Server-Sent Events) の設定
   */
  setupSSE(req, res) {
    const clientId = uuidv4();

    // SSE ヘッダーの設定
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Credentials': true
    });

    // 接続確認メッセージ
    res.write(`id: ${clientId}\n`);
    res.write('event: connected\n');
    res.write(
      `data: ${JSON.stringify({
        message: 'Connected to Lightning Talk notifications',
        clientId,
        timestamp: new Date().toISOString()
      })}\n\n`
    );

    // クライアント情報を保存
    const client = {
      id: clientId,
      response: res,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(['all']) // デフォルトで全通知を受信
    };

    this.clients.set(clientId, client);
    logger.info(`SSE client connected: ${clientId}`);

    // 最近の通知履歴を送信
    this.sendRecentNotifications(clientId);

    // 接続維持のためのハートビート
    const heartbeat = setInterval(() => {
      if (this.clients.has(clientId)) {
        try {
          res.write('event: heartbeat\n');
          res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
          client.lastActivity = new Date();
        } catch (error) {
          logger.error(`Heartbeat failed for client ${clientId}:`, error);
          this.removeSSEClient(clientId);
          clearInterval(heartbeat);
        }
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // 30秒ごと

    // クライアント切断時の処理
    req.on('close', () => {
      this.removeSSEClient(clientId);
      clearInterval(heartbeat);
      logger.info(`SSE client disconnected: ${clientId}`);
    });

    req.on('error', error => {
      logger.error(`SSE client error ${clientId}:`, error);
      this.removeSSEClient(clientId);
      clearInterval(heartbeat);
    });

    return clientId;
  }

  /**
   * WebSocket の設定
   */
  setupWebSocket(wss) {
    wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      ws.clientId = clientId;
      ws.connectedAt = new Date();
      ws.subscriptions = new Set(['all']);

      this.wsClients.add(ws);
      logger.info(`WebSocket client connected: ${clientId}`);

      // 接続確認メッセージ
      ws.send(
        JSON.stringify({
          event: 'connected',
          data: {
            message: 'Connected to Lightning Talk WebSocket',
            clientId,
            timestamp: new Date().toISOString()
          }
        })
      );

      // 最近の通知履歴を送信
      this.sendRecentNotificationsWS(ws);

      // メッセージ受信処理
      ws.on('message', message => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.error(`Invalid WebSocket message from ${clientId}:`, error);
        }
      });

      // 切断処理
      ws.on('close', () => {
        this.wsClients.delete(ws);
        logger.info(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', error => {
        logger.error(`WebSocket client error ${clientId}:`, error);
        this.wsClients.delete(ws);
      });

      // ハートビート
      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

      ws.on('pong', () => {
        ws.lastActivity = new Date();
      });
    });
  }

  /**
   * WebSocket メッセージの処理
   */
  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        this.handleSubscription(ws, data.topics);
        break;
      case 'unsubscribe':
        this.handleUnsubscription(ws, data.topics);
        break;
      case 'chat':
        this.handleChatMessage(ws, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      default:
        logger.warn(`Unknown WebSocket message type: ${data.type}`);
    }
  }

  /**
   * トピック購読の処理
   */
  handleSubscription(ws, topics) {
    if (Array.isArray(topics)) {
      topics.forEach(topic => {
        ws.subscriptions.add(topic);

        // トピック別サブスクリプション管理
        if (!this.subscriptions.has(topic)) {
          this.subscriptions.set(topic, new Set());
        }
        this.subscriptions.get(topic).add(ws);
      });

      ws.send(
        JSON.stringify({
          event: 'subscribed',
          data: {
            topics,
            message: `Subscribed to ${topics.join(', ')}`,
            timestamp: new Date().toISOString()
          }
        })
      );

      logger.info(`Client ${ws.clientId} subscribed to: ${topics.join(', ')}`);
    }
  }

  /**
   * トピック購読解除の処理
   */
  handleUnsubscription(ws, topics) {
    if (Array.isArray(topics)) {
      topics.forEach(topic => {
        ws.subscriptions.delete(topic);

        if (this.subscriptions.has(topic)) {
          this.subscriptions.get(topic).delete(ws);
        }
      });

      ws.send(
        JSON.stringify({
          event: 'unsubscribed',
          data: {
            topics,
            message: `Unsubscribed from ${topics.join(', ')}`,
            timestamp: new Date().toISOString()
          }
        })
      );

      logger.info(`Client ${ws.clientId} unsubscribed from: ${topics.join(', ')}`);
    }
  }

  /**
   * チャットメッセージの処理
   */
  handleChatMessage(ws, data) {
    if (data.message && data.message.trim()) {
      const chatMessage = {
        id: uuidv4(),
        message: data.message.trim(),
        author: data.author || 'Anonymous',
        timestamp: new Date().toISOString(),
        clientId: ws.clientId
      };

      // チャットメッセージを配信
      this.emit('chat:message', chatMessage);

      logger.info(`Chat message from ${ws.clientId}: ${chatMessage.message}`);
    }
  }

  /**
   * 全クライアントへの配信
   */
  broadcast(event, data, topic = 'all') {
    const notification = {
      id: uuidv4(),
      event,
      data,
      topic,
      timestamp: new Date().toISOString()
    };

    // 通知履歴に追加
    this.addToHistory(notification);

    // SSE クライアントに送信
    this.broadcastSSE(notification);

    // WebSocket クライアントに送信
    this.broadcastWebSocket(notification);

    logger.info(`Broadcasted ${event} to all clients`);
  }

  /**
   * SSE クライアントへの配信
   */
  broadcastSSE(notification) {
    const message = `id: ${notification.id}\nevent: ${notification.event}\ndata: ${JSON.stringify(notification.data)}\n\n`;

    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has('all') || client.subscriptions.has(notification.topic)) {
        try {
          client.response.write(message);
          client.lastActivity = new Date();
        } catch (error) {
          logger.error(`Failed to send SSE to client ${clientId}:`, error);
          this.removeSSEClient(clientId);
        }
      }
    });
  }

  /**
   * WebSocket クライアントへの配信
   */
  broadcastWebSocket(notification) {
    const message = JSON.stringify({
      id: notification.id,
      event: notification.event,
      data: notification.data,
      timestamp: notification.timestamp
    });

    this.wsClients.forEach(ws => {
      if (
        ws.readyState === ws.OPEN &&
        (ws.subscriptions.has('all') || ws.subscriptions.has(notification.topic))
      ) {
        try {
          ws.send(message);
          ws.lastActivity = new Date();
        } catch (error) {
          logger.error(`Failed to send WebSocket message to client ${ws.clientId}:`, error);
          this.wsClients.delete(ws);
        }
      }
    });
  }

  /**
   * 特定のトピックに配信
   */
  broadcastToTopic(topic, event, data) {
    this.broadcast(event, data, topic);
  }

  /**
   * 最近の通知履歴を送信 (SSE)
   */
  sendRecentNotifications(clientId) {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    const recentNotifications = this.notificationHistory
      .slice(-10) // 最新10件
      .filter(
        notification =>
          client.subscriptions.has('all') || client.subscriptions.has(notification.topic)
      );

    recentNotifications.forEach(notification => {
      try {
        const message = `id: ${notification.id}\nevent: ${notification.event}\ndata: ${JSON.stringify(notification.data)}\n\n`;
        client.response.write(message);
      } catch (error) {
        logger.error(`Failed to send recent notification to SSE client ${clientId}:`, error);
      }
    });
  }

  /**
   * 最近の通知履歴を送信 (WebSocket)
   */
  sendRecentNotificationsWS(ws) {
    const recentNotifications = this.notificationHistory
      .slice(-10) // 最新10件
      .filter(
        notification => ws.subscriptions.has('all') || ws.subscriptions.has(notification.topic)
      );

    recentNotifications.forEach(notification => {
      try {
        ws.send(
          JSON.stringify({
            id: notification.id,
            event: notification.event,
            data: notification.data,
            timestamp: notification.timestamp
          })
        );
      } catch (error) {
        logger.error(
          `Failed to send recent notification to WebSocket client ${ws.clientId}:`,
          error
        );
      }
    });
  }

  /**
   * 通知履歴に追加
   */
  addToHistory(notification) {
    this.notificationHistory.push(notification);

    // 履歴サイズの制限
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * SSE クライアントの削除
   */
  removeSSEClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch (error) {
        // Already closed
      }
      this.clients.delete(clientId);
    }
  }

  /**
   * 接続統計の取得
   */
  getConnectionStats() {
    return {
      sseClients: this.clients.size,
      wsClients: this.wsClients.size,
      totalConnections: this.clients.size + this.wsClients.size,
      subscriptions: Object.fromEntries(this.subscriptions),
      notificationHistory: this.notificationHistory.length
    };
  }

  /**
   * アクティブでないクライアントのクリーンアップ
   */
  cleanupInactiveClients() {
    const now = new Date();
    const timeoutMs = 5 * 60 * 1000; // 5分

    // SSE クライアントのクリーンアップ
    this.clients.forEach((client, clientId) => {
      if (now - client.lastActivity > timeoutMs) {
        logger.info(`Cleaning up inactive SSE client: ${clientId}`);
        this.removeSSEClient(clientId);
      }
    });

    // WebSocket クライアントのクリーンアップ
    this.wsClients.forEach(ws => {
      if (ws.readyState !== ws.OPEN || (ws.lastActivity && now - ws.lastActivity > timeoutMs)) {
        logger.info(`Cleaning up inactive WebSocket client: ${ws.clientId}`);
        this.wsClients.delete(ws);
        try {
          ws.close();
        } catch (error) {
          // Already closed
        }
      }
    });
  }

  /**
   * 定期クリーンアップの開始
   */
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupInactiveClients();
    }, 60000); // 1分ごと
  }

  /**
   * サービス停止時のクリーンアップ
   */
  shutdown() {
    logger.info('Shutting down notification service...');

    // 全 SSE クライアントを切断
    this.clients.forEach((client, clientId) => {
      this.removeSSEClient(clientId);
    });

    // 全 WebSocket クライアントを切断
    this.wsClients.forEach(ws => {
      try {
        ws.close();
      } catch (error) {
        // Already closed
      }
    });

    this.wsClients.clear();
    this.subscriptions.clear();
    this.notificationHistory = [];

    logger.info('Notification service shutdown complete');
  }
}

// シングルトンインスタンス
const notificationService = new NotificationService();

// 定期クリーンアップの開始
notificationService.startPeriodicCleanup();

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  notificationService.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  notificationService.shutdown();
  process.exit(0);
});

module.exports = notificationService;
