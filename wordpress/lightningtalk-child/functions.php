<?php
/**
 * Lightning Talk Child Theme Functions
 * 
 * このファイルでは、Cocoon親テーマの機能を拡張し、
 * Lightning Talkイベント管理システムの機能を追加します。
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 子テーマのバージョン
 */
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.0');

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
    
    // Lightning Talkメインスタイル（ビルド後）
    wp_enqueue_style(
        'lightningtalk-main-style',
        get_stylesheet_directory_uri() . '/assets/dist/css/lightningtalk.min.css',
        array('lightningtalk-child-style'),
        LIGHTNINGTALK_CHILD_VERSION
    );
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_styles');

/**
 * Lightning TalkのJavaScriptファイルを読み込む
 */
function lightningtalk_enqueue_scripts() {
    // Lightning Talkメインスクリプト（ビルド後）
    wp_enqueue_script(
        'lightningtalk-main-script',
        get_stylesheet_directory_uri() . '/assets/dist/js/lightningtalk.min.js',
        array('jquery'),
        LIGHTNINGTALK_CHILD_VERSION,
        true
    );
    
    // WordPress環境での設定をJavaScriptに渡す
    wp_localize_script('lightningtalk-main-script', 'lightningtalk_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('lightningtalk_nonce'),
        'api_base' => home_url('/wp-json/lightningtalk/v1/'),
        'translations' => array(
            'registration_success' => __('参加登録が完了しました！', 'lightningtalk-child'),
            'registration_error' => __('登録に失敗しました。もう一度お試しください。', 'lightningtalk-child'),
            'loading' => __('送信中...', 'lightningtalk-child'),
        )
    ));
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_scripts');

/**
 * Lightning Talk用のカスタム投稿タイプを登録
 */
function lightningtalk_register_post_types() {
    // Lightning Talkイベント
    register_post_type('lt_event', array(
        'labels' => array(
            'name' => __('Lightning Talkイベント', 'lightningtalk-child'),
            'singular_name' => __('イベント', 'lightningtalk-child'),
            'add_new' => __('新規イベント追加', 'lightningtalk-child'),
            'add_new_item' => __('新しいイベントを追加', 'lightningtalk-child'),
            'edit_item' => __('イベントを編集', 'lightningtalk-child'),
            'new_item' => __('新しいイベント', 'lightningtalk-child'),
            'view_item' => __('イベントを表示', 'lightningtalk-child'),
            'search_items' => __('イベントを検索', 'lightningtalk-child'),
            'not_found' => __('イベントが見つかりません', 'lightningtalk-child'),
            'not_found_in_trash' => __('ゴミ箱にイベントはありません', 'lightningtalk-child'),
        ),
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-microphone',
        'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
        'rewrite' => array('slug' => 'events'),
        'show_in_rest' => true,
    ));
    
    // Lightning Talk発表
    register_post_type('lt_talk', array(
        'labels' => array(
            'name' => __('Lightning Talk発表', 'lightningtalk-child'),
            'singular_name' => __('発表', 'lightningtalk-child'),
            'add_new' => __('新規発表追加', 'lightningtalk-child'),
            'add_new_item' => __('新しい発表を追加', 'lightningtalk-child'),
            'edit_item' => __('発表を編集', 'lightningtalk-child'),
            'new_item' => __('新しい発表', 'lightningtalk-child'),
            'view_item' => __('発表を表示', 'lightningtalk-child'),
            'search_items' => __('発表を検索', 'lightningtalk-child'),
            'not_found' => __('発表が見つかりません', 'lightningtalk-child'),
            'not_found_in_trash' => __('ゴミ箱に発表はありません', 'lightningtalk-child'),
        ),
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-slides',
        'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
        'rewrite' => array('slug' => 'talks'),
        'show_in_rest' => true,
    ));
    
    // Lightning Talk参加者
    register_post_type('lt_participant', array(
        'labels' => array(
            'name' => __('参加者', 'lightningtalk-child'),
            'singular_name' => __('参加者', 'lightningtalk-child'),
            'add_new' => __('新規参加者追加', 'lightningtalk-child'),
            'add_new_item' => __('新しい参加者を追加', 'lightningtalk-child'),
            'edit_item' => __('参加者を編集', 'lightningtalk-child'),
            'new_item' => __('新しい参加者', 'lightningtalk-child'),
            'view_item' => __('参加者を表示', 'lightningtalk-child'),
            'search_items' => __('参加者を検索', 'lightningtalk-child'),
            'not_found' => __('参加者が見つかりません', 'lightningtalk-child'),
            'not_found_in_trash' => __('ゴミ箱に参加者はありません', 'lightningtalk-child'),
        ),
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => 'lightningtalk-admin',
        'capability_type' => 'post',
        'supports' => array('title', 'custom-fields'),
        'show_in_rest' => true,
    ));
}
add_action('init', 'lightningtalk_register_post_types');

