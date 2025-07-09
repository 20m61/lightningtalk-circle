<?php
/**
 * Lightning Talk REST API Integration
 * 
 * @package LightningTalkChild
 */

// セキュリティ: 直接アクセス防止
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Lightning Talk REST API クラス
 */
class LightningTalk_REST_API {
    
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    /**
     * REST API ルート登録
     */
    public function register_routes() {
        // Events エンドポイント
        register_rest_route('lightningtalk/v1', '/events', [
            'methods' => 'GET',
            'callback' => [$this, 'get_events'],
            'permission_callback' => '__return_true'
        ]);
        
        register_rest_route('lightningtalk/v1', '/events/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_event'],
            'permission_callback' => '__return_true',
            'args' => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);
        
        // Participants エンドポイント
        register_rest_route('lightningtalk/v1', '/participants', [
            'methods' => 'POST',
            'callback' => [$this, 'create_participant'],
            'permission_callback' => [$this, 'check_nonce_permission']
        ]);
        
        // Talks エンドポイント
        register_rest_route('lightningtalk/v1', '/talks', [
            'methods' => 'POST',
            'callback' => [$this, 'create_talk'],
            'permission_callback' => [$this, 'check_nonce_permission']
        ]);
        
        // Analytics エンドポイント
        register_rest_route('lightningtalk/v1', '/analytics/(?P<event_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_analytics'],
            'permission_callback' => 'is_user_logged_in',
            'args' => [
                'event_id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);
    }
    
    /**
     * イベント一覧取得
     */
    public function get_events($request) {
        try {
            $events = get_posts([
                'post_type' => 'lightningtalk_event',
                'post_status' => 'publish',
                'numberposts' => -1,
                'meta_query' => [
                    [
                        'key' => '_event_status',
                        'value' => ['upcoming', 'ongoing'],
                        'compare' => 'IN'
                    ]
                ]
            ]);
            
            $formatted_events = [];
            foreach ($events as $event) {
                $formatted_events[] = $this->format_event($event);
            }
            
            return rest_ensure_response($formatted_events);
            
        } catch (Exception $e) {
            return new WP_Error('api_error', 'Failed to fetch events', ['status' => 500]);
        }
    }
    
    /**
     * 単一イベント取得
     */
    public function get_event($request) {
        $event_id = $request['id'];
        
        try {
            $event = get_post($event_id);
            
            if (!$event || $event->post_type !== 'lightningtalk_event') {
                return new WP_Error('not_found', 'Event not found', ['status' => 404]);
            }
            
            return rest_ensure_response($this->format_event($event));
            
        } catch (Exception $e) {
            return new WP_Error('api_error', 'Failed to fetch event', ['status' => 500]);
        }
    }
    
