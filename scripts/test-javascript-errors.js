#!/usr/bin/env node

/**
 * JavaScriptエラーチェックスクリプト
 */

import puppeteer from 'puppeteer';

const TEST_URL = 'http://localhost:3334';

async function testJavaScriptErrors() {
  console.log('🔍 JavaScriptエラーチェックを開始します...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // コンソールメッセージを監視
    const consoleErrors = [];
    const consoleWarnings = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`❌ ERROR: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`⚠️  WARNING: ${text}`);
      }
    });

    // ページエラーを監視
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });

    console.log('📄 ページを読み込んでいます...');
    const response = await page.goto(TEST_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    if (response.status() !== 200) {
      throw new Error(`ページ読み込みエラー: ${response.status()}`);
    }

    // 追加の待機時間（遅延実行されるコードのため）
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 結果のサマリー
    console.log('\n📊 チェック結果:');
    console.log(`- エラー数: ${consoleErrors.length}`);
    console.log(`- 警告数: ${consoleWarnings.length}`);

    if (consoleErrors.length === 0) {
      console.log('\n✅ JavaScriptエラーは検出されませんでした！');
    } else {
      console.log('\n❌ 以下のエラーが検出されました:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // テスト結果を返す
    return consoleErrors.length === 0;
  } catch (error) {
    console.error('\n❌ テストエラー:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// 実行
testJavaScriptErrors().then(success => {
  process.exit(success ? 0 : 1);
});
