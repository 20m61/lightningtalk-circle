// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: { node: 'current' },
              modules: false
            }
          ]
        ],
        plugins: ['@babel/plugin-syntax-import-meta']
      }
    ]
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  testMatch: ['**/tests/unit/*.test.js', '**/tests/integration/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/accessibility/',
    '/tests/unit/quality-gates',
    '/tests/unit/services/database',
    '/tests/integration/notifications.test.js',
    '/tests/integration/multiEvents.test.js'
  ],
  transformIgnorePatterns: ['/node_modules/(?!(chai)/)'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/app.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  }
};
