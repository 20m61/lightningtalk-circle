<?php
/**
 * Lightning Talk Child Theme - スタンドアロン版
 * 
 * Cocoon親テーマなしでも動作する版
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

// バージョン定義
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.4');

// スタイルシートの読み込み（親テーマ不要）
function lightningtalk_enqueue_styles() {
    // 子テーマのスタイル（親テーマがなくても動作）
    wp_enqueue_style(
        'lightningtalk-style',
        get_stylesheet_directory_uri() . '/style.css',
        array(),
        LIGHTNINGTALK_CHILD_VERSION
    );
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_styles');

// テーマサポート機能の追加
function lightningtalk_theme_support() {
    // 投稿サムネイルのサポート
    add_theme_support('post-thumbnails');
    
    // タイトルタグのサポート
    add_theme_support('title-tag');
    
    // メニューのサポート
    add_theme_support('menus');
    
    // カスタムロゴのサポート
    add_theme_support('custom-logo');
    
    // HTML5のサポート
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption'
    ));
}
add_action('after_setup_theme', 'lightningtalk_theme_support');

// 基本的なメニューの登録
function lightningtalk_register_menus() {
    register_nav_menus(array(
        'primary' => 'Primary Navigation',
        'footer' => 'Footer Navigation'
    ));
}
add_action('init', 'lightningtalk_register_menus');