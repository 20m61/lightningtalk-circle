<?php
/**
 * Registration Button Shortcode Template
 * 
 * Available variables:
 * $atts - shortcode attributes
 */

// セキュリティチェック
if (!defined('ABSPATH')) {
    exit;
}

$event_id = !empty($atts['event_id']) ? intval($atts['event_id']) : get_the_ID();
$button_text = !empty($atts['button_text']) ? sanitize_text_field($atts['button_text']) : '参加登録';
$type = !empty($atts['type']) ? sanitize_text_field($atts['type']) : 'both'; // listener, speaker, both

if (!$event_id) {
    return '<p class="lt-alert lt-alert-warning">イベントIDが指定されていません。</p>';
}

// イベントの存在確認
$event = get_post($event_id);
if (!$event || $event->post_type !== 'lt_event') {
    return '<p class="lt-alert lt-alert-danger">指定されたイベントが見つかりません。</p>';
}

// イベントステータスの確認
$event_status = get_post_meta($event_id, 'event_status', true);
$registration_deadline = get_post_meta($event_id, 'registration_deadline', true);

// 締切チェック
$is_deadline_passed = false;
if ($registration_deadline) {
    $deadline_date = DateTime::createFromFormat('Y-m-d', $registration_deadline);
    $current_date = new DateTime();
    $is_deadline_passed = $deadline_date < $current_date;
}

// 定員チェック
$capacity = get_post_meta($event_id, 'capacity', true);
$current_participants = lightningtalk_get_participant_count($event_id, 'all');
$is_full = $capacity && $current_participants >= $capacity;

// 登録可能かどうかの判定
$can_register = !in_array($event_status, ['completed', 'cancelled']) && !$is_deadline_passed && !$is_full;

$unique_id = 'lt-register-' . $event_id . '-' . uniqid();
?>

<div class="lightning-talk-container">
    <div class="lt-registration-section">
        
        <?php if ($can_register): ?>
            
            <div class="lt-text-center">
                <button class="lt-btn lt-btn-primary lt-btn-lg" 
                        data-modal="#<?php echo esc_attr($unique_id); ?>-modal">
                    🎤 <?php echo esc_html($button_text); ?>
                </button>
            </div>
            
            <!-- 登録情報 -->
            <div class="lt-registration-info" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.9rem;">
                    
                    <?php if ($capacity): ?>
                        <div>
                            <strong>定員:</strong> <?php echo esc_html($capacity); ?>名
                            <br>
                            <strong>現在の参加者:</strong> <?php echo esc_html($current_participants); ?>名
                            <br>
                            <span style="color: <?php echo $current_participants >= $capacity * 0.8 ? '#dc3545' : '#28a745'; ?>;">
                                残り <?php echo esc_html($capacity - $current_participants); ?>名
                            </span>
                        </div>
                    <?php endif; ?>
                    
                    <?php if ($registration_deadline): ?>
                        <div>
                            <strong>申込締切:</strong>
                            <br>
                            <?php echo esc_html(date('Y年n月j日', strtotime($registration_deadline))); ?>
                        </div>
                    <?php endif; ?>
                    
                    <div>
                        <strong>参加形式:</strong>
                        <br>
                        <?php
                        switch ($type) {
                            case 'listener':
                                echo 'リスナーのみ';
                                break;
                            case 'speaker':
                                echo 'スピーカーのみ';
                                break;
                            default:
                                echo 'リスナー・スピーカー両方';
                        }
                        ?>
                    </div>
                </div>
            </div>
            
        <?php else: ?>
            
            <!-- 登録不可の場合 -->
            <div class="lt-text-center">
                <?php if ($event_status === 'completed'): ?>
                    <p class="lt-alert lt-alert-success">
                        このイベントは終了しました。ご参加ありがとうございました！
                    </p>
                <?php elseif ($event_status === 'cancelled'): ?>
                    <p class="lt-alert lt-alert-danger">
                        このイベントは中止になりました。
                    </p>
                <?php elseif ($is_deadline_passed): ?>
                    <p class="lt-alert lt-alert-warning">
                        申込締切を過ぎているため、新規登録は受け付けておりません。
                    </p>
                <?php elseif ($is_full): ?>
                    <p class="lt-alert lt-alert-warning">
                        定員に達したため、新規登録は受け付けておりません。
                        <br>
                        キャンセル待ちをご希望の場合は、お問い合わせください。
                    </p>
                <?php else: ?>
                    <p class="lt-alert lt-alert-info">
                        現在、参加登録を受け付けておりません。
                    </p>
                <?php endif; ?>
            </div>
            
        <?php endif; ?>
        
    </div>
</div>

