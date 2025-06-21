# Lightning Talk WordPress開発ガイド

## 概要

Lightning TalkイベントマネジメントシステムのWordPress Cocoon子テーマ統合ガイドです。

## アーキテクチャ

```
lightningtalk-circle/
├── wordpress/
│   └── lightningtalk-child/          # WordPress子テーマ
│       ├── style.css                 # 子テーマスタイル定義
│       ├── functions.php             # WordPress機能拡張
│       ├── shortcodes.php            # ショートコード定義
│       └── assets/dist/              # ビルド後アセット
├── src/                              # ソースファイル
│   ├── js/                          # JavaScript
│   │   ├── lightningtalk.js         # メインスクリプト
│   │   ├── wordpress-adapter.js     # WordPress統合アダプター
│   │   └── admin.js                 # 管理画面スクリプト
│   └── styles/                      # SCSS
│       └── wordpress-integration.scss # WordPress統合スタイル
├── webpack.config.js                # Webpack設定
├── gulpfile.js                      # Gulp設定
└── package.json                     # 依存関係とスクリプト
```

## 開発環境セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. WordPress開発環境の初期化

```bash
npm run wp:setup
```

### 3. 開発サーバーの起動

```bash
npm run wp:dev
```

## ビルドシステム

### Webpack
- モジュールバンドリング
- JavaScript/TypeScript変換
- CSS最適化
- アセット管理

### Gulp
- ファイル監視
- BrowserSync連携
- 画像最適化
- WordPress専用タスク

## WordPress統合機能

### カスタム投稿タイプ

#### Lightning Talkイベント (`lt_event`)
```php
// イベント作成例
$event_id = wp_insert_post(array(
    'post_type' => 'lt_event',
    'post_title' => '第1回 なんでもライトニングトーク',
    'post_content' => 'イベント詳細...',
    'post_status' => 'publish',
    'meta_input' => array(
        'event_date' => '2025-06-25 19:00:00',
        'venue_name' => '新宿某所',
        'online_url' => 'https://meet.google.com/abc-defg-hij'
    )
));
```

#### Lightning Talk発表 (`lt_talk`)
```php
// 発表登録例
$talk_id = wp_insert_post(array(
    'post_type' => 'lt_talk',
    'post_title' => '猫の写真で学ぶマシンラーニング',
    'post_content' => '発表概要...',
    'meta_input' => array(
        'event_id' => $event_id,
        'speaker_name' => '田中太郎',
        'category' => 'tech',
        'duration' => 5
    )
));
```

#### 参加者 (`lt_participant`)
```php
// 参加者登録例
$participant_id = wp_insert_post(array(
    'post_type' => 'lt_participant',
    'post_title' => '佐藤花子',
    'meta_input' => array(
        'email' => 'hanako@example.com',
        'event_id' => $event_id,
        'participation_type' => 'onsite'
    )
));
```

### REST API エンドポイント

#### イベント取得
```
GET /wp-json/lightningtalk/v1/events
GET /wp-json/lightningtalk/v1/events/{id}
```

#### 参加登録
```
POST /wp-json/lightningtalk/v1/register
Content-Type: application/json

{
    "name": "参加者名",
    "email": "email@example.com",
    "event_id": 1,
    "participation_type": "onsite"
}
```

#### 発表一覧
```
GET /wp-json/lightningtalk/v1/talks?event_id=1
```

### ショートコード

#### イベント表示
```
[lightning_talk_event id="1" show="all"]
```

パラメーター:
- `id`: イベントID（省略時はデフォルトイベント）
- `show`: 表示内容（`all`, `info`, `registration`, `talks`）

#### ボタン
```
[lightning_talk_button type="register" text="参加登録" style="primary"]
```

パラメーター:
- `type`: ボタンタイプ（`register`, `feedback`など）
- `text`: ボタンテキスト
- `style`: スタイル（`primary`, `secondary`）
- `size`: サイズ（`small`, `medium`, `large`）

#### 登録フォーム
```
[lightning_talk_registration event_id="1" type="speaker"]
```

パラメーター:
- `event_id`: イベントID
- `type`: 登録タイプ（`general`, `listener`, `speaker`）
- `inline`: インライン表示（`true`/`false`）

#### 発表一覧
```
[lightning_talk_talks event_id="1" category="tech" limit="10"]
```

