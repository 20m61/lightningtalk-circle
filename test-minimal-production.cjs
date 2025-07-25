const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log('=== 最小限の本番環境テスト ===');

  // エラーログをキャプチャ
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  // Create a minimal test page that only loads the essential scripts
  const minimalHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Minimal Test</title>
</head>
<body>
    <div class="hero">
        <button data-action="register-listener">Test Button</button>
    </div>
    
    <div id="registerModal" class="modal" style="display: none;">
        <div class="modal-content">
            <div id="modalBody">Modal Content</div>
        </div>
    </div>
    
    <script>
        console.log('Testing script loading...');
    </script>
    
    <!-- Test script loading one by one -->
    <script src="https://xn--6wym69a.com/js/logger.js"></script>
    <script>
        console.log('Logger loaded:', typeof window.Logger);
    </script>
    
    <script src="https://xn--6wym69a.com/js/main.js"></script>
    <script>
        console.log('Main.js loaded:', typeof window.LightningTalkApp);
        setTimeout(() => {
            console.log('App instance:', typeof window.lightningTalkApp);
            if (window.lightningTalkApp && window.lightningTalkApp.handleAction) {
                console.log('✅ App is ready for interaction!');
            } else {
                console.log('❌ App not properly initialized');
            }
        }, 2000);
    </script>
</body>
</html>`;

  try {
    // Set page content directly
    await page.setContent(minimalHtml, { waitUntil: 'networkidle2' });
    console.log('✅ 最小限ページ読み込み完了');

    // Wait for scripts to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check status
    const status = await page.evaluate(() => {
      return {
        Logger: typeof window.Logger,
        LightningTalkApp: typeof window.LightningTalkApp,
        lightningTalkApp: typeof window.lightningTalkApp,
        hasHandleAction:
          window.lightningTalkApp && typeof window.lightningTalkApp.handleAction === 'function'
      };
    });

    console.log('最小限構成でのJavaScript状態:', status);

    if (status.hasHandleAction) {
      console.log('✅ 最小限構成では正常に動作！');

      // Test button click
      const button = await page.$('[data-action="register-listener"]');
      if (button) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const modalVisible = await page.evaluate(() => {
          const modal = document.querySelector('.modal');
          return modal && window.getComputedStyle(modal).display !== 'none';
        });

        console.log(modalVisible ? '✅ モーダル正常表示' : '❌ モーダル表示失敗');
      }
    } else {
      console.log('❌ 最小限構成でも初期化失敗');
    }
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();
