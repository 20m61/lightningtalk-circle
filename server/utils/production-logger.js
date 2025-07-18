/**
 * Production Logger System
 * 本番環境向けの構造化ログシステム
 * CloudWatch統合とパフォーマンス最適化を含む
 */

class ProductionLogger {
  constructor() {
    this.logLevel = this.getLogLevel();
    this.environment = process.env.NODE_ENV || 'development';
    this.serviceName = process.env.SERVICE_NAME || 'lightningtalk-circle';
    this.isProduction = this.environment === 'production';
    this.enabledLevels = this.getEnabledLevels();

    // CloudWatch統合フラグ
    this.cloudWatchEnabled = process.env.ENABLE_CLOUDWATCH_LOGS === 'true';

    // バッファリング設定（パフォーマンス最適化）
    this.bufferEnabled = process.env.LOG_BUFFER_ENABLED === 'true';
    this.logBuffer = [];
    this.bufferFlushInterval = parseInt(process.env.LOG_BUFFER_INTERVAL) || 5000; // 5秒
    this.maxBufferSize = parseInt(process.env.LOG_BUFFER_SIZE) || 100;

    if (this.bufferEnabled) {
      this.setupBuffering();
    }
  }

  /**
   * ログレベルの決定
   */
  getLogLevel() {
    const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.includes(level) ? level : 'info';
  }

  /**
   * 有効なログレベルの設定
   */
  getEnabledLevels() {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    return levels.slice(currentIndex);
  }

  /**
   * バッファリングシステムのセットアップ
   */
  setupBuffering() {
    // 定期的なフラッシュ
    setInterval(() => {
      this.flushBuffer();
    }, this.bufferFlushInterval);

    // プロセス終了時のフラッシュ
    process.on('exit', () => this.flushBuffer());
    process.on('SIGINT', () => {
      this.flushBuffer();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      this.flushBuffer();
      process.exit(0);
    });
  }

  /**
   * 構造化ログエントリの作成
   */
  createLogEntry(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message,
      ...metadata
    };

    // Lambda固有の情報を追加
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      entry.lambda = {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        requestId: process.env._X_AMZN_TRACE_ID
      };
    }

    // エラーオブジェクトの処理
    if (metadata.error && metadata.error instanceof Error) {
      entry.error = {
        name: metadata.error.name,
        message: metadata.error.message,
        stack: metadata.error.stack
      };
    }

    return entry;
  }

  /**
   * ログの出力
   */
  writeLog(entry) {
    if (!this.enabledLevels.includes(entry.level.toLowerCase())) {
      return;
    }

    const logString = JSON.stringify(entry);

    if (this.bufferEnabled) {
      this.logBuffer.push(logString);
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushBuffer();
      }
    } else {
      this.outputLog(logString);
    }
  }

  /**
   * ログの実際の出力
   */
  outputLog(logString) {
    if (this.isProduction && this.cloudWatchEnabled) {
      // CloudWatch用の構造化ログ
      console.log(logString);
    } else {
      // 開発環境用の見やすいログ
      const entry = JSON.parse(logString);
      const timestamp = entry.timestamp.split('T')[1].split('.')[0];
      const level = entry.level.padEnd(5);
      const message = entry.message;
      const metadata = { ...entry };
      delete metadata.timestamp;
      delete metadata.level;
      delete metadata.message;
      delete metadata.service;
      delete metadata.environment;

      console.log(
        `[${timestamp}] ${level} ${message}`,
        Object.keys(metadata).length > 0 ? metadata : ''
      );
    }
  }

  /**
   * バッファのフラッシュ
   */
  flushBuffer() {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    if (this.cloudWatchEnabled) {
      // CloudWatchに一括送信
      logs.forEach(log => this.outputLog(log));
    } else {
      logs.forEach(log => this.outputLog(log));
    }
  }

  /**
   * DEBUGレベルログ
   */
  debug(message, metadata = {}) {
    this.writeLog(this.createLogEntry('debug', message, metadata));
  }

  /**
   * INFOレベルログ
   */
  info(message, metadata = {}) {
    this.writeLog(this.createLogEntry('info', message, metadata));
  }

  /**
   * WARNレベルログ
   */
  warn(message, metadata = {}) {
    this.writeLog(this.createLogEntry('warn', message, metadata));
  }

  /**
   * ERRORレベルログ
   */
  error(message, metadata = {}) {
    this.writeLog(this.createLogEntry('error', message, metadata));
  }

  /**
   * HTTP リクエストログ
   */
  http(req, res, duration, metadata = {}) {
    const entry = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      ...metadata
    };

    if (res.statusCode >= 400) {
      this.warn(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, entry);
    } else {
      this.info(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, entry);
    }
  }

  /**
   * パフォーマンスログ
   */
  performance(operation, duration, metadata = {}) {
    const entry = {
      operation,
      duration: `${duration}ms`,
      ...metadata
    };

    if (duration > 1000) {
      this.warn(`Slow operation detected: ${operation}`, entry);
    } else {
      this.debug(`Performance: ${operation}`, entry);
    }
  }

  /**
   * セキュリティログ
   */
  security(event, metadata = {}) {
    const entry = {
      securityEvent: event,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    this.warn(`Security event: ${event}`, entry);
  }

  /**
   * ビジネスロジックログ
   */
  business(event, metadata = {}) {
    const entry = {
      businessEvent: event,
      ...metadata
    };

    this.info(`Business event: ${event}`, entry);
  }

  /**
   * Lambda固有のログ
   */
  lambda(event, context, result = null, error = null) {
    const entry = {
      requestId: context.awsRequestId,
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      memoryLimitInMB: context.memoryLimitInMB,
      remainingTimeInMillis: context.getRemainingTimeInMillis(),
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
        resource: event.resource
      }
    };

    if (error) {
      entry.error = error;
      this.error('Lambda execution error', entry);
    } else {
      entry.result = result;
      this.info('Lambda execution completed', entry);
    }
  }

  /**
   * デバイス/ユーザーエージェント分析ログ
   */
  userAgent(req, analysis, metadata = {}) {
    const entry = {
      userAgent: req.get('User-Agent'),
      analysis,
      ...metadata
    };

    this.debug('User agent analysis', entry);
  }

  /**
   * データベース操作ログ
   */
  database(operation, table, duration, metadata = {}) {
    const entry = {
      operation,
      table,
      duration: `${duration}ms`,
      ...metadata
    };

    if (duration > 500) {
      this.warn(`Slow database operation: ${operation} on ${table}`, entry);
    } else {
      this.debug(`Database: ${operation} on ${table}`, entry);
    }
  }

  /**
   * キャッシュ操作ログ
   */
  cache(operation, key, hit = null, metadata = {}) {
    const entry = {
      operation,
      key,
      hit,
      ...metadata
    };

    this.debug(
      `Cache ${operation}: ${key}${hit !== null ? ` (${hit ? 'HIT' : 'MISS'})` : ''}`,
      entry
    );
  }
}

// シングルトンインスタンス
const logger = new ProductionLogger();

module.exports = logger;
