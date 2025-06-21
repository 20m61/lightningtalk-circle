# Lightning Talk WordPress Integration

Lightning TalkイベントマネジメントシステムのWordPress統合版です。Cocoon親テーマとの連携による効果的な開発環境を提供します。

## 🚀 クイックスタート

### 1. セットアップ
```bash
git clone https://github.com/your-repo/lightningtalk-circle.git
cd lightningtalk-circle
npm install
npm run wp:setup
```

### 2. 開発開始
```bash
npm run wp:dev
```

### 3. 本番ビルド
```bash
npm run wp:build
npm run wp:package
```

## 📁 プロジェクト構造

```
lightningtalk-circle/
├── 📂 wordpress/lightningtalk-child/    # WordPress子テーマ
│   ├── style.css                       # テーマ定義
│   ├── functions.php                   # WordPress機能
│   ├── shortcodes.php                  # ショートコード
│   └── assets/dist/                    # ビルド後ファイル
├── 📂 src/                             # ソースコード
│   ├── js/                            # JavaScript
│   └── styles/                        # SCSS
├── 📂 public/                          # 元Lightning Talkファイル
├── 📂 stories/                         # Storybook
├── webpack.config.js                   # Webpack設定
├── gulpfile.js                         # Gulp設定
└── package.json                        # 依存関係
```

## ⚡ 主要機能

### WordPress統合
- **カスタム投稿タイプ**: イベント・発表・参加者管理
- **REST API**: フロントエンド連携
- **ショートコード**: 簡単コンテンツ挿入
- **管理画面**: 直感的なイベント管理

### Cocoon連携
- **子テーマ**: 安全なカスタマイズ
- **レスポンシブ**: モバイルファースト
- **パフォーマンス**: 最適化されたアセット
- **SEO対応**: 構造化データ対応

### ビルドシステム
- **Webpack**: モジュールバンドリング
- **Gulp**: ファイル監視・最適化
- **Sass**: CSS前処理
- **Babel**: JavaScript変換

## 🛠️ 開発コマンド

### WordPress開発
```bash
npm run wp:install     # 初期セットアップ
npm run wp:dev         # 開発サーバー起動
npm run wp:build       # 本番ビルド
npm run wp:package     # テーマパッケージ作成
npm run wp:sync        # アセット同期
```

### 品質チェック
```bash
npm run wp:lint-php    # PHP構文チェック
npm run lint           # JavaScript/CSS品質チェック
npm run test           # テスト実行
```

### アセット管理
```bash
npm run wp:assets      # 画像最適化
npm run storybook      # Storybook起動
```

## 📋 ショートコード

### イベント表示
```html
[lightning_talk_event id="1" show="all"]
```

### 参加登録ボタン
```html
[lightning_talk_button type="register" text="参加申込み"]
```

### 発表一覧
```html
[lightning_talk_talks event_id="1" limit="10"]
```

### 参加者数
```html
[lightning_talk_participants event_id="1" show="count"]
```

## 🔧 カスタム投稿タイプ

### イベント (`lt_event`)
- 開催日時・会場情報
- オンライン参加URL
- 定員・ステータス管理

### 発表 (`lt_talk`)
- タイトル・概要
- 発表者・カテゴリー
- 発表時間管理

### 参加者 (`lt_participant`)
- 参加者情報
- 参加方法・状態
- 発表申込み連携

## 🌐 REST API

### エンドポイント一覧
```
GET    /wp-json/lightningtalk/v1/events
GET    /wp-json/lightningtalk/v1/events/{id}
POST   /wp-json/lightningtalk/v1/register
GET    /wp-json/lightningtalk/v1/talks
```

### 参加登録例
```javascript
fetch('/wp-json/lightningtalk/v1/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': wpNonce
  },
  body: JSON.stringify({
    name: '参加者名',
    email: 'test@example.com',
    event_id: 1,
    participation_type: 'onsite'
  })
});
```

## 📱 レスポンシブ対応

### ブレークポイント
- **Mobile**: ~768px
- **Tablet**: 768px~1024px  
- **Desktop**: 1024px~

### Cocoon統合機能
- ダークモード対応
- 管理バー対応
- モバイルメニュー統合

## 🎨 デザインシステム

### カラーパレット
- **Primary**: `#FF6B6B` → `#FFD93D`
- **Accent**: `#FFD700`
- **Text**: `#333` / `#666`

### コンポーネント
- ボタン（primary/secondary/disabled）
- カード（イベント/トピック）
- モーダル（登録フォーム）
- フォーム要素

## 🔒 セキュリティ

### WordPress標準
- ノンス検証
- 権限チェック
- エスケープ処理

### API保護
- CSRF対策
- レート制限
- 入力値検証

## 📊 パフォーマンス

### 最適化機能
- CSS/JS圧縮
- 画像最適化（WebP対応）
- 遅延読み込み
- キャッシュ戦略

### 測定指標
- Lighthouse スコア対応
- Core Web Vitals 最適化

## 🚢 デプロイ

### WordPress環境
1. テーマファイルをアップロード
2. Cocoonを親テーマに設定
3. Lightning Talk子テーマを有効化

### 設定確認
1. パーマリンク設定
2. REST API有効化
3. 必要プラグイン確認

## 📚 ドキュメント

- [WordPress開発ガイド](docs/wordpress-development-guide.md)
- [ショートコードリファレンス](docs/shortcodes.md)
- [API仕様書](docs/api-reference.md)
- [カスタマイズガイド](docs/customization.md)

## 🤝 コントリビューション

1. フォークしてブランチ作成
2. 機能追加・バグ修正
3. テスト実行
4. プルリクエスト作成

## 📄 ライセンス

MIT License

## 🎯 ロードマップ

### v1.1 (予定)
- [ ] Gutenbergブロック対応
- [ ] 多言語対応（WPML）
- [ ] WooCommerce連携

### v1.2 (予定)  
- [ ] カレンダー表示
- [ ] 通知システム
- [ ] アナリティクス連携

## ⚡ Lightning Talkについて

Lightning Talkは5分間の短いプレゼンテーション形式です。このシステムでは：

- 📝 簡単な参加登録
- 🎤 発表申込み管理  
- 👥 参加者管理
- 📊 イベント分析
- 💻 オンライン/オフライン対応

技術・趣味・日常の発見など、どんなテーマでも大歓迎！5分間で世界を変える体験を提供します。

---

**🌟 Lightning Talkで、あなたの「なんでも」を聞かせてください！**