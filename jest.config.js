/**
 * Jest Configuration
 * For ES modules support with manual mocks
 */

export default {
  testEnvironment: 'jsdom',
  transform: {},
  setupFiles: ['<rootDir>/tests/setup/setImmediate-polyfill.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testMatch: [
    '**/tests/unit/*.test.js',
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/accessibility/',
    '/tests/unit/quality-gates',
    '/tests/unit/services/database',
    '/tests/unit/cdk/',
    '/tests/integration/notifications.test.js',
    '/tests/integration/multiEvents.test.js',
    '/cdk/cdk.out/'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['server/**/*.js', '!server/app.js', '!**/node_modules/**', '!**/tests/**', '!**/coverage/**'],
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 75,
      statements: 75
    }
  },
  testTimeout: 10000,
  detectOpenHandles: true,
  forceExit: true,
  // Manual mocks directory
  moduleDirectories: ['node_modules', '<rootDir>/tests/__mocks__'],
  // Clear and reset mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
