<?php
/**
 * Lightning Talk Child Theme - 超最小版
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

// バージョン定義
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.4');

// 親テーマのスタイル読み込み
function lightningtalk_enqueue_parent_style() {
    wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_parent_style');