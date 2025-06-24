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
define('LIGHTNINGTALK_VERSION', '1.1.0');
define('LIGHTNINGTALK_PLUGIN_URL', get_stylesheet_directory_uri());
define('LIGHTNINGTALK_PLUGIN_PATH', get_stylesheet_directory());

// アセットの読み込み
function lightningtalk_enqueue_assets() {
    // メインスタイルシート
    wp_enqueue_style(
        'lightningtalk-style',
        get_stylesheet_directory_uri() . '/style.css',
        array(),
        LIGHTNINGTALK_VERSION
    );
    
    // Lightning Talk専用CSS
    wp_enqueue_style(
        'lightningtalk-main',
        get_stylesheet_directory_uri() . '/assets/css/lightning-talk.css',
        array('lightningtalk-style'),
        LIGHTNINGTALK_VERSION
    );
    
    // jQuery（WordPress標準）
    wp_enqueue_script('jquery');
    
    // Lightning Talk JavaScript
    wp_enqueue_script(
        'lightningtalk-main',
        get_stylesheet_directory_uri() . '/assets/js/lightning-talk.js',
        array('jquery'),
        LIGHTNINGTALK_VERSION,
        true
    );
    
    // AJAX用のlocalize
    wp_localize_script('lightningtalk-main', 'lightningtalk_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('lightningtalk_nonce'),
        'strings' => array(
            'registration_success' => '登録が完了しました！',
            'registration_error' => '登録に失敗しました。再度お試しください。',
            'loading' => '処理中...',
        )
    ));
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_assets');

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

// =============================================================================
// カスタム投稿タイプの登録
// =============================================================================

