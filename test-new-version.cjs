const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log('=== 新バージョンファイルでのテスト ===');

  // エラーログをキャプチャ
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  // 新しいバージョンのmain.jsを使用したテストHTML
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Version Test</title>
</head>
<body>
    <div class="hero">
        <button data-action="register-listener">参加登録テスト</button>
    </div>
    
    <div id="registerModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);">
        <div class="modal-content" style="background: white; margin: 10% auto; padding: 20px; width: 80%; max-width: 600px;">
            <div id="modalBody">モーダル内容</div>
        </div>
    </div>
    
    <script src="https://xn--6wym69a.com/js/logger.js"></script>
    <script src="https://xn--6wym69a.com/js/main-v2.js"></script>
    
    <script>
        console.log('Testing new version...');
        setTimeout(() => {
            console.log('LightningTalkApp:', typeof window.LightningTalkApp);
            console.log('lightningTalkApp:', typeof window.lightningTalkApp);
            console.log('handleAction available:', window.lightningTalkApp && typeof window.lightningTalkApp.handleAction === 'function');
        }, 3000);
    </script>
</body>
</html>`;

  try {
    await page.setContent(testHtml, { waitUntil: 'networkidle2' });
    console.log('✅ テストページ読み込み完了');

    // 少し待ってからJavaScript状態をチェック
    await new Promise(resolve => setTimeout(resolve, 5000));

    const status = await page.evaluate(() => {
      return {
        Logger: typeof window.Logger,
        LightningTalkApp: typeof window.LightningTalkApp,
        lightningTalkApp: typeof window.lightningTalkApp,
        hasHandleAction:
          window.lightningTalkApp && typeof window.lightningTalkApp.handleAction === 'function'
      };
    });

    console.log('JavaScript状態:', status);

    if (status.hasHandleAction) {
      console.log('✅ 新バージョンは正常に動作！');

      // ボタンクリックテスト
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
      console.log('❌ 新バージョンでも初期化失敗');
    }
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();
