# ⚡ Lightning Talk Pro Theme - カスタマイズガイド

Lightning Talk Pro
Themeの外観や機能をカスタマイズする方法について詳しく説明します。

## 📋 目次

1. [基本的なカスタマイズ](#基本的なカスタマイズ)
2. [カラーとデザイン](#カラーとデザイン)
3. [レイアウトのカスタマイズ](#レイアウトのカスタマイズ)
4. [機能の拡張](#機能の拡張)
5. [子テーマの作成](#子テーマの作成)
6. [高度なカスタマイズ](#高度なカスタマイズ)

## 基本的なカスタマイズ

### 1. WordPress カスタマイザーを使用

**外観** → **カスタマイズ**から基本的な設定を変更できます。

#### サイト基本情報

```
サイトのタイトル: Lightning Talk Circle
キャッチフレーズ: 5分で世界を変える
サイトアイコン: 32x32px以上のファビコン画像
```

#### 色の設定

```css
/* カスタマイザー > 追加CSS */
:root {
  --lt-primary: #667eea; /* メインカラー */
  --lt-secondary: #764ba2; /* セカンダリカラー */
  --lt-accent: #ff6b6b; /* アクセントカラー */
  --lt-success: #4caf50; /* 成功色 */
  --lt-warning: #ff9800; /* 警告色 */
  --lt-danger: #f44336; /* エラー色 */
  --lt-text: #333333; /* テキスト色 */
  --lt-text-light: #666666; /* ライトテキスト色 */
  --lt-background: #ffffff; /* 背景色 */
  --lt-background-light: #f8f9fa; /* ライト背景色 */
}
```

#### フォントの変更

```css
/* Google Fontsを使用する場合 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');

body {
  font-family: 'Noto Sans JP', sans-serif;
}

/* 見出しのフォント */
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 700;
}
```

### 2. ロゴとヘッダーのカスタマイズ

```css
/* ロゴサイズの調整 */
.custom-logo {
  max-height: 50px;
  width: auto;
}

/* ヘッダーの背景色変更 */
.site-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* ナビゲーションメニューのスタイル */
.main-navigation a {
  color: white;
  font-weight: 500;
  transition: color 0.3s ease;
}

.main-navigation a:hover {
  color: #ffeb3b;
}
```

## カラーとデザイン

### 1. ブランドカラーの統一

```css
/* ブランドカラーの定義 */
:root {
  /* 企業カラーに合わせた例 */
  --lt-primary: #2196f3; /* 青系 */
  --lt-secondary: #03a9f4; /* ライト青 */
  --lt-accent: #ff5722; /* オレンジ */

  /* または暖色系の例 */
  --lt-primary: #e91e63; /* ピンク */
  --lt-secondary: #9c27b0; /* パープル */
  --lt-accent: #ff9800; /* オレンジ */
}

/* ボタンにブランドカラーを適用 */
.lt-btn-primary {
  background: linear-gradient(135deg, var(--lt-primary), var(--lt-secondary));
  border: none;
  color: white;
}

.lt-btn-primary:hover {
  background: linear-gradient(135deg, var(--lt-secondary), var(--lt-primary));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(var(--lt-primary), 0.3);
}
```

### 2. ダークモードの対応

```css
/* ダークモード用のカラー定義 */
@media (prefers-color-scheme: dark) {
  :root {
    --lt-text: #ffffff;
    --lt-text-light: #cccccc;
    --lt-background: #1a1a1a;
    --lt-background-light: #2d2d2d;
    --lt-border: #444444;
  }

  body {
    background-color: var(--lt-background);
    color: var(--lt-text);
  }

  .lt-event-display,
  .lt-registration-section,
  .lt-modal-content {
    background-color: var(--lt-background-light);
    border-color: var(--lt-border);
  }
}

/* ダークモード切り替えボタン */
.dark-mode-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--lt-primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  z-index: 1000;
}
```

### 3. アニメーションの追加

```css
/* フェードインアニメーション */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lt-event-display {
  animation: fadeInUp 0.6s ease-out;
}

/* ホバーエフェクト */
.lt-event-card {
  transition: all 0.3s ease;
}

.lt-event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

/* ボタンのアニメーション */
.lt-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.lt-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s;
}

.lt-btn:hover::before {
  left: 100%;
}
```

## レイアウトのカスタマイズ

### 1. レスポンシブグリッドの調整

```css
/* イベントカードのグリッド */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  padding: 20px;
}

/* タブレット用調整 */
@media (max-width: 1024px) {
  .events-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
}

/* スマートフォン用調整 */
@media (max-width: 768px) {
  .events-grid {
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 15px;
  }
}
```

### 2. カスタムレイアウトパターン

```css
/* 2カラムレイアウト */
.two-column-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  margin: 40px 0;
}

/* 3カラムレイアウト */
.three-column-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

/* フルワイドセクション */
.full-width-section {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  padding: 60px calc(50vw - 50%);
  background: linear-gradient(135deg, var(--lt-primary), var(--lt-secondary));
  color: white;
}

/* ジグザグレイアウト */
.zigzag-section:nth-child(even) {
  flex-direction: row-reverse;
}

.zigzag-section {
  display: flex;
  align-items: center;
  gap: 40px;
  margin: 60px 0;
}
```

### 3. カスタムヘッダー・フッター

```css
/* ヘッダーのカスタマイズ */
.site-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* フッターのカスタマイズ */
.site-footer {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 60px 0 20px;
}

.footer-widgets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
  text-align: center;
  opacity: 0.8;
}
```

## 機能の拡張

### 1. カスタム投稿タイプの追加

```php
// functions.php に追加
function custom_post_types() {
    // スポンサー投稿タイプ
    register_post_type('lt_sponsor', array(
        'labels' => array(
            'name' => 'スポンサー',
            'singular_name' => 'スポンサー'
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'thumbnail'),
        'menu_icon' => 'dashicons-star-filled'
    ));

    // ニュース投稿タイプ
    register_post_type('lt_news', array(
        'labels' => array(
            'name' => 'ニュース',
            'singular_name' => 'ニュース'
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'excerpt', 'thumbnail'),
        'menu_icon' => 'dashicons-megaphone'
    ));
}
add_action('init', 'custom_post_types');
```

### 2. カスタムショートコード

```php
// スポンサー表示ショートコード
function lightning_talk_sponsors_shortcode($atts) {
    $atts = shortcode_atts(array(
        'limit' => 6,
        'layout' => 'grid'
    ), $atts);

    $sponsors = get_posts(array(
        'post_type' => 'lt_sponsor',
        'posts_per_page' => $atts['limit'],
        'post_status' => 'publish'
    ));

    $output = '<div class="lt-sponsors-' . esc_attr($atts['layout']) . '">';
    foreach ($sponsors as $sponsor) {
        $logo = get_the_post_thumbnail($sponsor->ID, 'medium');
        $output .= '<div class="lt-sponsor-item">';
        $output .= $logo;
        $output .= '<h3>' . esc_html($sponsor->post_title) . '</h3>';
        $output .= '</div>';
    }
    $output .= '</div>';

    return $output;
}
add_shortcode('lightning_talk_sponsors', 'lightning_talk_sponsors_shortcode');

// 統計情報ショートコード
function lightning_talk_stats_shortcode($atts) {
    $atts = shortcode_atts(array(
        'type' => 'all'
    ), $atts);

    $total_events = wp_count_posts('lt_event')->publish;
    $total_participants = wp_count_posts('lt_participant')->publish;
    $total_talks = wp_count_posts('lt_talk')->publish;

    $output = '<div class="lt-stats-display">';
    $output .= '<div class="lt-stat-item"><span class="lt-stat-number">' . $total_events . '</span><span class="lt-stat-label">イベント開催</span></div>';
    $output .= '<div class="lt-stat-item"><span class="lt-stat-number">' . $total_participants . '</span><span class="lt-stat-label">参加者</span></div>';
    $output .= '<div class="lt-stat-item"><span class="lt-stat-number">' . $total_talks . '</span><span class="lt-stat-label">発表</span></div>';
    $output .= '</div>';

    return $output;
}
add_shortcode('lightning_talk_stats', 'lightning_talk_stats_shortcode');
```

### 3. カスタムウィジェット

```php
// イベントカウントダウンウィジェット
class Lightning_Talk_Countdown_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'lightning_talk_countdown',
            'Lightning Talk カウントダウン',
            array('description' => '次回イベントまでのカウントダウンを表示')
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];

        $next_event = get_posts(array(
            'post_type' => 'lt_event',
            'meta_key' => 'event_date',
            'meta_value' => date('Y-m-d'),
            'meta_compare' => '>=',
            'orderby' => 'meta_value',
            'order' => 'ASC',
            'posts_per_page' => 1
        ));

        if ($next_event) {
            $event_date = get_post_meta($next_event[0]->ID, 'event_date', true);
            echo '<div class="lt-countdown-widget">';
            echo '<h3>次回イベント</h3>';
            echo '<h4>' . esc_html($next_event[0]->post_title) . '</h4>';
            echo '<div class="lt-countdown" data-date="' . esc_attr($event_date) . '"></div>';
            echo '</div>';
        }

        echo $args['after_widget'];
    }

    public function form($instance) {
        // ウィジェット管理画面のフォーム
    }
}

// ウィジェット登録
function register_lightning_talk_widgets() {
    register_widget('Lightning_Talk_Countdown_Widget');
}
add_action('widgets_init', 'register_lightning_talk_widgets');
```

## 子テーマの作成

### 1. 子テーマディレクトリの作成

```bash
# WordPress テーマディレクトリに移動
cd /wp-content/themes/

# 子テーマディレクトリ作成
mkdir lightning-talk-pro-child
cd lightning-talk-pro-child
```

### 2. style.css の作成

```css
/*
Theme Name: Lightning Talk Pro Child
Description: Lightning Talk Pro Theme の子テーマ
Template: lightning-talk-pro
Version: 1.0.0
*/

/* 親テーマのスタイルを読み込み */
@import url('../lightning-talk-pro/style.css');

/* カスタムスタイルをここに追加 */
:root {
  --lt-primary: #your-brand-color;
  --lt-secondary: #your-secondary-color;
}

/* カスタムボタンスタイル */
.lt-btn-custom {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.lt-btn-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}
```

### 3. functions.php の作成

```php
<?php
// 子テーマのfunctions.php

// 親テーマのスタイルを適切に読み込み
function lightning_talk_child_enqueue_styles() {
    $parent_style = 'lightning-talk-pro-style';

    wp_enqueue_style($parent_style, get_template_directory_uri() . '/style.css');
    wp_enqueue_style('lightning-talk-child-style',
        get_stylesheet_directory_uri() . '/style.css',
        array($parent_style),
        wp_get_theme()->get('Version')
    );
}
add_action('wp_enqueue_scripts', 'lightning_talk_child_enqueue_styles');

// カスタム機能の追加
function lightning_talk_child_custom_features() {
    // カスタム画像サイズ
    add_image_size('event-thumbnail', 400, 300, true);
    add_image_size('speaker-avatar', 150, 150, true);

    // カスタムメニューの追加
    register_nav_menus(array(
        'footer-menu' => 'フッターメニュー',
        'social-menu' => 'ソーシャルメニュー'
    ));
}
add_action('after_setup_theme', 'lightning_talk_child_custom_features');

// カスタム関数
function get_event_participant_count($event_id) {
    return get_posts(array(
        'post_type' => 'lt_participant',
        'meta_key' => 'event_id',
        'meta_value' => $event_id,
        'posts_per_page' => -1,
        'fields' => 'ids'
    ));
}
```

### 4. カスタムテンプレートファイル

```php
<?php
// single-lt_event.php - イベント詳細ページテンプレート
get_header(); ?>

<div class="custom-event-layout">
    <div class="event-hero">
        <?php if (has_post_thumbnail()): ?>
            <div class="event-featured-image">
                <?php the_post_thumbnail('large'); ?>
            </div>
        <?php endif; ?>

        <div class="event-hero-content">
            <h1 class="event-title"><?php the_title(); ?></h1>
            <div class="event-meta">
                <?php
                $event_date = get_post_meta(get_the_ID(), 'event_date', true);
                $event_time = get_post_meta(get_the_ID(), 'event_time', true);
                $venue_name = get_post_meta(get_the_ID(), 'venue_name', true);
                ?>
                <span class="event-date">📅 <?php echo date('Y年n月j日', strtotime($event_date)); ?></span>
                <span class="event-time">⏰ <?php echo $event_time; ?></span>
                <span class="event-venue">📍 <?php echo esc_html($venue_name); ?></span>
            </div>
        </div>
    </div>

    <div class="event-content">
        <div class="event-description">
            <?php the_content(); ?>
        </div>

        <div class="event-sidebar">
            <!-- 参加登録フォーム -->
            <?php echo do_shortcode('[lightning_talk_register event_id="' . get_the_ID() . '"]'); ?>

            <!-- 参加者数 -->
            <?php echo do_shortcode('[lightning_talk_participants event_id="' . get_the_ID() . '" type="count"]'); ?>
        </div>
    </div>
</div>

<?php get_footer(); ?>
```

## 高度なカスタマイズ

### 1. JavaScript機能の拡張

```javascript
// custom.js - 子テーマ用カスタムJavaScript

// カウントダウン機能
function initCountdown() {
  const countdownElements = document.querySelectorAll('.lt-countdown');

  countdownElements.forEach(element => {
    const targetDate = new Date(element.dataset.date).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        element.innerHTML = 'イベント開催中！';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      element.innerHTML = `
                <div class="countdown-item">
                    <span class="countdown-number">${days}</span>
                    <span class="countdown-label">日</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${hours}</span>
                    <span class="countdown-label">時間</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${minutes}</span>
                    <span class="countdown-label">分</span>
                </div>
            `;
    }, 1000);
  });
}

// スムーズスクロール
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initSmoothScroll();
});
```

### 2. カスタムAPIエンドポイント

```php
// REST API エンドポイントの追加
function lightning_talk_custom_api_endpoints() {
    // イベント統計API
    register_rest_route('lightning-talk/v1', '/stats', array(
        'methods' => 'GET',
        'callback' => 'get_lightning_talk_stats',
        'permission_callback' => '__return_true'
    ));

    // 参加者検索API
    register_rest_route('lightning-talk/v1', '/participants/search', array(
        'methods' => 'GET',
        'callback' => 'search_lightning_talk_participants',
        'permission_callback' => 'lightning_talk_check_permissions'
    ));
}
add_action('rest_api_init', 'lightning_talk_custom_api_endpoints');

function get_lightning_talk_stats($request) {
    $stats = array(
        'total_events' => wp_count_posts('lt_event')->publish,
        'total_participants' => wp_count_posts('lt_participant')->publish,
        'total_talks' => wp_count_posts('lt_talk')->publish,
        'monthly_events' => get_monthly_event_count()
    );

    return new WP_REST_Response($stats, 200);
}

function search_lightning_talk_participants($request) {
    $search_term = sanitize_text_field($request->get_param('search'));

    $participants = get_posts(array(
        'post_type' => 'lt_participant',
        's' => $search_term,
        'posts_per_page' => 10
    ));

    $results = array();
    foreach ($participants as $participant) {
        $results[] = array(
            'id' => $participant->ID,
            'name' => $participant->post_title,
            'email' => get_post_meta($participant->ID, 'email', true)
        );
    }

    return new WP_REST_Response($results, 200);
}
```

### 3. パフォーマンス最適化

```php
// 画像の遅延読み込み
function lightning_talk_lazy_loading($content) {
    if (is_admin()) {
        return $content;
    }

    // img タグに loading="lazy" を追加
    $content = preg_replace('/<img(.*?)src=/i', '<img$1loading="lazy" src=', $content);

    return $content;
}
add_filter('the_content', 'lightning_talk_lazy_loading');

// CSS/JSの最適化
function lightning_talk_optimize_assets() {
    if (!is_admin()) {
        // 不要なスクリプトの削除
        wp_dequeue_script('wp-embed');

        // DNS プリフェッチ
        echo '<link rel="dns-prefetch" href="//fonts.googleapis.com">';
        echo '<link rel="dns-prefetch" href="//maps.googleapis.com">';
    }
}
add_action('wp_enqueue_scripts', 'lightning_talk_optimize_assets');

// キャッシュ制御
function lightning_talk_cache_headers() {
    if (!is_admin()) {
        header('Cache-Control: public, max-age=3600');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 3600) . ' GMT');
    }
}
add_action('wp_head', 'lightning_talk_cache_headers');
```

---

**Lightning Talk Pro Theme v1.1.0**  
_Professional WordPress theme for Lightning Talk event management_

カスタマイズガイド  
最終更新: 2025年6月24日

## 追加リソース

- [WordPress テーマ開発ガイド](https://developer.wordpress.org/themes/)
- [CSS Grid レイアウト](https://developer.mozilla.org/docs/Web/CSS/CSS_Grid_Layout)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [jQuery ドキュメント](https://api.jquery.com/)

## サポート

カスタマイズでお困りの際は、[GitHub Issues](https://github.com/20m61/lightningtalk-circle/issues)
までお気軽にお問い合わせください。