function lightningtalk_register_post_types() {
    // イベント投稿タイプ
    register_post_type('lt_event', array(
        'labels' => array(
            'name' => 'Lightning Talkイベント',
            'singular_name' => 'イベント',
            'add_new' => '新規追加',
            'add_new_item' => '新しいイベントを追加',
            'edit_item' => 'イベントを編集',
            'new_item' => '新しいイベント',
            'view_item' => 'イベントを表示',
            'search_items' => 'イベントを検索',
            'not_found' => 'イベントが見つかりませんでした',
            'not_found_in_trash' => 'ゴミ箱にイベントは見つかりませんでした'
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'menu_icon' => 'dashicons-calendar-alt',
        'rewrite' => array('slug' => 'events'),
        'show_in_rest' => true
    ));
    
    // 参加者投稿タイプ
    register_post_type('lt_participant', array(
        'labels' => array(
            'name' => '参加者',
            'singular_name' => '参加者',
            'add_new' => '新規追加',
            'add_new_item' => '新しい参加者を追加',
            'edit_item' => '参加者を編集',
            'new_item' => '新しい参加者',
            'view_item' => '参加者を表示',
            'search_items' => '参加者を検索',
            'not_found' => '参加者が見つかりませんでした',
            'not_found_in_trash' => 'ゴミ箱に参加者は見つかりませんでした'
        ),
        'public' => false,
        'show_ui' => true,
        'supports' => array('title'),
        'menu_icon' => 'dashicons-groups',
        'capabilities' => array(
            'edit_post' => 'edit_participants',
            'read_post' => 'read_participants',
            'delete_post' => 'delete_participants',
            'edit_posts' => 'edit_participants',
            'edit_others_posts' => 'edit_participants',
            'publish_posts' => 'publish_participants',
            'read_private_posts' => 'read_participants'
        )
    ));
    
    // トーク投稿タイプ
    register_post_type('lt_talk', array(
        'labels' => array(
            'name' => 'Lightning Talk',
            'singular_name' => 'トーク',
            'add_new' => '新規追加',
            'add_new_item' => '新しいトークを追加',
            'edit_item' => 'トークを編集',
            'new_item' => '新しいトーク',
            'view_item' => 'トークを表示',
            'search_items' => 'トークを検索',
            'not_found' => 'トークが見つかりませんでした',
            'not_found_in_trash' => 'ゴミ箱にトークは見つかりませんでした'
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'menu_icon' => 'dashicons-microphone',
        'rewrite' => array('slug' => 'talks'),
        'show_in_rest' => true
    ));
}
add_action('init', 'lightningtalk_register_post_types');

// タクソノミーの登録
function lightningtalk_register_taxonomies() {
    // トークカテゴリー
    register_taxonomy('talk_category', 'lt_talk', array(
        'labels' => array(
            'name' => 'トークカテゴリー',
            'singular_name' => 'カテゴリー',
            'search_items' => 'カテゴリーを検索',
            'all_items' => 'すべてのカテゴリー',
            'edit_item' => 'カテゴリーを編集',
            'update_item' => 'カテゴリーを更新',
            'add_new_item' => '新しいカテゴリーを追加',
            'new_item_name' => '新しいカテゴリー名'
        ),
        'hierarchical' => true,
        'public' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'talk-category'),
        'show_in_rest' => true
    ));
    
    // イベントステータス
    register_taxonomy('event_status', 'lt_event', array(
        'labels' => array(
            'name' => 'イベントステータス',
            'singular_name' => 'ステータス'
        ),
        'hierarchical' => false,
        'public' => false,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => false
    ));
}
add_action('init', 'lightningtalk_register_taxonomies');

// サーベイレスポンス投稿タイプ
register_post_type('lt_survey_response', array(
    'labels' => array(
        'name' => 'アンケート回答',
        'singular_name' => '回答'
    ),
    'public' => false,
    'show_ui' => true,
    'supports' => array('title'),
    'menu_icon' => 'dashicons-chart-bar',
    'capabilities' => array(
        'edit_post' => 'manage_options',
        'read_post' => 'manage_options',
        'delete_post' => 'manage_options',
        'edit_posts' => 'manage_options',
        'edit_others_posts' => 'manage_options',
        'publish_posts' => 'manage_options',
        'read_private_posts' => 'manage_options'
    )
));

// =============================================================================
// カスタムフィールドの登録
// =============================================================================

function lightningtalk_add_meta_boxes() {
    // イベントメタボックス
    add_meta_box(
        'event_details',
        'イベント詳細',
        'lightningtalk_event_meta_box',
        'lt_event',
        'normal',
        'high'
    );
    
    // 参加者メタボックス
    add_meta_box(
        'participant_details',
        '参加者詳細',
        'lightningtalk_participant_meta_box',
        'lt_participant',
        'normal',
        'high'
    );
    
    // トークメタボックス
    add_meta_box(
        'talk_details',
        'トーク詳細',
        'lightningtalk_talk_meta_box',
        'lt_talk',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'lightningtalk_add_meta_boxes');

// =============================================================================
// ショートコードの登録
// =============================================================================

// イベント表示ショートコード
function lightningtalk_event_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'template' => 'default'
    ), $atts);
    
    ob_start();
    include get_stylesheet_directory() . '/templates/shortcode-event.php';
    return ob_get_clean();
}
add_shortcode('lightning_talk_event', 'lightningtalk_event_shortcode');

// 参加登録ボタンショートコード
function lightningtalk_register_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => get_the_ID(),
        'button_text' => '参加登録',
        'type' => 'both' // listener, speaker, both
    ), $atts);
    
    ob_start();
    include get_stylesheet_directory() . '/templates/shortcode-register.php';
    return ob_get_clean();
}
add_shortcode('lightning_talk_register', 'lightningtalk_register_shortcode');

// 参加者カウントショートコード
function lightningtalk_participants_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => get_the_ID(),
        'type' => 'count' // count, list
    ), $atts);
    
    ob_start();
    include get_stylesheet_directory() . '/templates/shortcode-participants.php';
    return ob_get_clean();
}
add_shortcode('lightning_talk_participants', 'lightningtalk_participants_shortcode');

// 参加意向調査ショートコード
function lightningtalk_survey_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => get_the_ID()
    ), $atts);
    
    ob_start();
    include get_stylesheet_directory() . '/templates/shortcode-survey.php';
    return ob_get_clean();
}
add_shortcode('lightning_talk_survey', 'lightningtalk_survey_shortcode');

// =============================================================================
// AJAX ハンドラー
// =============================================================================

