# ⚡ Lightning Talk Pro Theme - 管理者ガイド

Lightning Talk Pro
ThemeのWordPress管理者向け包括的ガイドです。テーマの設定、管理、カスタマイズ方法について詳しく説明します。

## 📋 目次

1. [管理画面の概要](#管理画面の概要)
2. [初期設定](#初期設定)
3. [イベント管理](#イベント管理)
4. [参加者管理](#参加者管理)
5. [トーク管理](#トーク管理)
6. [設定とカスタマイズ](#設定とカスタマイズ)
7. [データ管理](#データ管理)
8. [トラブルシューティング](#トラブルシューティング)
9. [メンテナンス](#メンテナンス)

## 管理画面の概要

### Lightning Talkメニュー

テーマ有効化後、WordPress管理画面の左サイドバーに「Lightning
Talk」メニューが追加されます：

```
Lightning Talk
├── ダッシュボード      # 統計情報・概要
├── イベント           # イベント一覧・編集
├── 参加者             # 参加者管理
├── トーク             # 発表管理
├── 調査回答           # アンケート結果
├── トークカテゴリー    # カテゴリ管理
└── 設定              # テーマ設定
```

### ダッシュボード概要

**Lightning Talk** → **ダッシュボード**で確認できる情報：

#### 統計ウィジェット

- **総イベント数**: 全期間のイベント件数
- **総参加者数**: 延べ参加者数
- **総トーク数**: 発表された総件数
- **今月の新規登録**: 当月の参加者増加数

#### クイックアクション

- **新規イベント作成**
- **参加者データエクスポート**
- **設定画面へのアクセス**

#### 最近のアクティビティ

- 最新の参加者登録（5件）
- 新しいトーク申込み（5件）
- イベントステータス変更履歴

## 初期設定

### 1. 基本設定

**Lightning Talk** → **設定**で以下を設定：

#### 一般設定

```
デフォルト定員: 50名
デフォルト最大トーク数: 10件
タイムゾーン: Asia/Tokyo
自動承認: 有効/無効
```

#### Google Maps設定

```
APIキー: [Google Cloud ConsoleのAPIキー]
デフォルトズーム: 15
マップスタイル: デフォルト/カスタム
```

### 2. APIキーの取得・設定

#### Google Maps API設定手順

1. **Google Cloud Console**にアクセス
   - https://console.cloud.google.com/

2. **プロジェクト作成**

   ```
   プロジェクト名: Lightning Talk Events
   組織: （該当するもの）
   ```

3. **Maps JavaScript API有効化**
   - ナビゲーション → APIs & Services → Library
   - 「Maps JavaScript API」を検索・有効化

4. **認証情報作成**
   - APIs & Services → Credentials
   - 「CREATE CREDENTIALS」→ 「API key」

5. **APIキー制限設定（推奨）**

   ```
   Application restrictions: HTTP referrers
   Website restrictions: *.yourdomain.com/*
   API restrictions: Maps JavaScript API
   ```

6. **WordPress管理画面で設定**
   - Lightning Talk → 設定 → Google Maps APIキー

### 3. パーマリンク設定

**設定** → **パーマリンク**で「投稿名」を選択（推奨）：

```
カスタム構造: /%postname%/
```

これにより以下のURLが生成されます：

- `/events/tech-lightning-talk-1/`
- `/participants/john-doe/`
- `/talks/react-18-features/`

## イベント管理

### 1. 新規イベント作成

**Lightning Talk イベント** → **新規追加**

#### 基本情報入力

```
タイトル: Tech Lightning Talk #1 - 最新技術トレンド
コンテンツ: イベントの詳細説明（リッチエディタ使用可能）
抜粋: 一覧表示用の短い説明
```

#### イベント詳細メタボックス

```bash
# 日時情報
イベント日: 2025-07-15
開始時刻: 19:00

# 会場情報
会場名: 渋谷テックカフェ
会場住所: 東京都渋谷区渋谷2-24-12 渋谷スクランブルスクエア15F
緯度: 35.659518
経度: 139.703047

# 定員・制限
定員: 50
最大トーク数: 10
申込締切: 2025-07-13

# ステータス
ステータス: upcoming
```

### 2. イベントステータス管理

| ステータス  | 説明     | 自動操作     | 表示状態         |
| ----------- | -------- | ------------ | ---------------- |
| `upcoming`  | 開催予定 | 登録受付中   | 登録ボタン表示   |
| `ongoing`   | 開催中   | 登録停止     | 「開催中」バッジ |
| `completed` | 終了     | アーカイブ化 | 「終了」バッジ   |
| `cancelled` | 中止     | 通知送信     | 「中止」バッジ   |

#### ステータス自動変更

```php
// 自動ステータス変更（cron使用）
add_action('lightningtalk_check_event_status', function() {
    // 開催日当日に ongoing に変更
    // 終了時刻経過後に completed に変更
});
```

### 3. 一括操作

イベント一覧画面での一括操作：

- **ステータス一括変更**
- **エクスポート**（CSV形式）
- **複製**（テンプレートとして使用）
- **削除**（参加者データも含む）

## 参加者管理

### 1. 参加者一覧

**Lightning Talk 参加者**で全参加者を管理：

#### 表示項目

```
名前 | メール | イベント | タイプ | 登録日 | ステータス
```

#### フィルタリング

- **イベント別**: 特定イベントの参加者のみ表示
- **タイプ別**: リスナー/スピーカー
- **ステータス別**: confirmed/pending/cancelled
- **登録日範囲**: 期間指定

### 2. 参加者詳細管理

各参加者の詳細ページで確認・編集可能な情報：

#### 基本情報

```
名前: 田中太郎
メールアドレス: tanaka@example.com
参加タイプ: speaker
イベント: Tech Lightning Talk #1
```

#### 詳細情報

```
緊急連絡先: 090-1234-5678
食事制限: ベジタリアン
アクセシビリティ要件: 車椅子対応席希望
```

#### システム情報

```
登録日時: 2025-06-20 14:30:25
IPアドレス: 192.168.1.100
ユーザーエージェント: Mozilla/5.0...
ステータス履歴: pending → confirmed
```

### 3. 参加者承認フロー

#### 自動承認設定

```php
// 設定 → 一般設定
自動承認: 有効
承認条件: メール認証必須
```

#### 手動承認プロセス

1. **新規登録通知**: 管理者メール送信
2. **内容確認**: 参加者情報・トーク内容チェック
3. **承認/却下**: ステータス変更
4. **通知送信**: 結果を参加者にメール通知

## トーク管理

### 1. トーク一覧

**Lightning Talk トーク**でトーク申込みを管理：

#### 表示情報

```
タイトル | スピーカー | イベント | カテゴリ | 時間 | ステータス
```

#### ステータス管理

- `pending`: 承認待ち（新規申込み）
- `confirmed`: 承認済み（発表確定）
- `rejected`: 却下（理由付き）
- `cancelled`: キャンセル（スピーカー都合）

### 2. トーク詳細編集

#### 基本情報

```
タイトル: React 18の新機能とパフォーマンス最適化
内容: 詳細な発表内容説明
抜粋: 5分程度での概要説明
```

#### 発表者情報

```
スピーカー名: 佐藤花子
メールアドレス: sato@example.com
所属: 株式会社テックイノベーション
```

#### 発表詳細

```
発表時間: 5分
カテゴリ: 技術
スライドURL: https://slides.com/...
デモURL: https://demo.example.com/
```

### 3. カテゴリ管理

**Lightning Talk** → **トークカテゴリー**

#### デフォルトカテゴリ

```
技術 (tech) - プログラミング、開発手法など
ビジネス (business) - 起業、マーケティングなど
学習 (learning) - 教育、スキルアップなど
趣味 (hobby) - 個人的な興味・趣味
旅行 (travel) - 旅行体験、文化紹介
食べ物 (food) - グルメ、料理など
ゲーム (game) - ゲーム開発、体験談
映画 (movie) - 映画レビュー、制作
音楽 (music) - 音楽制作、演奏
スポーツ (sports) - スポーツ体験、分析
```

#### カスタムカテゴリ追加

1. **新規カテゴリーを追加**をクリック
2. **名前**: 表示名を入力
3. **スラッグ**: URL用文字列（自動生成）
4. **説明**: カテゴリの詳細説明

## 設定とカスタマイズ

### 1. テーマ設定

**Lightning Talk** → **設定**

#### 表示設定

```php
// 一覧表示件数
イベント一覧: 10件/ページ
参加者一覧: 20件/ページ
トーク一覧: 15件/ページ

// サムネイル設定
アイキャッチ画像: 有効
推奨サイズ: 1200x630px
自動リサイズ: 有効
```

#### 機能設定

```php
// チャット機能
チャットウィジェット: 有効
メッセージ保存期間: 7日間
管理者モデレート: 無効

// 通知設定
管理者通知: 有効
参加者確認メール: 有効
リマインダーメール: 1日前に送信
```

### 2. メール設定

#### SMTPプラグインの設定（推奨）

```bash
# 推奨プラグイン
WP Mail SMTP by WPForms

# 設定例
SMTP Host: smtp.gmail.com
SMTP Port: 587
Encryption: TLS
Username: your-email@gmail.com
Password: [アプリ専用パスワード]
```

#### メールテンプレート

カスタムメールテンプレートは以下の場所に保存：

```
/wp-content/themes/lightning-talk-pro/templates/emails/
├── registration-confirmation.php
├── talk-approved.php
├── event-reminder.php
└── event-cancelled.php
```

### 3. カスタムCSS

**外観** → **カスタマイズ** → **追加CSS**

```css
/* ブランドカラーのカスタマイズ */
:root {
  --lt-primary: #your-primary-color;
  --lt-secondary: #your-secondary-color;
  --lt-accent: #your-accent-color;
}

/* ロゴサイズ調整 */
.lt-header-logo {
  max-height: 60px;
}

/* ボタンスタイル変更 */
.lt-btn-primary {
  background: linear-gradient(135deg, var(--lt-primary), var(--lt-secondary));
  border-radius: 25px;
}
```

## データ管理

### 1. データベーステーブル

Lightning Talk Proが使用するWordPressテーブル：

```sql
# 投稿テーブル（イベント、参加者、トーク）
wp_posts

# メタデータテーブル
wp_postmeta

# カテゴリテーブル
wp_terms
wp_term_taxonomy
wp_term_relationships

# オプションテーブル（設定）
wp_options
```

### 2. バックアップ戦略

#### 推奨バックアップ内容

```bash
# データベース
wp_posts (Lightning Talk関連のpost_type)
wp_postmeta (イベント・参加者・トークのメタデータ)
wp_options (テーマ設定)

# ファイル
/wp-content/themes/lightning-talk-pro/
/wp-content/uploads/ (アップロードされた画像)
```

#### バックアップ自動化

```php
// wp-config.phpに追加
define('AUTOMATIC_UPDATER_DISABLED', true);

// プラグイン推奨: UpdraftPlus
// 設定: 週次自動バックアップ
```

### 3. データエクスポート・インポート

#### エクスポート機能

**Lightning Talk** → **ダッシュボード** → **データエクスポート**

```bash
# エクスポート可能なデータ
- イベントデータ (CSV/JSON)
- 参加者リスト (CSV)
- トーク一覧 (CSV)
- 調査結果 (JSON)
- 設定データ (JSON)
```

#### インポート機能

**Lightning Talk** → **ダッシュボード** → **データインポート**

```bash
# インポート形式
CSV: 参加者、トークデータ
JSON: 設定、調査結果
SQL: 完全なイベントデータ
```

## トラブルシューティング

### 1. よくある問題と解決方法

#### 地図が表示されない

```bash
原因: Google Maps APIキー未設定/無効
解決:
1. Google Cloud ConsoleでAPIキー確認
2. Maps JavaScript API有効化確認
3. ドメイン制限設定確認
4. WordPress設定画面でAPIキー再入力
```

#### メール送信失敗

```bash
原因: サーバーSMTP設定問題
解決:
1. SMTPプラグイン導入 (WP Mail SMTP推奨)
2. 送信テスト実行
3. サーバーログ確認
4. メールアドレス形式確認
```

#### 参加登録エラー

```bash
原因: JavaScript無効またはAJAXエラー
解決:
1. ブラウザJavaScript有効化確認
2. テーマコンフリクト確認（他テーマ無効化）
3. プラグインコンフリクト確認
4. WordPressデバッグモード有効化
```

#### パフォーマンス問題

```bash
原因: 大量データ、サーバーリソース不足
解決:
1. 画像最適化（WebP使用）
2. キャッシュプラグイン導入
3. CDN使用検討
4. サーバースペック確認
```

### 2. デバッグモード

WordPress `wp-config.php`でデバッグ有効化：

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('SCRIPT_DEBUG', true);
```

ログファイル場所：

```bash
/wp-content/debug.log
```

### 3. システム要件確認

**Lightning Talk** → **設定** → **システム情報**

```bash
PHP Version: 7.4以上（8.0推奨）
WordPress Version: 5.0以上（6.0推奨）
MySQL Version: 5.6以上（8.0推奨）
Memory Limit: 256MB以上
Max Execution Time: 300秒以上
File Upload Limit: 32MB以上
```

## メンテナンス

### 1. 定期メンテナンス

#### 月次作業

```bash
1. データベースバックアップ作成
2. 参加者データの整理・アーカイブ
3. 画像ファイルの最適化
4. セキュリティアップデート確認
```

#### 年次作業

```bash
1. 過去イベントデータのアーカイブ
2. 未使用画像・ファイルの削除
3. パフォーマンス分析・改善
4. セキュリティ監査
```

### 2. 更新管理

#### テーマ更新手順

```bash
1. 現在のテーマファイルをバックアップ
2. データベースバックアップ作成
3. ステージング環境でテスト
4. 本番環境で更新実行
5. 機能動作確認
```

#### カスタマイズ保護

```bash
# 子テーマ使用（推奨）
/wp-content/themes/lightning-talk-pro-child/
├── style.css
├── functions.php
└── custom-templates/
```

### 3. セキュリティ

#### 定期チェック項目

```bash
1. WordPress core更新
2. プラグイン更新
3. 管理者アカウント確認
4. ファイル権限確認（644/755）
5. SSL証明書確認
```

#### セキュリティプラグイン推奨

```bash
- Wordfence Security
- Sucuri Security
- iThemes Security
```

---

**Lightning Talk Pro Theme v1.1.0**  
_Professional WordPress theme for Lightning Talk event management_

管理者向けドキュメント  
最終更新: 2025年6月24日
