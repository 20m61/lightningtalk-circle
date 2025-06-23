<?php
/**
 * Lightning Talk API Integration
 * Node.js APIとWordPressの統合管理
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

class LightningTalk_API_Integration {
    
    private $api_base_url;
    private $api_key;
    
    public function __construct() {
        $this->api_base_url = get_option('lightningtalk_api_url', 'http://localhost:3000/api');
        $this->api_key = get_option('lightningtalk_api_key', '');
        
        add_action('init', array($this, 'init'));
        add_action('wp_ajax_lightningtalk_sync', array($this, 'handle_sync_request'));
        add_action('wp_ajax_nopriv_lightningtalk_register', array($this, 'handle_external_registration'));
        add_action('lightningtalk_hourly_sync', array($this, 'scheduled_sync'));
        
        // スケジュールイベントの設定
        if (!wp_next_scheduled('lightningtalk_hourly_sync')) {
            wp_schedule_event(time(), 'hourly', 'lightningtalk_hourly_sync');
        }
    }
    
    public function init() {
        // REST APIエンドポイントの拡張
        add_action('rest_api_init', array($this, 'register_api_endpoints'));
        
        // 管理画面の設定ページ
        add_action('admin_menu', array($this, 'add_admin_pages'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * WordPress REST APIエンドポイントを登録
     */
    public function register_api_endpoints() {
        // Node.js APIとの統合エンドポイント
        register_rest_route('lightningtalk/v1', '/sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'sync_with_nodejs_api'),
            'permission_callback' => array($this, 'verify_api_permission'),
        ));
        
        // 参加登録プロキシエンドポイント
        register_rest_route('lightningtalk/v1', '/proxy/register', array(
            'methods' => 'POST',
            'callback' => array($this, 'proxy_registration'),
            'permission_callback' => '__return_true',
        ));
        
        // イベント同期エンドポイント
        register_rest_route('lightningtalk/v1', '/sync/events', array(
            'methods' => array('GET', 'POST'),
            'callback' => array($this, 'sync_events'),
            'permission_callback' => array($this, 'verify_admin_permission'),
        ));
        
        // 統計情報エンドポイント
        register_rest_route('lightningtalk/v1', '/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_statistics'),
            'permission_callback' => array($this, 'verify_admin_permission'),
        ));
    }
    
    /**
     * Node.js APIとの同期処理
     */
    public function sync_with_nodejs_api($request) {
        $params = $request->get_json_params();
        $action = $params['action'] ?? 'full_sync';
        
        $results = array();
        
        switch ($action) {
            case 'events':
                $results['events'] = $this->sync_events_data();
                break;
            case 'participants':
                $results['participants'] = $this->sync_participants_data();
                break;
            case 'talks':
                $results['talks'] = $this->sync_talks_data();
                break;
            case 'full_sync':
            default:
                $results['events'] = $this->sync_events_data();
                $results['participants'] = $this->sync_participants_data();
                $results['talks'] = $this->sync_talks_data();
                break;
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'action' => $action,
            'results' => $results,
            'timestamp' => current_time('mysql')
        ));
    }
    
    /**
     * イベントデータの同期
     */
    private function sync_events_data() {
        $response = $this->make_api_request('/events');
        
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }
        
        $nodejs_events = json_decode(wp_remote_retrieve_body($response), true);
        $synced_count = 0;
        $errors = array();
        
        if (isset($nodejs_events['events'])) {
            foreach ($nodejs_events['events'] as $event_data) {
                $result = $this->sync_single_event($event_data);
                if ($result['success']) {
                    $synced_count++;
                } else {
                    $errors[] = $result['error'];
                }
            }
        }
        
        return array(
            'synced' => $synced_count,
            'errors' => $errors
        );
    }
    
    /**
     * 単一イベントの同期
     */
    private function sync_single_event($event_data) {
        $event_id = $event_data['id'] ?? '';
        
        // 既存のイベントを検索
        $existing_post = $this->find_event_by_external_id($event_id);
        
        $post_data = array(
            'post_title' => sanitize_text_field($event_data['title'] ?? ''),
            'post_content' => wp_kses_post($event_data['description'] ?? ''),
            'post_type' => 'lt_event',
            'post_status' => $this->map_event_status($event_data['status'] ?? 'upcoming'),
            'meta_input' => array(
                'external_event_id' => $event_id,
                'event_date' => sanitize_text_field($event_data['eventDate'] ?? ''),
                'end_date' => sanitize_text_field($event_data['endDate'] ?? ''),
                'venue_name' => sanitize_text_field($event_data['venue']['name'] ?? ''),
                'venue_address' => sanitize_text_field($event_data['venue']['address'] ?? ''),
                'venue_capacity' => intval($event_data['venue']['capacity'] ?? 0),
                'online_url' => esc_url_raw($event_data['venue']['onlineUrl'] ?? ''),
                'max_talks' => intval($event_data['maxTalks'] ?? 20),
                'talk_duration' => intval($event_data['talkDuration'] ?? 5),
                'registration_open' => !empty($event_data['registrationOpen']),
                'talk_submission_open' => !empty($event_data['talkSubmissionOpen']),
                'sync_timestamp' => current_time('mysql')
            )
        );
        
        if ($existing_post) {
            $post_data['ID'] = $existing_post->ID;
            $result = wp_update_post($post_data);
        } else {
            $result = wp_insert_post($post_data);
        }
        
        if (is_wp_error($result)) {
            return array('success' => false, 'error' => $result->get_error_message());
        }
        
        return array('success' => true, 'post_id' => $result);
    }
    
    /**
     * 参加者データの同期
     */
    private function sync_participants_data() {
        $response = $this->make_api_request('/participants');
        
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }
        
        $nodejs_participants = json_decode(wp_remote_retrieve_body($response), true);
        $synced_count = 0;
        $errors = array();
        
        if (isset($nodejs_participants['participants'])) {
            foreach ($nodejs_participants['participants'] as $participant_data) {
                $result = $this->sync_single_participant($participant_data);
                if ($result['success']) {
                    $synced_count++;
                } else {
                    $errors[] = $result['error'];
                }
            }
        }
        
        return array(
            'synced' => $synced_count,
            'errors' => $errors
        );
    }
    
    /**
     * 単一参加者の同期
     */
    private function sync_single_participant($participant_data) {
        $participant_id = $participant_data['id'] ?? '';
        
        // 既存の参加者を検索
        $existing_post = $this->find_participant_by_external_id($participant_id);
        
        $post_data = array(
            'post_title' => sanitize_text_field($participant_data['name'] ?? ''),
            'post_type' => 'lt_participant',
            'post_status' => 'publish',
            'meta_input' => array(
                'external_participant_id' => $participant_id,
                'email' => sanitize_email($participant_data['email'] ?? ''),
                'event_id' => sanitize_text_field($participant_data['eventId'] ?? ''),
                'participation_type' => sanitize_text_field($participant_data['participationType'] ?? ''),
                'phone' => sanitize_text_field($participant_data['phone'] ?? ''),
                'company' => sanitize_text_field($participant_data['company'] ?? ''),
                'job_title' => sanitize_text_field($participant_data['jobTitle'] ?? ''),
                'dietary_restrictions' => sanitize_text_field($participant_data['dietaryRestrictions'] ?? ''),
                'emergency_contact_name' => sanitize_text_field($participant_data['emergencyContact']['name'] ?? ''),
                'emergency_contact_phone' => sanitize_text_field($participant_data['emergencyContact']['phone'] ?? ''),
                'marketing_consent' => !empty($participant_data['marketingConsent']),
                'privacy_consent' => !empty($participant_data['privacyConsent']),
                'status' => sanitize_text_field($participant_data['status'] ?? 'confirmed'),
                'sync_timestamp' => current_time('mysql')
            )
        );
        
        if ($existing_post) {
            $post_data['ID'] = $existing_post->ID;
            $result = wp_update_post($post_data);
        } else {
            $result = wp_insert_post($post_data);
        }
        
        if (is_wp_error($result)) {
            return array('success' => false, 'error' => $result->get_error_message());
        }
        
        return array('success' => true, 'post_id' => $result);
    }
    
    /**
     * 発表データの同期
     */
    private function sync_talks_data() {
        $response = $this->make_api_request('/talks');
        
        if (is_wp_error($response)) {
            return array('error' => $response->get_error_message());
        }
        
        $nodejs_talks = json_decode(wp_remote_retrieve_body($response), true);
        $synced_count = 0;
        $errors = array();
        
        if (isset($nodejs_talks['talks'])) {
            foreach ($nodejs_talks['talks'] as $talk_data) {
                $result = $this->sync_single_talk($talk_data);
                if ($result['success']) {
                    $synced_count++;
                } else {
                    $errors[] = $result['error'];
                }
            }
        }
        
        return array(
            'synced' => $synced_count,
            'errors' => $errors
        );
    }
    
    /**
     * 単一発表の同期
     */
    private function sync_single_talk($talk_data) {
        $talk_id = $talk_data['id'] ?? '';
        
        // 既存の発表を検索
        $existing_post = $this->find_talk_by_external_id($talk_id);
        
        $post_data = array(
            'post_title' => sanitize_text_field($talk_data['title'] ?? ''),
            'post_content' => wp_kses_post($talk_data['description'] ?? ''),
            'post_type' => 'lt_talk',
            'post_status' => $this->map_talk_status($talk_data['status'] ?? 'pending'),
            'meta_input' => array(
                'external_talk_id' => $talk_id,
                'event_id' => sanitize_text_field($talk_data['eventId'] ?? ''),
                'speaker_name' => sanitize_text_field($talk_data['speakerName'] ?? ''),
                'speaker_email' => sanitize_email($talk_data['speakerEmail'] ?? ''),
                'category' => sanitize_text_field($talk_data['category'] ?? ''),
                'duration' => intval($talk_data['duration'] ?? 5),
                'target_audience' => sanitize_text_field($talk_data['targetAudience'] ?? ''),
                'needs_projector' => !empty($talk_data['needsProjector']),
                'slides_url' => esc_url_raw($talk_data['slides'] ?? ''),
                'speaker_bio' => sanitize_textarea_field($talk_data['speakerBio'] ?? ''),
                'previous_experience' => !empty($talk_data['previousExperience']),
                'special_requirements' => sanitize_textarea_field($talk_data['specialRequirements'] ?? ''),
                'sync_timestamp' => current_time('mysql')
            )
        );
        
        if ($existing_post) {
            $post_data['ID'] = $existing_post->ID;
            $result = wp_update_post($post_data);
        } else {
            $result = wp_insert_post($post_data);
        }
        
        if (is_wp_error($result)) {
            return array('success' => false, 'error' => $result->get_error_message());
        }
        
        // カテゴリーの設定
        if (!empty($talk_data['category'])) {
            wp_set_object_terms($result, array($talk_data['category']), 'lt_talk_category');
        }
        
        return array('success' => true, 'post_id' => $result);
    }
    
    /**
     * 登録をNode.js APIにプロキシ
     */
    public function proxy_registration($request) {
        $params = $request->get_json_params();
        
        // Node.js APIに登録リクエストを送信
        $response = $this->make_api_request('/participants/register', 'POST', $params);
        
        if (is_wp_error($response)) {
            return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
        }
        
        $response_body = json_decode(wp_remote_retrieve_body($response), true);
        $response_code = wp_remote_retrieve_response_code($response);
        
        if ($response_code !== 200 && $response_code !== 201) {
            return new WP_Error('registration_failed', 'Registration failed', array('status' => $response_code));
        }
        
        // 成功した場合、WordPressにも参加者データを保存
        if ($response_body['success']) {
            $this->save_participant_locally($params, $response_body);
        }
        
        return rest_ensure_response($response_body);
    }
    
    /**
     * 統計情報の取得
     */
    public function get_statistics($request) {
        // WordPress側の統計
        $wp_stats = array(
            'events' => wp_count_posts('lt_event')->publish,
            'participants' => wp_count_posts('lt_participant')->publish,
            'talks' => wp_count_posts('lt_talk')->publish,
        );
        
        // Node.js API側の統計
        $api_response = $this->make_api_request('/admin/dashboard');
        $api_stats = array();
        
        if (!is_wp_error($api_response)) {
            $api_body = json_decode(wp_remote_retrieve_body($api_response), true);
            $api_stats = $api_body['statistics'] ?? array();
        }
        
        return rest_ensure_response(array(
            'wordpress' => $wp_stats,
            'nodejs_api' => $api_stats,
            'sync_status' => $this->get_sync_status(),
            'last_sync' => get_option('lightningtalk_last_sync', 'Never')
        ));
    }
    
    /**
     * Node.js APIへのHTTPリクエスト
     */
    private function make_api_request($endpoint, $method = 'GET', $data = null) {
        $url = rtrim($this->api_base_url, '/') . '/' . ltrim($endpoint, '/');
        
        $args = array(
            'method' => $method,
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress/LightningTalk v' . LIGHTNINGTALK_CHILD_VERSION
            )
        );
        
        // API키가 설정된 경우 추가
        if (!empty($this->api_key)) {
            $args['headers']['X-API-Key'] = $this->api_key;
        }
        
        if ($data && in_array($method, array('POST', 'PUT', 'PATCH'))) {
            $args['body'] = json_encode($data);
        }
        
        return wp_remote_request($url, $args);
    }
    
    /**
     * 권한 확인
     */
    public function verify_api_permission($request) {
        $api_key = $request->get_header('X-API-Key');
        $stored_key = get_option('lightningtalk_api_key', '');
        
        return !empty($stored_key) && hash_equals($stored_key, $api_key);
    }
    
    public function verify_admin_permission($request) {
        return current_user_can('manage_options');
    }
    
    /**
     * Helper functions
     */
    private function find_event_by_external_id($external_id) {
        $posts = get_posts(array(
            'post_type' => 'lt_event',
            'meta_key' => 'external_event_id',
            'meta_value' => $external_id,
            'numberposts' => 1
        ));
        
        return $posts ? $posts[0] : null;
    }
    
    private function find_participant_by_external_id($external_id) {
        $posts = get_posts(array(
            'post_type' => 'lt_participant',
            'meta_key' => 'external_participant_id',
            'meta_value' => $external_id,
            'numberposts' => 1
        ));
        
        return $posts ? $posts[0] : null;
    }
    
    private function find_talk_by_external_id($external_id) {
        $posts = get_posts(array(
            'post_type' => 'lt_talk',
            'meta_key' => 'external_talk_id',
            'meta_value' => $external_id,
            'numberposts' => 1
        ));
        
        return $posts ? $posts[0] : null;
    }
    
    private function map_event_status($status) {
        $status_map = array(
            'upcoming' => 'publish',
            'ongoing' => 'publish',
            'completed' => 'publish',
            'cancelled' => 'draft'
        );
        
        return $status_map[$status] ?? 'draft';
    }
    
    private function map_talk_status($status) {
        $status_map = array(
            'pending' => 'pending',
            'approved' => 'publish',
            'rejected' => 'draft',
            'scheduled' => 'publish'
        );
        
        return $status_map[$status] ?? 'pending';
    }
    
    private function save_participant_locally($params, $api_response) {
        $participant_data = array(
            'post_title' => sanitize_text_field($params['name']),
            'post_type' => 'lt_participant',
            'post_status' => 'publish',
            'meta_input' => array(
                'external_participant_id' => $api_response['participant']['id'] ?? '',
                'email' => sanitize_email($params['email']),
                'event_id' => sanitize_text_field($params['eventId'] ?? ''),
                'participation_type' => sanitize_text_field($params['participationType']),
                'sync_timestamp' => current_time('mysql'),
                'api_registered' => true
            )
        );
        
        wp_insert_post($participant_data);
    }
    
    private function get_sync_status() {
        $last_sync = get_option('lightningtalk_last_sync');
        if (!$last_sync) {
            return 'never';
        }
        
        $last_sync_time = strtotime($last_sync);
        $time_diff = time() - $last_sync_time;
        
        if ($time_diff < 3600) { // 1 hour
            return 'recent';
        } elseif ($time_diff < 86400) { // 24 hours
            return 'today';
        } else {
            return 'outdated';
        }
    }
    
    /**
     * 스케줄된 동기화
     */
    public function scheduled_sync() {
        $this->sync_events_data();
        $this->sync_participants_data();
        $this->sync_talks_data();
        
        update_option('lightningtalk_last_sync', current_time('mysql'));
    }
    
    /**
     * 관리 페이지 추가
     */
    public function add_admin_pages() {
        add_submenu_page(
            'lightningtalk-admin',
            __('API統合設定', 'lightningtalk-child'),
            __('API統合', 'lightningtalk-child'),
            'manage_options',
            'lightningtalk-api-integration',
            array($this, 'render_admin_page')
        );
    }
    
    /**
     * 설정 등록
     */
    public function register_settings() {
        register_setting('lightningtalk_api', 'lightningtalk_api_url');
        register_setting('lightningtalk_api', 'lightningtalk_api_key');
        register_setting('lightningtalk_api', 'lightningtalk_sync_interval');
    }
    
    /**
     * 관리 페이지 렌더링
     */
    public function render_admin_page() {
        if (isset($_POST['sync_now'])) {
            $this->scheduled_sync();
            echo '<div class="notice notice-success"><p>' . __('同期が完了しました。', 'lightningtalk-child') . '</p></div>';
        }
        
        ?>
        <div class="wrap">
            <h1><?php _e('Lightning Talk API統合設定', 'lightningtalk-child'); ?></h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('lightningtalk_api'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Node.js API URL', 'lightningtalk-child'); ?></th>
                        <td>
                            <input type="url" name="lightningtalk_api_url" value="<?php echo esc_url(get_option('lightningtalk_api_url', 'http://localhost:3000/api')); ?>" class="regular-text" />
                            <p class="description"><?php _e('Node.js APIのベースURL', 'lightningtalk-child'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('API Key', 'lightningtalk-child'); ?></th>
                        <td>
                            <input type="password" name="lightningtalk_api_key" value="<?php echo esc_attr(get_option('lightningtalk_api_key', '')); ?>" class="regular-text" />
                            <p class="description"><?php _e('Node.js APIアクセス用のAPIキー', 'lightningtalk-child'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <h2><?php _e('同期ステータス', 'lightningtalk-child'); ?></h2>
            <p><?php _e('最終同期:', 'lightningtalk-child'); ?> <?php echo esc_html(get_option('lightningtalk_last_sync', __('未実施', 'lightningtalk-child'))); ?></p>
            
            <form method="post">
                <?php wp_nonce_field('lightningtalk_sync'); ?>
                <input type="submit" name="sync_now" value="<?php _e('今すぐ同期', 'lightningtalk-child'); ?>" class="button button-primary" />
            </form>
            
            <h2><?php _e('統計情報', 'lightningtalk-child'); ?></h2>
            <div id="lightningtalk-stats"></div>
            
            <script>
            jQuery(document).ready(function($) {
                // 統計情報の読み込み
                $.get('<?php echo rest_url('lightningtalk/v1/stats'); ?>', function(data) {
                    $('#lightningtalk-stats').html(
                        '<table class="widefat">' +
                        '<tr><th><?php _e('項目', 'lightningtalk-child'); ?></th><th><?php _e('WordPress', 'lightningtalk-child'); ?></th><th><?php _e('Node.js API', 'lightningtalk-child'); ?></th></tr>' +
                        '<tr><td><?php _e('イベント', 'lightningtalk-child'); ?></td><td>' + data.wordpress.events + '</td><td>' + (data.nodejs_api.events || 'N/A') + '</td></tr>' +
                        '<tr><td><?php _e('参加者', 'lightningtalk-child'); ?></td><td>' + data.wordpress.participants + '</td><td>' + (data.nodejs_api.participants || 'N/A') + '</td></tr>' +
                        '<tr><td><?php _e('発表', 'lightningtalk-child'); ?></td><td>' + data.wordpress.talks + '</td><td>' + (data.nodejs_api.talks || 'N/A') + '</td></tr>' +
                        '</table>'
                    );
                });
            });
            </script>
        </div>
        <?php
    }
    
    /**
     * AJAX 핸들러
     */
    public function handle_sync_request() {
        check_ajax_referer('lightningtalk_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('権限がありません。', 'lightningtalk-child'));
        }
        
        $this->scheduled_sync();
        
        wp_send_json_success(array(
            'message' => __('同期が完了しました。', 'lightningtalk-child'),
            'timestamp' => current_time('mysql')
        ));
    }
    
    public function handle_external_registration() {
        // 외부에서의 등록 요청 처리 (CORS 대응)
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            wp_send_json_error(array('message' => __('Invalid request data', 'lightningtalk-child')));
        }
        
        // Node.js API로 프록시
        $request = new WP_REST_Request('POST');
        $request->set_body(json_encode($input));
        
        $response = $this->proxy_registration($request);
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        wp_send_json_success($response->get_data());
    }
}

// 인스턴스 생성
new LightningTalk_API_Integration();