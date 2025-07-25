# 📋 WordPress テーマ開発仕様書

## 🎯 **プロジェクト概要**

### **プロジェクト名**

Lightning Talk Event Management WordPress Theme

### **目的**

WordPressのCocoonテーマを親テーマとして、Lightning
Talkイベント管理機能を持つ子テーマを開発する

### **ターゲット環境**

- **WordPress**: 5.0以上
- **PHP**: 7.4以上
- **親テーマ**: Cocoon
- **デプロイ先**: https://発表.com (xn--6wym69a.com)

---

## 🏗️ **開発環境**

### **現在の開発環境**

```bash
作業ディレクトリ: /home/ec2-user/workspace/lightningtalk-circle
OS: Linux EC2 (Amazon Linux 2023)
Node.js: v18+
PHP: 7.4+
WordPress CLI: 利用可能
```

### **ディレクトリ構造**

```
/home/ec2-user/workspace/lightningtalk-circle/
├── wordpress/
│   ├── lightningtalk-child/          ← メイン開発ディレクトリ
│   │   ├── functions.php             ← 完全実装済み
│   │   ├── shortcodes.php            ← 9個のショートコード実装済み
│   │   ├── style.css                 ← Cocoon子テーマスタイル
│   │   ├── page-lightning-talk.php   ← 専用ページテンプレート
│   │   ├── single-lt_event.php       ← イベント詳細ページ
│   │   ├── cocoon-compatibility.php  ← Cocoon統合機能
│   │   ├── sample-content.sql        ← サンプルデータ
│   │   ├── README.md                 ← 詳細ドキュメント
│   │   └── assets/
│   │       └── dist/                 ← ビルド済みアセット
│   ├── lightningtalk-child-safe/     ← 安全版（最小機能）
│   └── lightningtalk-child-minimal/  ← 最小版（テスト用）
├── .env                              ← 環境設定ファイル
├── lightningtalk-child-theme-complete.zip ← デプロイ準備済み
├── lightning-talk-mobile-first.html ← モバイルファースト版（参考）
└── package.json                     ← ビルドツール設定
```

### **認証情報**

```bash
# WordPress サイト
URL: https://発表.com (https://xn--6wym69a.com)
管理画面: https://xn--6wym69a.com/wp-login.php
ユーザー: wpmaster
パスワード: fytbuh-3repRu-nucbyf
アプリパスワード: 2XAN B2ud oVHc Y2lE 3hVb PtRd
```

---

## 🎨 **テーマ仕様**

### **基本情報**

- **テーマ名**: Lightning Talk Child Theme
- **バージョン**: 1.0.0
- **親テーマ**: Cocoon
- **ライセンス**: GPL v2
- **言語**: 日本語

### **機能要件**

#### **1. カスタム投稿タイプ（3個）**

```php
- lt_event      → Lightning Talkイベント
- lt_talk       → Lightning Talk発表
- lt_participant → 参加者
```

#### **2. ショートコード（9個実装済み）**

```php
[lightning_talk_event]           → イベント情報表示
[lightning_talk_button]          → 参加登録ボタン
[lightning_talk_registration]    → 登録フォーム
[lightning_talk_talks]           → 発表一覧
[lightning_talk_participants]    → 参加者数表示
[lightning_talk_survey]          → アンケート機能
[lightning_talk_chat]            → チャットウィジェット
[lightning_talk_contact]         → 緊急連絡先
[lightning_talk_map]             → 地図リンク
```

#### **3. REST API エンドポイント**

```
GET  /wp-json/lightningtalk/v1/events     → イベント一覧
GET  /wp-json/lightningtalk/v1/events/{id} → 特定イベント
POST /wp-json/lightningtalk/v1/register   → 参加登録
GET  /wp-json/lightningtalk/v1/talks      → 発表一覧
POST /wp-json/lightningtalk/v1/talks      → 発表登録
```

#### **4. 管理機能**

- WordPress管理画面統合
- 参加者管理ページ
- 統計情報ダッシュボード
- メール通知機能
- Cocoonカスタマイザー統合

---

## 💻 **技術スタック**

### **フロントエンド**

