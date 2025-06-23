// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  testMatch: ['**/tests/**/*.test.js', '!**/tests/e2e/**', '!**/tests/accessibility/**']
};
