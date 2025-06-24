<?php
/**
 * Lightning Talk Child Theme Functions - 完全版
 * 
 * 全機能を含み、重複エラーを解決した完全版
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 子テーマのバージョン
 */
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.3');

/**
 * 必要なファイルを読み込む（エラーハンドリング付き）
 */
function lightningtalk_load_required_files() {
    $files = array(
        'shortcodes.php',
        'cocoon-compatibility.php'
    );
    
    foreach ($files as $file) {
        $file_path = get_stylesheet_directory() . '/' . $file;
        if (file_exists($file_path)) {
            require_once $file_path;
        }
    }
}
lightningtalk_load_required_files();

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
    
    // Lightning Talkフロントエンドスタイル
    $frontend_css = get_stylesheet_directory_uri() . '/assets/css/lightningtalk-frontend.css';
    if (file_exists(get_stylesheet_directory() . '/assets/css/lightningtalk-frontend.css')) {
        wp_enqueue_style(
            'lightningtalk-frontend-style',
            $frontend_css,
            array('lightningtalk-child-style'),
            LIGHTNINGTALK_CHILD_VERSION
        );
    }
    
    // Lightning Talk統合スタイル
    $integrated_css = get_stylesheet_directory_uri() . '/assets/dist/css/lightningtalk.min.css';
    if (file_exists(get_stylesheet_directory() . '/assets/dist/css/lightningtalk.min.css')) {
        wp_enqueue_style(
            'lightningtalk-integrated-style',
            $integrated_css,
            array('lightningtalk-child-style'),
            LIGHTNINGTALK_CHILD_VERSION
        );
    }
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_styles');

/**
 * フロントエンド用のJavaScriptを読み込む
 */
