#!/usr/bin/env node

/**
 * Enhanced UI/UX Validation Script
 * 改善されたCSS反映を確認する検証スクリプト
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
  console.log('🎨 Enhanced UI/UX検証を開始します...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
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

      // Disable cache to ensure fresh CSS
      await page.setCacheEnabled(false);

      // ページ読み込み with force reload
      await page.goto(TEST_URL, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for CSS to fully load
      await page.evaluate(() => {
        return new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve);
          }
        });
      });

      // Additional wait for CSS to apply
      await wait(1000);

      // レイアウト検証
      console.log('\n📐 レイアウト検証');
      const layoutResults = await validateLayout(page);
      results.tests[viewport.name].layout = layoutResults;

      // ボタンの挙動検証
      console.log('\n🔘 ボタンの挙動と判読性検証');
      const buttonResults = await validateButtonsEnhanced(page);
      results.tests[viewport.name].buttons = buttonResults;

      // テキストの判読性検証
      console.log('\n📝 テキストの判読性検証');
      const typographyResults = await validateTypographyEnhanced(page);
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
      await fs.mkdir('screenshots', { recursive: true });
      await page.screenshot({
        path: `screenshots/ui-validation-enhanced-${viewport.name}.png`,
        fullPage: true
      });

      await page.close();
    }

    // 結果の保存
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(
      'reports/ui-validation-enhanced-report.json',
      JSON.stringify(results, null, 2)
    );

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

  // コンテンツの中央配置確認（改善版）
  results.centeredContent = await page.evaluate(() => {
    const containers = document.querySelectorAll('main, .main-content, .container, section > div');
    let centered = false;

    containers.forEach(container => {
      const style = window.getComputedStyle(container);
      if (
        style.marginLeft === 'auto' &&
        style.marginRight === 'auto' &&
        style.maxWidth !== 'none'
      ) {
        centered = true;
      }
    });

    return centered;
  });

  // レスポンシブグリッド確認（改善版）
  results.responsiveGrid = await page.evaluate(() => {
    const gridElements = document.querySelectorAll(
      '[class*="grid"], [class*="row"], [class*="col-"], .flex, .flexbox'
    );
    return gridElements.length > 0;
  });

  return results;
}

async function validateButtonsEnhanced(page) {
  const results = {};

  // すべてのボタンを取得
  const buttonSelectors =
    'button, .btn, [role="button"], a.button, input[type="button"], input[type="submit"]';
  const buttons = await page.$$(buttonSelectors);
  results.totalButtons = buttons.length;

  // ボタンのサイズチェック（最小44x44px）- 改善版
  results.touchTargetSize = await page.evaluate(selectors => {
    const buttons = document.querySelectorAll(selectors);
    let validCount = 0;
    const details = [];

    buttons.forEach((btn, index) => {
      const style = window.getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      const computedHeight = parseFloat(style.minHeight) || rect.height;
      const computedWidth = parseFloat(style.minWidth) || rect.width;

      if (computedHeight >= 44 && computedWidth >= 44) {
        validCount++;
      } else {
        details.push({
          index,
          text: btn.textContent.trim().substring(0, 20),
          height: computedHeight,
          width: computedWidth
        });
      }
    });

    return {
      valid: validCount,
      total: buttons.length,
      percentage: buttons.length > 0 ? ((validCount / buttons.length) * 100).toFixed(1) : 0,
      invalidButtons: details.slice(0, 5) // First 5 invalid buttons for debugging
    };
  }, buttonSelectors);

  // ホバー効果の確認
  if (buttons.length > 0) {
    try {
      const testButton = await page.$('.btn-primary, .btn');
      if (testButton) {
        await testButton.scrollIntoViewIfNeeded();

        const initialStyle = await testButton.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            transform: style.transform,
            boxShadow: style.boxShadow
          };
        });

        await testButton.hover();
        await wait(300);

        const hoverStyle = await testButton.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            transform: style.transform,
            boxShadow: style.boxShadow
          };
        });

        results.hasHoverEffect =
          initialStyle.backgroundColor !== hoverStyle.backgroundColor ||
          initialStyle.transform !== hoverStyle.transform ||
          initialStyle.boxShadow !== hoverStyle.boxShadow;
      }
    } catch (error) {
      results.hasHoverEffect = false;
      results.hoverError = error.message;
    }
  }

  return results;
}

async function validateTypographyEnhanced(page) {
  const results = {};

  // フォントサイズの検証
  results.fontSize = await page.evaluate(() => {
    const { body } = document;
    const baseFontSize = parseInt(window.getComputedStyle(body).fontSize);
    const textElements = document.querySelectorAll('p, li, span, div, td');
    let tooSmall = 0;

    textElements.forEach(el => {
      const fontSize = parseInt(window.getComputedStyle(el).fontSize);
      if (fontSize < 14) {tooSmall++;}
    });

    return {
      base: baseFontSize,
      tooSmallCount: tooSmall,
      adequate: tooSmall === 0
    };
  });

  // コントラスト比の詳細チェック
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

    const elements = document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, .text, a, button, .btn, li, span:not(:empty)'
    );
    let goodContrast = 0;
    let poorContrast = 0;
    const details = [];

    elements.forEach(el => {
      const style = window.getComputedStyle(el);

      // Get actual background color including parent backgrounds
      let bgEl = el;
      let bgColor = style.backgroundColor;
      while (bgColor === 'rgba(0, 0, 0, 0)' && bgEl.parentElement) {
        bgEl = bgEl.parentElement;
        bgColor = window.getComputedStyle(bgEl).backgroundColor;
      }

      const bgMatch = bgColor.match(/\d+/g);
      const textMatch = style.color.match(/\d+/g);

      if (bgMatch && textMatch) {
        const contrast = getContrast(
          textMatch.slice(0, 3).map(Number),
          bgMatch.slice(0, 3).map(Number)
        );

        if (contrast >= 4.5) {
          goodContrast++;
        } else if (contrast >= 3 && parseInt(style.fontSize) >= 18) {
          // Large text has lower requirement
          goodContrast++;
        } else {
          poorContrast++;
          if (details.length < 5) {
            details.push({
              element: el.tagName,
              text: el.textContent.trim().substring(0, 30),
              contrast: contrast.toFixed(2),
              color: style.color,
              bgColor
            });
          }
        }
      }
    });

    return {
      goodContrast,
      poorContrast,
      percentage: elements.length > 0 ? ((goodContrast / elements.length) * 100).toFixed(1) : 0,
      details
    };
  });

  return results;
}

async function validateInteractions(page) {
  const results = {};

  // モーダルの動作確認
  try {
    const modalSelectors = [
      '#registration-button button',
      '[data-action="register-listener"]',
      '[data-action="register-speaker"]',
      '.btn-register',
      '#register-btn'
    ];

    let modalTrigger = null;
    for (const selector of modalSelectors) {
      try {
        modalTrigger = await page.waitForSelector(selector, { timeout: 1000 });
        if (modalTrigger) {break;}
      } catch (e) {
        continue;
      }
    }

    if (modalTrigger) {
      await modalTrigger.scrollIntoViewIfNeeded();
      await wait(100);
      await page.evaluate(el => el.click(), modalTrigger);
      await wait(500);

      const modalVisible = await page.evaluate(() => {
        const modal = document.querySelector(
          '.modal:not([style*="display: none"]), [role="dialog"]:not([style*="display: none"])'
        );
        return modal !== null;
      });

      results.modalFunctionality = modalVisible;

      if (modalVisible) {
        const closeButton = await page.$('.modal__close, .modal-close, [data-modal-close]');
        if (closeButton) {
          await page.evaluate(el => el.click(), closeButton);
          await wait(500);
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
  console.log('\n📊 Enhanced UI/UX検証サマリー');
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
          if (result.percentage < 95) {
            status = '⚠️';
            totalIssues++;
            message = `${result.percentage}%が推奨サイズ`;
            if (result.invalidButtons?.length > 0) {
              message += ` (例: ${result.invalidButtons[0].text})`;
            }
          } else {
            totalPassed++;
          }
        } else if (category === 'typography' && test === 'contrast') {
          if (result.percentage < 90) {
            status = '⚠️';
            totalIssues++;
            message = `${result.poorContrast}要素が低コントラスト`;
            if (result.details?.length > 0) {
              message += ` (例: ${result.details[0].element} - ${result.details[0].contrast})`;
            }
          } else {
            totalPassed++;
          }
        } else if (category === 'layout' && test === 'centeredContent' && !result) {
          status = '⚠️';
          totalIssues++;
          message = 'コンテナの中央配置が検出されませんでした';
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

  console.log('\n📁 詳細レポート: reports/ui-validation-enhanced-report.json');
  console.log('📸 スクリーンショット: screenshots/ui-validation-enhanced-*.png');
}

// 実行
runUIValidation().catch(console.error);
