<?php
/**
 * Single Event Template - Lightning Talk Event
 * Lightning Talkイベント詳細ページテンプレート
 */

get_header(); ?>

<div class="lightningtalk-container">
    <div class="lt-event-detail">
        
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                
                <!-- イベントヘッダー -->
                <header class="lt-event-header">
                    <h1 class="event-title"><?php the_title(); ?></h1>
                    
                    <?php 
                    $event_date = get_post_meta(get_the_ID(), 'event_date', true);
                    $venue_name = get_post_meta(get_the_ID(), 'venue_name', true);
                    $event_status = get_post_meta(get_the_ID(), 'event_status', true);
                    ?>
                    
                    <div class="event-meta">
                        <?php if ($event_date) : ?>
                            <div class="event-date">
                                📅 <?php echo esc_html(lightningtalk_format_event_date($event_date)); ?>
                            </div>
                        <?php endif; ?>
                        
                        <?php if ($venue_name) : ?>
                            <div class="event-venue">
                                📍 <?php echo esc_html($venue_name); ?>
                            </div>
                        <?php endif; ?>
                        
                        <?php if ($event_status) : ?>
                            <div class="event-status status-<?php echo esc_attr($event_status); ?>">
                                <?php echo esc_html(lightningtalk_get_status_label($event_status)); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </header>

                <!-- イベント詳細表示 -->
                <section class="lt-event-content">
                    <?php echo do_shortcode('[lightning_talk_event id="' . get_the_ID() . '" show="all"]'); ?>
                </section>

                <!-- イベント説明 -->
                <?php if (get_the_content()) : ?>
                    <section class="event-description">
                        <h2>📝 イベント詳細</h2>
                        <div class="description-content">
                            <?php the_content(); ?>
                        </div>
                    </section>
                <?php endif; ?>

                <!-- 発表一覧 -->
                <section class="event-talks">
                    <h2>🎤 発表一覧</h2>
                    <?php 
                    $talks = get_posts(array(
                        'post_type' => 'lt_talk',
                        'post_status' => 'publish',
                        'numberposts' => -1,
                        'meta_query' => array(
                            array(
                                'key' => 'event_id',
                                'value' => get_the_ID(),
                                'compare' => '='
                            )
                        )
                    ));
                    
                    if ($talks) : ?>
                        <div class="talks-grid">
                            <?php foreach ($talks as $talk) : ?>
                                <div class="talk-card">
                                    <h3><?php echo esc_html($talk->post_title); ?></h3>
                                    
                                    <?php 
                                    $speaker = get_post_meta($talk->ID, 'speaker_name', true);
                                    $category = get_post_meta($talk->ID, 'category', true);
                                    $duration = get_post_meta($talk->ID, 'duration', true) ?: '5';
                                    ?>
                                    
                                    <?php if ($speaker) : ?>
                                        <p class="talk-speaker">🎤 <?php echo esc_html($speaker); ?></p>
                                    <?php endif; ?>
                                    
                                    <?php if ($category) : ?>
                                        <p class="talk-category">
                                            <?php echo lightningtalk_get_category_icon($category); ?> 
                                            <?php echo esc_html(lightningtalk_get_category_name($category)); ?>
                                        </p>
                                    <?php endif; ?>
                                    
                                    <p class="talk-duration">⏱️ <?php echo esc_html($duration); ?>分</p>
                                    
                                    <?php if ($talk->post_content) : ?>
                                        <div class="talk-description">
                                            <?php echo wp_kses_post(wp_trim_words($talk->post_content, 30)); ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else : ?>
                        <p class="no-talks">まだ発表が登録されていません。</p>
                        <?php echo do_shortcode('[lightning_talk_button type="register-speaker" text="🎤 発表申込み"]'); ?>
                    <?php endif; ?>
                </section>

                <!-- 参加者情報 -->
                <section class="event-participants">
                    <h2>👥 参加者情報</h2>
                    <?php echo do_shortcode('[lightning_talk_participants event_id="' . get_the_ID() . '" show="types"]'); ?>
                </section>

                <!-- 参加アンケート -->
                <section class="event-survey">
                    <?php echo do_shortcode('[lightning_talk_survey event_id="' . get_the_ID() . '"]'); ?>
                </section>

                <!-- イベントナビゲーション -->
                <nav class="event-navigation">
                    <?php
                    $prev_event = get_previous_post_link('%link', '← 前のイベント', true, '', 'lt_event');
                    $next_event = get_next_post_link('%link', '次のイベント →', true, '', 'lt_event');
                    
                    if ($prev_event || $next_event) : ?>
                        <div class="nav-links">
                            <div class="nav-previous"><?php echo $prev_event; ?></div>
                            <div class="nav-next"><?php echo $next_event; ?></div>
                        </div>
                    <?php endif; ?>
                </nav>

            <?php endwhile; ?>
        <?php endif; ?>

        <!-- 登録モーダル -->
        <div id="registerModal" class="lt-modal">
            <div class="lt-modal-content">
                <span class="lt-close">&times;</span>
                <div id="modalBody"></div>
            </div>
        </div>

    </div>