function lightningtalk_enqueue_frontend_scripts() {
    // Lightning Talkフロントエンドスクリプト
    $frontend_js = get_stylesheet_directory_uri() . '/assets/js/lightningtalk-frontend.js';
    if (file_exists(get_stylesheet_directory() . '/assets/js/lightningtalk-frontend.js')) {
        wp_enqueue_script(
            'lightningtalk-frontend',
            $frontend_js,
            array('jquery'),
            LIGHTNINGTALK_CHILD_VERSION,
            true
        );
        
        // Ajax設定をローカライズ
        wp_localize_script('lightningtalk-frontend', 'lightningtalkFrontend', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lightningtalk_frontend_nonce'),
            'eventId' => get_theme_mod('lightningtalk_default_event_id', 1),
            'strings' => array(
                'registrationSuccess' => __('参加登録が完了しました！', 'lightningtalk-child'),
                'registrationError' => __('登録エラーが発生しました。', 'lightningtalk-child'),
                'alreadyVoted' => __('既に投票済みです！', 'lightningtalk-child'),
                'thankYou' => __('投票ありがとうございます！', 'lightningtalk-child')
            )
        ));
    }
    
    // Lightning Talk統合スクリプト
    $integrated_js = get_stylesheet_directory_uri() . '/assets/dist/js/lightningtalk.min.js';
    if (file_exists(get_stylesheet_directory() . '/assets/dist/js/lightningtalk.min.js')) {
        wp_enqueue_script(
            'lightningtalk-integrated',
            $integrated_js,
            array('jquery'),
            LIGHTNINGTALK_CHILD_VERSION,
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_frontend_scripts');

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
    
    // 参加者投稿タイプ
    register_post_type('lt_participant', array(
        'labels' => array(
            'name' => __('参加者', 'lightningtalk-child'),
            'singular_name' => __('参加者', 'lightningtalk-child'),
            'add_new' => __('新規追加', 'lightningtalk-child'),
            'add_new_item' => __('新規参加者を追加', 'lightningtalk-child'),
            'edit_item' => __('参加者を編集', 'lightningtalk-child'),
            'new_item' => __('新規参加者', 'lightningtalk-child'),
            'view_item' => __('参加者を表示', 'lightningtalk-child'),
            'search_items' => __('参加者を検索', 'lightningtalk-child'),
            'not_found' => __('参加者が見つかりません', 'lightningtalk-child'),
            'not_found_in_trash' => __('ゴミ箱に参加者はありません', 'lightningtalk-child'),
        ),
        'public' => false,
        'publicly_queryable' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'query_var' => false,
        'capability_type' => 'post',
        'has_archive' => false,
        'hierarchical' => false,
        'menu_position' => 7,
        'menu_icon' => 'dashicons-groups',
        'supports' => array('title', 'custom-fields'),
        'show_in_rest' => true,
        'rest_base' => 'lt_participants',
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
 * REST APIエンドポイントの登録
 */
function lightningtalk_register_api_routes() {
    register_rest_route('lightningtalk/v1', '/events', array(
        'methods' => 'GET',
        'callback' => 'lightningtalk_get_events',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('lightningtalk/v1', '/events/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'lightningtalk_get_event',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('lightningtalk/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'lightningtalk_handle_registration',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'lightningtalk_register_api_routes');

/**
 * Lightning Talkイベント一覧を取得するAPI
 */
function lightningtalk_get_events($request) {
    $events = get_posts(array(
        'post_type' => 'lt_event',
        'post_status' => 'publish',
        'numberposts' => -1,
        'meta_key' => 'event_date',
        'orderby' => 'meta_value',
        'order' => 'ASC',
    ));
    
    $formatted_events = array();
    foreach ($events as $event) {
        $formatted_events[] = array(
            'id' => $event->ID,
            'title' => $event->post_title,
            'description' => $event->post_content,
            'date' => get_post_meta($event->ID, 'event_date', true),
            'venue' => get_post_meta($event->ID, 'venue_name', true),
            'online_url' => get_post_meta($event->ID, 'online_url', true),
            'status' => get_post_meta($event->ID, 'event_status', true),
            'permalink' => get_permalink($event->ID),
        );
    }
    
    return rest_ensure_response($formatted_events);
}

/**
 * 特定のLightning Talkイベントを取得するAPI
 */
function lightningtalk_get_event($request) {
    $event_id = (int) $request['id'];
    $event = get_post($event_id);
    
    if (!$event || $event->post_type !== 'lt_event') {
        return new WP_Error('not_found', 'Event not found', array('status' => 404));
    }
    
    $formatted_event = array(
        'id' => $event->ID,
        'title' => $event->post_title,
        'description' => $event->post_content,
        'date' => get_post_meta($event->ID, 'event_date', true),
        'venue' => get_post_meta($event->ID, 'venue_name', true),
        'venue_address' => get_post_meta($event->ID, 'venue_address', true),
        'online_url' => get_post_meta($event->ID, 'online_url', true),
        'capacity' => get_post_meta($event->ID, 'capacity', true),
        'status' => get_post_meta($event->ID, 'event_status', true),
        'permalink' => get_permalink($event->ID),
    );
    
    return rest_ensure_response($formatted_event);
}

/**
 * 参加登録を処理するAPI
 */
function lightningtalk_handle_registration($request) {
    // ノンスの検証
    if (!wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
        return new WP_Error('invalid_nonce', 'Invalid nonce', array('status' => 403));
    }
    
    $params = $request->get_json_params();
    
    // 必須フィールドの検証
    $required_fields = array('name', 'email', 'event_id', 'participation_type');
    foreach ($required_fields as $field) {
        if (empty($params[$field])) {
            return new WP_Error('missing_field', "Missing required field: {$field}", array('status' => 400));
        }
    }
    
    // 参加者データの保存
    $participant_data = array(
        'post_title' => sanitize_text_field($params['name']),
        'post_type' => 'lt_participant',
        'post_status' => 'publish',
        'meta_input' => array(
            'email' => sanitize_email($params['email']),
            'event_id' => intval($params['event_id']),
            'participation_type' => sanitize_text_field($params['participation_type']),
            'talk_title' => sanitize_text_field($params['talk_title'] ?? ''),
            'talk_description' => sanitize_textarea_field($params['talk_description'] ?? ''),
            'category' => sanitize_text_field($params['category'] ?? ''),
            'message' => sanitize_textarea_field($params['message'] ?? ''),
            'newsletter' => !empty($params['newsletter']),
            'registration_date' => current_time('mysql'),
        )
    );
    
    $participant_id = wp_insert_post($participant_data);
    
    if (is_wp_error($participant_id)) {
        return new WP_Error('registration_failed', 'Failed to register participant', array('status' => 500));
    }
    
    return rest_ensure_response(array(
        'success' => true,
        'participant_id' => $participant_id,
        'message' => __('参加登録が完了しました！', 'lightningtalk-child')
    ));
}

/**
 * テーマ有効化時の初期化処理
 */
function lightningtalk_theme_activation() {
    // パーマリンクをフラッシュして新しい投稿タイプのURLを有効化
    flush_rewrite_rules();
    
    // デフォルト設定を追加
    lightningtalk_set_default_settings();
}
add_action('after_switch_theme', 'lightningtalk_theme_activation');

/**
 * デフォルト設定を設定
 */
function lightningtalk_set_default_settings() {
    // Lightning Talk設定のデフォルト値
    $default_settings = array(
        'lightningtalk_enable_registration' => true,
        'lightningtalk_enable_talk_submission' => true,
        'lightningtalk_enable_email_notifications' => true,
        'lightningtalk_max_participants' => 50,
        'lightningtalk_talk_time_limit' => 5,
    );
    
    foreach ($default_settings as $key => $value) {
        if (get_option($key) === false) {
            add_option($key, $value);
        }
    }
}

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

/**
 * Ajax処理: 参加登録
 */
function lightningtalk_ajax_register_participant() {
    // ノンス検証
    if (!wp_verify_nonce($_POST['nonce'], 'lightningtalk_frontend_nonce')) {
        wp_die('セキュリティチェックに失敗しました。');
    }
    
    // 必須フィールドの検証
    $required_fields = array('name', 'email', 'participation_type', 'event_id');
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            wp_send_json_error(array('message' => $field . 'は必須です。'));
        }
    }
    
    // 参加者データの保存
    $participant_data = array(
        'post_title' => sanitize_text_field($_POST['name']),
        'post_type' => 'lt_participant',
        'post_status' => 'publish',
        'meta_input' => array(
            'email' => sanitize_email($_POST['email']),
            'participation_type' => sanitize_text_field($_POST['participation_type']),
            'event_id' => intval($_POST['event_id']),
            'organization' => sanitize_text_field($_POST['organization']),
            'emergency_contact' => sanitize_text_field($_POST['emergency_contact']),
            'marketing_consent' => isset($_POST['marketing_consent']) ? 1 : 0,
            'registration_date' => current_time('mysql')
        )
    );
    
    $participant_id = wp_insert_post($participant_data);
    
    if ($participant_id) {
        wp_send_json_success(array(
            'message' => '参加登録が完了しました！',
            'participant_id' => $participant_id
        ));
    } else {
        wp_send_json_error(array('message' => '登録に失敗しました。'));
    }
}
add_action('wp_ajax_lt_register_participant', 'lightningtalk_ajax_register_participant');
add_action('wp_ajax_nopriv_lt_register_participant', 'lightningtalk_ajax_register_participant');

/**
 * Ajax処理: 参加者数取得
 */
function lightningtalk_ajax_get_participant_count() {
    if (!wp_verify_nonce($_POST['nonce'], 'lightningtalk_frontend_nonce')) {
        wp_die('セキュリティチェックに失敗しました。');
    }
    
    $event_id = intval($_POST['event_id']);
    
    $count = get_posts(array(
        'post_type' => 'lt_participant',
        'post_status' => 'publish',
        'numberposts' => -1,
        'meta_query' => array(
            array(
                'key' => 'event_id',
                'value' => $event_id,
                'compare' => '='
            )
        ),
        'fields' => 'ids'
    ));
    
    wp_send_json_success(array('count' => count($count)));
}
add_action('wp_ajax_lt_get_participant_count', 'lightningtalk_ajax_get_participant_count');
add_action('wp_ajax_nopriv_lt_get_participant_count', 'lightningtalk_ajax_get_participant_count');