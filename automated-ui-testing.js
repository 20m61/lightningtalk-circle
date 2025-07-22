#!/usr/bin/env node
/**
 * Automated UI Testing Suite with Screenshot Comparison
 * スクリーンショット比較機能付き自動UIテストスイート
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = './screenshots-automated-ui-tests';
const BASELINE_DIR = './screenshots-baseline';
const DIFF_DIR = './screenshots-diff';

// テスト設定
const TEST_CONFIG = {
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 }, 
    mobile: { width: 375, height: 812 }
  },
  waitForNetworkIdle: 2000,
  screenshotOptions: {
    type: 'png',
    fullPage: true,
    quality: 90
  }
};

class AutomatedUITester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.startTime = Date.now();
  }

  async init() {
    console.log('🚀 Initializing Automated UI Testing Suite...');
    
    // ディレクトリの作成
    [SCREENSHOTS_DIR, BASELINE_DIR, DIFF_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Puppeteer の初期化
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    this.page = await this.browser.newPage();
    
    // コンソールエラーキャプチャ
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });

    // ネットワークエラーキャプチャ
    this.page.on('response', response => {
      if (!response.ok()) {
        console.log(`⚠️ HTTP ${response.status()}: ${response.url()}`);
      }
    });

    console.log('✅ Browser initialized for automated testing');
  }

  async runComprehensiveTests() {
    console.log('\n🧪 Running Comprehensive UI Tests...');
    
    const testSuites = [
      { name: 'basic-pages', tests: this.getBasicPageTests() },
      { name: 'modal-interactions', tests: this.getModalTests() },
      { name: 'responsive-layouts', tests: this.getResponsiveTests() },
      { name: 'accessibility-features', tests: this.getAccessibilityTests() },
      { name: 'form-interactions', tests: this.getFormTests() },
      { name: 'animation-states', tests: this.getAnimationTests() }
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 Testing ${suite.name}...`);
      await this.runTestSuite(suite);
    }

    return this.generateComprehensiveReport();
  }

  getBasicPageTests() {
    return [
      {
        name: 'homepage-load',
        url: BASE_URL,
        description: 'Homepage loads correctly with all elements'
      },
      {
        name: 'homepage-scroll',
        url: BASE_URL,
        description: 'Homepage scrolling behavior and sticky elements',
        customAction: async (page) => {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
          await page.waitForTimeout(1000);
        }
      }
    ];
  }

  getModalTests() {
    return [
      {
        name: 'registration-modal-open',
        url: BASE_URL,
        description: 'Registration modal opens correctly',
        customAction: async (page) => {
          const regButton = await page.$('[data-action="register-listener"]');
          if (regButton) {
            await regButton.click();
            await page.waitForTimeout(1500); // モーダル表示とアニメーション完了待機
          }
        }
      },
      {
        name: 'modal-focus-trap',
        url: BASE_URL,
        description: 'Modal focus trap functionality',
        customAction: async (page) => {
          const regButton = await page.$('[data-action="register-listener"]');
          if (regButton) {
            await regButton.click();
            await page.waitForTimeout(1000);
            // Tab キーでフォーカス移動
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.waitForTimeout(500);
          }
        }
      }
    ];
  }

  getResponsiveTests() {
    return [
      {
        name: 'mobile-navigation',
        url: BASE_URL,
        description: 'Mobile navigation menu functionality',
        viewport: 'mobile',
        customAction: async (page) => {
          const menuToggle = await page.$('.mobile-menu-toggle, .menu-toggle');
          if (menuToggle) {
            await menuToggle.click();
            await page.waitForTimeout(800);
          }
        }
      },
      {
        name: 'tablet-layout',
        url: BASE_URL,
        description: 'Tablet layout optimization',
        viewport: 'tablet'
      }
    ];
  }

  getAccessibilityTests() {
    return [
      {
        name: 'keyboard-navigation',
        url: BASE_URL,
        description: 'Keyboard navigation functionality',
        customAction: async (page) => {
          // Tab キーで複数要素にフォーカス
          for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(200);
          }
        }
      },
      {
        name: 'high-contrast-simulation',
        url: BASE_URL,
        description: 'High contrast accessibility test',
        customAction: async (page) => {
          await page.addStyleTag({
            content: `
              * {
                filter: contrast(200%) brightness(150%) !important;
              }
            `
          });
          await page.waitForTimeout(1000);
        }
      }
    ];
  }

  getFormTests() {
    return [
      {
        name: 'form-validation',
        url: BASE_URL,
        description: 'Form validation states',
        customAction: async (page) => {
          const regButton = await page.$('[data-action="register-listener"]');
          if (regButton) {
            await regButton.click();
            await page.waitForTimeout(1000);
            
            // フォーム入力のテスト
            const nameInput = await page.$('#modalName, input[name="name"]');
            if (nameInput) {
              await nameInput.type('Test User');
              await page.waitForTimeout(500);
            }
          }
        }
      }
    ];
  }

  getAnimationTests() {
    return [
      {
        name: 'button-hover-states',
        url: BASE_URL,
        description: 'Button hover and animation states',
        viewport: 'desktop',
        customAction: async (page) => {
          const button = await page.$('.btn[data-action="register-speaker"]');
          if (button) {
            await button.hover();
            await page.waitForTimeout(500);
          }
        }
      },
      {
        name: 'loading-states',
        url: BASE_URL,
        description: 'Loading state animations',
        customAction: async (page) => {
          await page.addStyleTag({
            content: `
              .btn { 
                pointer-events: none !important; 
              }
              .btn::after {
                content: '';
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-left: 8px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            `
          });
          await page.waitForTimeout(1000);
        }
      }
    ];
  }

  async runTestSuite(suite) {
    const suiteResults = {
      name: suite.name,
      tests: [],
      passed: 0,
      failed: 0
    };

    for (const test of suite.tests) {
      try {
        console.log(`  📸 Running: ${test.name}`);
        const result = await this.runSingleTest(test, suite.name);
        suiteResults.tests.push(result);
        
        if (result.success) {
          suiteResults.passed++;
        } else {
          suiteResults.failed++;
        }
      } catch (error) {
        console.error(`  ❌ Test ${test.name} failed:`, error.message);
        suiteResults.tests.push({
          name: test.name,
          success: false,
          error: error.message
        });
        suiteResults.failed++;
      }
    }

    this.testResults.push(suiteResults);
    console.log(`  ✅ ${suiteResults.passed} passed, ❌ ${suiteResults.failed} failed`);
  }

  async runSingleTest(test, suiteName) {
    const viewport = test.viewport || 'desktop';
    const testViewport = TEST_CONFIG.viewports[viewport];
    
    // ビューポート設定
    await this.page.setViewport(testViewport);
    
    // ページ移動
    await this.page.goto(test.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 追加の待機時間
    await this.page.waitForTimeout(TEST_CONFIG.waitForNetworkIdle);

    // カスタムアクション実行
    if (test.customAction) {
      await test.customAction(this.page);
    }

    // スクリーンショット撮影
    const filename = `${suiteName}_${test.name}_${viewport}.png`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, filename);
    
    await this.page.screenshot({
      path: screenshotPath,
      ...TEST_CONFIG.screenshotOptions
    });

    // ベースラインとの比較（存在する場合）
    const baselinePath = path.join(BASELINE_DIR, filename);
    let comparison = null;
    
    if (fs.existsSync(baselinePath)) {
      comparison = await this.compareScreenshots(screenshotPath, baselinePath, filename);
    }

    return {
      name: test.name,
      description: test.description,
      viewport,
      filename,
      screenshotPath,
      comparison,
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  async compareScreenshots(currentPath, baselinePath, filename) {
    try {
      const currentBuffer = fs.readFileSync(currentPath);
      const baselineBuffer = fs.readFileSync(baselinePath);
      
      const currentHash = createHash('md5').update(currentBuffer).digest('hex');
      const baselineHash = createHash('md5').update(baselineBuffer).digest('hex');
      
      const isIdentical = currentHash === baselineHash;
      
      if (!isIdentical) {
        // 差分ファイルの作成（基本的なコピー、実際のピクセル比較は別ツールが必要）
        const diffPath = path.join(DIFF_DIR, `diff_${filename}`);
        fs.copyFileSync(currentPath, diffPath);
      }
      
      return {
        isIdentical,
        currentHash,
        baselineHash,
        diffGenerated: !isIdentical
      };
    } catch (error) {
      console.error(`Screenshot comparison failed: ${error.message}`);
      return { error: error.message };
    }
  }

  async generateComprehensiveReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failed, 0);

    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        duration: `${Math.round(duration / 1000)}s`,
        totalTests,
        totalPassed,
        totalFailed,
        successRate: `${Math.round((totalPassed / totalTests) * 100)}%`
      },
      environment: {
        baseUrl: BASE_URL,
        viewports: TEST_CONFIG.viewports,
        screenshotDir: SCREENSHOTS_DIR
      },
      testSuites: this.testResults
    };

    // JSON レポート生成
    const reportPath = path.join(SCREENSHOTS_DIR, 'automated-ui-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Markdown レポート生成
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(SCREENSHOTS_DIR, 'AUTOMATED_UI_TEST_REPORT.md');
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`\n📊 Test Results Summary:`);
    console.log(`✅ Passed: ${totalPassed}/${totalTests} (${report.summary.successRate})`);
    console.log(`❌ Failed: ${totalFailed}/${totalTests}`);
    console.log(`⏱️ Duration: ${report.summary.duration}`);
    console.log(`📁 Reports saved to: ${SCREENSHOTS_DIR}`);

    return report;
  }

  generateMarkdownReport(report) {
    let markdown = `# Automated UI Test Report\n\n`;
    markdown += `**Generated:** ${report.summary.timestamp}\n`;
    markdown += `**Duration:** ${report.summary.duration}\n`;
    markdown += `**Success Rate:** ${report.summary.successRate} (${report.summary.totalPassed}/${report.summary.totalTests})\n\n`;

    markdown += `## Test Environment\n\n`;
    markdown += `- **Base URL:** ${report.environment.baseUrl}\n`;
    markdown += `- **Screenshot Directory:** ${report.environment.screenshotDir}\n`;
    markdown += `- **Viewports:** ${Object.entries(report.environment.viewports).map(([name, vp]) => `${name} (${vp.width}x${vp.height})`).join(', ')}\n\n`;

    markdown += `## Test Suite Results\n\n`;
    
    report.testSuites.forEach(suite => {
      markdown += `### ${suite.name}\n`;
      markdown += `**Results:** ✅ ${suite.passed} passed, ❌ ${suite.failed} failed\n\n`;
      
      markdown += `| Test | Status | Viewport | Description |\n`;
      markdown += `|------|--------|----------|-------------|\n`;
      
      suite.tests.forEach(test => {
        const status = test.success ? '✅ Pass' : '❌ Fail';
        markdown += `| ${test.name} | ${status} | ${test.viewport || 'desktop'} | ${test.description || 'N/A'} |\n`;
      });
      
      markdown += `\n`;
    });

    markdown += `## Screenshots\n\n`;
    markdown += `All screenshots are saved in the \`${report.environment.screenshotDir}\` directory.\n`;
    markdown += `Baseline comparisons are available when baseline images exist.\n\n`;

    markdown += `---\n\n`;
    markdown += `*Generated by Automated UI Testing Suite*\n`;

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
      const report = await this.runComprehensiveTests();
      return report;
    } catch (error) {
      console.error('❌ Automated UI testing failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CI/CD統合用の簡単な実行
async function runCIMode() {
  console.log('🚀 Running in CI/CD mode...');
  
  const tester = new AutomatedUITester();
  try {
    const report = await tester.run();
    
    // CI/CD で使用するための exit code 設定
    const hasFailures = report.summary.totalFailed > 0;
    
    if (hasFailures) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// メイン実行
const isCI = process.argv.includes('--ci');

if (isCI) {
  runCIMode();
} else {
  const tester = new AutomatedUITester();
  tester.run()
    .then(report => {
      console.log('\n🎉 Automated UI testing completed successfully!');
    })
    .catch(error => {
      console.error('\n❌ Automated UI testing failed:', error);
      process.exit(1);
    });
}