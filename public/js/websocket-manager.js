/**
 * WebSocket Manager
 * WebSocket接続の管理とイベント処理
 */

class WebSocketManager {
  constructor(url = '') {
    this.url = url || this.getWebSocketUrl();
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.isConnected = false;
    this.connectionId = null;

    // Socket.IOの読み込みを待つ
    this.waitForSocketIO();
  }

  getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  async waitForSocketIO() {
    try {
      // Socket.IOの読み込みを待つ
      if (typeof io === 'undefined') {
        if (window.ioLoadPromise) {
          await window.ioLoadPromise;
        } else {
          // フォールバック: 最大3秒待つ
          let attempts = 0;
          while (typeof io === 'undefined' && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
        }
      }

      if (typeof io !== 'undefined') {
        this.connect();
      } else {
        // Socket.IOが利用できない場合は静かにスキップ
        if (window.DEBUG_MODE) {
          console.info('[WebSocketManager] Socket.IO not available - real-time features disabled');
        }
      }
    } catch (error) {
      if (window.DEBUG_MODE) {
        console.warn('[WebSocketManager] Error waiting for Socket.IO:', error);
      }
    }
  }

  connect() {
    if (typeof io === 'undefined') {
      return;
    }

    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    });

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      if (window.DEBUG_MODE) console.log('[WebSocketManager] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionId = this.socket.id;
      this.emit('connection:established', { id: this.connectionId });
    });

    this.socket.on('disconnect', reason => {
      if (window.DEBUG_MODE) console.log('[WebSocketManager] Disconnected:', reason);
      this.isConnected = false;
      this.emit('connection:lost', { reason });
    });

    this.socket.on('error', error => {
      if (window.DEBUG_MODE) console.error('[WebSocketManager] Error:', error);
      this.emit('connection:error', { error });
    });

    this.socket.on('reconnect', attemptNumber => {
      if (window.DEBUG_MODE)
        console.log('[WebSocketManager] Reconnected after', attemptNumber, 'attempts');
      this.emit('connection:reconnected', { attempts: attemptNumber });
    });

    this.socket.on('reconnect_attempt', attemptNumber => {
      this.reconnectAttempts = attemptNumber;
      this.emit('connection:reconnecting', { attempt: attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      if (window.DEBUG_MODE) console.error('[WebSocketManager] Reconnection failed');
      this.emit('connection:failed');
    });
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());

      // Register with socket if not a connection event
      if (this.socket && !event.startsWith('connection:')) {
        this.socket.on(event, data => {
          this.emit(event, data);
        });
      }
    }

    this.eventHandlers.get(event).add(handler);

    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
        if (this.socket && !event.startsWith('connection:')) {
          this.socket.off(event);
        }
      }
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          if (window.DEBUG_MODE)
            console.error(`[WebSocketManager] Error in handler for ${event}:`, error);
        }
      });
    }
  }

  send(event, data) {
    if (!this.isConnected || !this.socket) {
      if (window.DEBUG_MODE)
        console.warn('[WebSocketManager] Not connected. Message queued:', event, data);
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  join(room) {
    return this.send('join', { room });
  }

  leave(room) {
    return this.send('leave', { room });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionId = null;
    }
  }

  getConnectionId() {
    return this.connectionId;
  }

  isConnectionActive() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Singleton instance
let wsManagerInstance = null;

// グローバル関数として公開
window.getWebSocketManager = function () {
  if (!wsManagerInstance) {
    wsManagerInstance = new WebSocketManager();
  }
  return wsManagerInstance;
};

// Auto-connect on module load if Socket.IO is available
if (typeof io !== 'undefined') {
  setTimeout(() => {
    const manager = getWebSocketManager();
    manager.connect();
  }, 100);
}
