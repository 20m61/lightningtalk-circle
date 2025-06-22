/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  
  // カバレッジ設定
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.js',
    'scripts/**/*.js',
    '!server/app.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  
  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './server/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // テストファイルパターン
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // テストタイムアウト
  testTimeout: 10000,
  
  // レポーター設定
  reporters: [
    'default'
  ],
  
  // 並列実行設定
  maxWorkers: '50%',
  
  // 詳細出力
  verbose: true,
  
  // キャッシュディレクトリ
  cacheDirectory: '<rootDir>/.jest-cache'
};