const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log('=== アプリ初期化デバッグ ===');

  // ページのエラーをキャプチャ
  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
  });

  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warn') {
      console.log(`[Browser ${type.toUpperCase()}]`, msg.text());
    }
  });

  page.on('requestfailed', request => {
    console.log('Request Failed:', request.url(), request.failure().errorText);
  });

  try {
    // デバッグテストページに移動
    await page.goto('http://localhost:3000/test-debug.html');
    console.log('✓ ページ読み込み開始');

    // DOM読み込み完了を待機
    await page.waitForSelector('.hero-section', { timeout: 10000 });
    console.log('✓ DOM読み込み完了');

    // スクリプト読み込み状況をチェック
    const scriptsLoaded = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => ({
        src: script.src,
        loaded: script.readyState || 'unknown'
      }));
    });

    console.log('読み込まれたスクリプト:', scriptsLoaded);

    // 段階的に初期化状況をチェック
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const status = await page.evaluate(() => {
        return {
          iteration: window.debugIteration || 0,
          Logger: typeof window.Logger,
          LightningTalkApp: typeof window.LightningTalkApp,
          lightningTalkApp: typeof window.lightningTalkApp,
          DOMContentLoaded: document.readyState,
          hasHandleAction:
            window.lightningTalkApp && typeof window.lightningTalkApp.handleAction === 'function'
        };
      });

      // デバッグ情報を window に設定
      await page.evaluate(iteration => {
        window.debugIteration = iteration;
      }, i + 1);

      console.log(`チェック ${i + 1}:`, status);

      if (status.lightningTalkApp !== 'undefined') {
        console.log('✓ アプリ初期化完了！');
        break;
      }
    }

    // DOMContentLoadedイベントが発生したかチェック
    const domStatus = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        hasLoadedEvent: window.domContentLoadedFired || false
      };
    });

    console.log('DOM状態:', domStatus);

    // main.jsが実際に実行されているかチェック
    const mainJsExecuted = await page.evaluate(() => {
      // main.jsの最後にある window.LightningTalkApp の設定が実行されているかチェック
      return {
        LightningTalkAppExists: typeof window.LightningTalkApp === 'function',
        constructorExists:
          window.LightningTalkApp &&
          typeof window.LightningTalkApp.prototype.constructor === 'function'
      };
    });

    console.log('main.js実行状態:', mainJsExecuted);
  } catch (error) {
    console.error('デバッグエラー:', error.message);
  } finally {
    await browser.close();
  }
})();