/**
 * Lightning Talk用のタクソノミーを登録
 */
function lightningtalk_register_taxonomies() {
    // 発表カテゴリー
    register_taxonomy('lt_talk_category', 'lt_talk', array(
        'labels' => array(
            'name' => __('発表カテゴリー', 'lightningtalk-child'),
            'singular_name' => __('カテゴリー', 'lightningtalk-child'),
            'add_new_item' => __('新しいカテゴリーを追加', 'lightningtalk-child'),
            'edit_item' => __('カテゴリーを編集', 'lightningtalk-child'),
            'update_item' => __('カテゴリーを更新', 'lightningtalk-child'),
            'view_item' => __('カテゴリーを表示', 'lightningtalk-child'),
            'search_items' => __('カテゴリーを検索', 'lightningtalk-child'),
        ),
        'hierarchical' => true,
        'public' => true,
        'rewrite' => array('slug' => 'talk-category'),
        'show_in_rest' => true,
    ));
}
add_action('init', 'lightningtalk_register_taxonomies');

/**
 * Lightning Talk REST APIエンドポイントを追加
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
    
    register_rest_route('lightningtalk/v1', '/talks', array(
        'methods' => array('GET', 'POST'),
        'callback' => 'lightningtalk_handle_talks',
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
    
    // 確認メールの送信（オプション）
    lightningtalk_send_confirmation_email($participant_id);
    
    return rest_ensure_response(array(
        'success' => true,
        'participant_id' => $participant_id,
        'message' => __('参加登録が完了しました！', 'lightningtalk-child')
    ));
}

/**
 * 発表情報を処理するAPI
 */
function lightningtalk_handle_talks($request) {
    if ($request->get_method() === 'GET') {
        $event_id = $request->get_param('event_id');
        $talks = get_posts(array(
            'post_type' => 'lt_talk',
            'post_status' => 'publish',
            'numberposts' => -1,
            'meta_query' => array(
                array(
                    'key' => 'event_id',
                    'value' => $event_id,
                    'compare' => '='
                )
            )
        ));
        
        $formatted_talks = array();
        foreach ($talks as $talk) {
            $formatted_talks[] = array(
                'id' => $talk->ID,
                'title' => $talk->post_title,
                'description' => $talk->post_content,
                'speaker' => get_post_meta($talk->ID, 'speaker_name', true),
                'category' => get_post_meta($talk->ID, 'category', true),
                'duration' => get_post_meta($talk->ID, 'duration', true),
            );
        }
        
        return rest_ensure_response($formatted_talks);
    }
    
    // POST処理（発表登録）
    return lightningtalk_handle_registration($request);
}

/**
 * 確認メールを送信
 */
