/**
 * NotificationCenter Component
 * リアルタイム通知の表示・管理コンポーネント
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeNotifications, NotificationContextType } from '../hooks/useRealtimeNotifications';

interface NotificationCenterProps {
  className?: string;
  maxVisible?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableSound?: boolean;
}

interface NotificationItemProps {
  notification: any;
  onClose: () => void;
  onClick: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

/**
 * 個別通知アイテムコンポーネント
 */
function NotificationItem({ 
  notification, 
  onClose, 
  onClick, 
  autoHide = true, 
  autoHideDelay = 5000 
}: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoHide) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, autoHideDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoHide, autoHideDelay]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleClick = () => {
    onClick();
    handleClose();
  };

  const getNotificationIcon = (eventType: string) => {
    const icons = {
      participant_registered: '👤',
      talk_submitted: '🎤',
      event_updated: '📅',
      system_notification: '🔔',
      chat_message: '💬'
    };
    return icons[eventType as keyof typeof icons] || '📢';
  };

  const getNotificationColor = (eventType: string) => {
    const colors = {
      participant_registered: 'bg-green-50 border-green-200',
      talk_submitted: 'bg-blue-50 border-blue-200',
      event_updated: 'bg-yellow-50 border-yellow-200',
      system_notification: 'bg-red-50 border-red-200',
      chat_message: 'bg-purple-50 border-purple-200'
    };
    return colors[eventType as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        notification-item transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${getNotificationColor(notification.event)}
        border rounded-lg p-4 mb-3 cursor-pointer hover:shadow-lg
        max-w-sm mx-auto relative
      `}
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="通知を閉じる"
      >
        ×
      </button>

      <div className="flex items-start space-x-3">
        <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
          {getNotificationIcon(notification.event)}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {getEventTypeLabel(notification.event)}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(notification.timestamp)}
            </span>
          </div>
          
          <p className="text-sm text-gray-800 leading-relaxed">
            {notification.data.message}
          </p>
          
          {notification.data.author && (
            <p className="text-xs text-gray-500 mt-1">
              投稿者: {notification.data.author}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 接続ステータスコンポーネント
 */
function ConnectionStatus({ 
  status, 
  stats 
}: { 
  status: 'connecting' | 'connected' | 'disconnected';
  stats: any;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return '接続中';
      case 'connecting':
        return '接続中...';
      case 'disconnected':
        return '切断されました';
      default:
        return '不明';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'disconnected':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`
      flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm
      ${getStatusColor()}
    `}>
      <span role="img" aria-hidden="true">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      {stats.reconnectAttempts > 0 && (
        <span className="text-xs">
          (再接続試行: {stats.reconnectAttempts})
        </span>
      )}
    </div>
  );
}

/**
 * 通知センターメインコンポーネント
 */
export function NotificationCenter({
  className = '',
  maxVisible = 5,
  autoHide = true,
  autoHideDelay = 5000,
  position = 'top-right',
  enableSound = false
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    connectionStats,
    markAsRead,
    removeNotification,
    clearAllNotifications
  } = useRealtimeNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>();

  // 音声の初期化
  useEffect(() => {
    if (enableSound) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.3;
    }
  }, [enableSound]);

  // 新しい通知が来た時の処理
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotifications = notifications
        .filter(n => !n.read)
        .slice(0, maxVisible);
      
      setVisibleNotifications(latestNotifications);

      // 音声再生
      if (enableSound && audioRef.current && latestNotifications.length > 0) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [notifications, maxVisible, enableSound]);

  const handleNotificationClose = (notificationId: string) => {
    markAsRead(notificationId);
    setVisibleNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // カスタムイベントの発火
    window.dispatchEvent(new CustomEvent('notificationClick', {
      detail: notification
    }));
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 pointer-events-none';
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  return (
    <>
      {/* 通知センターボタン */}
      <div className="relative">
        <button
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="通知センター"
          aria-expanded={isOpen}
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* 通知パネル */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 pointer-events-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">通知</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {unreadCount}件の未読
                  </span>
                  {unreadCount > 0 && (
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={clearAllNotifications}
                    >
                      全て削除
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-2">
                <ConnectionStatus 
                  status={connectionStatus} 
                  stats={connectionStats} 
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  通知はありません
                </div>
              ) : (
                <div className="p-2">
                  {notifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50
                        ${!notification.read ? 'bg-blue-50 border-l-4 border-blue-400' : ''}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">
                          {getNotificationIcon(notification.event)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              {getEventTypeLabel(notification.event)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mt-1">
                            {notification.data.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ポップアップ通知 */}
      <div className={`${getPositionClasses()} ${className}`}>
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => handleNotificationClose(notification.id)}
            onClick={() => handleNotificationClick(notification)}
            autoHide={autoHide}
            autoHideDelay={autoHideDelay}
          />
        ))}
      </div>

      {/* クリック外での閉じる処理 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

/**
 * 通知タイプのラベル取得
 */
function getEventTypeLabel(eventType: string): string {
  const labels = {
    participant_registered: '新規参加',
    talk_submitted: '発表申込',
    event_updated: 'イベント更新',
    system_notification: 'システム',
    chat_message: 'チャット'
  };
  return labels[eventType as keyof typeof labels] || 'お知らせ';
}

/**
 * 通知アイコンの取得
 */
function getNotificationIcon(eventType: string): string {
  const icons = {
    participant_registered: '👤',
    talk_submitted: '🎤',
    event_updated: '📅',
    system_notification: '🔔',
    chat_message: '💬'
  };
  return icons[eventType as keyof typeof icons] || '📢';
}

/**
 * 相対時間の表示
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'たった今';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}時間前`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}日前`;
  }
}

/**
 * 通知センタープロバイダー
 */
interface NotificationProviderProps {
  children: React.ReactNode;
  options?: {
    enableSSE?: boolean;
    enableWebSocket?: boolean;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
  };
}

export function NotificationProvider({ children, options }: NotificationProviderProps) {
  const notificationContext = useRealtimeNotifications(options);

  return (
    <NotificationContext.Provider value={notificationContext}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * 通知コンテキスト
 */
const NotificationContext = React.createContext<NotificationContextType | null>(null);

/**
 * 通知コンテキストフック
 */
export function useNotificationContext(): NotificationContextType {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}

/**
 * 通知設定コンポーネント
 */
interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    enableSound: false,
    enableDesktopNotifications: false,
    autoHide: true,
    autoHideDelay: 5000
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem('notificationSettings', JSON.stringify({ ...settings, [key]: value }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }, []);

  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">通知設定</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">効果音</label>
          <input
            type="checkbox"
            checked={settings.enableSound}
            onChange={(e) => updateSetting('enableSound', e.target.checked)}
            className="toggle"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">デスクトップ通知</label>
          <input
            type="checkbox"
            checked={settings.enableDesktopNotifications}
            onChange={(e) => updateSetting('enableDesktopNotifications', e.target.checked)}
            className="toggle"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">自動非表示</label>
          <input
            type="checkbox"
            checked={settings.autoHide}
            onChange={(e) => updateSetting('autoHide', e.target.checked)}
            className="toggle"
          />
        </div>
        
        {settings.autoHide && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">表示時間</label>
            <select
              value={settings.autoHideDelay}
              onChange={(e) => updateSetting('autoHideDelay', parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={3000}>3秒</option>
              <option value={5000}>5秒</option>
              <option value={7000}>7秒</option>
              <option value={10000}>10秒</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}