import { jest } from '@jest/globals';
/**
 * Jest テスト環境のセットアップファイル
 */

import fs from 'fs-extra';
import path from 'path';

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
    const requiredFields = [
      'id',
      'title',
      'body',
      'state',
      'created_at',
      'updated_at',
      'user',
      'labels',
      'assignees',
      'comments',
      'number'
    ];
    const hasAllFields = requiredFields.every(field =>
      Object.prototype.hasOwnProperty.call(received, field)
    );
    if (hasAllFields) {
      return {
        pass: true,
        message: () => 'Issue object has all required fields'
      };
    } else {
      return {
        pass: false,
        message: () => 'Issue object is missing required fields'
      };
    }
  },
  toBeValidEvent(received) {
    const requiredFields = [
      'id',
      'title',
      'date',
      'venue',
      'participants',
      'speakers',
      'status',
      'created_at',
      'updated_at'
    ];
    const hasAllFields = requiredFields.every(field =>
      Object.prototype.hasOwnProperty.call(received, field)
    );
    if (hasAllFields) {
      return {
        pass: true,
        message: () => 'Event object has all required fields'
      };
    } else {
      return {
        pass: false,
        message: () => 'Event object is missing required fields'
      };
    }
  },
  toHaveGitHubIssueStructure(received) {
    const requiredFields = [
      'id',
      'number',
      'title',
      'body',
      'state',
      'created_at',
      'updated_at',
      'user',
      'labels',
      'html_url'
    ];
    const hasAllFields = requiredFields.every(field =>
      Object.prototype.hasOwnProperty.call(received, field)
    );
    if (hasAllFields) {
      return {
        pass: true,
        message: () => 'GitHub Issue has all required API fields'
      };
    } else {
      return {
        pass: false,
        message: () => 'GitHub Issue is missing required API fields'
      };
    }
  }
});
