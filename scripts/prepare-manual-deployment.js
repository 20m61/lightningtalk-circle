#!/usr/bin/env node

/**
 * 手動デプロイメント支援スクリプト
 * テーマファイルの最終確認とアップロード準備
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function prepareManualDeployment() {
  console.log('🎯 手動デプロイメント準備スクリプト');
  console.log('================================');
  console.log('');

  // 1. ファイル確認
  console.log('📦 1. テーマファイル確認');
  const themePath = path.resolve('./lightningtalk-child-theme.zip');
  if (fs.existsSync(themePath)) {
    const stats = fs.statSync(themePath);
    console.log(`✅ ${path.basename(themePath)} (${Math.round(stats.size / 1024)}KB) 準備完了`);
  } else {
    console.log('❌ テーマファイルが見つかりません');
    return;
  }
  console.log('');

  // 2. WordPress接続テスト
  console.log('🔍 2. WordPress接続テスト');
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(process.env.WP_SITE_URL, { method: 'HEAD' });
    console.log(`✅ ${process.env.WP_SITE_URL} アクセス可能 (${response.status})`);
  } catch (error) {
    console.log(`❌ サイトアクセスエラー: ${error.message}`);
  }
  console.log('');

  // 3. 簡単アップロード手順
  console.log('🚀 3. 簡単3ステップでアップロード');
  console.log('');
  console.log('【ステップ 1】WordPress管理画面にログイン');
  console.log(`   👉 ${process.env.WP_LOGIN_URL}`);
  console.log(`   ユーザー名: ${process.env.WP_USERNAME}`);
  console.log(`   パスワード: ${process.env.WP_PASSWORD}`);
  console.log('');

  console.log('【ステップ 2】テーマアップロードページに移動');
  console.log('   👉 左メニュー > 外観 > テーマ > 新規追加 > テーマのアップロード');
  console.log('');

  console.log('【ステップ 3】ファイル選択してインストール');
  console.log(`   👉 ファイル選択: ${path.basename(themePath)}`);
  console.log('   👉 今すぐインストール > 有効化');
  console.log('');

  // 4. 自動実行可能な後続作業
  console.log('⚡ 4. アップロード後の自動実行可能作業');
  console.log('');
  console.log('以下のスクリプトでWordPress設定を自動化できます:');
  console.log('');
  console.log('```bash');
  console.log('# パーマリンク設定の自動化');
  console.log('node scripts/configure-wordpress.js');
  console.log('');
  console.log('# サンプルイベントの自動作成');
  console.log('node scripts/create-sample-event.js');
  console.log('');
  console.log('# Lightning Talkページの自動作成');
  console.log('node scripts/create-lightning-talk-page.js');
  console.log('```');
  console.log('');

  // 5. 完了後の確認
  console.log('✅ 5. 完了後の確認事項');
  console.log('');
  console.log('□ Lightning Talk Childテーマが有効になっている');
  console.log('□ 管理画面に「Lightning Talk」メニューが表示される');
  console.log('□ フロントエンドでCocoonデザインが維持されている');
  console.log('');

  console.log('🌟 準備完了！上記3ステップで実装開始できます。');
}

prepareManualDeployment();
