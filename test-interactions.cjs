const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log('=== Lightning Talk Circle インタラクションテスト ===');

  try {
    // メインページに移動
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.btn', { timeout: 5000 });

    console.log('✓ ページ読み込み完了');

    // アプリの初期化完了を待機
    await page.waitForFunction(
      () =>
        window.lightningTalkApp &&
        window.lightningTalkApp.handleAction &&
        typeof window.lightningTalkApp.handleAction === 'function',
      { timeout: 10000 }
    );

    // JavaScriptの初期化状態をチェック
    const appInitialized = await page.evaluate(() => {
      return {
        LightningTalkApp: typeof window.LightningTalkApp,
        lightningTalkApp: typeof window.lightningTalkApp,
        hasHandleAction:
          window.lightningTalkApp && typeof window.lightningTalkApp.handleAction === 'function',
        methods: window.lightningTalkApp
          ? Object.getOwnPropertyNames(Object.getPrototypeOf(window.lightningTalkApp)).filter(
              m => m !== 'constructor'
            )
          : []
      };
    });

    console.log('JavaScript初期化状態:', appInitialized);

    // 参加登録ボタンをテスト
    const registerButtons = await page.$$('[data-action="register-listener"]');
    console.log(`参加登録ボタン: ${registerButtons.length}個発見`);

    // 発表申込みボタンをテスト
    const speakerButtons = await page.$$('[data-action="register-speaker"]');
    console.log(`発表申込みボタン: ${speakerButtons.length}個発見`);

    // ナビゲーションリンクをテスト
    const navLinks = await page.$$eval('.nav-link', links =>
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      }))
    );
    console.log('ナビゲーションリンク:', navLinks);

    // アンカーリンクのテスト
    const anchorLinks = await page.$$eval('a[href^="#"]', links =>
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      }))
    );
    console.log('アンカーリンク:', anchorLinks);

    // 実際にボタンをクリックしてテスト
    if (registerButtons.length > 0) {
      console.log('\n=== 参加登録ボタンテスト ===');

      // コンソールログをキャプチャ
      page.on('console', msg => {
        if (msg.type() === 'log' || msg.type() === 'error') {
          console.log(`[Browser Console] ${msg.text()}`);
        }
      });

      await registerButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // イベントハンドラーの動作確認
      const clickResult = await page.evaluate(() => {
        const btn = document.querySelector('[data-action="register-listener"]');
        if (!btn) return 'ボタンが見つかりません';

        // data-action属性確認
        const action = btn.getAttribute('data-action');

        // handleActionメソッドを直接呼び出し
        if (window.lightningTalkApp && window.lightningTalkApp.handleAction) {
          try {
            window.lightningTalkApp.handleAction(action, btn);
            return `handleAction('${action}') 実行成功`;
          } catch (error) {
            return `handleAction エラー: ${error.message}`;
          }
        } else {
          return 'handleActionメソッドが見つかりません';
        }
      });

      console.log('ボタンクリック結果:', clickResult);

      // モーダルが表示されたかチェック
      const modal = await page.$('.modal');
      if (modal) {
        const modalInfo = await page.evaluate(el => {
          return {
            display: window.getComputedStyle(el).display,
            id: el.id,
            className: el.className,
            innerHTML: el.innerHTML.substring(0, 200) + '...'
          };
        }, modal);

        console.log('モーダル情報:', modalInfo);

        if (modalInfo.display !== 'none') {
          console.log('✓ 参加登録モーダルが正常に表示されました');
        } else {
          console.log('✗ 参加登録モーダルが非表示状態です');
        }
      } else {
        console.log('✗ 参加登録モーダル要素が見つかりません');
      }
    }

    // アンカーリンクのテスト
    if (anchorLinks.length > 0) {
      console.log('\n=== アンカーリンクテスト ===');
      for (const link of anchorLinks.slice(0, 3)) {
        // 最初の3つをテスト
        try {
          const targetExists = await page.$(link.href);
          if (targetExists) {
            console.log(`✓ アンカー "${link.href}" の対象要素が存在します`);
          } else {
            console.log(`✗ アンカー "${link.href}" の対象要素が見つかりません`);
          }
        } catch (error) {
          console.log(`✗ アンカー "${link.href}" テストエラー: ${error.message}`);
        }
      }
    }

    console.log('\n=== テスト完了 ===');
  } catch (error) {
    console.error('テストエラー:', error);
  } finally {
    await browser.close();
  }
})();
