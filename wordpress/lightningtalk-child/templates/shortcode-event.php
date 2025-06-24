<?php
/**
 * Event Display Shortcode Template
 * 
 * Available variables:
 * $atts - shortcode attributes
 */

// セキュリティチェック
if (!defined('ABSPATH')) {
    exit;
}

$event_id = !empty($atts['id']) ? intval($atts['id']) : get_the_ID();
$template = !empty($atts['template']) ? sanitize_text_field($atts['template']) : 'default';

if (!$event_id) {
    return '<p class="lt-alert lt-alert-warning">イベントIDが指定されていません。</p>';
}

$event = get_post($event_id);
if (!$event || $event->post_type !== 'lt_event') {
    return '<p class="lt-alert lt-alert-danger">指定されたイベントが見つかりません。</p>';
}

// イベントメタデータの取得
$event_meta = get_post_meta($event_id);
$event_date = get_post_meta($event_id, 'event_date', true);
$event_time = get_post_meta($event_id, 'event_time', true);
$venue_name = get_post_meta($event_id, 'venue_name', true);
$venue_address = get_post_meta($event_id, 'venue_address', true);
$capacity = get_post_meta($event_id, 'capacity', true);
$max_talks = get_post_meta($event_id, 'max_talks', true);
$registration_deadline = get_post_meta($event_id, 'registration_deadline', true);
$event_status = get_post_meta($event_id, 'event_status', true);

// 参加者数の取得
$total_participants = lightningtalk_get_participant_count($event_id, 'all');
$listener_count = lightningtalk_get_participant_count($event_id, 'listener');
$speaker_count = lightningtalk_get_participant_count($event_id, 'speaker');

// トーク数の取得
$talk_count = count(get_posts(array(
    'post_type' => 'lt_talk',
    'meta_key' => 'event_id',
    'meta_value' => $event_id,
    'posts_per_page' => -1,
    'fields' => 'ids'
)));

// 日付のフォーマット
$formatted_date = '';
if ($event_date) {
    $date_obj = DateTime::createFromFormat('Y-m-d', $event_date);
    if ($date_obj) {
        $formatted_date = $date_obj->format('Y年n月j日（D）');
    }
}

// ステータスに応じたクラス
$status_class = '';
switch ($event_status) {
    case 'upcoming':
        $status_class = 'lt-status-upcoming';
        break;
    case 'ongoing':
        $status_class = 'lt-status-ongoing';
        break;
    case 'completed':
        $status_class = 'lt-status-completed';
        break;
    case 'cancelled':
        $status_class = 'lt-status-cancelled';
        break;
}
?>

<div class="lightning-talk-container">
    <div class="lt-event <?php echo esc_attr($status_class); ?>" data-event-id="<?php echo esc_attr($event_id); ?>">
        
        <!-- イベントヘッダー -->
        <div class="lt-event-header">
            <h2 class="lt-event-title">
                ⚡ <?php echo esc_html($event->post_title); ?>
            </h2>
            <?php if ($formatted_date || $event_time): ?>
                <p class="lt-event-date">
                    <?php 
                    if ($formatted_date) echo esc_html($formatted_date);
                    if ($formatted_date && $event_time) echo ' ';
                    if ($event_time) echo esc_html($event_time);
                    ?>
                </p>
            <?php endif; ?>
        </div>
        
        <!-- イベント内容 -->
        <div class="lt-event-content">
            
            <!-- イベント情報 -->
            <div class="lt-event-meta">
                <?php if ($venue_name): ?>
                    <div class="lt-meta-item">
                        <i class="dashicons dashicons-location"></i>
                        <span><?php echo esc_html($venue_name); ?></span>
                    </div>
                <?php endif; ?>
                
                <?php if ($capacity): ?>
                    <div class="lt-meta-item">
                        <i class="dashicons dashicons-groups"></i>
                        <span>定員: <?php echo esc_html($capacity); ?>名</span>
                    </div>
                <?php endif; ?>
                
                <?php if ($max_talks): ?>
                    <div class="lt-meta-item">
                        <i class="dashicons dashicons-microphone"></i>
                        <span>最大トーク数: <?php echo esc_html($max_talks); ?>件</span>
                    </div>
                <?php endif; ?>
                
                <?php if ($registration_deadline): ?>
                    <div class="lt-meta-item">
                        <i class="dashicons dashicons-calendar-alt"></i>
                        <span>申込締切: <?php echo esc_html(date('Y年n月j日', strtotime($registration_deadline))); ?></span>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- イベント説明 -->
            <?php if ($event->post_content): ?>
                <div class="lt-event-description">
                    <?php echo wp_kses_post(wpautop($event->post_content)); ?>
                </div>
            <?php endif; ?>
            
            <!-- 参加者統計 -->
            <div class="lt-participants-count" data-event-id="<?php echo esc_attr($event_id); ?>">
                <div class="lt-count-item">
                    <div class="lt-count-number" data-count="total"><?php echo esc_html($total_participants); ?></div>
                    <div class="lt-count-label">総参加者</div>
                </div>
                <div class="lt-count-item">
                    <div class="lt-count-number" data-count="listeners"><?php echo esc_html($listener_count); ?></div>
                    <div class="lt-count-label">リスナー</div>
                </div>
                <div class="lt-count-item">
                    <div class="lt-count-number" data-count="speakers"><?php echo esc_html($speaker_count); ?></div>
                    <div class="lt-count-label">スピーカー</div>
                </div>
                <div class="lt-count-item">
                    <div class="lt-count-number"><?php echo esc_html($talk_count); ?></div>
                    <div class="lt-count-label">発表予定</div>
                </div>
            </div>
            
            <!-- 会場情報 -->
            <?php if ($venue_address): ?>
                <div class="lt-venue-info">
                    <h3>会場アクセス</h3>
                    <p><?php echo esc_html($venue_address); ?></p>
                    
                    <?php 
                    // 緯度経度が設定されている場合はマップを表示
                    $venue_lat = get_post_meta($event_id, 'venue_lat', true);
                    $venue_lng = get_post_meta($event_id, 'venue_lng', true);
                    if ($venue_lat && $venue_lng): 
                    ?>
                        <div class="lt-map" 
                             data-lat="<?php echo esc_attr($venue_lat); ?>" 
                             data-lng="<?php echo esc_attr($venue_lng); ?>"
                             data-title="<?php echo esc_attr($venue_name ?: $event->post_title); ?>"
                             style="height: 300px; border-radius: 8px; margin-top: 15px;">
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            
            <!-- 登録ボタン（ステータスに応じて） -->
            <?php if ($event_status === 'upcoming' || empty($event_status)): ?>
                <div class="lt-event-actions lt-text-center">
                    <button class="lt-btn lt-btn-primary lt-btn-lg" data-modal="#lt-registration-modal-<?php echo esc_attr($event_id); ?>">
                        🎤 参加登録
                    </button>
                </div>
            <?php elseif ($event_status === 'ongoing'): ?>
                <div class="lt-event-actions lt-text-center">
                    <p class="lt-alert lt-alert-info">現在開催中です！</p>
                </div>
            <?php elseif ($event_status === 'completed'): ?>
                <div class="lt-event-actions lt-text-center">
                    <p class="lt-alert lt-alert-success">開催終了しました。ご参加ありがとうございました！</p>
                </div>
            <?php elseif ($event_status === 'cancelled'): ?>
                <div class="lt-event-actions lt-text-center">
                    <p class="lt-alert lt-alert-danger">このイベントは中止になりました。</p>
                </div>
            <?php endif; ?>
            
        </div>
    </div>
