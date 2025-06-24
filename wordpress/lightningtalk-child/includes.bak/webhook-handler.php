<?php
/**
 * Lightning Talk Webhook Handler
 * Node.js APIとWordPressの間のリアルタイム同期
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

class LightningTalk_Webhook_Handler {
    
    private $webhook_secret;
    
    public function __construct() {
        $this->webhook_secret = get_option('lightningtalk_webhook_secret', '');
        
        add_action('init', array($this, 'init'));
        add_action('rest_api_init', array($this, 'register_webhook_endpoints'));
        add_action('post_updated', array($this, 'handle_post_update'), 10, 3);
        add_action('wp_insert_post', array($this, 'handle_post_insert'), 10, 3);
        add_action('delete_post', array($this, 'handle_post_delete'), 10, 2);
    }
    
    public function init() {
        // Webhook秘密鍵の生成（初回のみ）
        if (empty($this->webhook_secret)) {
            $this->webhook_secret = wp_generate_password(32, false);
            update_option('lightningtalk_webhook_secret', $this->webhook_secret);
        }
    }
    
    /**
     * Webhook エンドポイントを登録
     */
    public function register_webhook_endpoints() {
        // Node.js APIからのWebhook受信
        register_rest_route('lightningtalk/v1', '/webhook/(?P<type>[a-zA-Z0-9_-]+)', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_incoming_webhook'),
            'permission_callback' => array($this, 'verify_webhook_signature'),
        ));
        
        // Webhook設定確認
        register_rest_route('lightningtalk/v1', '/webhook/test', array(
            'methods' => 'GET',
            'callback' => array($this, 'test_webhook'),
            'permission_callback' => array($this, 'verify_webhook_signature'),
        ));
    }
    
    /**
     * Node.js APIからのWebhookを処理
     */
    public function handle_incoming_webhook($request) {
        $type = $request->get_param('type');
        $data = $request->get_json_params();
        
        try {
            switch ($type) {
                case 'participant_registered':
                    $result = $this->handle_participant_webhook($data, 'registered');
                    break;
                case 'participant_updated':
                    $result = $this->handle_participant_webhook($data, 'updated');
                    break;
                case 'talk_submitted':
                    $result = $this->handle_talk_webhook($data, 'submitted');
                    break;
                case 'talk_approved':
                    $result = $this->handle_talk_webhook($data, 'approved');
                    break;
                case 'event_created':
                    $result = $this->handle_event_webhook($data, 'created');
                    break;
                case 'event_updated':
                    $result = $this->handle_event_webhook($data, 'updated');
                    break;
                default:
                    return new WP_Error('invalid_webhook', 'Unknown webhook type: ' . $type, array('status' => 400));
            }
            
            // ログ記録
            $this->log_webhook_activity($type, $data, $result);
            
            return rest_ensure_response(array(
                'success' => true,
                'type' => $type,
                'processed' => $result,
                'timestamp' => current_time('mysql')
            ));
            
        } catch (Exception $e) {
            error_log('Lightning Talk Webhook Error: ' . $e->getMessage());
            return new WP_Error('webhook_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * 参加者関連のWebhook処理
     */
    private function handle_participant_webhook($data, $action) {
        $external_id = $data['participant']['id'] ?? '';
        $participant_data = $data['participant'] ?? array();
        
        if (empty($external_id)) {
            throw new Exception('Missing participant ID');
        }
        
        // 既存の参加者を検索
        $existing_post = $this->find_post_by_external_id('lt_participant', $external_id);
        
        $post_data = array(
            'post_title' => sanitize_text_field($participant_data['name'] ?? ''),
            'post_type' => 'lt_participant',
            'post_status' => 'publish',
            'meta_input' => array(
                'external_participant_id' => $external_id,
                'email' => sanitize_email($participant_data['email'] ?? ''),
                'event_id' => sanitize_text_field($participant_data['eventId'] ?? ''),
                'participation_type' => sanitize_text_field($participant_data['participationType'] ?? ''),
                'phone' => sanitize_text_field($participant_data['phone'] ?? ''),
                'company' => sanitize_text_field($participant_data['company'] ?? ''),
                'job_title' => sanitize_text_field($participant_data['jobTitle'] ?? ''),
                'emergency_contact_name' => sanitize_text_field($participant_data['emergencyContact']['name'] ?? ''),
                'emergency_contact_phone' => sanitize_text_field($participant_data['emergencyContact']['phone'] ?? ''),
                'webhook_sync' => true,
                'sync_timestamp' => current_time('mysql')
            )
        );
        
        if ($existing_post) {
            $post_data['ID'] = $existing_post->ID;
            $result = wp_update_post($post_data);
            $action_type = 'updated';
        } else {
            $result = wp_insert_post($post_data);
            $action_type = 'created';
        }
        
        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }
        
        return array(
            'post_id' => $result,
            'action' => $action_type,
            'external_id' => $external_id
        );
    }
    
    /**
     * 発表関連のWebhook処理
     */
    private function handle_talk_webhook($data, $action) {
        $external_id = $data['talk']['id'] ?? '';
        $talk_data = $data['talk'] ?? array();
        
        if (empty($external_id)) {
            throw new Exception('Missing talk ID');
        }
        
        // 既存の発表を検索
        $existing_post = $this->find_post_by_external_id('lt_talk', $external_id);
        
        $post_data = array(
            'post_title' => sanitize_text_field($talk_data['title'] ?? ''),
            'post_content' => wp_kses_post($talk_data['description'] ?? ''),
            'post_type' => 'lt_talk',
            'post_status' => $this->map_talk_status($talk_data['status'] ?? 'pending'),
            'meta_input' => array(
                'external_talk_id' => $external_id,
                'event_id' => sanitize_text_field($talk_data['eventId'] ?? ''),
                'speaker_name' => sanitize_text_field($talk_data['speakerName'] ?? ''),
                'speaker_email' => sanitize_email($talk_data['speakerEmail'] ?? ''),
                'category' => sanitize_text_field($talk_data['category'] ?? ''),
                'duration' => intval($talk_data['duration'] ?? 5),
                'target_audience' => sanitize_text_field($talk_data['targetAudience'] ?? ''),
                'needs_projector' => !empty($talk_data['needsProjector']),
                'webhook_sync' => true,
                'sync_timestamp' => current_time('mysql')
            )
        );
        
        if ($existing_post) {
            $post_data['ID'] = $existing_post->ID;
            $result = wp_update_post($post_data);
            $action_type = 'updated';
        } else {
            $result = wp_insert_post($post_data);
            $action_type = 'created';
        }
        
        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }
        
        // カテゴリー設定
        if (!empty($talk_data['category'])) {
            wp_set_object_terms($result, array($talk_data['category']), 'lt_talk_category');
        }
        
        return array(
            'post_id' => $result,
            'action' => $action_type,
            'external_id' => $external_id
        );
    }
    
    /**
     * イベント関連のWebhook処理
     */
    private function handle_event_webhook($data, $action) {
        $external_id = $data['event']['id'] ?? '';
        $event_data = $data['event'] ?? array();
        
        if (empty($external_id)) {
            throw new Exception('Missing event ID');
        }
        
        // 既存のイベントを検索
        $existing_post = $this->find_post_by_external_id('lt_event', $external_id);
        
        $post_data = array(
            'post_title' => sanitize_text_field($event_data['title'] ?? ''),
            'post_content' => wp_kses_post($event_data['description'] ?? ''),
            'post_type' => 'lt_event',
            'post_status' => $this->map_event_status($event_data['status'] ?? 'upcoming'),
            'meta_input' => array(
                'external_event_id' => $external_id,
                'event_date' => sanitize_text_field($event_data['eventDate'] ?? ''),
                'end_date' => sanitize_text_field($event_data['endDate'] ?? ''),
                'venue_name' => sanitize_text_field($event_data['venue']['name'] ?? ''),
                'venue_address' => sanitize_text_field($event_data['venue']['address'] ?? ''),
                'venue_capacity' => intval($event_data['venue']['capacity'] ?? 0),
                'online_url' => esc_url_raw($event_data['venue']['onlineUrl'] ?? ''),
                'max_talks' => intval($event_data['maxTalks'] ?? 20),
                'talk_duration' => intval($event_data['talkDuration'] ?? 5),
                'webhook_sync' => true,
                'sync_timestamp' => current_time('mysql')
            )
        );
        
        if ($existing_post) {
            $post_data['ID'] = $existing_post->ID;
            $result = wp_update_post($post_data);
            $action_type = 'updated';
        } else {
            $result = wp_insert_post($post_data);
            $action_type = 'created';
        }
        
        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }
        
        return array(
            'post_id' => $result,
            'action' => $action_type,
            'external_id' => $external_id
        );
    }
    
    /**
     * WordPressからNode.js APIへのWebhook送信
     */
    public function handle_post_update($post_id, $post_after, $post_before) {
        if (!$this->should_send_webhook($post_after)) {
            return;
        }
        
        // Webhook同期によるループを防ぐ
        if (get_post_meta($post_id, 'webhook_sync', true)) {
            delete_post_meta($post_id, 'webhook_sync');
            return;
        }
        
        $this->send_webhook_to_api('updated', $post_after);
    }
    
    public function handle_post_insert($post_id, $post, $update) {
        if (!$this->should_send_webhook($post) || $update) {
            return;
        }
        
        // Webhook同期によるループを防ぐ
        if (get_post_meta($post_id, 'webhook_sync', true)) {
            delete_post_meta($post_id, 'webhook_sync');
            return;
        }
        
        $this->send_webhook_to_api('created', $post);
    }
    
    public function handle_post_delete($post_id, $post) {
        if (!$this->should_send_webhook($post)) {
            return;
        }
        
        $this->send_webhook_to_api('deleted', $post);
    }
    
    /**
     * Node.js APIにWebhookを送信
     */
    private function send_webhook_to_api($action, $post) {
        $api_url = get_option('lightningtalk_api_url', '');
        if (empty($api_url)) {
            return;
        }
        
        $webhook_url = rtrim($api_url, '/') . '/webhook/wordpress';
        $webhook_data = $this->prepare_webhook_data($action, $post);
        
        $signature = hash_hmac('sha256', json_encode($webhook_data), $this->webhook_secret);
        
        wp_remote_post($webhook_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Webhook-Signature' => 'sha256=' . $signature,
                'User-Agent' => 'WordPress/LightningTalk v' . LIGHTNINGTALK_CHILD_VERSION
            ),
            'body' => json_encode($webhook_data),
            'timeout' => 15,
            'blocking' => false  // 非同期送信
        ));
    }
    
    /**
     * Webhook送信データの準備
     */
    private function prepare_webhook_data($action, $post) {
        $data = array(
            'action' => $action,
            'type' => $post->post_type,
            'timestamp' => current_time('c'),
            'site_url' => home_url(),
        );
        
        switch ($post->post_type) {
            case 'lt_event':
                $data['event'] = array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'description' => $post->post_content,
                    'eventDate' => get_post_meta($post->ID, 'event_date', true),
                    'status' => $post->post_status,
                    'venue' => array(
                        'name' => get_post_meta($post->ID, 'venue_name', true),
                        'address' => get_post_meta($post->ID, 'venue_address', true),
                        'capacity' => get_post_meta($post->ID, 'venue_capacity', true),
                        'onlineUrl' => get_post_meta($post->ID, 'online_url', true),
                    ),
                    'maxTalks' => get_post_meta($post->ID, 'max_talks', true),
                    'talkDuration' => get_post_meta($post->ID, 'talk_duration', true),
                );
                break;
                
            case 'lt_participant':
                $data['participant'] = array(
                    'id' => $post->ID,
                    'name' => $post->post_title,
                    'email' => get_post_meta($post->ID, 'email', true),
                    'eventId' => get_post_meta($post->ID, 'event_id', true),
                    'participationType' => get_post_meta($post->ID, 'participation_type', true),
                    'phone' => get_post_meta($post->ID, 'phone', true),
                    'company' => get_post_meta($post->ID, 'company', true),
                    'jobTitle' => get_post_meta($post->ID, 'job_title', true),
                );
                break;
                
            case 'lt_talk':
                $data['talk'] = array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'description' => $post->post_content,
                    'eventId' => get_post_meta($post->ID, 'event_id', true),
                    'speakerName' => get_post_meta($post->ID, 'speaker_name', true),
                    'speakerEmail' => get_post_meta($post->ID, 'speaker_email', true),
                    'category' => get_post_meta($post->ID, 'category', true),
                    'duration' => get_post_meta($post->ID, 'duration', true),
                    'status' => $post->post_status,
                );
                break;
        }
        
        return $data;
    }
    
    /**
     * Webhook署名の検証
     */
    public function verify_webhook_signature($request) {
        $signature = $request->get_header('X-Webhook-Signature');
        
        if (empty($signature)) {
            return false;
        }
        
        $body = $request->get_body();
        $expected_signature = 'sha256=' . hash_hmac('sha256', $body, $this->webhook_secret);
        
        return hash_equals($expected_signature, $signature);
    }
    
    /**
     * Webhookテスト
     */
    public function test_webhook($request) {
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Webhook endpoint is working',
            'timestamp' => current_time('c'),
            'signature_verified' => true
        ));
    }
    
    /**
     * ヘルパーメソッド
     */
    private function should_send_webhook($post) {
        return in_array($post->post_type, array('lt_event', 'lt_participant', 'lt_talk')) &&
               $post->post_status !== 'auto-draft';
    }
    
    private function find_post_by_external_id($post_type, $external_id) {
        $meta_key = 'external_' . str_replace('lt_', '', $post_type) . '_id';
        
        $posts = get_posts(array(
            'post_type' => $post_type,
            'meta_key' => $meta_key,
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
    
    private function log_webhook_activity($type, $data, $result) {
        $log_entry = array(
            'timestamp' => current_time('mysql'),
            'type' => $type,
            'data_summary' => array(
                'id' => $data['id'] ?? 'unknown',
                'action' => $result['action'] ?? 'unknown'
            ),
            'result' => $result
        );
        
        $existing_log = get_option('lightningtalk_webhook_log', array());
        $existing_log[] = $log_entry;
        
        // ログを最新100件に制限
        if (count($existing_log) > 100) {
            $existing_log = array_slice($existing_log, -100);
        }
        
        update_option('lightningtalk_webhook_log', $existing_log);
    }
}

// インスタンス作成
new LightningTalk_Webhook_Handler();