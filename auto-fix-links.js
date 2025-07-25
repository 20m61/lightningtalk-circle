import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeAndFixIssues() {
  console.log('🔍 Lightning Talk Circle - 自動問題分析・修正ツール');
  console.log('=====================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // コンソールメッセージを収集
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // エラーを収集
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        stack: error.stack
      });
    });

    console.log('📱 本番環境にアクセス中...');
    await page.goto('https://xn--6wym69a.com', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('\n📊 ページ分析結果:');
    console.log('=================');

    // 1. JavaScriptエラーの確認
    console.log('\n1️⃣ JavaScriptエラー:');
    const jsErrors = consoleMessages.filter(msg => msg.type === 'error');
    if (jsErrors.length > 0) {
      jsErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.text}`);
        if (error.location?.url) {
          console.log(`      URL: ${error.location.url}:${error.location.lineNumber}`);
        }
      });
    } else {
      console.log('   ✅ エラーなし');
    }

    // 2. リンクの動作確認
    console.log('\n2️⃣ フッターリンクの検証:');
    const links = await page.evaluate(() => {
      const footerLinks = document.querySelectorAll('.footer-links a');
      return Array.from(footerLinks).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        target: link.target
      }));
    });

    for (const link of links) {
      console.log(`\n   📌 ${link.text}:`);
      console.log(`      URL: ${link.href}`);
      console.log(`      Target: ${link.target || 'same window'}`);

      // リンクをクリックしてナビゲーションを確認
      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => null),
        page.click(`a[href="${link.href.replace('https://xn--6wym69a.com', '')}"]`)
      ]);

      if (response) {
        const currentUrl = page.url();
        console.log(`      ✅ ナビゲーション成功: ${currentUrl}`);

        // ページタイトルを確認
        const title = await page.title();
        console.log(`      タイトル: ${title}`);

        // 元のページに戻る
        await page.goto('https://xn--6wym69a.com', { waitUntil: 'networkidle0' });
      } else {
        console.log(`      ❌ ナビゲーションが発生しませんでした`);
      }
    }

    // 3. main.js のモジュールエラー修正案
    console.log('\n3️⃣ 修正提案:');
    console.log('================');

    if (jsErrors.some(e => e.text.includes('Cannot use import statement'))) {
      console.log('\n📝 main.js モジュールエラーの修正:');
      console.log(
        '   問題: main.jsがES6モジュールとしてビルドされているが、通常のスクリプトとして読み込まれている'
      );
      console.log('\n   修正案1: index.htmlでtype="module"を追加');
      console.log('   <script src="js/main.js" type="module"></script>');
      console.log('\n   修正案2: publicディレクトリの元のmain.jsを使用');
      console.log('   ViteビルドではなくオリジナルのJSファイルをデプロイ');

      // 自動修正: publicのmain.jsをdistにコピー
      const publicMainJs = path.join(__dirname, 'public', 'js', 'main.js');
      const distMainJs = path.join(__dirname, 'dist', 'js', 'main.js');

      try {
        await fs.copyFile(publicMainJs, distMainJs);
        console.log('\n   ✅ public/js/main.js を dist/js/main.js にコピーしました');
      } catch (error) {
        console.log('\n   ❌ ファイルコピーエラー:', error.message);
      }
    }

    // 4. Service Worker の確認
    console.log('\n4️⃣ Service Worker の状態:');
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations();
    });

    if (swRegistration.length > 0) {
      console.log('   ⚠️  Service Workerが登録されています');
      console.log('   これがリンクの動作に影響している可能性があります');
    } else {
      console.log('   ✅ Service Workerは登録されていません');
    }

    // 5. ネットワークリクエストの監視
    console.log('\n5️⃣ ネットワークリクエスト分析:');
    page.on('request', request => {
      if (request.url().includes('.html')) {
        console.log(`   📡 HTMLリクエスト: ${request.url()}`);
      }
    });

    // プライバシーポリシーへの直接アクセステスト
    console.log('\n6️⃣ 直接URLアクセステスト:');
    await page.goto('https://xn--6wym69a.com/privacy.html', { waitUntil: 'networkidle0' });
    const privacyTitle = await page.title();
    console.log(`   プライバシーポリシー: ${privacyTitle}`);

    await page.goto('https://xn--6wym69a.com/terms.html', { waitUntil: 'networkidle0' });
    const termsTitle = await page.title();
    console.log(`   利用規約: ${termsTitle}`);

    await page.goto('https://xn--6wym69a.com/contact.html', { waitUntil: 'networkidle0' });
    const contactTitle = await page.title();
    console.log(`   お問い合わせ: ${contactTitle}`);
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n✨ 分析完了！');
  console.log('\n📋 次のステップ:');
  console.log('1. dist/js/main.js をS3にアップロード');
  console.log('2. CloudFrontキャッシュを無効化');
  console.log('3. 問題が解決しない場合は、Service Workerの無効化を検討');
}

// メイン実行
analyzeAndFixIssues().catch(console.error);