</div>

<!-- 登録モーダル -->
<div id="lt-registration-modal-<?php echo esc_attr($event_id); ?>" class="lt-modal">
    <div class="lt-modal-content">
        <div class="lt-modal-header">
            <h3 class="lt-modal-title">Lightning Talk 参加登録</h3>
            <span class="lt-modal-close">&times;</span>
        </div>
        <div class="lt-modal-body">
            <form class="lt-registration-form" data-event-id="<?php echo esc_attr($event_id); ?>">
                <input type="hidden" name="event_id" value="<?php echo esc_attr($event_id); ?>">
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="participant_type_<?php echo esc_attr($event_id); ?>">参加タイプ</label>
                    <div class="lt-radio-group">
                        <div class="lt-radio-item">
                            <input type="radio" id="listener_<?php echo esc_attr($event_id); ?>" name="participant_type" value="listener" required>
                            <label for="listener_<?php echo esc_attr($event_id); ?>">リスナー（聞くだけ）</label>
                        </div>
                        <div class="lt-radio-item">
                            <input type="radio" id="speaker_<?php echo esc_attr($event_id); ?>" name="participant_type" value="speaker" required>
                            <label for="speaker_<?php echo esc_attr($event_id); ?>">スピーカー（発表する）</label>
                        </div>
                    </div>
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="name_<?php echo esc_attr($event_id); ?>">お名前 *</label>
                    <input type="text" class="lt-form-input" id="name_<?php echo esc_attr($event_id); ?>" name="name" required>
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="email_<?php echo esc_attr($event_id); ?>">メールアドレス *</label>
                    <input type="email" class="lt-form-input" id="email_<?php echo esc_attr($event_id); ?>" name="email" required>
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="emergency_contact_<?php echo esc_attr($event_id); ?>">緊急連絡先</label>
                    <input type="tel" class="lt-form-input" id="emergency_contact_<?php echo esc_attr($event_id); ?>" name="emergency_contact">
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="dietary_restrictions_<?php echo esc_attr($event_id); ?>">食事制限・アレルギー</label>
                    <textarea class="lt-form-input" id="dietary_restrictions_<?php echo esc_attr($event_id); ?>" name="dietary_restrictions" rows="2"></textarea>
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="accessibility_needs_<?php echo esc_attr($event_id); ?>">アクセシビリティ要件</label>
                    <textarea class="lt-form-input" id="accessibility_needs_<?php echo esc_attr($event_id); ?>" name="accessibility_needs" rows="2"></textarea>
                </div>
                
                <div class="lt-form-group lt-text-center">
                    <button type="submit" class="lt-btn lt-btn-primary lt-btn-lg lt-btn-block lt-btn-submit">
                        参加登録
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
.lt-status-upcoming { border-left: 4px solid #17a2b8; }
.lt-status-ongoing { border-left: 4px solid #28a745; }
.lt-status-completed { border-left: 4px solid #6c757d; }
.lt-status-cancelled { border-left: 4px solid #dc3545; }
</style>