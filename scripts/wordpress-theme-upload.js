#!/usr/bin/env node

/**
 * WordPress テーマアップロード支援スクリプト
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function uploadThemeGuide() {
    console.log('📤 Lightning Talk Child Theme アップロードガイド');
    console.log('===============================================');
    console.log('');
    
    // 現在の環境確認
    console.log('🔍 現在の環境:');
    console.log(`   WordPress URL: ${process.env.WP_SITE_URL}`);
    console.log(`   管理画面: ${process.env.WP_ADMIN_URL}`);
    console.log(`   ログインユーザー: ${process.env.WP_USERNAME}`);
    console.log('');
    
    // テーマファイル確認
    const themePath = path.resolve(process.env.THEME_ZIP_PATH);
    if (fs.existsSync(themePath)) {
        const stats = fs.statSync(themePath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log('✅ テーマファイル準備完了:');
        console.log(`   ファイル: ${themePath}`);
        console.log(`   サイズ: ${sizeKB}KB`);
        console.log('');
    } else {
        console.log('❌ テーマファイルが見つかりません:');
        console.log(`   パス: ${themePath}`);
        console.log('');
        return;
    }
    
    // ステップバイステップガイド
    console.log('📋 アップロード手順:');
    console.log('');
    console.log('Step 1: WordPress管理画面にログイン');
    console.log(`   URL: ${process.env.WP_LOGIN_URL}`);
    console.log(`   ユーザー名: ${process.env.WP_USERNAME}`);
    console.log(`   パスワード: ${process.env.WP_PASSWORD}`);
    console.log('');
    
    console.log('Step 2: テーマページに移動');
    console.log('   左メニュー > 外観 > テーマ');
    console.log('');
    
    console.log('Step 3: 新しいテーマを追加');
    console.log('   ページ上部の「新規追加」ボタンをクリック');
    console.log('');
    
    console.log('Step 4: テーマをアップロード');
    console.log('   「テーマのアップロード」ボタンをクリック');
    console.log(`   ファイル選択で: ${path.basename(themePath)}`);
    console.log('   「今すぐインストール」をクリック');
    console.log('');
    
    console.log('Step 5: テーマを有効化');
    console.log('   インストール完了後「有効化」をクリック');
    console.log('   ⚠️  注意: 既存のCocoon Childテーマが置き換わります');
    console.log('');
    
    // 必要な設定
    console.log('⚙️  追加設定 (テーマ有効化後):');
    console.log('');
    console.log('1. パーマリンク設定:');
    console.log('   設定 > パーマリンク > 投稿名 > 変更を保存');
    console.log('');
    
    console.log('2. Lightning Talk設定:');
    console.log('   外観 > カスタマイズ > Lightning Talk設定');
    console.log(`   - API URL: ${process.env.WP_SITE_URL}/wp-json/lightningtalk/v1/`);
    console.log(`   - デフォルトイベントID: ${process.env.LT_DEFAULT_EVENT_ID}`);
    console.log('');
    
    // イベント作成ガイド
    console.log('📝 最初のイベント作成:');
    console.log('');
    console.log('1. 新規イベント作成:');
    console.log('   Lightning Talk > Lightning Talkイベント > 新規追加');
    console.log('');
    
    console.log('2. イベント情報入力:');
    console.log('   タイトル: 第1回 なんでもライトニングトーク');
    console.log('   内容: 5分間で世界を変える！あなたの「なんでも」を聞かせて！');
    console.log('');
    
    console.log('3. カスタムフィールド設定:');
    console.log(`   event_date: 2025-06-25 19:00:00`);
    console.log(`   venue_name: 新宿某所`);
    console.log(`   venue_address: 6月20日に詳細確定予定`);
    console.log(`   map_url: ${process.env.LT_MAP_URL}`);
    console.log(`   emergency_phone: ${process.env.LT_EMERGENCY_PHONE}`);
    console.log(`   online_url: ${process.env.LT_MEET_URL}`);
    console.log(`   capacity: 50`);
    console.log(`   event_status: active`);
    console.log('');
    
    // ページ作成ガイド
    console.log('📄 Lightning Talkページ作成:');
    console.log('');
    console.log('1. 新規固定ページ:');
    console.log('   固定ページ > 新規追加');
    console.log('   タイトル: Lightning Talk イベント');
    console.log('   パーマリンク: lightning-talk');
    console.log('');
    
    console.log('2. ページテンプレート:');
    console.log('   ページ属性 > テンプレート: Lightning Talk Event Page');
    console.log('');
    
    console.log('3. ショートコード追加例:');
    console.log('   [lightning_talk_event id="1" show="all"]');
    console.log('   [lightning_talk_survey event_id="1"]');
    console.log('   [lightning_talk_chat event_id="1"]');
    console.log('   [lightning_talk_contact]');
    console.log('   [lightning_talk_map]');
    console.log('');
    
    // 完了後の確認項目
    console.log('✅ 完了後の確認項目:');
    console.log('');
    console.log('□ Lightning Talk Child テーマが有効化されている');
    console.log('□ パーマリンクが投稿名形式になっている');
    console.log('□ 第1回イベントが作成されている');
    console.log('□ Lightning Talkページが作成されている');
    console.log('□ ショートコードが正常に表示される');
    console.log('□ チャットウィジェットが表示される');
    console.log('□ 緊急連絡先と地図リンクが機能する');
    console.log('');
    
    console.log('🎉 Lightning Talk システム実装完了！');
    console.log('');
    console.log('🔗 重要なリンク:');
    console.log(`   サイトフロント: ${process.env.WP_SITE_URL}`);
    console.log(`   WordPress管理: ${process.env.WP_ADMIN_URL}`);
    console.log(`   Lightning Talk管理: ${process.env.WP_ADMIN_URL}/admin.php?page=lightningtalk-admin`);
    console.log('');
    
    console.log('📞 サポート:');
    console.log('   詳細な手順: WORDPRESS-DEPLOYMENT-STEPS.md');
    console.log('   技術資料: docs/wordpress-development-guide.md');
}

uploadThemeGuide();