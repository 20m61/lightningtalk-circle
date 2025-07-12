/**
 * Cognito Authentication Middleware Tests
 */

import { jest } from '@jest/globals';

describe('Cognito Authentication Middleware', () => {
  let cognitoAuth;
  let mockJWT;
  let mockJwkToPem;
  let mockAxios;
  let mockDatabase;
  let req, res, next;

  beforeEach(async () => {
    // Reset modules
    jest.resetModules();

    // Mock JWT
    mockJWT = {
      decode: jest.fn(),
      verify: jest.fn()
    };
    jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJWT }));

    // Mock jwk-to-pem
    mockJwkToPem = jest.fn(() => 'mock-pem-key');
    jest.unstable_mockModule('jwk-to-pem', () => ({ default: mockJwkToPem }));

    // Mock axios
    mockAxios = {
      get: jest.fn()
    };
    jest.unstable_mockModule('axios', () => ({ default: mockAxios }));

    // Mock auth middleware (which cognito-auth imports)
    jest.unstable_mockModule('../../../server/middleware/auth.js', () => ({
      hashPassword: jest.fn(password => `hashed-${password}`)
    }));

    // Mock logger
    jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }
    }));

    // Set environment variables
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.USER_POOL_ID = 'test-user-pool-id';
    process.env.USER_POOL_CLIENT_ID = 'test-client-id';

    // Import module after mocks
    cognitoAuth = await import('../../../server/middleware/cognito-auth.js');

    // Setup mock database
    mockDatabase = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };

    // Setup request and response
    req = {
      app: { locals: { database: mockDatabase } },
      headers: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.AWS_REGION;
    delete process.env.USER_POOL_ID;
    delete process.env.USER_POOL_CLIENT_ID;
  });

  describe('verifyCognitoToken', () => {
    it('should verify valid token', async () => {
      const mockJWKS = {
        keys: [
          {
            kid: 'test-key-id',
            kty: 'RSA',
            n: 'test-n',
            e: 'AQAB'
          }
        ]
      };

      const mockDecodedToken = {
        header: { kid: 'test-key-id' },
        payload: {
          sub: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      mockAxios.get.mockResolvedValue({ data: mockJWKS });
      mockJWT.decode.mockReturnValue(mockDecodedToken);
      mockJWT.verify.mockReturnValue(mockDecodedToken.payload);

      const result = await cognitoAuth.verifyCognitoToken('valid-token');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://cognito-idp.ap-northeast-1.amazonaws.com/test-user-pool-id/.well-known/jwks.json'
      );
      expect(mockJwkToPem).toHaveBeenCalledWith(mockJWKS.keys[0]);
      expect(mockJWT.verify).toHaveBeenCalledWith('valid-token', 'mock-pem-key', {
        algorithms: ['RS256'],
        issuer: 'https://cognito-idp.ap-northeast-1.amazonaws.com/test-user-pool-id',
        audience: 'test-client-id'
      });
      expect(result).toEqual(mockDecodedToken.payload);
    });

    it('should throw error for invalid token format', async () => {
      mockJWT.decode.mockReturnValue(null);

      await expect(cognitoAuth.verifyCognitoToken('invalid-token')).rejects.toThrow(
        'Invalid token format'
      );
    });

    it('should throw error when signing key not found', async () => {
      const mockJWKS = {
        keys: [
          {
            kid: 'different-key-id',
            kty: 'RSA'
          }
        ]
      };

      mockAxios.get.mockResolvedValue({ data: mockJWKS });
      mockJWT.decode.mockReturnValue({
        header: { kid: 'test-key-id' }
      });

      await expect(cognitoAuth.verifyCognitoToken('token')).rejects.toThrow(
        'Signing key not found'
      );
    });

    it('should cache JWKS for subsequent requests', async () => {
      const mockJWKS = {
        keys: [
          {
            kid: 'test-key-id',
            kty: 'RSA'
          }
        ]
      };

      mockAxios.get.mockResolvedValue({ data: mockJWKS });
      mockJWT.decode.mockReturnValue({
        header: { kid: 'test-key-id' }
      });
      mockJWT.verify.mockReturnValue({ sub: 'user-123' });

      // First call
      await cognitoAuth.verifyCognitoToken('token1');
      expect(mockAxios.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await cognitoAuth.verifyCognitoToken('token2');
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncCognitoUser', () => {
    const cognitoUser = {
      sub: 'cognito-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    };

    it('should create new user if not exists', async () => {
      mockDatabase.findOne.mockResolvedValue(null);
      mockDatabase.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'test@example.com',
        name: 'Test User',
        cognitoId: 'cognito-123',
        password: 'hashed-password'
      });

      const result = await cognitoAuth.syncCognitoUser(cognitoUser, mockDatabase);

      expect(mockDatabase.findOne).toHaveBeenCalledTimes(2);
      expect(mockDatabase.findOne).toHaveBeenCalledWith('users', { cognitoId: 'cognito-123' });
      expect(mockDatabase.findOne).toHaveBeenCalledWith('users', { email: 'test@example.com' });

      expect(mockDatabase.create).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({
          cognitoId: 'cognito-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          profileImage: 'https://example.com/avatar.jpg',
          provider: 'google'
        })
      );

      expect(result).not.toHaveProperty('password');
    });

    it('should update existing user with Cognito ID', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'test@example.com',
        name: 'Old Name',
        password: 'hashed-password'
      };

      mockDatabase.findOne
        .mockResolvedValueOnce(null) // No user with cognitoId
        .mockResolvedValueOnce(existingUser); // User found by email

      await cognitoAuth.syncCognitoUser(cognitoUser, mockDatabase);

      expect(mockDatabase.update).toHaveBeenCalledWith('users', 'existing-user-id', {
        cognitoId: 'cognito-123',
        profileImage: 'https://example.com/avatar.jpg',
        lastLogin: expect.any(String)
      });
    });

    it('should update last login for existing Cognito user', async () => {
      const existingUser = {
        id: 'existing-user-id',
        cognitoId: 'cognito-123',
        email: 'test@example.com',
        password: 'hashed-password'
      };

      mockDatabase.findOne.mockResolvedValue(existingUser);

      await cognitoAuth.syncCognitoUser(cognitoUser, mockDatabase);

      expect(mockDatabase.update).toHaveBeenCalledWith('users', 'existing-user-id', {
        lastLogin: expect.any(String),
        profileImage: 'https://example.com/avatar.jpg'
      });
    });
  });

  describe('authenticateCognitoToken middleware', () => {
    it('should authenticate valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };

      req.headers.authorization = 'Bearer valid-token';

      // Mock verifyCognitoToken
      const cognitoUser = {
        sub: 'cognito-123',
        email: 'test@example.com'
      };

      // We need to mock the actual function calls since we can't easily mock the imports inside the middleware
      const originalVerify = cognitoAuth.verifyCognitoToken;
      const originalSync = cognitoAuth.syncCognitoUser;

      cognitoAuth.verifyCognitoToken = jest.fn().mockResolvedValue(cognitoUser);
      cognitoAuth.syncCognitoUser = jest.fn().mockResolvedValue(mockUser);

      await cognitoAuth.authenticateCognitoToken(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.cognitoUser).toEqual(cognitoUser);
      expect(next).toHaveBeenCalled();

      // Restore original functions
      cognitoAuth.verifyCognitoToken = originalVerify;
      cognitoAuth.syncCognitoUser = originalSync;
    });

    it('should reject request without token', async () => {
      await cognitoAuth.authenticateCognitoToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No token provided',
        message: '認証トークンが必要です'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      const originalVerify = cognitoAuth.verifyCognitoToken;
      cognitoAuth.verifyCognitoToken = jest.fn().mockRejectedValue(new Error('Invalid token'));

      await cognitoAuth.authenticateCognitoToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: '無効な認証トークンです'
      });
      expect(next).not.toHaveBeenCalled();

      cognitoAuth.verifyCognitoToken = originalVerify;
    });
  });
});
