<?php
/**
 * 統計表示ショートコードテンプレート
 * 
 * @package Lightning_Talk_Pro_Theme
 * @version 1.1.0
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

// デフォルト値
$defaults = array(
    'type' => 'all',
    'format' => 'grid',
    'class' => ''
);

$args = wp_parse_args($args, $defaults);

// 統計データの取得
$total_events = wp_count_posts('lt_event');
$total_participants = wp_count_posts('lt_participant');
$total_talks = wp_count_posts('lt_talk');

$event_count = isset($total_events->publish) ? $total_events->publish : 0;
$participant_count = isset($total_participants->publish) ? $total_participants->publish : 0;
$talk_count = isset($total_talks->publish) ? $total_talks->publish : 0;

// 今月のイベント数
$current_month = date('Y-m');
$monthly_events = get_posts(array(
    'post_type' => 'lt_event',
    'meta_query' => array(
        array(
            'key' => 'event_date',
            'value' => $current_month,
            'compare' => 'LIKE'
        )
    ),
    'posts_per_page' => -1,
    'fields' => 'ids'
));

$monthly_count = count($monthly_events);
?>

<div class="lt-stats-display lt-stats-<?php echo esc_attr($args['format']); ?> <?php echo esc_attr($args['class']); ?>">
    
    <?php if ($args['type'] === 'all' || $args['type'] === 'hero') : ?>
        
        <?php if ($args['format'] === 'hero') : ?>
            <!-- ヒーローセクション用 -->
            <div class="hero-stats-grid">
                <div class="hero-stat-item">
                    <span class="hero-stat-number"><?php echo number_format($event_count); ?></span>
                    <span class="hero-stat-label">開催イベント</span>
                </div>
                <div class="hero-stat-item">
                    <span class="hero-stat-number"><?php echo number_format($participant_count); ?></span>
                    <span class="hero-stat-label">参加者数</span>
                </div>
                <div class="hero-stat-item">
                    <span class="hero-stat-number"><?php echo number_format($talk_count); ?></span>
                    <span class="hero-stat-label">発表数</span>
                </div>
            </div>
            
        <?php else : ?>
            <!-- 通常のグリッド表示 -->
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-icon">📅</div>
                    <div class="stat-number" data-target="<?php echo $event_count; ?>">0</div>
                    <div class="stat-label">開催イベント数</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">👥</div>
                    <div class="stat-number" data-target="<?php echo $participant_count; ?>">0</div>
                    <div class="stat-label">延べ参加者数</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">💡</div>
                    <div class="stat-number" data-target="<?php echo $talk_count; ?>">0</div>
                    <div class="stat-label">発表総数</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-icon">📊</div>
                    <div class="stat-number" data-target="<?php echo $monthly_count; ?>">0</div>
                    <div class="stat-label">今月のイベント</div>
                </div>
            </div>
        <?php endif; ?>
        
    <?php elseif ($args['type'] === 'simple') : ?>
        <!-- シンプル表示 -->
        <div class="stats-simple">
            <span class="stat-simple-item">
                <strong><?php echo number_format($event_count); ?></strong> イベント開催
            </span>
            <span class="stat-simple-item">
                <strong><?php echo number_format($participant_count); ?></strong> 名参加
            </span>
            <span class="stat-simple-item">
                <strong><?php echo number_format($talk_count); ?></strong> 件発表
            </span>
        </div>
        
    <?php endif; ?>
    
</div>

<style>
/* ヒーロー用統計スタイル */
.hero-stats-grid {
    display: flex;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
}

.hero-stat-item {
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
}

.hero-stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 900;
    color: #ffd700;
    margin-bottom: 5px;
}

.hero-stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
}

/* シンプル統計スタイル */
.stats-simple {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 0.9rem;
    color: #666;
}

.stat-simple-item strong {
    color: var(--lt-primary);
    font-size: 1.1rem;
}

/* レスポンシブ */
@media (max-width: 768px) {
    .hero-stats-grid {
        gap: 20px;
    }
    
    .hero-stat-number {
        font-size: 1.5rem;
    }
    
    .stats-simple {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
}
</style>