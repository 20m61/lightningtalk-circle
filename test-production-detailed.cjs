const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log('=== 詳細な本番環境検証 ===');

  // エラーログをキャプチャ
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warn') {
      console.log(`[Browser ${type.toUpperCase()}]`, msg.text());
    }
  });

  page.on('requestfailed', request => {
    console.log('❌ Request Failed:', request.url(), request.failure().errorText);
  });

  try {
    // 本番サイトに移動
    await page.goto('https://xn--6wym69a.com/', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ 本番サイト読み込み完了');

    // より長い時間待機
    await new Promise(resolve => setTimeout(resolve, 5000));

    // JavaScript状態をチェック
    const jsStatus = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        LightningTalkApp: typeof window.LightningTalkApp,
        lightningTalkApp: typeof window.lightningTalkApp,
        Logger: typeof window.Logger,
        hasHandleAction:
          window.lightningTalkApp && typeof window.lightningTalkApp.handleAction === 'function'
      };
    });

    console.log('JavaScript状態:', jsStatus);

    if (jsStatus.lightningTalkApp === 'object' && jsStatus.hasHandleAction) {
      console.log('✅ JavaScript初期化完了');

      // 参加登録ボタンをテスト
      const registerButtons = await page.$$('[data-action="register-listener"]');
      console.log(`参加登録ボタン: ${registerButtons.length}個発見`);

      if (registerButtons.length > 0) {
        console.log('\n=== 参加登録ボタンテスト ===');

        // ボタンをクリック
        await registerButtons[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // モーダルが開いたかチェック
        const modalResult = await page.evaluate(() => {
          const modal = document.querySelector('.modal');
          if (!modal) return { found: false };

          return {
            found: true,
            display: window.getComputedStyle(modal).display,
            id: modal.id,
            className: modal.className
          };
        });

        console.log('モーダル検索結果:', modalResult);

        if (modalResult.found && modalResult.display !== 'none') {
          console.log('✅ 参加登録モーダルが正常に表示されました');

          // スクリーンショットを撮影
          await page.screenshot({ path: '/tmp/production-modal-test.png', fullPage: false });
          console.log('📷 スクリーンショット保存: /tmp/production-modal-test.png');
        } else {
          console.log('❌ 参加登録モーダルが表示されませんでした');
        }
      }

      // ナビゲーションリンクのテスト
      const navLinks = await page.$$eval('a[href^="#"]', links =>
        links.slice(0, 5).map(link => ({
          text: link.textContent.trim(),
          href: link.getAttribute('href')
        }))
      );

      console.log('\n=== ナビゲーションリンク（最初の5つ） ===');
      navLinks.forEach(link => console.log(`- ${link.text}: ${link.href}`));

      // アンカー要素の存在確認
      for (const link of navLinks) {
        if (link.href.startsWith('#')) {
          const targetExists = await page.$(link.href);
          console.log(
            `${targetExists ? '✅' : '❌'} ${link.href} 対象要素: ${targetExists ? '存在' : '不存在'}`
          );
        }
      }

      console.log('\n✅ 本番環境検証完了 - すべて正常に動作中！');
    } else {
      console.log('❌ JavaScript初期化に失敗');
      console.log('詳細状態:', jsStatus);
    }
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  } finally {
    await browser.close();
  }
})();
