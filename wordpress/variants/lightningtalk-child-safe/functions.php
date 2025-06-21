<?php
/**
 * Lightning Talk Child Theme Functions - Safe Version
 * 
 * 段階的実装による安全版テーマ
 * 問題が発生する機能を特定するため、最小限から開始
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 子テーマのバージョン
 */
define('LIGHTNINGTALK_SAFE_VERSION', '1.0.0-safe');

/**
 * 親テーマと子テーマのスタイルシートを適切に読み込む
 */
function lightningtalk_safe_enqueue_styles() {
    // 親テーマのスタイル
    wp_enqueue_style(
        'cocoon-parent-style',
        get_template_directory_uri() . '/style.css',
        array(),
        wp_get_theme()->get('Version')
    );
    
    // 子テーマのスタイル
    wp_enqueue_style(
        'lightningtalk-safe-style',
        get_stylesheet_directory_uri() . '/style.css',
        array('cocoon-parent-style'),
        LIGHTNINGTALK_SAFE_VERSION
    );
}
add_action('wp_enqueue_scripts', 'lightningtalk_safe_enqueue_styles');

/**
 * 基本的なショートコード（1つのみ）
 */
function lightningtalk_safe_test_shortcode($atts) {
    $atts = shortcode_atts(array(
        'message' => 'Lightning Talk Safe Test'
    ), $atts);
    
    return '<div class="lightningtalk-container">
        <div class="lt-event-card">
            <h3>⚡ Lightning Talk Safe Version</h3>
            <p>' . esc_html($atts['message']) . '</p>
            <p><strong>Status:</strong> Theme loaded successfully</p>
            <p><strong>Time:</strong> ' . current_time('Y-m-d H:i:s') . '</p>
        </div>
    </div>';
}
add_shortcode('lightning_talk_safe', 'lightningtalk_safe_test_shortcode');

/**
 * 管理画面通知
 */
function lightningtalk_safe_admin_notice() {
    if (current_user_can('manage_options')) {
        echo '<div class="notice notice-success is-dismissible">';
        echo '<p><strong>Lightning Talk Safe:</strong> Theme activated successfully. ';
        echo 'Test with [lightning_talk_safe] shortcode.</p>';
        echo '</div>';
    }
}
add_action('admin_notices', 'lightningtalk_safe_admin_notice');