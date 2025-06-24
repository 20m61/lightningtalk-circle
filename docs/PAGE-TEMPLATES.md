# ⚡ Lightning Talk Pro Theme - WordPressページテンプレート集

すぐに使えるWordPressページテンプレート集です。コピー&ペーストでプロフェッショナルなイベントページを作成できます。

## 📋 目次

1. [イベント詳細ページ](#イベント詳細ページ)
2. [イベント一覧ページ](#イベント一覧ページ)
3. [ランディングページ](#ランディングページ)
4. [参加者マイページ](#参加者マイページ)
5. [FAQ・ヘルプページ](#faqヘルプページ)
6. [お知らせページ](#お知らせページ)

## イベント詳細ページ

### テンプレート：基本版

```html
<!-- 
ページタイトル: Tech Lightning Talk #1 - 最新技術トレンド
スラッグ: tech-lightning-talk-1
テンプレート: デフォルト
-->

<div class="lightning-talk-event-page">
  <!-- ヒーローセクション -->
  <section
    class="hero-section"
    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; text-align: center; margin-bottom: 40px;"
  >
    <div class="hero-content" style="max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 2.5rem; margin-bottom: 20px;">
        ⚡ Tech Lightning Talk #1
      </h1>
      <p style="font-size: 1.2rem; margin-bottom: 30px;">
        最新技術について5分間で熱く語ろう！
      </p>
      <div style="margin-top: 30px;">
        [lightning_talk_register event_id="123" button_text="今すぐ参加登録"
        style="hero"]
      </div>
    </div>
  </section>

  <!-- イベント基本情報 -->
  <section class="event-info" style="margin-bottom: 50px;">
    <div style="max-width: 1000px; margin: 0 auto; padding: 0 20px;">
      [lightning_talk_event id="123"]
    </div>
  </section>

  <!-- 3カラム情報セクション -->
  <section class="info-grid" style="margin-bottom: 50px;">
    <div style="max-width: 1000px; margin: 0 auto; padding: 0 20px;">
      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;"
      >
        <!-- 参加者情報 -->
        <div
          class="info-card"
          style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;"
        >
          <h3 style="color: #667eea; margin-bottom: 20px;">👥 参加状況</h3>
          [lightning_talk_participants event_id="123" type="both"]
        </div>

        <!-- 参加意向調査 -->
        <div
          class="info-card"
          style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;"
        >
          <h3 style="color: #667eea; margin-bottom: 20px;">📊 参加形式</h3>
          <p style="margin-bottom: 20px; font-size: 0.9rem;">
            どちらで参加されますか？
          </p>
          [lightning_talk_survey event_id="123"]
        </div>

        <!-- 発表申込み -->
        <div
          class="info-card"
          style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;"
        >
          <h3 style="color: #667eea; margin-bottom: 20px;">🎤 発表者募集</h3>
          <p style="margin-bottom: 20px; font-size: 0.9rem;">
            あなたも発表してみませんか？
          </p>
          [lightning_talk_register event_id="123" type="speaker"
          button_text="発表申込み"]
        </div>
      </div>
    </div>
  </section>

  <!-- トーク一覧 -->
  <section class="talks-section" style="margin-bottom: 50px; background: #fff;">
    <div style="max-width: 1000px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="text-align: center; margin-bottom: 40px; color: #333;">
        💡 発表予定のトーク
      </h2>
      [lightning_talk_talks event_id="123" layout="cards"]
    </div>
  </section>

  <!-- アクセス情報 -->
  <section
    class="access-section"
    style="background: #f8f9fa; padding: 50px 20px;"
  >
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2 style="text-align: center; margin-bottom: 30px; color: #333;">
        🚉 会場・アクセス
      </h2>

      <div
        style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;"
      >
        <div>
          <h3 style="color: #667eea; margin-bottom: 15px;">渋谷テックカフェ</h3>
          <p style="margin-bottom: 10px;">
            📍 東京都渋谷区渋谷2-24-12<br />渋谷スクランブルスクエア15F
          </p>
          <p style="margin-bottom: 10px;">🚇 JR渋谷駅東口より徒歩3分</p>
          <p style="margin-bottom: 20px;">🚇 東京メトロ各線渋谷駅より直結</p>

          <div
            style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;"
          >
            <strong>🎫 参加費:</strong> 無料<br />
            <strong>🍕 懇親会:</strong> 軽食・ドリンク提供
          </div>
        </div>

        <div>
          <!-- 地図はイベントショートコードに含まれます -->
          <div
            style="background: #ddd; height: 250px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #666;"
          >
            <span>📍 Google Mapsが表示されます</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- お問い合わせ -->
  <section
    class="contact-section"
    style="padding: 40px 20px; text-align: center;"
  >
    <div style="max-width: 600px; margin: 0 auto;">
      <h3 style="margin-bottom: 20px; color: #333;">❓ ご質問・お問い合わせ</h3>
      <p style="margin-bottom: 20px;">
        イベントについてご不明な点がございましたら、お気軽にお問い合わせください。
      </p>
      <a
        href="mailto:info@lightningtalk.example.com"
        style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none;"
        >✉️ メールで問い合わせ</a
      >
    </div>
  </section>
</div>

<!-- カスタムスタイル -->
<style>
  @media (max-width: 768px) {
    .hero-section h1 {
      font-size: 2rem !important;
    }
    .info-grid > div {
      grid-template-columns: 1fr !important;
    }
    .access-section > div > div {
      grid-template-columns: 1fr !important;
    }
  }
</style>
```

### テンプレート：シンプル版

```html
<!-- 
ページタイトル: Startup Pitch Night - アイデアを形にしよう
スラッグ: startup-pitch-night
テンプレート: デフォルト
-->

<div
  class="simple-event-page"
  style="max-width: 800px; margin: 0 auto; padding: 20px;"
>
  <!-- ページヘッダー -->
  <header
    style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #eee;"
  >
    <h1 style="color: #333; margin-bottom: 10px;">🚀 Startup Pitch Night</h1>
    <p style="font-size: 1.1rem; color: #666;">アイデアを形にしよう</p>
  </header>

  <!-- イベント詳細 -->
  <section style="margin-bottom: 40px;">
    [lightning_talk_event id="124"]
  </section>

  <!-- 参加登録 -->
  <section
    style="margin-bottom: 40px; text-align: center; background: #f0f8ff; padding: 30px; border-radius: 10px;"
  >
    <h2 style="margin-bottom: 20px; color: #333;">参加登録</h2>
    <p style="margin-bottom: 25px;">
      起業家、投資家、エンジニア、デザイナー、どなたでも歓迎！
    </p>
    [lightning_talk_register event_id="124" type="both"]
  </section>

  <!-- 参加者・調査 -->
  <div
    style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;"
  >
    <div
      style="background: #fff; padding: 25px; border: 1px solid #eee; border-radius: 8px;"
    >
      <h3 style="margin-bottom: 15px; color: #333;">👥 参加予定</h3>
      [lightning_talk_participants event_id="124" type="count"]
    </div>

    <div
      style="background: #fff; padding: 25px; border: 1px solid #eee; border-radius: 8px;"
    >
      <h3 style="margin-bottom: 15px; color: #333;">📊 参加形式</h3>
      [lightning_talk_survey event_id="124"]
    </div>
  </div>

  <!-- トーク一覧 -->
  <section style="margin-bottom: 40px;">
    <h2 style="margin-bottom: 25px; color: #333;">💡 ピッチ予定</h2>
    [lightning_talk_talks event_id="124" layout="list"]
  </section>
</div>

<style>
  @media (max-width: 768px) {
    .simple-event-page > div {
      grid-template-columns: 1fr !important;
    }
  }
</style>
```

## イベント一覧ページ

### テンプレート：カード型一覧

```html
<!-- 
ページタイトル: Lightning Talk イベント一覧
スラッグ: events
テンプレート: デフォルト
-->

<div class="events-listing-page">
  <!-- ページヘッダー -->
  <section
    class="page-header"
    style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 60px 20px; text-align: center; margin-bottom: 50px;"
  >
    <div style="max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 2.5rem; margin-bottom: 20px;">
        ⚡ Lightning Talk Events
      </h1>
      <p style="font-size: 1.2rem; margin-bottom: 0;">
        技術、ビジネス、クリエイティブなアイデアを5分で共有しよう
      </p>
    </div>
  </section>

  <!-- 開催予定のイベント -->
  <section class="upcoming-events" style="margin-bottom: 60px;">
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
      <h2
        style="text-align: center; margin-bottom: 40px; color: #333; position: relative;"
      >
        📅 開催予定のイベント
        <span
          style="display: block; width: 50px; height: 3px; background: #74b9ff; margin: 10px auto 0;"
        ></span>
      </h2>

      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px;"
      >
        <!-- イベントカード1 -->
        <div
          class="event-card"
          style="background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s ease;"
        >
          <div style="padding: 30px;">
            [lightning_talk_event id="123" template="compact"]

            <div style="margin-top: 20px; display: flex; gap: 10px;">
              [lightning_talk_register event_id="123" button_text="参加登録"
              style="compact"]
              <a
                href="/events/tech-lightning-talk-1/"
                style="padding: 10px 20px; border: 2px solid #74b9ff; color: #74b9ff; text-decoration: none; border-radius: 5px; font-size: 0.9rem;"
                >詳細を見る</a
              >
            </div>

            <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
              [lightning_talk_participants event_id="123" type="count"
              format="simple"]
            </div>
          </div>
        </div>

        <!-- イベントカード2 -->
        <div
          class="event-card"
          style="background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden;"
        >
          <div style="padding: 30px;">
            [lightning_talk_event id="124" template="compact"]

            <div style="margin-top: 20px; display: flex; gap: 10px;">
              [lightning_talk_register event_id="124" button_text="参加登録"
              style="compact"]
              <a
                href="/events/startup-pitch-night/"
                style="padding: 10px 20px; border: 2px solid #74b9ff; color: #74b9ff; text-decoration: none; border-radius: 5px; font-size: 0.9rem;"
                >詳細を見る</a
              >
            </div>

            <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
              [lightning_talk_participants event_id="124" type="count"
              format="simple"]
            </div>
          </div>
        </div>

        <!-- イベントカード3 -->
        <div
          class="event-card"
          style="background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden;"
        >
          <div style="padding: 30px;">
            [lightning_talk_event id="125" template="compact"]

            <div style="margin-top: 20px; display: flex; gap: 10px;">
              [lightning_talk_register event_id="125" button_text="参加登録"
              style="compact"]
              <a
                href="/events/design-thinking-workshop/"
                style="padding: 10px 20px; border: 2px solid #74b9ff; color: #74b9ff; text-decoration: none; border-radius: 5px; font-size: 0.9rem;"
                >詳細を見る</a
              >
            </div>

            <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
              [lightning_talk_participants event_id="125" type="count"
              format="simple"]
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 過去のイベント -->
  <section class="past-events" style="background: #f8f9fa; padding: 50px 20px;">
    <div style="max-width: 1200px; margin: 0 auto;">
      <h2
        style="text-align: center; margin-bottom: 40px; color: #333; position: relative;"
      >
        📚 過去のイベント
        <span
          style="display: block; width: 50px; height: 3px; background: #74b9ff; margin: 10px auto 0;"
        ></span>
      </h2>

      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;"
      >
        <!-- 過去イベント例 -->
        <div
          style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #74b9ff;"
        >
          <h3 style="margin-bottom: 10px; color: #333;">
            AI & Machine Learning Night
          </h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">
            2025年5月20日開催
          </p>
          <p style="color: #666; font-size: 0.9rem;">
            参加者: 45名 | 発表: 8件
          </p>
        </div>

        <div
          style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #74b9ff;"
        >
          <h3 style="margin-bottom: 10px; color: #333;">
            Web開発 Latest Trends
          </h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">
            2025年4月15日開催
          </p>
          <p style="color: #666; font-size: 0.9rem;">
            参加者: 38名 | 発表: 10件
          </p>
        </div>

        <div
          style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #74b9ff;"
        >
          <h3 style="margin-bottom: 10px; color: #333;">
            ブロックチェーン入門
          </h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">
            2025年3月10日開催
          </p>
          <p style="color: #666; font-size: 0.9rem;">
            参加者: 52名 | 発表: 12件
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTAセクション -->
  <section class="cta-section" style="padding: 60px 20px; text-align: center;">
    <div style="max-width: 600px; margin: 0 auto;">
      <h2 style="margin-bottom: 20px; color: #333;">
        🎤 あなたも発表してみませんか？
      </h2>
      <p style="margin-bottom: 30px; color: #666; font-size: 1.1rem;">
        あなたの知識、経験、アイデアを5分間で共有しましょう。<br />
        技術的な内容から趣味の話まで、どんなテーマでも大歓迎です。
      </p>
      <a
        href="#upcoming-events"
        style="display: inline-block; background: #74b9ff; color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-size: 1.1rem;"
        >今すぐ参加登録</a
      >
    </div>
  </section>
</div>

<style>
  .event-card:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    .page-header h1 {
      font-size: 2rem !important;
    }
    .event-card div[style*='display: flex'] {
      flex-direction: column !important;
      gap: 10px !important;
    }
  }
</style>
```

## ランディングページ

### テンプレート：Lightning Talk紹介

```html
<!-- 
ページタイトル: Lightning Talk とは？
スラッグ: about
テンプレート: デフォルト
-->

<div class="lightning-talk-landing">
  <!-- ヒーローセクション -->
  <section
    class="hero"
    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center;"
  >
    <div style="max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: 3rem; margin-bottom: 20px; line-height: 1.2;">
        ⚡ Lightning Talk
      </h1>
      <p style="font-size: 1.5rem; margin-bottom: 10px;">5分間で世界を変える</p>
      <p style="font-size: 1.2rem; margin-bottom: 40px; opacity: 0.9;">
        あなたのアイデア、知識、体験を短時間で共有し、<br />
        新しい出会いと学びを生み出すコミュニティ
      </p>
      <a
        href="#events"
        style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1.1rem; margin: 10px;"
        >🎤 今すぐ参加</a
      >
      <a
        href="#about"
        style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1.1rem; margin: 10px;"
        >📖 詳しく知る</a
      >
    </div>
  </section>

  <!-- Lightning Talkとは -->
  <section id="about" style="padding: 80px 20px; background: white;">
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2
        style="text-align: center; margin-bottom: 50px; font-size: 2.5rem; color: #333;"
      >
        Lightning Talk とは？
      </h2>

      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 60px;"
      >
        <div style="text-align: center;">
          <div
            style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;"
          >
            ⏱️
          </div>
          <h3 style="margin-bottom: 15px; color: #333;">5分間</h3>
          <p style="color: #666;">
            短時間だからこそ、要点を絞った濃密な内容をお届け。聞き手も発表者も集中できます。
          </p>
        </div>

        <div style="text-align: center;">
          <div
            style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;"
          >
            🌟
          </div>
          <h3 style="margin-bottom: 15px; color: #333;">多様なテーマ</h3>
          <p style="color: #666;">
            技術、ビジネス、趣味、体験談など、どんなテーマでもOK。多様性こそが学びを生みます。
          </p>
        </div>

        <div style="text-align: center;">
          <div
            style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;"
          >
            👥
          </div>
          <h3 style="margin-bottom: 15px; color: #333;">コミュニティ</h3>
          <p style="color: #666;">
            発表者も参加者も対等な立場で学び合い、新しいつながりを築いていきます。
          </p>
        </div>

        <div style="text-align: center;">
          <div
            style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;"
          >
            🚀
          </div>
          <h3 style="margin-bottom: 15px; color: #333;">成長の場</h3>
          <p style="color: #666;">
            プレゼンスキルの向上、フィードバックの獲得、自信の構築につながります。
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- 参加方法 -->
  <section style="padding: 80px 20px; background: #f8f9fa;">
    <div style="max-width: 800px; margin: 0 auto; text-align: center;">
      <h2 style="margin-bottom: 50px; font-size: 2.5rem; color: #333;">
        参加方法
      </h2>

      <div
        style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px;"
      >
        <div
          style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);"
        >
          <div
            style="background: #e3f2fd; color: #1976d2; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.5rem;"
          >
            🎧
          </div>
          <h3 style="margin-bottom: 20px; color: #333;">リスナー参加</h3>
          <p style="color: #666; margin-bottom: 20px;">
            気軽に聞くだけの参加もOK。新しい知識や視点を得られます。
          </p>
          <ul style="text-align: left; color: #666; font-size: 0.9rem;">
            <li>✅ 事前登録不要</li>
            <li>✅ 質疑応答に参加可能</li>
            <li>✅ ネットワーキング</li>
          </ul>
        </div>

        <div
          style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);"
        >
          <div
            style="background: #e8f5e8; color: #388e3c; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.5rem;"
          >
            🎤
          </div>
          <h3 style="margin-bottom: 20px; color: #333;">スピーカー参加</h3>
          <p style="color: #666; margin-bottom: 20px;">
            あなたの知識や体験を5分間で共有してください。
          </p>
          <ul style="text-align: left; color: #666; font-size: 0.9rem;">
            <li>✅ 発表テーマ自由</li>
            <li>✅ フィードバック獲得</li>
            <li>✅ スキルアップ</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- 次回イベント -->
  <section id="events" style="padding: 80px 20px; background: white;">
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2
        style="text-align: center; margin-bottom: 50px; font-size: 2.5rem; color: #333;"
      >
        次回開催予定
      </h2>

      <!-- 最新イベント表示 -->
      <div
        style="background: #f8f9fa; padding: 40px; border-radius: 15px; margin-bottom: 40px;"
      >
        [lightning_talk_event id="123"]

        <div style="text-align: center; margin-top: 30px;">
          [lightning_talk_register event_id="123" type="both"]
        </div>
      </div>

      <div style="text-align: center;">
        <a
          href="/events/"
          style="color: #667eea; text-decoration: none; font-size: 1.1rem;"
          >📅 全てのイベントを見る →</a
        >
      </div>
    </div>
  </section>

  <!-- よくある質問 -->
  <section style="padding: 80px 20px; background: #f8f9fa;">
    <div style="max-width: 800px; margin: 0 auto;">
      <h2
        style="text-align: center; margin-bottom: 50px; font-size: 2.5rem; color: #333;"
      >
        よくある質問
      </h2>

      <div style="space-y: 20px;">
        <div
          style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;"
        >
          <h4 style="margin-bottom: 10px; color: #333;">
            Q. 初心者でも発表できますか？
          </h4>
          <p style="color: #666; margin: 0;">
            A.
            もちろんです！経験レベルは問いません。「今日学んだこと」「失敗から学んだこと」など、どんな内容でも歓迎です。
          </p>
        </div>

        <div
          style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;"
        >
          <h4 style="margin-bottom: 10px; color: #333;">
            Q. 発表資料は必要ですか？
          </h4>
          <p style="color: #666; margin: 0;">
            A.
            必須ではありません。スライド、デモ、口頭のみ、どの形式でもOKです。大切なのはあなたの熱意です。
          </p>
        </div>

        <div
          style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;"
        >
          <h4 style="margin-bottom: 10px; color: #333;">
            Q. オンライン参加はできますか？
          </h4>
          <p style="color: #666; margin: 0;">
            A.
            イベントによってはオンライン配信も行っています。参加登録時に選択できます。
          </p>
        </div>

        <div
          style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;"
        >
          <h4 style="margin-bottom: 10px; color: #333;">
            Q. 参加費はかかりますか？
          </h4>
          <p style="color: #666; margin: 0;">
            A.
            基本的に無料です。会場によっては軽食・ドリンク代として少額の実費をお願いする場合があります。
          </p>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2.5rem !important;
    }
    .hero p {
      font-size: 1.2rem !important;
    }
    section[style*='grid-template-columns'] > div {
      grid-template-columns: 1fr !important;
    }
  }
</style>
```

## 参加者マイページ

### テンプレート：マイページ

```html
<!-- 
ページタイトル: マイページ
スラッグ: my-page
テンプレート: デフォルト
※ このページは会員限定ページとして設定してください
-->

<div
  class="user-dashboard"
  style="max-width: 1000px; margin: 0 auto; padding: 20px;"
>
  <!-- ユーザー情報ヘッダー -->
  <section
    class="user-header"
    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 15px; margin-bottom: 40px; text-align: center;"
  >
    <h1 style="margin-bottom: 10px;">👤 マイページ</h1>
    <p style="opacity: 0.9;">参加状況と発表履歴を確認できます</p>
  </section>

  <!-- ダッシュボード情報 -->
  <section class="dashboard-stats" style="margin-bottom: 40px;">
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;"
    >
      <div
        style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;"
      >
        <div style="font-size: 2rem; margin-bottom: 10px;">🎧</div>
        <h3 style="margin-bottom: 5px; color: #333;">参加イベント</h3>
        <p
          style="font-size: 1.5rem; font-weight: bold; color: #667eea; margin: 0;"
        >
          5回
        </p>
      </div>

      <div
        style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;"
      >
        <div style="font-size: 2rem; margin-bottom: 10px;">🎤</div>
        <h3 style="margin-bottom: 5px; color: #333;">発表回数</h3>
        <p
          style="font-size: 1.5rem; font-weight: bold; color: #667eea; margin: 0;"
        >
          3回
        </p>
      </div>

      <div
        style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;"
      >
        <div style="font-size: 2rem; margin-bottom: 10px;">📊</div>
        <h3 style="margin-bottom: 5px; color: #333;">投票参加</h3>
        <p
          style="font-size: 1.5rem; font-weight: bold; color: #667eea; margin: 0;"
        >
          4回
        </p>
      </div>

      <div
        style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;"
      >
        <div style="font-size: 2rem; margin-bottom: 10px;">⭐</div>
        <h3 style="margin-bottom: 5px; color: #333;">平均評価</h3>
        <p
          style="font-size: 1.5rem; font-weight: bold; color: #667eea; margin: 0;"
        >
          4.8/5.0
        </p>
      </div>
    </div>
  </section>

  <!-- 参加予定のイベント -->
  <section class="upcoming-participation" style="margin-bottom: 40px;">
    <h2
      style="margin-bottom: 25px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;"
    >
      📅 参加予定のイベント
    </h2>

    <div
      style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
    >
      [lightning_talk_event id="123" template="compact"]

      <div
        style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;"
      >
        <p style="margin: 0; color: #1976d2;">
          <strong>参加タイプ:</strong> スピーカー
        </p>
        <p style="margin: 5px 0 0; color: #1976d2;">
          <strong>発表予定:</strong> 「React 18の新機能とパフォーマンス最適化」
        </p>
      </div>

      <div style="margin-top: 15px;">
        <a
          href="/events/tech-lightning-talk-1/"
          style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-right: 10px;"
          >詳細を見る</a
        >
        <a
          href="#"
          style="display: inline-block; background: #f44336; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;"
          >参加キャンセル</a
        >
      </div>
    </div>
  </section>

  <!-- 発表履歴 -->
  <section class="presentation-history" style="margin-bottom: 40px;">
    <h2
      style="margin-bottom: 25px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;"
    >
      🎤 発表履歴
    </h2>

    <div style="space-y: 20px;">
      <div
        style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;"
        >
          <div>
            <h3 style="margin-bottom: 5px; color: #333;">
              TypeScriptでDDDを実践する方法
            </h3>
            <p style="color: #666; margin: 0; font-size: 0.9rem;">
              AI & Machine Learning Night | 2025年5月20日
            </p>
          </div>
          <span
            style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;"
            >完了</span
          >
        </div>

        <p style="color: #666; margin-bottom: 15px; font-size: 0.9rem;">
          Domain Driven
          Design（DDD）をTypeScriptで実装する際のベストプラクティスについて発表しました。
        </p>

        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #666;">
          <span>👥 参加者: 45名</span>
          <span>⭐ 評価: 4.8/5.0</span>
          <span>💬 コメント: 12件</span>
        </div>
      </div>

      <div
        style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;"
        >
          <div>
            <h3 style="margin-bottom: 5px; color: #333;">
              リモートワークで学んだ効率化のコツ
            </h3>
            <p style="color: #666; margin: 0; font-size: 0.9rem;">
              Web開発 Latest Trends | 2025年4月15日
            </p>
          </div>
          <span
            style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem;"
            >完了</span
          >
        </div>

        <p style="color: #666; margin-bottom: 15px; font-size: 0.9rem;">
          コロナ禍で始まったリモートワークでの経験と効率化のノウハウを共有しました。
        </p>

        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #666;">
          <span>👥 参加者: 38名</span>
          <span>⭐ 評価: 4.6/5.0</span>
          <span>💬 コメント: 8件</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 参加履歴 -->
  <section class="participation-history" style="margin-bottom: 40px;">
    <h2
      style="margin-bottom: 25px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;"
    >
      📚 参加履歴
    </h2>

    <div
      style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
    >
      <div
        style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;"
      >
        <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px;">
          <h4 style="margin-bottom: 5px; color: #333; font-size: 0.95rem;">
            ブロックチェーン入門
          </h4>
          <p style="color: #666; font-size: 0.8rem; margin: 0;">
            2025年3月10日 | リスナー参加
          </p>
        </div>

        <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px;">
          <h4 style="margin-bottom: 5px; color: #333; font-size: 0.95rem;">
            クリエイティブコーディング
          </h4>
          <p style="color: #666; font-size: 0.8rem; margin: 0;">
            2025年2月20日 | リスナー参加
          </p>
        </div>

        <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px;">
          <h4 style="margin-bottom: 5px; color: #333; font-size: 0.95rem;">
            UXデザイン思考
          </h4>
          <p style="color: #666; font-size: 0.8rem; margin: 0;">
            2025年1月25日 | リスナー参加
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- 設定・アクション -->
  <section class="user-actions" style="text-align: center;">
    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
      <h3 style="margin-bottom: 20px; color: #333;">アカウント設定</h3>
      <div
        style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;"
      >
        <a
          href="#"
          style="background: #667eea; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none;"
          >プロフィール編集</a
        >
        <a
          href="#"
          style="background: #2196f3; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none;"
          >通知設定</a
        >
        <a
          href="#"
          style="background: #ff9800; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none;"
          >データエクスポート</a
        >
        <a
          href="#"
          style="background: #f44336; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none;"
          >アカウント削除</a
        >
      </div>
    </div>
  </section>
</div>

<style>
  @media (max-width: 768px) {
    .dashboard-stats > div {
      grid-template-columns: 1fr 1fr !important;
    }
    .user-actions div[style*='display: flex'] {
      flex-direction: column !important;
    }
    .participation-history div[style*='grid-template-columns'] {
      grid-template-columns: 1fr !important;
    }
  }
</style>
```

## FAQ・ヘルプページ

### テンプレート：FAQ

```html
<!-- 
ページタイトル: よくある質問
スラッグ: faq
テンプレート: デフォルト
-->

<div class="faq-page" style="max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- ページヘッダー -->
  <section class="page-header" style="text-align: center; margin-bottom: 50px;">
    <h1 style="color: #333; margin-bottom: 20px;">❓ よくある質問</h1>
    <p style="color: #666; font-size: 1.1rem;">
      Lightning Talk イベントについてよくお寄せいただく質問をまとめました。
    </p>
  </section>

  <!-- 検索ボックス -->
  <section class="faq-search" style="margin-bottom: 40px;">
    <div
      style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;"
    >
      <input
        type="text"
        placeholder="キーワードで検索..."
        style="width: 100%; max-width: 400px; padding: 12px 20px; border: 1px solid #ddd; border-radius: 25px; font-size: 1rem;"
      />
    </div>
  </section>

  <!-- FAQ カテゴリ -->
  <section class="faq-categories" style="margin-bottom: 40px;">
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; text-align: center;"
    >
      <a
        href="#general"
        style="background: #e3f2fd; color: #1976d2; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold;"
        >🏠 一般的な質問</a
      >
      <a
        href="#participation"
        style="background: #e8f5e8; color: #388e3c; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold;"
        >🎧 参加について</a
      >
      <a
        href="#presentation"
        style="background: #fff3e0; color: #f57c00; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold;"
        >🎤 発表について</a
      >
      <a
        href="#technical"
        style="background: #fce4ec; color: #c2185b; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: bold;"
        >💻 技術的な質問</a
      >
    </div>
  </section>

  <!-- FAQ一覧 -->
  <section class="faq-content">
    <!-- 一般的な質問 -->
    <div id="general" style="margin-bottom: 40px;">
      <h2
        style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #1976d2;"
      >
        🏠 一般的な質問
      </h2>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">Lightning Talk とは何ですか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            Lightning
            Talk（ライトニングトーク）は、5分間で行う短いプレゼンテーションです。技術、ビジネス、趣味など、どんなテーマでも扱えます。短時間だからこそ要点を絞った濃密な内容となり、聞き手も発表者も集中できるのが特徴です。
          </p>
        </div>
      </div>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">参加費はかかりますか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            基本的に無料です。ただし、会場によっては軽食・ドリンク代として少額の実費（500円程度）をお願いする場合があります。詳細は各イベントの詳細ページでご確認ください。
          </p>
        </div>
      </div>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">どんな人が参加していますか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            エンジニア、デザイナー、起業家、学生、フリーランスなど、様々な背景の方が参加されています。年齢も20代〜50代と幅広く、経験レベルも初心者からベテランまで多様です。
          </p>
        </div>
      </div>
    </div>

    <!-- 参加について -->
    <div id="participation" style="margin-bottom: 40px;">
      <h2
        style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #388e3c;"
      >
        🎧 参加について
      </h2>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">事前登録は必要ですか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            はい、事前登録をお願いしています。定員に限りがあるため、参加予定の方は早めの登録をおすすめします。登録は各イベントページから簡単に行えます。
          </p>
        </div>
      </div>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">オンライン参加はできますか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            イベントによってはオンライン配信も行っています。参加登録時に「オンライン参加」「会場参加」を選択できます。オンライン参加の場合、Zoom等のURL
            を事前にお送りします。
          </p>
        </div>
      </div>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">当日参加はできますか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            定員に余裕がある場合は当日参加も可能ですが、事前登録を強く推奨します。特に人気のイベントは満席になることが多いため、確実に参加されたい場合は事前登録をお願いします。
          </p>
        </div>
      </div>
    </div>

    <!-- 発表について -->
    <div id="presentation" style="margin-bottom: 40px;">
      <h2
        style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #f57c00;"
      >
        🎤 発表について
      </h2>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">初心者でも発表できますか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            もちろんです！Lightning Talk
            は経験レベルを問いません。「今日学んだこと」「失敗から学んだこと」「趣味の話」など、どんな内容でも歓迎です。むしろ初心者の視点は非常に貴重で、多くの学びを提供してくれます。
          </p>
        </div>
      </div>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">発表資料は必要ですか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            必須ではありません。スライド、デモ、口頭のみ、どの形式でもOKです。5分という短い時間なので、シンプルで分かりやすい構成を心がけてください。
          </p>
        </div>
      </div>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">
            どんなテーマで発表できますか？
          </h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            技術、ビジネス、デザイン、学習、趣味、旅行、食べ物、ゲーム、映画、音楽、スポーツなど、あらゆるテーマで発表できます。大切なのは「誰かの役に立つかもしれない」という視点です。
          </p>
        </div>
      </div>
    </div>

    <!-- 技術的な質問 -->
    <div id="technical" style="margin-bottom: 40px;">
      <h2
        style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #c2185b;"
      >
        💻 技術的な質問
      </h2>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">会場のWi-Fiは使えますか？</h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            ほとんどの会場でWi-Fiをご利用いただけます。接続情報は当日会場でお知らせします。ただし、デモや配信に使用される場合は、安定性を考慮してモバイル回線の併用をおすすめします。
          </p>
        </div>
      </div>

      <div
        class="faq-item"
        style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;"
      >
        <div
          style="padding: 20px; border-bottom: 1px solid #eee; cursor: pointer; background: #f8f9fa;"
        >
          <h3 style="margin: 0; color: #333;">
            プロジェクター・マイクは使えますか？
          </h3>
        </div>
        <div style="padding: 20px; color: #666;">
          <p>
            はい、プロジェクターとマイクを用意しています。HDMI端子での接続が基本ですので、必要に応じて変換アダプターをお持ちください。音声確認のため、発表前にテストをお願いします。
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- お問い合わせ -->
  <section
    class="contact-section"
    style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;"
  >
    <h3 style="margin-bottom: 15px; color: #333;">解決しませんでしたか？</h3>
    <p style="margin-bottom: 25px; color: #666;">
      ここに掲載されていない質問がございましたら、お気軽にお問い合わせください。
    </p>
    <a
      href="mailto:info@lightningtalk.example.com"
      style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none;"
      >✉️ お問い合わせ</a
    >
  </section>
</div>

<style>
  .faq-item div:first-child:hover {
    background: #e3f2fd !important;
  }

  @media (max-width: 768px) {
    .faq-categories > div {
      grid-template-columns: 1fr !important;
    }
  }
</style>

<script>
  // FAQ アコーディオン機能
  document.querySelectorAll('.faq-item > div:first-child').forEach(item => {
    item.addEventListener('click', function () {
      const content = this.nextElementSibling;
      content.style.display =
        content.style.display === 'none' ? 'block' : 'none';
    });
  });

  // 初期状態で全て閉じる
  document.querySelectorAll('.faq-item > div:last-child').forEach(item => {
    item.style.display = 'none';
  });
</script>
```

## お知らせページ

### テンプレート：お知らせ・新着情報

```html
<!-- 
ページタイトル: お知らせ・新着情報
スラッグ: news
テンプレート: デフォルト
-->

<div class="news-page" style="max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- ページヘッダー -->
  <section class="page-header" style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #333; margin-bottom: 15px;">📢 お知らせ・新着情報</h1>
    <p style="color: #666; font-size: 1.1rem;">
      Lightning Talk コミュニティの最新情報をお届けします
    </p>
  </section>

  <!-- お知らせ一覧 -->
  <section class="news-list">
    <!-- 重要なお知らせ -->
    <article
      class="news-item important"
      style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 25px; margin-bottom: 25px; border-left: 5px solid #f39c12;"
    >
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span
          style="background: #f39c12; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;"
          >重要</span
        >
        <span style="color: #666; font-size: 0.9rem;">2025年6月20日</span>
      </div>
      <h2 style="margin-bottom: 15px; color: #333;">
        🎉 Lightning Talk Pro Theme v1.1.0 リリース
      </h2>
      <p style="color: #666; margin-bottom: 15px;">
        Lightning Talk Pro Theme
        の最新版がリリースされました。今回のアップデートでは、以下の新機能が追加されています：
      </p>
      <ul style="color: #666; margin-bottom: 15px; padding-left: 20px;">
        <li>リアルタイム参加者数表示機能</li>
        <li>参加意向調査システム</li>
        <li>モバイル対応の改善</li>
        <li>セキュリティの強化</li>
      </ul>
      <a
        href="/releases/v1-1-0/"
        style="color: #667eea; text-decoration: none; font-weight: bold;"
        >詳細を見る →</a
      >
    </article>

    <!-- 通常のお知らせ -->
    <article
      class="news-item"
      style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;"
    >
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span
          style="background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;"
          >イベント</span
        >
        <span style="color: #666; font-size: 0.9rem;">2025年6月15日</span>
      </div>
      <h2 style="margin-bottom: 15px; color: #333;">
        🚀 7月のイベント情報を公開しました
      </h2>
      <p style="color: #666; margin-bottom: 15px;">
        7月開催予定のLightning
        Talkイベント3件の詳細情報を公開いたしました。今月は技術系、スタートアップ、デザイン思考と多様なテーマでお送りします。
      </p>
      <a
        href="/events/"
        style="color: #667eea; text-decoration: none; font-weight: bold;"
        >イベント一覧を見る →</a
      >
    </article>

    <article
      class="news-item"
      style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;"
    >
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span
          style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;"
          >機能追加</span
        >
        <span style="color: #666; font-size: 0.9rem;">2025年6月10日</span>
      </div>
      <h2 style="margin-bottom: 15px; color: #333;">
        💬 チャット機能を追加しました
      </h2>
      <p style="color: #666; margin-bottom: 15px;">
        イベントページにリアルタイムチャット機能を追加しました。参加者同士の交流や質問投稿にご活用ください。チャット履歴は7日間保存されます。
      </p>
      <a
        href="/faq/#technical"
        style="color: #667eea; text-decoration: none; font-weight: bold;"
        >使い方を見る →</a
      >
    </article>

    <article
      class="news-item"
      style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;"
    >
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span
          style="background: #ff9800; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;"
          >メンテナンス</span
        >
        <span style="color: #666; font-size: 0.9rem;">2025年6月5日</span>
      </div>
      <h2 style="margin-bottom: 15px; color: #333;">
        🔧 定期メンテナンスのお知らせ
      </h2>
      <p style="color: #666; margin-bottom: 15px;">
        システムの安定稼働のため、下記日程で定期メンテナンスを実施いたします。メンテナンス中はサービスをご利用いただけません。<br />
        <strong>日時:</strong> 2025年6月25日（日）2:00 〜 4:00（予定）
      </p>
    </article>

    <article
      class="news-item"
      style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;"
    >
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span
          style="background: #e91e63; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;"
          >コミュニティ</span
        >
        <span style="color: #666; font-size: 0.9rem;">2025年5月30日</span>
      </div>
      <h2 style="margin-bottom: 15px; color: #333;">
        👥 コミュニティガイドラインを更新しました
      </h2>
      <p style="color: #666; margin-bottom: 15px;">
        より良いコミュニティづくりのため、参加者の皆様に守っていただきたいガイドラインを更新いたしました。発表内容、質疑応答、SNS投稿時の注意点などをまとめています。
      </p>
      <a
        href="/community-guidelines/"
        style="color: #667eea; text-decoration: none; font-weight: bold;"
        >ガイドラインを読む →</a
      >
    </article>

    <article
      class="news-item"
      style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;"
    >
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span
          style="background: #9c27b0; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;"
          >統計</span
        >
        <span style="color: #666; font-size: 0.9rem;">2025年5月25日</span>
      </div>
      <h2 style="margin-bottom: 15px; color: #333;">
        📊 2025年上半期の開催実績を公開
      </h2>
      <p style="color: #666; margin-bottom: 15px;">
        2025年1月〜5月のLightning
        Talk開催実績をまとめました。総開催数15回、延べ参加者数680名、発表件数127件という結果となりました。ご参加いただいた皆様、ありがとうございました。
      </p>
      <a
        href="/statistics/2025-h1/"
        style="color: #667eea; text-decoration: none; font-weight: bold;"
        >詳細データを見る →</a
      >
    </article>
  </section>

  <!-- ページネーション -->
  <section class="pagination" style="text-align: center; margin-top: 40px;">
    <div style="display: flex; justify-content: center; gap: 10px;">
      <span
        style="background: #667eea; color: white; padding: 10px 15px; border-radius: 5px;"
        >1</span
      >
      <a
        href="?page=2"
        style="background: #f0f0f0; color: #333; padding: 10px 15px; border-radius: 5px; text-decoration: none;"
        >2</a
      >
      <a
        href="?page=3"
        style="background: #f0f0f0; color: #333; padding: 10px 15px; border-radius: 5px; text-decoration: none;"
        >3</a
      >
      <a
        href="?page=2"
        style="background: #f0f0f0; color: #333; padding: 10px 15px; border-radius: 5px; text-decoration: none;"
        >次へ →</a
      >
    </div>
  </section>

  <!-- サイドバー情報（オプション） -->
  <aside
    class="news-sidebar"
    style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 40px;"
  >
    <h3 style="margin-bottom: 20px; color: #333;">📬 最新情報をお届け</h3>
    <p style="color: #666; margin-bottom: 20px; font-size: 0.9rem;">
      新しいイベント情報やアップデート情報をいち早くお届けします。
    </p>

    <div style="margin-bottom: 20px;">
      <h4 style="margin-bottom: 10px; color: #333; font-size: 1rem;">
        🔔 通知設定
      </h4>
      <div style="font-size: 0.9rem;">
        <label style="display: block; margin-bottom: 8px; color: #666;">
          <input type="checkbox" style="margin-right: 8px;" />
          新規イベント開催通知
        </label>
        <label style="display: block; margin-bottom: 8px; color: #666;">
          <input type="checkbox" style="margin-right: 8px;" />
          システムアップデート情報
        </label>
        <label style="display: block; margin-bottom: 8px; color: #666;">
          <input type="checkbox" style="margin-right: 8px;" />
          コミュニティからのお知らせ
        </label>
      </div>
    </div>

    <div>
      <h4 style="margin-bottom: 10px; color: #333; font-size: 1rem;">
        📱 SNSでフォロー
      </h4>
      <div style="display: flex; gap: 10px;">
        <a
          href="#"
          style="background: #1da1f2; color: white; padding: 8px 12px; border-radius: 5px; text-decoration: none; font-size: 0.9rem;"
          >Twitter</a
        >
        <a
          href="#"
          style="background: #25d366; color: white; padding: 8px 12px; border-radius: 5px; text-decoration: none; font-size: 0.9rem;"
          >Discord</a
        >
        <a
          href="#"
          style="background: #0077b5; color: white; padding: 8px 12px; border-radius: 5px; text-decoration: none; font-size: 0.9rem;"
          >LinkedIn</a
        >
      </div>
    </div>
  </aside>
</div>

<style>
  @media (max-width: 768px) {
    .news-item div[style*='display: flex'] {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .news-item div[style*='display: flex'] span:first-child {
      margin-bottom: 5px !important;
      margin-right: 0 !important;
    }
    .news-sidebar div[style*='display: flex'] {
      flex-direction: column !important;
    }
  }
</style>
```

---

**Lightning Talk Pro Theme v1.1.0**  
_Professional WordPress theme for Lightning Talk event management_

WordPressページテンプレート集  
最終更新: 2025年6月24日
