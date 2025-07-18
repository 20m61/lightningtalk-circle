/**
 * Frontend Logs API Routes
 * フロントエンドログ受信API
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { createRequire } from 'module';

// Production loggerはCommonJS形式なのでrequireを使用
const require = createRequire(import.meta.url);
const logger = require('../utils/production-logger');

const router = express.Router();

// フロントエンドログ専用のレート制限
const frontendLogRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 100, // 1分間に最大100リクエスト
  message: 'Too many log requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * フロントエンドログの受信
 * POST /api/logs/frontend
 */
router.post('/frontend', frontendLogRateLimit, async (req, res) => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        error: 'Invalid request: logs array is required'
      });
    }

    if (logs.length === 0) {
      return res.status(200).json({
        message: 'No logs to process',
        processed: 0
      });
    }

    if (logs.length > 50) {
      return res.status(400).json({
        error: 'Too many logs in single request (max 50)'
      });
    }

    let processedCount = 0;
    let errorCount = 0;

    // 各ログエントリを処理
    for (const logEntry of logs) {
      try {
        await processFrontendLogEntry(logEntry, req);
        processedCount++;
      } catch (error) {
        errorCount++;
        logger.error('Failed to process frontend log entry', {
          error: error.message,
          logEntry: JSON.stringify(logEntry).substring(0, 200)
        });
      }
    }

    logger.info('Frontend logs batch processed', {
      totalLogs: logs.length,
      processed: processedCount,
      errors: errorCount,
      clientIP: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Logs processed successfully',
      processed: processedCount,
      errors: errorCount
    });
  } catch (error) {
    logger.error('Frontend logs API error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Internal server error while processing logs'
    });
  }
});

/**
 * フロントエンドログエントリの処理
 */
async function processFrontendLogEntry(logEntry, req) {
  // 基本的なバリデーション
  if (!logEntry.timestamp || !logEntry.level || !logEntry.message) {
    throw new Error('Missing required log fields');
  }

  // タイムスタンプの検証
  const logTime = new Date(logEntry.timestamp);
  const now = new Date();
  const timeDiff = Math.abs(now - logTime);

  // 1時間以上古いログは拒否（時刻同期問題対策）
  if (timeDiff > 60 * 60 * 1000) {
    throw new Error('Log timestamp too old or too far in future');
  }

  // サーバーサイドでの追加メタデータ
  const serverMetadata = {
    frontend: true,
    serverReceivedAt: new Date().toISOString(),
    clientIP: req.ip,
    serverUserAgent: req.get('User-Agent'),
    serverForwardedFor: req.get('X-Forwarded-For'),
    serverHost: req.get('Host')
  };

  // ログレベル別の処理
  const level = logEntry.level.toLowerCase();
  const message = `[FRONTEND] ${logEntry.message}`;
  const metadata = {
    ...logEntry,
    ...serverMetadata
  };

  // サニタイズ済みメタデータから機密情報を再度チェック
  const sanitizedMetadata = sanitizeFrontendMetadata(metadata);

  switch (level) {
    case 'debug':
      logger.debug(message, sanitizedMetadata);
      break;
    case 'info':
      // ユーザーアクション等の重要な情報はbusinessレベルで記録
      if (logEntry.category === 'user_action') {
        logger.business(message, sanitizedMetadata);
      } else {
        logger.info(message, sanitizedMetadata);
      }
      break;
    case 'warn':
      logger.warn(message, sanitizedMetadata);
      break;
    case 'error':
      // フロントエンドエラーは特別扱い
      logger.error(message, {
        ...sanitizedMetadata,
        errorCategory: 'frontend_error'
      });

      // 重要なエラーの場合はセキュリティログとしても記録
      if (isCriticalFrontendError(logEntry)) {
        logger.security(`Critical frontend error: ${logEntry.message}`, {
          sessionId: logEntry.sessionId,
          userId: logEntry.userId,
          url: logEntry.url,
          userAgent: logEntry.userAgent,
          stack: logEntry.stack
        });
      }
      break;
    default:
      logger.info(message, sanitizedMetadata);
  }

  // パフォーマンスログの特別処理
  if (logEntry.category === 'performance') {
    handlePerformanceLog(logEntry, req);
  }

  // APIコールログの特別処理
  if (logEntry.category === 'api') {
    handleApiLog(logEntry, req);
  }
}

/**
 * フロントエンドメタデータのサニタイズ
 */
function sanitizeFrontendMetadata(metadata) {
  const sanitized = { ...metadata };

  // 機密情報のマスキング
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credit'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***masked***';
    }
  }

  // URL内のクエリパラメータから機密情報を除去
  if (sanitized.url) {
    try {
      const url = new URL(sanitized.url);
      const params = url.searchParams;

      sensitiveFields.forEach(field => {
        if (params.has(field)) {
          params.set(field, '***masked***');
        }
      });

      sanitized.url = url.toString();
    } catch (error) {
      // URL解析失敗時はドメインのみ保持
      try {
        const hostname = new URL(sanitized.url).hostname;
        sanitized.url = `${hostname}/[malformed-url]`;
      } catch (e) {
        sanitized.url = '[invalid-url]';
      }
    }
  }

  // スタックトレースの長さ制限
  if (sanitized.stack && typeof sanitized.stack === 'string') {
    sanitized.stack = sanitized.stack.substring(0, 2000);
  }

  return sanitized;
}

/**
 * 重要なフロントエンドエラーの判定
 */
function isCriticalFrontendError(logEntry) {
  const criticalPatterns = [
    /script error/i,
    /network error/i,
    /authentication/i,
    /authorization/i,
    /cors/i,
    /permission denied/i,
    /access denied/i
  ];

  const message = logEntry.message || '';
  return criticalPatterns.some(pattern => pattern.test(message));
}

/**
 * パフォーマンスログの処理
 */
function handlePerformanceLog(logEntry, req) {
  const duration = logEntry.duration;
  const operation = logEntry.operation;

  if (duration && operation) {
    logger.performance(`Frontend: ${operation}`, duration, {
      source: 'frontend',
      sessionId: logEntry.sessionId,
      userId: logEntry.userId,
      url: logEntry.url,
      viewport: logEntry.viewport
    });
  }
}

/**
 * APIログの処理
 */
function handleApiLog(logEntry, req) {
  const { method, url, duration, status } = logEntry;

  if (method && url && status) {
    // APIコールの統計情報として記録
    logger.info(`Frontend API call: ${method} ${url}`, {
      source: 'frontend',
      method,
      url,
      duration,
      status,
      sessionId: logEntry.sessionId,
      userId: logEntry.userId,
      clientIP: req.ip
    });

    // エラーレスポンスの場合は警告
    if (status >= 400) {
      logger.warn(`Frontend API error: ${method} ${url} returned ${status}`, {
        source: 'frontend',
        method,
        url,
        status,
        duration,
        sessionId: logEntry.sessionId
      });
    }
  }
}

/**
 * ログ統計情報の取得
 * GET /api/logs/frontend/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // 簡単な統計情報を返す（実装は環境により調整）
    const stats = {
      message: 'Frontend log statistics',
      note: 'Detailed statistics require CloudWatch integration',
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    logger.error('Frontend log stats error', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Failed to retrieve log statistics'
    });
  }
});

/**
 * ヘルスチェック
 * GET /api/logs/frontend/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'frontend-logs-api',
    timestamp: new Date().toISOString()
  });
});

export default router;