// 参加登録処理
function lightningtalk_handle_registration() {
    check_ajax_referer('lightningtalk_nonce', 'nonce');
    
    $event_id = intval($_POST['event_id']);
    $participant_type = sanitize_text_field($_POST['participant_type']);
    $name = sanitize_text_field($_POST['name']);
    $email = sanitize_email($_POST['email']);
    
    // バリデーション
    if (empty($name) || empty($email) || !is_email($email)) {
        wp_send_json_error('必要な情報が入力されていません。');
    }
    
    // 参加者データを保存
    $participant_id = wp_insert_post(array(
        'post_title' => $name,
        'post_type' => 'lt_participant',
        'post_status' => 'publish',
        'meta_input' => array(
            'event_id' => $event_id,
            'participant_type' => $participant_type,
            'email' => $email,
            'registration_date' => current_time('mysql'),
            'status' => 'confirmed'
        )
    ));
    
    if ($participant_id) {
        wp_send_json_success('参加登録が完了しました！');
    } else {
        wp_send_json_error('登録処理中にエラーが発生しました。');
    }
}
add_action('wp_ajax_lightningtalk_register', 'lightningtalk_handle_registration');
add_action('wp_ajax_nopriv_lightningtalk_register', 'lightningtalk_handle_registration');

// 参加意向調査投票処理
function lightningtalk_handle_survey_vote() {
    check_ajax_referer('lightningtalk_nonce', 'nonce');
    
    $event_id = intval($_POST['event_id']);
    $vote_type = sanitize_text_field($_POST['vote_type']); // online or offline
    
    // IPアドレスベースの重複チェック
    $user_ip = $_SERVER['REMOTE_ADDR'];
    $existing_vote = get_posts(array(
        'post_type' => 'lt_survey_response',
        'meta_query' => array(
            array(
                'key' => 'event_id',
                'value' => $event_id
            ),
            array(
                'key' => 'voter_ip',
                'value' => $user_ip
            )
        ),
        'posts_per_page' => 1
    ));
    
    if (!empty($existing_vote)) {
        wp_send_json_error('既に投票済みです。');
    }
    
    // 投票データを保存
    $vote_id = wp_insert_post(array(
        'post_title' => 'Survey Vote - ' . $event_id . ' - ' . date('Y-m-d H:i:s'),
        'post_type' => 'lt_survey_response',
        'post_status' => 'publish',
        'meta_input' => array(
            'event_id' => $event_id,
            'vote_type' => $vote_type,
            'voter_ip' => $user_ip,
            'vote_date' => current_time('mysql')
        )
    ));
    
    if ($vote_id) {
        // 現在の投票数を取得
        $counts = lightningtalk_get_survey_counts($event_id);
        wp_send_json_success(array(
            'message' => '投票ありがとうございます！',
            'counts' => $counts
        ));
    } else {
        wp_send_json_error('投票処理中にエラーが発生しました。');
    }
}
add_action('wp_ajax_lightningtalk_survey_vote', 'lightningtalk_handle_survey_vote');
add_action('wp_ajax_nopriv_lightningtalk_survey_vote', 'lightningtalk_handle_survey_vote');

// =============================================================================
// ユーティリティ関数
// =============================================================================

// 調査結果カウント取得
function lightningtalk_get_survey_counts($event_id) {
    $online_count = get_posts(array(
        'post_type' => 'lt_survey_response',
        'meta_query' => array(
            array('key' => 'event_id', 'value' => $event_id),
            array('key' => 'vote_type', 'value' => 'online')
        ),
        'posts_per_page' => -1,
        'fields' => 'ids'
    ));
    
    $offline_count = get_posts(array(
        'post_type' => 'lt_survey_response',
        'meta_query' => array(
            array('key' => 'event_id', 'value' => $event_id),
            array('key' => 'vote_type', 'value' => 'offline')
        ),
        'posts_per_page' => -1,
        'fields' => 'ids'
    ));
    
    return array(
        'online' => count($online_count),
        'offline' => count($offline_count),
        'total' => count($online_count) + count($offline_count)
    );
}

// 参加者数取得
function lightningtalk_get_participant_count($event_id, $type = 'all') {
    $meta_query = array(
        array('key' => 'event_id', 'value' => $event_id)
    );
    
    if ($type !== 'all') {
        $meta_query[] = array('key' => 'participant_type', 'value' => $type);
    }
    
    $participants = get_posts(array(
        'post_type' => 'lt_participant',
        'meta_query' => $meta_query,
        'posts_per_page' => -1,
        'fields' => 'ids'
    ));
    
    return count($participants);
}

