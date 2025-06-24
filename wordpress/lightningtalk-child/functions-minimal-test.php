<?php
/**
 * Lightning Talk Child Theme Functions - 最小テスト版
 * 
 * 最小限の機能のみで確実に動作することを目的とした版
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 子テーマのバージョン
 */
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.4');

/**
 * 親テーマと子テーマのスタイルシートを読み込む
 */
function lightningtalk_enqueue_styles() {
    // 親テーマのスタイル
    wp_enqueue_style(
        'cocoon-parent-style',
        get_template_directory_uri() . '/style.css'
    );
    
    // 子テーマのスタイル
    wp_enqueue_style(
        'lightningtalk-child-style',
        get_stylesheet_directory_uri() . '/style.css',
        array('cocoon-parent-style'),
        LIGHTNINGTALK_CHILD_VERSION
    );
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_styles');

/**
 * テーマ有効化時の処理
 */
function lightningtalk_theme_activation() {
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'lightningtalk_theme_activation');