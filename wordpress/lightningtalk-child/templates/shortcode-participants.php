<?php
/**
 * Participants Display Shortcode Template
 * 
 * Available variables:
 * $atts - shortcode attributes
 */

// セキュリティチェック
if (!defined('ABSPATH')) {
    exit;
}

$event_id = !empty($atts['event_id']) ? intval($atts['event_id']) : get_the_ID();
$type = !empty($atts['type']) ? sanitize_text_field($atts['type']) : 'count'; // count, list, both

if (!$event_id) {
    return '<p class="lt-alert lt-alert-warning">イベントIDが指定されていません。</p>';
}

// 参加者数の取得
$total_participants = lightningtalk_get_participant_count($event_id, 'all');
$listener_count = lightningtalk_get_participant_count($event_id, 'listener');
$speaker_count = lightningtalk_get_participant_count($event_id, 'speaker');

// イベント情報の取得
$event = get_post($event_id);
$capacity = get_post_meta($event_id, 'capacity', true);

// 参加者リストの取得（リスト表示の場合）
$participants_list = array();
if ($type === 'list' || $type === 'both') {
    $participants = get_posts(array(
        'post_type' => 'lt_participant',
        'meta_key' => 'event_id',
        'meta_value' => $event_id,
        'posts_per_page' => -1,
        'orderby' => 'date',
        'order' => 'ASC'
    ));
    
    foreach ($participants as $participant) {
        $participant_type = get_post_meta($participant->ID, 'participant_type', true);
        $email = get_post_meta($participant->ID, 'email', true);
        $registration_date = get_post_meta($participant->ID, 'registration_date', true);
        $status = get_post_meta($participant->ID, 'status', true);
        
        $participants_list[] = array(
            'id' => $participant->ID,
            'name' => $participant->post_title,
            'type' => $participant_type,
            'email' => $email,
            'registration_date' => $registration_date,
            'status' => $status
        );
    }
}

// 定員に対する充足率
$capacity_percentage = $capacity ? round(($total_participants / $capacity) * 100, 1) : 0;
?>