// 参加者数AJAXエンドポイント
function lightningtalk_ajax_get_participant_count() {
    check_ajax_referer('lightningtalk_nonce', 'nonce');
    
    $event_id = intval($_POST['event_id']);
    
    $counts = array(
        'total' => lightningtalk_get_participant_count($event_id, 'all'),
        'listeners' => lightningtalk_get_participant_count($event_id, 'listener'),
        'speakers' => lightningtalk_get_participant_count($event_id, 'speaker')
    );
    
    wp_send_json_success($counts);
}
add_action('wp_ajax_lightningtalk_get_participant_count', 'lightningtalk_ajax_get_participant_count');
add_action('wp_ajax_nopriv_lightningtalk_get_participant_count', 'lightningtalk_ajax_get_participant_count');

// =============================================================================
// メタボックスの実装
// =============================================================================

// イベントメタボックス
function lightningtalk_event_meta_box($post) {
    wp_nonce_field('lightningtalk_save_event_meta', 'lightningtalk_event_nonce');
    
    $event_date = get_post_meta($post->ID, 'event_date', true);
    $event_time = get_post_meta($post->ID, 'event_time', true);
    $venue_name = get_post_meta($post->ID, 'venue_name', true);
    $venue_address = get_post_meta($post->ID, 'venue_address', true);
    $venue_lat = get_post_meta($post->ID, 'venue_lat', true);
    $venue_lng = get_post_meta($post->ID, 'venue_lng', true);
    $capacity = get_post_meta($post->ID, 'capacity', true);
    $max_talks = get_post_meta($post->ID, 'max_talks', true);
    $registration_deadline = get_post_meta($post->ID, 'registration_deadline', true);
    $event_status = get_post_meta($post->ID, 'event_status', true);
    
    echo '<table class="form-table">';
    
    // イベント日時
    echo '<tr><th><label for="event_date">イベント日</label></th><td>';
    echo '<input type="date" id="event_date" name="event_date" value="' . esc_attr($event_date) . '" style="width: 200px;" />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="event_time">開始時刻</label></th><td>';
    echo '<input type="time" id="event_time" name="event_time" value="' . esc_attr($event_time) . '" style="width: 150px;" />';
    echo '</td></tr>';
    
    // 会場情報
    echo '<tr><th><label for="venue_name">会場名</label></th><td>';
    echo '<input type="text" id="venue_name" name="venue_name" value="' . esc_attr($venue_name) . '" style="width: 100%;" />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="venue_address">会場住所</label></th><td>';
    echo '<textarea id="venue_address" name="venue_address" rows="3" style="width: 100%;">' . esc_textarea($venue_address) . '</textarea>';
    echo '</td></tr>';
    
    echo '<tr><th><label for="venue_lat">緯度</label></th><td>';
    echo '<input type="number" id="venue_lat" name="venue_lat" value="' . esc_attr($venue_lat) . '" step="0.000001" style="width: 200px;" placeholder="35.681236" />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="venue_lng">経度</label></th><td>';
    echo '<input type="number" id="venue_lng" name="venue_lng" value="' . esc_attr($venue_lng) . '" step="0.000001" style="width: 200px;" placeholder="139.767125" />';
    echo '</td></tr>';
    
    // 定員等
    echo '<tr><th><label for="capacity">定員</label></th><td>';
    echo '<input type="number" id="capacity" name="capacity" value="' . esc_attr($capacity) . '" min="1" style="width: 100px;" /> 名';
    echo '</td></tr>';
    
    echo '<tr><th><label for="max_talks">最大トーク数</label></th><td>';
    echo '<input type="number" id="max_talks" name="max_talks" value="' . esc_attr($max_talks) . '" min="1" style="width: 100px;" /> 件';
    echo '</td></tr>';
    
    echo '<tr><th><label for="registration_deadline">申込締切</label></th><td>';
    echo '<input type="date" id="registration_deadline" name="registration_deadline" value="' . esc_attr($registration_deadline) . '" style="width: 200px;" />';
    echo '</td></tr>';
    
    // ステータス
    echo '<tr><th><label for="event_status">イベントステータス</label></th><td>';
    echo '<select id="event_status" name="event_status">';
    $statuses = array(
        'upcoming' => '開催予定',
        'ongoing' => '開催中',
        'completed' => '開催終了',
        'cancelled' => '中止'
    );
    foreach ($statuses as $value => $label) {
        echo '<option value="' . esc_attr($value) . '"' . selected($event_status, $value, false) . '>' . esc_html($label) . '</option>';
    }
    echo '</select>';
    echo '</td></tr>';
    
    echo '</table>';
}

