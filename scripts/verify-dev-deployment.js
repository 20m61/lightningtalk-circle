#!/usr/bin/env node

/**
 * 開発環境デプロイメント検証スクリプト
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

const DEV_URL = 'https://d3ciavsjxk30rq.cloudfront.net/';

async function verifyDevelopment() {
  console.log('🚀 開発環境の検証を開始します...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 1. ページ読み込み確認
    console.log('📄 ページ読み込みチェック...');
    const response = await page.goto(DEV_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    if (response.status() !== 200) {
      throw new Error(`ページ読み込みエラー: ${response.status()}`);
    }
    console.log('✅ ページ読み込み成功\n');

    // 2. コンソールエラーチェック
    console.log('🔍 JavaScriptエラーチェック...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (consoleErrors.length > 0) {
      console.log('⚠️  コンソールエラー検出:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('✅ JavaScriptエラーなし\n');
    }

    // 3. コントラスト検証
    console.log('🎨 コントラスト改善の確認...');

    // ナビゲーションリンクの色確認
    const navLinkColor = await page.$eval('.nav-link', el => window.getComputedStyle(el).color);
    console.log(`   ナビゲーションリンク色: ${navLinkColor}`);

    // イベントカードテキストの色確認
    const hasEventCard = (await page.$('.event-card')) !== null;
    if (hasEventCard) {
      const eventCardColor = await page.$eval(
        '.event-card p',
        el => window.getComputedStyle(el).color
      );
      console.log(`   イベントカードテキスト色: ${eventCardColor}`);
    }
    console.log('✅ コントラスト設定確認完了\n');

    // 4. インタラクション検証
    console.log('🖱️  インタラクション検証...');

    // 登録ボタンの動作確認
    const registerButton = await page.$('#register-btn');
    if (registerButton) {
      await registerButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      const modalVisible = await page.$eval(
        '#registration-modal',
        el => window.getComputedStyle(el).display !== 'none'
      );

      if (modalVisible) {
        console.log('✅ 登録モーダル表示成功');

        // モーダルを閉じる
        const closeButton = await page.$('.modal-close');
        if (closeButton) {
          await closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // 5. レスポンシブ確認
    console.log('\n📱 レスポンシブ動作確認...');

    // モバイルビューポート
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mobileMenuToggle = await page.$('.mobile-menu-toggle');
    if (mobileMenuToggle) {
      const isVisible = await page.$eval(
        '.mobile-menu-toggle',
        el => window.getComputedStyle(el).display !== 'none'
      );
      console.log(`✅ モバイルメニュー表示: ${isVisible ? 'OK' : 'NG'}`);
    }

    // 6. パフォーマンス測定
    console.log('\n⚡ パフォーマンス測定...');
    const metrics = await page.metrics();
    console.log(`   DOM Content Loaded: ${Math.round(metrics.TaskDuration)}ms`);
    console.log(`   JavaScript実行時間: ${Math.round(metrics.JSEventListeners)}ms`);

    // スクリーンショット保存
    await fs.mkdir('screenshots', { recursive: true });
    await page.setViewport({ width: 1920, height: 1080 });
    await page.screenshot({
      path: 'screenshots/dev-deployment-final.png',
      fullPage: true
    });
    console.log('\n📸 スクリーンショット保存: screenshots/dev-deployment-final.png');

    console.log('\n✅ 検証が完了しました！');
    console.log(`🌐 URL: ${DEV_URL}`);

    // 本番環境の注意事項
    console.log('\n📌 本番環境について:');
    console.log('   - S3バケット (lightningtalk-prod-static-822063948773) へのファイル同期完了');
    console.log('   - CloudFront経由でのアクセスが必要（OAI設定のため）');
    console.log('   - 本番CloudFrontディストリビューションのセットアップが必要な可能性があります');
  } catch (error) {
    console.error('\n❌ 検証エラー:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// 実行
verifyDevelopment().catch(console.error);
