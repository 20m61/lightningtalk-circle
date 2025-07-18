/**
 * Jest Setup File
 * Configures the test environment for mixed CommonJS/ES modules
 */

const { TextEncoder, TextDecoder } = require('util');

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SESSION_SECRET = 'test-session-secret';

// Mock global modules that cause import issues
jest.mock('jsonwebtoken', () => ({
  default: {
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
  }
}));

jest.mock('bcryptjs', () => ({
  default: {
    genSalt: jest.fn(async rounds => 'mock-salt'),
    hash: jest.fn(async (password, salt) => `hashed-${password}`),
    compare: jest.fn(async (password, hash) => password === 'correct-password')
  }
}));

// Suppress console output during tests unless explicitly needed
if (process.env.SHOW_TEST_LOGS !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
}
