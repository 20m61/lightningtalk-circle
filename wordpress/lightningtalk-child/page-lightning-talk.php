<?php
/**
 * Template Name: Lightning Talk Event Page
 * Lightning Talkイベント専用ページテンプレート
 */

get_header(); ?>

<div class="lightningtalk-container">
    <div class="lt-main-content">
        
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                
                <!-- ページタイトルとコンテンツ -->
                <div class="lt-page-header">
                    <h1 class="page-title"><?php the_title(); ?></h1>
                    <?php if (get_the_content()) : ?>
                        <div class="page-content">
                            <?php the_content(); ?>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Lightning Talkイベント表示 -->
                <section class="lt-event-section">
                    <?php 
                    // デフォルトイベントIDを取得
                    $default_event_id = get_theme_mod('lightningtalk_default_event_id', 1);
                    echo do_shortcode('[lightning_talk_event id="' . $default_event_id . '" show="all"]');
                    ?>
                </section>

                <!-- 参加アンケート -->
                <section class="lt-survey-wrapper">
                    <?php echo do_shortcode('[lightning_talk_survey event_id="' . $default_event_id . '"]'); ?>
                </section>

                <!-- 発表一覧 -->
                <section class="lt-talks-wrapper">
                    <h2>📋 発表一覧</h2>
                    <?php echo do_shortcode('[lightning_talk_talks event_id="' . $default_event_id . '" limit="20"]'); ?>
                </section>

                <!-- 参加者数表示 -->
                <section class="lt-participants-wrapper">
                    <h2>👥 参加者状況</h2>
                    <?php echo do_shortcode('[lightning_talk_participants event_id="' . $default_event_id . '" show="count"]'); ?>
                </section>

            <?php endwhile; ?>
        <?php else : ?>
            
            <!-- コンテンツがない場合のデフォルト表示 -->
            <div class="lt-page-header">
                <h1>⚡ なんでもライトニングトーク</h1>
                <p>5分間で世界を変える！あなたの「なんでも」を聞かせて！</p>
            </div>

            <!-- デフォルトイベント表示 -->
            <section class="lt-event-section">
                <?php echo do_shortcode('[lightning_talk_event show="all"]'); ?>
            </section>

            <!-- デフォルトアンケート -->
            <section class="lt-survey-wrapper">
                <?php echo do_shortcode('[lightning_talk_survey]'); ?>
            </section>

        <?php endif; ?>

        <!-- 登録モーダル -->
        <div id="registerModal" class="lt-modal">
            <div class="lt-modal-content">
                <span class="lt-close">&times;</span>
                <div id="modalBody"></div>
            </div>
        </div>

        <!-- WordPress コメント表示（オプション） -->
        <?php if (comments_open() || get_comments_number()) : ?>
            <div class="lt-comments-wrapper">
                <?php comments_template(); ?>
            </div>
        <?php endif; ?>

    </div>
</div>

<!-- 追加のインラインスタイル -->
<style>
.lt-page-header {
    text-align: center;
    margin-bottom: 50px;
    padding: 40px 0;
}

.lt-page-header h1 {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 20px;
}

.lt-event-section {
    margin-bottom: 50px;
}

.lt-survey-wrapper,
.lt-talks-wrapper,
.lt-participants-wrapper {
    margin-bottom: 50px;
}

.lt-survey-wrapper h2,
.lt-talks-wrapper h2,
.lt-participants-wrapper h2 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
    font-size: 2rem;
}

.lt-comments-wrapper {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 2px solid #e1e1e1;
}

/* Cocoonテーマとの調和 */
.theme-cocoon .lt-main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .lt-page-header h1 {
        font-size: 2rem;
    }
    
    .lt-survey-wrapper h2,
    .lt-talks-wrapper h2,
    .lt-participants-wrapper h2 {
        font-size: 1.5rem;
    }
}
</style>

<!-- WordPress固有のJavaScript設定 -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // WordPress環境設定をJavaScriptに渡す
    if (typeof window.lightningtalk_ajax !== 'undefined') {
        window.LightningTalkConfig = {
            apiUrl: window.lightningtalk_ajax.api_base,
            nonce: window.lightningtalk_ajax.nonce,
            defaultEventId: <?php echo json_encode(get_theme_mod('lightningtalk_default_event_id', 1)); ?>,
            translations: window.lightningtalk_ajax.translations || {}
        };
    }
    
    console.log('⚡ Lightning Talk WordPress ページテンプレート読み込み完了');
});
</script>

<?php get_footer(); ?>