/**
 * Google OAuth Authentication Tests
 */

import { jest } from '@jest/globals';

describe('Google OAuth Authentication', () => {
  let req, res, router;
  let mockDatabase;
  let mockVerifyCognitoToken;
  let mockSyncCognitoUser;

  beforeEach(async () => {
    // Reset modules
    jest.resetModules();

    // Mock database
    mockDatabase = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn()
    };

    // Mock Cognito auth functions
    mockVerifyCognitoToken = jest.fn();
    mockSyncCognitoUser = jest.fn();

    // Mock cognito-auth module
    jest.unstable_mockModule('../../../server/middleware/cognito-auth.js', () => ({
      verifyCognitoToken: mockVerifyCognitoToken,
      syncCognitoUser: mockSyncCognitoUser
    }));

    // Mock JWT
    jest.unstable_mockModule('jsonwebtoken', () => ({
      default: {
        sign: jest.fn(() => 'mock-jwt-token'),
        verify: jest.fn(token => {
          if (token === 'valid-refresh-token') {
            return { id: 'user-123' };
          }
          throw new Error('Invalid token');
        })
      }
    }));

    // Import router after mocks
    const authModule = await import('../../../server/routes/auth.js');
    router = authModule.default;

    // Setup request and response
    req = {
      app: { locals: { database: mockDatabase } },
      body: {},
      params: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  describe('POST /api/auth/google', () => {
    const findRoute = path => {
      return router.stack.find(layer => layer.route && layer.route.path === path && layer.route.methods.post);
    };

    it('should authenticate valid Google token and create new user', async () => {
      const cognitoUser = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      };

      const syncedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        provider: 'google'
      };

      mockVerifyCognitoToken.mockResolvedValue(cognitoUser);
      mockSyncCognitoUser.mockResolvedValue(syncedUser);

      req.body = { idToken: 'valid-cognito-token' };

      // Find and execute the route handler
      const route = findRoute('/google');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(mockVerifyCognitoToken).toHaveBeenCalledWith('valid-cognito-token');
      expect(mockSyncCognitoUser).toHaveBeenCalledWith(cognitoUser, mockDatabase);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: syncedUser
      });
    });

    it('should handle invalid token', async () => {
      mockVerifyCognitoToken.mockRejectedValue(new Error('Invalid token'));

      req.body = { idToken: 'invalid-token' };

      const route = findRoute('/google');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Google認証に失敗しました'
      });
    });

    it('should handle missing configuration', async () => {
      mockVerifyCognitoToken.mockRejectedValue(new Error('User Pool ID not configured'));

      req.body = { idToken: 'valid-token' };

      const route = findRoute('/google');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Configuration error',
        message: 'Google認証が設定されていません'
      });
    });

    it('should handle expired token', async () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      mockVerifyCognitoToken.mockRejectedValue(error);

      req.body = { idToken: 'expired-token' };

      const route = findRoute('/google');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired',
        message: '認証トークンの有効期限が切れています'
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    const findRoute = path => {
      return router.stack.find(layer => layer.route && layer.route.path === path && layer.route.methods.post);
    };

    it('should refresh valid token', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };

      mockDatabase.findById.mockResolvedValue(user);
      req.body = { refreshToken: 'valid-refresh-token' };

      const route = findRoute('/refresh');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(mockDatabase.findById).toHaveBeenCalledWith('users', 'user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token'
      });
    });

    it('should handle invalid refresh token', async () => {
      req.body = { refreshToken: 'invalid-refresh-token' };

      const route = findRoute('/refresh');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid refresh token',
        message: '無効なリフレッシュトークンです'
      });
    });

    it('should handle user not found', async () => {
      mockDatabase.findById.mockResolvedValue(null);
      req.body = { refreshToken: 'valid-refresh-token' };

      const route = findRoute('/refresh');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found',
        message: 'ユーザーが見つかりません'
      });
    });
  });

  describe('PUT /api/auth/users/:id', () => {
    const findRoute = path => {
      return router.stack.find(layer => layer.route && layer.route.path === path && layer.route.methods.put);
    };

    beforeEach(() => {
      // Mock authenticated admin user
      req.user = { id: 'admin-123', role: 'admin' };
    });

    it('should update user successfully', async () => {
      const updatedUser = {
        id: 'user-456',
        email: 'user@example.com',
        name: 'Updated Name',
        role: 'admin',
        provider: 'email'
      };

      mockDatabase.update.mockResolvedValue(updatedUser);

      req.params = { id: 'user-456' };
      req.body = { name: 'Updated Name', role: 'admin' };

      const route = findRoute('/users/:id');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(mockDatabase.update).toHaveBeenCalledWith('users', 'user-456', {
        name: 'Updated Name',
        role: 'admin'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: expect.objectContaining({
          id: 'user-456',
          name: 'Updated Name',
          role: 'admin'
        })
      });
    });

    it('should prevent self-demotion', async () => {
      req.params = { id: 'admin-123' };
      req.body = { role: 'user' };

      const route = findRoute('/users/:id');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cannot demote yourself',
        message: '自分の権限を降格することはできません'
      });
      expect(mockDatabase.update).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      mockDatabase.update.mockResolvedValue(null);

      req.params = { id: 'non-existent' };
      req.body = { name: 'New Name' };

      const route = findRoute('/users/:id');
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found',
        message: 'ユーザーが見つかりません'
      });
    });
  });
});
