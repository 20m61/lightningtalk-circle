#!/usr/bin/env node

import puppeteer from 'puppeteer';

const TEST_URL = process.env.UI_TEST_URL || 'http://localhost:3335';

async function checkConsoleErrors() {
  console.log('🔍 コンソールエラーをチェックしています...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const errors = [];
    const warnings = [];
    const logs = [];

    // コンソールメッセージをキャプチャ
    page.on('console', message => {
      const type = message.type();
      const text = message.text();
      const location = message.location();

      const logEntry = {
        type,
        text,
        url: location.url,
        line: location.lineNumber,
        column: location.columnNumber
      };

      if (type === 'error') {
        errors.push(logEntry);
        console.log(`❌ ERROR: ${text}`);
        if (location.url) {
          console.log(`   at ${location.url}:${location.lineNumber}:${location.columnNumber}`);
        }
      } else if (type === 'warning') {
        warnings.push(logEntry);
        console.log(`⚠️  WARNING: ${text}`);
      } else if (type === 'log') {
        logs.push(logEntry);
      }
    });

    // ページエラーをキャプチャ
    page.on('pageerror', error => {
      errors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
      console.log(`💥 PAGE ERROR: ${error.message}`);
    });

    // リクエストエラーをキャプチャ
    page.on('requestfailed', request => {
      errors.push({
        type: 'requestfailed',
        url: request.url(),
        failure: request.failure()
      });
      console.log(`🚫 REQUEST FAILED: ${request.url()}`);
    });

    await page.goto(TEST_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 追加の待機（動的コンテンツ読み込み用）
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 結果サマリー
    console.log('\n📊 サマリー:');
    console.log(`- エラー: ${errors.length}`);
    console.log(`- 警告: ${warnings.length}`);
    console.log(`- ログ: ${logs.length}`);

    if (errors.length === 0) {
      console.log('\n✅ コンソールエラーは検出されませんでした！');
    } else {
      console.log('\n❌ 修正が必要なエラーがあります。');
    }

    return { errors, warnings, logs };
  } catch (error) {
    console.error('❌ チェック中にエラーが発生しました:', error.message);
  } finally {
    await browser.close();
  }
}

// 実行
checkConsoleErrors().catch(console.error);
