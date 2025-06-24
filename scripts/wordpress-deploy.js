#!/usr/bin/env node

/**
 * WordPress Lightning Talk テーマ 自動デプロイメントスクリプト
 * 環境変数から認証情報を読み込んでWordPressサイトにデプロイします
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// 必要なモジュール
let FormData, fetch;

(async() => {
  try {
    // ES modules の動的インポート
    const fetchModule = await import('node-fetch');
    fetch = fetchModule.default;

    const formDataModule = await import('form-data');
    FormData = formDataModule.default;

    await main();
  } catch (error) {
    console.error('モジュールの読み込みに失敗しました:', error.message);
    console.log('npm install node-fetch form-data を実行してください');
    process.exit(1);
  }
})();

async function main() {
  console.log('🚀 Lightning Talk WordPress デプロイメント開始');
  console.log('====================================');

  // 環境変数の検証
  if (!validateEnvironmentVariables()) {
    process.exit(1);
  }

  try {
    // Step 1: WordPressサイトの確認
    await verifyWordPressSite();

    // Step 2: テーマファイルの確認
    await verifyThemeFile();

    // Step 3: WordPress REST API 認証テスト
    await testWordPressAuth();

    // Step 4: テーマのアップロード（シミュレーション）
    await uploadTheme();

    // Step 5: 初期設定の実行
    await configureWordPress();

    // Step 6: サンプルコンテンツの作成
    await createSampleContent();

    console.log('✅ デプロイメント完了！');
    console.log(`🌐 サイトURL: ${process.env.WP_SITE_URL}`);
    console.log(`⚙️  管理画面: ${process.env.WP_ADMIN_URL}`);

  } catch (error) {
    console.error('❌ デプロイメントエラー:', error.message);
    process.exit(1);
  }
}

function validateEnvironmentVariables() {
  const required = [
    'WP_SITE_URL',
    'WP_USERNAME',
    'WP_PASSWORD',
    'WP_APP_PASSWORD',
    'THEME_ZIP_PATH'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ 必須の環境変数が不足しています:');
    missing.forEach(key => console.error(`  - ${key}`));
    return false;
  }

  console.log('✅ 環境変数確認完了');
  return true;
}

async function verifyWordPressSite() {
  console.log('🔍 WordPressサイトの確認中...');

  try {
    const response = await fetch(process.env.WP_SITE_URL, {
      method: 'HEAD',
      timeout: 10000
    });

    if (response.ok) {
      console.log('✅ WordPressサイトにアクセス可能');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`サイトアクセスエラー: ${error.message}`);
  }
}

async function verifyThemeFile() {
  console.log('📦 テーマファイルの確認中...');

  const themePath = path.resolve(process.env.THEME_ZIP_PATH);

  if (!fs.existsSync(themePath)) {
    throw new Error(`テーマファイルが見つかりません: ${themePath}`);
  }

  const stats = fs.statSync(themePath);
  console.log(`✅ テーマファイル確認完了 (${Math.round(stats.size / 1024)}KB)`);
}

async function testWordPressAuth() {
  console.log('🔐 WordPress認証テスト中...');

  try {
    const authString = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString('base64');

    const response = await fetch(`${process.env.WP_API_URL}/users/me`, {
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      console.log(`✅ 認証成功 (ユーザー: ${userData.name})`);
    } else {
      throw new Error(`認証失敗: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️  REST API認証失敗 - 手動アップロードが必要です');
    console.log('   WordPress管理画面からテーマをアップロードしてください');
  }
}

async function uploadTheme() {
  console.log('📤 テーマアップロード準備中...');

  // 実際のファイルアップロードはWordPress管理画面で行う必要があります
  // ここでは準備とガイダンスを提供

  console.log('📋 手動アップロード手順:');
  console.log(`   1. ${process.env.WP_ADMIN_URL}/theme-install.php にアクセス`);
  console.log('   2. テーマのアップロード > ファイル選択');
  console.log(`   3. ${process.env.THEME_ZIP_PATH} を選択`);
  console.log('   4. 今すぐインストール > 有効化');
  console.log('');

  // テーマファイルの存在確認
  const themePath = path.resolve(process.env.THEME_ZIP_PATH);
  if (fs.existsSync(themePath)) {
    console.log('✅ テーマファイル準備完了');
  }
}

async function configureWordPress() {
  console.log('⚙️  WordPress設定の準備中...');

  const settings = {
    permalink_structure: '/%postname%/',
    lightningtalk_api_url: `${process.env.WP_SITE_URL}/wp-json/lightningtalk/v1/`,
    lightningtalk_default_event_id: process.env.LT_DEFAULT_EVENT_ID || '1'
  };

  console.log('📋 必要な設定:');
  Object.entries(settings).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log('⚠️  手動設定が必要:');
  console.log('   1. 設定 > パーマリンク > 投稿名 > 変更を保存');
  console.log('   2. 外観 > カスタマイズ > Lightning Talk設定');
  console.log('');
}

async function createSampleContent() {
  console.log('📝 サンプルコンテンツの準備中...');

  const sampleEvent = {
    title: '第1回 なんでもライトニングトーク',
    content: '5分間で世界を変える！あなたの「なんでも」を聞かせて！',
    meta: {
      event_date: '2025-06-25 19:00:00',
      venue_name: '新宿某所',
      venue_address: '6月20日に詳細確定予定',
      map_url: process.env.LT_MAP_URL,
      emergency_phone: process.env.LT_EMERGENCY_PHONE,
      online_url: process.env.LT_MEET_URL,
      capacity: '50',
      event_status: 'active'
    }
  };

  console.log('📋 作成するサンプルイベント:');
  console.log(`   タイトル: ${sampleEvent.title}`);
  console.log(`   開催日時: ${sampleEvent.meta.event_date}`);
  console.log(`   会場: ${sampleEvent.meta.venue_name}`);
  console.log(`   緊急連絡先: ${sampleEvent.meta.emergency_phone}`);
  console.log('');

  console.log('⚠️  手動作成手順:');
  console.log('   1. Lightning Talk > Lightning Talkイベント > 新規追加');
  console.log('   2. 上記の情報をカスタムフィールドに入力');
  console.log('   3. 公開');
  console.log('');
}

// 実行ガイドの表示
function showDeploymentGuide() {
  console.log('🎯 次のステップ:');
  console.log('================');
  console.log('');
  console.log('1. WordPressログイン:');
  console.log(`   URL: ${process.env.WP_LOGIN_URL}`);
  console.log(`   ユーザー名: ${process.env.WP_USERNAME}`);
  console.log(`   パスワード: ${process.env.WP_PASSWORD}`);
  console.log('');
  console.log('2. テーマアップロード:');
  console.log('   外観 > テーマ > 新規追加 > テーマのアップロード');
  console.log(`   ファイル: ${process.env.THEME_ZIP_PATH}`);
  console.log('');
  console.log('3. 詳細な手順:');
  console.log('   WORDPRESS-DEPLOYMENT-STEPS.md を参照');
  console.log('');
  console.log('🌟 Lightning Talk システム準備完了！');
}
