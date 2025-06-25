<?php
/**
 * Lightning Talk Event Theme Functions
 * 
 * @package LightningTalk
 * @version 1.4.0
 */

// テーマのセットアップ
function lightning_talk_setup() {
    // テーマサポート機能
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // カスタムロゴサポート
    add_theme_support('custom-logo', array(
        'height'      => 100,
        'width'       => 400,
        'flex-height' => true,
        'flex-width'  => true,
    ));
}
add_action('after_setup_theme', 'lightning_talk_setup');

// スタイルとスクリプトの読み込み
function lightning_talk_scripts() {
    // メインスタイル
    wp_enqueue_style('lightning-talk-style', get_stylesheet_uri(), array(), '1.4.0');
    
    // カスタムスタイル
    wp_enqueue_style('lightning-talk-custom', get_template_directory_uri() . '/style.min.css', array('lightning-talk-style'), '1.4.0');
    
    // Google Fonts
    wp_enqueue_style('google-fonts', 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap', array(), null);
    
    // メインスクリプト
    wp_enqueue_script('lightning-talk-script', get_template_directory_uri() . '/js/main.js', array(), '1.4.0', true);
}
add_action('wp_enqueue_scripts', 'lightning_talk_scripts');

// カスタム投稿タイプ: イベント
function lightning_talk_custom_post_types() {
    register_post_type('lt_event',
        array(
            'labels' => array(
                'name' => __('Lightning Talk Events'),
                'singular_name' => __('Lightning Talk Event')
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
            'menu_icon' => 'dashicons-megaphone',
        )
    );
}
add_action('init', 'lightning_talk_custom_post_types');

// ショートコード: イベント情報表示
function lightning_talk_event_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
    ), $atts);
    
    ob_start();
    
    if ($atts['id']) {
        $event = get_post($atts['id']);
        if ($event && $event->post_type === 'lt_event') {
            ?>
            <div class="lt-event-info">
                <h2><?php echo esc_html($event->post_title); ?></h2>
                <div class="lt-event-content">
                    <?php echo wp_kses_post($event->post_content); ?>
                </div>
            </div>
            <?php
        }
    }
    
    return ob_get_clean();
}
add_shortcode('lt_event', 'lightning_talk_event_shortcode');

// テーマカスタマイザー
function lightning_talk_customize_register($wp_customize) {
    // イベント設定セクション
    $wp_customize->add_section('lightning_talk_event_settings', array(
        'title' => __('Event Settings', 'lightning-talk'),
        'priority' => 30,
    ));
    
    // イベント日時
    $wp_customize->add_setting('event_date', array(
        'default' => '2025年6月25日(水) 19:00〜22:00',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('event_date', array(
        'label' => __('Event Date & Time', 'lightning-talk'),
        'section' => 'lightning_talk_event_settings',
        'type' => 'text',
    ));
    
    // 会場名
    $wp_customize->add_setting('venue_name', array(
        'default' => '新宿会場',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('venue_name', array(
        'label' => __('Venue Name', 'lightning-talk'),
        'section' => 'lightning_talk_event_settings',
        'type' => 'text',
    ));
    
    // オンラインURL
    $wp_customize->add_setting('online_url', array(
        'default' => 'https://meet.google.com/ycp-sdec-xsr',
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control('online_url', array(
        'label' => __('Online Meeting URL', 'lightning-talk'),
        'section' => 'lightning_talk_event_settings',
        'type' => 'url',
    ));
}
add_action('customize_register', 'lightning_talk_customize_register');

// ウィジェットエリア
function lightning_talk_widgets_init() {
    register_sidebar(array(
        'name' => __('Event Sidebar', 'lightning-talk'),
        'id' => 'event-sidebar',
        'description' => __('Add widgets here for event pages.', 'lightning-talk'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget' => '</section>',
        'before_title' => '<h2 class="widget-title">',
        'after_title' => '</h2>',
    ));
}
add_action('widgets_init', 'lightning_talk_widgets_init');

// カスタムページテンプレート
function lightning_talk_add_page_templates($templates) {
    $templates['template-event.php'] = __('Event Page Template', 'lightning-talk');
    $templates['template-registration.php'] = __('Registration Page Template', 'lightning-talk');
    return $templates;
}
add_filter('theme_page_templates', 'lightning_talk_add_page_templates');

// 管理画面のカスタマイズ
function lightning_talk_admin_menu() {
    add_menu_page(
        'Lightning Talk Theme',
        'Lightning Talk',
        'manage_options',
        'lightning-talk-theme',
        'lightning_talk_admin_page',
        'dashicons-megaphone',
        30
    );
}
add_action('admin_menu', 'lightning_talk_admin_menu');

function lightning_talk_admin_page() {
    ?>
    <div class="wrap">
        <h1>Lightning Talk Theme Settings</h1>
        <p>Welcome to Lightning Talk Event Theme! Configure your event settings in the Customizer.</p>
        <p><a href="<?php echo admin_url('customize.php'); ?>" class="button button-primary">Go to Customizer</a></p>
    </div>
    <?php
}

// テーマアクティベーション
function lightning_talk_theme_activation() {
    // デフォルトページを作成
    $default_pages = array(
        array(
            'post_title' => 'Lightning Talk Event',
            'post_content' => file_get_contents(get_template_directory() . '/index.html'),
            'post_status' => 'publish',
            'post_type' => 'page',
            'page_template' => 'template-event.php'
        ),
        array(
            'post_title' => 'Registration',
            'post_content' => file_get_contents(get_template_directory() . '/registration-form.html'),
            'post_status' => 'publish',
            'post_type' => 'page',
            'page_template' => 'template-registration.php'
        )
    );
    
    foreach ($default_pages as $page) {
        if (!get_page_by_title($page['post_title'])) {
            wp_insert_post($page);
        }
    }
}
add_action('after_switch_theme', 'lightning_talk_theme_activation');