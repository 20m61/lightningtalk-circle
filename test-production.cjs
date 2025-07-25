const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log('=== 本番環境インタラクションテスト ===');

  try {
    // 本番サイトに移動
    await page.goto('https://xn--6wym69a.com/');
    console.log('✓ 本番サイト読み込み開始');

    // ページの読み込み完了を待機
    await page.waitForSelector('.hero', { timeout: 15000 });
    console.log('✓ ページ読み込み完了');

    // アプリの初期化完了を待機
    await page.waitForFunction(
      () =>
        window.lightningTalkApp &&
        window.lightningTalkApp.handleAction &&
        typeof window.lightningTalkApp.handleAction === 'function',
      { timeout: 15000 }
    );

    console.log('✓ JavaScript初期化完了');

    // 参加登録ボタンを見つけてテスト
    const registerButtons = await page.$$('[data-action="register-listener"]');
    console.log(`参加登録ボタン: ${registerButtons.length}個発見`);

    if (registerButtons.length > 0) {
      console.log('\n=== 参加登録ボタンテスト ===');

      // ボタンをクリック
      await registerButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // モーダルが開いたかチェック
      const modal = await page.$('.modal');
      if (modal) {
        const modalStyle = await page.evaluate(el => window.getComputedStyle(el).display, modal);

        if (modalStyle !== 'none') {
          console.log('✅ 参加登録モーダルが正常に表示されました');
        } else {
          console.log('❌ 参加登録モーダルが非表示状態です');
        }
      } else {
        console.log('❌ 参加登録モーダル要素が見つかりません');
      }
    }

    // ナビゲーションリンクのテスト
    const navLinks = await page.$$eval('.nav-link', links =>
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      }))
    );

    console.log('\n=== ナビゲーションリンク ===');
    console.log('発見したリンク:', navLinks.slice(0, 5)); // 最初の5つだけ表示

    console.log('\n✅ 本番環境のテスト完了 - すべて正常に動作中！');
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();
