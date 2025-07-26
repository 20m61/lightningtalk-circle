#!/usr/bin/env node

/**
 * 詳細エラーチェックスクリプト
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const TEST_URL = process.env.CHECK_URL || 'http://127.0.0.1:3334';

async function detailedErrorCheck() {
  console.log('🔍 詳細なエラーチェックを開始します...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // エラー収集用の配列
    const errors = {
      console: [],
      network: [],
      page: [],
      runtime: []
    };

    // コンソールメッセージを監視
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      if (type === 'error') {
        errors.console.push({
          text,
          location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
          timestamp: new Date().toISOString()
        });
        console.log('\n❌ Console Error:');
        console.log(`   Message: ${text}`);
        console.log(`   Location: ${location.url}:${location.lineNumber}`);
      }
    });

    // ページエラーを監視
    page.on('pageerror', error => {
      errors.page.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log('\n💥 Page Error:');
      console.log(`   Message: ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack.split('\n')[0]}`);
      }
    });

    // ネットワークエラーを監視
    page.on('requestfailed', request => {
      errors.network.push({
        url: request.url(),
        method: request.method(),
        errorText: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
      console.log('\n🌐 Network Error:');
      console.log(`   URL: ${request.url()}`);
      console.log(`   Error: ${request.failure()?.errorText}`);
    });

    // ランタイムエラーをキャッチ
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('error', e => {
        console.error('Runtime error:', e.message, 'at', `${e.filename}:${e.lineno}`);
      });

      window.addEventListener('unhandledrejection', e => {
        console.error('Unhandled promise rejection:', e.reason);
      });
    });

    console.log('📄 ページを読み込んでいます...');
    const response = await page.goto(TEST_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('\n📊 ページ読み込み結果:');
    console.log(`   Status: ${response.status()}`);
    console.log(`   URL: ${response.url()}`);

    // ページの内容を確認
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        scripts: Array.from(document.scripts).map(s => ({
          src: s.src || 'inline',
          async: s.async,
          defer: s.defer,
          type: s.type || 'text/javascript'
        })),
        stylesheets: Array.from(document.styleSheets)
          .map(s => s.href || 'inline')
          .filter(Boolean),
        hasRegistrationModal: !!document.getElementById('registration-modal'),
        hasPWAInstaller: typeof window.pwaInstaller !== 'undefined',
        hasLightningTalkApp: typeof window.LightningTalkApp !== 'undefined'
      };
    });

    console.log('\n📋 ページ構成:');
    console.log(`   Title: ${pageContent.title}`);
    console.log(`   Scripts: ${pageContent.scripts.length}個`);
    console.log(`   Stylesheets: ${pageContent.stylesheets.length}個`);
    console.log(`   Registration Modal: ${pageContent.hasRegistrationModal ? '✅' : '❌'}`);
    console.log(`   PWA Installer: ${pageContent.hasPWAInstaller ? '✅' : '❌'}`);
    console.log(`   LightningTalkApp: ${pageContent.hasLightningTalkApp ? '✅' : '❌'}`);

    // スクリプトのロード状況を確認
    console.log('\n📜 読み込まれたスクリプト:');
    pageContent.scripts.forEach((script, index) => {
      if (script.src !== 'inline') {
        console.log(`   ${index + 1}. ${script.src.replace(TEST_URL, '')}`);
      }
    });

    // 追加の待機時間
    await new Promise(resolve => setTimeout(resolve, 3000));

    // エラーサマリー
    console.log('\n📊 エラーサマリー:');
    console.log(`   Console Errors: ${errors.console.length}`);
    console.log(`   Page Errors: ${errors.page.length}`);
    console.log(`   Network Errors: ${errors.network.length}`);

    // エラーレポートを保存
    const report = {
      url: TEST_URL,
      timestamp: new Date().toISOString(),
      errors,
      pageContent,
      summary: {
        totalErrors: errors.console.length + errors.page.length + errors.network.length,
        consoleErrors: errors.console.length,
        pageErrors: errors.page.length,
        networkErrors: errors.network.length
      }
    };

    await fs.writeFile('error-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 詳細なエラーレポートを error-report.json に保存しました');

    // スクリーンショットを撮影
    await page.screenshot({ path: 'error-check-screenshot.png', fullPage: true });
    console.log('📸 スクリーンショットを error-check-screenshot.png に保存しました');

    return report.summary.totalErrors === 0;
  } catch (error) {
    console.error('\n❌ チェックエラー:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// 実行
detailedErrorCheck().then(success => {
  if (success) {
    console.log('\n✅ エラーは検出されませんでした！');
  } else {
    console.log(
      '\n⚠️  エラーが検出されました。詳細は上記およびerror-report.jsonを確認してください。'
    );
  }
  process.exit(success ? 0 : 1);
});