<div class="lightning-talk-container">
    
    <?php if ($type === 'count' || $type === 'both'): ?>
    <!-- 参加者数表示 -->
    <div class="lt-participants-count" data-event-id="<?php echo esc_attr($event_id); ?>">
        <div class="lt-count-item">
            <div class="lt-count-number" data-count="total"><?php echo esc_html($total_participants); ?></div>
            <div class="lt-count-label">総参加者</div>
            <?php if ($capacity): ?>
                <div class="lt-count-progress">
                    <div class="lt-progress-bar">
                        <div class="lt-progress-fill" style="width: <?php echo esc_attr(min($capacity_percentage, 100)); ?>%;"></div>
                    </div>
                    <div class="lt-progress-text">
                        <?php echo esc_html($capacity_percentage); ?>% (<?php echo esc_html($capacity); ?>名中)
                    </div>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="lt-count-item">
            <div class="lt-count-number" data-count="listeners"><?php echo esc_html($listener_count); ?></div>
            <div class="lt-count-label">👂 リスナー</div>
            <div class="lt-count-description">発表を聞く方</div>
        </div>
        
        <div class="lt-count-item">
            <div class="lt-count-number" data-count="speakers"><?php echo esc_html($speaker_count); ?></div>
            <div class="lt-count-label">🎤 スピーカー</div>
            <div class="lt-count-description">発表される方</div>
        </div>
    </div>
    <?php endif; ?>
    
    <?php if ($type === 'list' || $type === 'both'): ?>
    <!-- 参加者リスト表示 -->
    <div class="lt-participants-list">
        <h3 class="lt-section-title">
            👥 参加者一覧 (<?php echo esc_html($total_participants); ?>名)
        </h3>
        
        <?php if (empty($participants_list)): ?>
            <div class="lt-alert lt-alert-info">
                まだ参加者がいません。最初の参加者になりませんか？
            </div>
        <?php else: ?>
            
            <!-- 参加者タイプ別のタブ -->
            <div class="lt-tabs">
                <div class="lt-tab-buttons">
                    <button class="lt-tab-button active" data-tab="all">
                        全員 (<?php echo esc_html($total_participants); ?>)
                    </button>
                    <button class="lt-tab-button" data-tab="listeners">
                        👂 リスナー (<?php echo esc_html($listener_count); ?>)
                    </button>
                    <button class="lt-tab-button" data-tab="speakers">
                        🎤 スピーカー (<?php echo esc_html($speaker_count); ?>)
                    </button>
                </div>
                
                <!-- 全参加者 -->
                <div class="lt-tab-content active" data-tab-content="all">
                    <div class="lt-participants-grid">
                        <?php foreach ($participants_list as $participant): ?>
                            <div class="lt-participant-card" data-type="<?php echo esc_attr($participant['type']); ?>">
                                <div class="lt-participant-info">
                                    <div class="lt-participant-name">
                                        <?php echo esc_html($participant['name']); ?>
                                    </div>
                                    <div class="lt-participant-type">
                                        <?php 
                                        echo $participant['type'] === 'speaker' ? '🎤 スピーカー' : '👂 リスナー';
                                        ?>
                                    </div>
                                    <div class="lt-participant-date">
                                        登録: <?php echo esc_html(date('n/j', strtotime($participant['registration_date']))); ?>
                                    </div>
                                </div>
                                <?php if ($participant['status'] === 'pending'): ?>
                                    <div class="lt-participant-status pending">承認待ち</div>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- リスナーのみ -->
                <div class="lt-tab-content" data-tab-content="listeners">
                    <div class="lt-participants-grid">
                        <?php foreach ($participants_list as $participant): ?>
                            <?php if ($participant['type'] === 'listener'): ?>
                                <div class="lt-participant-card" data-type="listener">
                                    <div class="lt-participant-info">
                                        <div class="lt-participant-name">
                                            <?php echo esc_html($participant['name']); ?>
                                        </div>
                                        <div class="lt-participant-type">👂 リスナー</div>
                                        <div class="lt-participant-date">
                                            登録: <?php echo esc_html(date('n/j', strtotime($participant['registration_date']))); ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- スピーカーのみ -->
                <div class="lt-tab-content" data-tab-content="speakers">
                    <div class="lt-participants-grid">
                        <?php foreach ($participants_list as $participant): ?>
                            <?php if ($participant['type'] === 'speaker'): ?>
                                <div class="lt-participant-card" data-type="speaker">
                                    <div class="lt-participant-info">
                                        <div class="lt-participant-name">
                                            <?php echo esc_html($participant['name']); ?>
                                        </div>
                                        <div class="lt-participant-type">🎤 スピーカー</div>
                                        <div class="lt-participant-date">
                                            登録: <?php echo esc_html(date('n/j', strtotime($participant['registration_date']))); ?>
                                        </div>
                                    </div>
                                    
                                    <?php
                                    // スピーカーの発表トーク取得
                                    $talks = get_posts(array(
                                        'post_type' => 'lt_talk',
                                        'meta_query' => array(
                                            array('key' => 'event_id', 'value' => $event_id),
                                            array('key' => 'speaker_email', 'value' => $participant['email'])
                                        ),
                                        'posts_per_page' => 1
                                    ));
                                    
                                    if (!empty($talks)):
                                        $talk = $talks[0];
                                        $talk_title = $talk->post_title;
                                        $talk_category = wp_get_post_terms($talk->ID, 'talk_category');
                                    ?>
                                        <div class="lt-participant-talk">
                                            <div class="lt-talk-title">
                                                "<?php echo esc_html($talk_title); ?>"
                                            </div>
                                            <?php if (!empty($talk_category)): ?>
                                                <div class="lt-talk-category">
                                                    <?php echo esc_html($talk_category[0]->name); ?>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
            
        <?php endif; ?>
    </div>
    <?php endif; ?>
    
    <!-- リアルタイム更新通知 -->
    <div class="lt-realtime-notice">
        <small style="color: #666; font-size: 0.85rem;">
            📊 参加者数はリアルタイムで更新されます
        </small>
    </div>
    
