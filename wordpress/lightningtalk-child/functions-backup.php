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
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.1');

/**
 * 必要なファイルを読み込む
 */
require_once get_stylesheet_directory() . '/shortcodes.php';
require_once get_stylesheet_directory() . '/cocoon-compatibility.php';

// 管理画面機能を読み込む
if (is_admin()) {
    require_once get_stylesheet_directory() . '/includes/admin-dashboard.php';
    require_once get_stylesheet_directory() . '/includes/webhook-handler.php';
    require_once get_stylesheet_directory() . '/includes/api-integration.php';
    new LightningTalk_Admin_Dashboard();
    new LightningTalk_Webhook_Handler();
    new LightningTalk_API_Integration();
}

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
 * イベント用メタボックスの追加
 */
function lightningtalk_add_event_metaboxes() {
    add_meta_box(
        'lt_event_details',
        __('イベント詳細', 'lightningtalk-child'),
        'lightningtalk_event_details_callback',
        'lt_event',
        'normal',
        'high'
    );
    
    add_meta_box(
        'lt_event_venue',
        __('会場情報', 'lightningtalk-child'),
        'lightningtalk_event_venue_callback',
        'lt_event',
        'normal',
        'default'
    );
    
    add_meta_box(
        'lt_event_registration',
        __('参加登録設定', 'lightningtalk-child'),
        'lightningtalk_event_registration_callback',
        'lt_event',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'lightningtalk_add_event_metaboxes');

/**
 * イベント詳細メタボックスのコールバック
 */
function lightningtalk_event_details_callback($post) {
    wp_nonce_field('lightningtalk_event_details', 'lightningtalk_event_details_nonce');
    
    $event_date = get_post_meta($post->ID, 'event_date', true);
    $event_time = get_post_meta($post->ID, 'event_time', true);
    $event_status = get_post_meta($post->ID, 'event_status', true);
    $event_format = get_post_meta($post->ID, 'event_format', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="event_date"><?php _e('開催日', 'lightningtalk-child'); ?></label></th>
            <td><input type="date" id="event_date" name="event_date" value="<?php echo esc_attr($event_date); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="event_time"><?php _e('開催時間', 'lightningtalk-child'); ?></label></th>
            <td><input type="time" id="event_time" name="event_time" value="<?php echo esc_attr($event_time); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="event_status"><?php _e('ステータス', 'lightningtalk-child'); ?></label></th>
            <td>
                <select id="event_status" name="event_status">
                    <option value="upcoming" <?php selected($event_status, 'upcoming'); ?>><?php _e('開催予定', 'lightningtalk-child'); ?></option>
                    <option value="ongoing" <?php selected($event_status, 'ongoing'); ?>><?php _e('開催中', 'lightningtalk-child'); ?></option>
                    <option value="completed" <?php selected($event_status, 'completed'); ?>><?php _e('終了', 'lightningtalk-child'); ?></option>
                    <option value="cancelled" <?php selected($event_status, 'cancelled'); ?>><?php _e('中止', 'lightningtalk-child'); ?></option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="event_format"><?php _e('開催形式', 'lightningtalk-child'); ?></label></th>
            <td>
                <select id="event_format" name="event_format">
                    <option value="offline" <?php selected($event_format, 'offline'); ?>><?php _e('オフライン', 'lightningtalk-child'); ?></option>
                    <option value="online" <?php selected($event_format, 'online'); ?>><?php _e('オンライン', 'lightningtalk-child'); ?></option>
                    <option value="hybrid" <?php selected($event_format, 'hybrid'); ?>><?php _e('ハイブリッド', 'lightningtalk-child'); ?></option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * 会場情報メタボックスのコールバック
 */
function lightningtalk_event_venue_callback($post) {
    $venue_name = get_post_meta($post->ID, 'venue_name', true);
    $venue_address = get_post_meta($post->ID, 'venue_address', true);
    $online_url = get_post_meta($post->ID, 'online_url', true);
    $map_url = get_post_meta($post->ID, 'map_url', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="venue_name"><?php _e('会場名', 'lightningtalk-child'); ?></label></th>
            <td><input type="text" id="venue_name" name="venue_name" value="<?php echo esc_attr($venue_name); ?>" class="large-text" /></td>
        </tr>
        <tr>
            <th><label for="venue_address"><?php _e('住所', 'lightningtalk-child'); ?></label></th>
            <td><input type="text" id="venue_address" name="venue_address" value="<?php echo esc_attr($venue_address); ?>" class="large-text" /></td>
        </tr>
        <tr>
            <th><label for="online_url"><?php _e('オンラインURL', 'lightningtalk-child'); ?></label></th>
            <td><input type="url" id="online_url" name="online_url" value="<?php echo esc_url($online_url); ?>" class="large-text" /></td>
        </tr>
        <tr>
            <th><label for="map_url"><?php _e('地図URL', 'lightningtalk-child'); ?></label></th>
            <td><input type="url" id="map_url" name="map_url" value="<?php echo esc_url($map_url); ?>" class="large-text" /></td>
        </tr>
    </table>
    <?php
}

/**
 * 参加登録設定メタボックスのコールバック
 */
function lightningtalk_event_registration_callback($post) {
    $capacity = get_post_meta($post->ID, 'capacity', true);
    $registration_deadline = get_post_meta($post->ID, 'registration_deadline', true);
    $allow_guest = get_post_meta($post->ID, 'allow_guest', true);
    ?>
    <p>
        <label for="capacity"><?php _e('定員', 'lightningtalk-child'); ?></label><br>
        <input type="number" id="capacity" name="capacity" value="<?php echo esc_attr($capacity); ?>" class="small-text" min="1" />
    </p>
    <p>
        <label for="registration_deadline"><?php _e('申込締切', 'lightningtalk-child'); ?></label><br>
        <input type="datetime-local" id="registration_deadline" name="registration_deadline" value="<?php echo esc_attr($registration_deadline); ?>" />
    </p>
    <p>
        <label>
            <input type="checkbox" id="allow_guest" name="allow_guest" value="1" <?php checked($allow_guest, '1'); ?> />
            <?php _e('飛び入り参加を許可', 'lightningtalk-child'); ?>
        </label>
    </p>
    <?php
}

/**
 * イベントメタデータの保存
 */
function lightningtalk_save_event_metadata($post_id) {
    // ノンスチェック
    if (!isset($_POST['lightningtalk_event_details_nonce']) || 
        !wp_verify_nonce($_POST['lightningtalk_event_details_nonce'], 'lightningtalk_event_details')) {
        return;
    }
    
    // 自動保存の場合は何もしない
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // 権限チェック
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // メタデータの保存
    $fields = array(
        'event_date', 'event_time', 'event_status', 'event_format',
        'venue_name', 'venue_address', 'online_url', 'map_url',
        'capacity', 'registration_deadline', 'allow_guest'
    );
    
    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
        }
    }
}
add_action('save_post_lt_event', 'lightningtalk_save_event_metadata');

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
    wp_enqueue_style(
        'lightningtalk-frontend-style',
        get_stylesheet_directory_uri() . '/assets/css/lightningtalk-frontend.css',
        array('lightningtalk-child-style'),
        LIGHTNINGTALK_CHILD_VERSION
    );
}
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_styles');

/**
 * フロントエンド用のJavaScriptを読み込む
 */
function lightningtalk_enqueue_scripts() {
    // Lightning Talkフロントエンドスクリプト
    wp_enqueue_script(
        'lightningtalk-frontend',
        get_stylesheet_directory_uri() . '/assets/js/lightningtalk-frontend.js',
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
add_action('wp_enqueue_scripts', 'lightningtalk_enqueue_scripts');

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
        // 確認メール送信
        lightningtalk_send_confirmation_email($participant_id);
        
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

/**
 * 確認メール送信関数の改良版
 */
function lightningtalk_send_confirmation_email($participant_id) {
    $participant = get_post($participant_id);
    $email = get_post_meta($participant_id, 'email', true);
    $event_id = get_post_meta($participant_id, 'event_id', true);
    $event = get_post($event_id);
    
    if (!$participant || !$email || !$event) {
        return false;
    }
    
    $event_date = get_post_meta($event_id, 'event_date', true);
    $venue_name = get_post_meta($event_id, 'venue_name', true);
    $participation_type = get_post_meta($participant_id, 'participation_type', true);
    
    $subject = sprintf('[%s] 参加登録確認', get_bloginfo('name'));
    
    $message = sprintf(
        "%s 様\n\n" .
        "%s への参加登録を承りました。\n\n" .
        "【イベント詳細】\n" .
        "イベント名: %s\n" .
        "開催日: %s\n" .
        "会場: %s\n" .
        "参加方法: %s\n\n" .
        "当日はお気をつけてお越しください。\n\n" .
        "詳細: %s\n\n" .
        "%s",
        $participant->post_title,
        $event->post_title,
        $event->post_title,
        $event_date ? date('Y年m月d日', strtotime($event_date)) : '未定',
        $venue_name ?: '未定',
        $participation_type === 'online' ? 'オンライン参加' : '現地参加',
        get_permalink($event_id),
        get_bloginfo('name')
    );
    
    $headers = array('Content-Type: text/plain; charset=UTF-8');
    
    return wp_mail($email, $subject, $message, $headers);
}

/**
 * 追加機能を読み込み
 */
// 重複を避けるため、コメントアウト
// require_once get_stylesheet_directory() . '/shortcodes.php';
// require_once get_stylesheet_directory() . '/cocoon-compatibility.php';

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
        
        // jQuery UI CSS (locally bundled)
        wp_enqueue_style('jquery-ui-css', get_stylesheet_directory_uri() . '/assets/dist/css/jquery-ui.min.css', array(), LIGHTNINGTALK_CHILD_VERSION);
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

/**
 * テーマ有効化時の初期化処理
 */
function lightningtalk_theme_activation() {
    // パーマリンクをフラッシュして新しい投稿タイプのURLを有効化
    flush_rewrite_rules();
    
    // デフォルト設定を追加
    lightningtalk_set_default_settings();
    
    // サンプルコンテンツのインポートオプション
    if (get_option('lightningtalk_import_sample_content', true)) {
        lightningtalk_import_sample_content();
    }
}
add_action('after_switch_theme', 'lightningtalk_theme_activation');

/**
 * デフォルト設定を設定
 */
function lightningtalk_set_default_settings() {
    // テーマカスタマイザーのデフォルト値を設定
    if (!get_theme_mod('lightningtalk_api_url')) {
        set_theme_mod('lightningtalk_api_url', home_url('/wp-json/lightningtalk/v1/'));
    }
    
    // Lightning Talk設定のデフォルト値
    $default_settings = array(
        'lightningtalk_enable_registration' => true,
        'lightningtalk_enable_talk_submission' => true,
        'lightningtalk_enable_email_notifications' => true,
        'lightningtalk_max_participants' => 50,
        'lightningtalk_talk_time_limit' => 5,
        'lightningtalk_registration_deadline' => ''
    );
    
    foreach ($default_settings as $key => $value) {
        if (get_option($key) === false) {
            add_option($key, $value);
        }
    }
}

/**
 * サンプルコンテンツのインポート
 */
function lightningtalk_import_sample_content() {
    // 既存のイベントがある場合はスキップ
    $existing_events = get_posts(array(
        'post_type' => 'lt_event',
        'numberposts' => 1
    ));
    
    if (!empty($existing_events)) {
        return;
    }
    
    // サンプルイベントを作成
    $sample_event_id = wp_insert_post(array(
        'post_title' => 'Lightning Talk Circle 第1回',
        'post_content' => '初回のLightning Talk Circleイベントです。お気軽にご参加ください！',
        'post_status' => 'publish',
        'post_type' => 'lt_event',
        'meta_input' => array(
            'event_date' => date('Y-m-d H:i:s', strtotime('+1 month')),
            'venue_name' => 'オンライン開催',
            'venue_address' => '',
            'online_url' => 'https://meet.google.com/xxx-xxxx-xxx',
            'capacity' => 30,
            'event_status' => 'open',
            'registration_deadline' => date('Y-m-d H:i:s', strtotime('+3 weeks')),
            'talk_time_limit' => 5
        )
    ));
    
    if ($sample_event_id && !is_wp_error($sample_event_id)) {
        // デフォルトイベントIDを設定
        set_theme_mod('lightningtalk_default_event_id', $sample_event_id);
        
        // サンプル発表カテゴリーを作成
        $categories = array('技術', 'ビジネス', 'その他');
        foreach ($categories as $category) {
            $term_result = wp_insert_term($category, 'lt_talk_category');
            if (is_wp_error($term_result)) {
                error_log('Lightning Talk: カテゴリー作成エラー - ' . $category . ': ' . $term_result->get_error_message());
            }
        }
    } elseif (is_wp_error($sample_event_id)) {
        error_log('Lightning Talk: サンプルイベント作成エラー: ' . $sample_event_id->get_error_message());
    }
}

/**
 * テーマ無効化時のクリーンアップ（オプション）
 */
function lightningtalk_theme_deactivation() {
    // パーマリンクをフラッシュ
    flush_rewrite_rules();
    
    // 注意: ここでは投稿データを削除しない
    // ユーザーがテーマを再度有効化した際にデータが復元されるように
}

/**
 * セキュリティ強化
 */
function lightningtalk_security_headers() {
    // REST API セキュリティヘッダー
    if (is_admin() || (defined('REST_REQUEST') && REST_REQUEST)) {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }
}
add_action('init', 'lightningtalk_security_headers');

/**
 * REST API レート制限
 */
function lightningtalk_rest_api_rate_limit($result, $request, $route) {
    if (strpos($route, '/lightningtalk/v1/') === 0) {
        // プロキシ対応のIP検出実装
        $client_ip = '';
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $client_ip = trim($ips[0]);
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $client_ip = $_SERVER['HTTP_X_REAL_IP'];
        } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $client_ip = $_SERVER['HTTP_CLIENT_IP'];
        } else {
            $client_ip = $_SERVER['REMOTE_ADDR'];
        }
        
        $transient_key = 'lt_rate_limit_' . md5($client_ip);
        $requests = get_transient($transient_key);
        
        if ($requests === false) {
            set_transient($transient_key, 1, MINUTE_IN_SECONDS);
        } elseif ($requests >= 100) { // 1分間に100リクエストまで
            return new WP_Error('rest_rate_limit', '短時間に大量のリクエストが検出されました。しばらく時間をおいてからお試しください。', array('status' => 429));
        } else {
            set_transient($transient_key, $requests + 1, MINUTE_IN_SECONDS);
        }
    }
    
    return $result;
}
add_filter('rest_pre_dispatch', 'lightningtalk_rest_api_rate_limit', 10, 3);

/**
 * パフォーマンス最適化
 */
function lightningtalk_performance_optimization() {
    // 不要なWordPress機能を無効化
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
    
    // 絵文字スクリプトを無効化（必要に応じて）
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
    
    // Lightning Talk関連ページでのみアセットを読み込む最適化
    if (!is_admin() && !lightningtalk_is_lt_page()) {
        wp_dequeue_style('lightningtalk-main-style');
        wp_dequeue_script('lightningtalk-main-script');
    }
}
add_action('init', 'lightningtalk_performance_optimization');

/**
 * Lightning Talk関連ページの判定
 */
function lightningtalk_is_lt_page() {
    global $post;
    
    // キャッシュチェック
    static $cache = array();
    $cache_key = isset($post->ID) ? 'post_' . $post->ID : 'global_' . md5(serialize($_SERVER['REQUEST_URI']));
    
    if (isset($cache[$cache_key])) {
        return $cache[$cache_key];
    }
    
    $is_lt_page = false;
    
    // カスタム投稿タイプページ
    if (is_singular(array('lt_event', 'lt_talk', 'lt_participant'))) {
        $is_lt_page = true;
    }
    
    // Lightning Talk専用ページテンプレート
    elseif (is_page_template('page-lightning-talk.php')) {
        $is_lt_page = true;
    }
    
    // ショートコードが含まれるページ（最も重い処理なので最後に）
    elseif (isset($post->post_content)) {
        // 主要なショートコードのみチェック
        $lt_shortcodes = array('lightning_talk_event', 'lightning_talk_registration', 'lightning_talk_talks');
        foreach ($lt_shortcodes as $shortcode) {
            if (has_shortcode($post->post_content, $shortcode)) {
                $is_lt_page = true;
                break;
            }
        }
    }
    
    // 結果をキャッシュ
    $cache[$cache_key] = $is_lt_page;
    
    return $is_lt_page;
}

/**
 * 入力値のサニタイゼーション強化
 */
function lightningtalk_sanitize_input($input, $type = 'text') {
    switch ($type) {
        case 'email':
            return sanitize_email($input);
        case 'url':
            return esc_url_raw($input);
        case 'html':
            return wp_kses_post($input);
        case 'text':
        default:
            return sanitize_text_field($input);
    }
}

/**
 * 管理画面のカスタムCSS
 */
function lightningtalk_admin_custom_css() {
    echo '<style>
        .lt-event .inside { padding: 20px; }
        .lt-meta-box .form-table th { width: 150px; }
        .lt-meta-box .form-table td { padding: 10px; }
        .lt-status-active { color: #46b450; font-weight: bold; }
        .lt-status-closed { color: #dc3232; font-weight: bold; }
        .lt-admin-notice { background: linear-gradient(45deg, #ff6b6b, #ffd93d); color: white; border: none; }
    </style>';
}
add_action('admin_head', 'lightningtalk_admin_custom_css');
