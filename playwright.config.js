import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './tests/e2e',

  // 並列実行設定
  fullyParallel: true,

  // CI環境での設定
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],

  // グローバル設定
  use: {
    // ベースURL
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    // トレース設定
    trace: 'on-first-retry',

    // スクリーンショット設定
    screenshot: 'only-on-failure',

    // ビデオ設定
    video: 'retain-on-failure',

    // ヘッドレス設定
    headless: process.env.CI ? true : false,

    // タイムアウト設定
    actionTimeout: 10000,
    navigationTimeout: 30000
  },

  // プロジェクト設定（ブラウザ別）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },

    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  // Webサーバー設定
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000
      },

  // テストタイムアウト設定
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000
  },

  // グローバルセットアップ/ティアダウン
  globalSetup: './tests/e2e/global-setup.js',
  globalTeardown: './tests/e2e/global-teardown.js',

  // 出力ディレクトリ
  outputDir: 'test-results/'
});
