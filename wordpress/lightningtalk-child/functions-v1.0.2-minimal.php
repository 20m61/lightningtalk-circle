<?php
/**
 * Lightning Talk Child Theme Functions - 安全版
 * 
 * 最小限の機能のみで重複を排除した安全なバージョン
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 子テーマのバージョン
 */
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.2');

/**
 * 親テーマと子テーマのスタイルシートを適切に読み込む
 */
function lightningtalk_enqueue_styles() {
    // 親テーマのスタイル
    wp_enqueue_style(
        'cocoon-parent-style',
        get_template_directory_uri() . '/style.css',
        array(),
        wp_get_theme()->get('Version')
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
 * カスタム投稿タイプの登録
 */
function lightningtalk_register_post_types() {
    // イベント投稿タイプ
    register_post_type('lt_event', array(
        'labels' => array(
            'name' => __('イベント', 'lightningtalk-child'),
            'singular_name' => __('イベント', 'lightningtalk-child'),
            'add_new' => __('新規追加', 'lightningtalk-child'),
            'add_new_item' => __('新規イベントを追加', 'lightningtalk-child'),
            'edit_item' => __('イベントを編集', 'lightningtalk-child'),
            'new_item' => __('新規イベント', 'lightningtalk-child'),
            'view_item' => __('イベントを表示', 'lightningtalk-child'),
            'search_items' => __('イベントを検索', 'lightningtalk-child'),
            'not_found' => __('イベントが見つかりません', 'lightningtalk-child'),
            'not_found_in_trash' => __('ゴミ箱にイベントはありません', 'lightningtalk-child'),
        ),
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'events'),
        'capability_type' => 'post',
        'has_archive' => true,
        'hierarchical' => false,
        'menu_position' => 5,
        'menu_icon' => 'dashicons-calendar-alt',
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
        'show_in_rest' => true,
        'rest_base' => 'lt_events',
    ));
    
    // 発表投稿タイプ
    register_post_type('lt_talk', array(
        'labels' => array(
            'name' => __('発表', 'lightningtalk-child'),
            'singular_name' => __('発表', 'lightningtalk-child'),
            'add_new' => __('新規追加', 'lightningtalk-child'),
            'add_new_item' => __('新規発表を追加', 'lightningtalk-child'),
            'edit_item' => __('発表を編集', 'lightningtalk-child'),
            'new_item' => __('新規発表', 'lightningtalk-child'),
            'view_item' => __('発表を表示', 'lightningtalk-child'),
            'search_items' => __('発表を検索', 'lightningtalk-child'),
            'not_found' => __('発表が見つかりません', 'lightningtalk-child'),
            'not_found_in_trash' => __('ゴミ箱に発表はありません', 'lightningtalk-child'),
        ),
        'public' => true,
        'publicly_queryable' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'talks'),
        'capability_type' => 'post',
        'has_archive' => true,
        'hierarchical' => false,
        'menu_position' => 6,
        'menu_icon' => 'dashicons-microphone',
        'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt', 'custom-fields'),
        'show_in_rest' => true,
        'rest_base' => 'lt_talks',
    ));
}
add_action('init', 'lightningtalk_register_post_types');

/**
 * カスタムタクソノミーの登録
 */
function lightningtalk_register_taxonomies() {
    // 発表カテゴリー
    register_taxonomy('lt_talk_category', 'lt_talk', array(
        'labels' => array(
            'name' => __('発表カテゴリー', 'lightningtalk-child'),
            'singular_name' => __('発表カテゴリー', 'lightningtalk-child'),
            'search_items' => __('カテゴリーを検索', 'lightningtalk-child'),
            'all_items' => __('すべてのカテゴリー', 'lightningtalk-child'),
            'parent_item' => __('親カテゴリー', 'lightningtalk-child'),
            'parent_item_colon' => __('親カテゴリー:', 'lightningtalk-child'),
            'edit_item' => __('カテゴリーを編集', 'lightningtalk-child'),
            'update_item' => __('カテゴリーを更新', 'lightningtalk-child'),
            'add_new_item' => __('新規カテゴリーを追加', 'lightningtalk-child'),
            'new_item_name' => __('新規カテゴリー名', 'lightningtalk-child'),
            'menu_name' => __('カテゴリー', 'lightningtalk-child'),
        ),
        'hierarchical' => true,
        'public' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'talk-category'),
        'show_in_rest' => true,
    ));
}
add_action('init', 'lightningtalk_register_taxonomies');

/**
 * テーマ有効化時の初期化処理
 */
function lightningtalk_theme_activation() {
    // パーマリンクをフラッシュして新しい投稿タイプのURLを有効化
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'lightningtalk_theme_activation');

/**
 * セキュリティ強化
 */
function lightningtalk_security_headers() {
    if (is_admin() || (defined('REST_REQUEST') && REST_REQUEST)) {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }
}
add_action('init', 'lightningtalk_security_headers');