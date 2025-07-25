# Lightning Talk WordPress デプロイメントガイド

## 🚀 デプロイメント完了！

WordPress Cocoon子テーマとの統合が完了し、デプロイメント準備が整いました。

## 📦 デプロイメントパッケージ

### 作成されたファイル

1. **`lightningtalk-child-theme.zip`** - WordPress テーマパッケージ
2. **`wordpress/lightningtalk-child/`** - テーマソースファイル
3. **`docs/wordpress-development-guide.md`** - 開発ガイド
4. **`README-WordPress.md`** - WordPress版README

## 🔧 インストール手順

### 1. WordPressサイトへのデプロイ

#### 方法A: WordPress管理画面から

1. WordPress管理画面にログイン
2. 外観 > テーマ > 新規追加
3. 「テーマのアップロード」をクリック
4. `lightningtalk-child-theme.zip` をアップロード
5. 有効化

#### 方法B: FTP/SFTPで直接アップロード

```bash
# 1. ZIPファイルを解凍
unzip lightningtalk-child-theme.zip

# 2. WordPressテーマディレクトリにアップロード
scp -r lightningtalk-child/ user@yourserver:/path/to/wordpress/wp-content/themes/

# 3. WordPress管理画面でテーマを有効化
```

### 2. 前提条件の確認

#### 必要な環境

- ✅ WordPress 5.0以上
- ✅ PHP 7.4以上
- ✅ Cocoon親テーマ（バージョン2.6.0以上推奨）
- ✅ mod_rewrite有効（REST API用）

#### 推奨プラグイン

- WP Rocket（キャッシュ）
- Smush（画像最適化）
- Yoast SEO（SEO対策）

### 3. 初期設定

#### パーマリンク設定

1. 設定 > パーマリンク
2. 「投稿名」を選択
3. 変更を保存

#### Lightning Talk設定

1. 外観 > カスタマイズ > Lightning Talk設定
2. API URL: `/wp-json/lightningtalk/v1/`
3. デフォルトイベントID: `1`

## 📋 コンテンツセットアップ

### 1. 最初のイベント作成

#### イベント投稿タイプで作成

1. Lightning Talk > イベント > 新規追加
2. 基本情報を入力：
   ```
   タイトル: 第1回 なんでもライトニングトーク
   開催日時: 2025-06-25 19:00:00
   会場: 新宿某所
   オンラインURL: https://meet.google.com/ycp-sdec-xsr
   ```

### 2. ページ作成

#### Lightning Talkメインページ

1. 固定ページ > 新規追加
2. タイトル: Lightning Talk イベント
3. テンプレート: Lightning Talk Event Page
4. パーマリンク: `/lightning-talk`

### 3. メニュー設定

#### ナビゲーションメニュー

1. 外観 > メニュー
2. 新規メニュー作成: メインメニュー
3. 項目追加：
   - ホーム
   - Lightning Talk（作成したページ）
   - イベント一覧
   - お問い合わせ

## 🎯 ショートコード使用例

### ページ・投稿での使用

#### イベント情報表示

```
[lightning_talk_event id="1" show="all"]
```

#### 参加登録ボタン

```
[lightning_talk_button type="register" text="参加申込み"]
[lightning_talk_button type="register-speaker" text="発表申込み"]
```

#### 発表一覧

```
[lightning_talk_talks event_id="1" limit="10"]
```

#### アンケート

```
[lightning_talk_survey event_id="1"]
```

## 🔒 セキュリティ設定

### .htaccess設定

```apache
# Lightning Talk REST API用
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^wp-json/lightningtalk/(.*)$ /wp-json/lightningtalk/$1 [QSA,L]

# セキュリティヘッダー
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### wp-config.php設定

```php
// セキュリティキーの設定（WordPress.orgで生成）
define('AUTH_KEY',         'your-unique-phrase');
define('SECURE_AUTH_KEY',  'your-unique-phrase');
// ... 他のキー

