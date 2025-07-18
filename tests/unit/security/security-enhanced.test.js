/**
 * Enhanced Security Middleware Tests
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Mock modules
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
  createLogger: jest.fn(() => mockLogger)
}));
const securityModule = await import('../../../server/middleware/security-enhanced');
const {
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
} = securityModule.default || securityModule;

describe('Enhanced Security Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      secure: false,
      get: jest.fn(),
      path: '/api/test',
      method: 'GET',
      ip: '192.168.1.1',
      body: {},
      user: null,
      token: null,
      connection: { remoteAddress: '192.168.1.1' }
    };

    res = {
      redirect: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };

    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('enforceHTTPS', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should redirect to HTTPS in production when not secure', () => {
      process.env.NODE_ENV = 'production';
      req.get.mockImplementation(header => {
        if (header === 'host') return 'example.com';
        if (header === 'x-forwarded-proto') return 'http';
        return null;
      });
      req.url = '/test';

      enforceHTTPS(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/test');
      expect(next).not.toHaveBeenCalled();
    });

    it('should not redirect in development', () => {
      process.env.NODE_ENV = 'development';

      enforceHTTPS(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not redirect when already HTTPS', () => {
      process.env.NODE_ENV = 'production';
      req.secure = true;

      enforceHTTPS(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not redirect when x-forwarded-proto is https', () => {
      process.env.NODE_ENV = 'production';
      req.get.mockImplementation(header => {
        if (header === 'x-forwarded-proto') return 'https';
        return null;
      });

      enforceHTTPS(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('enhancedSecurityHeaders', () => {
    it('should set security headers', () => {
      enhancedSecurityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      expect(res.setHeader).toHaveBeenCalledWith('X-Permitted-Cross-Domain-Policies', 'none');
      expect(res.setHeader).toHaveBeenCalledWith('X-Download-Options', 'noopen');
      expect(res.setHeader).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off');
      expect(next).toHaveBeenCalled();
    });

    it('should set cache headers for admin paths', () => {
      req.path = '/admin/dashboard';

      enhancedSecurityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      expect(res.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Expires', '0');
    });

    it('should set cache headers for auth paths', () => {
      req.path = '/api/auth/login';

      enhancedSecurityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    });
  });

  describe('verifyRequestSignature', () => {
    const secret = 'test-secret-key';
    const middleware = verifyRequestSignature(secret);

    it('should verify valid request signature', () => {
      const timestamp = Date.now().toString();
      const payload = `${req.method}:${req.path}:${timestamp}:${JSON.stringify(req.body)}`;
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      req.get.mockImplementation(header => {
        if (header === 'X-Request-Signature') return signature;
        if (header === 'X-Request-Timestamp') return timestamp;
        return null;
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing signature', () => {
      req.get.mockReturnValue(null);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing request signature' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired timestamp', () => {
      const oldTimestamp = (Date.now() - 400000).toString(); // 6 minutes ago
      req.get.mockImplementation(header => {
        if (header === 'X-Request-Signature') return 'some-signature';
        if (header === 'X-Request-Timestamp') return oldTimestamp;
        return null;
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Request expired' });
    });

    it('should reject invalid signature', () => {
      const timestamp = Date.now().toString();
      req.get.mockImplementation(header => {
        if (header === 'X-Request-Signature') return 'invalid-signature';
        if (header === 'X-Request-Timestamp') return timestamp;
        return null;
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request signature' });
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('configureCookieOptions', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return production cookie options', () => {
      process.env.NODE_ENV = 'production';

      const options = configureCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        signed: true
      });
    });

    it('should return development cookie options', () => {
      process.env.NODE_ENV = 'development';

      const options = configureCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        signed: true
      });
    });
  });

  describe('tokenRotation', () => {
    let tokenService;
    let middleware;

    beforeEach(() => {
      tokenService = {
        generateToken: jest.fn()
      };
      middleware = tokenRotation(tokenService);
    });

    it('should skip if no user or token', async () => {
      await middleware(req, res, next);

      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should refresh token when close to expiration', async () => {
      const newToken = 'new-jwt-token';
      tokenService.generateToken.mockResolvedValue(newToken);

      req.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'user',
        exp: Math.floor((Date.now() + 240000) / 1000) // 4 minutes from now
      };
      req.token = 'old-token';

      await middleware(req, res, next);

      expect(tokenService.generateToken).toHaveBeenCalledWith({
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      });
      expect(res.setHeader).toHaveBeenCalledWith('X-New-Token', newToken);
      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Refreshed', 'true');
      expect(next).toHaveBeenCalled();
    });

    it('should not refresh token if not close to expiration', async () => {
      req.user = {
        userId: '123',
        exp: Math.floor((Date.now() + 3600000) / 1000) // 1 hour from now
      };
      req.token = 'valid-token';

      await middleware(req, res, next);

      expect(tokenService.generateToken).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle token refresh errors', async () => {
      tokenService.generateToken.mockRejectedValue(new Error('Token generation failed'));

      req.user = {
        userId: '123',
        exp: Math.floor((Date.now() + 240000) / 1000)
      };
      req.token = 'old-token';

      await middleware(req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('SecurityMonitor', () => {
    let monitor;

    beforeEach(() => {
      monitor = new SecurityMonitor();
    });

    it('should record security events', () => {
      monitor.recordEvent('failedLogins', '192.168.1.1', { username: 'test' });

      const key = 'failedLogins:192.168.1.1';
      expect(monitor.events.has(key)).toBe(true);
      expect(monitor.events.get(key).length).toBe(1);
    });

    it('should detect threshold exceeded', () => {
      // Record 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        monitor.recordEvent('failedLogins', '192.168.1.1', { attempt: i });
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Security threshold exceeded',
        expect.objectContaining({
          eventType: 'failedLogins',
          identifier: '192.168.1.1',
          count: 5
        })
      );
    });

    it('should clean old events', () => {
      // Add old event
      const oldTimestamp = Date.now() - 400000; // 6+ minutes ago
      monitor.events.set('failedLogins:192.168.1.1', [{ timestamp: oldTimestamp }]);

      // Add new event
      monitor.recordEvent('failedLogins', '192.168.1.1');

      const events = monitor.events.get('failedLogins:192.168.1.1');
      expect(events.length).toBe(1);
      expect(events[0].timestamp).toBeGreaterThan(oldTimestamp);
    });

    it('should provide middleware', () => {
      const middleware = monitor.middleware();

      middleware(req, res, next);

      expect(req.securityMonitor).toBe(monitor);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateContentType', () => {
    it('should allow valid content type', () => {
      const middleware = validateContentType(['application/json']);
      req.method = 'POST';
      req.get.mockReturnValue('application/json');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing content type on POST', () => {
      const middleware = validateContentType();
      req.method = 'POST';
      req.get.mockReturnValue(null);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Content-Type header is required' });
    });

    it('should reject unsupported content type', () => {
      const middleware = validateContentType(['application/json']);
      req.method = 'PUT';
      req.get.mockReturnValue('text/plain');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unsupported Media Type' });
    });

    it('should skip validation for GET requests', () => {
      const middleware = validateContentType();
      req.method = 'GET';

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow multiple content types', () => {
      const middleware = validateContentType(['application/json', 'application/xml']);
      req.method = 'POST';
      req.get.mockReturnValue('application/xml');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('IPAccessControl', () => {
    it('should allow IP in whitelist mode', () => {
      const control = new IPAccessControl({
        mode: 'whitelist',
        whitelist: ['192.168.1.1', '192.168.1.2']
      });
      const middleware = control.middleware();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block IP not in whitelist', () => {
      const control = new IPAccessControl({
        mode: 'whitelist',
        whitelist: ['192.168.1.2']
      });
      const middleware = control.middleware();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should block IP in blacklist', () => {
      const control = new IPAccessControl({
        mode: 'blacklist',
        blacklist: ['192.168.1.1']
      });
      const middleware = control.middleware();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should allow IP not in blacklist', () => {
      const control = new IPAccessControl({
        mode: 'blacklist',
        blacklist: ['192.168.1.2']
      });
      const middleware = control.middleware();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should support dynamic list management', () => {
      const control = new IPAccessControl();

      control.addToBlacklist('192.168.1.1');
      expect(control.blacklist.has('192.168.1.1')).toBe(true);

      control.removeFromBlacklist('192.168.1.1');
      expect(control.blacklist.has('192.168.1.1')).toBe(false);
    });
  });

  describe('apiKeyAuth', () => {
    it('should authenticate valid API key from header', () => {
      const middleware = apiKeyAuth(['valid-key-1', 'valid-key-2']);
      req.get.mockReturnValue('valid-key-1');

      middleware(req, res, next);

      expect(req.apiKey).toBe('valid-key-1');
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate valid API key from query', () => {
      const middleware = apiKeyAuth(['valid-key-1']);
      req.get.mockReturnValue(null);
      req.query = { apiKey: 'valid-key-1' };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing API key', () => {
      const middleware = apiKeyAuth(['valid-key-1']);
      req.get.mockReturnValue(null);
      req.query = {};

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'API key required' });
    });

    it('should reject invalid API key', () => {
      const middleware = apiKeyAuth(['valid-key-1']);
      req.get.mockReturnValue('invalid-key');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid API key' });
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('auditLogger', () => {
    it('should log security audit on response', done => {
      const middleware = auditLogger('user-login');
      req.user = { userId: '123' };
      req.get.mockReturnValue('Mozilla/5.0');

      middleware(req, res, next);

      res.statusCode = 200;
      res.end();

      setTimeout(() => {
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Security audit',
          expect.objectContaining({
            action: 'user-login',
            method: 'GET',
            path: '/api/test',
            ip: '192.168.1.1',
            userId: '123',
            statusCode: 200,
            userAgent: 'Mozilla/5.0'
          })
        );
        done();
      }, 10);
    });

    it('should handle missing user info', done => {
      const middleware = auditLogger('public-access');

      middleware(req, res, next);

      res.statusCode = 200;
      res.end();

      setTimeout(() => {
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Security audit',
          expect.objectContaining({
            action: 'public-access',
            userId: undefined
          })
        );
        done();
      }, 10);
    });
  });
});
