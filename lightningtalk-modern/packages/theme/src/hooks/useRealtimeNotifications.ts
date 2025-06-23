/**
 * useRealtimeNotifications Hook
 * React用のリアルタイム通知フック
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface NotificationData {
  id: string;
  event: string;
  data: any;
  timestamp: string;
  read?: boolean;
}

interface ConnectionStats {
  isConnected: boolean;
  sseConnected: boolean;
  wsConnected: boolean;
  reconnectAttempts: number;
  notificationCount: number;
  lastActivity?: Date;
}

interface NotificationOptions {
  enableSSE?: boolean;
  enableWebSocket?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  baseUrl?: string;
}

type NotificationEventType = 
  | 'participant_registered'
  | 'talk_submitted'
  | 'event_updated'
  | 'system_notification'
  | 'chat_message'
  | 'connected'
  | 'disconnected';

type ConnectionType = 'sse' | 'websocket' | 'all';

/**
 * リアルタイム通知管理フック
 */
export function useRealtimeNotifications(options: NotificationOptions = {}) {
  const {
    enableSSE = true,
    enableWebSocket = true,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 3000,
    baseUrl = window.location.origin
  } = options;

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    isConnected: false,
    sseConnected: false,
    wsConnected: false,
    reconnectAttempts: 0,
    notificationCount: 0
  });

  const sseRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const eventHandlersRef = useRef<Map<string, Array<(notification: NotificationData) => void>>>(new Map());

  /**
   * SSE接続の確立
   */
  const connectSSE = useCallback(() => {
    if (!enableSSE || sseRef.current) return;

    try {
      console.log('Connecting to SSE...');
      const eventSource = new EventSource(`${baseUrl}/api/notifications/stream`);
      sseRef.current = eventSource;

      eventSource.addEventListener('open', () => {
        console.log('SSE connection established');
        setConnectionStatus('connected');
        setConnectionStats(prev => ({ ...prev, sseConnected: true, isConnected: true }));
        reconnectAttemptsRef.current = 0;
      });

      eventSource.addEventListener('error', (error) => {
        console.error('SSE connection error:', error);
        setConnectionStatus('disconnected');
        setConnectionStats(prev => ({ ...prev, sseConnected: false }));
        handleConnectionError('sse');
      });

      // 各種イベントリスナー
      const eventTypes: NotificationEventType[] = [
        'participant_registered',
        'talk_submitted', 
        'event_updated',
        'system_notification',
        'chat_message'
      ];

      eventTypes.forEach(eventType => {
        eventSource.addEventListener(eventType, (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            handleNotification(eventType, data);
          } catch (error) {
            console.error(`Failed to parse SSE message for ${eventType}:`, error);
          }
        });
      });

      eventSource.addEventListener('connected', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('SSE connected:', data);
      });

      eventSource.addEventListener('heartbeat', () => {
        setConnectionStats(prev => ({ ...prev, lastActivity: new Date() }));
      });

    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      handleConnectionError('sse');
    }
  }, [enableSSE, baseUrl]);

  /**
   * WebSocket接続の確立
   */
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket || wsRef.current) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket...');
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;

      websocket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        setConnectionStatus('connected');
        setConnectionStats(prev => ({ ...prev, wsConnected: true, isConnected: true }));
        reconnectAttemptsRef.current = 0;
        
        // 初期購読
        sendWebSocketMessage({
          type: 'subscribe',
          topics: ['all']
        });
      });

      websocket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        setConnectionStats(prev => ({ ...prev, wsConnected: false }));
        wsRef.current = null;
        handleConnectionError('websocket');
      });

      websocket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
        handleConnectionError('websocket');
      });

      websocket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      handleConnectionError('websocket');
    }
  }, [enableWebSocket]);

  /**
   * WebSocketメッセージの処理
   */
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.event || message.type) {
      case 'connected':
        console.log('WebSocket connected:', message.data);
        break;
      case 'subscribed':
        console.log('Subscribed to topics:', message.data);
        break;
      case 'pong':
        setConnectionStats(prev => ({ ...prev, lastActivity: new Date() }));
        break;
      default:
        if (message.event) {
          handleNotification(message.event, message.data);
        }
    }
  }, []);

  /**
   * WebSocketメッセージの送信
   */
  const sendWebSocketMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  /**
   * 通知の処理
   */
  const handleNotification = useCallback((event: string, data: any) => {
    const notification: NotificationData = {
      id: data.id || Date.now().toString(),
      event,
      data,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // 最新100件まで保持
    setUnreadCount(prev => prev + 1);
    setConnectionStats(prev => ({ ...prev, notificationCount: prev.notificationCount + 1 }));

    // カスタムイベントハンドラーの実行
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(notification);
        } catch (error) {
          console.error(`Error in notification handler for ${event}:`, error);
        }
      });
    }

    // カスタムイベントの発火
    window.dispatchEvent(new CustomEvent('realtimeNotification', {
      detail: notification
    }));
  }, []);

  /**
   * 接続エラーの処理
   */
  const handleConnectionError = useCallback((connectionType: ConnectionType) => {
    setConnectionStatus('disconnected');
    
    if (connectionType === 'sse') {
      setConnectionStats(prev => ({ ...prev, sseConnected: false }));
    } else if (connectionType === 'websocket') {
      setConnectionStats(prev => ({ ...prev, wsConnected: false }));
    }

    // 両方とも切断された場合
    if (!connectionStats.sseConnected && !connectionStats.wsConnected) {
      setConnectionStats(prev => ({ ...prev, isConnected: false }));
    }

    if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++;
      setConnectionStats(prev => ({ ...prev, reconnectAttempts: reconnectAttemptsRef.current }));
      
      console.log(`Attempting to reconnect ${connectionType} (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (connectionType === 'sse' && !sseRef.current) {
          connectSSE();
        } else if (connectionType === 'websocket' && !wsRef.current) {
          connectWebSocket();
        }
      }, reconnectDelay * reconnectAttemptsRef.current);
    }
  }, [autoReconnect, maxReconnectAttempts, reconnectDelay, connectSSE, connectWebSocket, connectionStats]);

  /**
   * 通知を既読にする
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * 全ての通知を既読にする
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  /**
   * 通知を削除
   */
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  /**
   * 全ての通知をクリア
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  /**
   * イベントハンドラーの登録
   */
  const addEventListener = useCallback((event: string, handler: (notification: NotificationData) => void) => {
    const handlers = eventHandlersRef.current.get(event) || [];
    handlers.push(handler);
    eventHandlersRef.current.set(event, handlers);
  }, []);

  /**
   * イベントハンドラーの削除
   */
  const removeEventListener = useCallback((event: string, handler: (notification: NotificationData) => void) => {
    const handlers = eventHandlersRef.current.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      eventHandlersRef.current.set(event, handlers);
    }
  }, []);

  /**
   * チャットメッセージの送信
   */
  const sendChatMessage = useCallback((message: string, author?: string) => {
    sendWebSocketMessage({
      type: 'chat',
      message,
      author: author || 'Anonymous'
    });
  }, [sendWebSocketMessage]);

  /**
   * トピック購読
   */
  const subscribe = useCallback((topics: string | string[]) => {
    sendWebSocketMessage({
      type: 'subscribe',
      topics: Array.isArray(topics) ? topics : [topics]
    });
  }, [sendWebSocketMessage]);

  /**
   * トピック購読解除
   */
  const unsubscribe = useCallback((topics: string | string[]) => {
    sendWebSocketMessage({
      type: 'unsubscribe',
      topics: Array.isArray(topics) ? topics : [topics]
    });
  }, [sendWebSocketMessage]);

  /**
   * 手動再接続
   */
  const reconnect = useCallback(() => {
    // 既存の接続を切断
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      if (enableSSE) connectSSE();
      if (enableWebSocket) connectWebSocket();
    }, 1000);
  }, [enableSSE, enableWebSocket, connectSSE, connectWebSocket]);

  /**
   * 接続の切断
   */
  const disconnect = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    setConnectionStats({
      isConnected: false,
      sseConnected: false,
      wsConnected: false,
      reconnectAttempts: 0,
      notificationCount: 0
    });
  }, []);

  /**
   * 初期化とクリーンアップ
   */
  useEffect(() => {
    if (enableSSE) connectSSE();
    if (enableWebSocket) connectWebSocket();

    // ページの可視性変更を監視
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ページが非表示になった時の処理
        if (wsRef.current) {
          sendWebSocketMessage({ type: 'pause' });
        }
      } else {
        // ページが表示された時の処理
        if (!connectionStats.isConnected) {
          reconnect();
        } else if (wsRef.current) {
          sendWebSocketMessage({ type: 'resume' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      disconnect();
    };
  }, []);

  /**
   * 通知の種類別フィルタリング
   */
  const getNotificationsByType = useCallback((eventType: NotificationEventType) => {
    return notifications.filter(notification => notification.event === eventType);
  }, [notifications]);

  /**
   * 未読通知の取得
   */
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  return {
    // 状態
    notifications,
    unreadCount,
    connectionStatus,
    connectionStats,
    
    // 通知操作
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    
    // イベント処理
    addEventListener,
    removeEventListener,
    
    // 通信機能
    sendChatMessage,
    subscribe,
    unsubscribe,
    
    // 接続管理
    reconnect,
    disconnect
  };
}

/**
 * 通知コンテキスト用の型定義
 */
export interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  connectionStats: ConnectionStats;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addEventListener: (event: string, handler: (notification: NotificationData) => void) => void;
  removeEventListener: (event: string, handler: (notification: NotificationData) => void) => void;
  sendChatMessage: (message: string, author?: string) => void;
  subscribe: (topics: string | string[]) => void;
  unsubscribe: (topics: string | string[]) => void;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * 通知の種類別カウント取得フック
 */
export function useNotificationCounts() {
  const { notifications } = useRealtimeNotifications();

  const counts = notifications.reduce((acc, notification) => {
    acc[notification.event] = (acc[notification.event] || 0) + 1;
    if (!notification.read) {
      acc[`${notification.event}_unread`] = (acc[`${notification.event}_unread`] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return counts;
}