</div>

<!-- イベント詳細ページ専用スタイル -->
<style>
.lt-event-detail {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.lt-event-header {
    text-align: center;
    margin-bottom: 50px;
    padding: 40px 0;
    border-bottom: 3px solid #FFD700;
}

.event-title {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 20px;
}

.event-meta {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
    margin-top: 20px;
}

.event-date,
.event-venue {
    font-size: 1.2rem;
    color: #666;
    font-weight: 500;
}

.event-status {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.9rem;
}

.status-upcoming {
    background: #e3f2fd;
    color: #1976d2;
}

.status-ongoing {
    background: #e8f5e8;
    color: #2e7d32;
}

.status-completed {
    background: #f3e5f5;
    color: #7b1fa2;
}

.status-cancelled {
    background: #ffebee;
    color: #c62828;
}

.lt-event-content {
    margin-bottom: 50px;
}

.event-description {
    margin-bottom: 50px;
    padding: 30px;
    background: #f8f9fa;
    border-radius: 15px;
}

.event-description h2 {
    color: #333;
    margin-bottom: 20px;
}

.event-talks {
    margin-bottom: 50px;
}

.event-talks h2 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
}

.talks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.talk-card {
    background: #fff;
    padding: 25px;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    border: 2px solid #e1e1e1;
    transition: all 0.3s ease;
}

.talk-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    border-color: #FFD700;
}

.talk-card h3 {
    color: #333;
    margin-bottom: 15px;
    font-size: 1.2rem;
}

.talk-speaker,
.talk-category,
.talk-duration {
    margin-bottom: 8px;
    color: #666;
    font-size: 0.95rem;
}

.talk-description {
    margin-top: 15px;
    color: #555;
    line-height: 1.6;
}

.no-talks {
    text-align: center;
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 20px;
}

.event-participants,
.event-survey {
    margin-bottom: 50px;
}

.event-participants h2,
.event-survey h2 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
}

.event-navigation {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 2px solid #e1e1e1;
}

.nav-links {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-previous,
.nav-next {
    flex: 1;
}

.nav-next {
    text-align: right;
}

.nav-links a {
    color: #0073aa;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-links a:hover {
    color: #FF6B6B;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .event-title {
        font-size: 2rem;
    }
    
    .event-meta {
        flex-direction: column;
        gap: 15px;
    }
    
    .talks-grid {
        grid-template-columns: 1fr;
    }
    
    .nav-links {
        flex-direction: column;
        gap: 20px;
    }
    
    .nav-next {
        text-align: center;
    }
}
</style>

<?php get_footer(); ?>

<?php
/**
 * ヘルパー関数: イベントステータスラベル取得
 */
function lightningtalk_get_status_label($status) {
    $labels = array(
        'upcoming' => '開催予定',
        'ongoing' => '開催中',
        'completed' => '開催済み',
        'cancelled' => '中止'
    );
    
    return $labels[$status] ?? '未定';
}
?>