    /**
     * 参加者登録
     */
    public function create_participant($request) {
        $data = $request->get_json_params();
        
        try {
            // データ検証
            $required_fields = ['name', 'email', 'eventId', 'participationType'];
            foreach ($required_fields as $field) {
                if (empty($data[$field])) {
                    return new WP_Error('missing_field', "Required field '{$field}' is missing", ['status' => 400]);
                }
            }
            
            // イベントの存在確認
            $event = get_post($data['eventId']);
            if (!$event || $event->post_type !== 'lightningtalk_event') {
                return new WP_Error('invalid_event', 'Invalid event ID', ['status' => 400]);
            }
            
            // 参加者データ保存
            $participant_data = [
                'name' => sanitize_text_field($data['name']),
                'email' => sanitize_email($data['email']),
                'eventId' => intval($data['eventId']),
                'participationType' => sanitize_text_field($data['participationType']),
                'registeredAt' => current_time('mysql'),
                'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? ''
            ];
            
            // データベースまたはファイルシステムに保存
            $participant_id = $this->save_participant($participant_data);
            
            if ($participant_id) {
                // 確認メール送信のフック
                do_action('lightningtalk_participant_registered', $participant_data, $event);
                
                return rest_ensure_response([
                    'success' => true,
                    'participant_id' => $participant_id,
                    'message' => 'Registration completed successfully'
                ]);
            } else {
                return new WP_Error('save_failed', 'Failed to save participant data', ['status' => 500]);
            }
            
        } catch (Exception $e) {
            return new WP_Error('api_error', 'Registration failed: ' . $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * 発表申込み
     */
    public function create_talk($request) {
        $data = $request->get_json_params();
        
        try {
            // データ検証
            $required_fields = ['title', 'speakerName', 'speakerEmail', 'eventId', 'category'];
            foreach ($required_fields as $field) {
                if (empty($data[$field])) {
                    return new WP_Error('missing_field', "Required field '{$field}' is missing", ['status' => 400]);
                }
            }
            
            // 発表データ保存
            $talk_data = [
                'title' => sanitize_text_field($data['title']),
                'description' => sanitize_textarea_field($data['description'] ?? ''),
                'speakerName' => sanitize_text_field($data['speakerName']),
                'speakerEmail' => sanitize_email($data['speakerEmail']),
                'eventId' => intval($data['eventId']),
                'category' => sanitize_text_field($data['category']),
                'duration' => intval($data['duration'] ?? 5),
                'submittedAt' => current_time('mysql'),
                'status' => 'pending'
            ];
            
            $talk_id = $this->save_talk($talk_data);
            
            if ($talk_id) {
                // 確認メール送信のフック
                do_action('lightningtalk_talk_submitted', $talk_data);
                
                return rest_ensure_response([
                    'success' => true,
                    'talk_id' => $talk_id,
                    'message' => 'Talk submission completed successfully'
                ]);
            } else {
                return new WP_Error('save_failed', 'Failed to save talk data', ['status' => 500]);
            }
            
        } catch (Exception $e) {
            return new WP_Error('api_error', 'Talk submission failed: ' . $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * アナリティクス取得
     */
    public function get_analytics($request) {
        $event_id = $request['event_id'];
        
        try {
            // 管理者権限チェック
            if (!current_user_can('manage_options')) {
                return new WP_Error('forbidden', 'Insufficient permissions', ['status' => 403]);
            }
            
            $analytics = [
                'eventId' => $event_id,
                'participants' => $this->get_participant_count($event_id),
                'talks' => $this->get_talk_count($event_id),
                'registrationTrend' => $this->get_registration_trend($event_id),
                'talkCategories' => $this->get_talk_categories($event_id),
                'generatedAt' => current_time('mysql')
            ];
            
            return rest_ensure_response($analytics);
            
        } catch (Exception $e) {
            return new WP_Error('api_error', 'Failed to fetch analytics', ['status' => 500]);
        }
    }
    
    /**
     * Nonce権限チェック
     */
    public function check_nonce_permission($request) {
        $nonce = $request->get_header('X-WP-Nonce');
        return wp_verify_nonce($nonce, 'wp_rest');
    }
    
    /**
     * イベントデータフォーマット
     */
    private function format_event($event) {
        $event_meta = get_post_meta($event->ID);
        
        return [
            'id' => $event->ID,
            'title' => $event->post_title,
            'description' => $event->post_content,
            'date' => get_post_meta($event->ID, '_event_date', true),
            'venue' => [
                'name' => get_post_meta($event->ID, '_venue_name', true),
                'address' => get_post_meta($event->ID, '_venue_address', true),
                'onlineUrl' => get_post_meta($event->ID, '_online_url', true)
            ],
            'maxParticipants' => intval(get_post_meta($event->ID, '_max_participants', true) ?: 0),
            'maxTalks' => intval(get_post_meta($event->ID, '_max_talks', true) ?: 20),
            'status' => get_post_meta($event->ID, '_event_status', true),
            'registrationOpen' => get_post_meta($event->ID, '_registration_open', true) === 'yes'
        ];
    }
    
    /**
     * 参加者データ保存
     */
    private function save_participant($data) {
        // 簡易的なファイルベース保存（実際のプロジェクトではデータベースを使用）
        $upload_dir = wp_upload_dir();
        $data_dir = $upload_dir['basedir'] . '/lightningtalk-data';
        
        if (!file_exists($data_dir)) {
            wp_mkdir_p($data_dir);
        }
        
        $participants_file = $data_dir . '/participants.json';
        $participants = [];
        
        if (file_exists($participants_file)) {
            $participants = json_decode(file_get_contents($participants_file), true) ?: [];
        }
        
        $data['id'] = uniqid('participant_');
        $participants[] = $data;
        
        if (file_put_contents($participants_file, json_encode($participants, JSON_PRETTY_PRINT))) {
            return $data['id'];
        }
        
        return false;
    }
    
    /**
     * 発表データ保存
     */
    private function save_talk($data) {
        $upload_dir = wp_upload_dir();
        $data_dir = $upload_dir['basedir'] . '/lightningtalk-data';
        
        if (!file_exists($data_dir)) {
            wp_mkdir_p($data_dir);
        }
        
        $talks_file = $data_dir . '/talks.json';
        $talks = [];
        
        if (file_exists($talks_file)) {
            $talks = json_decode(file_get_contents($talks_file), true) ?: [];
        }
        
        $data['id'] = uniqid('talk_');
        $talks[] = $data;
        
        if (file_put_contents($talks_file, json_encode($talks, JSON_PRETTY_PRINT))) {
            return $data['id'];
        }
        
        return false;
    }
    
    /**
     * 参加者数取得
     */
    private function get_participant_count($event_id) {
        $upload_dir = wp_upload_dir();
        $participants_file = $upload_dir['basedir'] . '/lightningtalk-data/participants.json';
        
        if (!file_exists($participants_file)) {
            return 0;
        }
        
        $participants = json_decode(file_get_contents($participants_file), true) ?: [];
        return count(array_filter($participants, function($p) use ($event_id) {
            return $p['eventId'] == $event_id;
        }));
    }
    
    /**
     * 発表数取得
     */
    private function get_talk_count($event_id) {
        $upload_dir = wp_upload_dir();
        $talks_file = $upload_dir['basedir'] . '/lightningtalk-data/talks.json';
        
        if (!file_exists($talks_file)) {
            return 0;
        }
        
        $talks = json_decode(file_get_contents($talks_file), true) ?: [];
        return count(array_filter($talks, function($t) use ($event_id) {
            return $t['eventId'] == $event_id;
        }));
    }
    
    /**
     * 登録トレンド取得
     */
    private function get_registration_trend($event_id) {
        // 簡易実装（実際にはより詳細な分析を行う）
        return [
            'daily' => [],
            'total' => $this->get_participant_count($event_id)
        ];
    }
    
    /**
     * 発表カテゴリー分析
     */
    private function get_talk_categories($event_id) {
        $upload_dir = wp_upload_dir();
        $talks_file = $upload_dir['basedir'] . '/lightningtalk-data/talks.json';
        
        if (!file_exists($talks_file)) {
            return [];
        }
        
        $talks = json_decode(file_get_contents($talks_file), true) ?: [];
        $event_talks = array_filter($talks, function($t) use ($event_id) {
            return $t['eventId'] == $event_id;
        });
        
        $categories = [];
        foreach ($event_talks as $talk) {
            $category = $talk['category'] ?? 'other';
            $categories[$category] = ($categories[$category] ?? 0) + 1;
        }
        
        return $categories;
    }
}

// REST API 初期化
new LightningTalk_REST_API();