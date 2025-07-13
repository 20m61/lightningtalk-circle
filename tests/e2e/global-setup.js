/**
 * Playwright グローバルセットアップ
 * 全てのE2Eテスト実行前に一度だけ実行される
 */

import { chromium } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

async function globalSetup() {
  console.log('🚀 Starting global E2E test setup...');

  // テスト環境の準備
  await setupTestEnvironment();

  // テストユーザーの認証状態をセットアップ
  await setupAuthentication();

  console.log('✅ Global E2E test setup completed');
}

async function setupTestEnvironment() {
  // テスト用データディレクトリの作成
  const testDataDir = path.join(process.cwd(), 'tests', 'e2e-data');
  await fs.ensureDir(testDataDir);

  // テスト用設定ファイルの作成
  const testConfig = {
    apiUrl: process.env.TEST_BASE_URL || 'http://localhost:3006',
    timeout: 30000,
    retries: 2
  };

  await fs.writeJson(path.join(testDataDir, 'test-config.json'), testConfig, { spaces: 2 });

  console.log('📁 Test environment prepared');
}

async function setupAuthentication() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // テストユーザーでのログイン処理（必要に応じて）
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3006';
    await page.goto(baseURL);

    // 認証が必要な場合のセットアップ
    // await page.fill('[data-testid="username"]', 'test-user');
    // await page.fill('[data-testid="password"]', 'test-password');
    // await page.click('[data-testid="login-button"]');

    // 認証状態を保存
    const storageState = await context.storageState();
    const authFile = path.join(process.cwd(), 'tests', 'e2e-data', 'auth-state.json');
    await fs.writeJson(authFile, storageState, { spaces: 2 });

    console.log('🔐 Authentication state saved');
  } catch (error) {
    console.warn('⚠️ Authentication setup skipped:', error.message);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
