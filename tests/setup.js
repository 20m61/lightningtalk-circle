/**
 * Jest テスト環境のセットアップファイル
 */

const fs = require('fs-extra');
const path = require('path');

// テスト環境変数の設定
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.GITHUB_TOKEN = 'test-token';
process.env.GITHUB_OWNER = 'test-owner';
process.env.GITHUB_REPO = 'test-repo';

// グローバルタイムアウト設定
jest.setTimeout(10000);

// グローバルセットアップ
beforeAll(async () => {
  // テスト用データディレクトリの作成
  const testDataDir = path.join(process.cwd(), 'tests', 'data');
  await fs.ensureDir(testDataDir);
  
  console.log('🧪 Test environment setup completed');
});

// 各テスト後のクリーンアップ
afterEach(() => {
  // モックのクリア
  jest.clearAllMocks();
});

// 全テスト後のクリーンアップ
afterAll(async () => {
  // テスト用ファイルのクリーンアップ
  const testDataDir = path.join(process.cwd(), 'tests', 'data');
  if (await fs.pathExists(testDataDir)) {
    await fs.remove(testDataDir);
  }
  
  console.log('🧹 Test environment cleanup completed');
});

// グローバルモック設定
global.mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// console.log をモック化（必要に応じて）
if (process.env.SILENCE_CONSOLE === 'true') {
  global.console = global.mockConsole;
}

// カスタムマッチャーの追加
expect.extend({
  toBeValidIssue(received) {
    const pass = received &&
                 typeof received.title === 'string' &&
                 received.title.length > 0 &&
                 Array.isArray(received.labels) &&
                 received.labels.length > 0;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid issue`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid issue with title and labels`,
        pass: false,
      };
    }
  },
  
  toHaveGitHubIssueStructure(received) {
    const requiredFields = ['number', 'title', 'state', 'html_url'];
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));
    
    if (hasAllFields) {
      return {
        message: () => `expected ${received} not to have GitHub issue structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have GitHub issue structure with fields: ${requiredFields.join(', ')}`,
        pass: false,
      };
    }
  }
});