#### 参加者数表示
```
[lightning_talk_participants event_id="1" show="count"]
```

#### アンケート
```
[lightning_talk_survey event_id="1" title="参加アンケート"]
```

### Cocoon統合

#### CSS競合回避
- Lightning Talk固有クラスに`lt-`プレフィックス使用
- Cocoonスタイルを継承・拡張
- ダークモード対応

#### レスポンシブ対応
- Cocoonのブレークポイントに合わせる
- モバイルメニューとの統合
- WordPress管理バー対応

#### パフォーマンス最適化
- 必要な場合のみスクリプト読み込み
- CSS/JS最小化
- 画像最適化（WebP対応）

## 開発ワークフロー

### 1. 新機能開発

```bash
# 新しいブランチを作成
git checkout -b feature/new-feature

# 開発環境を起動
npm run wp:dev

# コード変更後、自動ビルド・リロード
# ブラウザでリアルタイム確認
```

### 2. スタイル開発

```bash
# SCSS ファイルを編集
src/styles/wordpress-integration.scss

# Gulpが自動でコンパイル
# BrowserSyncで即座に反映
```

### 3. JavaScript開発

```bash
# JSファイルを編集
src/js/lightningtalk.js

# Webpackが自動でバンドル
# HMRで高速リロード
```

### 4. 本番ビルド

```bash
# 最適化ビルド
npm run wp:build

# テーマパッケージ作成
npm run wp:package
```

### 5. デプロイ

```bash
# WordPressサイトにアップロード
wp theme install dist/lightningtalk-child.zip

# または手動アップロード
# wordpress/lightningtalk-child/ をwp-content/themes/にコピー
```

## テスト

### PHP構文チェック
```bash
npm run wp:lint-php
```

### JavaScript/CSS品質チェック
```bash
npm run lint
```

### 統合テスト
```bash
npm run test:e2e
```

## パフォーマンス最適化

### アセット最適化
- CSS/JavaScript圧縮
- 画像最適化・WebP変換
- 不要なファイル除去

### キャッシュ戦略
- ブラウザキャッシュ設定
- CDN対応準備
- WordPressキャッシュプラグイン連携

### SEO対応
- 構造化データ対応
- メタタグ最適化
- OGP設定

## トラブルシューティング

### よくある問題

#### 1. スタイルが反映されない
```bash
# ビルド状況確認
npm run wp:build

# キャッシュクリア
# WordPress管理画面 > 外観 > カスタマイズ > 追加CSS で空の設定を保存
```

#### 2. JavaScript エラー
```bash
# ブラウザ開発者ツールでエラー確認
# コンソールログを確認

# ソースマップ有効化（開発時）
NODE_ENV=development npm run wp:dev
```

#### 3. REST API エラー
```bash
# WordPressのパーマリンク設定を確認
# .htaccess の書き込み権限を確認
# WP REST API の有効性をテスト
curl http://yoursite.com/wp-json/lightningtalk/v1/events
```

### ログとデバッグ

#### WordPressデバッグ
```php
// wp-config.php に追加
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

#### JavaScript デバッグ
```javascript
// 開発時のみコンソールログ
if (window.LightningTalkConfig?.debug) {
    console.log('Debug info:', data);
}
```

## 拡張とカスタマイズ

### 新しいショートコード追加
1. `shortcodes.php` に関数を追加
2. `add_shortcode()` で登録
3. 必要に応じてJS/CSS追加

### 新しいカスタム投稿タイプ
1. `functions.php` で `register_post_type()`
2. 必要なメタフィールド定義
3. REST API エンドポイント追加

### Cocoon固有カスタマイズ
1. `src/styles/wordpress-integration.scss` でスタイル調整
2. `src/js/wordpress-adapter.js` でJS統合
3. 子テーマの`style.css`で微調整

## セキュリティ

### CSRF対策
- WordPressノンス使用
- REST API認証

### XSS対策
- エスケープ処理徹底
- Content Security Policy設定

### アクセス制御
- 権限チェック
- 管理機能の適切な制限

## まとめ

このガイドに従って開発することで、Lightning TalkシステムをWordPress Cocoonテーマと効率的に統合できます。継続的なメンテナンスとアップデートを心がけ、ユーザーフレンドリーなイベント管理システムを提供してください。