</div>

<style>
/* 進捗バー */
.lt-count-progress {
    margin-top: 10px;
    width: 100%;
}

.lt-progress-bar {
    background: #e9ecef;
    border-radius: 10px;
    height: 8px;
    overflow: hidden;
    margin-bottom: 5px;
}

.lt-progress-fill {
    background: linear-gradient(90deg, var(--lt-primary), var(--lt-secondary));
    height: 100%;
    border-radius: 10px;
    transition: width 0.5s ease;
}

.lt-progress-text {
    text-align: center;
    font-size: 0.8rem;
    color: #666;
}

.lt-count-description {
    font-size: 0.8rem;
    color: #666;
    margin-top: 5px;
}

/* タブ */
.lt-tabs {
    margin-top: 30px;
}

.lt-tab-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid #dee2e6;
    overflow-x: auto;
}

.lt-tab-button {
    padding: 10px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.95rem;
}

.lt-tab-button:hover {
    background: rgba(102, 126, 234, 0.1);
}

.lt-tab-button.active {
    border-bottom-color: var(--lt-primary);
    color: var(--lt-primary);
    font-weight: 600;
}

.lt-tab-content {
    display: none;
}

.lt-tab-content.active {
    display: block;
}

/* 参加者グリッド */
.lt-participants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
}

.lt-participant-card {
    background: var(--lt-white);
    border: 1px solid #dee2e6;
    border-radius: var(--lt-border-radius);
    padding: 15px;
    transition: all 0.3s ease;
    position: relative;
}

.lt-participant-card:hover {
    box-shadow: var(--lt-box-shadow);
    transform: translateY(-2px);
}

.lt-participant-card[data-type="speaker"] {
    border-left: 4px solid #ff6b6b;
}

.lt-participant-card[data-type="listener"] {
    border-left: 4px solid #4ecdc4;
}

.lt-participant-name {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--lt-dark);
    margin-bottom: 5px;
}

.lt-participant-type {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 5px;
}

.lt-participant-date {
    font-size: 0.8rem;
    color: #999;
}

.lt-participant-talk {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #eee;
}

.lt-talk-title {
    font-size: 0.9rem;
    font-style: italic;
    color: var(--lt-primary);
    margin-bottom: 5px;
}

.lt-talk-category {
    background: rgba(102, 126, 234, 0.1);
    color: var(--lt-primary);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    display: inline-block;
}

.lt-participant-status {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
}

.lt-participant-status.pending {
    background: #fff3cd;
    color: #856404;
}

.lt-section-title {
    color: var(--lt-dark);
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--lt-primary);
}

.lt-realtime-notice {
    text-align: center;
    margin-top: 20px;
    padding: 10px;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 5px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .lt-participants-grid {
        grid-template-columns: 1fr;
    }
    
    .lt-tab-buttons {
        flex-direction: column;
    }
    
    .lt-tab-button {
        text-align: left;
    }
}

/* アニメーション */
.lt-participant-card {
    animation: fadeInUp 0.5s ease-out;
}

.lt-participant-card:nth-child(odd) {
    animation-delay: 0.1s;
}

.lt-participant-card:nth-child(even) {
    animation-delay: 0.2s;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 空状態 */
.lt-participants-grid:empty::after {
    content: "まだ参加者がいません";
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #999;
    font-style: italic;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // タブ切り替え
    const tabButtons = document.querySelectorAll('.lt-tab-button');
    const tabContents = document.querySelectorAll('.lt-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // すべてのタブボタンとコンテンツからactiveクラスを削除
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 選択されたタブにactiveクラスを追加
            button.classList.add('active');
            document.querySelector(`[data-tab-content="${tabId}"]`).classList.add('active');
        });
    });
    
    // カードのホバーエフェクト
    const participantCards = document.querySelectorAll('.lt-participant-card');
    participantCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--lt-primary)';
        });
        
        card.addEventListener('mouseleave', () => {
            const type = card.getAttribute('data-type');
            card.style.borderColor = type === 'speaker' ? '#ff6b6b' : '#4ecdc4';
        });
    });
});
</script>