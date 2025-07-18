/**
 * Frontend Structured Logger
 * フロントエンド構造化ログシステム
 * バックエンドのproduction-loggerと連携するクライアントサイドログシステム
 */

class FrontendLogger {
  constructor() {
    try {
      this.logLevel = this.getLogLevel();
      this.environment = this.getEnvironment();
      this.sessionId = this.generateSessionId();
      this.userId = null;
      this.apiEndpoint = this.getApiEndpoint();
      this.bufferEnabled = this.isBufferEnabled();
      this.buffer = [];
      this.bufferSize = parseInt(localStorage.getItem('LOG_BUFFER_SIZE') || '50');
      this.bufferInterval = parseInt(localStorage.getItem('LOG_BUFFER_INTERVAL') || '10000');
      this.isOnline = navigator.onLine;
      this.sendToServer = this.isSendToServerEnabled();
      this.bufferTimer = null;
      this.isDestroyed = false;

      // ログレベルの数値マッピング
      this.logLevels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
      };

      // ログスロットリング用
      this.logThrottle = new Map();
      this.throttleWindow = 1000; // 1秒

      this.setupEventListeners();
      this.startBufferFlush();
    } catch (error) {
      console.error('Failed to initialize FrontendLogger:', error);
      // フォールバック: 基本的なconsoleログに戻す
      this.fallbackMode = true;
    }
  }

  /**
   * 環境設定の取得
   */
  getEnvironment() {
    // メタタグまたはglobalオブジェクトから環境を取得
    const metaEnv = document.querySelector('meta[name="environment"]');
    if (metaEnv) {
      return metaEnv.content;
    }

    if (typeof window !== 'undefined' && window.APP_CONFIG) {
      return window.APP_CONFIG.environment;
    }

    // ドメインベースの環境判定
    const { hostname } = window.location;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    } else if (hostname.includes('dev') || hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  /**
   * ログレベルの取得
   */
  getLogLevel() {
    // URLパラメータで一時的なオーバーライド
    const urlParams = new URLSearchParams(window.location.search);
    const urlLogLevel = urlParams.get('logLevel');
    if (urlLogLevel) {
      return urlLogLevel;
    }

    // ローカルストレージから取得
    const stored = localStorage.getItem('LOG_LEVEL');
    if (stored) {
      return stored;
    }

    // 環境ベースのデフォルト
    const env = this.getEnvironment();
    return env === 'production' ? 'warn' : 'debug';
  }

  /**
   * APIエンドポイントの取得
   */
  getApiEndpoint() {
    const metaApi = document.querySelector('meta[name="api-endpoint"]');
    if (metaApi) {
      return metaApi.content;
    }

    if (typeof window !== 'undefined' && window.APP_CONFIG) {
      return window.APP_CONFIG.apiEndpoint;
    }

    return '/api';
  }

  /**
   * セッションIDの生成
   */
  generateSessionId() {
    let sessionId = sessionStorage.getItem('frontend_session_id');
    if (!sessionId) {
      sessionId = `fe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('frontend_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * バッファリング有効状態の取得
   */
  isBufferEnabled() {
    const stored = localStorage.getItem('LOG_BUFFER_ENABLED');
    return stored === 'true' || this.environment === 'production';
  }

  /**
   * サーバー送信有効状態の取得
   */
  isSendToServerEnabled() {
    const stored = localStorage.getItem('SEND_LOGS_TO_SERVER');
    return stored === 'true' && this.environment !== 'development';
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // オンライン/オフライン状態の監視
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.info('Network connection restored');
      this.flushBuffer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.warn('Network connection lost, logs will be buffered');
    });

    // ページアンロード時のバッファフラッシュ
    window.addEventListener('beforeunload', () => {
      this.flushBuffer(true);
    });

    // 未処理エラーのキャッチ
    window.addEventListener('error', event => {
      this.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Promiseの未処理拒否のキャッチ
    window.addEventListener('unhandledrejection', event => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  /**
   * バッファフラッシュタイマーの開始
   */
  startBufferFlush() {
    if (this.bufferEnabled && this.sendToServer) {
      this.bufferTimer = setInterval(() => {
        this.flushBuffer();
      }, this.bufferInterval);
    }
  }

  /**
   * バッファフラッシュタイマーの停止
   */
  stopBufferFlush() {
    if (this.bufferTimer) {
      clearInterval(this.bufferTimer);
      this.bufferTimer = null;
    }
  }

  /**
   * ユーザーIDの設定
   */
  setUserId(userId) {
    this.userId = userId;
    this.info('User context updated', { userId: userId ? 'set' : 'cleared' });
  }

  /**
   * ログレベルのチェック
   */
  shouldLog(level) {
    const currentLevel = this.logLevels[this.logLevel] || 0;
    const messageLevel = this.logLevels[level] || 0;
    return messageLevel >= currentLevel;
  }

  /**
   * ベースログメソッド
   */
  log(level, message, metadata = {}) {
    // フォールバックモード時は通常のconsole.logを使用
    if (this.fallbackMode) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `[${level.toUpperCase()}] ${message}`,
        metadata
      );
      return;
    }

    // 破棄済みの場合は何もしない
    if (this.isDestroyed) {
      return;
    }

    if (!this.shouldLog(level)) {
      return;
    }

    // スロットリングチェック
    const throttleKey = `${level}:${message}`;
    const now = Date.now();
    const lastLog = this.logThrottle.get(throttleKey);

    if (lastLog && now - lastLog < this.throttleWindow) {
      return; // スロットリング中
    }
    this.logThrottle.set(throttleKey, now);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: this.sanitizeMessage(message),
      sessionId: this.sessionId,
      userId: this.userId,
      environment: this.environment,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...this.sanitizeMetadata(metadata)
    };

    // コンソール出力（開発環境では詳細、本番では簡略）
    this.outputToConsole(level, message, logEntry);

    // バッファリングまたは即座に送信
    if (this.bufferEnabled && this.sendToServer) {
      this.addToBuffer(logEntry);
    } else if (this.sendToServer) {
      this.sendToServerImmediate(logEntry);
    }

    // ローカルストレージに保存（緊急時のデバッグ用）
    this.saveToLocalStorage(logEntry);
  }

  /**
   * コンソール出力
   */
  outputToConsole(level, message, logEntry) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (this.environment === 'development') {
      // 開発環境では詳細出力
      console.group(`${prefix} ${message}`);
      console.log('Details:', logEntry);
      console.groupEnd();
    } else {
      // 本番環境では簡略出力
      const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[method](`${prefix} ${message}`, logEntry.sessionId);
    }
  }

  /**
   * メッセージのサニタイズ
   */
  sanitizeMessage(message) {
    if (typeof message !== 'string') {
      return String(message);
    }

    // 機密情報のマスキング（拡張パターン）
    return message
      .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
      .replace(/key[=:]\s*[^\s&]+/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s&]+/gi, 'secret=***')
      .replace(/auth[=:]\s*[^\s&]+/gi, 'auth=***')
      .replace(/session[=:]\s*[^\s&]+/gi, 'session=***')
      .replace(/apikey[=:]\s*[^\s&]+/gi, 'apikey=***')
      .replace(/accesskey[=:]\s*[^\s&]+/gi, 'accesskey=***');
  }

  /**
   * メタデータのサニタイズ
   */
  sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    const sanitized = {};
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'session',
      'apikey',
      'accesskey',
      'credit',
      'ssn',
      'email'
    ];

    for (const [key, value] of Object.entries(metadata)) {
      const isSensitive = sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));

      if (isSensitive) {
        sanitized[key] = '***masked***';
      } else if (value && typeof value === 'object') {
        try {
          // 再帰的にサニタイズ
          sanitized[key] = this.sanitizeMetadata(value);
        } catch (e) {
          sanitized[key] = '[Circular Reference]';
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * バッファへの追加
   */
  addToBuffer(logEntry) {
    this.buffer.push(logEntry);

    if (this.buffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  /**
   * バッファのフラッシュ
   */
  async flushBuffer(isSync = false) {
    if (this.buffer.length === 0 || !this.isOnline) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      if (isSync && navigator.sendBeacon) {
        // ページアンロード時の同期送信
        navigator.sendBeacon(
          `${this.apiEndpoint}/logs/frontend`,
          JSON.stringify({ logs: logsToSend })
        );
      } else {
        await this.sendLogsToServer(logsToSend);
      }
    } catch (error) {
      // 送信失敗時はバッファに戻す
      this.buffer.unshift(...logsToSend);
      console.error('Failed to send logs to server:', error);
    }
  }

  /**
   * サーバーへのログ送信
   */
  async sendLogsToServer(logs) {
    const response = await fetch(`${this.apiEndpoint}/logs/frontend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logs })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
  }

  /**
   * 即座にサーバーに送信
   */
  async sendToServerImmediate(logEntry) {
    try {
      await this.sendLogsToServer([logEntry]);
    } catch (error) {
      // 失敗時はバッファに追加
      if (this.bufferEnabled) {
        this.addToBuffer(logEntry);
      }
    }
  }

  /**
   * ローカルストレージへの保存
   */
  saveToLocalStorage(logEntry) {
    try {
      const key = `frontend_logs_${new Date().toDateString()}`;
      let dailyLogs = JSON.parse(localStorage.getItem(key) || '[]');

      dailyLogs.push(logEntry);

      // 最新の100件のみ保持
      if (dailyLogs.length > 100) {
        dailyLogs = dailyLogs.slice(-100);
      }

      localStorage.setItem(key, JSON.stringify(dailyLogs));
    } catch (error) {
      // ローカルストレージが満杯の場合は古いログを削除
      this.cleanupOldLogs();
    }
  }

  /**
   * 古いログのクリーンアップ
   */
  cleanupOldLogs() {
    const now = new Date();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('frontend_logs_')) {
        const dateStr = key.replace('frontend_logs_', '');
        const logDate = new Date(dateStr);
        const daysDiff = (now - logDate) / (1000 * 60 * 60 * 24);

        if (daysDiff > 7) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // ログレベル別メソッド
  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  // 特殊ログメソッド
  userAction(action, details = {}) {
    this.info(`User action: ${action}`, {
      category: 'user_action',
      action,
      ...details
    });
  }

  performance(operation, duration, details = {}) {
    const level = duration > 2000 ? 'warn' : 'info';
    this.log(level, `Performance: ${operation} completed in ${duration}ms`, {
      category: 'performance',
      operation,
      duration,
      ...details
    });
  }

  apiCall(method, url, duration, status, details = {}) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API ${method} ${url} - ${status} (${duration}ms)`, {
      category: 'api',
      method,
      url,
      duration,
      status,
      ...details
    });
  }

  navigation(from, to, details = {}) {
    this.info(`Navigation: ${from} → ${to}`, {
      category: 'navigation',
      from,
      to,
      ...details
    });
  }

  // デバッグ用メソッド
  getStoredLogs(date = null) {
    const targetDate = date || new Date().toDateString();
    const key = `frontend_logs_${targetDate}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  exportLogs(days = 1) {
    const logs = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dailyLogs = this.getStoredLogs(date.toDateString());
      logs.push(...dailyLogs);
    }

    return logs;
  }

  clearLogs() {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('frontend_logs_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    this.info('Local logs cleared');
  }

  /**
   * ロガーの破棄
   */
  destroy() {
    this.isDestroyed = true;
    this.stopBufferFlush();

    // 残りのバッファを送信
    this.flushBuffer(true);

    // スロットリングMapをクリア
    this.logThrottle.clear();

    this.info('Logger destroyed');
  }
}

// シングルトンインスタンスの作成
const logger = new FrontendLogger();

// グローバルに公開
if (typeof window !== 'undefined') {
  window.Logger = logger;
}

// ES6 モジュールとしてもエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}
