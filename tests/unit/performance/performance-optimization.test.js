/**
 * Performance Optimization Tests
 */

import { jest } from '@jest/globals';
import compression from 'compression';

// Mock modules
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.unstable_mockModule('../../../server/utils/logger', () => ({
  logger: mockLogger
}));

jest.unstable_mockModule('compression', () => ({
  default: jest.fn(() => jest.fn((req, res, next) => next())),
  filter: jest.fn()
}));

const performanceModule = await import('../../../server/middleware/performance-optimization.js');
const {
  compressionMiddleware,
  cacheControl,
  resourceHints,
  performanceMonitoring,
  imageOptimization,
  bundleSizeWarning,
  criticalCssInlining
} = performanceModule.default || performanceModule;

describe('Performance Optimization Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/test',
      method: 'GET',
      headers: {},
      get: jest.fn(),
      httpVersion: '1.1'
    };

    res = {
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
      send: jest.fn(),
      write: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('compressionMiddleware', () => {
    it('should be a configured compression middleware', () => {
      expect(typeof compressionMiddleware).toBe('function');
    });
  });

  describe('cacheControl', () => {
    it('should set cache headers for images', () => {
      res.getHeader.mockReturnValue('image/jpeg');

      cacheControl(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );
      expect(next).toHaveBeenCalled();
    });

    it('should set cache headers for fonts', () => {
      res.getHeader.mockReturnValue('font/woff2');

      cacheControl(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );
    });

    it('should set cache headers for CSS with hash', () => {
      req.path = '/css/style-abc123.css';
      res.getHeader.mockReturnValue('text/css');

      cacheControl(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );
    });

    it('should set no-cache for HTML', () => {
      res.getHeader.mockReturnValue('text/html');

      cacheControl(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache, no-store, must-revalidate'
      );
    });

    it('should handle conditional requests with ETag', () => {
      req.path = '/js/app-123.js';
      req.headers['if-none-match'] = '"app-123"';
      res.getHeader.mockImplementation(header => {
        if (header === 'Content-Type') return 'application/javascript';
        if (header === 'ETag') return '"app-123"';
        return null;
      });

      cacheControl(req, res, next);

      expect(res.status).toHaveBeenCalledWith(304);
      expect(res.end).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('resourceHints', () => {
    it('should add preconnect hints for HTML', () => {
      res.getHeader.mockReturnValue('text/html');

      resourceHints(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Link', expect.stringContaining('rel=preconnect'));
      expect(next).toHaveBeenCalled();
    });

    it('should add preload hints for critical resources', () => {
      res.getHeader.mockReturnValue('text/html');

      resourceHints(req, res, next);

      const linkCalls = res.setHeader.mock.calls.filter(call => call[0] === 'Link');

      expect(
        linkCalls.some(call => call[1].includes('critical.css') && call[1].includes('rel=preload'))
      ).toBe(true);
    });

    it('should not add hints for non-HTML responses', () => {
      res.getHeader.mockReturnValue('application/json');

      resourceHints(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalledWith('Link', expect.any(String));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('performanceMonitoring', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should add response time header', () => {
      performanceMonitoring(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Response-Time', '0ms');
      expect(next).toHaveBeenCalled();
    });

    it('should measure response time', () => {
      performanceMonitoring(req, res, next);

      // Simulate some processing time
      jest.advanceTimersByTime(150);

      res.statusCode = 200;
      res.end();

      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Response-Time',
        expect.stringMatching(/\d+\.\d+ms/)
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Server-Timing',
        expect.stringMatching(/total;dur=\d+\.\d+/)
      );
    });

    it('should log slow requests', () => {
      // Mock process.hrtime.bigint to simulate slow request
      const originalHrtime = process.hrtime.bigint;
      let callCount = 0;
      process.hrtime.bigint = jest.fn(() => {
        callCount++;
        return BigInt(callCount * 1500000000); // 1.5 seconds
      });

      performanceMonitoring(req, res, next);

      res.statusCode = 200;
      req.get.mockReturnValue('Mozilla/5.0');
      res.end();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Slow request detected',
        expect.objectContaining({
          method: 'GET',
          path: '/test',
          statusCode: 200
        })
      );

      process.hrtime.bigint = originalHrtime;
    });
  });

  describe('imageOptimization', () => {
    it('should redirect to WebP for supported browsers', () => {
      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      req.headers.accept = 'image/webp,image/*';
      req.path = '/images/photo.jpg';

      imageOptimization(req, res, next);

      expect(req.url).toBe('/images/photo.webp');
      expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Accept');
      expect(next).toHaveBeenCalled();

      fs.existsSync.mockRestore();
    });

    it('should not redirect if WebP not supported', () => {
      req.headers.accept = 'image/jpeg,image/*';
      req.path = '/images/photo.jpg';
      const originalUrl = req.url;

      imageOptimization(req, res, next);

      expect(req.url).toBe(originalUrl);
      expect(next).toHaveBeenCalled();
    });

    it('should not redirect if WebP file does not exist', () => {
      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      req.headers.accept = 'image/webp,image/*';
      req.path = '/images/photo.jpg';
      const originalUrl = req.url;

      imageOptimization(req, res, next);

      expect(req.url).toBe(originalUrl);
      expect(next).toHaveBeenCalled();

      fs.existsSync.mockRestore();
    });
  });

  describe('bundleSizeWarning', () => {
    it('should monitor response size', () => {
      bundleSizeWarning(req, res, next);

      res.write('Small content');
      res.end();

      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should warn for large responses', () => {
      bundleSizeWarning(req, res, next);

      // Write large content (>1MB)
      const largeContent = 'x'.repeat(1024 * 1024 + 1);
      res.write(largeContent);
      res.getHeader.mockReturnValue('text/html');
      res.end();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Large response size',
        expect.objectContaining({
          path: '/test',
          size: expect.stringMatching(/\d+\.\d+MB/)
        })
      );
    });

    it('should handle chunked responses', () => {
      bundleSizeWarning(req, res, next);

      res.write('Part 1');
      res.write('Part 2');
      res.end('Part 3');

      expect(next).toHaveBeenCalled();
    });
  });

  describe('criticalCssInlining', () => {
    it('should inline critical CSS for HTML responses', async () => {
      const fs = require('fs').promises;
      const mockCriticalCss = 'body { margin: 0; }';
      jest.spyOn(fs, 'readFile').mockResolvedValue(mockCriticalCss);

      req.path = '/index.html';

      await criticalCssInlining(req, res, next);

      const htmlContent = '<html><head></head><body></body></html>';
      res.send(htmlContent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining(`<style id="critical-css">${mockCriticalCss}</style>`)
      );

      fs.readFile.mockRestore();
    });

    it('should handle missing critical CSS file', async () => {
      const fs = require('fs').promises;
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));

      req.path = '/';

      await criticalCssInlining(req, res, next);

      const htmlContent = '<html><head></head><body></body></html>';
      res.send(htmlContent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.send).toHaveBeenCalledWith(htmlContent);

      fs.readFile.mockRestore();
    });

    it('should skip non-HTML responses', async () => {
      req.path = '/api/data';

      await criticalCssInlining(req, res, next);

      expect(next).toHaveBeenCalled();

      const jsonData = { test: 'data' };
      res.send(jsonData);

      expect(res.send).toHaveBeenCalledWith(jsonData);
    });
  });
});
