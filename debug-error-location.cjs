const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log('=== エラー発生場所の特定 ===');

  // より詳細なエラーログをキャプチャ
  page.on('pageerror', error => {
    console.log('❌ Page Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  });

  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
  });

  // 特定のスクリプトファイルのエラーをキャッチ
  page.on('response', response => {
    const url = response.url();
    if (url.includes('.js') && !response.ok()) {
      console.log('JS File Error:', url, response.status());
    }
  });

  try {
    // JavaScriptエラーを無視せず、ページ読み込みを続行
    page.on('requestfailed', request => {
      console.log('Request Failed:', request.url(), request.failure().errorText);
    });

    // 本番サイトに移動
    await page.goto('https://xn--6wym69a.com/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('✅ ページ読み込み完了');

    // 少し待ってからJavaScript状態をチェック
    await new Promise(resolve => setTimeout(resolve, 3000));

    // グローバル変数の状態確認
    const globals = await page.evaluate(() => {
      const result = {};
      const checkVars = ['Logger', 'LightningTalkApp', 'lightningTalkApp', 'process'];

      checkVars.forEach(varName => {
        try {
          result[varName] = typeof window[varName];
        } catch (e) {
          result[varName] = `Error: ${e.message}`;
        }
      });

      return result;
    });

    console.log('グローバル変数状態:', globals);

    // process が定義されているかチェック
    const processCheck = await page.evaluate(() => {
      try {
        return typeof process;
      } catch (e) {
        return `Error: ${e.message}`;
      }
    });

    console.log('process変数状態:', processCheck);
  } catch (error) {
    console.error('❌ メインエラー:', error.message);
  } finally {
    await browser.close();
  }
})();
