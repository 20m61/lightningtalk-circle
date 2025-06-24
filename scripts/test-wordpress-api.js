#!/usr/bin/env node

/**
 * WordPress REST API テストスクリプト
 */

require('dotenv').config();

async function testWordPressAPI() {
  const fetch = (await import('node-fetch')).default;

  const authString = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');

  console.log('🔍 WordPress REST API テスト');
  console.log('===========================');

  try {
    // 1. サイト情報の取得
    console.log('1. サイト情報確認...');
    const siteResponse = await fetch(`${process.env.WP_API_URL}/settings`, {
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      }
    });

    if (siteResponse.ok) {
      const siteData = await siteResponse.json();
      console.log(`   サイト名: ${siteData.title}`);
      console.log(`   説明: ${siteData.description}`);
      console.log(`   URL: ${siteData.url}`);
      console.log(`   タイムゾーン: ${siteData.timezone}`);
    }

    // 2. 現在のテーマ確認
    console.log('\\n2. インストール済みテーマ...');
    const themesResponse = await fetch(`${process.env.WP_API_URL}/themes`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    if (themesResponse.ok) {
      const themes = await themesResponse.json();
      themes.forEach(theme => {
        const status = theme.status === 'active' ? '(有効)' : '';
        console.log(`   - ${theme.name.rendered} ${status}`);
      });
    }

    // 3. ユーザー情報確認
    console.log('\\n3. ユーザー情報...');
    const userResponse = await fetch(`${process.env.WP_API_URL}/users/me`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log(`   ユーザー名: ${userData.name}`);
      console.log(`   メール: ${userData.email}`);
      console.log(`   権限: ${userData.roles.join(', ')}`);
    }

    // 4. プラグイン確認
    console.log('\\n4. インストール済みプラグイン...');
    const pluginsResponse = await fetch(`${process.env.WP_API_URL}/plugins`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    if (pluginsResponse.ok) {
      const plugins = await pluginsResponse.json();
      plugins.forEach(plugin => {
        const status = plugin.status === 'active' ? '(有効)' : '';
        console.log(`   - ${plugin.name} ${status}`);
      });
    }

    console.log('\\n✅ WordPress REST API テスト完了');

  } catch (error) {
    console.error('❌ API テストエラー:', error.message);
  }
}

testWordPressAPI();
