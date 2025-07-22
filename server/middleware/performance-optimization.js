/**
 * Performance Optimization Middleware
 * パフォーマンス最適化のためのミドルウェア
 */

import compression from 'compression';
import { createLogger } from '../utils/logger.js';
import { promises as fs, existsSync } from 'fs';
import { join } from 'path';

const logger = createLogger('performance');

/**
 * Compression middleware configuration
 * レスポンスの圧縮設定
 */
const compressionMiddleware = compression({
  // 圧縮レベル（6がデフォルト、1-9の範囲）
  level: 6,
  // 圧縮する最小サイズ（1KB以上）
  threshold: 1024,
  // 圧縮するMIMEタイプ
  filter: (req, res) => {
    // 既に圧縮されているファイルは除外
    if (req.headers['x-no-compression']) {
      return false;
    }
    // compression のデフォルトフィルタを使用
    return compression.filter(req, res);
  }
});

/**
 * Static asset caching middleware
 * 静的アセットのキャッシュ設定
 */
const cacheControl = (req, res, next) => {
  // ファイルタイプごとのキャッシュ設定
  const cacheRules = {
    // 画像ファイル - 1年
    'image/jpeg': 'public, max-age=31536000, immutable',
    'image/png': 'public, max-age=31536000, immutable',
    'image/gif': 'public, max-age=31536000, immutable',
    'image/webp': 'public, max-age=31536000, immutable',
    'image/svg+xml': 'public, max-age=31536000, immutable',

    // フォントファイル - 1年
    'font/woff': 'public, max-age=31536000, immutable',
    'font/woff2': 'public, max-age=31536000, immutable',
    'font/ttf': 'public, max-age=31536000, immutable',
    'font/otf': 'public, max-age=31536000, immutable',

    // CSS/JSファイル - 1週間（ビルドハッシュ付きの場合は1年）
    'text/css':
      req.path.includes('.min.') || req.path.includes('-')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=604800',
    'application/javascript':
      req.path.includes('.min.') || req.path.includes('-')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=604800',

    // HTML - キャッシュなし
    'text/html': 'no-cache, no-store, must-revalidate',

    // JSON API - キャッシュなし
    'application/json': 'no-cache'
  };

  // Content-Typeに基づいてキャッシュヘッダーを設定
  const contentType = res.getHeader('Content-Type');
  if (contentType) {
    const mimeType = contentType.split(';')[0];
    const cacheHeader = cacheRules[mimeType];

    if (cacheHeader) {
      res.setHeader('Cache-Control', cacheHeader);

      // イミュータブルなリソースにはETagを設定
      if (cacheHeader.includes('immutable')) {
        const etag = `"${req.path.split('/').pop().split('.')[0]}"`;
        res.setHeader('ETag', etag);
      }
    }
  }

  // 条件付きリクエストの処理
  if (req.headers['if-none-match']) {
    const etag = res.getHeader('ETag');
    if (etag && req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
  }

  next();
};

/**
 * Resource hints middleware
 * リソースヒントの追加
 */
const resourceHints = (req, res, next) => {
  // HTMLレスポンスの場合のみ
  if (res.getHeader('Content-Type')?.includes('text/html')) {
    // Preconnect hints
    const preconnectUrls = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      process.env.CDN_URL
    ].filter(Boolean);

    preconnectUrls.forEach(url => {
      res.setHeader('Link', `<${url}>; rel=preconnect`);
    });

    // Preload critical resources
    const criticalResources = [
      { url: '/css/critical.css', as: 'style' },
      { url: '/js/core.js', as: 'script' },
      { url: '/fonts/NotoSansJP-Regular.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
    ];

    criticalResources.forEach(resource => {
      let header = `<${resource.url}>; rel=preload; as=${resource.as}`;
      if (resource.type) {
        header += `; type="${resource.type}"`;
      }
      if (resource.crossorigin) {
        header += '; crossorigin';
      }

      const existingLink = res.getHeader('Link');
      res.setHeader('Link', existingLink ? `${existingLink}, ${header}` : header);
    });
  }

  next();
};

/**
 * Performance monitoring middleware
 * パフォーマンス監視
 */
const performanceMonitoring = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Response time header
  res.setHeader('X-Response-Time', '0ms');

  // Override end method to measure performance
  const originalEnd = res.end;
  res.end = function (...args) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);

    // Log slow requests
    if (duration > 1000) {
      // 1 second
      const endMemory = process.memoryUsage();
      const memoryDelta = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external
      };

      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        memoryDelta: {
          heapUsed: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          external: `${(memoryDelta.external / 1024 / 1024).toFixed(2)}MB`
        },
        userAgent: req.get('user-agent')
      });
    }

    // Server timing header
    res.setHeader('Server-Timing', `total;dur=${duration.toFixed(2)}`);

    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Early hints middleware (HTTP 103)
 * 早期ヒントの送信
 */