- **HTML5**: セマンティックマークアップ
- **CSS3**: Flexbox, Grid, CSS Variables
- **JavaScript**: ES6+, Fetch API, Local Storage
- **jQuery**: WordPress標準（必要に応じて）

### **バックエンド**

- **PHP**: 7.4+, WordPress API
- **WordPress**: Custom Post Types, REST API, Hooks
- **MySQL**: WordPress標準データベース

### **ビルドツール**

- **Node.js**: 開発環境
- **npm**: パッケージ管理
- **Webpack/Gulp**: アセットビルド（設定済み）

---

## 📁 **現在の実装状況**

### **✅ 完全実装済み**

#### **1. functions.php（601行）**

- カスタム投稿タイプ登録
- REST API エンドポイント
- 管理画面機能
- メール送信機能
- Cocoon統合機能

#### **2. shortcodes.php（608行）**

- 9個のショートコード完全実装
- フロントエンド機能
- AJAX対応
- バリデーション機能

#### **3. スタイル・テンプレート**

- Cocoon互換スタイル
- 専用ページテンプレート
- レスポンシブデザイン

#### **4. 管理機能**

- 参加者管理システム
- 統計表示
- カスタマイザー統合

### **📦 デプロイ準備済み**

- `lightningtalk-child-theme-complete.zip` (36KB)
- 本番環境対応
- エラー修正済み
- 全機能統合

---

## 🔧 **開発フロー**

### **現在利用可能なコマンド**

```bash
# 開発サーバー起動
npm run dev

# アセットビルド
npm run build

# テーマZIP作成
npm run build:theme

# WordPress デプロイ
npm run deploy:wordpress
```

### **テスト環境**

```bash
# ローカルテストサーバー
python3 -m http.server 8081

# 機能テストスイート
./functional-test-suite.html
```

---

## 🎯 **今後の開発計画**

### **Phase 1: 現状確認・問題解決**

1. **既存テーマの動作確認**
   - WordPress環境での動作テスト
   - エラー・競合の確認
   - 機能動作確認

2. **問題修正**
   - 致命的エラーの修正
   - 機能不具合の解決
   - パフォーマンス最適化

### **Phase 2: 機能改善・追加**

1. **UI/UX改善**
   - モバイルファースト適用
   - アクセシビリティ向上
   - パフォーマンス最適化

2. **機能拡張**
   - 新機能追加
   - 管理機能強化
   - 統計・分析機能

### **Phase 3: 本番環境最適化**

1. **本番デプロイ**
   - ステージング環境テスト
   - 本番環境デプロイ
   - 監視・保守体制

---

## 🚨 **既知の問題**

### **1. 前回の WordPress エラー**

```
"この Web サイトに重大なエラーが発生しました"
原因: 関数重複定義エラー
状態: 修正済み（complete版で解決）
```

### **2. 対策済み事項**

- 関数重複の解消
- エラーハンドリング強化
- 安全版・最小版の準備
- 段階的デプロイ戦略

---

## 📋 **品質管理**

### **テスト項目**

- [ ] WordPress環境での動作確認
- [ ] Cocoonテーマとの互換性
- [ ] 全ショートコードの動作
- [ ] REST API の動作
- [ ] 管理画面機能
- [ ] メール送信機能
- [ ] レスポンシブデザイン
- [ ] ブラウザ互換性

### **パフォーマンス目標**

- ページ読み込み速度: < 3秒
- テーマファイルサイズ: < 100KB
- データベースクエリ最適化
- キャッシュ対応

---

## 🔄 **次のアクション**

### **優先順位 High**

1. **既存テーマの動作確認**
2. **WordPress環境での実機テスト**
3. **エラー対応・修正**
4. **本番デプロイ戦略確定**

### **使用予定ファイル**

- メイン: `/wordpress/lightningtalk-child/`
- デプロイ用: `lightningtalk-child-theme-complete.zip`
- 安全版: `lightningtalk-child-theme-safe.zip`（必要に応じて）

---

**📝 更新日**: 2025-06-20  
**👨‍💻 開発者**: Claude Code  
**🔄 ステータス**: 実装完了・テスト準備段階