// 参加者メタボックス
function lightningtalk_participant_meta_box($post) {
    wp_nonce_field('lightningtalk_save_participant_meta', 'lightningtalk_participant_nonce');
    
    $event_id = get_post_meta($post->ID, 'event_id', true);
    $participant_type = get_post_meta($post->ID, 'participant_type', true);
    $email = get_post_meta($post->ID, 'email', true);
    $emergency_contact = get_post_meta($post->ID, 'emergency_contact', true);
    $dietary_restrictions = get_post_meta($post->ID, 'dietary_restrictions', true);
    $accessibility_needs = get_post_meta($post->ID, 'accessibility_needs', true);
    $registration_date = get_post_meta($post->ID, 'registration_date', true);
    $status = get_post_meta($post->ID, 'status', true);
    
    echo '<table class="form-table">';
    
    // イベント選択
    echo '<tr><th><label for="event_id">イベント</label></th><td>';
    $events = get_posts(array('post_type' => 'lt_event', 'posts_per_page' => -1));
    echo '<select id="event_id" name="event_id" required>';
    echo '<option value="">イベントを選択</option>';
    foreach ($events as $event) {
        echo '<option value="' . $event->ID . '"' . selected($event_id, $event->ID, false) . '>' . esc_html($event->post_title) . '</option>';
    }
    echo '</select>';
    echo '</td></tr>';
    
    // 参加タイプ
    echo '<tr><th><label for="participant_type">参加タイプ</label></th><td>';
    echo '<select id="participant_type" name="participant_type" required>';
    echo '<option value="listener"' . selected($participant_type, 'listener', false) . '>リスナー</option>';
    echo '<option value="speaker"' . selected($participant_type, 'speaker', false) . '>スピーカー</option>';
    echo '</select>';
    echo '</td></tr>';
    
    echo '<tr><th><label for="email">メールアドレス</label></th><td>';
    echo '<input type="email" id="email" name="email" value="' . esc_attr($email) . '" style="width: 100%;" required />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="emergency_contact">緊急連絡先</label></th><td>';
    echo '<input type="tel" id="emergency_contact" name="emergency_contact" value="' . esc_attr($emergency_contact) . '" style="width: 100%;" />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="dietary_restrictions">食事制限</label></th><td>';
    echo '<textarea id="dietary_restrictions" name="dietary_restrictions" rows="3" style="width: 100%;">' . esc_textarea($dietary_restrictions) . '</textarea>';
    echo '</td></tr>';
    
    echo '<tr><th><label for="accessibility_needs">アクセシビリティ要件</label></th><td>';
    echo '<textarea id="accessibility_needs" name="accessibility_needs" rows="3" style="width: 100%;">' . esc_textarea($accessibility_needs) . '</textarea>';
    echo '</td></tr>';
    
    echo '<tr><th><label for="registration_date">登録日時</label></th><td>';
    echo '<input type="datetime-local" id="registration_date" name="registration_date" value="' . esc_attr(date('Y-m-d\TH:i', strtotime($registration_date ?: 'now'))) . '" style="width: 250px;" />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="status">ステータス</label></th><td>';
    echo '<select id="status" name="status">';
    $statuses = array(
        'confirmed' => '確定',
        'pending' => '承認待ち',
        'cancelled' => 'キャンセル'
    );
    foreach ($statuses as $value => $label) {
        echo '<option value="' . esc_attr($value) . '"' . selected($status, $value, false) . '>' . esc_html($label) . '</option>';
    }
    echo '</select>';
    echo '</td></tr>';
    
    echo '</table>';
}

