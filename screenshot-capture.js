#!/usr/bin/env node
/**
 * Screenshot Capture Tool for UI/UX Verification
 * UI/UX検証用スクリーンショット撮影ツール
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = './screenshots-ui-verification';
const BASE_URL = 'http://localhost:3000';

// スクリーンショット設定
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 }
};

class ScreenshotCapture {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshots = [];
  }

  async init() {
    console.log('🚀 Screenshot Capture System initializing...');
    
    // スクリーンショットディレクトリの作成
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // Puppeteer の初期化
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions'
      ]
    });

    this.page = await this.browser.newPage();
    
    // コンソールエラーをキャプチャ
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });

    console.log('✅ Browser initialized');
  }

  async captureScreenshot(name, url = BASE_URL, viewport = 'desktop', options = {}) {
    try {
      console.log(`📸 Capturing ${name} (${viewport})...`);
      
      // ビューポート設定
      await this.page.setViewport(VIEWPORTS[viewport]);
      
      // ページ移動
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // 追加の待機時間（アニメーション完了のため）
      await this.page.waitForTimeout(2000);

      // カスタム操作の実行
      if (options.customActions) {
        await options.customActions(this.page);
      }

      // スクリーンショット撮影
      const filename = `${name}_${viewport}.png`;
      const filepath = path.join(SCREENSHOTS_DIR, filename);
      
      await this.page.screenshot({
        path: filepath,
        fullPage: options.fullPage !== false, // デフォルトはフルページ
        ...options.screenshotOptions
      });

      this.screenshots.push({
        name,
        viewport,
        filename,
        filepath,
        url,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Screenshot saved: ${filename}`);
      
      return filepath;
    } catch (error) {
      console.error(`❌ Failed to capture ${name}:`, error.message);
      return null;
    }
  }

  async captureBasicPages() {
    console.log('\n📋 Capturing basic pages...');
    
    // メインページ（全デバイス）
    for (const viewport of Object.keys(VIEWPORTS)) {
      await this.captureScreenshot('main-page', BASE_URL, viewport);
    }
    
    // モーダル表示のテスト
    await this.captureScreenshot('registration-modal', BASE_URL, 'desktop', {
      customActions: async (page) => {
        // 参加登録ボタンをクリック
        const regButton = await page.$('[data-action="register-listener"]');
        if (regButton) {
          await regButton.click();
          await page.waitForTimeout(1000); // モーダル表示待機
        }
      }
    });

    // スマートフォンでのモーダル表示
    await this.captureScreenshot('registration-modal-mobile', BASE_URL, 'mobile', {
      customActions: async (page) => {
        const regButton = await page.$('[data-action="register-listener"]');
        if (regButton) {
          await regButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  }

  async captureInteractions() {
    console.log('\n🎯 Capturing interaction states...');
    
    // ボタンホバー状態
    await this.captureScreenshot('button-hover-states', BASE_URL, 'desktop', {
      customActions: async (page) => {
        // ボタンにホバー
        const button = await page.$('.btn[data-action="register-speaker"]');
        if (button) {
          await button.hover();
          await page.waitForTimeout(500);
        }
      }
    });

    // フォーカス状態
    await this.captureScreenshot('button-focus-states', BASE_URL, 'desktop', {
      customActions: async (page) => {
        // Tab キーでフォーカス移動
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);
      }
    });

    // チャット機能のテスト（存在する場合）
    await this.captureScreenshot('chat-widget', BASE_URL, 'desktop', {
      customActions: async (page) => {
        const chatToggle = await page.$('#chatToggle');
        if (chatToggle) {
          await chatToggle.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  }

  async captureMobileExperience() {
    console.log('\n📱 Capturing mobile experience...');
    
    // モバイルでのタッチ操作
    await this.captureScreenshot('mobile-navigation', BASE_URL, 'mobile', {
      customActions: async (page) => {
        // メニュートグルがあるかチェック
        const menuToggle = await page.$('.mobile-menu-toggle, .menu-toggle');
        if (menuToggle) {
          await menuToggle.click();
          await page.waitForTimeout(800);
        }
      }
    });

    // タブレット表示
    await this.captureScreenshot('tablet-layout', BASE_URL, 'tablet');
  }

  async captureAccessibility() {
    console.log('\n♿ Capturing accessibility features...');
    
    // ハイコントラストモードのシミュレーション
    await this.captureScreenshot('high-contrast-mode', BASE_URL, 'desktop', {
      customActions: async (page) => {
        await page.addStyleTag({
          content: `
            * {
              filter: contrast(200%) brightness(150%) !important;
            }
          `
        });
        await page.waitForTimeout(1000);
      }
    });

    // フォーカス表示の確認
    await this.captureScreenshot('focus-indicators', BASE_URL, 'desktop', {
      customActions: async (page) => {
        // 複数の要素にフォーカスを当てる
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(200);
        }
      }
    });
  }

  async generateReport() {
    console.log('\n📊 Generating verification report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalScreenshots: this.screenshots.length,
      screenshots: this.screenshots,
      viewports: VIEWPORTS,
      summary: {
        desktop: this.screenshots.filter(s => s.viewport === 'desktop').length,
        tablet: this.screenshots.filter(s => s.viewport === 'tablet').length,
        mobile: this.screenshots.filter(s => s.viewport === 'mobile').length
      }
    };

    // JSON レポート生成
    const reportPath = path.join(SCREENSHOTS_DIR, 'verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Markdown レポート生成
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(SCREENSHOTS_DIR, 'VERIFICATION_REPORT.md');
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`✅ Report generated: ${reportPath}`);
    console.log(`✅ Markdown report: ${markdownPath}`);
    
    return report;
  }

  generateMarkdownReport(report) {
    let markdown = `# UI/UX Verification Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n`;
    markdown += `**Total Screenshots:** ${report.totalScreenshots}\n\n`;

    markdown += `## Screenshot Summary\n\n`;
    markdown += `| Viewport | Count |\n|----------|-------|\n`;
    markdown += `| Desktop | ${report.summary.desktop} |\n`;
    markdown += `| Tablet | ${report.summary.tablet} |\n`;
    markdown += `| Mobile | ${report.summary.mobile} |\n\n`;

    markdown += `## Screenshots\n\n`;
    
    report.screenshots.forEach(screenshot => {
      markdown += `### ${screenshot.name} (${screenshot.viewport})\n`;
      markdown += `![${screenshot.name}](${screenshot.filename})\n`;
      markdown += `- **File:** ${screenshot.filename}\n`;
      markdown += `- **URL:** ${screenshot.url}\n`;
      markdown += `- **Captured:** ${screenshot.timestamp}\n\n`;
    });

    markdown += `## Viewports Used\n\n`;
    Object.entries(VIEWPORTS).forEach(([name, viewport]) => {
      markdown += `- **${name}:** ${viewport.width}x${viewport.height}\n`;
    });

    return markdown;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔄 Browser closed');
    }
  }

  async run() {
    try {
      await this.init();
      
      await this.captureBasicPages();
      await this.captureInteractions();
      await this.captureMobileExperience();
      await this.captureAccessibility();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 Screenshot capture completed!');
      console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
      console.log(`📊 Total screenshots: ${report.totalScreenshots}`);
      
      return report;
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// メイン実行
const captureSystem = new ScreenshotCapture();
captureSystem.run()
  .then(report => {
    console.log('\n✅ UI/UX verification screenshots completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Screenshot capture failed:', error);
    process.exit(1);
  });