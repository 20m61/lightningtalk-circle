<?php
/**
 * Lightning Talk Admin Dashboard
 * WordPress管理画面でのLightning Talk統合管理
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

class LightningTalk_Admin_Dashboard {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_dashboard_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_dashboard_assets'));
        add_action('wp_ajax_lt_sync_data', array($this, 'handle_sync_request'));
        add_action('wp_ajax_lt_get_stats', array($this, 'handle_stats_request'));
        add_action('wp_ajax_lt_manage_event', array($this, 'handle_event_management'));
    }
    
    /**
     * 管理画面メニューを追加
     */
    public function add_dashboard_menu() {
        add_submenu_page(
            'lightningtalk-admin',
            __('ダッシュボード', 'lightningtalk-child'),
            __('ダッシュボード', 'lightningtalk-child'),
            'manage_options',
            'lightningtalk-dashboard',
            array($this, 'render_dashboard_page')
        );
        
        add_submenu_page(
            'lightningtalk-admin',
            __('イベント管理', 'lightningtalk-child'),
            __('イベント管理', 'lightningtalk-child'),
            'manage_options',
            'lightningtalk-events',
            array($this, 'render_events_page')
        );
        
        add_submenu_page(
            'lightningtalk-admin',
            __('発表管理', 'lightningtalk-child'),
            __('発表管理', 'lightningtalk-child'),
            'manage_options',
            'lightningtalk-talks',
            array($this, 'render_talks_page')
        );
    }
    
    /**
     * ダッシュボード用のアセットを読み込み
     */
    public function enqueue_dashboard_assets($hook) {
        if (strpos($hook, 'lightningtalk') === false) {
            return;
        }
        
        wp_enqueue_script(
            'lightningtalk-dashboard',
            get_stylesheet_directory_uri() . '/includes/js/admin-dashboard.js',
            array('jquery', 'wp-api-fetch'),
            LIGHTNINGTALK_CHILD_VERSION,
            true
        );
        
        wp_enqueue_style(
            'lightningtalk-dashboard-style',
            get_stylesheet_directory_uri() . '/includes/css/admin-dashboard.css',
            array(),
            LIGHTNINGTALK_CHILD_VERSION
        );
        
        // Localize script with settings
        wp_localize_script('lightningtalk-dashboard', 'lightningTalkAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('lightningtalk_admin_nonce'),
            'apiUrl' => get_option('lightningtalk_api_url', 'http://localhost:3000/api'),
            'translations' => array(
                'confirmSync' => __('データを同期してもよろしいですか？', 'lightningtalk-child'),
                'syncSuccess' => __('同期が完了しました', 'lightningtalk-child'),
                'syncError' => __('同期中にエラーが発生しました', 'lightningtalk-child'),
                'loading' => __('処理中...', 'lightningtalk-child'),
                'confirmDelete' => __('このイベントを削除してもよろしいですか？', 'lightningtalk-child'),
            )
        ));
    }
    
    /**
     * ダッシュボードページのレンダリング
     */
    public function render_dashboard_page() {
        ?>
        <div class="wrap lightningtalk-dashboard">
            <h1><?php _e('Lightning Talk ダッシュボード', 'lightningtalk-child'); ?></h1>
            
            <!-- 統計概要 -->
            <div class="lt-stats-grid">
                <div class="lt-stat-card">
                    <h3><?php _e('統計サマリー', 'lightningtalk-child'); ?></h3>
                    <div id="lt-stats-summary">
                        <div class="lt-loading"><?php _e('読み込み中...', 'lightningtalk-child'); ?></div>
                    </div>
                </div>
                
                <div class="lt-stat-card">
                    <h3><?php _e('同期ステータス', 'lightningtalk-child'); ?></h3>
                    <div id="lt-sync-status">
                        <p><?php _e('最終同期:', 'lightningtalk-child'); ?> <span id="last-sync-time"><?php echo esc_html(get_option('lightningtalk_last_sync', __('未実施', 'lightningtalk-child'))); ?></span></p>
                        <button type="button" class="button button-primary" id="sync-now-btn">
                            <?php _e('今すぐ同期', 'lightningtalk-child'); ?>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 現在のイベント -->
            <div class="lt-current-event">
                <h2><?php _e('現在のイベント', 'lightningtalk-child'); ?></h2>
                <div id="lt-current-event-info">
                    <div class="lt-loading"><?php _e('読み込み中...', 'lightningtalk-child'); ?></div>
                </div>
            </div>
            
            <!-- 最近の活動 -->
            <div class="lt-recent-activity">
                <h2><?php _e('最近の活動', 'lightningtalk-child'); ?></h2>
                <div class="lt-activity-tabs">
                    <button class="lt-tab-btn active" data-tab="participants"><?php _e('新規参加者', 'lightningtalk-child'); ?></button>
                    <button class="lt-tab-btn" data-tab="talks"><?php _e('新規発表', 'lightningtalk-child'); ?></button>
                </div>
                <div id="lt-recent-activities">
                    <div class="lt-loading"><?php _e('読み込み中...', 'lightningtalk-child'); ?></div>
                </div>
            </div>
            
            <!-- システム状態 -->
            <div class="lt-system-health">
                <h2><?php _e('システム状態', 'lightningtalk-child'); ?></h2>
                <div id="lt-system-status">
                    <div class="lt-loading"><?php _e('読み込み中...', 'lightningtalk-child'); ?></div>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * イベント管理ページのレンダリング
     */
    public function render_events_page() {
        ?>
        <div class="wrap lightningtalk-events">
            <h1><?php _e('イベント管理', 'lightningtalk-child'); ?></h1>
            
            <div class="lt-events-header">
                <button type="button" class="button button-primary" id="create-event-btn">
                    <?php _e('新しいイベントを作成', 'lightningtalk-child'); ?>
                </button>
                <button type="button" class="button" id="sync-events-btn">
                    <?php _e('イベントを同期', 'lightningtalk-child'); ?>
                </button>
            </div>
            
            <!-- イベント一覧テーブル -->
            <div class="lt-events-table-container">
                <table class="wp-list-table widefat fixed striped" id="events-table">
                    <thead>
                        <tr>
                            <th><?php _e('タイトル', 'lightningtalk-child'); ?></th>
                            <th><?php _e('開催日', 'lightningtalk-child'); ?></th>
                            <th><?php _e('会場', 'lightningtalk-child'); ?></th>
                            <th><?php _e('参加者数', 'lightningtalk-child'); ?></th>
                            <th><?php _e('発表数', 'lightningtalk-child'); ?></th>
                            <th><?php _e('ステータス', 'lightningtalk-child'); ?></th>
                            <th><?php _e('操作', 'lightningtalk-child'); ?></th>
                        </tr>
                    </thead>
                    <tbody id="events-table-body">
                        <tr>
                            <td colspan="7" class="lt-loading"><?php _e('読み込み中...', 'lightningtalk-child'); ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- イベント作成/編集モーダル -->
            <div id="event-modal" class="lt-modal" style="display: none;">
                <div class="lt-modal-content">
                    <span class="lt-modal-close">&times;</span>
                    <h2 id="modal-title"><?php _e('イベント作成', 'lightningtalk-child'); ?></h2>
                    <form id="event-form">
                        <table class="form-table">
                            <tr>
                                <th><label for="event-title"><?php _e('イベント名', 'lightningtalk-child'); ?></label></th>
                                <td><input type="text" id="event-title" name="title" class="regular-text" required /></td>
                            </tr>
                            <tr>
                                <th><label for="event-description"><?php _e('説明', 'lightningtalk-child'); ?></label></th>
                                <td><textarea id="event-description" name="description" rows="4" class="large-text"></textarea></td>
                            </tr>
                            <tr>
                                <th><label for="event-date"><?php _e('開催日時', 'lightningtalk-child'); ?></label></th>
                                <td><input type="datetime-local" id="event-date" name="eventDate" required /></td>
                            </tr>
                            <tr>
                                <th><label for="event-venue"><?php _e('会場名', 'lightningtalk-child'); ?></label></th>
                                <td><input type="text" id="event-venue" name="venueName" class="regular-text" /></td>
                            </tr>
                            <tr>
                                <th><label for="event-address"><?php _e('住所', 'lightningtalk-child'); ?></label></th>
                                <td><input type="text" id="event-address" name="venueAddress" class="regular-text" /></td>
                            </tr>
                            <tr>
                                <th><label for="event-capacity"><?php _e('定員', 'lightningtalk-child'); ?></label></th>
                                <td><input type="number" id="event-capacity" name="venueCapacity" min="1" /></td>
                            </tr>
                            <tr>
                                <th><label for="event-online-url"><?php _e('オンライン会場URL', 'lightningtalk-child'); ?></label></th>
                                <td><input type="url" id="event-online-url" name="onlineUrl" class="regular-text" /></td>
                            </tr>
                            <tr>
                                <th><label for="max-talks"><?php _e('最大発表数', 'lightningtalk-child'); ?></label></th>
                                <td><input type="number" id="max-talks" name="maxTalks" value="20" min="1" /></td>
                            </tr>
                            <tr>
                                <th><label for="talk-duration"><?php _e('発表時間（分）', 'lightningtalk-child'); ?></label></th>
                                <td><input type="number" id="talk-duration" name="talkDuration" value="5" min="1" max="30" /></td>
                            </tr>
                        </table>
                        <p class="submit">
                            <button type="submit" class="button button-primary"><?php _e('保存', 'lightningtalk-child'); ?></button>
                            <button type="button" class="button" onclick="closeEventModal()"><?php _e('キャンセル', 'lightningtalk-child'); ?></button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * 発表管理ページのレンダリング
     */
    public function render_talks_page() {
        ?>
        <div class="wrap lightningtalk-talks">
            <h1><?php _e('発表管理', 'lightningtalk-child'); ?></h1>
            
            <div class="lt-talks-filters">
                <select id="event-filter">
                    <option value=""><?php _e('全てのイベント', 'lightningtalk-child'); ?></option>
                </select>
                <select id="status-filter">
                    <option value=""><?php _e('全てのステータス', 'lightningtalk-child'); ?></option>
                    <option value="pending"><?php _e('審査中', 'lightningtalk-child'); ?></option>
                    <option value="approved"><?php _e('承認済み', 'lightningtalk-child'); ?></option>
                    <option value="rejected"><?php _e('却下', 'lightningtalk-child'); ?></option>
                    <option value="scheduled"><?php _e('スケジュール済み', 'lightningtalk-child'); ?></option>
                </select>
                <button type="button" class="button" id="apply-filters"><?php _e('フィルター適用', 'lightningtalk-child'); ?></button>
            </div>
            
            <!-- 発表一覧テーブル -->
            <div class="lt-talks-table-container">
                <table class="wp-list-table widefat fixed striped" id="talks-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-talks" /></th>
                            <th><?php _e('タイトル', 'lightningtalk-child'); ?></th>
                            <th><?php _e('発表者', 'lightningtalk-child'); ?></th>
                            <th><?php _e('カテゴリー', 'lightningtalk-child'); ?></th>
                            <th><?php _e('イベント', 'lightningtalk-child'); ?></th>
                            <th><?php _e('ステータス', 'lightningtalk-child'); ?></th>
                            <th><?php _e('提出日', 'lightningtalk-child'); ?></th>
                            <th><?php _e('操作', 'lightningtalk-child'); ?></th>
                        </tr>
                    </thead>
                    <tbody id="talks-table-body">
                        <tr>
                            <td colspan="8" class="lt-loading"><?php _e('読み込み中...', 'lightningtalk-child'); ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- 一括操作 -->
            <div class="lt-bulk-actions">
                <select id="bulk-action-selector">
                    <option value=""><?php _e('一括操作を選択', 'lightningtalk-child'); ?></option>
                    <option value="approve"><?php _e('承認', 'lightningtalk-child'); ?></option>
                    <option value="reject"><?php _e('却下', 'lightningtalk-child'); ?></option>
                    <option value="schedule"><?php _e('スケジュール', 'lightningtalk-child'); ?></option>
                    <option value="delete"><?php _e('削除', 'lightningtalk-child'); ?></option>
                </select>
                <button type="button" class="button" id="apply-bulk-action"><?php _e('適用', 'lightningtalk-child'); ?></button>
            </div>
        </div>
        <?php
    }
    
    /**
     * 同期リクエストの処理
     */
    public function handle_sync_request() {
        check_ajax_referer('lightningtalk_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('権限がありません', 'lightningtalk-child')));
            return;
        }
        
        try {
            // API統合クラスのインスタンスを取得
            global $lightningtalk_api_integration;
            if ($lightningtalk_api_integration) {
                $lightningtalk_api_integration->scheduled_sync();
                
                wp_send_json_success(array(
                    'message' => __('同期が完了しました', 'lightningtalk-child'),
                    'timestamp' => current_time('mysql')
                ));
            } else {
                wp_send_json_error(array('message' => __('API統合が利用できません', 'lightningtalk-child')));
            }
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * 統計情報リクエストの処理
     */
    public function handle_stats_request() {
        check_ajax_referer('lightningtalk_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('権限がありません', 'lightningtalk-child')));
            return;
        }
        
        try {
            // WordPress統計
            $wp_stats = array(
                'events' => wp_count_posts('lt_event')->publish,
                'participants' => wp_count_posts('lt_participant')->publish,
                'talks' => wp_count_posts('lt_talk')->publish,
            );
            
            // Node.js API統計（利用可能な場合）
            $api_stats = array();
            $api_url = get_option('lightningtalk_api_url', '');
            if ($api_url) {
                $response = wp_remote_get($api_url . '/admin/dashboard');
                if (!is_wp_error($response)) {
                    $body = json_decode(wp_remote_retrieve_body($response), true);
                    $api_stats = $body['overview'] ?? array();
                }
            }
            
            wp_send_json_success(array(
                'wordpress' => $wp_stats,
                'nodejs_api' => $api_stats,
                'last_sync' => get_option('lightningtalk_last_sync', __('未実施', 'lightningtalk-child'))
            ));
            
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * イベント管理リクエストの処理
     */
    public function handle_event_management() {
        check_ajax_referer('lightningtalk_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('権限がありません', 'lightningtalk-child')));
            return;
        }
        
        $action = sanitize_text_field($_POST['action_type'] ?? '');
        $event_id = intval($_POST['event_id'] ?? 0);
        
        try {
            switch ($action) {
                case 'create':
                    $result = $this->create_event($_POST);
                    break;
                case 'update':
                    $result = $this->update_event($event_id, $_POST);
                    break;
                case 'delete':
                    $result = $this->delete_event($event_id);
                    break;
                case 'list':
                    $result = $this->list_events();
                    break;
                default:
                    wp_send_json_error(array('message' => __('無効な操作です', 'lightningtalk-child')));
                    return;
            }
            
            wp_send_json_success($result);
            
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    /**
     * イベント作成
     */
    private function create_event($data) {
        $event_data = array(
            'post_title' => sanitize_text_field($data['title']),
            'post_content' => wp_kses_post($data['description'] ?? ''),
            'post_type' => 'lt_event',
            'post_status' => 'publish',
            'meta_input' => array(
                'event_date' => sanitize_text_field($data['eventDate']),
                'venue_name' => sanitize_text_field($data['venueName'] ?? ''),
                'venue_address' => sanitize_text_field($data['venueAddress'] ?? ''),
                'venue_capacity' => intval($data['venueCapacity'] ?? 0),
                'online_url' => esc_url_raw($data['onlineUrl'] ?? ''),
                'max_talks' => intval($data['maxTalks'] ?? 20),
                'talk_duration' => intval($data['talkDuration'] ?? 5),
                'registration_open' => true,
                'talk_submission_open' => true
            )
        );
        
        $event_id = wp_insert_post($event_data);
        
        if (is_wp_error($event_id)) {
            throw new Exception($event_id->get_error_message());
        }
        
        return array(
            'event_id' => $event_id,
            'message' => __('イベントが作成されました', 'lightningtalk-child')
        );
    }
    
    /**
     * イベント更新
     */
    private function update_event($event_id, $data) {
        if (!$event_id || !get_post($event_id)) {
            throw new Exception(__('イベントが見つかりません', 'lightningtalk-child'));
        }
        
        $event_data = array(
            'ID' => $event_id,
            'post_title' => sanitize_text_field($data['title']),
            'post_content' => wp_kses_post($data['description'] ?? ''),
            'meta_input' => array(
                'event_date' => sanitize_text_field($data['eventDate']),
                'venue_name' => sanitize_text_field($data['venueName'] ?? ''),
                'venue_address' => sanitize_text_field($data['venueAddress'] ?? ''),
                'venue_capacity' => intval($data['venueCapacity'] ?? 0),
                'online_url' => esc_url_raw($data['onlineUrl'] ?? ''),
                'max_talks' => intval($data['maxTalks'] ?? 20),
                'talk_duration' => intval($data['talkDuration'] ?? 5)
            )
        );
        
        $result = wp_update_post($event_data);
        
        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }
        
        return array(
            'event_id' => $event_id,
            'message' => __('イベントが更新されました', 'lightningtalk-child')
        );
    }
    
    /**
     * イベント削除
     */
    private function delete_event($event_id) {
        if (!$event_id || !get_post($event_id)) {
            throw new Exception(__('イベントが見つかりません', 'lightningtalk-child'));
        }
        
        $result = wp_delete_post($event_id, true);
        
        if (!$result) {
            throw new Exception(__('イベントの削除に失敗しました', 'lightningtalk-child'));
        }
        
        return array(
            'message' => __('イベントが削除されました', 'lightningtalk-child')
        );
    }
    
    /**
     * イベント一覧取得
     */
    private function list_events() {
        $events = get_posts(array(
            'post_type' => 'lt_event',
            'post_status' => array('publish', 'draft'),
            'numberposts' => -1,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        $formatted_events = array();
        foreach ($events as $event) {
            $participant_count = wp_count_posts('lt_participant');//->publish; // Fix needed
            $talk_count = wp_count_posts('lt_talk');//->publish; // Fix needed
            
            $formatted_events[] = array(
                'id' => $event->ID,
                'title' => $event->post_title,
                'description' => $event->post_content,
                'eventDate' => get_post_meta($event->ID, 'event_date', true),
                'venueName' => get_post_meta($event->ID, 'venue_name', true),
                'venueAddress' => get_post_meta($event->ID, 'venue_address', true),
                'venueCapacity' => get_post_meta($event->ID, 'venue_capacity', true),
                'onlineUrl' => get_post_meta($event->ID, 'online_url', true),
                'maxTalks' => get_post_meta($event->ID, 'max_talks', true),
                'talkDuration' => get_post_meta($event->ID, 'talk_duration', true),
                'status' => $event->post_status,
                'participantCount' => $participant_count,
                'talkCount' => $talk_count,
                'permalink' => get_permalink($event->ID)
            );
        }
        
        return array('events' => $formatted_events);
    }
}

// インスタンス作成
new LightningTalk_Admin_Dashboard();