// トークメタボックス
function lightningtalk_talk_meta_box($post) {
    wp_nonce_field('lightningtalk_save_talk_meta', 'lightningtalk_talk_nonce');
    
    $event_id = get_post_meta($post->ID, 'event_id', true);
    $speaker_name = get_post_meta($post->ID, 'speaker_name', true);
    $speaker_email = get_post_meta($post->ID, 'speaker_email', true);
    $duration = get_post_meta($post->ID, 'duration', true);
    $talk_status = get_post_meta($post->ID, 'talk_status', true);
    $slides_url = get_post_meta($post->ID, 'slides_url', true);
    
    echo '<table class="form-table">';
    
    echo '<tr><th><label for="event_id">イベント</label></th><td>';
    $events = get_posts(array('post_type' => 'lt_event', 'posts_per_page' => -1));
    echo '<select id="event_id" name="event_id" required>';
    echo '<option value="">イベントを選択</option>';
    foreach ($events as $event) {
        echo '<option value="' . $event->ID . '"' . selected($event_id, $event->ID, false) . '>' . esc_html($event->post_title) . '</option>';
    }
    echo '</select>';
    echo '</td></tr>';
    
    echo '<tr><th><label for="speaker_name">スピーカー名</label></th><td>';
    echo '<input type="text" id="speaker_name" name="speaker_name" value="' . esc_attr($speaker_name) . '" style="width: 100%;" required />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="speaker_email">スピーカーメール</label></th><td>';
    echo '<input type="email" id="speaker_email" name="speaker_email" value="' . esc_attr($speaker_email) . '" style="width: 100%;" required />';
    echo '</td></tr>';
    
    echo '<tr><th><label for="duration">発表時間</label></th><td>';
    echo '<select id="duration" name="duration">';
    $durations = array(3 => '3分', 5 => '5分', 10 => '10分', 15 => '15分');
    foreach ($durations as $value => $label) {
        echo '<option value="' . esc_attr($value) . '"' . selected($duration, $value, false) . '>' . esc_html($label) . '</option>';
    }
    echo '</select>';
    echo '</td></tr>';
    
    echo '<tr><th><label for="talk_status">ステータス</label></th><td>';
    echo '<select id="talk_status" name="talk_status">';
    $statuses = array(
        'pending' => '承認待ち',
        'confirmed' => '承認済み',
        'rejected' => '却下'
    );
    foreach ($statuses as $value => $label) {
        echo '<option value="' . esc_attr($value) . '"' . selected($talk_status, $value, false) . '>' . esc_html($label) . '</option>';
    }
    echo '</select>';
    echo '</td></tr>';
    
    echo '<tr><th><label for="slides_url">スライドURL</label></th><td>';
    echo '<input type="url" id="slides_url" name="slides_url" value="' . esc_attr($slides_url) . '" style="width: 100%;" placeholder="https://" />';
    echo '</td></tr>';
    
    echo '</table>';
}

// メタデータ保存
function lightningtalk_save_post_meta($post_id) {
    // 自動保存やリビジョンのチェック
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (wp_is_post_revision($post_id)) return;
    
    $post_type = get_post_type($post_id);
    
    // イベントメタデータの保存
    if ($post_type === 'lt_event' && isset($_POST['lightningtalk_event_nonce']) && wp_verify_nonce($_POST['lightningtalk_event_nonce'], 'lightningtalk_save_event_meta')) {
        $fields = array(
            'event_date', 'event_time', 'venue_name', 'venue_address', 'venue_lat', 'venue_lng',
            'capacity', 'max_talks', 'registration_deadline', 'event_status'
        );
        
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
            }
        }
    }
    
    // 参加者メタデータの保存
    if ($post_type === 'lt_participant' && isset($_POST['lightningtalk_participant_nonce']) && wp_verify_nonce($_POST['lightningtalk_participant_nonce'], 'lightningtalk_save_participant_meta')) {
        $fields = array(
            'event_id', 'participant_type', 'email', 'emergency_contact', 'dietary_restrictions',
            'accessibility_needs', 'registration_date', 'status'
        );
        
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                if ($field === 'registration_date') {
                    $date = $_POST[$field] ? date('Y-m-d H:i:s', strtotime($_POST[$field])) : '';
                    update_post_meta($post_id, $field, $date);
                } else {
                    update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
                }
            }
        }
    }
    
    // トークメタデータの保存
    if ($post_type === 'lt_talk' && isset($_POST['lightningtalk_talk_nonce']) && wp_verify_nonce($_POST['lightningtalk_talk_nonce'], 'lightningtalk_save_talk_meta')) {
        $fields = array(
            'event_id', 'speaker_name', 'speaker_email', 'duration', 'talk_status', 'slides_url'
        );
        
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
            }
        }
    }
}
add_action('save_post', 'lightningtalk_save_post_meta');

// =============================================================================
// 管理画面のカスタマイズ
// =============================================================================

