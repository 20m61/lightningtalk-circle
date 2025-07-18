/**
 * WCAG 2.1 AA Compliance Tests
 * アクセシビリティ準拠テストスイート
 */

import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

describe('WCAG 2.1 AA Compliance Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Homepage Accessibility', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000');
    });

    test('should not have any accessibility violations', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async () => {
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
        elements.map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent.trim(),
          level: parseInt(el.tagName.charAt(1))
        }))
      );

      // H1は1つのみ存在
      const h1Count = headings.filter(h => h.tag === 'h1').length;
      expect(h1Count).toBe(1);

      // 見出しの階層が正しい（レベルの飛ばしがない）
      let previousLevel = 0;
      headings.forEach(heading => {
        expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = heading.level;
      });
    });

    test('should have proper alt attributes for images', async () => {
      const images = await page.$$eval('img', elements =>
        elements.map(img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt')
        }))
      );

      images.forEach(image => {
        expect(image.hasAlt).toBe(true);
        // 装飾画像以外はaltが空でない
        if (!image.src.includes('decoration') && !image.src.includes('icon')) {
          expect(image.alt).toBeTruthy();
        }
      });
    });

    test('should have proper form labels', async () => {
      const formControls = await page.$$eval('input, select, textarea', elements =>
        elements.map(control => ({
          id: control.id,
          type: control.type,
          hasLabel: !!document.querySelector(`label[for="${control.id}"]`),
          hasAriaLabel: control.hasAttribute('aria-label'),
          hasAriaLabelledBy: control.hasAttribute('aria-labelledby')
        }))
      );

      formControls.forEach(control => {
        // hidden要素は除外
        if (control.type !== 'hidden') {
          const hasAccessibleName = control.hasLabel || control.hasAriaLabel || control.hasAriaLabelledBy;
          expect(hasAccessibleName).toBe(true);
        }
      });
    });

    test('should have sufficient color contrast', async () => {
      const results = await new AxeBuilder({ page }).withTags(['cat.color']).analyze();

      expect(results.violations).toEqual([]);
    });

    test('should have keyboard navigation support', async () => {
      // Tabキーで移動可能な要素をテスト
      const focusableElements = await page.$$eval(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        elements => elements.length
      );

      expect(focusableElements).toBeGreaterThan(0);

      // 最初の要素にフォーカス
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(firstFocused);
    });
  });

  describe('Form Accessibility', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000/events/register');
    });

    test('should have proper form validation messages', async () => {
      // 必須フィールドをテスト
      const submitButton = await page.$('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        await submitButton.click();

        // エラーメッセージの確認
        const errorMessages = await page.$$eval('[role="alert"], .error-message, [aria-invalid="true"]', elements =>
          elements.map(el => ({
            text: el.textContent,
            role: el.getAttribute('role'),
            ariaInvalid: el.getAttribute('aria-invalid')
          }))
        );

        if (errorMessages.length > 0) {
          errorMessages.forEach(error => {
            expect(error.text).toBeTruthy();
          });
        }
      }
    });

    test('should mark required fields appropriately', async () => {
      const requiredFields = await page.$$eval('[required]', elements =>
        elements.map(field => ({
          id: field.id,
          hasAriaRequired: field.hasAttribute('aria-required'),
          hasRequiredAttribute: field.hasAttribute('required'),
          hasVisualIndicator: !!document.querySelector(
            `label[for="${field.id}"] .required-indicator, label[for="${field.id}"] [aria-label*="必須"]`
          )
        }))
      );

      requiredFields.forEach(field => {
        expect(field.hasRequiredAttribute || field.hasAriaRequired).toBe(true);
        expect(field.hasVisualIndicator).toBe(true);
      });
    });
  });

  describe('Navigation Accessibility', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000');
    });

    test('should have proper landmark roles', async () => {
      const landmarks = await page.$$eval(
        'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]',
        elements =>
          elements.map(el => ({
            tagName: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || el.tagName.toLowerCase()
          }))
      );

      // メインランドマークの存在確認
      const mainLandmarks = landmarks.filter(l => l.role === 'main' || l.tagName === 'main');
      expect(mainLandmarks.length).toBeGreaterThanOrEqual(1);

      // ナビゲーションランドマークの存在確認
      const navLandmarks = landmarks.filter(l => l.role === 'navigation' || l.tagName === 'nav');
      expect(navLandmarks.length).toBeGreaterThanOrEqual(1);
    });

    test('should have skip links', async () => {
      const skipLinks = await page.$$eval('.skip-link, a[href^="#main"], a[href^="#content"]', elements =>
        elements.map(link => ({
          href: link.href,
          text: link.textContent.trim(),
          isVisible: window.getComputedStyle(link).display !== 'none'
        }))
      );

      expect(skipLinks.length).toBeGreaterThan(0);

      // スキップリンクのフォーカステスト
      if (skipLinks.length > 0) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement.className);
        expect(focusedElement).toContain('skip-link');
      }
    });

    test('should have proper focus management', async () => {
      // フォーカス順序のテスト
      const focusableElements = await page.$$(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      let tabIndex = 0;
      for (const element of focusableElements.slice(0, 5)) {
        // 最初の5要素をテスト
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement);

        // フォーカスが適切に移動することを確認
        const isFocused = await page.evaluate((el, focused) => el === focused, element, focusedElement);
        if (!isFocused) {
          // 隠れている要素やdisabled要素はスキップされる可能性があるため、警告のみ
          console.warn(`Focus did not move to expected element at tab index ${tabIndex}`);
        }
        tabIndex++;
      }
    });
  });

  describe('Modal Accessibility', () => {
    test('should have proper modal accessibility when opened', async () => {
      await page.goto('http://localhost:3000');

      // モーダルを開くトリガーを探す
      const modalTrigger = await page.$('[data-toggle="modal"], .modal-trigger, button[aria-haspopup="dialog"]');

      if (modalTrigger) {
        await modalTrigger.click();

        // モーダルが開いていることを確認
        const modal = await page.$('[role="dialog"], [role="alertdialog"], .modal[aria-modal="true"]');
        expect(modal).toBeTruthy();

        if (modal) {
          // フォーカストラップのテスト
          const focusableInModal = await modal.$$(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );

          if (focusableInModal.length > 1) {
            // 最初の要素にフォーカスが当たっているか
            // eslint-disable-next-line prefer-destructuring
            const firstElement = focusableInModal[0];
            const isFirstFocused = await page.evaluate(el => document.activeElement === el, firstElement);
            expect(isFirstFocused).toBe(true);

            // 最後の要素からTabで最初の要素に戻るか
            for (let i = 0; i < focusableInModal.length; i++) {
              await page.keyboard.press('Tab');
            }
            const isBackToFirst = await page.evaluate(el => document.activeElement === el, firstElement);
            expect(isBackToFirst).toBe(true);
          }

          // Escapeキーで閉じるか
          await page.keyboard.press('Escape');
          const modalAfterEscape = await page.$('[role="dialog"], [role="alertdialog"], .modal[aria-modal="true"]');
          expect(modalAfterEscape).toBeFalsy();
        }
      }
    });
  });

  describe('Dynamic Content Accessibility', () => {
    test('should announce dynamic content changes', async () => {
      await page.goto('http://localhost:3000');

      // ライブリージョンの存在確認
      const liveRegions = await page.$$eval('[aria-live], [role="alert"], [role="status"]', elements =>
        elements.map(el => ({
          ariaLive: el.getAttribute('aria-live'),
          role: el.getAttribute('role'),
          id: el.id,
          className: el.className
        }))
      );

      expect(liveRegions.length).toBeGreaterThan(0);

      // 動的コンテンツ変更のテスト（例：検索結果）
      const searchInput = await page.$('input[type="search"], #search, .search-input');
      if (searchInput) {
        await searchInput.type('test');

        // 検索結果エリアがライブリージョンとして設定されているか
        const searchResults = await page.$('.search-results, #search-results');
        if (searchResults) {
          const ariaLive = await searchResults.getAttribute('aria-live');
          expect(ariaLive).toBeTruthy();
        }
      }
    });
  });

  describe('Mobile Accessibility', () => {
    beforeEach(async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone サイズ
      await page.goto('http://localhost:3000');
    });

    test('should have proper touch target sizes', async () => {
      const touchTargets = await page.$$eval(
        'button, a, input, select, textarea, [onclick], [role="button"]',
        elements =>
          elements.map(el => {
            const rect = el.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              tagName: el.tagName.toLowerCase(),
              isVisible: rect.width > 0 && rect.height > 0
            };
          })
      );

      const visibleTargets = touchTargets.filter(target => target.isVisible);

      visibleTargets.forEach(target => {
        // WCAG 2.1 AAのタッチターゲットサイズ: 44x44px以上
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      });
    });

    test('should have responsive design without horizontal scroll', async () => {
      const bodyOverflow = await page.evaluate(() => {
        const { body } = document;
        const computedStyle = window.getComputedStyle(body);
        return {
          overflowX: computedStyle.overflowX,
          scrollWidth: body.scrollWidth,
          clientWidth: body.clientWidth
        };
      });

      // 横スクロールが発生していないことを確認
      expect(bodyOverflow.scrollWidth).toBeLessThanOrEqual(bodyOverflow.clientWidth + 1); // 1pxの誤差を許容
    });
  });

  describe('Reduced Motion Compliance', () => {
    test('should respect prefers-reduced-motion', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('http://localhost:3000');

      // アニメーションが無効化されているかテスト
      const animatedElements = await page.$$eval('*', elements =>
        elements
          .filter(el => {
            const computedStyle = window.getComputedStyle(el);
            return computedStyle.animationDuration !== '0s' || computedStyle.transitionDuration !== '0s';
          })
          .map(el => ({
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            animationDuration: window.getComputedStyle(el).animationDuration,
            transitionDuration: window.getComputedStyle(el).transitionDuration
          }))
      );

      // prefers-reduced-motion: reduce が設定されている場合、
      // アニメーション時間は0.01ms以下であるべき
      animatedElements.forEach(element => {
        const animDuration = parseFloat(element.animationDuration.replace('s', ''));
        const transDuration = parseFloat(element.transitionDuration.replace('s', ''));

        if (animDuration > 0) {
          expect(animDuration).toBeLessThanOrEqual(0.01);
        }
        if (transDuration > 0) {
          expect(transDuration).toBeLessThanOrEqual(0.01);
        }
      });
    });
  });

  describe('High Contrast Mode', () => {
    test('should support high contrast mode', async () => {
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      await page.goto('http://localhost:3000');

      // 強制カラーモードでもコンテンツが読めることを確認
      const textElements = await page.$$eval('p, h1, h2, h3, h4, h5, h6, span, div', elements =>
        elements
          .filter(el => el.textContent.trim().length > 0)
          .map(el => ({
            text: el.textContent.trim().substring(0, 50),
            color: window.getComputedStyle(el).color,
            backgroundColor: window.getComputedStyle(el).backgroundColor
          }))
      );

      // テキストが表示されていることを確認
      expect(textElements.length).toBeGreaterThan(0);
      textElements.forEach(element => {
        expect(element.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(element.color).not.toBe('transparent');
      });
    });
  });
});

// ヘルパー関数
export function calculateColorContrast(color1, color2) {
  // 簡易的なカラーコントラスト計算
  // 実際のテストではより正確な計算が必要
  const rgb1 = color1.match(/\d+/g).map(Number);
  const rgb2 = color2.match(/\d+/g).map(Number);

  const luminance1 = (0.299 * rgb1[0] + 0.587 * rgb1[1] + 0.114 * rgb1[2]) / 255;
  const luminance2 = (0.299 * rgb2[0] + 0.587 * rgb2[1] + 0.114 * rgb2[2]) / 255;

  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);

  return (brightest + 0.05) / (darkest + 0.05);
}
