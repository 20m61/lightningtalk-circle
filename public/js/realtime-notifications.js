/**
 * リアルタイム通知クライアント
 * SSE と WebSocket による通知受信機能
 */

class RealtimeNotificationClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || window.location.origin;
    this.enableSSE = options.enableSSE !== false;
    this.enableWebSocket = options.enableWebSocket !== false;
    this.autoReconnect = options.autoReconnect !== false;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 3000;

    // 接続状態
    this.sseConnection = null;
    this.wsConnection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;

    // イベントハンドラー
    this.eventHandlers = new Map();
    this.connectionHandlers = new Map();

    // 通知履歴
    this.notificationHistory = [];
    this.maxHistorySize = 100;

    // UI要素
    this.notificationContainer = null;
    this.connectionStatus = null;

    this.init();
  }

  /**
   * 初期化
   */
  init() {
    this.createNotificationUI();
    this.setupDefaultHandlers();

    if (this.enableSSE) {
      this.connectSSE();
    }

    if (this.enableWebSocket) {
      this.connectWebSocket();
    }

    // ページ離脱時の接続クリーンアップ
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });

    // ページの可視性変更時の処理
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });
  }

  /**
   * SSE接続の確立
   */
  connectSSE() {
    if (!this.enableSSE || this.sseConnection) {
      return;
    }

    try {
      console.log('Connecting to SSE...');
      this.sseConnection = new EventSource(`${this.baseUrl}/api/notifications/stream`);

      this.sseConnection.addEventListener('open', () => {
        console.log('SSE connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected', 'SSE');
        this.triggerConnectionHandler('connected', 'sse');
      });

      this.sseConnection.addEventListener('error', error => {
        console.error('SSE connection error:', error);
        this.handleConnectionError('sse');
      });

      this.sseConnection.addEventListener('message', event => {
        this.handleSSEMessage(event);
      });

      // カスタムイベントリスナー
      this.sseConnection.addEventListener('connected', event => {
        const data = JSON.parse(event.data);
        console.log('SSE connected:', data);
      });

      this.sseConnection.addEventListener('participant_registered', event => {
        const data = JSON.parse(event.data);
        this.handleNotification('participant_registered', data);
      });

      this.sseConnection.addEventListener('talk_submitted', event => {
        const data = JSON.parse(event.data);
        this.handleNotification('talk_submitted', data);
      });

      this.sseConnection.addEventListener('event_updated', event => {
        const data = JSON.parse(event.data);
        this.handleNotification('event_updated', data);
      });

      this.sseConnection.addEventListener('system_notification', event => {
        const data = JSON.parse(event.data);
        this.handleNotification('system_notification', data);
      });

      this.sseConnection.addEventListener('chat_message', event => {
        const data = JSON.parse(event.data);
        this.handleNotification('chat_message', data);
      });

      this.sseConnection.addEventListener('heartbeat', event => {
        // ハートビート処理
        this.updateLastActivity();
      });
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      this.handleConnectionError('sse');
    }
  }

  /**
   * WebSocket接続の確立
   */
  connectWebSocket() {
    if (!this.enableWebSocket || this.wsConnection) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log('Connecting to WebSocket...');
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.addEventListener('open', () => {
        console.log('WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected', 'WebSocket');
        this.triggerConnectionHandler('connected', 'websocket');

        // 初期設定メッセージ
        this.sendWebSocketMessage({
          type: 'subscribe',
          topics: ['all']
        });
      });

      this.wsConnection.addEventListener('close', event => {
        console.log('WebSocket connection closed:', event);
        this.wsConnection = null;
        this.handleConnectionError('websocket');
      });

      this.wsConnection.addEventListener('error', error => {
        console.error('WebSocket connection error:', error);
        this.handleConnectionError('websocket');
      });

      this.wsConnection.addEventListener('message', event => {
        this.handleWebSocketMessage(event);
      });
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.handleConnectionError('websocket');
    }
  }

  /**
   * SSEメッセージの処理
   */
  handleSSEMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.handleNotification(event.type || 'message', data);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  }

  /**
   * WebSocketメッセージの処理
   */
  handleWebSocketMessage(event) {
    try {
      const message = JSON.parse(event.data);

      switch (message.event || message.type) {
        case 'connected':
          console.log('WebSocket connected:', message.data);
          break;
        case 'subscribed':
          console.log('Subscribed to topics:', message.data);
          break;
        case 'pong':
          this.updateLastActivity();
          break;
        default:
          this.handleNotification(message.event || message.type, message.data);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * WebSocketメッセージの送信
   */
  sendWebSocketMessage(message) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    }
  }

  /**
   * 通知の処理
   */
  handleNotification(event, data) {
    const notification = {
      id: data.id || Date.now().toString(),
      event,
      data,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false
    };

    // 履歴に追加
    this.addToHistory(notification);

    // イベントハンドラーの実行
    this.triggerEventHandler(event, notification);

    // UI通知の表示
    this.showNotification(notification);

    // カスタムイベントの発火
    window.dispatchEvent(
      new CustomEvent('realtimeNotification', {
        detail: notification
      })
    );
  }

  /**
   * 接続エラーの処理
   */
  handleConnectionError(connectionType) {
    this.isConnected = false;
    this.updateConnectionStatus('disconnected', connectionType);
    this.triggerConnectionHandler('disconnected', connectionType);

    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect ${connectionType} (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        if (connectionType === 'sse') {
          this.connectSSE();
        } else if (connectionType === 'websocket') {
          this.connectWebSocket();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * ページが非表示になった時の処理
   */
  handlePageHidden() {
    // WebSocketの一時停止
    if (this.wsConnection) {
      this.sendWebSocketMessage({ type: 'pause' });
    }
  }

  /**
   * ページが表示された時の処理
   */
  handlePageVisible() {
    // 接続状態の確認と復旧
    if (!this.isConnected) {
      if (this.enableSSE && !this.sseConnection) {
        this.connectSSE();
      }
      if (this.enableWebSocket && !this.wsConnection) {
        this.connectWebSocket();
      }
    }

    // WebSocketの再開
    if (this.wsConnection) {
      this.sendWebSocketMessage({ type: 'resume' });
    }
  }

  /**
   * 通知UIの作成
   */
  createNotificationUI() {
    // 通知コンテナ
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'realtime-notifications';
    this.notificationContainer.className = 'realtime-notifications-container';
    document.body.appendChild(this.notificationContainer);

    // 接続ステータス
    this.connectionStatus = document.createElement('div');
    this.connectionStatus.id = 'connection-status';
    this.connectionStatus.className = 'connection-status';
    this.connectionStatus.innerHTML =
      '<span class="status-indicator"></span><span class="status-text">接続中...</span>';
    this.notificationContainer.appendChild(this.connectionStatus);

    // スタイルの追加
    this.addNotificationStyles();
  }

  /**
   * 通知スタイルの追加
   */
  addNotificationStyles() {
    if (document.getElementById('realtime-notification-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'realtime-notification-styles';
    styles.textContent = `
      .realtime-notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        width: 350px;
        pointer-events: none;
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 4px;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        pointer-events: auto;
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #fbbf24;
        animation: pulse 2s infinite;
      }

      .connection-status.connected .status-indicator {
        background: #10b981;
        animation: none;
      }

      .connection-status.disconnected .status-indicator {
        background: #ef4444;
        animation: none;
      }

      .notification-item {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        animation: slideIn 0.3s ease-out forwards;
        pointer-events: auto;
        cursor: pointer;
      }

      .notification-item.participant_registered {
        border-left: 4px solid #10b981;
      }

      .notification-item.talk_submitted {
        border-left: 4px solid #3b82f6;
      }

      .notification-item.event_updated {
        border-left: 4px solid #f59e0b;
      }

      .notification-item.system_notification {
        border-left: 4px solid #ef4444;
      }

      .notification-item.chat_message {
        border-left: 4px solid #8b5cf6;
      }

      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .notification-type {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
      }

      .notification-time {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      .notification-message {
        font-size: 0.875rem;
        color: #374151;
        line-height: 1.4;
      }

      .notification-close {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        font-size: 1rem;
        color: #9ca3af;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 2px;
      }

      .notification-close:hover {
        color: #374151;
        background: #f3f4f6;
      }

      @keyframes slideIn {
        to {
          transform: translateX(0);
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      @media (max-width: 768px) {
        .realtime-notifications-container {
          width: calc(100% - 40px);
          right: 20px;
        }

        .notification-item {
          padding: 0.75rem;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * 通知の表示
   */
  showNotification(notification) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-item ${notification.event}`;
    notificationElement.dataset.notificationId = notification.id;

    const timeString = new Date(notification.timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });

    notificationElement.innerHTML = `
      <div class="notification-header">
        <span class="notification-type">${this.getEventTypeLabel(notification.event)}</span>
        <span class="notification-time">${timeString}</span>
      </div>
      <div class="notification-message">${notification.data.message}</div>
      <button class="notification-close" title="閉じる">&times;</button>
    `;

    // 閉じるボタンのイベント
    notificationElement.querySelector('.notification-close').addEventListener('click', e => {
      e.stopPropagation();
      this.hideNotification(notificationElement);
    });

    // 通知クリック時のイベント
    notificationElement.addEventListener('click', () => {
      this.handleNotificationClick(notification);
      this.hideNotification(notificationElement);
    });

    this.notificationContainer.appendChild(notificationElement);

    // 自動削除
    setTimeout(() => {
      this.hideNotification(notificationElement);
    }, 5000);
  }

  /**
   * 通知の非表示
   */
  hideNotification(element) {
    element.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  /**
   * イベントタイプのラベル取得
   */
  getEventTypeLabel(eventType) {
    const labels = {
      participant_registered: '新規参加',
      talk_submitted: '発表申込',
      event_updated: 'イベント更新',
      system_notification: 'システム',
      chat_message: 'チャット'
    };
    return labels[eventType] || 'お知らせ';
  }

  /**
   * 通知クリック時の処理
   */
  handleNotificationClick(notification) {
    // カスタムイベントの発火
    window.dispatchEvent(
      new CustomEvent('notificationClick', {
        detail: notification
      })
    );

    console.log('Notification clicked:', notification);
  }

  /**
   * 接続ステータスの更新
   */
  updateConnectionStatus(status, connectionType) {
    if (!this.connectionStatus) {
      return;
    }

    this.connectionStatus.className = `connection-status ${status}`;

    const statusText = this.connectionStatus.querySelector('.status-text');
    if (statusText) {
      const statusMessages = {
        connected: `${connectionType} 接続中`,
        disconnected: '切断されました',
        connecting: '接続中...'
      };
      statusText.textContent = statusMessages[status] || status;
    }
  }

  /**
   * 最終活動時刻の更新
   */
  updateLastActivity() {
    this.lastActivity = new Date();
  }

  /**
   * 履歴への追加
   */
  addToHistory(notification) {
    this.notificationHistory.unshift(notification);

    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * デフォルトハンドラーの設定
   */
  setupDefaultHandlers() {
    // デフォルトの通知ハンドラー
    this.on('participant_registered', notification => {
      console.log('New participant registered:', notification.data);
    });

    this.on('talk_submitted', notification => {
      console.log('New talk submitted:', notification.data);
    });

    this.on('event_updated', notification => {
      console.log('Event updated:', notification.data);
    });

    this.on('system_notification', notification => {
      console.log('System notification:', notification.data);
    });

    this.on('chat_message', notification => {
      console.log('Chat message:', notification.data);
    });
  }

  /**
   * イベントハンドラーの登録
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * 接続イベントハンドラーの登録
   */
  onConnection(event, handler) {
    if (!this.connectionHandlers.has(event)) {
      this.connectionHandlers.set(event, []);
    }
    this.connectionHandlers.get(event).push(handler);
  }

  /**
   * イベントハンドラーの実行
   */
  triggerEventHandler(event, notification) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(notification);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 接続ハンドラーの実行
   */
  triggerConnectionHandler(event, connectionType) {
    const handlers = this.connectionHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(connectionType);
        } catch (error) {
          console.error(`Error in connection handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * チャットメッセージの送信
   */
  sendChatMessage(message, author) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'chat',
        message,
        author
      });
    } else {
      console.warn('WebSocket not connected, cannot send chat message');
    }
  }

  /**
   * トピック購読
   */
  subscribe(topics) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'subscribe',
        topics: Array.isArray(topics) ? topics : [topics]
      });
    }
  }

  /**
   * トピック購読解除
   */
  unsubscribe(topics) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.sendWebSocketMessage({
        type: 'unsubscribe',
        topics: Array.isArray(topics) ? topics : [topics]
      });
    }
  }

  /**
   * 手動再接続
   */
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;

    setTimeout(() => {
      if (this.enableSSE) {
        this.connectSSE();
      }
      if (this.enableWebSocket) {
        this.connectWebSocket();
      }
    }, 1000);
  }

  /**
   * 接続の切断
   */
  disconnect() {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }

    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.isConnected = false;
    this.updateConnectionStatus('disconnected', 'all');
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      sseConnected: this.sseConnection && this.sseConnection.readyState === EventSource.OPEN,
      wsConnected: this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN,
      reconnectAttempts: this.reconnectAttempts,
      notificationCount: this.notificationHistory.length,
      lastActivity: this.lastActivity
    };
  }
}

// グローバルインスタンス
window.realtimeNotifications = new RealtimeNotificationClient();

// 自動開始
document.addEventListener('DOMContentLoaded', () => {
  console.log('Realtime notifications initialized');
});