// 管理メニューのカスタマイズ
function lightningtalk_admin_menu() {
    add_menu_page(
        'Lightning Talk 管理',
        'Lightning Talk',
        'manage_options',
        'lightningtalk-dashboard',
        'lightningtalk_admin_dashboard',
        'dashicons-microphone',
        30
    );
    
    add_submenu_page(
        'lightningtalk-dashboard',
        'ダッシュボード',
        'ダッシュボード',
        'manage_options',
        'lightningtalk-dashboard',
        'lightningtalk_admin_dashboard'
    );
    
    add_submenu_page(
        'lightningtalk-dashboard',
        '設定',
        '設定',
        'manage_options',
        'lightningtalk-settings',
        'lightningtalk_admin_settings'
    );
}
add_action('admin_menu', 'lightningtalk_admin_menu');

// ダッシュボードページ
function lightningtalk_admin_dashboard() {
    $total_events = wp_count_posts('lt_event')->publish;
    $total_participants = wp_count_posts('lt_participant')->publish;
    $total_talks = wp_count_posts('lt_talk')->publish;
    
    echo '<div class="wrap">';
    echo '<h1>⚡ Lightning Talk ダッシュボード</h1>';
    
    echo '<div class="lt-admin-dashboard">';
    echo '<div class="lt-admin-stats">';
    
    echo '<div class="lt-stat-card">';
    echo '<div class="lt-stat-number">' . $total_events . '</div>';
    echo '<div class="lt-stat-label">イベント数</div>';
    echo '</div>';
    
    echo '<div class="lt-stat-card">';
    echo '<div class="lt-stat-number">' . $total_participants . '</div>';
    echo '<div class="lt-stat-label">総参加者数</div>';
    echo '</div>';
    
    echo '<div class="lt-stat-card">';
    echo '<div class="lt-stat-number">' . $total_talks . '</div>';
    echo '<div class="lt-stat-label">総トーク数</div>';
    echo '</div>';
    
    echo '</div>';
    
    // 最近のイベント
    $recent_events = get_posts(array(
        'post_type' => 'lt_event',
        'posts_per_page' => 5,
        'orderby' => 'date',
        'order' => 'DESC'
    ));
    
    if (!empty($recent_events)) {
        echo '<h2>最近のイベント</h2>';
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr><th>イベント名</th><th>開催日</th><th>参加者数</th><th>ステータス</th></tr></thead>';
        echo '<tbody>';
        
        foreach ($recent_events as $event) {
            $event_date = get_post_meta($event->ID, 'event_date', true);
            $event_status = get_post_meta($event->ID, 'event_status', true);
            $participant_count = lightningtalk_get_participant_count($event->ID);
            
            echo '<tr>';
            echo '<td><a href="' . get_edit_post_link($event->ID) . '">' . esc_html($event->post_title) . '</a></td>';
            echo '<td>' . esc_html($event_date ? date('Y/m/d', strtotime($event_date)) : '-') . '</td>';
            echo '<td>' . $participant_count . '名</td>';
            echo '<td>' . esc_html($event_status ?: '未設定') . '</td>';
            echo '</tr>';
        }
        
        echo '</tbody></table>';
    }
    
    echo '</div>';
    echo '</div>';
}

// 設定ページ
function lightningtalk_admin_settings() {
    if (isset($_POST['submit'])) {
        update_option('lightningtalk_default_capacity', intval($_POST['default_capacity']));
        update_option('lightningtalk_default_max_talks', intval($_POST['default_max_talks']));
        update_option('lightningtalk_google_maps_api_key', sanitize_text_field($_POST['google_maps_api_key']));
        echo '<div class="notice notice-success"><p>設定を保存しました。</p></div>';
    }
    
    $default_capacity = get_option('lightningtalk_default_capacity', 50);
    $default_max_talks = get_option('lightningtalk_default_max_talks', 10);
    $google_maps_api_key = get_option('lightningtalk_google_maps_api_key', '');
    
    echo '<div class="wrap">';
    echo '<h1>⚡ Lightning Talk 設定</h1>';
    echo '<form method="post">';
    echo '<table class="form-table">';
    
    echo '<tr><th><label for="default_capacity">デフォルト定員</label></th><td>';
    echo '<input type="number" id="default_capacity" name="default_capacity" value="' . $default_capacity . '" min="1" /> 名';
    echo '</td></tr>';
    
    echo '<tr><th><label for="default_max_talks">デフォルト最大トーク数</label></th><td>';
    echo '<input type="number" id="default_max_talks" name="default_max_talks" value="' . $default_max_talks . '" min="1" /> 件';
    echo '</td></tr>';
    
    echo '<tr><th><label for="google_maps_api_key">Google Maps APIキー</label></th><td>';
    echo '<input type="text" id="google_maps_api_key" name="google_maps_api_key" value="' . esc_attr($google_maps_api_key) . '" style="width: 400px;" />';
    echo '<p class="description">会場地図表示に必要です。</p>';
    echo '</td></tr>';
    
    echo '</table>';
    echo '<p class="submit"><input type="submit" name="submit" class="button-primary" value="設定を保存" /></p>';
    echo '</form>';
    echo '</div>';
}