const earlyHints = (req, res, next) => {
  // Only for HTML pages
  if (req.path === '/' || req.path.endsWith('.html')) {
    // Send 103 Early Hints if supported
    if (res.writeEarlyHints) {
      res.writeEarlyHints({
        link: [
          '</css/critical.css>; rel=preload; as=style',
          '</js/core.js>; rel=preload; as=script',
          '<https://fonts.googleapis.com>; rel=preconnect'
        ]
      });
    }
  }

  next();
};

/**
 * Image optimization middleware
 * 画像最適化の設定
 */
const imageOptimization = (req, res, next) => {
  // Check for WebP support
  const acceptHeader = req.headers.accept || '';
  const supportsWebP = acceptHeader.includes('image/webp');

  // Try to serve WebP if supported
  if (supportsWebP && req.path.match(/\.(jpg|jpeg|png)$/i)) {
    const webpPath = req.path.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    const fullWebpPath = join(process.cwd(), 'public', webpPath);

    if (existsSync(fullWebpPath)) {
      req.url = webpPath;
      res.setHeader('Vary', 'Accept');
    }
  }

  next();
};

/**
 * Lazy loading configuration
 * 遅延読み込みの設定
 */
const lazyLoadingHeaders = (req, res, next) => {
  // Add feature policy for lazy loading
  res.setHeader('Feature-Policy', "loading-frame-default-eager 'none'");

  next();
};

/**
 * HTTP/2 Server Push middleware
 * HTTP/2 サーバープッシュ
 */
const serverPush = (req, res, next) => {
  // Check if HTTP/2 is supported
  if (req.httpVersion === '2.0' && req.path === '/') {
    // Push critical resources
    if (res.push) {
      // Push critical CSS
      const cssStream = res.push('/css/critical.css', {
        request: {
          accept: 'text/css'
        },
        response: {
          'content-type': 'text/css',
          'cache-control': 'public, max-age=31536000'
        }
      });

      cssStream.on('error', err => {
        logger.error('Server push error:', err);
      });

      // Read and send the CSS file
      const fs = require('fs');
      const path = require('path');
      const cssPath = path.join(process.cwd(), 'public/css/critical.css');

      if (fs.existsSync(cssPath)) {
        fs.createReadStream(cssPath).pipe(cssStream);
      }
    }
  }

  next();
};

/**
 * Bundle size warning middleware
 * バンドルサイズ警告
 */
const bundleSizeWarning = (req, res, next) => {
  // Monitor response size
  let responseSize = 0;

  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.byteLength(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.byteLength(chunk);
    }

    // Warn for large responses
    if (responseSize > 1024 * 1024) {
      // 1MB
      logger.warn('Large response size', {
        path: req.path,
        size: `${(responseSize / 1024 / 1024).toFixed(2)}MB`,
        contentType: res.getHeader('Content-Type')
      });
    }

    return originalEnd.apply(res, [chunk, ...args]);
  };

  next();
};

/**
 * Critical CSS inlining
 * クリティカルCSSのインライン化
 */
const criticalCssInlining = async (req, res, next) => {
  // Only for HTML responses
  if (!req.path.endsWith('.html') && req.path !== '/') {
    return next();
  }

  // Store original send method
  const originalSend = res.send;

  res.send = function (html) {
    if (typeof html === 'string' && html.includes('</head>')) {
      const criticalCssPath = join(process.cwd(), 'public/css/critical.css');

      fs.readFile(criticalCssPath, 'utf8')
        .then(criticalCss => {
          // Inline critical CSS
          const inlinedHtml = html.replace(
            '</head>',
            `<style id="critical-css">${criticalCss}</style></head>`
          );

          originalSend.call(res, inlinedHtml);
        })
        .catch(() => {
          // If critical CSS not found, send original HTML
          originalSend.call(res, html);
        });
    } else {
      originalSend.call(res, html);
    }
  };

  next();
};

export {
  compressionMiddleware,
  cacheControl,
  resourceHints,
  performanceMonitoring,
  earlyHints,
  imageOptimization,
  lazyLoadingHeaders,
  serverPush,
  bundleSizeWarning,
  criticalCssInlining
};