<?php if ($can_register): ?>
<!-- 登録モーダル -->
<div id="<?php echo esc_attr($unique_id); ?>-modal" class="lt-modal">
    <div class="lt-modal-content">
        <div class="lt-modal-header">
            <h3 class="lt-modal-title">
                ⚡ <?php echo esc_html($event->post_title); ?> - 参加登録
            </h3>
            <span class="lt-modal-close">&times;</span>
        </div>
        <div class="lt-modal-body">
            <form class="lt-registration-form" data-event-id="<?php echo esc_attr($event_id); ?>">
                <input type="hidden" name="event_id" value="<?php echo esc_attr($event_id); ?>">
                
                <?php if ($type === 'both'): ?>
                    <div class="lt-form-group">
                        <label class="lt-form-label">参加タイプ *</label>
                        <div class="lt-radio-group">
                            <div class="lt-radio-item">
                                <input type="radio" id="listener_<?php echo esc_attr($unique_id); ?>" name="participant_type" value="listener" required>
                                <label for="listener_<?php echo esc_attr($unique_id); ?>">
                                    👂 リスナー（聞くだけ）
                                </label>
                            </div>
                            <div class="lt-radio-item">
                                <input type="radio" id="speaker_<?php echo esc_attr($unique_id); ?>" name="participant_type" value="speaker" required>
                                <label for="speaker_<?php echo esc_attr($unique_id); ?>">
                                    🎤 スピーカー（発表する）
                                </label>
                            </div>
                        </div>
                    </div>
                <?php else: ?>
                    <input type="hidden" name="participant_type" value="<?php echo esc_attr($type); ?>">
                    <div class="lt-alert lt-alert-info">
                        参加タイプ: 
                        <?php echo $type === 'listener' ? '👂 リスナー（聞くだけ）' : '🎤 スピーカー（発表する）'; ?>
                    </div>
                <?php endif; ?>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="name_<?php echo esc_attr($unique_id); ?>">お名前 *</label>
                    <input type="text" class="lt-form-input" id="name_<?php echo esc_attr($unique_id); ?>" name="name" required 
                           placeholder="山田太郎">
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="email_<?php echo esc_attr($unique_id); ?>">メールアドレス *</label>
                    <input type="email" class="lt-form-input" id="email_<?php echo esc_attr($unique_id); ?>" name="email" required 
                           placeholder="example@example.com">
                    <small style="color: #666; font-size: 0.85rem;">確認メールをお送りします</small>
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="emergency_contact_<?php echo esc_attr($unique_id); ?>">緊急連絡先</label>
                    <input type="tel" class="lt-form-input" id="emergency_contact_<?php echo esc_attr($unique_id); ?>" name="emergency_contact" 
                           placeholder="090-1234-5678">
                    <small style="color: #666; font-size: 0.85rem;">当日連絡が取れる電話番号</small>
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="dietary_restrictions_<?php echo esc_attr($unique_id); ?>">食事制限・アレルギー</label>
                    <textarea class="lt-form-input" id="dietary_restrictions_<?php echo esc_attr($unique_id); ?>" name="dietary_restrictions" rows="2" 
                              placeholder="アレルギーや食事制限がある場合はご記入ください"></textarea>
                </div>
                
                <div class="lt-form-group">
                    <label class="lt-form-label" for="accessibility_needs_<?php echo esc_attr($unique_id); ?>">アクセシビリティ要件</label>
                    <textarea class="lt-form-input" id="accessibility_needs_<?php echo esc_attr($unique_id); ?>" name="accessibility_needs" rows="2" 
                              placeholder="車椅子対応、手話通訳等が必要な場合はご記入ください"></textarea>
                </div>
                
                <!-- プライバシーポリシー同意 -->
                <div class="lt-form-group">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 0.9rem;">
                        <label style="display: flex; align-items: flex-start; gap: 10px;">
                            <input type="checkbox" name="privacy_agreement" required style="margin-top: 3px;">
                            <span>
                                <strong>個人情報の取り扱いについて</strong><br>
                                ご入力いただいた個人情報は、本イベントの運営目的のみに使用し、
                                第三者に提供することはありません。
                            </span>
                        </label>
                    </div>
                </div>
                
                <div class="lt-form-group lt-text-center">
                    <button type="submit" class="lt-btn lt-btn-primary lt-btn-lg lt-btn-block lt-btn-submit">
                        📝 参加登録を送信
                    </button>
                </div>
                
                <div class="lt-text-center" style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                    送信後、確認メールをお送りします。<br>
                    メールが届かない場合は、迷惑メールフォルダもご確認ください。
                </div>
            </form>
        </div>
    </div>
</div>
<?php endif; ?>

<style>
.lt-registration-info {
    border: 1px solid #dee2e6;
    transition: all 0.3s ease;
}

.lt-registration-info:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.lt-form-group.focused .lt-form-label {
    color: var(--lt-primary);
    transform: translateY(-2px);
    transition: all 0.3s ease;
}

.lt-form-group.filled .lt-form-label {
    font-weight: 600;
}

.lt-radio-item {
    padding: 10px;
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

.lt-radio-item:hover {
    background-color: rgba(102, 126, 234, 0.05);
}

.lt-radio-item input[type="radio"]:checked + label {
    color: var(--lt-primary);
    font-weight: 600;
}

/* アニメーション効果 */
.lt-registration-section {
    animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 定員残りわずかの場合の強調 */
.capacity-warning {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
}
</style>

<?php if ($capacity && $current_participants >= $capacity * 0.8): ?>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const capacityInfo = document.querySelector('.lt-registration-info');
    if (capacityInfo) {
        capacityInfo.classList.add('capacity-warning');
    }
});
</script>
<?php endif; ?>