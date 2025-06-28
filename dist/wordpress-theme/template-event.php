<?php
/*
Template Name: Event Page Template
*/
?>

<?php get_header(); ?>

<main class="lt-main">
    <?php while (have_posts()) : the_post(); ?>
        <article class="lt-event-page">
            <!-- Lightning Hero Section -->
            <section class="lt-hero">
                <div class="lt-container">
                    <h1><?php the_title(); ?></h1>
                    <?php if (get_the_excerpt()) : ?>
                        <p class="lt-hero-tagline"><?php echo get_the_excerpt(); ?></p>
                    <?php endif; ?>
                </div>
            </section>

            <!-- Event Content -->
            <section class="lt-section">
                <div class="lt-container">
                    <div class="lt-event-card">
                        <?php the_content(); ?>
                    </div>
                </div>
            </section>

            <!-- Event Meta Information -->
            <?php
            $event_date = get_post_meta(get_the_ID(), 'event_date', true);
            $event_venue = get_post_meta(get_the_ID(), 'event_venue', true);
            $event_capacity = get_post_meta(get_the_ID(), 'event_capacity', true);
            $online_url = get_post_meta(get_the_ID(), 'online_url', true);
            
            if ($event_date || $event_venue || $event_capacity || $online_url) : ?>
                <section class="lt-section" style="background-color: #f9fafb">
                    <div class="lt-container">
                        <div class="lt-event-card">
                            <h2 class="lt-text-center">イベント詳細</h2>
                            <div class="lt-event-details">
                                <?php if ($event_date) : ?>
                                    <div class="lt-detail-item">
                                        <span class="lt-detail-icon">📅</span>
                                        <div class="lt-detail-content">
                                            <h4>開催日時</h4>
                                            <p><?php echo esc_html($event_date); ?></p>
                                        </div>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if ($event_venue) : ?>
                                    <div class="lt-detail-item">
                                        <span class="lt-detail-icon">📍</span>
                                        <div class="lt-detail-content">
                                            <h4>会場</h4>
                                            <p><?php echo esc_html($event_venue); ?></p>
                                        </div>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if ($event_capacity) : ?>
                                    <div class="lt-detail-item">
                                        <span class="lt-detail-icon">👥</span>
                                        <div class="lt-detail-content">
                                            <h4>定員</h4>
                                            <p><?php echo esc_html($event_capacity); ?></p>
                                        </div>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if ($online_url) : ?>
                                    <div class="lt-detail-item">
                                        <span class="lt-detail-icon">💻</span>
                                        <div class="lt-detail-content">
                                            <h4>オンライン参加</h4>
                                            <a href="<?php echo esc_url($online_url); ?>" target="_blank" class="lt-button lt-button-secondary">
                                                参加する
                                            </a>
                                        </div>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </section>
            <?php endif; ?>

            <!-- Registration CTA -->
            <section class="lt-section">
                <div class="lt-container">
                    <div class="lt-event-card lt-text-center">
                        <h2>参加登録</h2>
                        <p style="font-size: 1.125rem; margin-bottom: var(--lt-space-lg);">
                            このイベントに参加しませんか？
                        </p>
                        <a href="<?php echo get_permalink(get_page_by_title('Registration')); ?>" class="lt-button lt-button-primary lt-lightning-effect">
                            今すぐ参加登録
                        </a>
                    </div>
                </div>
            </section>
        </article>
    <?php endwhile; ?>
</main>

<?php get_footer(); ?>