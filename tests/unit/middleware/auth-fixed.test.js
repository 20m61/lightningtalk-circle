/**
 * Fixed Authentication Middleware Tests
 * Using proper ES module mocking approach
 */

import { jest } from '@jest/globals';

// Mock modules before importing
const mockJWT = {
  sign: jest.fn((payload, secret, options) => 'mock-jwt-token'),
  verify: jest.fn((token, secret, callback) => {
    if (token === 'valid-token') {
      callback(null, { id: 'user-123', email: 'test@example.com', role: 'user' });
    } else if (token === 'expired-token') {
      callback(new Error('TokenExpiredError'));
    } else {
      callback(new Error('JsonWebTokenError'));
    }
  })
};

const mockBcrypt = {
  genSalt: jest.fn(async rounds => 'mock-salt'),
  hash: jest.fn(async (password, salt) => `hashed-${password}`),
  compare: jest.fn(async (password, hash) => password === 'correct-password')
};

// Mock the modules
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJWT
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt
}));

// Now import the middleware
const { validatePassword } = await import('../../../server/middleware/auth.js');

describe('Authentication Middleware - Fixed Tests', () => {
  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject weak password', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('NoNumber!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return both valid and errors properties', () => {
      const result = validatePassword('weak');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('message');
    });
  });
});
