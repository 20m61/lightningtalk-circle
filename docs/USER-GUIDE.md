# ⚡ Lightning Talk Pro Theme - ユーザーガイド

Lightning Talk Pro ThemeはWordPressでLightning
Talkイベントを簡単に管理・開催できるプロフェッショナルなテーマです。

## 📋 目次

1. [インストール](#インストール)
2. [基本設定](#基本設定)
3. [イベントの作成](#イベントの作成)
4. [ページの作成](#ページの作成)
5. [ショートコードの使用](#ショートコードの使用)
6. [参加者管理](#参加者管理)
7. [トーク管理](#トーク管理)
8. [分析とレポート](#分析とレポート)
9. [トラブルシューティング](#トラブルシューティング)

## インストール

### 1. テーマのダウンロード

[GitHub Releases](https://github.com/20m61/lightningtalk-circle/releases/latest)から最新の`lightning-talk-pro-theme-v1.1.0.zip`をダウンロードします。

### 2. WordPressへのインストール

1. WordPress管理画面にログイン
2. **外観** → **テーマ** → **新規追加**
3. **テーマのアップロード**をクリック
4. ダウンロードしたZIPファイルを選択
5. **今すぐインストール** → **有効化**

### 3. 必要な権限

テーマを正しく動作させるために、以下の権限が必要です：

- **管理者権限**: 全機能への完全アクセス
- **編集者権限**: イベントとトークの編集権限
- **投稿者権限**: 自分のトークの管理権限

## 基本設定

### 1. Lightning Talk設定

1. WordPress管理画面で **Lightning Talk** → **設定**
2. 以下の項目を設定：

#### 基本設定

- **デフォルト定員**: 新規イベントの標準定員（推奨：50名）
- **デフォルト最大トーク数**: 1イベントあたりの発表数（推奨：10件）

#### Google Maps設定

- **Google Maps APIキー**: 会場地図表示に必要
  - [Google Cloud Console](https://console.cloud.google.com/)でAPIキーを取得
  - Maps JavaScript APIを有効化

### 2. メニューの設定

1. **外観** → **メニュー**
2. 新しいメニューを作成
3. 以下のページを追加：
   - **イベント一覧**: `/events/`
   - **参加方法**: `/how-to-participate/`
   - **よくある質問**: `/faq/`

## イベントの作成

### 1. 新規イベントの作成

1. **Lightning Talk イベント** → **新規追加**
2. 基本情報を入力：

#### イベント基本情報

```
タイトル: Tech Lightning Talk #1 - 最新技術トレンド
内容: イベントの詳細説明、参加対象、開催内容など
抜粋: 検索結果や一覧に表示される短い説明
```

#### イベント詳細（メタボックス）

- **イベント日**: 開催日を選択
- **開始時刻**: 開始時間（例：19:00）
- **会場名**: 会場の名称
- **会場住所**: 完全な住所
- **緯度・経度**: 地図表示用（Google Mapsで検索可能）
- **定員**: 参加可能人数
- **最大トーク数**: 発表可能数
- **申込締切**: 登録受付終了日
- **ステータス**: upcoming/ongoing/completed/cancelled

### 2. イベントステータスの管理

| ステータス  | 説明     | 参加登録 | 表示           |
| ----------- | -------- | -------- | -------------- |
| `upcoming`  | 開催予定 | ✅ 可能  | 登録ボタン表示 |
| `ongoing`   | 開催中   | ❌ 不可  | 「開催中」表示 |
| `completed` | 終了     | ❌ 不可  | 「終了」表示   |
| `cancelled` | 中止     | ❌ 不可  | 「中止」表示   |

### 3. 会場情報の設定

#### 緯度・経度の取得方法

1. [Google Maps](https://maps.google.com/)で会場を検索
2. 会場をクリックして詳細を表示
3. URLに表示される座標をコピー
4. 例：`35.659518, 139.703047`

## ページの作成

### 1. イベント一覧ページ

新しいページを作成し、以下のショートコードを使用：

```php
[lightning_talk_events limit="10"]
```

### 2. 個別イベントページ

イベント詳細ページでは以下のコンテンツを含めます：

```php
<!-- イベント基本情報 -->
[lightning_talk_event id="123"]

<!-- 参加登録フォーム -->
[lightning_talk_register event_id="123" type="both"]

<!-- 参加者数表示 -->
[lightning_talk_participants event_id="123" type="count"]

<!-- 参加意向調査 -->
[lightning_talk_survey event_id="123"]

<!-- トーク一覧 -->
[lightning_talk_talks event_id="123"]
```

### 3. サンプルページテンプレート

完全なイベントページの例：

```html
<div class="lightning-talk-event-page">
  <header class="event-header">
    <h1>⚡ Tech Lightning Talk #1</h1>
    <p class="event-subtitle">最新技術について5分間で熱く語ろう！</p>
  </header>

  <!-- イベント詳細 -->
  [lightning_talk_event id="123"]

  <div class="event-sections">
    <!-- 参加登録 -->
    <section class="registration-section">
      <h2>🎤 参加登録</h2>
      <p>
        リスナー（聞くだけ）またはスピーカー（発表する）として参加できます。
      </p>
      [lightning_talk_register event_id="123" type="both"]
    </section>

    <!-- 参加状況 -->
    <section class="participants-section">
      <h2>👥 参加状況</h2>
      [lightning_talk_participants event_id="123" type="both"]
    </section>

    <!-- 参加意向調査 -->
    <section class="survey-section">
      <h2>📊 参加形式アンケート</h2>
      <p>オンライン参加・会場参加のどちらを希望されますか？</p>
      [lightning_talk_survey event_id="123"]
    </section>

    <!-- アクセス情報 -->
    <section class="access-section">
      <h2>🚉 アクセス</h2>
      <p>会場への詳しいアクセス情報は、登録完了後にご案内いたします。</p>
    </section>
  </div>
</div>
```

## ショートコードの使用

### 1. イベント表示

#### `[lightning_talk_event]`

イベントの詳細情報を表示します。

```php
<!-- 基本的な使用 -->
[lightning_talk_event id="123"]

<!-- テンプレート指定 -->
[lightning_talk_event id="123" template="compact"]
```

**パラメータ:**

- `id`: イベントID（必須）
- `template`: 表示テンプレート（default/compact）

### 2. 参加登録

#### `[lightning_talk_register]`

参加登録フォームを表示します。

```php
<!-- リスナー・スピーカー両方 -->
[lightning_talk_register event_id="123" type="both"]

<!-- リスナーのみ -->
[lightning_talk_register event_id="123" type="listener"]

<!-- スピーカーのみ -->
[lightning_talk_register event_id="123" type="speaker"]

<!-- ボタンテキスト変更 -->
[lightning_talk_register event_id="123" button_text="今すぐ参加"]
```

**パラメータ:**

- `event_id`: イベントID（必須）
- `type`: 参加タイプ（both/listener/speaker）
- `button_text`: ボタンテキスト

### 3. 参加者情報

#### `[lightning_talk_participants]`

参加者数や一覧を表示します。

```php
<!-- 参加者数のみ -->
[lightning_talk_participants event_id="123" type="count"]

<!-- 参加者一覧 -->
[lightning_talk_participants event_id="123" type="list"]

<!-- 両方表示 -->
[lightning_talk_participants event_id="123" type="both"]
```

**パラメータ:**

- `event_id`: イベントID（必須）
- `type`: 表示タイプ（count/list/both）

### 4. 参加意向調査

#### `[lightning_talk_survey]`

オンライン・オフライン参加の意向調査を表示します。

```php
[lightning_talk_survey event_id="123"]
```

**パラメータ:**

- `event_id`: イベントID（必須）

### 5. トーク一覧

#### `[lightning_talk_talks]`

イベントのトーク一覧を表示します。

```php
<!-- 基本表示 -->
[lightning_talk_talks event_id="123"]

<!-- カテゴリ指定 -->
[lightning_talk_talks event_id="123" category="tech"]

<!-- 表示数制限 -->
[lightning_talk_talks event_id="123" limit="5"]
```

**パラメータ:**

- `event_id`: イベントID（必須）
- `category`: カテゴリスラッグ
- `limit`: 表示数

## 参加者管理

### 1. 参加者の確認

1. **Lightning Talk 参加者**で一覧を確認
2. 各参加者の詳細情報を表示：
   - 参加タイプ（リスナー/スピーカー）
   - 連絡先情報
   - 登録日時
   - ステータス

### 2. 参加者のステータス管理

| ステータス  | 説明       | アクション     |
| ----------- | ---------- | -------------- |
| `confirmed` | 参加確定   | 通常の状態     |
| `pending`   | 承認待ち   | 手動承認が必要 |
| `cancelled` | キャンセル | 参加取り消し   |

### 3. 参加者データのエクスポート

```php
// 管理画面からCSVエクスポート機能を使用
// または直接データベースから取得
```

## トーク管理

### 1. トークの承認フロー

1. **Lightning Talk トーク**で申込み一覧を確認
2. 各トークの詳細を確認：
   - タイトル・内容
   - スピーカー情報
   - 発表時間
   - カテゴリ

3. ステータスを更新：
   - `pending` → `confirmed`（承認）
   - `pending` → `rejected`（却下）

### 2. トークカテゴリの管理

標準カテゴリ：

- **技術** (tech)
- **ビジネス** (business)
- **学習** (learning)
- **趣味** (hobby)
- **旅行** (travel)
- **食べ物** (food)
- **ゲーム** (game)
- **映画** (movie)
- **音楽** (music)
- **スポーツ** (sports)

カスタムカテゴリの追加：

1. **Lightning Talk** → **トークカテゴリー**
2. **新規カテゴリーを追加**

## 分析とレポート

### 1. ダッシュボード

**Lightning Talk** → **ダッシュボード**で確認できる情報：

- **総イベント数**: 開催済み・予定イベント
- **総参加者数**: 全期間の延べ参加者
- **総トーク数**: 発表された総件数
- **最近のイベント**: 直近5件のイベント情報

### 2. イベント別分析

各イベントページで確認できる分析：

- **参加者推移**: リアルタイムの登録状況
- **参加意向**: オンライン・オフライン希望比率
- **トーク応募状況**: カテゴリ別分布
- **参加者属性**: リスナー・スピーカー比率

### 3. データエクスポート

管理画面から以下のデータをエクスポート可能：

- **参加者リスト**: CSV形式
- **トーク一覧**: CSV形式
- **アンケート結果**: JSON形式

## トラブルシューティング

### よくある問題と解決方法

#### 1. 地図が表示されない

**原因**: Google Maps APIキーが未設定または無効

**解決方法**:

1. Google Cloud ConsoleでAPIキーを確認
2. Maps JavaScript APIが有効化されているか確認
3. APIキーの使用制限を確認
4. 設定画面で正しいAPIキーを入力

#### 2. 参加登録ができない

**原因**: JavaScript無効または権限不足

**解決方法**:

1. ブラウザのJavaScriptが有効か確認
2. WordPressの権限設定を確認
3. テーマの競合を確認（他のテーマとの併用不可）

#### 3. メール通知が送信されない

**原因**: WordPressメール設定の問題

**解決方法**:

1. SMTPプラグインの導入を検討
2. サーバーのメール設定を確認
3. メールアドレスの形式を確認

#### 4. ショートコードが表示されない

**原因**: ショートコードの記述ミスまたはパラメータエラー

**解決方法**:

1. ショートコードの構文を確認
2. パラメータのスペルを確認
3. 存在するイベントIDを指定しているか確認

### サポート情報

- **GitHub Issues**:
  [バグ報告・機能要望](https://github.com/20m61/lightningtalk-circle/issues)
- **ドキュメント**: [開発者向けドキュメント](DEVELOPER-GUIDE.md)
- **更新情報**:
  [リリースノート](https://github.com/20m61/lightningtalk-circle/releases)

---

**Lightning Talk Pro Theme v1.1.0**  
_Professional WordPress theme for Lightning Talk event management_

最終更新: 2025年6月24日
