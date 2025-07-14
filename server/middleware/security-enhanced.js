/**
 * Enhanced Security Middleware
 * 追加のセキュリティ強化機能を提供
 */

import crypto from 'crypto';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Security');

/**
 * HTTPS Redirect Middleware
 * 本番環境でHTTPSを強制
 */
const enforceHTTPS = (req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https'
  ) {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

/**
 * Security Headers Enhancement
 * Helmetの追加設定
 */
const enhancedSecurityHeaders = (req, res, next) => {
  // Feature Policy / Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Additional security headers
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Cache control for sensitive pages
  if (req.path.includes('/admin') || req.path.includes('/api/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Request Signing Verification
 * 重要なAPIエンドポイントのリクエスト署名検証
 */
const verifyRequestSignature = secret => {
  return (req, res, next) => {
    const signature = req.get('X-Request-Signature');
    const timestamp = req.get('X-Request-Timestamp');

    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Missing request signature' });
    }

    // Check timestamp to prevent replay attacks (5 minute window)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 300000) {
      return res.status(401).json({ error: 'Request expired' });
    }

    // Verify signature
    const payload = `${req.method}:${req.path}:${timestamp}:${JSON.stringify(req.body || {})}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Invalid request signature', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Invalid request signature' });
    }

    next();
  };
};

/**
 * Secure Cookie Configuration
 * セキュアなCookie設定
 */
const configureCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    signed: true
  };
};

/**
 * Token Rotation Middleware
 * アクセストークンの自動ローテーション
 */
const tokenRotation = tokenService => {
  return async (req, res, next) => {
    if (!req.user || !req.token) {
      return next();
    }

    // Check if token is close to expiration (within 5 minutes)
    const tokenExp = req.user.exp * 1000;
    const now = Date.now();
    const timeUntilExp = tokenExp - now;

    if (timeUntilExp < 300000 && timeUntilExp > 0) {
      try {
        // Generate new token
        const newToken = await tokenService.generateToken({
          userId: req.user.userId,
          email: req.user.email,
          role: req.user.role
        });

        // Set new token in response header
        res.setHeader('X-New-Token', newToken);
        res.setHeader('X-Token-Refreshed', 'true');

        logger.info('Token refreshed for user', { userId: req.user.userId });
      } catch (error) {
        logger.error('Token refresh failed', error);
      }
    }

    next();
  };
};

/**
 * Security Event Monitoring
 * セキュリティイベントの監視とログ記録
 */
class SecurityMonitor {
  constructor() {
    this.events = new Map();
    this.thresholds = {
      failedLogins: { count: 5, window: 300000 }, // 5 attempts in 5 minutes
      suspiciousRequests: { count: 10, window: 60000 }, // 10 requests in 1 minute
      csrfViolations: { count: 3, window: 300000 } // 3 violations in 5 minutes
    };
  }

  recordEvent(eventType, identifier, metadata = {}) {
    const key = `${eventType}:${identifier}`;
    const now = Date.now();

    if (!this.events.has(key)) {
      this.events.set(key, []);
    }

    const events = this.events.get(key);
    events.push({ timestamp: now, metadata });

    // Clean old events
    const threshold = this.thresholds[eventType];
    if (threshold) {
      const cutoff = now - threshold.window;
      const recentEvents = events.filter(e => e.timestamp > cutoff);
      this.events.set(key, recentEvents);

      // Check if threshold exceeded
      if (recentEvents.length >= threshold.count) {
        this.handleThresholdExceeded(eventType, identifier, recentEvents);
      }
    }
  }

  handleThresholdExceeded(eventType, identifier, events) {
    logger.warn('Security threshold exceeded', {
      eventType,
      identifier,
      count: events.length,
      metadata: events[events.length - 1].metadata
    });

    // Here you could implement additional actions:
    // - Send alerts
    // - Block IP addresses
    // - Trigger additional verification
    // - Notify administrators
  }

  middleware() {
    return (req, res, next) => {
      req.securityMonitor = this;
      next();
    };
  }
}

/**
 * Content Type Validation
 * リクエストのContent-Type検証
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('content-type');

      if (!contentType) {
        return res.status(400).json({ error: 'Content-Type header is required' });
      }

      const isAllowed = allowedTypes.some(type => contentType.includes(type));
      if (!isAllowed) {
        return res.status(415).json({ error: 'Unsupported Media Type' });
      }
    }

    next();
  };
};

/**
 * IP Whitelist/Blacklist Middleware
 * IPアドレスベースのアクセス制御
 */
class IPAccessControl {
  constructor(options = {}) {
    this.whitelist = new Set(options.whitelist || []);
    this.blacklist = new Set(options.blacklist || []);
    this.mode = options.mode || 'blacklist'; // 'whitelist' or 'blacklist'
  }

  addToWhitelist(ip) {
    this.whitelist.add(ip);
  }

  addToBlacklist(ip) {
    this.blacklist.add(ip);
  }

  removeFromWhitelist(ip) {
    this.whitelist.delete(ip);
  }

  removeFromBlacklist(ip) {
    this.blacklist.delete(ip);
  }

  middleware() {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;

      if (this.mode === 'whitelist') {
        if (!this.whitelist.has(clientIP)) {
          logger.warn('Access denied - IP not in whitelist', { ip: clientIP });
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        if (this.blacklist.has(clientIP)) {
          logger.warn('Access denied - IP in blacklist', { ip: clientIP });
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      next();
    };
  }
}

/**
 * API Key Authentication
 * APIキー認証ミドルウェア
 */
const apiKeyAuth = validKeys => {
  const keySet = new Set(validKeys);

  return (req, res, next) => {
    const apiKey = req.get('X-API-Key') || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    if (!keySet.has(apiKey)) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Optionally set key info on request
    req.apiKey = apiKey;
    next();
  };
};

/**
 * Security Audit Logger
 * セキュリティ監査ログ
 */
const auditLogger = action => {
  return (req, res, next) => {
    const startTime = Date.now();

    // Capture original end function
    const originalEnd = res.end;

    res.end = function (...args) {
      const duration = Date.now() - startTime;

      logger.info('Security audit', {
        action,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.userId,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      originalEnd.apply(res, args);
    };

    next();
  };
};

export {
  enforceHTTPS,
  enhancedSecurityHeaders,
  verifyRequestSignature,
  configureCookieOptions,
  tokenRotation,
  SecurityMonitor,
  validateContentType,
  IPAccessControl,
  apiKeyAuth,
  auditLogger
};
