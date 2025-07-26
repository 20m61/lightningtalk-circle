#!/usr/bin/env node

/**
 * UI/UX Validation Script
 * デザイン、レイアウト、ボタンの挙動と判読性を検証
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const TEST_URL = process.env.UI_TEST_URL || 'http://localhost:3335';
const VIEWPORT_SIZES = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
];

// Helper function for waiting
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const UI_TESTS = {
  layout: {
    name: 'レイアウト検証',
    tests: [
      'ヘッダーの固定表示',
      'コンテンツの中央配置',
      'レスポンシブグリッド',
      'スクロール動作',
      'フッターの配置'
    ]
  },
  buttons: {
    name: 'ボタンの挙動と判読性',
    tests: [
      'ホバーエフェクト',
      'クリック状態',
      'フォーカス表示',
      'テキストの可読性',
      'アイコンの明瞭性',
      'タッチターゲットサイズ'
    ]
  },
  typography: {
    name: 'テキストの判読性',
    tests: ['フォントサイズ', 'コントラスト比', '行間', '文字間隔', '見出しの階層']
  },
  interactions: {
    name: 'インタラクション',
    tests: [
      'モーダルの開閉',
      'フォームの入力',
      'ナビゲーション',
      'スムーズスクロール',
      'アニメーション'
    ]
  },
  accessibility: {
    name: 'アクセシビリティ',
    tests: [
      'キーボードナビゲーション',
      'フォーカス管理',
      'ARIA属性',
      'スクリーンリーダー対応',
      'カラーコントラスト'
    ]
  }
};

async function runUIValidation() {
  console.log('🎨 UI/UX検証を開始します...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    tests: {}
  };

  try {
    for (const viewport of VIEWPORT_SIZES) {
      console.log(`\n📱 ${viewport.name}サイズでの検証 (${viewport.width}x${viewport.height})`);
      results.tests[viewport.name] = {};

      const page = await browser.newPage();
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2
      });

      // ページ読み込み
      await page.goto(TEST_URL, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // レイアウト検証
      console.log('\n📐 レイアウト検証');
      const layoutResults = await validateLayout(page);
      results.tests[viewport.name].layout = layoutResults;

      // ボタンの挙動検証
      console.log('\n🔘 ボタンの挙動と判読性検証');
      const buttonResults = await validateButtons(page);
      results.tests[viewport.name].buttons = buttonResults;

      // テキストの判読性検証
      console.log('\n📝 テキストの判読性検証');
      const typographyResults = await validateTypography(page);
      results.tests[viewport.name].typography = typographyResults;

      // インタラクション検証
      console.log('\n🎯 インタラクション検証');
      const interactionResults = await validateInteractions(page);
      results.tests[viewport.name].interactions = interactionResults;

      // アクセシビリティ検証
      console.log('\n♿ アクセシビリティ検証');
      const accessibilityResults = await validateAccessibility(page);
      results.tests[viewport.name].accessibility = accessibilityResults;

      // スクリーンショット保存
      await page.screenshot({
        path: `screenshots/ui-validation-${viewport.name}.png`,
        fullPage: true
      });

      await page.close();
    }

    // 結果の保存
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile('reports/ui-validation-report.json', JSON.stringify(results, null, 2));

    // サマリーレポートの生成
    generateSummaryReport(results);
  } catch (error) {
    console.error('❌ 検証エラー:', error.message);
  } finally {
    await browser.close();
  }
}

async function validateLayout(page) {
  const results = {};

  // ヘッダーの固定表示確認
  results.fixedHeader = await page.evaluate(() => {
    const header = document.querySelector('header, .header, nav');
    if (!header) {return false;}
    const style = window.getComputedStyle(header);
    return style.position === 'fixed' || style.position === 'sticky';
  });

  // コンテンツの中央配置確認
  results.centeredContent = await page.evaluate(() => {
    const main = document.querySelector('main, .main-content, .container');
    if (!main) {return false;}
    const style = window.getComputedStyle(main);
    return style.marginLeft === 'auto' && style.marginRight === 'auto';
  });

  // レスポンシブグリッド確認
  results.responsiveGrid = await page.evaluate(() => {
    const grid = document.querySelector('.grid, .row, [class*="col-"]');
    return grid !== null;
  });

  return results;
}

async function validateButtons(page) {
  const results = {};

  // すべてのボタンを取得
  const buttons = await page.$$('button, .btn, [role="button"], a.button');
  results.totalButtons = buttons.length;

  // ボタンのサイズチェック（最小44x44px）
  results.touchTargetSize = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, .btn, [role="button"]');
    let validCount = 0;
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {validCount++;}
    });
    return {
      valid: validCount,
      total: buttons.length,
      percentage: buttons.length > 0 ? ((validCount / buttons.length) * 100).toFixed(1) : 0
    };
  });

  // ホバー効果の確認
  if (buttons.length > 0) {
    try {
      const firstButton = buttons[0];

      // Ensure button is visible before interacting
      await firstButton.scrollIntoViewIfNeeded();

      const initialStyle = await firstButton.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });

      await firstButton.hover();
      await wait(300);

      const hoverStyle = await firstButton.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });

      results.hasHoverEffect = initialStyle !== hoverStyle;
    } catch (error) {
      results.hasHoverEffect = false;
      results.hoverError = error.message;
    }
  }

  return results;
}

async function validateTypography(page) {
  const results = {};

  // フォントサイズの検証
  results.fontSize = await page.evaluate(() => {
    const { body } = document;
    const baseFontSize = parseInt(window.getComputedStyle(body).fontSize);
    const paragraphs = document.querySelectorAll('p, .text');
    let tooSmall = 0;

    paragraphs.forEach(p => {
      const fontSize = parseInt(window.getComputedStyle(p).fontSize);
      if (fontSize < 14) {tooSmall++;}
    });

    return {
      base: baseFontSize,
      tooSmallCount: tooSmall,
      adequate: tooSmall === 0
    };
  });

  // コントラスト比の簡易チェック
  results.contrast = await page.evaluate(() => {
    const getContrast = (rgb1, rgb2) => {
      const getLuminance = (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const l1 = getLuminance(...rgb1);
      const l2 = getLuminance(...rgb2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, .text');
    let goodContrast = 0;
    let poorContrast = 0;

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor.match(/\d+/g);
      const textColor = style.color.match(/\d+/g);

      if (bgColor && textColor) {
        const contrast = getContrast(
          textColor.slice(0, 3).map(Number),
          bgColor.slice(0, 3).map(Number)
        );
        if (contrast >= 4.5) {
          goodContrast++;
        } else {
          poorContrast++;
        }
      }
    });

    return {
      goodContrast,
      poorContrast,
      percentage: elements.length > 0 ? ((goodContrast / elements.length) * 100).toFixed(1) : 0
    };
  });

  return results;
}

async function validateInteractions(page) {
  const results = {};

  // モーダルの動作確認
  try {
    // 複数のセレクターを試す
    const modalSelectors = [
      '#register-btn',
      '[data-modal]',
      '[data-toggle="modal"]',
      '[data-bs-toggle="modal"]',
      '.btn-register',
      'button:has-text("登録")',
      'a:has-text("登録")'
    ];

    let modalTrigger = null;
    for (const selector of modalSelectors) {
      try {
        modalTrigger = await page.waitForSelector(selector, { timeout: 1000 });
        if (modalTrigger) {break;}
      } catch (e) {
        // Continue to next selector
      }
    }

    if (modalTrigger) {
      // Ensure the element is visible and clickable
      await modalTrigger.scrollIntoViewIfNeeded();
      await wait(100);

      // Use evaluate to click to avoid "not clickable" errors
      await page.evaluate(el => el.click(), modalTrigger);
      await wait(500);

      const modalVisible = await page.evaluate(() => {
        const modal = document.querySelector(
          '.modal, [role="dialog"], #registration-modal, .event-modal'
        );
        return modal && window.getComputedStyle(modal).display !== 'none';
      });

      results.modalFunctionality = modalVisible;

      // モーダルを閉じる
      if (modalVisible) {
        const closeSelectors = [
          '.modal-close',
          '[data-dismiss="modal"]',
          '[data-bs-dismiss="modal"]',
          '.close',
          '.btn-close',
          'button[aria-label="Close"]'
        ];

        for (const selector of closeSelectors) {
          try {
            const closeButton = await page.$(selector);
            if (closeButton) {
              await page.evaluate(el => el.click(), closeButton);
              await wait(500);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }
    } else {
      results.modalFunctionality = false;
      results.modalError = 'No modal trigger found';
    }
  } catch (error) {
    results.modalFunctionality = false;
    results.modalError = error.message;
  }

  // スムーズスクロールの確認
  results.smoothScroll = await page.evaluate(() => {
    const html = document.documentElement;
    const style = window.getComputedStyle(html);
    return style.scrollBehavior === 'smooth';
  });

  return results;
}

async function validateAccessibility(page) {
  const results = {};

  // フォーカス可能要素の確認
  results.focusableElements = await page.evaluate(() => {
    const focusable = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return focusable.length;
  });

  // ARIA属性の使用確認
  results.ariaUsage = await page.evaluate(() => {
    const withAria = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
    return withAria.length;
  });

  // キーボードナビゲーションテスト
  await page.keyboard.press('Tab');
  await wait(100);

  results.keyboardNavigation = await page.evaluate(() => {
    const focused = document.activeElement;
    return focused && focused !== document.body;
  });

  return results;
}

function generateSummaryReport(results) {
  console.log('\n📊 UI/UX検証サマリー');
  console.log('='.repeat(50));

  let totalIssues = 0;
  let totalPassed = 0;

  Object.entries(results.tests).forEach(([viewport, tests]) => {
    console.log(`\n📱 ${viewport.toUpperCase()}`);

    Object.entries(tests).forEach(([category, testResults]) => {
      console.log(`\n  ${UI_TESTS[category]?.name || category}:`);

      Object.entries(testResults).forEach(([test, result]) => {
        let status = '✅';
        let message = '';

        if (category === 'buttons' && test === 'touchTargetSize') {
          if (result.percentage < 100) {
            status = '⚠️';
            totalIssues++;
            message = `${result.percentage}%が推奨サイズ`;
          } else {
            totalPassed++;
          }
        } else if (category === 'typography' && test === 'contrast') {
          if (result.percentage < 90) {
            status = '⚠️';
            totalIssues++;
            message = `${result.poorContrast}要素が低コントラスト`;
          } else {
            totalPassed++;
          }
        } else {
          if (result === true || (typeof result === 'object' && result.adequate)) {
            totalPassed++;
          } else if (result === false) {
            status = '❌';
            totalIssues++;
          }
        }

        console.log(`    ${status} ${test}: ${JSON.stringify(result)} ${message}`);
      });
    });
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ 合格: ${totalPassed}`);
  console.log(`❌ 問題: ${totalIssues}`);
  console.log(`📊 合格率: ${((totalPassed / (totalPassed + totalIssues)) * 100).toFixed(1)}%`);

  console.log('\n📁 詳細レポート: reports/ui-validation-report.json');
  console.log('📸 スクリーンショット: screenshots/ui-validation-*.png');
}

// 実行
runUIValidation().catch(console.error);
