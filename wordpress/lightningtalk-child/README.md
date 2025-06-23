# ⚡ Lightning Talk Circle WordPress Theme

**完全自己完結型のLightning Talkイベント管理WordPressテーマ**

## 🚀 特徴

このテーマをアップロードするだけで、以下の全機能がすぐに利用可能になります：

### ✅ 含まれる機能
- **🎤 イベント管理** - Lightning Talkイベントの作成・管理
- **👥 参加者管理** - 参加登録・管理・メール通知
- **📱 発表管理** - 発表の募集・管理・表示
- **🔌 REST API** - 外部システムとの連携用API
- **📝 ショートコード** - 9種類の便利なショートコード
- **🎨 レスポンシブデザイン** - スマホ・タブレット・PC対応
- **🔒 セキュリティ** - WordPress標準のセキュリティ対策

### 🎯 自己完結型
- **外部依存なし** - CDNや外部サービスに依存しません
- **プラグイン不要** - テーマのみで全機能が動作
- **即座に利用可能** - アップロード後すぐに使用開始

## 📦 インストール手順

### 前提条件
- WordPress 5.0以上
- PHP 7.4以上
- **Cocoon親テーマ** がインストール済み

### 1. テーマのアップロード
```
WordPress管理画面 → 外観 → テーマ → 新規追加
→ 「テーマのアップロード」 → ZIPファイルを選択
→ 「今すぐインストール」 → 「有効化」
```

### 2. 自動初期化
テーマ有効化時に以下が自動実行されます：
- カスタム投稿タイプの登録
- REST APIエンドポイントの有効化
- デフォルト設定の適用
- サンプルイベントの作成（オプション）
- パーマリンクの更新

### 3. 推奨設定（オプション）
```
設定 → パーマリンク → 「投稿名」を選択 → 保存
```

## 🔧 使用方法

### イベントの作成
```
管理画面 → Lightning Talkイベント → 新規追加
```

### ショートコードの使用
投稿・固定ページで以下のショートコードが使用可能：

```
[lightning_talk_event id="1"]              # イベント表示
[lightning_talk_registration]              # 参加登録フォーム
[lightning_talk_talks event_id="1"]        # 発表一覧
[lightning_talk_countdown date="2025-07-01 19:00"] # カウントダウン
[lightning_talk_participants event_id="1"] # 参加者一覧
[lightning_talk_button text="参加登録" url="/register/"] # ボタン
[lightning_talk_survey]                    # アンケート
[lightning_talk_chat]                      # チャット
[lightning_talk_contact]                   # お問い合わせ
```

### REST API
以下のAPIエンドポイントが自動で利用可能：
```
GET  /wp-json/lightningtalk/v1/events     # イベント一覧
GET  /wp-json/lightningtalk/v1/events/1   # 特定イベント
POST /wp-json/lightningtalk/v1/register   # 参加登録
GET  /wp-json/lightningtalk/v1/talks      # 発表一覧
POST /wp-json/lightningtalk/v1/talks      # 発表登録
```

## 🎨 カスタマイズ

### テーマカスタマイザー
```
外観 → カスタマイズ → Lightning Talk設定
```
- API URL設定
- デフォルトイベントID
- メール通知設定
- デザイン設定

### CSS カスタマイズ
追加のスタイルは子テーマの `style.css` に記述してください。

## 📁 ファイル構造

```
lightningtalk-child/
├── style.css                 # 子テーマ定義
├── functions.php             # メイン機能（680行）
├── shortcodes.php            # ショートコード（626行）
├── cocoon-compatibility.php  # Cocoon連携
├── assets/dist/
│   ├── css/
│   │   ├── lightningtalk.min.css
│   │   ├── admin.min.css
│   │   └── jquery-ui.min.css  # ローカル版jQuery UI
│   └── js/
│       ├── lightningtalk.min.js
│       └── admin.min.js       # CDN依存を除去済み
├── page-lightning-talk.php   # カスタムページテンプレート
├── single-lt_event.php       # イベント詳細テンプレート
└── README.md                 # このファイル
```

## 🔒 セキュリティ機能

- **ノンス検証** - CSRF攻撃対策
- **入力値検証** - SQLインジェクション対策
- **権限チェック** - 不正アクセス防止
- **出力エスケープ** - XSS攻撃対策

## 🚨 トラブルシューティング

### よくある問題

**Q: イベントページが404エラーになる**
A: 設定 → パーマリンク → 「変更を保存」をクリック

**Q: ショートコードが表示されない**
A: テーマが正しく有効化されているか確認

**Q: 参加登録が動作しない**
A: WordPress REST APIが有効になっているか確認

### サポート
- 詳細な技術仕様: `docs/development/WORDPRESS-DEVELOPMENT-SPEC.md`
- 機能一覧: 管理画面の Lightning Talk メニューを確認

## 📄 ライセンス

このテーマはWordPress標準のGPLライセンスに準拠しています。

---

**🎉 Lightning Talk Circleテーマ - テーマアップロードだけで完全動作！**
