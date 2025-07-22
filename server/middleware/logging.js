/**
 * Express Logging Middleware
 * HTTP リクエスト/レスポンスログ記録用ミドルウェア
 */

const logger = require('../utils/production-logger');

/**
 * HTTPリクエストログミドルウェア
 */
function httpLoggingMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    // リクエスト開始ログ
    logger.info('HTTP request started', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referrer'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    });

    // レスポンス完了時のログ
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;

      logger.http(req, res, duration, {
        responseSize: body ? body.length : 0,
        timestamp: new Date().toISOString()
      });

      return originalSend.call(this, body);
    };

    // エラー処理
    res.on('error', error => {
      const duration = Date.now() - startTime;
      logger.error('HTTP response error', {
        method: req.method,
        url: req.url,
        error: error.message,
        duration,
        ip: req.ip
      });
    });

    next();
  };
}

/**
 * セキュリティイベントログミドルウェア
 */
function securityLoggingMiddleware() {
  return (req, res, next) => {
    // 疑わしいリクエストパターンの検出
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /script>/i, // XSS
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript protocol
      /<iframe/i // iframe injection
    ];

    const { url } = req;
    const userAgent = req.get('User-Agent') || '';
    const body = JSON.stringify(req.body);

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(userAgent) || pattern.test(body)) {
        logger.security('Suspicious request detected', {
          pattern: pattern.toString(),
          method: req.method,
          url: req.url,
          userAgent,
          ip: req.ip,
          body: req.body
        });
        break;
      }
    }

    // 異常なヘッダーサイズ
    const headerSize = JSON.stringify(req.headers).length;
    if (headerSize > 8192) {
      // 8KB
      logger.security('Large headers detected', {
        headerSize,
        ip: req.ip,
        userAgent
      });
    }

    // レート制限イベント
    if (res.locals && res.locals.rateLimited) {
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        userAgent,
        url: req.url
      });
    }

    next();
  };
}

/**
 * 認証ログミドルウェア
 */
function authLoggingMiddleware() {
  return (req, res, next) => {
    // Authorization ヘッダーがある場合
    if (req.headers.authorization) {
      const tokenType = req.headers.authorization.split(' ')[0];
      logger.debug('Authentication header present', {
        tokenType,
        url: req.url,
        ip: req.ip
      });
    }

    // 認証失敗時のログ（レスポンス後に実行）
    const originalStatus = res.status;
    res.status = function(code) {
      if (code === 401) {
        logger.security('Authentication failed', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      } else if (code === 403) {
        logger.security('Authorization failed', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          user: req.user?.id || 'unknown'
        });
      }
      return originalStatus.call(this, code);
    };

    next();
  };
}

/**
 * パフォーマンス監視ミドルウェア
 */
function performanceLoggingMiddleware() {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // ms

      // 遅いリクエストの警告
      if (duration > 2000) {
        // 2秒以上
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          statusCode: res.statusCode,
          ip: req.ip
        });
      }

      // パフォーマンスメトリクス
      logger.performance('HTTP request', duration, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length')
      });
    });

    next();
  };
}

/**
 * エラーログミドルウェア
 */
function errorLoggingMiddleware() {
  return (error, req, res, next) => {
    logger.error('Unhandled request error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query
    });

    next(error);
  };
}

/**
 * デバッグ情報ログミドルウェア（開発環境のみ）
 */
function debugLoggingMiddleware() {
  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Request details', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies
      });
    }
    next();
  };
}

/**
 * ビジネスロジックログヘルパー
 */
function logBusinessEvent(event, metadata = {}) {
  return (req, res, next) => {
    logger.business(event, {
      ...metadata,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    next();
  };
}

module.exports = {
  httpLoggingMiddleware,
  securityLoggingMiddleware,
  authLoggingMiddleware,
  performanceLoggingMiddleware,
  errorLoggingMiddleware,
  debugLoggingMiddleware,
  logBusinessEvent
};
