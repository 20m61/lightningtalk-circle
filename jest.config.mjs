// jest.config.mjs
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      { 
        presets: [
          ['@babel/preset-env', { 
            targets: { node: 'current' },
            modules: 'commonjs'
          }]
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
    '/tests/unit/auto-workflow',
    '/tests/unit/quality-gates',
    '/tests/unit/services/database'
  ],
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/app.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  }
};
