/**
 * Playwright グローバルティアダウン
 * 全てのE2Eテスト実行後に一度だけ実行される
 */

import fs from 'fs-extra';
import path from 'path';

async function globalTeardown() {
  console.log('🧹 Starting global E2E test teardown...');

  // テストデータのクリーンアップ
  await cleanupTestData();

  // テストレポートの整理
  await organizeTestReports();

  console.log('✅ Global E2E test teardown completed');
}

async function cleanupTestData() {
  const testDataDir = path.join(process.cwd(), 'tests', 'e2e-data');

  if (await fs.pathExists(testDataDir)) {
    // 認証状態ファイルのみ削除（他のファイルは保持）
    const authFile = path.join(testDataDir, 'auth-state.json');
    if (await fs.pathExists(authFile)) {
      await fs.remove(authFile);
      console.log('🔐 Authentication state cleaned up');
    }

    // 一時ファイルの削除
    const tempFiles = await fs.readdir(testDataDir);
    for (const file of tempFiles) {
      if (file.startsWith('temp-') || file.endsWith('.tmp')) {
        await fs.remove(path.join(testDataDir, file));
      }
    }
  }

  console.log('📁 Test data cleaned up');
}

async function organizeTestReports() {
  const reportDir = path.join(process.cwd(), 'playwright-report');
  const resultsDir = path.join(process.cwd(), 'test-results');

  // レポートディレクトリが存在する場合のみ処理
  if (await fs.pathExists(reportDir)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(process.cwd(), 'test-archives', timestamp);

    await fs.ensureDir(archiveDir);

    // レポートをアーカイブにコピー
    if (await fs.pathExists(reportDir)) {
      await fs.copy(reportDir, path.join(archiveDir, 'report'));
    }

    if (await fs.pathExists(resultsDir)) {
      await fs.copy(resultsDir, path.join(archiveDir, 'results'));
    }

    console.log(`📊 Test reports archived to: ${archiveDir}`);
  }
}

export default globalTeardown;
