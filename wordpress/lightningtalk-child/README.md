# Lightning Talk WordPress Child Theme

Lightning TalkイベントマネジメントシステムのWordPress子テーマです。Cocoon親テーマとの統合による効果的なイベント管理を提供します。

## 📋 概要

このテーマは以下の機能を提供します：

- **イベント管理**: Lightning Talkイベントの作成・管理
- **参加者管理**: 参加登録・発表申込みの処理
- **ショートコード**: 簡単なコンテンツ挿入機能
- **REST API**: フロントエンド連携
- **Cocoon統合**: レスポンシブ・SEO・パフォーマンス最適化

## 🚀 インストール

### 1. 前提条件
- WordPress 5.0以上
- PHP 7.4以上
- Cocoon親テーマ（バージョン2.6.0以上推奨）

### 2. テーマのインストール
1. `lightningtalk-child` フォルダを `/wp-content/themes/` にアップロード
2. WordPress管理画面 > 外観 > テーマ で Lightning Talk Child を有効化
3. Cocoonが親テーマとして設定されていることを確認

### 3. 初期設定
1. 管理画面 > Lightning Talk > 設定 でAPI設定を確認
2. パーマリンク設定で「投稿名」を選択
3. 最初のイベントを作成

## 📁 ファイル構成

```
lightningtalk-child/
├── style.css                     # テーマ定義ファイル
├── functions.php                  # 主要機能
├── shortcodes.php                 # ショートコード定義
├── cocoon-compatibility.php       # Cocoon互換性チェック
├── page-lightning-talk.php        # イベントページテンプレート
├── single-lt_event.php           # イベント詳細テンプレート
├── sample-content.sql            # サンプルデータ
├── assets/
│   └── dist/                     # ビルド済みアセット
│       ├── css/
│       │   ├── lightningtalk.min.css
│       │   └── admin.min.css
│       └── js/
│           ├── lightningtalk.min.js
│           └── admin.min.js
└── README.md                     # このファイル
```

## 🎯 カスタム投稿タイプ

### Lightning Talkイベント (`lt_event`)
- イベント情報の管理
- 開催日時・会場・オンライン設定
- 参加者・発表管理

### Lightning Talk発表 (`lt_talk`)
- 発表内容の管理
- 発表者・カテゴリー・時間
- イベントとの関連付け

### 参加者 (`lt_participant`)
- 参加者情報の管理
- 参加方法・状態管理
- 発表申込み連携

## 📋 利用可能なショートコード

### イベント表示
```
[lightning_talk_event id="1" show="all"]
```

### 参加登録ボタン
```
[lightning_talk_button type="register" text="参加申込み"]
[lightning_talk_button type="register-speaker" text="発表申込み"]
```

### 発表一覧
```
[lightning_talk_talks event_id="1" limit="10" category="tech"]
```

### 参加者数表示
```
[lightning_talk_participants event_id="1" show="count"]
```

### アンケート
```
[lightning_talk_survey event_id="1" title="参加アンケート"]
```

## 🔧 REST API エンドポイント

### イベント管理
- `GET /wp-json/lightningtalk/v1/events` - イベント一覧
- `GET /wp-json/lightningtalk/v1/events/{id}` - 特定イベント
- `POST /wp-json/lightningtalk/v1/register` - 参加登録

### 発表管理
- `GET /wp-json/lightningtalk/v1/talks?event_id=1` - 発表一覧
- `POST /wp-json/lightningtalk/v1/talks` - 発表申込み

## 🎨 カスタマイズ

### CSS カスタマイズ
Lightning Talk専用のCSS変数を使用：
```css
:root {
  --lt-primary-gradient: linear-gradient(45deg, #ff6b6b, #ffd93d);
  --lt-accent-color: #ffd700;
  --lt-text-primary: #333;
}
```

### JavaScript カスタマイズ
WordPress環境での設定：
```javascript
window.LightningTalkConfig = {
    apiUrl: '/wp-json/lightningtalk/v1/',
    nonce: wpNonce,
    defaultEventId: 1
};
```

## 🔒 セキュリティ

### 実装済み対策
- WordPress ノンス検証
- REST API レート制限
- 入力値サニタイゼーション
- XSS・CSRF対策

### 推奨設定
- SSL証明書の設定
- セキュリティプラグインの利用
- 定期的なアップデート

## 📱 レスポンシブ対応

### ブレークポイント
- Mobile: ~768px
- Tablet: 768px~1024px
- Desktop: 1024px~

### Cocoon連携機能
- ダークモード自動対応
- WordPress管理バー対応
- モバイルメニュー統合

## 🚀 パフォーマンス

### 最適化機能
- CSS/JavaScript圧縮
- 画像最適化対応
- 遅延読み込み対応
- キャッシュプラグイン連携

### 推奨プラグイン
- WP Rocket（キャッシュ）
- Smush（画像最適化）
- Yoast SEO（SEO対策）

## 🔧 トラブルシューティング

### よくある問題

#### ショートコードが表示されない
1. パーマリンク設定を確認
2. プラグインとの競合をチェック
3. テーマの有効化を再実行

#### REST API エラー
1. .htaccess の書き込み権限を確認
2. プラグインでREST APIが無効化されていないかチェック
3. SSL設定を確認

#### スタイルが適用されない
1. ブラウザキャッシュをクリア
2. Cocoon > 高速化設定を確認
3. 他のプラグインとの競合をチェック

### デバッグモード
wp-config.php に追加：
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('SCRIPT_DEBUG', true);
```

## 📞 サポート

### ドキュメント
- [WordPress開発ガイド](../docs/wordpress-development-guide.md)
- [ショートコードリファレンス](../docs/shortcodes.md)
- [API仕様書](../docs/api-reference.md)

### 互換性チェック
管理画面 > ダッシュボード で互換性ステータスを確認できます。

### バグレポート
GitHub Issues: [Lightning Talk Circle](https://github.com/your-repo/lightningtalk-circle/issues)

## 📄 ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) ファイルを参照

## 🎯 ロードマップ

### 今後の予定
- [ ] Gutenbergブロック対応
- [ ] 多言語対応（WPML/Polylang）
- [ ] WooCommerce連携
- [ ] カレンダー表示機能
- [ ] 通知システム強化

## ⚡ Lightning Talkについて

Lightning Talkは5分間の短いプレゼンテーション形式です。このテーマで：

- 📝 簡単な参加登録
- 🎤 発表申込み管理
- 👥 参加者管理
- 📊 イベント分析
- 💻 オンライン/オフライン対応

技術・趣味・日常の発見など、どんなテーマでも歓迎です！

---

**🌟 Lightning Talkで、あなたの「なんでも」を聞かせてください！**