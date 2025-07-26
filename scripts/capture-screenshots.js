#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const TEST_URL = process.env.UI_TEST_URL || 'http://localhost:3335';

async function captureScreenshots() {
  console.log('📸 スクリーンショットを取得しています...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'mobile', width: 375, height: 667, fullPage: true },
    { name: 'tablet', width: 768, height: 1024, fullPage: false },
    { name: 'desktop', width: 1920, height: 1080, fullPage: false }
  ];

  try {
    await fs.mkdir('screenshots/current', { recursive: true });

    for (const viewport of viewports) {
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height})`);

      const page = await browser.newPage();
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2
      });

      await page.goto(TEST_URL, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for animations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture main view
      await page.screenshot({
        path: `screenshots/current/${viewport.name}-main.png`,
        fullPage: viewport.fullPage
      });
      console.log('  ✅ メインビュー');

      // Capture with modal open
      try {
        const modalTrigger = await page.$('[data-action="register-listener"]');
        if (modalTrigger) {
          await modalTrigger.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          await page.screenshot({
            path: `screenshots/current/${viewport.name}-modal.png`,
            fullPage: false
          });
          console.log('  ✅ モーダル表示');
        }
      } catch (e) {
        console.log('  ⚠️  モーダルスクリーンショットをスキップ');
      }

      await page.close();
    }

    console.log('\n✅ スクリーンショットの取得が完了しました！');
    console.log('📁 保存先: screenshots/current/');
  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await browser.close();
  }
}

// 実行
captureScreenshots().catch(console.error);
