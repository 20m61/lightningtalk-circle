/**
 * Jest Setup File
 * Configures the test environment for mixed CommonJS/ES modules
 */

const { TextEncoder, TextDecoder } = require('util');

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM APIs
const mockComputedStyle = {
  getPropertyValue: jest.fn(prop => {
    // Mock common CSS properties used in tests
    const mockValues = {
      'background-color': '#22c55e',
      'min-height': '44px',
      '--color-primary-500': '#22c55e',
      '--spacing-md': '16px',
      '--font-size-lg': '1.125rem',
      display: 'block',
      position: 'relative',
      opacity: '1',
      transform: 'none'
    };
    return mockValues[prop] || '';
  }),
  // Mock other CSS style properties that might be accessed directly
  backgroundColor: '#22c55e',
  minHeight: '44px',
  display: 'block',
  position: 'relative',
  opacity: '1',
  transform: 'none'
};

// Override getComputedStyle in jsdom environment
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => mockComputedStyle),
  writable: true,
  configurable: true
});

// Also set global version for direct imports
global.getComputedStyle = window.getComputedStyle;

// Mock DOM methods commonly used in tests
if (typeof document !== 'undefined') {
  document.createRange = jest.fn(() => ({
    setStart: jest.fn(),
    setEnd: jest.fn(),
    commonAncestorContainer: document.createElement('div')
  }));
}

// Mock window.getSelection
if (typeof window !== 'undefined') {
  window.getSelection = jest.fn(() => ({
    removeAllRanges: jest.fn(),
    addRange: jest.fn()
  }));
}

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  readyState: 1, // OPEN
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

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

// Custom matchers for GitHub API tests
expect.extend({
  toHaveGitHubIssueStructure(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      typeof received.number === 'number' &&
      typeof received.title === 'string' &&
      typeof received.state === 'string' &&
      ['open', 'closed'].includes(received.state) &&
      (received.body === null || typeof received.body === 'string') &&
      received.user &&
      typeof received.user.login === 'string' &&
      Array.isArray(received.labels) &&
      Array.isArray(received.assignees);

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have GitHub issue structure`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have GitHub issue structure`,
        pass: false
      };
    }
  }
});
