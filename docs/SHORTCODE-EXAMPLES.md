# ⚡ Lightning Talk Pro Theme - ショートコード使用例集

Lightning Talk Pro
Themeで使用できるショートコードの詳細な使用例とテンプレート集です。

## 📋 目次

1. [基本的なショートコード](#基本的なショートコード)
2. [実用的なページテンプレート](#実用的なページテンプレート)
3. [組み合わせパターン](#組み合わせパターン)
4. [カスタマイズ例](#カスタマイズ例)
5. [トラブルシューティング](#トラブルシューティング)

## 基本的なショートコード

### 1. イベント表示 `[lightning_talk_event]`

#### 基本使用

```php
[lightning_talk_event id="123"]
```

#### パラメータ付き使用

```php
<!-- コンパクト表示 -->
[lightning_talk_event id="123" template="compact"]

<!-- 特定の情報のみ表示 -->
[lightning_talk_event id="123" show="title,date,venue"]

<!-- カスタムクラス追加 -->
[lightning_talk_event id="123" class="custom-event-style"]
```

#### 出力例

```html
<div class="lt-event-display">
  <header class="lt-event-header">
    <h2 class="lt-event-title">Tech Lightning Talk #1</h2>
    <div class="lt-event-meta">
      <span class="lt-event-date">📅 2025年7月15日 19:00</span>
      <span class="lt-event-venue">📍 渋谷テックカフェ</span>
    </div>
  </header>

  <div class="lt-event-content">
    <p>最新技術について5分間で熱く語るLightning Talkイベント...</p>
  </div>

  <div class="lt-event-details">
    <div class="lt-event-capacity">定員: 50名</div>
    <div class="lt-event-status">募集中</div>
  </div>
</div>
```

### 2. 参加登録フォーム `[lightning_talk_register]`

#### 基本使用

```php
[lightning_talk_register event_id="123"]
```

#### タイプ別登録

```php
<!-- リスナーのみ -->
[lightning_talk_register event_id="123" type="listener"]

<!-- スピーカーのみ -->
[lightning_talk_register event_id="123" type="speaker"]

<!-- 両方（デフォルト） -->
[lightning_talk_register event_id="123" type="both"]
```

#### カスタマイズ

```php
<!-- カスタムボタンテキスト -->
[lightning_talk_register event_id="123" button_text="今すぐ参加登録！"]

<!-- インライン表示 -->
[lightning_talk_register event_id="123" style="inline"]

<!-- モーダル無効化 -->
[lightning_talk_register event_id="123" modal="false"]
```

#### 出力例

```html
<div class="lt-registration-section">
  <div class="lt-registration-buttons">
    <button class="lt-btn lt-btn-primary" data-modal="#listener-modal">
      🎧 リスナーとして参加
    </button>
    <button class="lt-btn lt-btn-secondary" data-modal="#speaker-modal">
      🎤 スピーカーとして参加
    </button>
  </div>
</div>

<!-- モーダルフォーム -->
<div id="listener-modal" class="lt-modal">
  <div class="lt-modal-content">
    <form class="lt-registration-form">
      <!-- フォーム内容 -->
    </form>
  </div>
</div>
```

### 3. 参加者情報 `[lightning_talk_participants]`

#### 基本使用

```php
[lightning_talk_participants event_id="123"]
```

#### 表示タイプ

```php
<!-- 人数のみ -->
[lightning_talk_participants event_id="123" type="count"]

<!-- 参加者リスト -->
[lightning_talk_participants event_id="123" type="list"]

<!-- 統計情報 -->
[lightning_talk_participants event_id="123" type="stats"]
```

#### 詳細設定

```php
<!-- 表示数制限 -->
[lightning_talk_participants event_id="123" type="list" limit="10"]

<!-- アバター表示 -->
[lightning_talk_participants event_id="123" show_avatar="true"]

<!-- 更新間隔（秒） -->
[lightning_talk_participants event_id="123" refresh="30"]
```

#### 出力例

```html
<div class="lt-participants-display">
  <div class="lt-participants-count">
    <div class="lt-count-item">
      <span class="lt-count-number">25</span>
      <span class="lt-count-label">参加者</span>
    </div>
    <div class="lt-count-item">
      <span class="lt-count-number">20</span>
      <span class="lt-count-label">リスナー</span>
    </div>
    <div class="lt-count-item">
      <span class="lt-count-number">5</span>
      <span class="lt-count-label">スピーカー</span>
    </div>
  </div>

  <div class="lt-participants-list">
    <div class="lt-participant-item">
      <span class="lt-participant-name">田中太郎</span>
      <span class="lt-participant-type">リスナー</span>
    </div>
    <!-- ... -->
  </div>
</div>
```

### 4. 参加意向調査 `[lightning_talk_survey]`

#### 基本使用

```php
[lightning_talk_survey event_id="123"]
```

#### カスタマイズ

```php
<!-- 質問文変更 -->
[lightning_talk_survey event_id="123" question="参加方法をお選びください"]

<!-- 結果表示 -->
[lightning_talk_survey event_id="123" show_results="true"]

<!-- 投票後の動作 -->
[lightning_talk_survey event_id="123" after_vote="hide"]
```

#### 出力例

```html
<div class="lt-survey" data-event-id="123">
  <h4 class="lt-survey-title">参加形式をお選びください</h4>

  <div class="lt-survey-options">
    <div class="lt-survey-option" data-vote-type="online">
      <div class="lt-survey-option-content">
        <span class="lt-survey-option-icon">💻</span>
        <span class="lt-survey-option-text">オンライン参加</span>
        <span class="lt-survey-option-count">12票</span>
      </div>
    </div>

    <div class="lt-survey-option" data-vote-type="offline">
      <div class="lt-survey-option-content">
        <span class="lt-survey-option-icon">🏢</span>
        <span class="lt-survey-option-text">会場参加</span>
        <span class="lt-survey-option-count">8票</span>
      </div>
    </div>
  </div>

  <div class="lt-survey-total">総投票数: 20票</div>
</div>
```

### 5. トーク一覧 `[lightning_talk_talks]`

#### 基本使用

```php
[lightning_talk_talks event_id="123"]
```

#### フィルタリング

```php
<!-- カテゴリ指定 -->
[lightning_talk_talks event_id="123" category="tech"]

<!-- ステータス指定 -->
[lightning_talk_talks event_id="123" status="confirmed"]

<!-- 表示数制限 -->
[lightning_talk_talks event_id="123" limit="5"]
```

#### レイアウト

```php
<!-- グリッド表示 -->
[lightning_talk_talks event_id="123" layout="grid"]

<!-- カード表示 -->
[lightning_talk_talks event_id="123" layout="cards"]

<!-- リスト表示（デフォルト） -->
[lightning_talk_talks event_id="123" layout="list"]
```

## 実用的なページテンプレート

### 1. イベント詳細ページ

```html
<!-- ページタイトル -->
<div class="page-header">
  <h1>⚡ Tech Lightning Talk #1</h1>
  <p class="page-subtitle">最新技術について5分間で熱く語ろう！</p>
</div>

<!-- イベント基本情報 -->
<section class="event-info-section">[lightning_talk_event id="123"]</section>

<!-- 参加登録セクション -->
<section class="registration-section">
  <div class="section-header">
    <h2>🎤 参加登録</h2>
    <p>リスナー（聞くだけ）またはスピーカー（発表する）として参加できます。</p>
  </div>

  [lightning_talk_register event_id="123" type="both"]
</section>

<!-- 参加状況セクション -->
<section class="participants-section">
  <div class="section-header">
    <h2>👥 現在の参加状況</h2>
  </div>

  <div class="participants-content">
    [lightning_talk_participants event_id="123" type="both"]
  </div>
</section>

<!-- 参加意向調査 -->
<section class="survey-section">
  <div class="section-header">
    <h2>📊 参加形式アンケート</h2>
    <p>
      オンライン参加・会場参加のどちらを希望されますか？運営の参考にさせていただきます。
    </p>
  </div>

  [lightning_talk_survey event_id="123"]
</section>

<!-- トーク一覧 -->
<section class="talks-section">
  <div class="section-header">
    <h2>💡 発表予定のトーク</h2>
  </div>

  [lightning_talk_talks event_id="123" layout="cards"]
</section>

<!-- アクセス情報 -->
<section class="access-section">
  <div class="section-header">
    <h2>🚉 アクセス・会場情報</h2>
  </div>

  <div class="access-content">
    <p>詳しいアクセス情報は、参加登録完了後にメールでご案内いたします。</p>

    <!-- Google Maps表示 -->
    <div class="venue-map">
      <!-- 地図はイベント表示ショートコードに含まれます -->
    </div>
  </div>
</section>
```

### 2. イベント一覧ページ

```html
<!-- ページヘッダー -->
<div class="page-header">
  <h1>⚡ Lightning Talk イベント一覧</h1>
  <p>開催予定・過去のイベントをご覧いただけます。</p>
</div>

<!-- 開催予定のイベント -->
<section class="upcoming-events">
  <h2>📅 開催予定のイベント</h2>

  <div class="events-grid">
    <!-- 複数のイベントを表示する場合 -->
    [lightning_talk_event id="123" template="compact"] [lightning_talk_event
    id="124" template="compact"] [lightning_talk_event id="125"
    template="compact"]
  </div>
</section>

<!-- 過去のイベント -->
<section class="past-events">
  <h2>📚 過去のイベント</h2>

  <div class="events-archive">
    [lightning_talk_event id="120" template="compact"] [lightning_talk_event
    id="119" template="compact"] [lightning_talk_event id="118"
    template="compact"]
  </div>
</section>
```

### 3. 参加者向けマイページ

```html
<!-- ユーザー情報表示 -->
<div class="user-info">
  <h2>👤 あなたの参加情報</h2>

  <!-- 参加中のイベント -->
  <div class="my-events">
    <h3>参加予定のイベント</h3>
    [lightning_talk_participants event_id="123" type="user" user_id="current"]
  </div>

  <!-- 発表予定のトーク -->
  <div class="my-talks">
    <h3>あなたの発表</h3>
    [lightning_talk_talks speaker_id="current" status="confirmed"]
  </div>
</div>
```

## 組み合わせパターン

### 1. ランディングページスタイル

```html
<!-- ヒーローセクション -->
<section class="hero-section">
  <div class="hero-content">
    <h1>🚀 あなたのアイデアを5分で世界に発信しよう</h1>
    <p>Lightning Talkで新しい出会いと学びを体験</p>

    <!-- 即座に登録できるボタン -->
    [lightning_talk_register event_id="123" style="hero"
    button_text="今すぐ参加"]
  </div>
</section>

<!-- 統計セクション -->
<section class="stats-section">
  <div class="stats-grid">
    <div class="stat-item">
      [lightning_talk_participants event_id="123" type="count" format="number"]
      <span>参加予定</span>
    </div>
    <div class="stat-item">
      [lightning_talk_talks event_id="123" format="count"]
      <span>発表予定</span>
    </div>
  </div>
</section>

<!-- イベント詳細 -->
<section class="event-details">
  [lightning_talk_event id="123" template="detailed"]
</section>
```

### 2. ダッシュボードスタイル

```html
<!-- クイック登録 -->
<div class="quick-actions">
  <h2>⚡ クイックアクション</h2>
  [lightning_talk_register event_id="123" style="compact"]
</div>

<!-- リアルタイム情報 -->
<div class="live-info">
  <div class="info-cards">
    <div class="info-card">
      <h3>参加状況</h3>
      [lightning_talk_participants event_id="123" type="stats" refresh="10"]
    </div>

    <div class="info-card">
      <h3>参加意向</h3>
      [lightning_talk_survey event_id="123" show_results="true"]
    </div>
  </div>
</div>

<!-- 最新トーク -->
<div class="latest-talks">
  <h3>最新の発表申込み</h3>
  [lightning_talk_talks event_id="123" limit="3" order="latest"]
</div>
```

### 3. モバイル最適化パターン

```html
<!-- モバイル向けコンパクト表示 -->
<div class="mobile-event-page">
  <!-- 必要最小限の情報 -->
  [lightning_talk_event id="123" template="mobile" show="title,date,venue"]

  <!-- 大きな登録ボタン -->
  [lightning_talk_register event_id="123" style="mobile-primary"]

  <!-- タブ形式での情報表示 -->
  <div class="mobile-tabs">
    <div class="tab-content" id="participants">
      [lightning_talk_participants event_id="123" type="count"]
    </div>

    <div class="tab-content" id="survey">
      [lightning_talk_survey event_id="123"]
    </div>

    <div class="tab-content" id="talks">
      [lightning_talk_talks event_id="123" layout="mobile"]
    </div>
  </div>
</div>
```

## カスタマイズ例

### 1. カスタムスタイル適用

```html
<!-- カスタムCSSクラス付き -->
<div class="custom-event-container">
  [lightning_talk_event id="123" class="premium-style"] [lightning_talk_register
  event_id="123" class="premium-button"]
</div>

<style>
  .custom-event-container .premium-style {
    border: 2px solid gold;
    background: linear-gradient(135deg, #fff9c4, #f0f8ff);
    border-radius: 15px;
    padding: 30px;
  }

  .premium-button .lt-btn {
    background: linear-gradient(135deg, #ffd700, #ff6b6b);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
    transform: scale(1.05);
  }
</style>
```

### 2. 条件付き表示

```html
<!-- 登録期限による条件分岐 -->
<?php if (strtotime('2025-07-13') > time()): ?>
<!-- 登録受付中 -->
<div class="registration-open">
  <h3>✅ 登録受付中</h3>
  [lightning_talk_register event_id="123"]
</div>
<?php else: ?>
<!-- 登録締切 -->
<div class="registration-closed">
  <h3>❌ 登録受付終了</h3>
  <p>申し訳ございませんが、登録期限を過ぎました。</p>
  [lightning_talk_participants event_id="123" type="count"]
</div>
<?php endif; ?>
```

### 3. JavaScript連携

```html
<!-- JavaScript連携の例 -->
<div id="dynamic-event-info">
  [lightning_talk_event id="123"] [lightning_talk_participants event_id="123"
  type="count" id="participant-counter"]
</div>

<script>
  // 参加者数をリアルタイム更新
  setInterval(function () {
    // カスタムJavaScript関数を使用
    getLightningTalkParticipantCount(123, function (response) {
      if (response.success) {
        document.querySelector(
          '#participant-counter [data-count="total"]'
        ).textContent = response.data.total;
      }
    });
  }, 30000); // 30秒ごと
</script>
```

## トラブルシューティング

### 1. ショートコードが表示されない

```bash
原因: ショートコードの構文エラー
解決:
- 閉じタグ確認: [lightning_talk_event id="123"]
- パラメータの記述確認: id="123" (引用符必須)
- スペース確認:余分なスペースが無いか
```

### 2. IDが存在しない

```bash
原因: 指定したイベントIDが存在しない
解決:
- 管理画面でイベントID確認
- イベントのステータス確認（公開状態か）
- タイポ確認
```

### 3. パラメータエラー

```bash
原因: 無効なパラメータ値
解決:
- type="both" (listener/speaker/both のみ)
- layout="grid" (grid/cards/list のみ)
- template="compact" (default/compact のみ)
```

### 4. CSSスタイルが適用されない

```bash
原因: テーマのCSS読み込み問題
解決:
- ブラウザキャッシュクリア
- テーマファイルの確認
- カスタムCSSの優先度確認
```

---

**Lightning Talk Pro Theme v1.1.0**  
_Professional WordPress theme for Lightning Talk event management_

ショートコード使用例集  
最終更新: 2025年6月24日