function lightningtalk_send_confirmation_email($participant_id) {
    $participant = get_post($participant_id);
    $email = get_post_meta($participant_id, 'email', true);
    $event_id = get_post_meta($participant_id, 'event_id', true);
    $event = get_post($event_id);
    
    if (!$email || !$event) {
        return false;
    }
    
    $subject = sprintf(__('[Lightning Talk] %s 参加登録確認', 'lightningtalk-child'), $event->post_title);
    
    $message = sprintf(
        __('
%s 様

Lightning Talkイベントへの参加登録ありがとうございます。

■ イベント情報
イベント名: %s
開催日時: %s
会場: %s

■ 参加情報
お名前: %s
参加方法: %s

詳細については、イベントページをご確認ください：
%s

ご質問がございましたら、お気軽にお問い合わせください。

Lightning Talk運営チーム
        ', 'lightningtalk-child'),
        $participant->post_title,
        $event->post_title,
        get_post_meta($event_id, 'event_date', true),
        get_post_meta($event_id, 'venue_name', true),
        $participant->post_title,
        get_post_meta($participant_id, 'participation_type', true),
        get_permalink($event_id)
    );
    
    return wp_mail($email, $subject, $message);
}

/**
 * 管理画面にLightning Talk用のメニューを追加
 */
function lightningtalk_admin_menu() {
    add_menu_page(
        __('Lightning Talk', 'lightningtalk-child'),
        __('Lightning Talk', 'lightningtalk-child'),
        'manage_options',
        'lightningtalk-admin',
        'lightningtalk_admin_page',
        'dashicons-microphone',
        30
    );
    
    add_submenu_page(
        'lightningtalk-admin',
        __('参加者管理', 'lightningtalk-child'),
        __('参加者管理', 'lightningtalk-child'),
        'manage_options',
        'lightningtalk-participants',
        'lightningtalk_participants_page'
    );
}
add_action('admin_menu', 'lightningtalk_admin_menu');

/**
 * Lightning Talk管理ページ
 */
function lightningtalk_admin_page() {
    echo '<div class="wrap">';
    echo '<h1>' . __('Lightning Talk 管理', 'lightningtalk-child') . '</h1>';
    echo '<p>' . __('Lightning Talkイベント管理システムへようこそ。', 'lightningtalk-child') . '</p>';
    
    // 統計情報の表示
    $events_count = wp_count_posts('lt_event')->publish;
    $talks_count = wp_count_posts('lt_talk')->publish;
    $participants_count = wp_count_posts('lt_participant')->publish;
    
    echo '<div class="dashboard-widgets-wrap">';
    echo '<div class="metabox-holder">';
    echo '<div class="postbox">';
    echo '<h3>' . __('統計情報', 'lightningtalk-child') . '</h3>';
    echo '<div class="inside">';
    echo '<p>' . sprintf(__('イベント数: %d', 'lightningtalk-child'), $events_count) . '</p>';
    echo '<p>' . sprintf(__('発表数: %d', 'lightningtalk-child'), $talks_count) . '</p>';
    echo '<p>' . sprintf(__('参加者数: %d', 'lightningtalk-child'), $participants_count) . '</p>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    echo '</div>';
}

/**
 * 参加者管理ページ
 */
function lightningtalk_participants_page() {
    // 参加者一覧の表示（簡易版）
    echo '<div class="wrap">';
    echo '<h1>' . __('参加者管理', 'lightningtalk-child') . '</h1>';
    
    $participants = get_posts(array(
        'post_type' => 'lt_participant',
        'post_status' => 'publish',
        'numberposts' => 50,
        'orderby' => 'date',
        'order' => 'DESC'
    ));
    
    if ($participants) {
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr>';
        echo '<th>' . __('名前', 'lightningtalk-child') . '</th>';
        echo '<th>' . __('メール', 'lightningtalk-child') . '</th>';
        echo '<th>' . __('参加方法', 'lightningtalk-child') . '</th>';
        echo '<th>' . __('登録日', 'lightningtalk-child') . '</th>';
        echo '</tr></thead>';
        echo '<tbody>';
        
        foreach ($participants as $participant) {
            echo '<tr>';
            echo '<td>' . esc_html($participant->post_title) . '</td>';
            echo '<td>' . esc_html(get_post_meta($participant->ID, 'email', true)) . '</td>';
            echo '<td>' . esc_html(get_post_meta($participant->ID, 'participation_type', true)) . '</td>';
            echo '<td>' . esc_html($participant->post_date) . '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
    } else {
        echo '<p>' . __('参加者がまだいません。', 'lightningtalk-child') . '</p>';
    }
    
    echo '</div>';
}

/**
 * 追加機能を読み込み
 */
require_once get_stylesheet_directory() . '/shortcodes.php';
require_once get_stylesheet_directory() . '/cocoon-compatibility.php';

/**
 * WordPress管理画面用のスクリプトとスタイルを読み込み
 */
function lightningtalk_enqueue_admin_assets($hook) {
    // Lightning Talk関連ページでのみ読み込み
    if (strpos($hook, 'lightningtalk') !== false || 
        get_current_screen()->post_type === 'lt_event' || 
        get_current_screen()->post_type === 'lt_talk' ||
        get_current_screen()->post_type === 'lt_participant') {
        
        wp_enqueue_script(
            'lightningtalk-admin-script',
            get_stylesheet_directory_uri() . '/assets/dist/js/admin.min.js',
            array('jquery', 'jquery-ui-datepicker'),
            LIGHTNINGTALK_CHILD_VERSION,
            true
        );
        
        wp_enqueue_style(
            'lightningtalk-admin-style',
            get_stylesheet_directory_uri() . '/assets/dist/css/admin.min.css',
            array(),
            LIGHTNINGTALK_CHILD_VERSION
        );
        
        // 管理画面用の設定をJavaScriptに渡す
        wp_localize_script('lightningtalk-admin-script', 'lightningtalk_admin', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lightningtalk_admin_nonce'),
            'translations' => array(
                'confirm_delete' => __('削除してもよろしいですか？', 'lightningtalk-child'),
                'bulk_action_select' => __('操作を選択してください。', 'lightningtalk-child'),
                'no_participants_selected' => __('参加者を選択してください。', 'lightningtalk-child'),
            )
        ));
        
        // jQuery UI CSS
        wp_enqueue_style('jquery-ui-css', 'https://code.jquery.com/ui/1.13.2/themes/ui-lightness/jquery-ui.css');
    }
}
add_action('admin_enqueue_scripts', 'lightningtalk_enqueue_admin_assets');


/**
 * CocoonのカスタマイザーにLightning Talk設定を追加
 */
function lightningtalk_customize_register($wp_customize) {
    // Lightning Talkセクション
    $wp_customize->add_section('lightningtalk_settings', array(
        'title' => __('Lightning Talk設定', 'lightningtalk-child'),
        'priority' => 130,
    ));
    
    // API設定
    $wp_customize->add_setting('lightningtalk_api_url', array(
        'default' => home_url('/wp-json/lightningtalk/v1/'),
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control('lightningtalk_api_url', array(
        'label' => __('API URL', 'lightningtalk-child'),
        'section' => 'lightningtalk_settings',
        'type' => 'url',
    ));
    
    // デフォルトイベントID
    $wp_customize->add_setting('lightningtalk_default_event_id', array(
        'default' => '',
        'sanitize_callback' => 'absint',
    ));
    
    $wp_customize->add_control('lightningtalk_default_event_id', array(
        'label' => __('デフォルトイベントID', 'lightningtalk-child'),
        'section' => 'lightningtalk_settings',
        'type' => 'number',
    ));
}
add_action('customize_register', 'lightningtalk_customize_register');

/**
 * Cocoon設定との統合
 */
function lightningtalk_cocoon_integration() {
    // Cocoonのカスタムフィールドを利用した設定
    if (function_exists('get_theme_mod')) {
        // テーマカスタマイザーから設定を取得
        $api_url = get_theme_mod('lightningtalk_api_url', home_url('/wp-json/lightningtalk/v1/'));
        $default_event_id = get_theme_mod('lightningtalk_default_event_id', '');
        
        // JavaScript変数として出力
        wp_add_inline_script('lightningtalk-main-script', "
            window.LightningTalkConfig = {
                apiUrl: '" . esc_js($api_url) . "',
                defaultEventId: '" . esc_js($default_event_id) . "',
                nonce: '" . wp_create_nonce('wp_rest') . "'
            };
        ", 'before');
    }
}
add_action('wp_enqueue_scripts', 'lightningtalk_cocoon_integration', 20);