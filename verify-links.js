#!/usr/bin/env node

/**
 * リンク動作検証スクリプト
 * 本番サイトでの修正結果を確認
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyLinks() {
  console.log('🔍 Lightning Talk Circle - リンク動作検証');
  console.log('==========================================\n');

  // 検証対象のリンク
  const linksToTest = [
    {
      name: 'プライバシーポリシー',
      url: 'https://xn--6wym69a.com/privacy.html',
      expectedTitle: 'プライバシーポリシー'
    },
    {
      name: '利用規約',
      url: 'https://xn--6wym69a.com/terms.html',
      expectedTitle: '利用規約'
    },
    {
      name: 'お問い合わせ',
      url: 'https://xn--6wym69a.com/contact.html',
      expectedTitle: 'お問い合わせ'
    }
  ];

  console.log('📱 本番サイトのリンクを検証中...\n');

  // 修正ファイルが正しくデプロイされているかを確認
  console.log('1️⃣ デプロイメント確認:');

  try {
    // fetch を使って fix-navigation.js が存在するか確認
    const response = await fetch('https://xn--6wym69a.com/js/fix-navigation.js');
    if (response.ok) {
      console.log('   ✅ fix-navigation.js が正常にデプロイされています');
    } else {
      console.log('   ❌ fix-navigation.js が見つかりません (status:', response.status, ')');
    }
  } catch (error) {
    console.log('   ❌ fix-navigation.js の確認でエラー:', error.message);
  }

  try {
    // service-worker.js の確認
    const swResponse = await fetch('https://xn--6wym69a.com/service-worker.js');
    if (swResponse.ok) {
      const swContent = await swResponse.text();
      if (swContent.includes("request.mode === 'navigate'")) {
        console.log('   ✅ Service Worker が正しく修正されています');
      } else {
        console.log('   ⚠️  Service Worker の修正が反映されていない可能性があります');
      }
    }
  } catch (error) {
    console.log('   ❌ Service Worker の確認でエラー:', error.message);
  }

  console.log('\n2️⃣ 個別リンクの動作確認:');

  for (const link of linksToTest) {
    console.log(`\n   📌 ${link.name}:`);
    console.log(`      URL: ${link.url}`);

    try {
      const response = await fetch(link.url, {
        method: 'HEAD',
        redirect: 'follow'
      });

      if (response.ok) {
        console.log(`      ✅ ステータス: ${response.status} ${response.statusText}`);
        console.log(`      最終URL: ${response.url}`);

        // リダイレクトの確認
        if (response.url !== link.url) {
          console.log(`      ⚠️  リダイレクトが発生しました`);
          if (response.url.includes('index.html') || response.url === 'https://xn--6wym69a.com/') {
            console.log(`      ❌ トップページにリダイレクトされています`);
          }
        } else {
          console.log(`      ✅ 直接アクセス成功`);
        }
      } else {
        console.log(`      ❌ エラー: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`      ❌ 接続エラー: ${error.message}`);
    }
  }

  console.log('\n3️⃣ JavaScript エラーの確認:');

  try {
    // main.js の確認
    const mainJsResponse = await fetch('https://xn--6wym69a.com/js/main.js');
    if (mainJsResponse.ok) {
      const mainJsContent = await mainJsResponse.text();

      if (mainJsContent.includes('import{') || mainJsContent.includes('import ')) {
        console.log('   ❌ main.js がまだES6モジュール形式です');
      } else {
        console.log('   ✅ main.js が修正されています');
      }
    }
  } catch (error) {
    console.log('   ❌ main.js の確認でエラー:', error.message);
  }

  console.log('\n4️⃣ ブラウザでの動作テスト推奨:');
  console.log('   以下のステップで手動確認を推奨します:');
  console.log('   1. https://xn--6wym69a.com を開く');
  console.log('   2. 開発者ツールのコンソールを確認');
  console.log('   3. フッターの各リンクをクリックして動作確認');
  console.log('   4. JavaScriptエラーが解消されているか確認');

  console.log('\n✨ 検証完了！');
}

// 実行
verifyLinks().catch(console.error);
