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