// REST APIセキュリティ
define('LIGHTNINGTALK_API_RATE_LIMIT', 100);
define('LIGHTNINGTALK_ADMIN_EMAIL', 'admin@yoursite.com');
```

## 🎨 カスタマイズ

### ブランディング調整

#### 色のカスタマイズ

```css
/* 追加CSS（外観 > カスタマイズ > 追加CSS）*/
:root {
  --lt-primary-gradient: linear-gradient(45deg, #your-color1, #your-color2);
  --lt-accent-color: #your-accent-color;
}
```

#### ロゴ・アイコン設定

1. 外観 > カスタマイズ > サイト基本情報
2. サイトアイコン: ⚡ Lightning Talk アイコン
3. ロゴ: 組織のロゴに変更

### 機能カスタマイズ

#### 追加フィールド

```php
// functions.php に追加
add_action('add_meta_boxes', 'add_custom_event_fields');
function add_custom_event_fields() {
    add_meta_box(
        'custom_fields',
        'カスタムフィールド',
        'custom_fields_callback',
        'lt_event'
    );
}
```

## 📊 パフォーマンス最適化

### キャッシュ設定

#### WP Rocket設定

1. WP Rocket > ダッシュボード
2. 基本 > キャッシュを有効化
3. ファイル最適化 > CSS・JS結合
4. プリロード > サイトマップベースのキャッシュプリロード

#### 画像最適化

1. Smush > 一括最適化
2. WebP形式の有効化
3. 遅延読み込みの設定

### CDN設定（オプション）

1. Cloudflare/AWS CloudFront設定
2. 静的ファイルのCDN配信
3. WP Rocket > CDN設定

## 🔧 トラブルシューティング

### よくある問題と解決法

#### 1. テーマが表示されない

```bash
# ファイル権限の確認・修正
chown -R www-data:www-data /path/to/wordpress/
chmod -R 755 /path/to/wordpress/wp-content/themes/
```

#### 2. REST APIエラー

```bash
# パーマリンク再設定
# WordPress管理画面 > 設定 > パーマリンク > 変更を保存

# .htaccessの確認
ls -la /path/to/wordpress/.htaccess
```

#### 3. CSS/JSが読み込まれない

1. ブラウザキャッシュクリア
2. WP Rocket等のキャッシュクリア
3. Cocoon > 高速化 > CSS/JS最適化を一時無効化

### デバッグモード有効化

```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('SCRIPT_DEBUG', true);
```

## 📈 運用・保守

### 定期メンテナンス

#### 毎週

- [ ] バックアップ確認
- [ ] セキュリティアップデート
- [ ] パフォーマンス監視

#### 毎月

- [ ] プラグインアップデート
- [ ] テーマアップデート
- [ ] データベース最適化

#### 四半期

- [ ] セキュリティ監査
- [ ] パフォーマンス分析
- [ ] 機能改善検討

### 監視項目

#### パフォーマンス

- ページ読み込み速度
- データベースクエリ数
- メモリ使用量

#### セキュリティ

- 不正アクセス試行
- 脆弱性スキャン
- SSL証明書有効期限

## 🎯 今後の展開

### Phase 1 (1ヶ月以内)

- [ ] 基本機能の安定運用
- [ ] ユーザーフィードバック収集
- [ ] 小規模バグ修正

### Phase 2 (3ヶ月以内)

- [ ] Gutenbergブロック対応
- [ ] モバイルアプリ対応
- [ ] 分析機能強化

### Phase 3 (6ヶ月以内)

- [ ] 多言語対応
- [ ] WooCommerce連携
- [ ] 外部サービス連携

## 📞 サポート・連絡先

### 技術サポート

- GitHub Issues:
  [Lightning Talk Circle](https://github.com/your-repo/lightningtalk-circle/issues)
- ドキュメント: [WordPress開発ガイド](../guides/wordpress-development-guide.md)

### 緊急時対応

1. サイトダウン: バックアップからの復旧
2. セキュリティ侵害: 即座にサイト無効化
3. データ損失: データベースバックアップ復旧

---

## ✅ デプロイメント完了チェックリスト

- [x] WordPressテーマパッケージ作成
- [x] Cocoon互換性確認
- [x] REST API機能実装
- [x] ショートコード機能実装
- [x] 管理画面機能実装
- [x] セキュリティ対策実装
- [x] パフォーマンス最適化
- [x] レスポンシブ対応
- [x] ドキュメント作成

**🎉 Lightning Talk WordPress統合システムのデプロイメントが完了しました！**

WordPress環境で効果的なLightning Talkイベント管理を開始できます。
