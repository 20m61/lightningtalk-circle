/**
 * Authentication Middleware Tests (Fixed for ES Modules)
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Mock JWT and bcrypt
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

// Import after mocks
const authModule = await import('../../../server/middleware/auth.js');
const { authenticateToken, generateToken, hashPassword, comparePassword } = authModule;

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authenticateToken', () => {
    it('should accept valid token', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      jwt.verify = jest.fn().mockReturnValue(mockUser);

      const req = { 
        headers: { authorization: 'Bearer valid-token' },
        header: jest.fn().mockReturnValue('Bearer valid-token')
      };
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn() 
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing token', () => {
      const req = { headers: {}, header: jest.fn().mockReturnValue(null) };
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn() 
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No token provided',
        message: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle invalid token', () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = { 
        headers: { authorization: 'Bearer invalid-token' },
        header: jest.fn().mockReturnValue('Bearer invalid-token')
      };
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn() 
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate token with default expiry', () => {
      const payload = { id: 'user-123', email: 'test@example.com' };
      const mockToken = 'generated-token';
      jwt.sign = jest.fn().mockReturnValue(mockToken);

      const token = generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(token).toBe(mockToken);
    });

    it('should generate token with custom expiry', () => {
      const payload = { id: 'user-123' };
      const mockToken = 'generated-token';
      jwt.sign = jest.fn().mockReturnValue(mockToken);

      const token = generateToken(payload, '7d');

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(token).toBe(mockToken);
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'mySecurePassword123';
      const mockHash = 'hashed-password';
      bcrypt.hash = jest.fn().mockResolvedValue(mockHash);

      const hash = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(hash).toBe(mockHash);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await comparePassword('password', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const result = await comparePassword('wrong', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hash');
      expect(result).toBe(false);
    });
  });
});