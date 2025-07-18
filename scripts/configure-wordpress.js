#!/usr/bin/env node

/**
 * WordPress設定自動化スクリプト（テーマアップロード後実行）
 */

require('dotenv').config();

async function configureWordPress() {
  const fetch = (await import('node-fetch')).default;
  const authString = Buffer.from(
    `${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`
  ).toString('base64');

  console.log('⚙️ WordPress設定自動化');
  console.log('=====================');
  console.log('');

  try {
    // 1. パーマリンク設定
    console.log('1. パーマリンク設定...');
    const permalinkResponse = await fetch(`${process.env.WP_API_URL}/settings`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        permalink_structure: '/%postname%/'
      })
    });

    if (permalinkResponse.ok) {
      console.log('✅ パーマリンクを投稿名形式に設定');
    } else {
      console.log('⚠️ パーマリンク設定: 手動で設定してください');
    }

    // 2. サイトタイトル確認・設定
    console.log('\\n2. サイト設定確認...');
    const siteResponse = await fetch(`${process.env.WP_API_URL}/settings`, {
      headers: {
        Authorization: `Basic ${authString}`
      }
    });

    if (siteResponse.ok) {
      const siteData = await siteResponse.json();
      console.log(`✅ サイト名: ${siteData.title}`);
      console.log(`✅ URL: ${siteData.url}`);
    }

    console.log('\\n✅ WordPress基本設定完了');
    console.log('\\n次のステップ: node scripts/create-sample-event.js');
  } catch (error) {
    console.error('❌ 設定エラー:', error.message);
    console.log('\\n手動設定が必要です:');
    console.log('- 設定 > パーマリンク > 投稿名 > 変更を保存');
  }
}

configureWordPress();
