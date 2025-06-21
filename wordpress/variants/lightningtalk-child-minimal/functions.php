<?php
/**
 * Lightning Talk Child Minimal Theme Functions
 * エラー診断用のミニマルテーマ
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * テーマバージョン
 */
define('LIGHTNINGTALK_MINIMAL_VERSION', '1.0.0-debug');

/**
 * 基本的なスタイルシート読み込み
 */
function lightningtalk_minimal_enqueue_styles() {
    // 親テーマのスタイル
    wp_enqueue_style(
        'cocoon-parent-style',
        get_template_directory_uri() . '/style.css',
        array(),
        wp_get_theme()->get('Version')
    );
    
    // 子テーマのスタイル
    wp_enqueue_style(
        'lightningtalk-minimal-style',
        get_stylesheet_directory_uri() . '/style.css',
        array('cocoon-parent-style'),
        LIGHTNINGTALK_MINIMAL_VERSION
    );
}
add_action('wp_enqueue_scripts', 'lightningtalk_minimal_enqueue_styles');

/**
 * テスト用ショートコード（1つだけ）
 */
function lightningtalk_test_shortcode($atts) {
    $atts = shortcode_atts(array(
        'message' => 'Lightning Talk テストメッセージ'
    ), $atts);
    
    return '<div class="lightningtalk-test">
        <h3>⚡ Lightning Talk テスト</h3>
        <p>' . esc_html($atts['message']) . '</p>
        <p><strong>テーマ動作確認:</strong> 正常</p>
        <p><strong>タイムスタンプ:</strong> ' . current_time('Y-m-d H:i:s') . '</p>
    </div>';
}
add_shortcode('lightning_talk_test', 'lightningtalk_test_shortcode');

/**
 * 管理画面に診断情報を表示
 */
function lightningtalk_minimal_admin_notice() {
    if (current_user_can('manage_options')) {
        echo '<div class="notice notice-success is-dismissible">';
        echo '<p><strong>Lightning Talk Minimal:</strong> テーマが正常に読み込まれました。';
        echo ' [lightning_talk_test] ショートコードでテストできます。</p>';
        echo '</div>';
    }
}
add_action('admin_notices', 'lightningtalk_minimal_admin_notice');

/**
 * デバッグ情報をフッターに出力（管理者のみ）
 */
function lightningtalk_minimal_debug_info() {
    if (current_user_can('manage_options') && WP_DEBUG) {
        echo '<!-- Lightning Talk Minimal Debug: Theme loaded successfully at ' . current_time('c') . ' -->';
    }
}
add_action('wp_footer', 'lightningtalk_minimal_debug_info');