// Google Maps APIの読み込み
function lightningtalk_enqueue_google_maps() {
    $api_key = get_option('lightningtalk_google_maps_api_key', '');
    if ($api_key) {
        wp_enqueue_script(
            'google-maps',
            'https://maps.googleapis.com/maps/api/js?key=' . $api_key,
            array(),
            null,
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_google_maps');

// カラムのカスタマイズ
function lightningtalk_custom_columns($columns, $post_type) {
    if ($post_type === 'lt_event') {
        $columns['event_date'] = '開催日';
        $columns['participants'] = '参加者数';
        $columns['status'] = 'ステータス';
    } elseif ($post_type === 'lt_participant') {
        $columns['event'] = 'イベント';
        $columns['participant_type'] = 'タイプ';
        $columns['email'] = 'メール';
        $columns['status'] = 'ステータス';
    }
    return $columns;
}
add_filter('manage_posts_columns', 'lightningtalk_custom_columns', 10, 2);

// カラム内容の表示
function lightningtalk_custom_column_content($column, $post_id) {
    switch ($column) {
        case 'event_date':
            $date = get_post_meta($post_id, 'event_date', true);
            echo $date ? date('Y/m/d', strtotime($date)) : '-';
            break;
            
        case 'participants':
            echo lightningtalk_get_participant_count($post_id) . '名';
            break;
            
        case 'status':
            $status = get_post_meta($post_id, get_post_type() === 'lt_event' ? 'event_status' : 'status', true);
            echo esc_html($status ?: '-');
            break;
            
        case 'event':
            $event_id = get_post_meta($post_id, 'event_id', true);
            if ($event_id) {
                $event = get_post($event_id);
                echo $event ? '<a href="' . get_edit_post_link($event_id) . '">' . esc_html($event->post_title) . '</a>' : '-';
            } else {
                echo '-';
            }
            break;
            
        case 'participant_type':
            $type = get_post_meta($post_id, 'participant_type', true);
            echo $type === 'speaker' ? '🎤 スピーカー' : '👂 リスナー';
            break;
            
        case 'email':
            echo esc_html(get_post_meta($post_id, 'email', true));
            break;
    }
}
add_action('manage_posts_custom_column', 'lightningtalk_custom_column_content', 10, 2);

// デフォルトタクソノミータームの追加
function lightningtalk_add_default_terms() {
    // トークカテゴリーのデフォルトターム
    $categories = array(
        'tech' => '技術',
        'hobby' => '趣味',
        'learning' => '学習',
        'travel' => '旅行',
        'food' => '食べ物',
        'game' => 'ゲーム',
        'book' => '本',
        'movie' => '映画',
        'music' => '音楽',
        'sports' => 'スポーツ',
        'business' => 'ビジネス',
        'lifestyle' => 'ライフスタイル'
    );
    
    foreach ($categories as $slug => $name) {
        if (!term_exists($name, 'talk_category')) {
            wp_insert_term($name, 'talk_category', array('slug' => $slug));
        }
    }
    
    // イベントステータスのデフォルトターム
    $statuses = array(
        'upcoming' => '開催予定',
        'ongoing' => '開催中',
        'completed' => '開催終了',
        'cancelled' => '中止'
    );
    
    foreach ($statuses as $slug => $name) {
        if (!term_exists($name, 'event_status')) {
            wp_insert_term($name, 'event_status', array('slug' => $slug));
        }
    }
}
add_action('init', 'lightningtalk_add_default_terms', 20);