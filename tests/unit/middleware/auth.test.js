/**
 * Authentication Middleware Tests
 */

import { jest } from '@jest/globals';

// Mock jsonwebtoken
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn((payload, secret, options) => 'mock-token'),
    verify: jest.fn((token, secret, callback) => {
      // Execute callback synchronously
      if (token === 'valid-token') {
        callback(null, { id: 'user-123', email: 'test@example.com', role: 'user' });
      } else if (token === 'expired-token') {
        callback(new Error('TokenExpiredError'));
      } else {
        callback(new Error('JsonWebTokenError'));
      }
    })
  }
}));

// Mock bcryptjs
jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    genSalt: jest.fn(async rounds => 'mock-salt'),
    hash: jest.fn(async (password, salt) => `hashed-${password}`),
    compare: jest.fn(async (password, hash) => password === 'correct-password')
  }
}));

const { authenticateToken, requireAdmin, generateToken, hashPassword, comparePassword, validatePassword } =
  await import('../../../server/middleware/auth.js');

describe('Authentication Middleware', () => {
  describe('authenticateToken', () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should reject request without token', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: '認証が必要です'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization header', () => {
      req.headers.authorization = 'InvalidFormat';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid token', () => {
      req.headers.authorization = 'Bearer valid-token';

      authenticateToken(req, res, next);

      expect(req.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      req.headers.authorization = 'Bearer expired-token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
        message: 'トークンが無効または期限切れです'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should reject request without user', () => {
      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        message: '管理者権限が必要です'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-admin user', () => {
      req.user = { id: 'user-123', role: 'user' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin user', () => {
      req.user = { id: 'admin-123', role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject moderator user', () => {
      req.user = { id: 'mod-123', role: 'moderator' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        message: '管理者権限が必要です'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate token with default expiry', () => {
      const payload = { id: 'user-123', email: 'test@example.com' };
      const token = generateToken(payload);

      expect(token).toBe('mock-token');
    });

    it('should generate token with custom expiry', () => {
      const payload = { id: 'user-123' };
      const token = generateToken(payload, '7d');

      expect(token).toBe('mock-token');
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      expect(hash).toBe('hashed-mySecurePassword123');
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');

      expect(hash).toBe('hashed-');
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const result = await comparePassword('correct-password', 'any-hash');

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const result = await comparePassword('wrong-password', 'any-hash');

      expect(result).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      const result = validatePassword('MyStr0ng!Pass');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject short password', () => {
      const result = validatePassword('Short1!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('mypassword123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('MYPASSWORD123!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('MyPassword!');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('MyPassword123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject password with all criteria missing', () => {
      const result = validatePassword('pass');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });
});
