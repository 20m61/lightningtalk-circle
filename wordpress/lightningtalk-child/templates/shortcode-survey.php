<?php
/**
 * Survey Shortcode Template
 * 
 * Available variables:
 * $atts - shortcode attributes
 */

// セキュリティチェック
if (!defined('ABSPATH')) {
    exit;
}

$event_id = !empty($atts['event_id']) ? intval($atts['event_id']) : get_the_ID();

if (!$event_id) {
    return '<p class="lt-alert lt-alert-warning">イベントIDが指定されていません。</p>';
}

// 調査結果の取得
$survey_counts = lightningtalk_get_survey_counts($event_id);

// ユーザーが既に投票済みかチェック（サーバーサイド）
$user_ip = $_SERVER['REMOTE_ADDR'];
$existing_vote = get_posts(array(
    'post_type' => 'lt_survey_response',
    'meta_query' => array(
        array('key' => 'event_id', 'value' => $event_id),
        array('key' => 'voter_ip', 'value' => $user_ip)
    ),
    'posts_per_page' => 1,
    'fields' => 'ids'
));

$has_voted = !empty($existing_vote);
$total_votes = $survey_counts['total'];
?>

<div class="lightning-talk-container">
    <div class="lt-survey" data-event-id="<?php echo esc_attr($event_id); ?>">
        <h3 class="lt-survey-title">
            📊 参加形式についてお聞かせください
        </h3>
        
        <?php if (!$has_voted): ?>
            <p class="lt-text-center" style="color: #666; margin-bottom: 20px;">
                あなたはこのイベントにどのような形で参加したいですか？
            </p>
        <?php else: ?>
            <p class="lt-text-center lt-alert lt-alert-info">
                ご投票ありがとうございました！現在の結果をご覧ください。
            </p>
        <?php endif; ?>
        
        <div class="lt-survey-options">
            <div class="lt-survey-option" data-vote-type="online" <?php echo $has_voted ? 'style="cursor: default;"' : ''; ?>>
                <div class="lt-survey-option-title">💻 オンライン参加</div>
                <div class="lt-survey-option-count"><?php echo esc_html($survey_counts['online']); ?></div>
                <div style="font-size: 0.9rem; color: #666;">
                    リモートで参加
                </div>
            </div>
            
            <div class="lt-survey-option" data-vote-type="offline" <?php echo $has_voted ? 'style="cursor: default;"' : ''; ?>>
                <div class="lt-survey-option-title">🏢 会場参加</div>
                <div class="lt-survey-option-count"><?php echo esc_html($survey_counts['offline']); ?></div>
                <div style="font-size: 0.9rem; color: #666;">
                    会場で直接参加
                </div>
            </div>
        </div>
        
        <div class="lt-survey-results">
            <div class="lt-text-center">
                <strong>総投票数: <span class="lt-survey-total"><?php echo esc_html($total_votes); ?></span>票</strong>
            </div>
            
            <?php if ($total_votes > 0): ?>
                <div style="margin-top: 15px;">
                    <?php 
                    $online_percentage = $total_votes > 0 ? round(($survey_counts['online'] / $total_votes) * 100, 1) : 0;
                    $offline_percentage = $total_votes > 0 ? round(($survey_counts['offline'] / $total_votes) * 100, 1) : 0;
                    ?>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>💻 オンライン</span>
                            <span><?php echo esc_html($online_percentage); ?>%</span>
                        </div>
                        <div style="background: #e9ecef; border-radius: 10px; height: 8px;">
                            <div style="background: linear-gradient(90deg, var(--lt-primary), var(--lt-secondary)); height: 100%; border-radius: 10px; width: <?php echo esc_attr($online_percentage); ?>%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>🏢 会場参加</span>
                            <span><?php echo esc_html($offline_percentage); ?>%</span>
                        </div>
                        <div style="background: #e9ecef; border-radius: 10px; height: 8px;">
                            <div style="background: linear-gradient(90deg, var(--lt-secondary), var(--lt-primary)); height: 100%; border-radius: 10px; width: <?php echo esc_attr($offline_percentage); ?>%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        
        <?php if (!$has_voted): ?>
            <div class="lt-text-center" style="margin-top: 15px; font-size: 0.9rem; color: #666;">
                ※ 投票は1回のみ可能です。結果はリアルタイムで更新されます。
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
// ページロード時に既投票チェック（localStorage）
document.addEventListener('DOMContentLoaded', function() {
    const eventId = <?php echo json_encode($event_id); ?>;
    const voteKey = `lt_vote_${eventId}`;
    const storedVote = localStorage.getItem(voteKey);
    
    if (storedVote) {
        // 既投票の場合、選択状態を表示
        const selectedOption = document.querySelector(`[data-vote-type="${storedVote}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // 投票オプションを無効化
        document.querySelectorAll('.lt-survey-option').forEach(option => {
            option.style.cursor = 'default';
            option.style.pointerEvents = 'none';
        });
    }
});
</script>

<style>
.lt-survey-option {
    position: relative;
    overflow: hidden;
}

.lt-survey-option::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
}

.lt-survey-option:hover::before {
    left: 100%;
}

.lt-survey-option.selected {
    border-color: var(--lt-primary);
    background: rgba(102, 126, 234, 0.1);
    transform: scale(1.02);
}

.lt-survey-option.selected .lt-survey-option-count {
    color: var(--lt-primary);
    font-size: 2.2rem;
}

.lt-survey-results {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* パルス効果 */
.lt-survey-option-count {
    transition: all 0.3s ease;
}

.lt-survey-option:hover .lt-survey-option-count {
    transform: scale(1.1);
}

/* 投票後のエフェクト */
.vote-success {
    animation: voteSuccess 0.6s ease-out;
}

@keyframes voteSuccess {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
    100% { transform: scale(1); }
}
</style>